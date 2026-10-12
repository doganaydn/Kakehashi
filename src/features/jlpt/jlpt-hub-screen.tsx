import { uiT, useInterfaceLanguage } from "../interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../utils/store";
import { withAlpha } from "../../utils/subjectColors";
import { useTheme } from "../../utils/theme";
import {
  approximateMockQuestionCount,
  JLPT_LEVELS,
  JLPT_MOCK_STRUCTURES,
  type JlptLevel,
  type JlptQuizMode,
  type JlptSession,
} from "./domain";
import { clearNativeJlptSession, loadNativeJlptSession } from "./storage";

const LEVEL_COPY: Record<JlptLevel, { label: string; summary: string }> = {
  N5: {
    get label() { return uiT("ui.foundation_df42a4d5"); },
    summary:
      "Basic words, sentence patterns, notices, and short everyday exchanges.",
  },
  N4: {
    get label() { return uiT("ui.elementary_362c3c09"); },
    summary:
      "Familiar daily situations, broader vocabulary, and connected reading.",
  },
  N3: {
    get label() { return uiT("ui.bridge_3892e103"); },
    summary:
      "Natural everyday Japanese, longer texts, and more nuanced grammar.",
  },
  N2: {
    get label() { return uiT("ui.upper_intermediate_6851499e"); },
    summary:
      "Articles, argument structure, and varied natural-speed listening.",
  },
  N1: {
    get label() { return uiT("ui.advanced_9f088dbe"); },
    summary: "Abstract reasoning, precise usage, and dense spoken information.",
  },
};

function sessionLabel(session: JlptSession) {
  if (session.mode === "mock") return uiT("ui.mock_exam_5809519f");
  if (session.mode === "weak") return uiT("ui.weak_area_practice_eaa7dbfd");
  return uiT("ui.quick_quiz_51f61b1f");
}

function statusLabel(session: JlptSession) {
  if (session.status === "complete") return uiT("ui.results_ready_8602e1b7");
  if (session.status === "section-complete") return uiT("ui.section_complete_77941541");
  if (session.status === "paused") return uiT("ui.paused_e159b061");
  return uiT("ui.in_progress_c1f88e9d");
}

