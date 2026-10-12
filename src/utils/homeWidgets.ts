import { uiT } from "../features/interface-language/runtime";
export type HomeWidgetId =
  | "lessonsReviews"
  | "recentMistakes"
  | "streak"
  | "extraStudy"
  | "subjectLists"
  | "reviewForecast"
  | "levelProgress"
  | "incompleteLevels"
  | "recentUnlocks"
  | "criticalItems"
  | "burnedItems"
  | "reviewHeatmap"
  | "levelTiming"
  | "reviewStats"
  | "dailyStudyActivity"
  | "studyTime"
  | "srsBreakdown";

export type HomeWidgetSourceTab = "home" | "level" | "items" | "analytics";

export type HomeWidgetDefinition = {
  id: HomeWidgetId;
  title: string;
  description: string;
  sourceTab: HomeWidgetSourceTab;
};

export const HOME_WIDGET_DEFINITIONS: HomeWidgetDefinition[] = [
  {
    id: "lessonsReviews",
    get title() { return uiT("ui.lessons_reviews_e151a683"); },
    get description() { return uiT("ui.your_main_study_queue_cards_399b915a"); },
    sourceTab: "home",
  },
  {
    id: "recentMistakes",
    get title() { return uiT("ui.recent_mistakes_32bab730"); },
    get description() { return uiT("ui.quickly_revisit_recent_wrong_answers_84497d0a"); },
    sourceTab: "home",
  },
  {
    id: "streak",
    get title() { return uiT("ui.usage_streak_b283dbf9"); },
    get description() { return uiT("ui.track_your_current_and_longest_streaks_da42af34"); },
    sourceTab: "home",
  },
  {
    id: "extraStudy",
    get title() { return uiT("ui.extra_study_055dce81"); },
    get description() { return uiT("ui.practice_modes_that_do_not_affect_srs_064cbd41"); },
    sourceTab: "home",
  },
  {
    id: "subjectLists",
    get title() { return uiT("ui.subject_lists_20c1f7d1"); },
    get description() { return uiT("ui.entry_point_to_saved_study_collections_0ff53444"); },
    sourceTab: "home",
  },
  {
    id: "reviewForecast",
    get title() { return uiT("ui.review_forecast_57fb811d"); },
    get description() { return uiT("ui.upcoming_review_load_by_day_and_hour_3150cd3b"); },
    sourceTab: "home",
  },
  {
    id: "levelProgress",
    get title() { return uiT("ui.level_progress_ba170312"); },
    get description() { return uiT("ui.current_level_progress_with_kanji_blocks_b118c02b"); },
    sourceTab: "level",
  },
  {
    id: "incompleteLevels",
    get title() { return uiT("ui.incomplete_levels_c9927daf"); },
    get description() { return uiT("ui.track_unfinished_previous_levels_1bcde86a"); },
    sourceTab: "level",
  },
  {
    id: "recentUnlocks",
    get title() { return uiT("ui.recent_unlocks_1f1ca2e9"); },
    get description() { return uiT("ui.items_unlocked_recently_45556686"); },
    sourceTab: "items",
  },
  {
    id: "criticalItems",
    get title() { return uiT("ui.critical_items_759959bc"); },
    get description() { return uiT("ui.items_currently_in_critical_condition_ebf5d5c7"); },
    sourceTab: "items",
  },
  {
    id: "burnedItems",
    get title() { return uiT("ui.burned_items_31cc6883"); },
    get description() { return uiT("ui.recently_burned_items_and_progress_c7964fe4"); },
    sourceTab: "items",
  },
  {
    id: "reviewHeatmap",
    get title() { return uiT("ui.review_heatmap_6bc0befc"); },
    get description() { return uiT("ui.yearly_activity_heatmap_ea41aaac"); },
    sourceTab: "analytics",
  },
  {
    id: "levelTiming",
    get title() { return uiT("ui.level_timing_9276ad6d"); },
    get description() { return uiT("ui.how_fast_each_level_was_completed_6fd644fd"); },
    sourceTab: "analytics",
  },
  {
    id: "reviewStats",
    get title() { return uiT("ui.review_stats_b168a57c"); },
    get description() { return uiT("ui.accuracy_and_review_totals_4a031952"); },
    sourceTab: "analytics",
  },
  {
    id: "dailyStudyActivity",
    get title() { return uiT("ui.today_s_study_b94528a7"); },
    get description() { return uiT("ui.lessons_and_reviews_completed_today_0ca55444"); },
    sourceTab: "analytics",
  },
  {
    id: "studyTime",
    get title() { return uiT("ui.study_time_697f7732"); },
    get description() { return uiT("ui.device_tracked_time_spent_studying_today_be3d415d"); },
    sourceTab: "analytics",
  },
  {
    id: "srsBreakdown",
    get title() { return uiT("ui.srs_breakdown_d54333b2"); },
    get description() { return uiT("ui.distribution_across_srs_stages_0e23bed9"); },
    sourceTab: "analytics",
  },
];

export const DEFAULT_HOME_WIDGET_ORDER: HomeWidgetId[] = [
  "lessonsReviews",
  "recentMistakes",
  "streak",
  "extraStudy",
  "reviewForecast",
];

const VALID_HOME_WIDGET_IDS = new Set<HomeWidgetId>(
  HOME_WIDGET_DEFINITIONS.map((widget) => widget.id),
);

export function isHomeWidgetId(value: unknown): value is HomeWidgetId {
  return (
    typeof value === "string" &&
    VALID_HOME_WIDGET_IDS.has(value as HomeWidgetId)
  );
}

export function normalizeHomeWidgetOrder(
  value: unknown,
  fallback = DEFAULT_HOME_WIDGET_ORDER,
): HomeWidgetId[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const unique: HomeWidgetId[] = [];

  value.forEach((entry) => {
    if (!isHomeWidgetId(entry)) {
      return;
    }

    if (!unique.includes(entry)) {
      unique.push(entry);
    }
  });

  if (unique.length === 0) {
    return [...fallback];
  }

  if (!unique.includes("lessonsReviews")) {
    unique.unshift("lessonsReviews");
  }

  return unique;
}
