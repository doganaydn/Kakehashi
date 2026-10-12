import { uiPluralSuffix, uiT, useInterfaceLanguage } from "../features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ColorValue,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { withAlpha } from "../utils/subjectColors";
import { useSettingsStore } from "../utils/store";
import { useTheme } from "../utils/theme";
import {
  DEFAULT_WIDGET_CARD_STYLE_COLORS,
  normalizeWidgetCardColor,
} from "../utils/widgetCardStyles";
import { isAssignmentInReviewQueueState } from "../utils/api";
import { type LessonSrsThresholdStatus } from "../utils/lessonSrsThreshold";
import { getEnabledReviewPreset, type ReviewPreset } from "../utils/review-presets";
import { getReviewOrderLabel } from "../utils/reviewOrdering";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth > 768;

type LessonsReviewsCardProps = {
  type: "lessons" | "reviews";
  count: number;
  pendingSyncCount?: number;
  totalLessonCount?: number; // Total available lessons before daily-cap filtering
  onPress: (preset?: ReviewPreset) => void;
  onLessonPicker?: () => void; // Optional callback for lesson picker
  hasResumableLessonSession?: boolean;
  isDone?: boolean;
  isDailyLimitReached?: boolean; // Optional flag to indicate lessons are blocked by daily cap
  lessonSrsThresholdStatus?: LessonSrsThresholdStatus;
  nextLessonTime?: string; // Optional timestamp for next available lesson
  nextReviewTime?: string; // Optional timestamp for next available review
  currentLevel?: number;
  subjects?: any[];
  assignments?: any[];
};