export function JlptHubScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const userData = useAuthStore((state) => state.userData);
  const scope = userData?.id ?? userData?.username ?? "anonymous";
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel>("N5");
  const [immediateFeedback, setImmediateFeedback] = useState(true);
  const [savedSession, setSavedSession] = useState<JlptSession | null>(null);
  const compact = width < 400;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadNativeJlptSession(scope).then((session) => {
        if (!active) return;
        setSavedSession(session);
        if (session) setSelectedLevel(session.level);
      });
      return () => {
        active = false;
      };
    }, [scope]),
  );

  const structure = JLPT_MOCK_STRUCTURES[selectedLevel];
  const totalMinutes = useMemo(
    () =>
      structure.sections.reduce(
        (total, section) => total + section.durationMinutes,
        0,
      ),
    [structure.sections],
  );

  const openSession = (params: {
    mode?: Exclude<JlptQuizMode, "weak">;
    resume?: "true";
  }) => {
    router.push({
      pathname: "/jlpt-session" as any,
      params: {
        ...params,
        level: selectedLevel,
        feedback: immediateFeedback ? "true" : "false",
      },
    });
  };

  const start = (mode: Exclude<JlptQuizMode, "weak">) => {
    if (savedSession && savedSession.status !== "complete") {
      Alert.alert(
        uiT("ui.replace_saved_jlpt_session_ba888129"),
        uiT("ui.starting_a_new_session_will_replace_the_attempt_currently_saved_o_4026c2a6"),
        [
          { text: uiT("ui.cancel_19766ed6"), style: "cancel" },
          {
            text: uiT("ui.start_new_2fd15a17"),
            style: "destructive",
            onPress: () => openSession({ mode }),
          },
        ],
      );
      return;
    }
    openSession({ mode });
  };

  const discard = () => {
    Alert.alert(
      uiT("ui.discard_saved_jlpt_session_405d48eb"),
      uiT("ui.the_answers_in_this_attempt_will_be_removed_518f55ba"),
      [
        { text: uiT("ui.cancel_19766ed6"), style: "cancel" },
        {
          text: uiT("ui.discard_eb1a70e3"),
          style: "destructive",
          onPress: () => {
            void clearNativeJlptSession(scope).then(() =>
              setSavedSession(null),
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.backgroundColor }]}
      edges={["top"]}
    >
      <StatusBar style={theme.statusBarStyle} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        style={styles.scroll}
        testID="jlpt-hub"
      >
        <View style={styles.navigationRow}>
          <Pressable
            accessibilityLabel={uiT("ui.back_76900f1b")}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              { borderColor: theme.border, opacity: pressed ? 0.55 : 1 },
            ]}
          >
            <Ionicons name="arrow-back" size={21} color={theme.textColor} />
          </Pressable>
          <View
            style={[
              styles.researchPill,
              {
                borderColor: theme.border,
                backgroundColor: theme.cardBackground,
              },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={theme.primary}
            />
            <Text style={[styles.researchText, { color: theme.textSecondary }]}>
              {uiT("ui.format_researched_f3867601")} </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>
            {uiT("ui.japanese_proficiency_b49e8079")} </Text>
          <Text style={[styles.title, { color: theme.textColor }]}>
            {uiT("ui.jlpt_quiz_5280ece2")} </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {uiT("ui.original_questions_shaped_around_each_level_s_published_item_type_7738364d")} </Text>
        </View>

        {savedSession ? (
          <View
            accessibilityLabel={uiT("ui.saved_jlpt_session_de5ea5d8")}
            style={[
              styles.resumeCard,
              {
                backgroundColor: withAlpha(
                  theme.primary,
                  theme.isDark ? 0.12 : 0.08,
                ),
                borderColor: withAlpha(theme.primary, 0.55),
              },
            ]}
          >
            <View
              style={[styles.resumeIcon, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="time-outline" size={21} color="#fff" />
            </View>
            <View style={styles.resumeCopy}>
              <Text style={[styles.resumeTitle, { color: theme.textColor }]}>
                {savedSession.level} {sessionLabel(savedSession)}
              </Text>
              <Text style={[styles.resumeMeta, { color: theme.textSecondary }]}>
                {statusLabel(savedSession)} · {savedSession.answers.length} {uiT("ui.of_28391d3b")}{" "}
                {savedSession.sectionQuestionIds.flat().length} {uiT("ui.answered_68c780cd")} </Text>
            </View>
            <View style={styles.resumeActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => openSession({ resume: "true" })}
                style={({ pressed }) => [
                  styles.smallPrimaryButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text style={styles.smallPrimaryText}>
                  {savedSession.status === "complete" ? uiT("ui.results_219c4a6c") : uiT("ui.resume_d640c742")}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={discard}
              >
                <Text
                  style={[styles.discardText, { color: theme.textSecondary }]}
                >
                  {uiT("ui.discard_eb1a70e3")} </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionHeading}>
          <Text style={[styles.step, { color: theme.primary }]}>01</Text>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.choose_a_level_441530f4")} </Text>
        </View>
        <View style={[styles.levelPicker, { borderColor: theme.border }]}>
          {JLPT_LEVELS.map((level, index) => {
            const selected = selectedLevel === level;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={level}
                onPress={() => setSelectedLevel(level)}
                testID={`jlpt-level-${level}`}
                style={({ pressed }) => [
                  styles.levelOption,
                  index > 0 && {
                    borderLeftWidth: StyleSheet.hairlineWidth,
                    borderLeftColor: theme.border,
                  },
                  selected && { backgroundColor: theme.primary },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Text
                  style={[
                    styles.levelName,
                    { color: selected ? "#fff" : theme.textColor },
                  ]}
                >
                  {level}
                </Text>
                {!compact ? (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.levelLabel,
                      {
                        color: selected
                          ? "rgba(255,255,255,0.82)"
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    {LEVEL_COPY[level].label}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.levelSummary}>
          <Text style={[styles.levelSummaryTitle, { color: theme.textColor }]}>
            {selectedLevel} · {LEVEL_COPY[selectedLevel].label}
          </Text>
          <Text
            style={[styles.levelSummaryText, { color: theme.textSecondary }]}
          >
            {LEVEL_COPY[selectedLevel].summary}
          </Text>
        </View>

        <View style={[styles.sectionHeading, styles.sessionHeading]}>
          <Text style={[styles.step, { color: theme.primary }]}>02</Text>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.choose_a_session_b40f3be5")} </Text>
        </View>

        <View
          style={[
            styles.modeCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: withAlpha(theme.primary, 0.55),
            },
          ]}
        >
          <View style={styles.modeTopline}>
            <Ionicons name="sparkles-outline" size={18} color={theme.primary} />
            <Text style={[styles.modeKicker, { color: theme.primary }]}>
              {uiT("ui.5_10_minutes_72e342f3")} </Text>
          </View>
          <Text style={[styles.modeTitle, { color: theme.textColor }]}>
            {uiT("ui.quick_quiz_ef77f1d2")} </Text>
          <Text
            style={[styles.modeDescription, { color: theme.textSecondary }]}
          >
            {uiT("ui.ten_randomized_unseen_first_questions_across_kanji_vocabulary_gra_f9204f24")} </Text>
          <View style={[styles.settingRow, { borderColor: theme.border }]}>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: theme.textColor }]}>
                {uiT("ui.immediate_feedback_1bc72b4f")} </Text>
              <Text
                style={[styles.settingSubtitle, { color: theme.textSecondary }]}
              >
                {uiT("ui.show_the_answer_and_explanation_after_each_response_957cad83")} </Text>
            </View>
            <Switch
              accessibilityLabel={uiT("ui.immediate_feedback_1bc72b4f")}
              value={immediateFeedback}
              onValueChange={setImmediateFeedback}
              trackColor={{
                false: theme.border,
                true: withAlpha(theme.primary, 0.55),
              }}
              thumbColor={immediateFeedback ? theme.primary : theme.textLight}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => start("quick")}
            testID="jlpt-start-quick"
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.76 : 1 },
            ]}
          >
            <Text style={styles.primaryButtonText}>{uiT("ui.start_quick_quiz_50789c8c")}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>

        <View
          style={[
            styles.modeCard,
            styles.mockCard,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.modeTopline}>
            <Ionicons name="timer-outline" size={18} color={theme.secondary} />
            <Text style={[styles.modeKicker, { color: theme.secondary }]}>
              {uiT("ui.timed_dc7d4d9f")} {totalMinutes} {uiT("ui.minutes_9073b10d")} </Text>
          </View>
          <Text style={[styles.modeTitle, { color: theme.textColor }]}>
            {uiT("ui.representative_mock_exam_f750843c")} </Text>
          <Text
            style={[styles.modeDescription, { color: theme.textSecondary }]}
          >
            {uiT("ui.about_4efca0d1")} {approximateMockQuestionCount(selectedLevel)} {uiT("ui.questions_in_the_published_381c35b7")} {selectedLevel} {uiT("ui.section_order_answers_remain_locked_until_the_end_11333495")} </Text>
          <View style={styles.timeline}>
            {structure.sections.map((section, index) => (
              <View key={section.id} style={styles.timelineRow}>
                <View
                  style={[styles.timelineNumber, { borderColor: theme.border }]}
                >
                  <Text
                    style={[
                      styles.timelineNumberText,
                      { color: theme.textColor },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.timelineCopy}>
                  <Text
                    style={[styles.timelineTitle, { color: theme.textColor }]}
                  >
                    {section.shortTitle}
                  </Text>
                  <Text
                    style={[
                      styles.timelineTime,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {section.durationMinutes} {uiT("ui.minutes_90e63d85")} </Text>
                </View>
              </View>
            ))}
          </View>
          <View style={[styles.mockNote, { borderColor: theme.border }]}>
            <Ionicons
              name="headset-outline"
              size={16}
              color={theme.textSecondary}
            />
            <Text style={[styles.mockNoteText, { color: theme.textSecondary }]}>
              {uiT("ui.listening_plays_once_in_mock_mode_pause_resume_is_a_kakehashi_acc_fda638a2")} </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => start("mock")}
            testID="jlpt-start-mock"
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.secondary, opacity: pressed ? 0.76 : 1 },
            ]}
          >
            <Text style={styles.primaryButtonText}>{uiT("ui.start_timed_mock_58eeb885")}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={[styles.bankNote, { borderTopColor: theme.border }]}>
          <Ionicons
            name="shuffle-outline"
            size={17}
            color={theme.textSecondary}
          />
          <Text style={[styles.bankNoteText, { color: theme.textSecondary }]}>
            {uiT("ui.each_available_item_type_has_200_controlled_renderings_new_semant_dddc8c2d")} </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 44 },
  navigationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 52,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  researchPill: {
    minHeight: 34,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  researchText: { fontSize: 12, fontWeight: "600" },
  hero: { paddingTop: 22, paddingBottom: 26 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: {
    fontSize: 42,
    lineHeight: 47,
    fontWeight: "800",
    letterSpacing: -1.4,
  },
  subtitle: { fontSize: 16, lineHeight: 23, marginTop: 10, maxWidth: 570 },
  resumeCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 28,
  },
  resumeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  resumeCopy: { flex: 1, minWidth: 0 },
  resumeTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  resumeMeta: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  resumeActions: { alignItems: "center", gap: 8 },
  smallPrimaryButton: {
    minHeight: 36,
    borderRadius: 10,
    paddingHorizontal: 13,
    justifyContent: "center",
  },
  smallPrimaryText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  discardText: { fontSize: 12, fontWeight: "600" },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 13,
  },
  sessionHeading: { marginTop: 31 },
  step: { fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  sectionTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  levelPicker: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 13,
    overflow: "hidden",
    minHeight: 66,
  },
  levelOption: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
    paddingVertical: 9,
  },
  levelName: { fontSize: 20, fontWeight: "800" },
  levelLabel: { fontSize: 9, marginTop: 2, maxWidth: "96%" },
  levelSummary: { paddingTop: 12 },
  levelSummaryTitle: { fontSize: 14, fontWeight: "700" },
  levelSummaryText: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  modeCard: { borderWidth: 1, borderRadius: 18, padding: 18 },
  mockCard: { marginTop: 14 },
  modeTopline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 14,
  },
  modeKicker: { fontSize: 12, fontWeight: "800", letterSpacing: 0.8 },
  modeTitle: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  modeDescription: { fontSize: 14, lineHeight: 21, marginTop: 7 },
  settingRow: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 14,
    marginVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingCopy: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: "700" },
  settingSubtitle: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  primaryButton: {
    minHeight: 52,
    borderRadius: 13,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  timeline: { gap: 10, marginVertical: 17 },
  timelineRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  timelineNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineNumberText: { fontSize: 12, fontWeight: "800" },
  timelineCopy: { flex: 1 },
  timelineTitle: { fontSize: 13, fontWeight: "700" },
  timelineTime: { fontSize: 12, marginTop: 1 },
  mockNote: {
    borderTopWidth: 1,
    paddingTop: 13,
    marginBottom: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  mockNoteText: { flex: 1, fontSize: 12, lineHeight: 17 },
  bankNote: {
    borderTopWidth: 1,
    marginTop: 26,
    paddingTop: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  bankNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
