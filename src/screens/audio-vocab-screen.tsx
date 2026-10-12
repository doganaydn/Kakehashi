import { uiT, useInterfaceLanguage } from "../features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SrsLevelIcon from "../components/SrsLevelIcon";
import SubjectListsFilterCard from "../components/SubjectListsFilterCard";
import {
  EXTRA_STUDY_CONFIG_STORAGE_KEYS,
  clampNumber,
  loadExtraStudyConfig,
  normalizeLevelRange,
  saveExtraStudyConfig,
} from "../utils/extraStudyConfigPersistence";
import { parseSelectedListIds } from "../utils/extraStudySubjectLists";
import {
  EXTRA_STUDY_SESSION_STORAGE_KEYS,
  clearExtraStudySessionState,
  getAccountScopedExtraStudySessionStorageKey,
  loadExtraStudySessionState,
} from "../utils/extraStudySessionPersistence";
import { useAuthStore } from "../utils/store";
import { useTheme } from "../utils/theme";

const SRS_GROUPS = ["Apprentice", "Guru", "Master", "Enlightened", "Burned"];
const SUBJECT_TYPES = ["vocabulary", "kana_vocabulary"] as (
  "vocabulary" | "kana_vocabulary"
)[];
const AUDIO_SOURCES = [
  { value: "word", get label() { return uiT("ui.words_0a8be89a"); }, get description() { return uiT("ui.original_wanikani_audio_fd87a18e"); } },
  {
    value: "sentence",
    get label() { return uiT("ui.context_sentences_3eb98a80"); },
    get description() { return uiT("ui.japanese_text_to_speech_3e97a919"); },
  },
] as const;
type Config = {
  count: number;
  minLevel: number;
  maxLevel: number;
  useCustomLevelRange: boolean;
  groups: string[];
  selectedListIds: string[];
  autoPlay: boolean;
  audioSource: "word" | "sentence";
};
type SavedSession = { testQuestions: unknown[]; currentQuestionIndex: number };

