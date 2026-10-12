import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
  getAccountScopedExtraStudySessionStorageKey,
  hasExtraStudySessionState,
} from "../../src/utils/extraStudySessionPersistence";
import SubjectListsFilterCard from "../../src/components/SubjectListsFilterCard";
import SrsLevelIcon from "../../src/components/SrsLevelIcon";
import { getCustomContextSentenceCount } from "../../src/services/customContextSentenceService";
import KeyboardManager, {
  JAPANESE_KEYBOARD_SETUP_INSTRUCTIONS,
} from "../../src/modules/KeyboardManager";
import type { ContextSentencePracticeConfig } from "../../src/types/contextSentencePractice";
import type { ListeningSolutionMode } from "../../src/types/listening";
import { parseSelectedListIds } from "../../src/utils/extraStudySubjectLists";
import { useAuthStore, useSettingsStore } from "../../src/utils/store";
import { useTheme } from "../../src/utils/theme";

type Config = ContextSentencePracticeConfig;

const DEFAULT_SRS_GROUPS = {
  apprentice: true,
  guru: true,
  master: true,
  enlightened: true,
  burned: false,
};

const createDefaultConfig = (userLevel: number): Config => ({
  includeVocabulary: true,
  includeKanaVocabulary: false,
  customSentencesOnly: false,
  solutionMode: "multiple_choice",
  numberOfQuestions: 15,
  enableSentenceAudio: false,
  autoPlaySentenceAudio: false,
  hideTranslationUntilTap: false,
  enableJpdbSentenceBreakdown: false,
  stopAfterAnswer: true,
  srsGroups: { ...DEFAULT_SRS_GROUPS },
  useCustomLevelRange: false,
  minLevel: 1,
  maxLevel: userLevel,
  selectedListIds: [],
  devSelectedSubjectIds: [],
});

const parseDevSelectedSubjectIds = (rawValue: unknown): number[] => {
  const values = Array.isArray(rawValue)
    ? rawValue
    : typeof rawValue === "string"
      ? rawValue.split(/[,\s]+/)
      : [];

  const parsedIds = values
    .map((value) => {
      const parsed =
        typeof value === "number"
          ? value
          : Number.parseInt(String(value), 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
      }

      return parsed;
    })
    .filter((value): value is number => value !== null);

  return Array.from(new Set(parsedIds));
};

const formatDevSelectedSubjectIds = (ids: number[] | undefined): string => {
  if (!ids || ids.length === 0) {
    return "";
  }

  return ids.join(", ");
};

const sanitizeConfig = (rawConfig: Partial<Config>, userLevel: number): Config => {
  const defaults = createDefaultConfig(userLevel);
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
    customSentencesOnly: pickBoolean(
      rawConfig.customSentencesOnly,
      defaults.customSentencesOnly,
    ),
    solutionMode:
      rawConfig.solutionMode === "writing" ? "writing" : "multiple_choice",
    numberOfQuestions: clampNumber(
      rawConfig.numberOfQuestions,
      5,
      50,
      defaults.numberOfQuestions,
      5,
    ),
    enableSentenceAudio: pickBoolean(
      rawConfig.enableSentenceAudio,
      defaults.enableSentenceAudio,
    ),
    autoPlaySentenceAudio: pickBoolean(
      rawConfig.autoPlaySentenceAudio,
      defaults.autoPlaySentenceAudio,
    ),
    hideTranslationUntilTap: pickBoolean(
      rawConfig.hideTranslationUntilTap,
      defaults.hideTranslationUntilTap,
    ),
    enableJpdbSentenceBreakdown: pickBoolean(
      rawConfig.enableJpdbSentenceBreakdown,
      defaults.enableJpdbSentenceBreakdown,
    ),
    stopAfterAnswer: pickBoolean(
      rawConfig.stopAfterAnswer,
      defaults.stopAfterAnswer,
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
    selectedListIds: parseSelectedListIds(rawConfig.selectedListIds),
    devSelectedSubjectIds: parseDevSelectedSubjectIds(
      rawConfig.devSelectedSubjectIds,
    ),
  };
};

export default function ContextSentencePracticeConfigScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const { userData } = useAuthStore();
  const {
    autoSwitchKeyboard,
    setAutoSwitchKeyboard,
  } = useSettingsStore();
  const userLevel = userData?.level ?? 60;
  const [config, setConfig] = useState<Config>(() =>
    createDefaultConfig(userLevel),
  );
  const [devSelectedSubjectIdsInput, setDevSelectedSubjectIdsInput] =
    useState("");
  const [isConfigHydrated, setIsConfigHydrated] = useState(false);
  const [customSentenceCount, setCustomSentenceCount] = useState<number | null>(
    null,
  );
  const initialUserLevelRef = useRef(userLevel);
  const promptedResumableSessionKeyRef = useRef<string | null>(null);
  const contextSentencePracticeSessionKey = useMemo(
    () =>
      userData?.id
        ? getAccountScopedExtraStudySessionStorageKey(
            EXTRA_STUDY_SESSION_STORAGE_KEYS.CONTEXT_SENTENCE_PRACTICE,
            userData.id,
          )
        : null,
    [userData?.id],
  );

  const devSelectedSubjectIdsPreview = useMemo(
    () => parseDevSelectedSubjectIds(devSelectedSubjectIdsInput),
    [devSelectedSubjectIdsInput],
  );

  const updateConfig = (key: keyof Config, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const canStart = () => {
    const hasSubjectTypes =
      config.includeVocabulary || config.includeKanaVocabulary;
    const hasAnySrs =
      config.srsGroups.apprentice ||
      config.srsGroups.guru ||
      config.srsGroups.master ||
      config.srsGroups.enlightened ||
      config.srsGroups.burned;

    const hasRequestedSentences =
      !config.customSentencesOnly || (customSentenceCount ?? 0) > 0;

    return hasSubjectTypes && hasAnySrs && hasRequestedSentences;
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

  const handleKeyboardToggle = async (value: boolean) => {
    if (value && KeyboardManager) {
      const hasJapaneseKeyboard = await KeyboardManager.hasJapaneseKeyboard();
      if (!hasJapaneseKeyboard) {
        Alert.alert(
          uiT("ui.no_japanese_keyboard_ffbd52b8"),
          JAPANESE_KEYBOARD_SETUP_INSTRUCTIONS,
        );
        return;
      }
    }

    setAutoSwitchKeyboard(value);
  };

  const start = async () => {
    if (!canStart()) {
      return;
    }

    if (contextSentencePracticeSessionKey) {
      await clearExtraStudySessionState(contextSentencePracticeSessionKey);
      promptedResumableSessionKeyRef.current = null;
    }

    try {
      const configToStart: Config = {
        ...config,
        devSelectedSubjectIds: __DEV__ ? devSelectedSubjectIdsPreview : [],
      };
      const sessionId = `context_sentence_${Date.now()}`;
      await AsyncStorage.setItem(
        `context_sentence_config_${sessionId}`,
        JSON.stringify(configToStart),
      );

      router.push({
        pathname: "/context-sentence-practice-session",
        params: { sessionId },
      });
    } catch (error) {
      console.error("Failed to save context sentence config:", error);

      const solutionMode: ListeningSolutionMode =
        config.solutionMode === "writing" ? "writing" : "multiple_choice";

      router.push({
        pathname: "/context-sentence-practice-session",
        params: {
          includeVocabulary: String(config.includeVocabulary),
          includeKanaVocabulary: String(config.includeKanaVocabulary),
          customSentencesOnly: String(config.customSentencesOnly),
          solutionMode,
          numberOfQuestions: String(config.numberOfQuestions),
          srsApprentice: String(config.srsGroups.apprentice),
          srsGuru: String(config.srsGroups.guru),
          srsMaster: String(config.srsGroups.master),
          srsEnlightened: String(config.srsGroups.enlightened),
          srsBurned: String(config.srsGroups.burned),
          useCustomLevelRange: String(config.useCustomLevelRange),
          minLevel: String(config.minLevel),
          maxLevel: String(config.maxLevel),
          selectedListIds: config.selectedListIds?.join(",") || "",
          enableSentenceAudio: String(config.enableSentenceAudio),
          autoPlaySentenceAudio: String(config.autoPlaySentenceAudio),
          hideTranslationUntilTap: String(config.hideTranslationUntilTap),
          enableJpdbSentenceBreakdown: String(config.enableJpdbSentenceBreakdown),
          stopAfterAnswer: String(config.stopAfterAnswer),
          devSelectedSubjectIds: __DEV__
            ? devSelectedSubjectIdsPreview.join(",")
            : "",
        },
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      const stored = await loadExtraStudyConfig<Config>(
        EXTRA_STUDY_CONFIG_STORAGE_KEYS.CONTEXT_SENTENCE_PRACTICE,
      );
      if (!isMounted) {
        return;
      }

      if (stored) {
        const sanitizedConfig = sanitizeConfig(
          stored,
          initialUserLevelRef.current,
        );
        setConfig(sanitizedConfig);
        if (__DEV__) {
          setDevSelectedSubjectIdsInput(
            formatDevSelectedSubjectIds(sanitizedConfig.devSelectedSubjectIds),
          );
        }
      }

      setIsConfigHydrated(true);
    };

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isFocused = true;

      if (!userData?.id) {
        setCustomSentenceCount(0);
        return () => {
          isFocused = false;
        };
      }

      setCustomSentenceCount(null);
      void getCustomContextSentenceCount(userData.id)
        .then((count) => {
          if (isFocused) {
            setCustomSentenceCount(count);
          }
        })
        .catch((error) => {
          console.error("Failed to count custom context sentences:", error);
          if (isFocused) {
            setCustomSentenceCount(0);
          }
        });

      return () => {
        isFocused = false;
      };
    }, [userData?.id]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!contextSentencePracticeSessionKey) {
        return;
      }

      let isFocused = true;
      const checkForSavedSession = async () => {
        const hasSavedSession = await hasExtraStudySessionState(
          contextSentencePracticeSessionKey,
        );
        if (!isFocused) {
          return;
        }
        if (!hasSavedSession) {
          if (
            promptedResumableSessionKeyRef.current ===
            contextSentencePracticeSessionKey
          ) {
            promptedResumableSessionKeyRef.current = null;
          }
          return;
        }
        if (
          promptedResumableSessionKeyRef.current ===
          contextSentencePracticeSessionKey
        ) {
          return;
        }

        promptedResumableSessionKeyRef.current =
          contextSentencePracticeSessionKey;
        Alert.alert(
          uiT("ui.resume_context_sentence_practice_0ce91f3c"),
          uiT("ui.you_have_a_context_sentence_practice_session_in_progress_192ca667"),
          [
            { text: uiT("ui.not_now_ccb4c324"), style: "cancel" },
            {
              text: uiT("ui.discard_eb1a70e3"),
              style: "destructive",
              onPress: () => {
                promptedResumableSessionKeyRef.current = null;
                void clearExtraStudySessionState(
                  contextSentencePracticeSessionKey,
                );
              },
            },
            {
              text: uiT("ui.resume_d640c742"),
              onPress: () => {
                router.push({
                  pathname: "/context-sentence-practice-session",
                  params: { resume: "true" },
                });
              },
            },
          ],
        );
      };

      void checkForSavedSession();

      return () => {
        isFocused = false;
      };
    }, [contextSentencePracticeSessionKey]),
  );

  useEffect(() => {
    setConfig((prev) => sanitizeConfig(prev, userLevel));
  }, [userLevel]);

  useEffect(() => {
    if (!isConfigHydrated) {
      return;
    }

    saveExtraStudyConfig(
      EXTRA_STUDY_CONFIG_STORAGE_KEYS.CONTEXT_SENTENCE_PRACTICE,
      config,
    );
  }, [config, isConfigHydrated]);

  const srsChips = useMemo(
    () =>
      [
        { key: "apprentice", label: "Apprentice" },
        { key: "guru", label: "Guru" },
        { key: "master", label: "Master" },
        { key: "enlightened", label: "Enlightened" },
        { key: "burned", label: "Burned" },
      ] as const,
    [],
  );

  const expandAnim = useRef(
    new Animated.Value(config.useCustomLevelRange ? 1 : 0),
  ).current;

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: config.useCustomLevelRange ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [config.useCustomLevelRange, expandAnim]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}> 
      <StatusBar style={theme.statusBarStyle} />

      <View style={[styles.header, { backgroundColor: theme.backgroundColor }]}> 
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>{uiT("ui.context_sentences_0461dd8f")}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.sectionElevated, { backgroundColor: theme.cardBackground }]}> 
          <View style={styles.sectionHeaderRow}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color={theme.textSecondary}
            />
            <Text style={[styles.sectionHeaderText, { color: theme.textSecondary }]}>{uiT("ui.sentence_cloze_practice_c483d54a")}</Text>
          </View>
          <Text style={[styles.overviewTitle, { color: theme.textColor }]}>{uiT("ui.choose_subject_types_6d56c1e3")}</Text>
          <View style={styles.overviewChipsRow}>
            <TouchableOpacity
              style={[
                styles.overviewChip,
                {
                  borderColor: config.includeVocabulary ? theme.primary : theme.border,
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
                  !config.includeKanaVocabulary,
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
          <View
            style={[
              styles.personalSentenceToggle,
              { borderTopColor: theme.border },
            ]}
          >
            <View style={styles.personalSentenceToggleCopy}>
              <Text
                style={[
                  styles.personalSentenceToggleTitle,
                  { color: theme.textColor },
                ]}
              >
                {uiT("ui.only_my_sentences_6d34fe15")} </Text>
              <Text
                style={[
                  styles.personalSentenceToggleDescription,
                  { color: theme.textSecondary },
                ]}
              >
                {customSentenceCount === null
                  ? uiT("ui.checking_sentences_saved_on_this_device_e29868c9")
                  : customSentenceCount === 0
                    ? uiT("ui.add_one_from_a_vocabulary_s_context_tab_first_ba16e99f")
                    : uiT("ui.review_value_sentencevalue_saved_on_this_device_72b2a148", {value1: (customSentenceCount), value2: (customSentenceCount === 1 ? "" : "s")})}
              </Text>
            </View>
            <Switch
              value={config.customSentencesOnly}
              onValueChange={(value) =>
                updateConfig("customSentencesOnly", value)
              }
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}> 
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>{uiT("ui.number_of_questions_e69db859")}</Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderCount, { color: theme.textColor }]}>
              {config.numberOfQuestions}
            </Text>
            <Slider
              style={{ flex: 1, height: 40 }}
              minimumValue={5}
              maximumValue={50}
              step={5}
              value={config.numberOfQuestions}
              onValueChange={(value) =>
                updateConfig("numberOfQuestions", Math.round(value))
              }
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.primary}
            />
          </View>
        </View>

        {__DEV__ && (
          <View
            style={[styles.section, { backgroundColor: theme.cardBackground }]}
          >
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
              {uiT("ui.dev_question_picker_b1ecc510")} </Text>
            <Text
              style={[
                styles.sectionDescription,
                { color: theme.textSecondary, marginBottom: 10 },
              ]}
            >
              {uiT("ui.enter_comma_separated_wanikani_subject_ids_in_dev_builds_only_tho_a8e3fe96")} </Text>
            <TextInput
              value={devSelectedSubjectIdsInput}
              onChangeText={(value) => {
                setDevSelectedSubjectIdsInput(value);
                updateConfig(
                  "devSelectedSubjectIds",
                  parseDevSelectedSubjectIds(value),
                );
              }}
              placeholder={uiT("ui.e_g_246_12345_67890_fd8649d6")}
              placeholderTextColor={theme.textSecondary}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.devInput,
                {
                  borderColor: theme.border,
                  color: theme.textColor,
                  backgroundColor: theme.backgroundColor,
                },
              ]}
            />
            <Text style={[styles.devHint, { color: theme.textSecondary }]}>
              {devSelectedSubjectIdsPreview.length > 0
                ? uiT("ui.value_questionvalue_selected_960888b9", {value1: (devSelectedSubjectIdsPreview.length), value2: (devSelectedSubjectIdsPreview.length === 1 ? "" : "s")})
                : uiT("ui.leave_empty_to_use_random_question_selection_352e5df3")}
            </Text>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}> 
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>{uiT("ui.answer_mode_c7728f17")}</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>{uiT("ui.choose_whether_you_answer_with_multiple_choice_or_by_typing_the_m_687a3f39")}</Text>

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
                  <Text style={[styles.toggleText, { color: theme.textColor }]}>{uiT("ui.switch_to_japanese_keyboard_3d31738e")}</Text>
                  <View style={{ flex: 1 }} />
                  <Switch
                    value={autoSwitchKeyboard}
                    onValueChange={handleKeyboardToggle}
                    trackColor={{ false: "#767577", true: theme.primary }}
                    thumbColor="#f4f3f4"
                  />
                </View>
              )}
              <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                {uiT("ui.writing_mode_accepts_kanji_or_hiragana_answers_keyboard_auto_swit_ae87d9cb")} </Text>
            </>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.sentence_assist_e964f56a")} </Text>
          <Text
            style={[styles.sectionDescription, { color: theme.textSecondary }]}
          >
            {uiT("ui.configure_in_question_sentence_audio_and_translation_reveal_behav_f7130176")} </Text>

          <View
            style={[
              styles.toggleRow,
              {
                borderColor: config.enableSentenceAudio
                  ? theme.primary
                  : theme.border,
                backgroundColor: config.enableSentenceAudio
                  ? `${theme.primary}15`
                  : "transparent",
              },
            ]}
          >
            <Ionicons
              name="volume-high-outline"
              size={16}
              color={config.enableSentenceAudio ? theme.primary : theme.textSecondary}
            />
            <View style={styles.assistToggleLabelContainer}>
              <Text
                style={[styles.assistToggleMainText, { color: theme.textColor }]}
              >
                {uiT("ui.sentence_audio_tts_65635438")} </Text>
              <Text
                style={[
                  styles.assistToggleSubtext,
                  { color: theme.textSecondary },
                ]}
              >
                {uiT("ui.plays_the_japanese_sentence_after_a_correct_answer_and_adds_a_rep_65d22664")} </Text>
            </View>
            <Switch
              value={config.enableSentenceAudio}
              onValueChange={(value) => updateConfig("enableSentenceAudio", value)}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          {config.enableSentenceAudio && (
            <View
              style={[
                styles.toggleRow,
                {
                  borderColor: config.autoPlaySentenceAudio
                    ? theme.primary
                    : theme.border,
                  backgroundColor: config.autoPlaySentenceAudio
                    ? `${theme.primary}15`
                    : "transparent",
                },
              ]}
            >
              <Ionicons
                name="play-circle-outline"
                size={16}
                color={
                  config.autoPlaySentenceAudio
                    ? theme.primary
                    : theme.textSecondary
                }
              />
              <View style={styles.assistToggleLabelContainer}>
                <Text
                  style={[
                    styles.assistToggleMainText,
                    { color: theme.textColor },
                  ]}
                >
                  {uiT("ui.auto_play_sentence_audio_174d7f7e")} </Text>
                <Text
                  style={[
                    styles.assistToggleSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.automatically_plays_sentence_audio_when_each_question_starts_5414e6ea")} </Text>
              </View>
              <Switch
                value={config.autoPlaySentenceAudio}
                onValueChange={(value) =>
                  updateConfig("autoPlaySentenceAudio", value)
                }
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
          )}

          <View
            style={[
              styles.toggleRow,
              {
                borderColor: config.hideTranslationUntilTap
                  ? theme.primary
                  : theme.border,
                backgroundColor: config.hideTranslationUntilTap
                  ? `${theme.primary}15`
                  : "transparent",
              },
            ]}
          >
            <Ionicons
              name="eye-off-outline"
              size={16}
              color={
                config.hideTranslationUntilTap ? theme.primary : theme.textSecondary
              }
            />
            <View style={styles.assistToggleLabelContainer}>
              <Text
                style={[styles.assistToggleMainText, { color: theme.textColor }]}
              >
                {uiT("ui.hide_translation_until_tap_83146dcc")} </Text>
              <Text
                style={[
                  styles.assistToggleSubtext,
                  { color: theme.textSecondary },
                ]}
              >
                {uiT("ui.blurs_the_english_translation_until_you_tap_to_reveal_it_c85a6547")} </Text>
            </View>
            <Switch
              value={config.hideTranslationUntilTap}
              onValueChange={(value) =>
                updateConfig("hideTranslationUntilTap", value)
              }
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View
            style={[
              styles.toggleRow,
              {
                borderColor: config.enableJpdbSentenceBreakdown
                  ? theme.primary
                  : theme.border,
                backgroundColor: config.enableJpdbSentenceBreakdown
                  ? `${theme.primary}15`
                  : "transparent",
              },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={16}
              color={
                config.enableJpdbSentenceBreakdown
                  ? theme.primary
                  : theme.textSecondary
              }
            />
            <View style={styles.assistToggleLabelContainer}>
              <Text
                style={[styles.assistToggleMainText, { color: theme.textColor }]}
              >
                {uiT("ui.jpdb_sentence_breakdown_b69053a7")} </Text>
              <Text
                style={[
                  styles.assistToggleSubtext,
                  { color: theme.textSecondary },
                ]}
              >
                {uiT("ui.tap_grammar_and_vocabulary_inside_the_sentence_to_see_details_in_3ec1f049")} </Text>
            </View>
            <Switch
              value={config.enableJpdbSentenceBreakdown}
              onValueChange={(value) =>
                updateConfig("enableJpdbSentenceBreakdown", value)
              }
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View
            style={[
              styles.toggleRow,
              {
                borderColor: config.stopAfterAnswer
                  ? theme.primary
                  : theme.border,
                backgroundColor: config.stopAfterAnswer
                  ? `${theme.primary}15`
                  : "transparent",
                marginBottom: 0,
              },
            ]}
          >
            <Ionicons
              name="pause-circle-outline"
              size={16}
              color={config.stopAfterAnswer ? theme.primary : theme.textSecondary}
            />
            <View style={styles.assistToggleLabelContainer}>
              <Text
                style={[styles.assistToggleMainText, { color: theme.textColor }]}
              >
                {uiT("ui.stop_after_answer_ecf7398a")} </Text>
              <Text
                style={[
                  styles.assistToggleSubtext,
                  { color: theme.textSecondary },
                ]}
              >
                {uiT("ui.shows_result_first_then_waits_for_you_to_continue_to_the_next_que_bd599413")} </Text>
            </View>
            <Switch
              value={config.stopAfterAnswer}
              onValueChange={(value) => updateConfig("stopAfterAnswer", value)}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}> 
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>{uiT("ui.include_srs_stages_eb382d10")}</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>{uiT("ui.choose_which_progression_stages_to_include_983f6d5c")}</Text>
          <View style={styles.chipsContainer}>
            {srsChips.map(({ key, label }) => {
              const selected = config.srsGroups[key as keyof Config["srsGroups"]];
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
                        [key]: !prev.srsGroups[key],
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

        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}> 
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>{uiT("ui.levels_b1482131")}</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>{uiT("ui.without_a_subject_list_includes_levels_1_to_your_level_0da23a7f")}{userLevel}{uiT("ui.selected_lists_can_include_any_level_enable_a_custom_range_to_re_3c17f945")}</Text>
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
            <Text style={[styles.toggleText, { color: theme.textColor }]}>{uiT("ui.use_custom_level_range_fdb84cae")}</Text>
            <View style={{ flex: 1 }} />
            <Switch
              value={config.useCustomLevelRange}
              onValueChange={(value) => updateConfig("useCustomLevelRange", value)}
              trackColor={{ false: "#767577", true: theme.secondary }}
              thumbColor="#f4f3f4"
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
                <Text style={[styles.levelLabel, { color: theme.textSecondary }]}>{uiT("ui.min_level_4986a2df")}</Text>
                <Text style={[styles.levelValue, { color: theme.textColor }]}>{config.minLevel}</Text>
              </View>
              <Slider
                minimumValue={1}
                maximumValue={userLevel}
                step={1}
                value={config.minLevel}
                onValueChange={(value) => {
                  const rounded = Math.min(Math.round(value), config.maxLevel);
                  updateConfig("minLevel", rounded);
                }}
                minimumTrackTintColor={theme.secondary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.secondary}
              />
              <View style={[styles.levelSliderRow, { marginTop: 12 }]}>
                <Text style={[styles.levelLabel, { color: theme.textSecondary }]}>{uiT("ui.max_level_2833a212")}</Text>
                <Text style={[styles.levelValue, { color: theme.textColor }]}>{config.maxLevel}</Text>
              </View>
              <Slider
                minimumValue={1}
                maximumValue={userLevel}
                step={1}
                value={config.maxLevel}
                onValueChange={(value) => {
                  const rounded = Math.max(Math.round(value), config.minLevel);
                  updateConfig("maxLevel", rounded);
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
                style={[styles.levelSummaryText, { color: theme.textSecondary }]}
              >
                {(config.selectedListIds || []).length > 0
                  ? uiT("ui.all_levels_in_selected_lists_426ef1c8")
                  : uiT("ui.levels_1_value_97fc00a2", {value1: (userLevel)})}
              </Text>
            </View>
          )}
        </View>

        <SubjectListsFilterCard
          selectedListIds={config.selectedListIds || []}
          onChange={(ids) => updateConfig("selectedListIds", ids)}
          subjectTypes={listCountTypes}
          description={uiT("ui.optional_only_include_subjects_from_these_saved_lists_1d5ef2d9")}
        />

        <View style={{ height: 80 }} />
      </ScrollView>

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
          <Ionicons name="play" size={24} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.startButtonText}>{uiT("ui.start_context_sentence_practice_3a9c6d97")}</Text>
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
  personalSentenceToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  personalSentenceToggleCopy: {
    flex: 1,
  },
  personalSentenceToggleTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  personalSentenceToggleDescription: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
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
  devInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  devHint: {
    fontSize: 13,
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
  assistToggleLabelContainer: {
    flex: 1,
    marginRight: 8,
  },
  assistToggleMainText: {
    fontSize: 14,
    fontWeight: "600",
  },
  assistToggleSubtext: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
  },
  assistInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: -4,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  assistInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
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
