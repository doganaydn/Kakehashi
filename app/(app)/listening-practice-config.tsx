import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  EXTRA_STUDY_CONFIG_STORAGE_KEYS,
  clampNumber,
  loadExtraStudyConfig,
  normalizeLevelRange,
  pickBoolean,
  saveExtraStudyConfig,
} from "../../src/utils/extraStudyConfigPersistence";
import {
  EXTRA_STUDY_SESSION_STORAGE_KEYS,
  clearExtraStudySessionState,
  hasExtraStudySessionState,
} from "../../src/utils/extraStudySessionPersistence";
import SubjectListsFilterCard from "../../src/components/SubjectListsFilterCard";
import SrsLevelIcon from "../../src/components/SrsLevelIcon";
import KeyboardManager, {
  JAPANESE_KEYBOARD_SETUP_INSTRUCTIONS,
} from "../../src/modules/KeyboardManager";
import type { ListeningSolutionMode } from "../../src/types/listening";
import { consumePendingAnimeSelection } from "../../src/utils/animeSelectionBridge";
import { parseSelectedListIds } from "../../src/utils/extraStudySubjectLists";
import { useAuthStore, useSettingsStore } from "../../src/utils/store";
import { useTheme } from "../../src/utils/theme";

// Keys for AsyncStorage (for non-store settings that are session-config level)
// Note: listeningAutoPlayAudio is persisted via the Zustand settings store

interface Config {
  includeVocabulary: boolean;
  includeKanaVocabulary: boolean;
  solutionMode: ListeningSolutionMode;
  numberOfQuestions: number;
  srsGroups: {
    apprentice: boolean;
    guru: boolean;
    master: boolean;
    enlightened: boolean;
    burned: boolean;
  };
  useCustomLevelRange: boolean;
  minLevel: number;
  maxLevel: number;
  sessionAnimes: string[] | null; // null = use global settings
  selectedListIds: string[];
}

const createDefaultConfig = (
  userLevel: number,
  immersionKitAnimes: string[] | null | undefined,
): Config => ({
  includeVocabulary: true,
  includeKanaVocabulary: false,
  solutionMode: "multiple_choice",
  numberOfQuestions: 10,
  srsGroups: {
    apprentice: true,
    guru: true,
    master: true,
    enlightened: true,
    burned: false,
  },
  useCustomLevelRange: false,
  minLevel: 1,
  maxLevel: userLevel,
  sessionAnimes: immersionKitAnimes ?? [],
  selectedListIds: [],
});

const sanitizeSessionAnimes = (
  rawSessionAnimes: unknown,
  fallback: string[] | null,
): string[] | null => {
  if (rawSessionAnimes === null) {
    return null;
  }

  if (Array.isArray(rawSessionAnimes)) {
    return rawSessionAnimes.filter((item): item is string => typeof item === "string");
  }

  return fallback;
};

const sanitizeConfig = (
  rawConfig: Partial<Config>,
  userLevel: number,
  immersionKitAnimes: string[] | null | undefined,
): Config => {
  const defaults = createDefaultConfig(userLevel, immersionKitAnimes);
  const srsGroups = rawConfig.srsGroups ?? defaults.srsGroups;
  const { minLevel, maxLevel } = normalizeLevelRange(
    rawConfig.minLevel,
    rawConfig.maxLevel,
    userLevel,
  );

  return {
    includeVocabulary: pickBoolean(
      rawConfig.includeVocabulary,
      defaults.includeVocabulary,
    ),
    includeKanaVocabulary: pickBoolean(
      rawConfig.includeKanaVocabulary,
      defaults.includeKanaVocabulary,
    ),
    solutionMode:
      rawConfig.solutionMode === "writing" ? "writing" : "multiple_choice",
    numberOfQuestions: clampNumber(
      rawConfig.numberOfQuestions,
      5,
      20,
      defaults.numberOfQuestions,
      5,
    ),
    srsGroups: {
      apprentice: pickBoolean(
        srsGroups.apprentice,
        defaults.srsGroups.apprentice,
      ),
      guru: pickBoolean(srsGroups.guru, defaults.srsGroups.guru),
      master: pickBoolean(srsGroups.master, defaults.srsGroups.master),
      enlightened: pickBoolean(
        srsGroups.enlightened,
        defaults.srsGroups.enlightened,
      ),
      burned: pickBoolean(srsGroups.burned, defaults.srsGroups.burned),
    },
    useCustomLevelRange: pickBoolean(
      rawConfig.useCustomLevelRange,
      defaults.useCustomLevelRange,
    ),
    minLevel,
    maxLevel,
    sessionAnimes: sanitizeSessionAnimes(
      rawConfig.sessionAnimes,
      defaults.sessionAnimes,
    ),
    selectedListIds: parseSelectedListIds(rawConfig.selectedListIds),
  };
};

