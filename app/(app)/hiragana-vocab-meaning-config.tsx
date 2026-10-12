import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
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
import { parseSelectedListIds } from "../../src/utils/extraStudySubjectLists";
import SrsLevelIcon from "../../src/components/SrsLevelIcon";
import { useAuthStore } from "../../src/utils/store";
import { useTheme } from "../../src/utils/theme";

interface Config {
  includeVocabulary: boolean;
  includeKanaVocabulary: boolean;
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
  selectedListIds: string[];
}

const createDefaultConfig = (userLevel: number): Config => ({
  includeVocabulary: true,
  includeKanaVocabulary: true,
  numberOfQuestions: 20,
  srsGroups: {
    apprentice: true,
    guru: true,
    master: true,
    enlightened: true,
    burned: true,
  },
  useCustomLevelRange: false,
  minLevel: 1,
  maxLevel: userLevel,
  selectedListIds: [],
});

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
    numberOfQuestions: clampNumber(
      rawConfig.numberOfQuestions,
      5,
      100,
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
    selectedListIds: parseSelectedListIds(rawConfig.selectedListIds),
  };
};

// Deprecated UI for count buttons; kept for reference
// const QUESTION_COUNT_OPTIONS = [10, 20, 30, 50, 100];

export default function HiraganaVocabMeaningConfigScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const { userData } = useAuthStore();
  const userLevel = userData?.level ?? 60;

  const [config, setConfig] = useState<Config>(() =>
    createDefaultConfig(userLevel),
  );
  const [isConfigHydrated, setIsConfigHydrated] = useState(false);
  const initialUserLevelRef = useRef(userLevel);
  const hasCheckedForResumableSessionRef = useRef(false);

  const updateConfig = (key: keyof Config, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const canStart = () => {
    const hasSubjectTypes = config.includeVocabulary || config.includeKanaVocabulary;
    const srs = config.srsGroups || {} as any;
    const hasAnySrs = Boolean(
      srs.apprentice || srs.guru || srs.master || srs.enlightened || srs.burned
    );
    return hasSubjectTypes && hasAnySrs;
  };

  const start = async () => {
    if (!canStart()) return;

    await clearExtraStudySessionState(
      EXTRA_STUDY_SESSION_STORAGE_KEYS.HIRAGANA_VOCAB_MEANING,
    );

    try {
      const sessionId = `hira_vocab_meaning_${Date.now()}`;
      await AsyncStorage.setItem(
        `hiragana_vocab_meaning_config_${sessionId}`,
        JSON.stringify(config),
      );

      router.push({
        pathname: "/test-session",
        params: { sessionId, mode: "hiragana-vocab-meaning" },
      });
    } catch (error) {
      console.error("Failed to save hiragana vocab config:", error);
      router.push({
        pathname: "/test-session",
        params: {
          mode: "hiragana-vocab-meaning",
          includeRadicals: "false",
          includeKanji: "false",
          includeVocabulary: config.includeVocabulary.toString(),
          includeKanaVocabulary: config.includeKanaVocabulary.toString(),
          numberOfQuestions: config.numberOfQuestions.toString(),
          includeMeaning: "true",
          includeReading: "false",
          srsApprentice: String(config.srsGroups.apprentice),
          srsGuru: String(config.srsGroups.guru),
          srsMaster: String(config.srsGroups.master),
          srsEnlightened: String(config.srsGroups.enlightened),
          srsBurned: String(config.srsGroups.burned),
          useCustomLevelRange: String(config.useCustomLevelRange),
          minLevel: String(config.minLevel),
          maxLevel: String(config.maxLevel),
          selectedListIds: config.selectedListIds.join(","),
        }
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      const stored = await loadExtraStudyConfig<Config>(
        EXTRA_STUDY_CONFIG_STORAGE_KEYS.HIRAGANA_VOCAB_MEANING,
      );
      if (!isMounted) {
        return;
      }

      if (stored) {
        setConfig(sanitizeConfig(stored, initialUserLevelRef.current));
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
        EXTRA_STUDY_SESSION_STORAGE_KEYS.HIRAGANA_VOCAB_MEANING,
      );
      if (!hasSavedSession || !isMounted) {
        return;
      }

      Alert.alert(
        uiT("ui.resume_hiragana_quiz_d1f540cb"),
        uiT("ui.you_have_a_hiragana_vocab_quiz_in_progress_5f7f0ab6"),
        [
          { text: uiT("ui.not_now_ccb4c324"), style: "cancel" },
          {
            text: uiT("ui.discard_eb1a70e3"),
            style: "destructive",
            onPress: () => {
              void clearExtraStudySessionState(
                EXTRA_STUDY_SESSION_STORAGE_KEYS.HIRAGANA_VOCAB_MEANING,
              );
            },
          },
          {
            text: uiT("ui.resume_d640c742"),
            onPress: () => {
              router.push({
                pathname: "/test-session",
                params: { resume: "true", mode: "hiragana-vocab-meaning" },
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
    setConfig((prev) => sanitizeConfig(prev, userLevel));
  }, [userLevel]);

  useEffect(() => {
    if (!isConfigHydrated) {
      return;
    }

    saveExtraStudyConfig(
      EXTRA_STUDY_CONFIG_STORAGE_KEYS.HIRAGANA_VOCAB_MEANING,
      config,
    );
  }, [config, isConfigHydrated]);

  const srsChips = useMemo(() => ([
    { key: 'apprentice', label: 'Apprentice' },
    { key: 'guru', label: 'Guru' },
    { key: 'master', label: 'Master' },
    { key: 'enlightened', label: 'Enlightened' },
    { key: 'burned', label: 'Burned' },
  ] as const), []);

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

  // Slider layout (no bubble)
  // no-op

  // Animated expand for level range section
  const expandAnim = useRef(new Animated.Value(config.useCustomLevelRange ? 1 : 0)).current;

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
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>
          {uiT("ui.hiragana_vocab_c0c944e5")} </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Overview card */}
        <View style={[styles.sectionElevated, { backgroundColor: theme.cardBackground }]}> 
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="options-outline" size={18} color={theme.textSecondary} />
            <Text style={[styles.sectionHeaderText, { color: theme.textSecondary }]}>
              {uiT("ui.meaning_quiz_47250f3b")} </Text>
          </View>
          <Text style={[styles.overviewTitle, { color: theme.textColor }]}>
            {uiT("ui.read_hiragana_answer_in_english_346a8975")} </Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            {uiT("ui.prompt_words_are_shown_in_hiragana_only_your_answer_should_be_the_0c641eff")} </Text>
          <View style={styles.overviewChipsRow}>
            <TouchableOpacity
              style={[
                styles.overviewChip,
                { borderColor: config.includeVocabulary ? theme.primary : theme.border,
                  backgroundColor: config.includeVocabulary ? `${theme.primary}22` : 'transparent' }
              ]}
              onPress={() => updateConfig('includeVocabulary', !config.includeVocabulary)}
              activeOpacity={0.7}
            >
              <Ionicons name="library" size={16} color={config.includeVocabulary ? theme.primary : theme.textSecondary} />
              <Text style={[styles.overviewChipText, { color: config.includeVocabulary ? theme.primary : theme.textSecondary }]}>{uiT("ui.vocabulary_eebd90a0")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.overviewChip,
                { borderColor: config.includeKanaVocabulary ? theme.primary : theme.border,
                  backgroundColor: config.includeKanaVocabulary ? `${theme.primary}22` : 'transparent' }
              ]}
              onPress={() => updateConfig('includeKanaVocabulary', !config.includeKanaVocabulary)}
              activeOpacity={0.7}
            >
              <Ionicons name="text" size={16} color={config.includeKanaVocabulary ? theme.primary : theme.textSecondary} />
              <Text style={[styles.overviewChipText, { color: config.includeKanaVocabulary ? theme.primary : theme.textSecondary }]}>{uiT("ui.kana_vocab_597d8c17")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Number of Questions */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}> 
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>{uiT("ui.number_of_questions_e69db859")}</Text>
          <View style={[styles.sliderContainer]}> 
            <Text style={[styles.sliderCount, { color: theme.textColor }]}>{config.numberOfQuestions}</Text>
            <Slider
              style={{ flex: 1, height: 40 }}
              minimumValue={5}
              maximumValue={100}
              step={5}
              value={config.numberOfQuestions}
              onValueChange={(v) => updateConfig("numberOfQuestions", Math.round(v))}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.primary}
            />
          </View>
        </View>

        {/* SRS Stages */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}> 
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>{uiT("ui.include_srs_stages_eb382d10")}</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>{uiT("ui.choose_which_progression_stages_to_include_983f6d5c")}</Text>
          <View style={styles.chipsContainer}>
            {srsChips.map(({ key, label }) => {
              const selected = (config.srsGroups as any)[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.chip,
                    selected
                      ? { backgroundColor: `${theme.primary}22`, borderColor: theme.primary }
                      : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: theme.border }
                  ]}
                  onPress={() => setConfig(prev => ({ ...prev, srsGroups: { ...prev.srsGroups, [key]: !prev.srsGroups[key as keyof typeof prev.srsGroups] } }))}
                  activeOpacity={0.7}
                >
                  <SrsLevelIcon
                    level={label}
                    size={16}
                    color={selected ? theme.primary : theme.textSecondary}
                  />
                  <Text style={[styles.chipText, { color: selected ? theme.primary : theme.textColor }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Levels */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}> 
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>{uiT("ui.levels_b1482131")}</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>{uiT("ui.without_a_subject_list_includes_levels_1_to_your_level_0da23a7f")}{userLevel}{uiT("ui.selected_lists_can_include_any_level_enable_a_custom_range_to_re_3c17f945")}</Text>
          <View style={[styles.toggleRow, { borderColor: config.useCustomLevelRange ? theme.secondary : theme.border, backgroundColor: config.useCustomLevelRange ? `${theme.secondary}15` : 'transparent' }]}>
            <Text style={[styles.toggleText, { color: theme.textColor }]}>{uiT("ui.use_custom_level_range_fdb84cae")}</Text>
            <View style={{ flex: 1 }} />
            <Switch
              value={config.useCustomLevelRange}
              onValueChange={(v) => updateConfig('useCustomLevelRange', v)}
              trackColor={{ false: '#767577', true: theme.secondary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          <Animated.View
            style={{
              overflow: 'hidden',
              height: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 140] }),
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
                onValueChange={(v) => {
                  const val = Math.min(Math.round(v), config.maxLevel);
                  updateConfig('minLevel', val);
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
                onValueChange={(v) => {
                  const val = Math.max(Math.round(v), config.minLevel);
                  updateConfig('maxLevel', val);
                }}
                minimumTrackTintColor={theme.secondary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.secondary}
              />
            </View>
          </Animated.View>
          {!config.useCustomLevelRange && (
            <View style={styles.levelSummaryRow}>
              <Ionicons name="stats-chart" size={16} color={theme.textSecondary} />
              <Text style={[styles.levelSummaryText, { color: theme.textSecondary }]}>
                {config.selectedListIds.length > 0
                  ? uiT("ui.all_levels_in_selected_lists_426ef1c8")
                  : uiT("ui.levels_1_value_97fc00a2", {value1: (userLevel)})}
              </Text>
            </View>
          )}
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
      <View style={[styles.stickyFooter, { backgroundColor: theme.cardBackground, shadowColor: '#000' }]}> 
        <TouchableOpacity
          style={[
            styles.startButton,
            { backgroundColor: canStart() ? theme.primary : theme.border, opacity: canStart() ? 1 : 0.7 }
          ]}
          onPress={start}
          disabled={!canStart()}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={24} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.startButtonText}>{uiT("ui.start_hiragana_quiz_2aa8cbae")}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 12,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  overviewChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  overviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  overviewChipText: {
    fontSize: 12,
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
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  sliderCount: {
    width: 52,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 40,
  },
  sliderBubble: {
    position: 'absolute',
    top: -6,
    width: 36,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#000000AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderBubbleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  levelSliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 14,
  },
  levelValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  levelSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelSummaryText: {
    fontSize: 14,
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
    position: 'absolute',
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
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});