function AudioVocabScreenContent({ userId }: { userId: string }) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const maxLevel = useAuthStore((state) => state.userData?.level ?? 60);
  const sessionKey = getAccountScopedExtraStudySessionStorageKey(
    EXTRA_STUDY_SESSION_STORAGE_KEYS.AUDIO_VOCAB,
    userId,
  );
  const configKey = getAccountScopedExtraStudySessionStorageKey(
    EXTRA_STUDY_CONFIG_STORAGE_KEYS.AUDIO_VOCAB,
    userId,
  );
  const [config, setConfig] = useState<Config>({
    count: 20,
    minLevel: 1,
    maxLevel,
    useCustomLevelRange: false,
    groups: [...SRS_GROUPS],
    selectedListIds: [],
    autoPlay: true,
    audioSource: "word",
  });
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState<SavedSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const writesRef = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    void loadExtraStudyConfig<Config>(configKey).then((stored) => {
      if (!active) return;
      if (stored)
        setConfig({
          count: clampNumber(stored.count, 5, 100, 20, 5),
          ...normalizeLevelRange(stored.minLevel, stored.maxLevel, maxLevel),
          useCustomLevelRange: stored.useCustomLevelRange === true,
          groups: Array.isArray(stored.groups)
            ? stored.groups.filter((group) => SRS_GROUPS.includes(group))
            : [...SRS_GROUPS],
          selectedListIds: parseSelectedListIds(stored.selectedListIds),
          autoPlay: stored.autoPlay !== false,
          audioSource: stored.audioSource === "sentence" ? "sentence" : "word",
        });
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [configKey, maxLevel]);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadExtraStudySessionState<SavedSession>(sessionKey).then(
        (previous) => {
          if (!active) return;
          setSaved(
            previous &&
              Array.isArray(previous.testQuestions) &&
              Number.isInteger(previous.currentQuestionIndex) &&
              previous.currentQuestionIndex >= 0 &&
              previous.currentQuestionIndex < previous.testQuestions.length
              ? previous
              : null,
          );
        },
      );
      return () => {
        active = false;
      };
    }, [sessionKey]),
  );
  useEffect(() => {
    if (!hydrated) return;
    writesRef.current = writesRef.current.then(() =>
      saveExtraStudyConfig(configKey, config),
    );
  }, [config, configKey, hydrated]);

  const updateConfig = useCallback(
    <K extends keyof Config>(key: K, value: Config[K]) => {
      setConfig((previous) => ({ ...previous, [key]: value }));
    },
    [],
  );
  const updateSelectedListIds = useCallback(
    (selectedListIds: string[]) =>
      updateConfig("selectedListIds", selectedListIds),
    [updateConfig],
  );
  const canStart = hydrated && !busy && config.groups.length > 0;
  const start = async () => {
    if (busyRef.current || !canStart) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const sessionId = `audio_vocab_${Date.now()}`;
      await AsyncStorage.setItem(
        `test_config_${sessionId}`,
        JSON.stringify({
          includeVocabulary: true,
          includeKanaVocabulary: true,
          includeMeaning: true,
          includeReading: false,
          numberOfQuestions: config.count,
          useCustomLevelRange: config.useCustomLevelRange,
          minLevel: config.minLevel,
          maxLevel: config.maxLevel,
          selectedListIds: config.selectedListIds,
          srsGroups: Object.fromEntries(
            SRS_GROUPS.map((group) => [
              group.toLowerCase(),
              config.groups.includes(group),
            ]),
          ),
          autoPlayAudio: config.autoPlay,
          audioSource: config.audioSource,
        }),
      );
      await clearExtraStudySessionState(sessionKey);
      router.push({
        pathname: "/test-session",
        params: { mode: "audio-vocab", sessionId },
      });
    } catch {
      setError(uiT("ui.message_a5b8cc7caa65"));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <StatusBar style={theme.statusBarStyle} />
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 8 }]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={uiT("ui.go_back_6aadac2f")}
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>
          {uiT("ui.audio_vocab_31f3aa3d")} </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 132 + insets.bottom },
        ]}
      >
        <View
          style={[
            styles.section,
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
              {uiT("ui.listening_quiz_3dd985aa")} </Text>
          </View>
          <Text style={[styles.overviewTitle, { color: theme.textColor }]}>
            {uiT("ui.listen_answer_in_english_3a7bb964")} </Text>
          <Text
            style={[styles.overviewDescription, { color: theme.textSecondary }]}
          >
            {uiT("ui.practice_vocabulary_by_listening_uses_your_review_settings_includ_412fa276")} </Text>
        </View>

        {!hydrated ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <>
            {saved ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/test-session",
                    params: { mode: "audio-vocab", resume: "true" },
                  })
                }
                style={[
                  styles.section,
                  styles.resumeRow,
                  { backgroundColor: theme.cardBackground },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="play-circle-outline"
                  size={28}
                  color={theme.primary}
                />
                <View style={styles.flex}>
                  <Text
                    style={[styles.optionTitle, { color: theme.textColor }]}
                  >
                    {uiT("ui.resume_saved_session_5919f039")} </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {saved.testQuestions.length - saved.currentQuestionIndex}{" "}
                    {uiT("ui.questions_remaining_ea2f7745")} </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            ) : null}

            <View
              style={[
                styles.section,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
                {uiT("ui.audio_source_2b442d49")} </Text>
              <Text
                style={[
                  styles.sectionDescription,
                  { color: theme.textSecondary },
                ]}
              >
                {config.audioSource === "sentence"
                  ? uiT("ui.listen_to_the_word_then_its_sentence_answer_the_word_s_meaning_48a8a27f")
                  : uiT("ui.choose_what_you_want_to_listen_to_be290b51")}
              </Text>
              <View accessibilityRole="radiogroup" style={styles.options}>
                {AUDIO_SOURCES.map((source) => {
                  const selected = config.audioSource === source.value;
                  return (
                    <TouchableOpacity
                      key={source.value}
                      accessibilityRole="radio"
                      accessibilityLabel={source.label}
                      accessibilityState={{ checked: selected }}
                      onPress={() => updateConfig("audioSource", source.value)}
                      activeOpacity={0.7}
                      style={[
                        styles.optionRow,
                        {
                          borderColor: selected ? theme.primary : theme.border,
                          backgroundColor: selected
                            ? `${theme.primary}15`
                            : "transparent",
                        },
                      ]}
                    >
                      <View style={styles.flex}>
                        <Text
                          style={[
                            styles.optionTitle,
                            { color: theme.textColor },
                          ]}
                        >
                          {source.label}
                        </Text>
                        <Text
                          style={[
                            styles.optionDescription,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {source.description}
                        </Text>
                      </View>
                      <Ionicons
                        name={selected ? "radio-button-on" : "radio-button-off"}
                        size={22}
                        color={selected ? theme.primary : theme.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View
              style={[
                styles.section,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
                {uiT("ui.number_of_questions_e69db859")} </Text>
              <View style={styles.sliderContainer}>
                <Text style={[styles.sliderCount, { color: theme.textColor }]}>
                  {config.count}
                </Text>
                <Slider
                  style={styles.countSlider}
                  accessibilityLabel={uiT("ui.number_of_questions_4bbde39f")}
                  minimumValue={5}
                  maximumValue={100}
                  step={5}
                  value={config.count}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={theme.border}
                  thumbTintColor={theme.primary}
                  onValueChange={(count) =>
                    updateConfig("count", Math.round(count))
                  }
                />
              </View>
            </View>

            <View
              style={[
                styles.section,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
                {uiT("ui.include_srs_stages_eb382d10")} </Text>
              <Text
                style={[
                  styles.sectionDescription,
                  { color: theme.textSecondary },
                ]}
              >
                {uiT("ui.choose_which_progression_stages_to_include_983f6d5c")} </Text>
              <View style={styles.chipsContainer}>
                {SRS_GROUPS.map((group) => {
                  const selected = config.groups.includes(group);
                  return (
                    <TouchableOpacity
                      key={group}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      onPress={() =>
                        updateConfig(
                          "groups",
                          selected
                            ? config.groups.filter((value) => value !== group)
                            : [...config.groups, group],
                        )
                      }
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        {
                          borderColor: selected ? theme.primary : theme.border,
                          backgroundColor: selected
                            ? `${theme.primary}22`
                            : theme.isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.03)",
                        },
                      ]}
                    >
                      <SrsLevelIcon
                        level={group}
                        size={16}
                        color={selected ? theme.primary : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          { color: selected ? theme.primary : theme.textColor },
                        ]}
                      >
                        {group}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View
              style={[
                styles.section,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
                {uiT("ui.levels_b1482131")} </Text>
              <Text
                style={[
                  styles.sectionDescription,
                  { color: theme.textSecondary },
                ]}
              >
                {uiT("ui.without_a_subject_list_includes_levels_1_to_your_level_0da23a7f")} {maxLevel}{uiT("ui.selected_lists_can_include_any_level_enable_a_custom_range_to_re_3c17f945")} </Text>
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
                <Switch
                  accessibilityLabel={uiT("ui.custom_level_range_625a58cb")}
                  value={config.useCustomLevelRange}
                  onValueChange={(value) =>
                    updateConfig("useCustomLevelRange", value)
                  }
                  trackColor={{ false: "#767577", true: theme.secondary }}
                  thumbColor="#f4f3f4"
                />
              </View>
              {config.useCustomLevelRange ? (
                <View style={styles.levelSliders}>
                  <View style={styles.levelSliderRow}>
                    <Text
                      style={[
                        styles.levelLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {uiT("ui.min_level_4986a2df")} </Text>
                    <Text
                      style={[styles.levelValue, { color: theme.textColor }]}
                    >
                      {config.minLevel}
                    </Text>
                  </View>
                  <Slider
                    accessibilityLabel={uiT("ui.minimum_level_b7bfe49a")}
                    minimumValue={1}
                    maximumValue={maxLevel}
                    step={1}
                    value={config.minLevel}
                    onValueChange={(value) =>
                      updateConfig(
                        "minLevel",
                        Math.min(Math.round(value), config.maxLevel),
                      )
                    }
                    minimumTrackTintColor={theme.secondary}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={theme.secondary}
                  />
                  <View style={styles.levelSliderRow}>
                    <Text
                      style={[
                        styles.levelLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {uiT("ui.max_level_2833a212")} </Text>
                    <Text
                      style={[styles.levelValue, { color: theme.textColor }]}
                    >
                      {config.maxLevel}
                    </Text>
                  </View>
                  <Slider
                    accessibilityLabel={uiT("ui.maximum_level_777774aa")}
                    minimumValue={1}
                    maximumValue={maxLevel}
                    step={1}
                    value={config.maxLevel}
                    onValueChange={(value) =>
                      updateConfig(
                        "maxLevel",
                        Math.max(Math.round(value), config.minLevel),
                      )
                    }
                    minimumTrackTintColor={theme.secondary}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={theme.secondary}
                  />
                </View>
              ) : (
                <View style={styles.levelSummaryRow}>
                  <Ionicons
                    name="stats-chart"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[styles.levelLabel, { color: theme.textSecondary }]}
                  >
                    {config.selectedListIds.length > 0
                      ? uiT("ui.all_levels_in_selected_lists_426ef1c8")
                      : uiT("ui.levels_1_value_97fc00a2", {value1: (maxLevel)})}
                  </Text>
                </View>
              )}
            </View>

            <SubjectListsFilterCard
              selectedListIds={config.selectedListIds}
              onChange={updateSelectedListIds}
              subjectTypes={SUBJECT_TYPES}
              description={uiT("ui.optional_only_include_subjects_from_these_saved_lists_1d5ef2d9")}
            />

            <View
              style={[
                styles.section,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
                {uiT("ui.playback_2db1db07")} </Text>
              <Text
                style={[
                  styles.sectionDescription,
                  { color: theme.textSecondary },
                ]}
              >
                {uiT("ui.you_can_replay_the_audio_at_any_time_during_a_question_f31e750a")} </Text>
              <View
                style={[
                  styles.toggleRow,
                  styles.lastRow,
                  {
                    borderColor: config.autoPlay
                      ? theme.secondary
                      : theme.border,
                    backgroundColor: config.autoPlay
                      ? `${theme.secondary}15`
                      : "transparent",
                  },
                ]}
              >
                <Text style={[styles.toggleText, { color: theme.textColor }]}>
                  {uiT("ui.auto_play_audio_12320266")} </Text>
                <Switch
                  accessibilityLabel={uiT("ui.auto_play_audio_12320266")}
                  value={config.autoPlay}
                  onValueChange={(value) => updateConfig("autoPlay", value)}
                  trackColor={{ false: "#767577", true: theme.secondary }}
                  thumbColor="#f4f3f4"
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.stickyFooter,
          {
            backgroundColor: theme.cardBackground,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {error ? (
          <Text
            selectable
            accessibilityRole="alert"
            style={{ color: theme.error }}
          >
            {error}
          </Text>
        ) : null}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: !canStart }}
          disabled={!canStart}
          onPress={() => void start()}
          activeOpacity={0.8}
          style={[
            styles.startButton,
            {
              backgroundColor: canStart ? theme.primary : theme.border,
              opacity: canStart ? 1 : 0.7,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="play" size={24} color="white" />
              <Text style={styles.startButtonText}>{uiT("ui.start_audio_quiz_0e41476c")}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AudioVocabScreen() {
  useInterfaceLanguage();
  const userId = useAuthStore((state) => state.userData?.id);
  if (!userId)
    return (
      <View style={{ padding: 24, gap: 16 }}>
        <Text>{uiT("ui.sign_in_to_wanikani_to_practice_vocabulary_7c784720")}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text>{uiT("ui.go_back_6aadac2f")}</Text>
        </Pressable>
      </View>
    );
  return <AudioVocabScreenContent key={userId} userId={userId} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1 },
  scrollContent: { padding: 16 },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0 2px 2px rgba(0,0,0,0.08)",
  },
  sectionElevated: { boxShadow: "0 6px 10px rgba(0,0,0,0.135)" },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  sectionHeaderText: { fontSize: 12 },
  overviewTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  overviewDescription: { fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  sectionDescription: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  resumeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  options: { gap: 10 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  optionTitle: { fontSize: 14, fontWeight: "600" },
  optionDescription: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  sliderContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  countSlider: { flex: 1, height: 40 },
  sliderCount: {
    width: 52,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 40,
    fontVariant: ["tabular-nums"],
  },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: "500" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  lastRow: { marginBottom: 0 },
  toggleText: { flex: 1, fontSize: 14, fontWeight: "600" },
  levelSliders: { gap: 8 },
  levelSliderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelLabel: { fontSize: 14 },
  levelValue: {
    fontSize: 16,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  levelSummaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stickyFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    boxShadow: "0 -2px 6px rgba(0,0,0,0.2)",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 56,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  startButtonText: { color: "white", fontSize: 18, fontWeight: "600" },
});
