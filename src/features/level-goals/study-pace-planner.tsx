import { uiT, useInterfaceLanguage } from "../interface-language/runtime";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";
import { useAuthStore, useSettingsStore } from "../../utils/store";
import { useTheme } from "../../utils/theme";
import * as Haptics from "../../utils/haptics";
import {
  canAccessLevelGoals,
  createLevelGoal,
  dateAfterDays,
  localDateKey,
  replaceGoal,
  shortGoalDate,
  suggestedGoalLevel,
  type GoalProgression,
} from "./model";
import {
  planForLessons,
  planForPace,
  projectStudyWorkload,
  subjectsPerLevel,
  type PlannerAssignment,
  type PlannerSubject,
  type StudyPlan,
} from "./planner";
import { useLevelGoals } from "./use-level-goals";

type Props = {
  currentLevel: number;
  assignments: readonly PlannerAssignment[];
  subjects: readonly PlannerSubject[];
  loading?: boolean;
  paused?: boolean;
  progressions?: readonly GoalProgression[];
};

export function StudyPacePlanner(props: Props) {
  useInterfaceLanguage();
  const username = useAuthStore((state) => state.userData?.username);
  const enabled = useSettingsStore(
    (state) => state.homeStudyPacePlannerEnabled,
  );
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  if (!canAccessLevelGoals(username) || enabled !== true) return null;
  return (
    <View style={[styles.planner, { borderColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={uiT("ui.plan_your_pace_bbf6480c")}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          setOpen((value) => !value);
          void Haptics.selectionAsync();
        }}
        style={styles.toggle}
      >
        <Ionicons name="options-outline" size={18} color={theme.primary} />
        <Text style={[styles.toggleText, { color: theme.textColor }]}>
          {uiT("ui.plan_your_pace_bbf6480c")} </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={theme.textSecondary}
        />
      </Pressable>
      {open ? (
        props.loading ? (
          <Text style={[styles.note, { color: theme.textSecondary }]}>
            {uiT("ui.loading_your_study_data_200cbb31")} </Text>
        ) : (
          <PlanEditor {...props} />
        )
      ) : null}
    </View>
  );
}

export function StudyPacePlannerSetting() {
  useInterfaceLanguage();
  const username = useAuthStore((state) => state.userData?.username);
  const enabled = useSettingsStore(
    (state) => state.homeStudyPacePlannerEnabled,
  );
  const setEnabled = useSettingsStore(
    (state) => state.setHomeStudyPacePlannerEnabled,
  );
  const { theme } = useTheme();
  if (!canAccessLevelGoals(username)) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 16,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={{ color: theme.textColor, fontSize: 14, fontWeight: "600" }}
        >
          {uiT("ui.plan_your_pace_bbf6480c")} </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
          {uiT("ui.show_the_pace_planner_inside_review_forecast_6f21b78a")} </Text>
      </View>
      <Switch
        accessibilityLabel={uiT("ui.plan_your_pace_bbf6480c")}
        value={enabled === true}
        onValueChange={setEnabled}
        trackColor={{ true: theme.primary }}
      />
    </View>
  );
}

