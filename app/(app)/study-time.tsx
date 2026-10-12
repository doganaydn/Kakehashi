import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  ReduceMotion,
} from "react-native-reanimated";
import { GlassButton } from "../../src/components/GlassButton";
import RollingNumberText from "../../src/components/RollingNumberText";
import { STUDY_TIME_CATEGORY_META } from "../../src/constants/studyTimeCategories";
import {
  ACTIVITY_CATEGORIES,
} from "../../src/services/timeTrackingCore";
import { timeTrackingService } from "../../src/services/timeTrackingService";
import {
  maybeRefreshStudyTimeHistory,
} from "../../src/services/studyTimeHistoryService";
import { normalizeStudyTimeUserId } from "../../src/services/studyTimeStorageScope";
import {
  getDeviceId,
  getStudyTimeSyncStatus,
  maybeSyncStudyTime,
  type StudyTimeSyncStatus,
} from "../../src/services/timeTrackingSyncService";
import {
  formatDurationMs,
  formatDurationMsCoarse,
} from "../../src/utils/durationFormat";
import {
  readStudyTimeRangeData,
  STUDY_TIME_RANGE_IDS,
  STUDY_TIME_RANGE_LABELS,
  type StudyTimeRangeData,
  type StudyTimeRangeId,
} from "../../src/utils/studyTimeRanges";
import { useAuthStore } from "../../src/utils/store";
import { useTheme } from "../../src/utils/theme";

const CHART_HEIGHT = 96;

// Drives card expand/collapse and bar resizing when the range changes.
// Timing-based: settles without spring overshoot.
const cardLayout = LinearTransition.easing(Easing.inOut(Easing.quad))
  .duration(240)
  .reduceMotion(ReduceMotion.System);

const sectionEntering = FadeIn.duration(180).reduceMotion(ReduceMotion.System);
const sectionExiting = FadeOut.duration(120).reduceMotion(ReduceMotion.System);

type ScreenData = StudyTimeRangeData & {
  syncStatus: StudyTimeSyncStatus;
};