export default function LessonsReviewsCard({
  type,
  count,
  pendingSyncCount: pendingSyncCountProp = 0,
  totalLessonCount,
  onPress,
  onLessonPicker,
  hasResumableLessonSession = false,
  isDone,
  isDailyLimitReached,
  lessonSrsThresholdStatus,
  nextLessonTime,
  nextReviewTime,
  currentLevel,
  subjects,
  assignments,
}: LessonsReviewsCardProps) {
  useInterfaceLanguage();
  const { theme, themeMode } = useTheme();
  const reviewBatchSizeEnabled = useSettingsStore((state) => state.reviewBatchSizeEnabled);
  const reviewBatchSize = useSettingsStore((state) => state.reviewBatchSize);
  const reviewPresetsEnabled = useSettingsStore((state) => state.reviewPresetsEnabled);
  const reviewPresets = useSettingsStore((state) => state.reviewPresets);
  const reviewOrder = useSettingsStore((state) => state.reviewOrder);
  const [selectedPresetId, setSelectedPresetId] = React.useState<string | null>(null);
  const widgetLessonCardFollowTheme = useSettingsStore(
    (state) => state.widgetLessonCardFollowTheme
  );
  const widgetReviewCardFollowTheme = useSettingsStore(
    (state) => state.widgetReviewCardFollowTheme
  );
  const widgetLessonCardGradientStart = useSettingsStore(
    (state) => state.widgetLessonCardGradientStart
  );
  const widgetLessonCardGradientEnd = useSettingsStore(
    (state) => state.widgetLessonCardGradientEnd
  );
  const widgetReviewCardGradientStart = useSettingsStore(
    (state) => state.widgetReviewCardGradientStart
  );
  const widgetReviewCardGradientEnd = useSettingsStore(
    (state) => state.widgetReviewCardGradientEnd
  );
  const isLessons = type === "lessons";
  const lessonsBlockedBySrsThreshold =
    isLessons && Boolean(lessonSrsThresholdStatus?.isBlocked);
  const canResumeLessonSession =
    isLessons && hasResumableLessonSession && !lessonsBlockedBySrsThreshold;
  const pendingSyncCount = Math.max(0, pendingSyncCountProp);
  // Dashboard counts already exclude pending offline progress IDs.
  const displayCount = Math.max(0, count);
  const followsTheme = isLessons
    ? widgetLessonCardFollowTheme
    : widgetReviewCardFollowTheme;
  const totalAvailableLessons = isLessons
    ? Math.max(0, totalLessonCount ?? count)
    : displayCount;
  const lessonsBlockedByDailyLimit =
    isLessons &&
    Boolean(isDailyLimitReached) &&
    displayCount === 0 &&
    !canResumeLessonSession;
  const canStartSession =
    displayCount > 0 || canResumeLessonSession;
  const showsPresets = !isLessons && canStartSession && reviewBatchSizeEnabled && reviewPresetsEnabled && reviewPresets.length > 0;
  const selectedPreset = showsPresets ? getEnabledReviewPreset({ reviewBatchSizeEnabled, reviewPresetsEnabled, reviewPresets }, selectedPresetId) : null;
  const sessionSize = Math.min(displayCount, selectedPreset?.batchSize ?? reviewBatchSize);
  const canShowLessonPicker =
    isLessons &&
    Boolean(onLessonPicker) &&
    totalAvailableLessons > 0 &&
    !lessonsBlockedBySrsThreshold;
  const isGrayedOut =
    !canResumeLessonSession &&
    ((isLessons &&
      (Boolean(isDone) ||
        Boolean(isDailyLimitReached) ||
        lessonsBlockedBySrsThreshold)) ||
      displayCount === 0);
  const srsThresholdSubtitle = React.useMemo(() => {
    if (!lessonsBlockedBySrsThreshold || !lessonSrsThresholdStatus) {
      return null;
    }

    const exceededGroups: {
      label: string;
      count: number;
      threshold: number;
    }[] = [];
    if (lessonSrsThresholdStatus.apprenticeExceeded) {
      exceededGroups.push({
        label: "Apprentice",
        count: lessonSrsThresholdStatus.apprenticeCount,
        threshold: lessonSrsThresholdStatus.apprenticeThreshold,
      });
    }
    if (lessonSrsThresholdStatus.guruExceeded) {
      exceededGroups.push({
        label: "Guru",
        count: lessonSrsThresholdStatus.guruCount,
        threshold: lessonSrsThresholdStatus.guruThreshold,
      });
    }

    if (exceededGroups.length === 1) {
      const [group] = exceededGroups;
      return uiT("ui.dynamic_f6b5a767d037", {value1: (group.label), value2: (group.count), value3: (group.threshold)});
    }

    return uiT("ui.dynamic_0209f0384f4b", {value1: (exceededGroups
      .map((group) => `${group.label} (${group.count}/${group.threshold})`)
      .join(" and "))});
  }, [lessonSrsThresholdStatus, lessonsBlockedBySrsThreshold]);
  const pendingSyncLabel = pendingSyncCount
    ? uiT("ui.dynamic_938c4ed9111a", {value1: (pendingSyncCount), value2: (isLessons ? uiT("ui.lesson_b78e5875") : uiT("ui.review_c97ace4c")), value3: (pendingSyncCount === 1 ? "" : uiPluralSuffix("s"))})
    : null;
  const hasCriticalReviews = React.useMemo(() => {
    if (
      isLessons ||
      !displayCount ||
      !currentLevel ||
      !Array.isArray(subjects) ||
      !Array.isArray(assignments) ||
      subjects.length === 0 ||
      assignments.length === 0
    ) {
      return false;
    }

    const nowMs = Date.now();
    const subjectMap = new Map(subjects.map((subject) => [subject?.id, subject]));

    return assignments.some((assignment) => {
      if (!isAssignmentInReviewQueueState(assignment?.data)) {
        return false;
      }

      const availableAtMs = Date.parse(assignment.data.available_at);
      if (Number.isNaN(availableAtMs) || availableAtMs > nowMs) {
        return false;
      }

      const subject = subjectMap.get(assignment.data.subject_id);
      if (!subject) {
        return false;
      }

      if (subject.data?.level !== currentLevel) {
        return false;
      }

      if (subject.object !== "radical" && subject.object !== "kanji") {
        return false;
      }

      return (
        typeof assignment.data.srs_stage === "number" &&
        assignment.data.srs_stage >= 1 &&
        assignment.data.srs_stage <= 4
      );
    });
  }, [assignments, currentLevel, displayCount, isLessons, subjects]);
  const reviewCountBadgeBorderColor =
    !isLessons && hasCriticalReviews
      ? themeMode === "sepia"
        ? "#A8402F"
        : theme.error
      : "transparent";
  const renderLessonPickerButton = () => {
    if (!canShowLessonPicker || !onLessonPicker) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={onLessonPicker}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="options-outline" size={16} color="white" />
        <Text style={styles.pickerButtonText}>{uiT("ui.lesson_picker_398f685b")}</Text>
      </TouchableOpacity>
    );
  };

  // Format next lesson/review time if provided
  const formatNextTime = (timestamp?: string) => {
    if (!timestamp) return null;

    const now = new Date();
    const nextTime = new Date(timestamp);
    const diffMs = nextTime.getTime() - now.getTime();

    // Calculate time units
    const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    const remainingMinutes = diffMinutes % 60;

    if (diffDays > 0) {
      return uiT("ui.dynamic_42cadca5722c", {value1: (diffDays), value2: (remainingHours)});
    } else if (diffHours > 0) {
      return uiT("ui.dynamic_ec6446fc39d3", {value1: (diffHours), value2: (remainingMinutes)});
    } else if (diffMinutes > 0) {
      return uiT("ui.dynamic_0748c4e9cd65", {value1: (diffMinutes)});
    } else {
      return `Coming soon`;
    }
  };

  const getGradientColors = (): readonly [ColorValue, ColorValue] => {
    if (isGrayedOut) {
      return theme.isDark ? ["#505050", "#404040"] : ["#c0c0c0", "#a0a0a0"]; // Grayed out gradient
    }

    if (!followsTheme) {
      return isLessons
        ? ([
            normalizeWidgetCardColor(
              widgetLessonCardGradientStart,
              DEFAULT_WIDGET_CARD_STYLE_COLORS.widgetLessonCardGradientStart
            ),
            normalizeWidgetCardColor(
              widgetLessonCardGradientEnd,
              DEFAULT_WIDGET_CARD_STYLE_COLORS.widgetLessonCardGradientEnd
            ),
          ] as const)
        : ([
            normalizeWidgetCardColor(
              widgetReviewCardGradientStart,
              DEFAULT_WIDGET_CARD_STYLE_COLORS.widgetReviewCardGradientStart
            ),
            normalizeWidgetCardColor(
              widgetReviewCardGradientEnd,
              DEFAULT_WIDGET_CARD_STYLE_COLORS.widgetReviewCardGradientEnd
            ),
          ] as const);
    }

    // Preserve legacy defaults exactly in light mode
    if (!theme.isDark && themeMode !== "sepia") {
      return isLessons
        ? (["#fe5bb6", "#fa1f62"] as const) // Lessons (pink)
        : (["#47acdd", "#0093dd"] as const); // Reviews (blue)
    }

    if (themeMode === "sepia") {
      return isLessons
        ? [withAlpha(theme.primary, 0.88), theme.primary]
        : [withAlpha(theme.secondary, 0.86), theme.secondary];
    }

    if (themeMode === "midnight") {
      return isLessons ? ["#5f153c", "#45102c"] : ["#15425f", "#103249"];
    }

    if (theme.isDark) {
      return isLessons ? ["#8e2758", "#6f1a46"] : ["#2b6f98", "#1f5575"];
    }
    return isLessons ? ["#fe5bb6", "#fa1f62"] : ["#47acdd", "#0093dd"];
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { shadowColor: theme.isDark ? "#000000" : "#000000" },
      ]}
      onPress={() => onPress(selectedPreset ?? undefined)}
      accessible={!showsPresets}
      accessibilityRole="button"
      accessibilityLabel={showsPresets ? undefined : isLessons ? "Start Lessons" : "Start Reviews"}
      disabled={
        !canStartSession ||
        lessonsBlockedByDailyLimit ||
        lessonsBlockedBySrsThreshold
      }
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={getGradientColors()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background Image */}
        {isLessons ? (
          <Image
            source={
              displayCount === 0
                ? require("../../assets/images/NoLessons.png")
                : require("../../assets/images/Lessons.png")
            }
            style={[
              styles.backgroundImage,
              !isTablet && styles.backgroundImageMobile,
            ]}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={
              displayCount === 0
                ? require("../../assets/images/ReviewsFinished.png")
                : require("../../assets/images/Reviews.png")
            }
            style={[
              styles.backgroundImage,
              !isTablet && styles.backgroundImageMobile,
            ]}
            resizeMode="contain"
          />
        )}

        <View
          style={[
            styles.contentContainer,
            !isTablet && styles.contentContainerMobile,
            showsPresets && { paddingRight: 16 },
          ]}
        >
          <View style={[styles.headerRow, showsPresets && { paddingRight: isTablet ? 150 : 104 }]}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  isGrayedOut
                    ? { color: theme.isDark ? "#808080" : "#444" }
                    : null,
                ]}
              >
                {isLessons ? uiT("ui.lessons_cb4ad503") : uiT("ui.reviews_84cb7871")}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  {
                    borderColor: reviewCountBadgeBorderColor,
                    borderWidth: !isLessons && hasCriticalReviews ? 2 : 0,
                  },
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                <Text style={[styles.countText, { color: theme.textColor }]}>
                  {displayCount}
                </Text>
              </View>
            </View>
          </View>

          <Text
            style={[
              styles.subtitle,
              showsPresets && { marginRight: isTablet ? 150 : 104 },
              isGrayedOut ? { color: theme.isDark ? "#808080" : "#444" } : null,
            ]}
          >
            {isGrayedOut
              ? isLessons
                ? lessonsBlockedBySrsThreshold
                  ? srsThresholdSubtitle
                  : lessonsBlockedByDailyLimit
                  ? uiT("ui.you_ve_reached_your_daily_lesson_limit_for_today_ea6f9521")
                  : uiT("ui.you_ve_done_all_your_available_lessons_1ff76004")
                : uiT("ui.there_are_no_more_reviews_to_do_right_now_0de94bb4")
              : canResumeLessonSession
              ? uiT("ui.resume_your_in_progress_lesson_session_844576d3")
              : isLessons
              ? uiT("ui.we_cooked_up_these_lessons_just_for_you_60979297")
              : uiT("ui.review_these_items_to_level_them_up_5f7f112b")}
          </Text>

          {pendingSyncLabel ? (
            <View style={styles.pendingSyncRow}>
              <Ionicons name="cloud-upload-outline" size={14} color="white" />
              <Text style={styles.pendingSyncText}>{pendingSyncLabel}</Text>
            </View>
          ) : null}

          {showsPresets ? (
            <View style={styles.presetRow}>
              {reviewPresets.map((preset) => {
                const selected = preset.id === selectedPreset?.id;
                const color = selected ? theme.textColor : "#fff";
                return <TouchableOpacity
                  key={preset.id}
                  onPress={(event) => { event.stopPropagation(); setSelectedPresetId(preset.id); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  hitSlop={2}
                  accessibilityLabel={`${preset.name}, ${preset.batchSize} reviews, ${getReviewOrderLabel(preset.reviewOrder)}`}
                  style={[styles.presetButton, { backgroundColor: selected ? theme.cardBackground : "rgba(255,255,255,0.16)", borderColor: selected ? theme.cardBackground : "rgba(255,255,255,0.5)" }]}
                >
                  {selected ? <Ionicons name="checkmark" size={12} color={color} /> : null}
                  <Text numberOfLines={1} style={[styles.presetName, { color }]}>{preset.name}</Text>
                  <Text style={[styles.presetSize, { color }]}>· {preset.batchSize}</Text>
                </TouchableOpacity>;
              })}
            </View>
          ) : null}

          <View style={[styles.bottomRow, showsPresets && { marginTop: 8 }]}>
            {lessonsBlockedBySrsThreshold ? (
              <Text style={styles.nextTimeText}>
                {uiT("ui.complete_reviews_to_unlock_lessons_dfc4dfeb")} </Text>
            ) : lessonsBlockedByDailyLimit ? (
              <View style={styles.blockedLessonsContainer}>
                <Text style={styles.nextTimeText}>{uiT("ui.more_lessons_unlock_tomorrow_76e0dd71")}</Text>
                {renderLessonPickerButton()}
              </View>
            ) : isLessons && displayCount === 0 && !canResumeLessonSession ? (
              <Text style={styles.nextTimeText}>
                {nextLessonTime
                  ? formatNextTime(nextLessonTime)
                  : uiT("ui.no_lessons_available_right_now_576efae9")}
              </Text>
            ) : !isLessons && displayCount === 0 && nextReviewTime ? (
              <Text style={styles.nextTimeText}>
                {formatNextTime(nextReviewTime)}
              </Text>
            ) : (
              <View style={[styles.bottomLeft, showsPresets && { flex: 1, justifyContent: "space-between" }]}>
                <TouchableOpacity
                  accessible={showsPresets}
                  accessibilityRole="button"
                  accessibilityLabel={showsPresets ? `Start ${sessionSize} Reviews` : undefined}
                  disabled={!canStartSession || lessonsBlockedByDailyLimit || lessonsBlockedBySrsThreshold}
                  onPress={(event) => { event.stopPropagation(); onPress(selectedPreset ?? undefined); }}
                  style={[
                    styles.startButton,
                    { backgroundColor: theme.cardBackground },
                  ]}
                >
                  <Text
                    style={[styles.startButtonText, { color: theme.textColor }]}
                  >
                    {canResumeLessonSession
                      ? uiT("ui.resume_lessons_73b96440")
                      : isLessons
                      ? uiT("ui.start_lessons_9caee6b0")
                      : showsPresets ? uiT("ui.start_value_reviews_43ea688b", {value1: (sessionSize)}) : uiT("ui.start_reviews_0374ae63")}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={
                      isGrayedOut
                        ? theme.textSecondary
                        : isLessons
                        ? "#fa1f62"
                        : "#0093dd"
                    }
                  />
                </TouchableOpacity>
                {showsPresets ? <View style={styles.presetDetail}>
                  <Text numberOfLines={1} style={styles.presetDetailText}>{getReviewOrderLabel(selectedPreset?.reviewOrder ?? reviewOrder)}</Text>
                  {selectedPreset ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={uiT("ui.use_default_review_settings_b1d6f052")} hitSlop={8} onPress={(event) => { event.stopPropagation(); setSelectedPresetId(null); }}><Text style={[styles.presetDetailText, { textDecorationLine: "underline" }]}>{uiT("ui.use_default_a769cedc")}</Text></TouchableOpacity> : null}
                </View> : null}
                {renderLessonPickerButton()}
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// This component is used in the Index screen to render both cards stacked
export function LessonsReviewsCardPair({
  lessonCount,
  totalLessonCount,
  reviewCount,
  pendingLessonSyncCount = 0,
  pendingReviewSyncCount = 0,
  onLessonsPress,
  onReviewsPress,
  onLessonPicker,
  hasResumableLessonSession,
  isDoneLessons,
  isLessonDailyLimitReached,
  lessonSrsThresholdStatus,
  nextLessonTime,
  nextReviewTime,
  isIPadLandscape,
  currentLevel,
  subjects,
  assignments,
}: {
  lessonCount: number;
  totalLessonCount?: number;
  reviewCount: number;
  pendingLessonSyncCount?: number;
  pendingReviewSyncCount?: number;
  onLessonsPress: () => void;
  onReviewsPress: (preset?: ReviewPreset) => void;
  onLessonPicker?: () => void;
  hasResumableLessonSession?: boolean;
  isDoneLessons?: boolean;
  isLessonDailyLimitReached?: boolean;
  lessonSrsThresholdStatus?: LessonSrsThresholdStatus;
  nextLessonTime?: string;
  nextReviewTime?: string;
  isIPadLandscape?: boolean;
  currentLevel?: number;
  subjects?: any[];
  assignments?: any[];
}) {
  useInterfaceLanguage();
  return (
    <View
      style={[
        styles.cardPairContainer,
        isIPadLandscape && styles.cardPairContainerHorizontal,
      ]}
    >
      <LessonsReviewsCard
        type="lessons"
        count={lessonCount}
        pendingSyncCount={pendingLessonSyncCount}
        totalLessonCount={totalLessonCount}
        onPress={onLessonsPress}
        onLessonPicker={onLessonPicker}
        hasResumableLessonSession={hasResumableLessonSession}
        isDone={isDoneLessons}
        isDailyLimitReached={isLessonDailyLimitReached}
        lessonSrsThresholdStatus={lessonSrsThresholdStatus}
        nextLessonTime={nextLessonTime}
      />
      <LessonsReviewsCard
        type="reviews"
        count={reviewCount}
        pendingSyncCount={pendingReviewSyncCount}
        onPress={onReviewsPress}
        nextReviewTime={nextReviewTime}
        currentLevel={currentLevel}
        subjects={subjects}
        assignments={assignments}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  presetRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  presetButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  presetName: { flexShrink: 1, fontSize: 12, fontWeight: "600" },
  presetSize: { fontSize: 12 },
  presetDetail: { flexShrink: 1, alignItems: "flex-end", gap: 2 },
  presetDetailText: { color: "#fff", fontSize: 11 },
  cardPairContainer: {
    flexDirection: "column",
  },
  cardPairContainerHorizontal: {
    flexDirection: "row",
    gap: 12,
  },
  container: {
    flex: 1,
    borderRadius: 12,
    minHeight: 150,
    marginHorizontal: 4,
    marginVertical: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    borderRadius: 12,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
    zIndex: 1,
    position: "relative",
  },
  contentContainerMobile: {
    paddingRight: 120, // Leave space for smaller image on mobile
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    gap: 4,
  },
  pickerButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    flexShrink: 1,
  },
  countBadge: {
    borderRadius: 999,
    minWidth: 36,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  countText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    color: "white",
    marginVertical: 8,
  },
  nextTimeText: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 16,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  backgroundImage: {
    position: "absolute",
    right: 12,
    top: 0,
    width: 150,
    height: 150,
    zIndex: 0,
  },
  backgroundImageMobile: {
    width: 100, // Smaller on mobile
    height: 100,
    right: 10,
    top: 25, // Vertically centered in the 150pt card
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    minWidth: 0,
  },
  bottomLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  blockedLessonsContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
  },
  pendingSyncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pendingSyncText: {
    fontSize: 12,
    color: "white",
    opacity: 0.95,
    fontWeight: "600",
  },
});