export default function ListeningPracticeConfigScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const { userData } = useAuthStore();
  const {
    immersionKitAnimes,
    listeningAutoPlayAudio,
    setListeningAutoPlayAudio,
    autoSwitchKeyboard,
    setAutoSwitchKeyboard,
  } = useSettingsStore();
  const userLevel = userData?.level ?? 60;
  const [config, setConfig] = useState<Config>(() =>
    createDefaultConfig(userLevel, immersionKitAnimes),
  );
  const [isConfigHydrated, setIsConfigHydrated] = useState(false);
  const [hasLoadedPersistedConfig, setHasLoadedPersistedConfig] = useState(false);
  const initialUserLevelRef = useRef(userLevel);
  const initialImmersionKitAnimesRef = useRef(immersionKitAnimes);
  const hasCheckedForResumableSessionRef = useRef(false);

  // Listen for anime selection updates when returning from anime selector
  useFocusEffect(
    useCallback(() => {
      const pendingSelection = consumePendingAnimeSelection();
      if (pendingSelection !== null) {
        setConfig((prev) => ({ ...prev, sessionAnimes: pendingSelection }));
      }
    }, [])
  );

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      const stored = await loadExtraStudyConfig<Config>(
        EXTRA_STUDY_CONFIG_STORAGE_KEYS.LISTENING_PRACTICE,
      );
      if (!isMounted) {
        return;
      }

      if (stored) {
        setConfig(
          sanitizeConfig(
            stored,
            initialUserLevelRef.current,
            initialImmersionKitAnimesRef.current,
          ),
        );
        setHasLoadedPersistedConfig(true);
      }

      setIsConfigHydrated(true);
    };

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (hasCheckedForResumableSessionRef.current) {
      return;
    }
    hasCheckedForResumableSessionRef.current = true;

    let isMounted = true;
    const checkForSavedSession = async () => {
      const hasSavedSession = await hasExtraStudySessionState(
        EXTRA_STUDY_SESSION_STORAGE_KEYS.LISTENING_PRACTICE,
      );
      if (!hasSavedSession || !isMounted) {
        return;
      }

      Alert.alert(
        uiT("ui.resume_listening_practice_e7c58298"),
        uiT("ui.you_have_a_listening_practice_session_in_progress_d096be04"),
        [
          { text: uiT("ui.not_now_ccb4c324"), style: "cancel" },
          {
            text: uiT("ui.discard_eb1a70e3"),
            style: "destructive",
            onPress: () => {
              void clearExtraStudySessionState(
                EXTRA_STUDY_SESSION_STORAGE_KEYS.LISTENING_PRACTICE,
              );
            },
          },
          {
            text: uiT("ui.resume_d640c742"),
            onPress: () => {
              router.push({
                pathname: "/listening-practice-session",
                params: { resume: "true" },
              });
            },
          },
        ],
      );
    };

    void checkForSavedSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setConfig((prev) => sanitizeConfig(prev, userLevel, immersionKitAnimes));
  }, [immersionKitAnimes, userLevel]);

  useEffect(() => {
    if (hasLoadedPersistedConfig) {
      return;
    }

    if (!immersionKitAnimes || immersionKitAnimes.length === 0) {
      return;
    }

    setConfig((prev) => {
      if (prev.sessionAnimes === null || prev.sessionAnimes.length > 0) {
        return prev;
      }

      return { ...prev, sessionAnimes: immersionKitAnimes };
    });
  }, [hasLoadedPersistedConfig, immersionKitAnimes]);

  useEffect(() => {
    if (!isConfigHydrated) {
      return;
    }

    saveExtraStudyConfig(
      EXTRA_STUDY_CONFIG_STORAGE_KEYS.LISTENING_PRACTICE,
      config,
    );
  }, [config, isConfigHydrated]);

  const updateConfig = (key: keyof Config, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const canStart = () => {
    const hasSubjectTypes =
      config.includeVocabulary || config.includeKanaVocabulary;
    const srs = config.srsGroups || ({} as any);
    const hasAnySrs = Boolean(
      srs.apprentice || srs.guru || srs.master || srs.enlightened || srs.burned
    );
    // Check if there are selected animes (either session or global)
    const selectedAnimes = config.sessionAnimes || immersionKitAnimes || [];
    const hasAnimes = selectedAnimes.length > 0;
    const hasRequiredKeyboard =
      config.solutionMode !== "writing" || autoSwitchKeyboard;
    return hasSubjectTypes && hasAnySrs && hasAnimes && hasRequiredKeyboard;
  };

  const listCountTypes = useMemo(() => {
    const types: ("vocabulary" | "kana_vocabulary")[] = [];
    if (config.includeVocabulary) {
      types.push("vocabulary");
    }
    if (config.includeKanaVocabulary) {
      types.push("kana_vocabulary");
    }
    return types;
  }, [config.includeKanaVocabulary, config.includeVocabulary]);

  const start = async () => {
    if (!canStart()) {
      if (config.solutionMode === "writing" && !autoSwitchKeyboard) {
        Alert.alert(
          uiT("ui.japanese_keyboard_required_ecd8a724"),
          uiT("ui.enable_switch_to_japanese_keyboard_to_start_listening_writing_mod_b20845fb")
        );
      }
      return;
    }

    await clearExtraStudySessionState(
      EXTRA_STUDY_SESSION_STORAGE_KEYS.LISTENING_PRACTICE,
    );

    try {
      const sessionId = `listening_${Date.now()}`;
      await AsyncStorage.setItem(
        `listening_config_${sessionId}`,
        JSON.stringify(config)
      );

      router.replace({
        pathname: "/listening-practice-session",
        params: { sessionId },
      });
    } catch (error) {
      console.error("Failed to save listening practice config:", error);
      // Fallback: pass config as URL params
      router.replace({
        pathname: "/listening-practice-session",
        params: {
          includeVocabulary: config.includeVocabulary.toString(),
          includeKanaVocabulary: config.includeKanaVocabulary.toString(),
          solutionMode: config.solutionMode,
          numberOfQuestions: config.numberOfQuestions.toString(),
          srsApprentice: String(config.srsGroups.apprentice),
          srsGuru: String(config.srsGroups.guru),
          srsMaster: String(config.srsGroups.master),
          srsEnlightened: String(config.srsGroups.enlightened),
          srsBurned: String(config.srsGroups.burned),
          useCustomLevelRange: String(config.useCustomLevelRange),
          minLevel: String(config.minLevel),
          maxLevel: String(config.maxLevel),
          selectedListIds: config.selectedListIds.join(","),
          sessionAnimes: config.sessionAnimes
            ? JSON.stringify(config.sessionAnimes)
            : "",
        },
      });
    }
  };

  const handleKeyboardToggle = async (value: boolean) => {
    if (value && KeyboardManager) {
      const hasJapaneseKeyboard = await KeyboardManager.hasJapaneseKeyboard();
      if (!hasJapaneseKeyboard) {
        Alert.alert(
          uiT("ui.no_japanese_keyboard_ffbd52b8"),
          JAPANESE_KEYBOARD_SETUP_INSTRUCTIONS
        );
        return;
      }
    }

    setAutoSwitchKeyboard(value);
  };

  const srsChips = useMemo(
    () =>
      [
        { key: "apprentice", label: "Apprentice" },
        { key: "guru", label: "Guru" },
        { key: "master", label: "Master" },
        { key: "enlightened", label: "Enlightened" },
        { key: "burned", label: "Burned" },
      ] as const,
    []
  );

  // Animated expand for level range section
  const expandAnim = useRef(
    new Animated.Value(config.useCustomLevelRange ? 1 : 0)
  ).current;

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: config.useCustomLevelRange ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [config.useCustomLevelRange, expandAnim]);

  const handleCustomizeAnimes = () => {
    // Navigate to anime selector with current selection
    router.push({
      pathname: "/listening-anime-selector",
      params: {
        currentSelection: JSON.stringify(
          config.sessionAnimes || immersionKitAnimes || []
        ),
      },
    });
  };

  const selectedAnimes = config.sessionAnimes || [];

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <StatusBar style={theme.statusBarStyle} />

      <View style={[styles.header, { backgroundColor: theme.backgroundColor }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>
          {uiT("ui.listening_practice_a4e07133")} </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overview card */}
        <View
          style={[
            styles.sectionElevated,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <Ionicons
              name="headset-outline"
              size={18}
              color={theme.textSecondary}
            />
            <Text
              style={[styles.sectionHeaderText, { color: theme.textSecondary }]}
            >
              {uiT("ui.audio_comprehension_test_e727cbbe")} </Text>
          </View>
          <Text style={[styles.overviewTitle, { color: theme.textColor }]}>
            {uiT("ui.choose_subject_types_6d56c1e3")} </Text>
          <View style={styles.overviewChipsRow}>
            <TouchableOpacity
              style={[
                styles.overviewChip,
                {
                  borderColor: config.includeVocabulary
                    ? theme.primary
                    : theme.border,
                  backgroundColor: config.includeVocabulary
                    ? `${theme.primary}22`
                    : "transparent",
                },
              ]}
              onPress={() =>
                updateConfig("includeVocabulary", !config.includeVocabulary)
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="library"
                size={16}
                color={
                  config.includeVocabulary ? theme.primary : theme.textSecondary
                }
              />
              <Text
                style={[
                  styles.overviewChipText,
                  {
                    color: config.includeVocabulary
                      ? theme.primary
                      : theme.textSecondary,
                  },
                ]}
              >
                {uiT("ui.vocabulary_eebd90a0")} </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.overviewChip,
                {
                  borderColor: config.includeKanaVocabulary
                    ? theme.primary
                    : theme.border,
                  backgroundColor: config.includeKanaVocabulary
                    ? `${theme.primary}22`
                    : "transparent",
                },
              ]}
              onPress={() =>
                updateConfig(
                  "includeKanaVocabulary",
                  !config.includeKanaVocabulary
                )
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="text"
                size={16}
                color={
                  config.includeKanaVocabulary
                    ? theme.primary
                    : theme.textSecondary
                }
              />
              <Text
                style={[
                  styles.overviewChipText,
                  {
                    color: config.includeKanaVocabulary
                      ? theme.primary
                      : theme.textSecondary,
                  },
                ]}
              >
                {uiT("ui.kana_vocab_597d8c17")} </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Number of Questions */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.number_of_questions_e69db859")} </Text>
          <View style={[styles.sliderContainer]}>
            <Text style={[styles.sliderCount, { color: theme.textColor }]}>
              {config.numberOfQuestions}
            </Text>
            <Slider
              style={{ flex: 1, height: 40 }}
              minimumValue={5}
              maximumValue={20}
              step={5}
              value={config.numberOfQuestions}
              onValueChange={(v) =>
                updateConfig("numberOfQuestions", Math.round(v))
              }
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.primary}
            />
          </View>
        </View>

        {/* Answer Mode */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.answer_mode_c7728f17")} </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.textSecondary }]}
          >
            {uiT("ui.choose_whether_vocabulary_answers_are_multiple_choice_or_typed_e7ab6b0f")} </Text>
          <View style={styles.modeSelectorRow}>
            <TouchableOpacity
              style={[
                styles.modeOption,
                {
                  borderColor:
                    config.solutionMode === "multiple_choice"
                      ? theme.primary
                      : theme.border,
                  backgroundColor:
                    config.solutionMode === "multiple_choice"
                      ? `${theme.primary}22`
                      : "transparent",
                },
              ]}
              onPress={() => updateConfig("solutionMode", "multiple_choice")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid"
                size={16}
                color={
                  config.solutionMode === "multiple_choice"
                    ? theme.primary
                    : theme.textSecondary
                }
              />
              <Text
                style={[
                  styles.modeOptionText,
                  {
                    color:
                      config.solutionMode === "multiple_choice"
                        ? theme.primary
                        : theme.textColor,
                  },
                ]}
              >
                {uiT("ui.multiple_choice_987caef5")} </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeOption,
                {
                  borderColor:
                    config.solutionMode === "writing"
                      ? theme.primary
                      : theme.border,
                  backgroundColor:
                    config.solutionMode === "writing"
                      ? `${theme.primary}22`
                      : "transparent",
                },
              ]}
              onPress={() => updateConfig("solutionMode", "writing")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={
                  config.solutionMode === "writing"
                    ? theme.primary
                    : theme.textSecondary
                }
              />
              <Text
                style={[
                  styles.modeOptionText,
                  {
                    color:
                      config.solutionMode === "writing"
                        ? theme.primary
                        : theme.textColor,
                  },
                ]}
              >
                {uiT("ui.writing_a8bfae3e")} </Text>
            </TouchableOpacity>
          </View>

          {config.solutionMode === "writing" && (
            <>
              {KeyboardManager && (
                <View
                  style={[
                    styles.toggleRow,
                    {
                      borderColor: autoSwitchKeyboard ? theme.primary : theme.border,
                      backgroundColor: autoSwitchKeyboard
                        ? `${theme.primary}15`
                        : "transparent",
                      marginBottom: 6,
                    },
                  ]}
                >
                  <Text style={[styles.toggleText, { color: theme.textColor }]}>
                    {uiT("ui.switch_to_japanese_keyboard_3d31738e")} </Text>
                  <View style={{ flex: 1 }} />
                  <Switch
                    value={autoSwitchKeyboard}
                    onValueChange={handleKeyboardToggle}
                    trackColor={{ false: "#767577", true: theme.primary }}
                    thumbColor={"#f4f3f4"}
                  />
                </View>
              )}
              <Text
                style={[styles.sectionDescription, { color: theme.textSecondary }]}
              >
                {uiT("ui.writing_mode_requires_typing_the_exact_vocabulary_including_kanji_5152e967")} </Text>
              {!autoSwitchKeyboard && (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning" size={16} color="#ff9500" />
                  <Text style={styles.warningText}>
                    {uiT("ui.enable_japanese_keyboard_switching_to_use_writing_mode_d74cf8c6")} </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* SRS Stages */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.include_srs_stages_eb382d10")} </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.textSecondary }]}
          >
            {uiT("ui.choose_which_progression_stages_to_include_983f6d5c")} </Text>
          <View style={styles.chipsContainer}>
            {srsChips.map(({ key, label }) => {
              const selected = (config.srsGroups as any)[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.chip,
                    selected
                      ? {
                          backgroundColor: `${theme.primary}22`,
                          borderColor: theme.primary,
                        }
                      : {
                          backgroundColor: theme.isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.03)",
                          borderColor: theme.border,
                        },
                  ]}
                  onPress={() =>
                    setConfig((prev) => ({
                      ...prev,
                      srsGroups: {
                        ...prev.srsGroups,
                        [key]:
                          !prev.srsGroups[key as keyof typeof prev.srsGroups],
                      },
                    }))
                  }
                  activeOpacity={0.7}
                >
                  <SrsLevelIcon
                    level={label}
                    size={16}
                    color={selected ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      { color: selected ? theme.primary : theme.textColor },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Levels */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.levels_b1482131")} </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.textSecondary }]}
          >
            {uiT("ui.without_a_subject_list_includes_levels_1_to_your_level_0da23a7f")}{userLevel}{uiT("ui.selected_lists_can_include_any_level_enable_a_custom_range_to_re_3c17f945")} </Text>
          <View
            style={[
              styles.toggleRow,
              {
                borderColor: config.useCustomLevelRange
                  ? theme.secondary
                  : theme.border,
                backgroundColor: config.useCustomLevelRange
                  ? `${theme.secondary}15`
                  : "transparent",
              },
            ]}
          >
            <Text style={[styles.toggleText, { color: theme.textColor }]}>
              {uiT("ui.use_custom_level_range_fdb84cae")} </Text>
            <View style={{ flex: 1 }} />
            <Switch
              value={config.useCustomLevelRange}
              onValueChange={(v) => updateConfig("useCustomLevelRange", v)}
              trackColor={{ false: "#767577", true: theme.secondary }}
              thumbColor={"#f4f3f4"}
            />
          </View>

          <Animated.View
            style={{
              overflow: "hidden",
              height: expandAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 140],
              }),
              opacity: expandAnim,
            }}
          >
            <View>
              <View style={styles.levelSliderRow}>
                <Text
                  style={[styles.levelLabel, { color: theme.textSecondary }]}
                >
                  {uiT("ui.min_level_4986a2df")} </Text>
                <Text style={[styles.levelValue, { color: theme.textColor }]}>
                  {config.minLevel}
                </Text>
              </View>
              <Slider
                minimumValue={1}
                maximumValue={userLevel}
                step={1}
                value={config.minLevel}
                onValueChange={(v) => {
                  const val = Math.min(Math.round(v), config.maxLevel);
                  updateConfig("minLevel", val);
                }}
                minimumTrackTintColor={theme.secondary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.secondary}
              />
              <View style={[styles.levelSliderRow, { marginTop: 12 }]}>
                <Text
                  style={[styles.levelLabel, { color: theme.textSecondary }]}
                >
                  {uiT("ui.max_level_2833a212")} </Text>
                <Text style={[styles.levelValue, { color: theme.textColor }]}>
                  {config.maxLevel}
                </Text>
              </View>
              <Slider
                minimumValue={1}
                maximumValue={userLevel}
                step={1}
                value={config.maxLevel}
                onValueChange={(v) => {
                  const val = Math.max(Math.round(v), config.minLevel);
                  updateConfig("maxLevel", val);
                }}
                minimumTrackTintColor={theme.secondary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.secondary}
              />
            </View>
          </Animated.View>
          {!config.useCustomLevelRange && (
            <View style={styles.levelSummaryRow}>
              <Ionicons
                name="stats-chart"
                size={16}
                color={theme.textSecondary}
              />
              <Text
                style={[
                  styles.levelSummaryText,
                  { color: theme.textSecondary },
                ]}
              >
                {config.selectedListIds.length > 0
                  ? uiT("ui.all_levels_in_selected_lists_426ef1c8")
                  : uiT("ui.levels_1_value_97fc00a2", {value1: (userLevel)})}
              </Text>
            </View>
          )}
        </View>

        {/* Anime Sources */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.anime_sources_36a50c51")} </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.textSecondary }]}
          >
            {uiT("ui.examples_will_come_from_specific_anime_selected_below_1cce5084")} </Text>
          <View style={styles.animeActionRow}>
            <View style={styles.animeCountContainer}>
              <Ionicons name="film" size={16} color={theme.textSecondary} />
              <Text style={[styles.animeCount, { color: theme.textColor }]}>
                {selectedAnimes.length} {uiT("ui.anime_selected_56484a44")} </Text>
            </View>
            <TouchableOpacity
              onPress={handleCustomizeAnimes}
              style={[
                styles.customizeButton,
                {
                  borderColor: theme.primary,
                  backgroundColor: `${theme.primary}15`,
                },
              ]}
            >
              <Text
                style={[styles.customizeButtonText, { color: theme.primary }]}
              >
                {uiT("ui.edit_selection_992eab34")} </Text>
            </TouchableOpacity>
          </View>
          {selectedAnimes.length === 0 && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={16} color="#ff9500" />
              <Text style={styles.warningText}>
                {uiT("ui.no_anime_selected_please_select_at_least_one_anime_source_75af349b")} </Text>
            </View>
          )}
        </View>

        {/* Playback Settings */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.playback_2db1db07")} </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.textSecondary }]}
          >
            {uiT("ui.control_how_audio_behaves_during_practice_b1c97335")} </Text>
          <View
            style={[
              styles.toggleRow,
              {
                borderColor: listeningAutoPlayAudio
                  ? theme.primary
                  : theme.border,
                backgroundColor: listeningAutoPlayAudio
                  ? `${theme.primary}15`
                  : "transparent",
              },
            ]}
          >
            <Ionicons
              name="play-circle-outline"
              size={20}
              color={listeningAutoPlayAudio ? theme.primary : theme.textSecondary}
            />
            <Text style={[styles.toggleText, { color: theme.textColor }]}>
              {uiT("ui.auto_play_audio_12320266")} </Text>
            <View style={{ flex: 1 }} />
            <Switch
              value={listeningAutoPlayAudio}
              onValueChange={setListeningAutoPlayAudio}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor={"#f4f3f4"}
            />
          </View>
          <Text
            style={[
              styles.playbackHint,
              { color: theme.textSecondary },
            ]}
          >
            {listeningAutoPlayAudio
              ? uiT("ui.audio_will_play_automatically_when_moving_to_the_next_question_891d59d9")
              : uiT("ui.you_ll_need_to_press_play_manually_to_hear_the_audio_64635e05")}
          </Text>
        </View>

        <SubjectListsFilterCard
          selectedListIds={config.selectedListIds}
          onChange={(ids) => updateConfig("selectedListIds", ids)}
          subjectTypes={listCountTypes}
          description={uiT("ui.optional_only_include_subjects_from_these_saved_lists_1d5ef2d9")}
        />

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Sticky footer button */}
      <View
        style={[
          styles.stickyFooter,
          { backgroundColor: theme.cardBackground, shadowColor: "#000" },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.startButton,
            {
              backgroundColor: canStart() ? theme.primary : theme.border,
              opacity: canStart() ? 1 : 0.7,
            },
          ]}
          onPress={start}
          disabled={!canStart()}
          activeOpacity={0.8}
        >
          <Ionicons
            name="play"
            size={24}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.startButtonText}>{uiT("ui.start_listening_practice_1a81a12d")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionElevated: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "rgba(0,0,0,0.15)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 12,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  overviewChipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  overviewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  overviewChipText: {
    fontSize: 12,
  },
  modeSelectorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  modeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  modeOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sliderCount: {
    width: 52,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 40,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  levelSliderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelLabel: {
    fontSize: 14,
  },
  levelValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  levelSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelSummaryText: {
    fontSize: 14,
  },
  animeActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  animeCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  animeCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  customizeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  customizeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  playbackHint: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 149, 0, 0.1)",
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: "#ff9500",
    flex: 1,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  startButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  stickyFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 40,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
});