function formatTimeAgo(timestampMs: number | null): string {
  if (!timestampMs) {
    return "never";
  }
  const seconds = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
  if (seconds < 5) {
    return "just now";
  }
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function readScreenData(range: StudyTimeRangeId): ScreenData {
  return {
    ...readStudyTimeRangeData(range),
    syncStatus: getStudyTimeSyncStatus(),
  };
}

export default function StudyTimeScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const userId = normalizeStudyTimeUserId(
    useAuthStore((state) => state.userData?.id ?? null),
  );
  const apiToken = useAuthStore((state) => state.apiToken);
  const username = useAuthStore((state) => state.userData?.username ?? null);
  const [rangeIndex, setRangeIndex] = useState(0);
  const range = STUDY_TIME_RANGE_IDS[rangeIndex];
  const [data, setData] = useState<ScreenData>(() => readScreenData("today"));
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);
  const [showChartBreakdown, setShowChartBreakdown] = useState(false);

  // Live refresh while focused; all reads are local and in-memory cached.
  useFocusEffect(
    useCallback(() => {
      // Good moment to push totals to Supabase (throttled internally).
      maybeSyncStudyTime();

      let isFocused = true;
      setData(readScreenData(range));
      if (apiToken && userId) {
        void maybeRefreshStudyTimeHistory().then(() => {
          if (isFocused) {
            setData(readScreenData(range));
          }
        });
      }
      const timer = setInterval(() => {
        setData(readScreenData(range));
      }, 1000);
      return () => {
        isFocused = false;
        clearInterval(timer);
      };
    }, [apiToken, range, userId])
  );

  const { summary, elapsedDays, series, syncStatus, chartTitle, chartUnit } = data;
  const deviceId = userId ? getDeviceId() : null;
  const legacyRecoveryStatus =
    apiToken && userId && deviceId
      ? timeTrackingService.getLegacyHistoryRecoveryStatus(userId, deviceId)
      : { state: "none" as const, dayCount: 0 };

  const confirmLegacyHistoryRecovery = useCallback(() => {
    if (!apiToken || !userId || !deviceId) {
      return;
    }

    const accountLabel = username ? `@${username}` : `account ${userId}`;
    Alert.alert(
      uiT("ui.add_saved_study_history_fddc02e7"),
      uiT("ui.kakehashi_found_value_saved_value_from_before_study_time_sync_was_6299e164", {value1: (legacyRecoveryStatus.dayCount), value2: (legacyRecoveryStatus.dayCount === 1 ? "day" : "days"), value3: (accountLabel)}),
      [
        { text: uiT("ui.not_now_a0e63d7c"), style: "cancel" },
        {
          text: uiT("ui.add_to_this_account_2b97ffa7"),
          onPress: () => {
            const accepted =
              timeTrackingService.acceptLegacyHistoryForCurrentUser(
                userId,
                deviceId,
              );
            if (!accepted) {
              Alert.alert(
                uiT("ui.history_wasn_t_added_85ec268d"),
                uiT("ui.the_saved_history_is_no_longer_available_for_this_account_454129ee"),
              );
              return;
            }

            Alert.alert(
              uiT("ui.saved_history_added_85e8eef8"),
              uiT("ui.it_is_now_included_in_this_account_s_totals_the_original_on_devic_0e3ad249"),
            );
            setData(readScreenData(range));
            void maybeSyncStudyTime({ force: true }).finally(() => {
              setData(readScreenData(range));
            });
          },
        },
      ],
    );
  }, [apiToken, deviceId, legacyRecoveryStatus.dayCount, range, userId, username, ]);

  const activeCategories = useMemo(
    () =>
      ACTIVITY_CATEGORIES.filter((category) => summary.byCategory[category] > 0).sort(
        (a, b) => summary.byCategory[b] - summary.byCategory[a]
      ),
    [summary]
  );

  const chartMaxMs = Math.max(1, ...series.map((day) => day.studyMs));
  const selectedBucket =
    series.find((bucket) => bucket.id === selectedBucketId) ?? null;
  const averagePerDayMs = summary.studyMs / elapsedDays;
  const trackColor = theme.isDark ? "#2a2a2a" : "#f0f0f0";
  const cardStyle = [styles.card, { backgroundColor: theme.cardBackground }];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundColor, paddingTop: insets.top + 4 },
      ]}
    >
      <View style={styles.headerRow}>
        <GlassButton
          iconName="arrow-back"
          onPress={() => router.back()}
          iconColor={theme.textColor}
          variant="light"
          style={styles.backButton}
        />
        <View style={styles.headerTextGroup}>
          <Text style={[styles.headerTitle, { color: theme.textColor }]}>
            {uiT("ui.study_time_697f7732")} </Text>
          <Text style={[styles.headerMeta, { color: theme.textSecondary }]}>
            {uiT("ui.combined_across_all_your_devices_5c06fb02")} </Text>
        </View>
        <View style={styles.backButtonSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {legacyRecoveryStatus.state === "available" && (
          <Animated.View style={cardStyle} layout={cardLayout}>
            <View style={styles.appTotalRow}>
              <View style={styles.categoryLabelGroup}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text
                  style={[
                    styles.sectionTitle,
                    styles.recoveryTitle,
                    { color: theme.textColor },
                  ]}
                >
                  {uiT("ui.saved_study_history_found_b3641f22")} </Text>
              </View>
            </View>
            <Text
              style={[
                styles.footnote,
                styles.recoveryDescription,
                { color: theme.textSecondary },
              ]}
            >
              {legacyRecoveryStatus.dayCount} {uiT("ui.saved_d81c55f4")}{" "}
              {legacyRecoveryStatus.dayCount === 1 ? uiT("ui.day_is_cd1326bb") : uiT("ui.days_are_583f279d")}{" "}
              {uiT("ui.waiting_for_you_to_confirm_which_account_owns_them_3e9c45e0")} </Text>
            <TouchableOpacity
              style={[styles.recoveryButton, { backgroundColor: theme.primary }]}
              onPress={confirmLegacyHistoryRecovery}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={uiT("ui.add_saved_study_history_to_this_account_654ee0fb")}
            >
              <Text style={styles.syncNowButtonText}>{uiT("ui.review_and_add_history_c154b7e5")}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <SegmentedControl
          values={STUDY_TIME_RANGE_LABELS}
          selectedIndex={rangeIndex}
          onChange={(event) => {
            const index = event.nativeEvent.selectedSegmentIndex;
            setRangeIndex(index);
            setSelectedBucketId(null);
            setData(readScreenData(STUDY_TIME_RANGE_IDS[index]));
          }}
          style={styles.segmentedControl}
          tintColor={theme.primary}
          fontStyle={{ color: theme.textSecondary, fontSize: 13 }}
          activeFontStyle={{ color: "#fff", fontSize: 13, fontWeight: "600" }}
        />

        {/* Total for the selected range */}
        <Animated.View style={cardStyle} layout={cardLayout}>
          <Text style={[styles.heroLabel, { color: theme.textSecondary }]}>
            {uiT("ui.total_study_time_792865b0")} </Text>
          <RollingNumberText
            text={formatDurationMs(summary.studyMs)}
            style={[styles.heroValue, { color: theme.textColor }]}
            containerStyle={styles.heroValueContainer}
          />
          {range !== "today" && (
            <Animated.View
              style={styles.heroMetaRow}
              entering={sectionEntering}
              exiting={sectionExiting}
              layout={cardLayout}
            >
              <View style={styles.heroMetaItem}>
                <RollingNumberText
                  text={formatDurationMsCoarse(averagePerDayMs)}
                  style={[styles.heroMetaValue, { color: theme.textColor }]}
                />
                <Text style={[styles.heroMetaLabel, { color: theme.textSecondary }]}>
                  {uiT("ui.avg_day_ccd80e0b")} </Text>
              </View>
              <View style={styles.heroMetaItem}>
                <RollingNumberText
                  text={`${summary.activeDayCount}/${elapsedDays}`}
                  style={[styles.heroMetaValue, { color: theme.textColor }]}
                />
                <Text style={[styles.heroMetaLabel, { color: theme.textSecondary }]}>
                  {uiT("ui.active_days_8b82ba33")} </Text>
              </View>
              <View style={styles.heroMetaItem}>
                <RollingNumberText
                  text={formatDurationMsCoarse(
                    summary.activeDayCount > 0
                      ? summary.studyMs / summary.activeDayCount
                      : 0
                  )}
                  style={[styles.heroMetaValue, { color: theme.textColor }]}
                />
                <Text style={[styles.heroMetaLabel, { color: theme.textSecondary }]}>
                  {uiT("ui.avg_active_day_74fdfd14")} </Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {/* Per-category breakdown */}
        <Animated.View style={cardStyle} layout={cardLayout}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.breakdown_3ffe201a")} </Text>
          {activeCategories.length === 0 ? (
            <Animated.Text
              entering={sectionEntering}
              exiting={sectionExiting}
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              {uiT("ui.nothing_tracked_in_this_period_yet_e2495a3e")} </Animated.Text>
          ) : (
            activeCategories.map((category) => {
              const meta = STUDY_TIME_CATEGORY_META[category];
              const categoryMs = summary.byCategory[category];
              const share = summary.studyMs > 0 ? categoryMs / summary.studyMs : 0;

              return (
                <Animated.View
                  key={category}
                  style={styles.categoryRow}
                  entering={sectionEntering}
                  exiting={sectionExiting}
                  layout={cardLayout}
                >
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLabelGroup}>
                      <Ionicons name={meta.icon} size={16} color={meta.color} />
                      <Text style={[styles.categoryLabel, { color: theme.textColor }]}>
                        {meta.label}
                      </Text>
                    </View>
                    <Text style={[styles.categoryValue, { color: theme.textColor }]}>
                      {formatDurationMs(categoryMs)}
                      <Text style={{ color: theme.textSecondary }}>
                        {"  "}{Math.round(share * 100)}%
                      </Text>
                    </Text>
                  </View>
                  <View style={[styles.categoryTrack, { backgroundColor: trackColor }]}>
                    <Animated.View
                      layout={cardLayout}
                      style={[
                        styles.categoryFill,
                        {
                          backgroundColor: meta.color,
                          width: `${Math.max(2, Math.round(share * 100))}%`,
                        },
                      ]}
                    />
                  </View>
                </Animated.View>
              );
            })
          )}
        </Animated.View>

        {/* Range chart */}
        <Animated.View style={cardStyle} layout={cardLayout}>
          <View style={styles.chartHeaderRow}>
            <Text style={[styles.sectionTitle, styles.chartSectionTitle, { color: theme.textColor }]}>
              {chartTitle}
            </Text>
            <TouchableOpacity
              onPress={() => setShowChartBreakdown((value) => !value)}
              style={[
                styles.chartToggle,
                {
                  backgroundColor: showChartBreakdown ? theme.primary : trackColor,
                },
              ]}
              accessibilityRole="switch"
              accessibilityLabel={uiT("ui.color_bars_by_category_c82e568b")}
              accessibilityState={{ checked: showChartBreakdown }}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="color-palette-outline"
                size={16}
                color={showChartBreakdown ? "#fff" : theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.chartRow}>
            {series.map((bucket) => {
              const isSelected = bucket.id === selectedBucketId;
              const barHeight =
                bucket.studyMs > 0
                  ? Math.max(3, (bucket.studyMs / chartMaxMs) * CHART_HEIGHT)
                  : 2;

              return (
                <Pressable
                  key={bucket.id}
                  style={styles.chartColumn}
                  onPress={() =>
                    setSelectedBucketId(isSelected ? null : bucket.id)
                  }
                >
                  <View style={styles.chartBarSlot}>
                    <Animated.View
                      layout={cardLayout}
                      style={[
                        styles.chartBar,
                        {
                          height: barHeight,
                          backgroundColor:
                            bucket.studyMs > 0
                              ? showChartBreakdown
                                ? "transparent"
                                : isSelected || bucket.isCurrent
                                  ? theme.primary
                                  : `${theme.primary}88`
                              : trackColor,
                        },
                      ]}
                    >
                      {showChartBreakdown && bucket.studyMs > 0
                        ? ACTIVITY_CATEGORIES.map((category) => {
                            const categoryMs = bucket.byCategory[category] ?? 0;
                            if (categoryMs <= 0) {
                              return null;
                            }
                            return (
                              <Animated.View
                                key={category}
                                entering={sectionEntering}
                                layout={cardLayout}
                                style={{
                                  height: (categoryMs / bucket.studyMs) * barHeight,
                                  backgroundColor:
                                    STUDY_TIME_CATEGORY_META[category].color,
                                }}
                              />
                            );
                          })
                        : null}
                    </Animated.View>
                  </View>
                  <Text
                    style={[
                      styles.chartDayLabel,
                      {
                        color: bucket.isCurrent ? theme.textColor : theme.textSecondary,
                        fontWeight: bucket.isCurrent ? "700" : "400",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {bucket.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.chartCaption, { color: theme.textSecondary }]}>
            {selectedBucket
              ? uiT("ui.value_value_b5ae9572", {value1: (selectedBucket.accessibilityLabel), value2: (formatDurationMs(selectedBucket.studyMs))})
              : uiT("ui.tap_a_value_bar_to_see_that_period_s_total_b5e57236", {value1: (chartUnit)})}
          </Text>
        </Animated.View>

        {/* App total */}
        <Animated.View style={cardStyle} layout={cardLayout}>
          <View style={styles.appTotalRow}>
            <View style={styles.categoryLabelGroup}>
              <Ionicons name="phone-portrait-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.categoryLabel, { color: theme.textColor }]}>
                {uiT("ui.total_time_in_kakehashi_1a75b009")} </Text>
            </View>
            <RollingNumberText
              text={formatDurationMs(summary.appTotalMs)}
              style={[styles.categoryValue, { color: theme.textColor }]}
            />
          </View>
          <Text style={[styles.footnote, { color: theme.textSecondary }]}>
            {uiT("ui.includes_everything_you_do_in_kakehashi_across_your_devices_not_j_006e8540")} </Text>
        </Animated.View>

        {/* Sync status — visible so device testers can debug without a console */}
        <Animated.View style={cardStyle} layout={cardLayout}>
          <View style={styles.appTotalRow}>
            <View style={styles.categoryLabelGroup}>
              <Ionicons
                name="cloud-upload-outline"
                size={16}
                color={theme.textSecondary}
              />
              <Text style={[styles.categoryLabel, { color: theme.textColor }]}>
                {uiT("ui.sync_8d261a37")} </Text>
            </View>
            <TouchableOpacity
              style={[styles.syncNowButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                maybeSyncStudyTime({ force: true });
                void maybeRefreshStudyTimeHistory({ force: true }).then(() => {
                  setData(readScreenData(range));
                });
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.syncNowButtonText}>{uiT("ui.sync_now_885e8f48")}</Text>
            </TouchableOpacity>
          </View>
          <Text
            style={[
              styles.syncDetail,
              {
                color:
                  syncStatus.state === "error"
                    ? theme.error
                    : syncStatus.state === "success"
                      ? "#22C55E"
                      : theme.textSecondary,
              },
            ]}
          >
            {syncStatus.detail}
            {syncStatus.at ? uiT("ui.value_ec422465", {value1: (formatTimeAgo(syncStatus.at))}) : ""}
          </Text>
          <Text style={[styles.footnote, { color: theme.textSecondary }]}>
            {uiT("ui.this_device_uploads_its_local_ledger_combined_totals_refresh_from_89546a5f")}{" "}
            {formatTimeAgo(syncStatus.lastSuccessAt)}
          </Text>
          <Text
            style={[styles.footnote, { color: theme.textSecondary }]}
            selectable
          >
            {uiT("ui.device_id_d45583bf")} {getDeviceId()}
          </Text>
          <Text
            style={[styles.footnote, { color: theme.textSecondary }]}
            selectable
          >
            {uiT("ui.project_5917f323")} {getSupabaseHost()}
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Which Supabase project this build talks to (public client config), so RLS
// or missing-table errors can be matched against the right dashboard.
function getSupabaseHost(): string {
  try {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
    if (!url) {
      return "not configured";
    }
    return new URL(url).host;
  } catch {
    return "invalid URL";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonSpacer: {
    width: 44,
  },
  headerTextGroup: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  headerMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  segmentedControl: {
    height: 36,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "rgba(0,0,0,0.15)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  heroValue: {
    fontSize: 34,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  heroValueContainer: {
    marginTop: 4,
  },
  heroMetaRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 24,
  },
  heroMetaItem: {
    alignItems: "flex-start",
  },
  heroMetaValue: {
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  heroMetaLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 13,
  },
  categoryRow: {
    marginBottom: 14,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  categoryTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  categoryFill: {
    height: "100%",
    borderRadius: 4,
  },
  chartHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  chartSectionTitle: {
    marginBottom: 0,
    flexShrink: 1,
  },
  chartToggle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
  },
  chartBarSlot: {
    height: CHART_HEIGHT,
    justifyContent: "flex-end",
    alignSelf: "stretch",
  },
  chartBar: {
    borderRadius: 3,
    alignSelf: "stretch",
    overflow: "hidden",
    // Stacked category segments render bottom-up.
    flexDirection: "column-reverse",
  },
  chartDayLabel: {
    fontSize: 10,
    marginTop: 6,
  },
  chartCaption: {
    fontSize: 12,
    marginTop: 12,
    textAlign: "center",
  },
  appTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footnote: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
  },
  syncNowButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  syncNowButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  syncDetail: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 12,
  },
  recoveryTitle: {
    marginBottom: 0,
  },
  recoveryDescription: {
    marginTop: 10,
  },
  recoveryButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 14,
  },
});