function PlanEditor({
  currentLevel,
  assignments,
  subjects,
  loading = false,
  paused = false,
  progressions = [],
}: Props) {
  useInterfaceLanguage();
  const goals = useLevelGoals();
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const lessonLimit = useSettingsStore((state) => state.dailyLessonLimit);
  const batchSize = useSettingsStore((state) => state.reviewBatchSize);
  const batchEnabled = useSettingsStore((state) => state.reviewBatchSizeEnabled);
  const count = subjectsPerLevel(subjects, currentLevel);
  const [plan, setPlan] = useState<StudyPlan>(
    () =>
      goals.state.studyPlan ??
      planForLessons(
        { daysPerLevel: 7, dailyLessons: 20, reviewBatch: batchSize },
        lessonLimit || 20,
        count,
      ),
  );
  const [fallbackAnchor] = useState(() => ({
    level: currentLevel,
    date: localDateKey(new Date(goals.state.active?.createdAt ?? goals.now)),
  }));
  const started = progressions
    .filter((row) => row.data.level === currentLevel && !row.data.abandoned_at)
    .map((row) => row.data.unlocked_at)
    .filter((date): date is string => !!date && Number.isFinite(Date.parse(date)))
    .sort().at(-1);
  const anchor = goals.state.studyPlanAnchor ?? (started
    ? { level: currentLevel, date: localDateKey(new Date(started)) }
    : fallbackAnchor);
  const [method, setMethod] = useState(false);
  const [error, setError] = useState("");
  const days = useMemo(
    () =>
      projectStudyWorkload(
        assignments,
        subjects,
        plan,
        currentLevel,
        goals.now,
        paused,
      ),
    [assignments, subjects, plan, currentLevel, goals.now, paused],
  );
  const dailyReviews = Math.ceil(
    days.slice(0, 7).reduce((sum, day) => sum + day.total, 0) / 7,
  );
  const peak = Math.max(1, ...days.map((day) => day.total));
  const target =
    goals.state.active && goals.state.active.targetLevel > currentLevel
      ? goals.state.active.targetLevel
      : suggestedGoalLevel(currentLevel, null, null, [], goals.now);
  const deadline = dateAfterDays(
    Math.max(1, target - anchor.level) * plan.daysPerLevel,
    new Date(`${anchor.date}T12:00:00`),
  );
  const savedPlan = goals.state.studyPlan;
  const matchesSavedPlan = !!savedPlan &&
    savedPlan.daysPerLevel === plan.daysPerLevel &&
    savedPlan.dailyLessons === plan.dailyLessons &&
    savedPlan.reviewBatch === plan.reviewBatch;
  const applied = matchesSavedPlan && lessonLimit === plan.dailyLessons &&
    batchEnabled && batchSize === plan.reviewBatch;
  const goalSaved = matchesSavedPlan && goals.state.active?.deadline === deadline &&
    goals.state.active.targetLevel === target;
  const change = (next: StudyPlan) => {
    setPlan(next);
    setError("");
  };
  const apply = () => {
    const previous = goals.state.studyPlan;
    const previousAnchor = goals.state.studyPlanAnchor;
    if (!goals.update((state) => ({ ...state, studyPlan: plan, studyPlanAnchor: anchor }))) return;
    try {
      // One persisted update keeps the linked settings together.
      useSettingsStore.setState({
        dailyLessonLimit: plan.dailyLessons,
        reviewBatchSizeEnabled: true,
        reviewBatchSize: plan.reviewBatch,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      goals.update((state) => ({ ...state, studyPlan: previous, studyPlanAnchor: previousAnchor }));
      setError(uiT("ui.message_ee0e6ddec6df"));
    }
  };
  const useDate = () => {
    const goal = createLevelGoal(
      {
        id: `plan-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        mode: "date",
        currentLevel,
        targetLevel: target,
        deadline,
      },
      goals.now,
    );
    if (
      goals.update((state) => ({
        ...replaceGoal(state, goal, goals.now),
        widgetHidden: false,
        studyPlan: plan,
        studyPlanAnchor: anchor,
      }))
    ) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };
  const note = { color: theme.textSecondary };
  const control = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    text: string,
    update: (value: number) => void,
    unavailable = false,
  ) => (
    <View style={styles.control}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textColor }]}>{label}</Text>
        <Text style={[styles.amount, { color: theme.primary }]}>{text}</Text>
      </View>
      <Slider
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text }}
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        disabled={unavailable || loading || paused}
        onValueChange={update}
        onSlidingComplete={() => void Haptics.selectionAsync()}
        minimumTrackTintColor={theme.primary}
        maximumTrackTintColor={theme.border}
        thumbTintColor={theme.primary}
      />
    </View>
  );
  return (
    <Animated.View
      entering={reduced ? undefined : FadeInDown.duration(200)}
      style={styles.body}
    >
      {paused ? (
        <Text style={[styles.note, note]}>
          {uiT("ui.planning_is_paused_while_you_re_on_vacation_ddc8fe33")} </Text>
      ) : null}
      <View style={styles.row}>
        <View>
          <Text style={[styles.note, note]}>{uiT("ui.target_pace_90ff5ec2")}</Text>
          <Text style={[styles.pace, { color: theme.textColor }]}>
            {plan.daysPerLevel}
            <Text style={styles.unit}> {uiT("ui.days_level_da5af76e")}</Text>
          </Text>
        </View>
        {currentLevel < 60 ? (
          <View style={styles.destination}>
            <Text style={[styles.note, note]}>
              {uiT("ui.reach_level_d56d335b")} {target} {uiT("ui.pace_estimate_8c674310")} </Text>
            <Text style={[styles.amount, { color: theme.textColor }]}>
              {shortGoalDate(deadline)}
            </Text>
          </View>
        ) : null}
      </View>
      {currentLevel < 60 ? (
        <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/level-goal")}>
          <Text style={{ color: theme.primary, paddingVertical: 8 }}>{uiT("ui.set_a_level_goal_35a5d703")}</Text>
        </Pressable>
      ) : null}
      <Text style={[styles.note, note]}>
        {uiT("ui.reaching_level_785af16c")} {target} {uiT("ui.means_unlocking_the_start_of_that_level_the_pace_estimate_is_anch_f63344f1")} {shortGoalDate(anchor.date)}{uiT("ui.it_is_a_target_not_a_guaranteed_level_up_date_93693fcf")} </Text>
      <View style={styles.presets}>
        {[7, 14, 30].map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{
              selected: plan.daysPerLevel === value,
              disabled: !count || loading || paused || currentLevel >= 60,
            }}
            disabled={!count || loading || paused || currentLevel >= 60}
            onPress={() => {
              change(planForPace(plan, value, count));
              void Haptics.selectionAsync();
            }}
            style={[
              styles.preset,
              {
                borderColor:
                  plan.daysPerLevel === value ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={{
                color:
                  plan.daysPerLevel === value
                    ? theme.primary
                    : theme.textSecondary,
              }}
            >
              {value === 7 ? uiT("ui.a_week_a2f81034") : value === 14 ? uiT("ui.two_weeks_1f6f5a8c") : uiT("ui.a_month_c46731af")}
            </Text>
          </Pressable>
        ))}
      </View>
      {control(
        "Days per level",
        plan.daysPerLevel,
        3,
        Math.max(60, plan.daysPerLevel),
        1,
        `${plan.daysPerLevel} days`,
        (value) => change(planForPace(plan, value, count)),
        !count || currentLevel >= 60,
      )}
      {control(
        "Daily lessons",
        plan.dailyLessons,
        1,
        50,
        1,
        `${plan.dailyLessons} / day`,
        (value) => change(planForLessons(plan, value, count)),
      )}
      {control(
        "Reviews per session",
        plan.reviewBatch,
        5,
        100,
        5,
        `${plan.reviewBatch} items`,
        (value) => change({ ...plan, reviewBatch: value }),
      )}
      <Text style={[styles.note, note]}>
        {count
          ? uiT("ui.about_value_subjects_level_value_days_to_cover_at_this_lesson_pac_87e31edb", {value1: (count), value2: (Math.ceil(count / plan.dailyLessons))})
          : loading
            ? uiT("ui.loading_your_level_subjects_ad9be55a")
            : uiT("ui.level_subjects_are_unavailable_workload_preview_is_still_availabl_caf3d48e")}
      </Text>
      <View accessibilityLiveRegion="polite">
        <Text
          testID="planner-workload"
          style={[styles.workload, { color: theme.textColor }]}
        >
          ~{dailyReviews}
          <Text style={styles.unit}> {uiT("ui.reviews_day_16577c1c")}</Text>
        </Text>
        <Text style={[styles.note, note]}>
          ~{Math.ceil(dailyReviews / plan.reviewBatch)} {uiT("ui.sessions_next_7_days_a073d8d3")} </Text>
      </View>
      <View style={styles.chart}>
        {days.map((day, i) => (
          <View
            key={day.date}
            accessible
            accessibilityLabel={uiT("ui.dynamic_63048be455c8", {value1: (shortGoalDate(day.date)), value2: (day.total), value3: (day.known)})}
            style={styles.column}
          >
            <View style={styles.bar}>
              <View
                style={{
                  height: (day.existing / peak) * 80,
                  backgroundColor: theme.primary,
                  width: "100%",
                }}
              />
              <View
                style={{
                  height: (day.lessons / peak) * 80,
                  backgroundColor: theme.textSecondary,
                  opacity: 0.4,
                  width: "100%",
                }}
              />
            </View>
            <Text style={[styles.axis, note]}>
              {i === 0 ? uiT("ui.today_2b065c7c") : i === 6 ? uiT("ui.7d_a7c74264") : i === 13 ? uiT("ui.14d_b87aba7e") : ""}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={[styles.note, { color: theme.primary }]}>
          {uiT("ui.existing_items_248bb2f0")} </Text>
        <Text style={[styles.note, note]}>{uiT("ui.new_lessons_15fa3bc1")}</Text>
        <Text style={[styles.note, note]}>
          {uiT("ui.peak_a57feec7")} {Math.max(...days.map((day) => day.total))}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: method }}
        onPress={() => setMethod((value) => !value)}
        style={styles.method}
      >
        <Text style={[styles.note, note]}>
          {uiT("ui.how_estimates_work_95ffd4ca")} {method ? "−" : "+"}
        </Text>
      </Pressable>
      {method ? (
        <Text style={[styles.note, note]}>
          {uiT("ui.assumes_correct_on_time_reviews_and_enough_unlocked_lessons_each_bf02ced0")} </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={loading || paused}
        accessibilityState={{ disabled: loading || paused }}
        onPress={apply}
        style={[
          styles.apply,
          {
            backgroundColor: theme.primary,
            opacity: loading || paused ? 0.5 : 1,
          },
        ]}
      >
        <Text style={styles.applyText}>
          {applied ? uiT("ui.plan_applied_3b26e52d") : uiT("ui.apply_daily_plan_4c626bee")}
        </Text>
      </Pressable>
      {currentLevel < 60 ? (
        <Pressable
          accessibilityRole="button"
          disabled={loading || paused || !count}
          accessibilityState={{ disabled: loading || paused || !count }}
          onPress={useDate}
          style={styles.dateAction}
        >
          <Text style={{ color: theme.primary }}>
            {goalSaved ? uiT("ui.goal_date_updated_0e7b2b63") : uiT("ui.use_date_for_my_goal_9fe216ff")}
          </Text>
        </Pressable>
      ) : null}
      <Text style={[styles.note, note]}>
        {uiT("ui.apply_sets_your_daily_lesson_limit_and_review_session_size_schedu_1be564ce")} </Text>
      {goals.error || error ? (
        <Text accessibilityRole="alert" style={{ color: theme.error }}>
          {error || goals.error}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  planner: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
    paddingTop: 4,
  },
  toggle: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    minHeight: 48,
  },
  toggleText: { flex: 1, fontSize: 15, fontWeight: "600" },
  body: { gap: 12, paddingBottom: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  destination: { alignItems: "flex-end", gap: 6 },
  pace: { fontSize: 34, fontWeight: "700", fontVariant: ["tabular-nums"] },
  unit: { fontSize: 12, fontWeight: "500" },
  note: { fontSize: 12, lineHeight: 18 },
  label: { fontSize: 13 },
  amount: { fontSize: 14, fontWeight: "600", fontVariant: ["tabular-nums"] },
  presets: { flexDirection: "row", gap: 8 },
  preset: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  control: { gap: 6 },
  workload: { fontSize: 25, fontWeight: "700", fontVariant: ["tabular-nums"] },
  chart: { flexDirection: "row", gap: 4 },
  column: { flex: 1, alignItems: "center" },
  bar: { height: 80, width: "100%", justifyContent: "flex-end" },
  axis: { fontSize: 8, minHeight: 16, marginTop: 4 },
  legend: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  method: { minHeight: 32, justifyContent: "center" },
  apply: {
    minHeight: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  applyText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  dateAction: { minHeight: 36, justifyContent: "center", alignItems: "center" },
});
