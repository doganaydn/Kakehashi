import { uiT, interfaceLocale, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { SettingsIcon as Ionicons } from "../../src/ui/settings/settings-icon";

import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  readingGoalsService,
  type ReadingGoalDay,
  type ReadingGoalsProgress,
} from "../../src/services/readingGoalsService";
import { supportsNativeTabs } from "../../src/utils/nativeTabs";
import { useTheme } from "../../src/utils/theme";

const GOAL_PRESETS = [5, 10, 15, 20, 30];
const COMPLETED_PROGRESS_COLOR = "#43AA8B";

function fallbackWeekDays(): ReadingGoalDay[] {
  const days: ReadingGoalDay[] = [];
  const now = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;
    const label = new Intl.DateTimeFormat(interfaceLocale(), { weekday: "short" })
      .format(date)
      .slice(0, 1)
      .toUpperCase();

    days.push({
      dateKey,
      label,
      completed: false,
      isToday: offset === 0,
    });
  }

  return days;
}

function getFallbackGoalsProgress(): ReadingGoalsProgress {
  return {
    goalMinutes: 5,
    todayMinutes: 0,
    todaySeconds: 0,
    todayRatio: 0,
    todayCompleted: false,
    streakCurrent: 0,
    streakBest: 0,
    week: fallbackWeekDays(),
  };
}

export default function EpubSettingsScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const [goalsProgress, setGoalsProgress] = useState<ReadingGoalsProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      const progress = await readingGoalsService.getProgress();
      setGoalsProgress(progress);
    } catch (error) {
      console.error("Failed to load EPUB reading settings:", error);
      Alert.alert(uiT("ui.could_not_load_settings_ed9c827a"), uiT("ui.please_try_again_eea4fb33"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  const updateGoal = useCallback(
    async (nextGoalMinutes: number) => {
      if (isSaving) {
        return;
      }

      setIsSaving(true);
      try {
        const updated = await readingGoalsService.setGoalMinutes(nextGoalMinutes);
        setGoalsProgress(updated);
      } catch (error) {
        console.error("Failed to update EPUB reading goal:", error);
        Alert.alert(uiT("ui.could_not_update_goal_efe151a1"), uiT("ui.please_try_again_eea4fb33"));
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving]
  );

  const progress = goalsProgress ?? getFallbackGoalsProgress();
  const remainingMinutes = Math.max(0, progress.goalMinutes - progress.todayMinutes);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar style={theme.statusBarStyle} />

      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.backgroundColor,
            paddingTop: supportsNativeTabs() ? 66 : 52,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.headerButton, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}
          onPress={() => router.back()}
          activeOpacity={0.82}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>{uiT("ui.epub_settings_1ed8e608")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.centerStateText, { color: theme.textSecondary }]}>{uiT("ui.loading_settings_157fd50d")}</Text>
        </View>
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.textColor }]}>{uiT("ui.daily_reading_goal_08a27747")}</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              {uiT("ui.set_how_many_minutes_you_want_to_read_each_day_4c907e23")} </Text>

            <View style={styles.goalAdjustRow}>
              <TouchableOpacity
                style={[styles.goalAdjustButton, { borderColor: theme.border, backgroundColor: theme.backgroundColor }]}
                onPress={() => updateGoal(progress.goalMinutes - 1)}
                disabled={isSaving}
                activeOpacity={0.82}
              >
                <Ionicons name="remove" size={16} color={theme.textColor} />
              </TouchableOpacity>

              <View style={[styles.goalValuePill, { borderColor: theme.border }]}>
                <Text style={[styles.goalValueText, { color: theme.textColor }]}>
                  {progress.goalMinutes} {uiT("ui.min_day_b4a7e43a")} </Text>
              </View>

              <TouchableOpacity
                style={[styles.goalAdjustButton, { borderColor: theme.border, backgroundColor: theme.backgroundColor }]}
                onPress={() => updateGoal(progress.goalMinutes + 1)}
                disabled={isSaving}
                activeOpacity={0.82}
              >
                <Ionicons name="add" size={16} color={theme.textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.goalPresetRow}>
              {GOAL_PRESETS.map((preset) => {
                const selected = progress.goalMinutes === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.goalPresetButton,
                      {
                        borderColor: selected ? theme.primary : theme.border,
                        backgroundColor: selected ? `${theme.primary}18` : theme.backgroundColor,
                      },
                    ]}
                    onPress={() => updateGoal(preset)}
                    disabled={isSaving}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.goalPresetText, { color: selected ? theme.primary : theme.textSecondary }]}>
                      {preset}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.textColor }]}>{uiT("ui.today_2b065c7c")}</Text>
            <Text style={[styles.todayValue, { color: theme.textColor }]}>
              {progress.todayMinutes} / {progress.goalMinutes} {uiT("ui.min_1f6fa6f6")} </Text>
            <View
              style={[
                styles.goalsTrack,
                { backgroundColor: theme.isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)" },
              ]}
            >
              <View
                style={[
                  styles.goalsFill,
                  {
                    width: `${Math.max(3, Math.round(progress.todayRatio * 100))}%`,
                    backgroundColor: progress.todayCompleted
                      ? COMPLETED_PROGRESS_COLOR
                      : theme.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.todayHint, { color: theme.textSecondary }]}>
              {progress.todayCompleted
                ? uiT("ui.goal_completed_for_today_9bb1fe4e")
                : uiT("ui.value_more_minutevalue_needed_111a39cb", {value1: (remainingMinutes), value2: (remainingMinutes === 1 ? "" : "s")})}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  headerSpacer: {
    width: 38,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 60,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  goalAdjustRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  goalAdjustButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  goalValuePill: {
    minWidth: 126,
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: "100%",
    flexShrink: 1,
  },
  goalValueText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: "100%",
    minWidth: 0,
  },
  goalPresetRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  goalPresetButton: {
    minWidth: 44,
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: "100%",
    flexShrink: 1,
  },
  goalPresetText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: "100%",
    minWidth: 0,
  },
  todayValue: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  goalsTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  goalsFill: {
    height: "100%",
    borderRadius: 999,
  },
  todayHint: {
    fontSize: 13,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  centerStateText: {
    marginTop: 12,
    fontSize: 14,
  },
});
