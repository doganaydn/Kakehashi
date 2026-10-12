import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { SettingsIcon as Ionicons } from "../../src/ui/settings/settings-icon";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WaniKaniBackgroundFetch from "../../src/modules/WaniKaniBackgroundFetch";
import {
  type WidgetContentMode,
  type WidgetStreakGradientPreset,
  useAuthStore,
  useSettingsStore,
} from "../../src/utils/store";
import { useTheme } from "../../src/utils/theme";
import {
  getHomeWidgetScheduledUpdatesDebug,
  type HomeWidgetScheduledUpdatesDebugResult,
  updateHomeWidgetDisplayPreferences,
} from "../../src/widgets/homeWidget";
import { requestPinHomeWidget } from "../../src/widgets/homeWidgetController";

const WIDGET_CONTENT_OPTIONS: {
  value: WidgetContentMode;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  {
    value: "reviews",
    get title() { return uiT("ui.current_upcoming_reviews_a3fbf3a8"); },
    get description() { return uiT("ui.show_available_reviews_next_review_timing_and_today_total_36654510"); },
    icon: "time",
  },
  {
    value: "critical",
    get title() { return uiT("ui.critical_items_759959bc"); },
    get description() { return uiT("ui.lowest_accuracy_items_one_in_small_up_to_three_in_medium_starts_b_50bb4f7d"); },
    icon: "warning",
  },
  {
    value: "streak",
    get title() { return uiT("ui.app_use_streak_dcb0f6b3"); },
    get description() { return uiT("ui.show_current_streak_best_streak_and_freeze_status_e3ea7c65"); },
    icon: "flame",
  },
];

const WIDGET_COLOR_MODE_OPTIONS: {
  value: WidgetStreakGradientPreset;
  title: string;
  description: string;
}[] = [
  {
    value: "automatic",
    get title() { return uiT("ui.automatic_d461a493"); },
    get description() { return uiT("ui.changes_by_morning_afternoon_and_night_2565f522"); },
  },
  {
    value: "defaults",
    get title() { return uiT("ui.defaults_610b7468"); },
    get description() { return uiT("ui.uses_the_default_colors_for_each_widget_c06d5470"); },
  },
];

const WIDGET_STREAK_GRADIENT_OPTIONS: {
  value: WidgetStreakGradientPreset;
  label: string;
  preview: [string, string];
}[] = [
  { value: "sunset", get label() { return uiT("ui.sunset_275dbda9"); }, preview: ["#FF7A18", "#FF3F6C"] },
  { value: "ocean", get label() { return uiT("ui.ocean_fed12611"); }, preview: ["#0EA5E9", "#4338CA"] },
  { value: "emerald", get label() { return uiT("ui.emerald_af1ccb31"); }, preview: ["#10B981", "#0F766E"] },
  { value: "violet", get label() { return uiT("ui.violet_2a364288"); }, preview: ["#A855F7", "#4C1D95"] },
  { value: "rose", get label() { return uiT("ui.rose_e10d8509"); }, preview: ["#FB7185", "#BE185D"] },
  { value: "amber", get label() { return uiT("ui.amber_a5cccbce"); }, preview: ["#F59E0B", "#EA580C"] },
  { value: "aurora", get label() { return uiT("ui.aurora_e9de098c"); }, preview: ["#06B6D4", "#22C55E"] },
  { value: "slate", get label() { return uiT("ui.slate_10ad4c38"); }, preview: ["#64748B", "#334155"] },
  { value: "skyline", get label() { return uiT("ui.skyline_3cb5c345"); }, preview: ["#38BDF8", "#A78BFA"] },
  { value: "obsidian", get label() { return uiT("ui.obsidian_9db22d41"); }, preview: ["#111827", "#020617"] },
  { value: "graphite", get label() { return uiT("ui.graphite_1d261a85"); }, preview: ["#374151", "#111827"] },
  {
    value: "midnightBloom",
    get label() { return uiT("ui.midnight_bloom_1b7fd42e"); },
    preview: ["#312E81", "#111827"],
  },
];

export default function WidgetSettings() {
  useInterfaceLanguage();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const userData = useAuthStore((state) => state.userData);
  const {
    widgetContentMode,
    setWidgetContentMode,
    widgetStreakGradient,
    setWidgetStreakGradient,
    widgetBackgroundRefreshEnabled,
    setWidgetBackgroundRefreshEnabled,
  } = useSettingsStore();
  const isIOS = Platform.OS === "ios";
  const supportsWidgets = isIOS || Platform.OS === "android";
  const isPortegoDebugUser =
    userData?.username?.trim().toLowerCase() === "portego";
  const [widgetDebugData, setWidgetDebugData] =
    useState<HomeWidgetScheduledUpdatesDebugResult | null>(null);
  const [isWidgetDebugLoading, setIsWidgetDebugLoading] = useState(false);
  const [widgetDebugLastRefreshedAt, setWidgetDebugLastRefreshedAt] =
    useState<Date | null>(null);

  const handleWidgetBackgroundRefreshChange = (enabled: boolean) => {
    setWidgetBackgroundRefreshEnabled(enabled);
    if (
      Platform.OS === "ios" &&
      WaniKaniBackgroundFetch &&
      typeof WaniKaniBackgroundFetch.updateNotificationSettings === "function"
    ) {
      try {
        WaniKaniBackgroundFetch.updateNotificationSettings({
          widgetBackgroundRefreshEnabled: enabled,
        });
      } catch {
        // Best effort
      }
    }
  };

  const handleWidgetContentModeChange = (mode: WidgetContentMode) => {
    setWidgetContentMode(mode);
    updateHomeWidgetDisplayPreferences({
      contentMode: mode,
      isDarkTheme: isDark,
    });
  };

  const handleWidgetGradientChange = (preset: WidgetStreakGradientPreset) => {
    setWidgetStreakGradient(preset);
    updateHomeWidgetDisplayPreferences({
      streakGradientPreset: preset,
      isDarkTheme: isDark,
    });
  };

  const refreshWidgetDebugData = useCallback(async () => {
    if (!supportsWidgets) {
      return;
    }

    setIsWidgetDebugLoading(true);
    try {
      const debugData = await getHomeWidgetScheduledUpdatesDebug();
      setWidgetDebugData(debugData);
      setWidgetDebugLastRefreshedAt(new Date());
    } catch {
      setWidgetDebugData({
        source: "none",
        generatedAt: new Date().toISOString(),
        entryCount: 0,
        entries: [],
        error: "Failed to load widget timeline entries.",
      });
      setWidgetDebugLastRefreshedAt(new Date());
    } finally {
      setIsWidgetDebugLoading(false);
    }
  }, [supportsWidgets]);

  useEffect(() => {
    if (!supportsWidgets || !isPortegoDebugUser) {
      return;
    }

    void refreshWidgetDebugData();
  }, [supportsWidgets, isPortegoDebugUser, refreshWidgetDebugData]);

  const futureWidgetDebugEntries = useMemo(
    () =>
      (widgetDebugData?.entries ?? []).filter(
        (entry) => entry.isFuture,
      ),
    [widgetDebugData],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar style={theme.statusBarStyle} />

      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.border,
            paddingTop: 60,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={uiT("ui.go_back_6aadac2f")}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textColor }]}>
          {uiT("ui.home_widget_273b7f71")} </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
      >
        {Platform.OS === "android" ? (
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel={uiT("ui.add_kakehashi_widget_to_home_screen_36bd4037")}
            onPress={async () => {
              try {
                if (await requestPinHomeWidget()) return;
              } catch {
                // Launchers without pin support still offer the widget picker.
              }
              Alert.alert(uiT("ui.add_home_widget_80564361"), uiT("ui.touch_and_hold_an_empty_space_on_your_home_screen_choose_widgets_394cdaee"));
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.primary} style={styles.settingIcon} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingText, { color: theme.textColor }]}>{uiT("ui.add_to_home_screen_e1090dd0")}</Text>
              <Text style={[styles.settingSubtext, { color: theme.textSecondary }]}>{uiT("ui.content_and_colors_below_apply_to_all_kakehashi_widgets_1cb0113f")}</Text>
            </View>
          </TouchableOpacity>
        ) : null}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textColor, borderBottomColor: theme.border },
            ]}
          >
            {uiT("ui.widget_content_73862d5d")} </Text>

          {supportsWidgets ? (
            WIDGET_CONTENT_OPTIONS.map((option, index) => {
              const isSelected = widgetContentMode === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.settingItem,
                    {
                      borderBottomColor:
                        index === WIDGET_CONTENT_OPTIONS.length - 1
                          ? "transparent"
                          : theme.border,
                    },
                  ]}
                  onPress={() => handleWidgetContentModeChange(option.value)}
                >
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={theme.primary}
                    style={styles.settingIcon}
                  />
                  <View style={styles.settingTextContainer}>
                    <Text style={[styles.settingText, { color: theme.textColor }]}>
                      {option.title}
                    </Text>
                    <Text
                      style={[
                        styles.settingSubtext,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={isSelected ? theme.primary : theme.textSecondary}
                  />
                </TouchableOpacity>
              );
            })
          ) : (
            <View
              style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            >
              <Ionicons
                name="phone-portrait"
                size={24}
                color={theme.primary}
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, { color: theme.textColor }]}>
                  {uiT("ui.home_screen_widgets_5cb92ee6")} </Text>
                <Text
                  style={[styles.settingSubtext, { color: theme.textSecondary }]}
                >
                  {uiT("ui.widget_support_is_available_on_ios_and_android_devices_b3852ef9")} </Text>
              </View>
            </View>
          )}
        </View>

        {supportsWidgets ? (
          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textColor, borderBottomColor: theme.border },
              ]}
            >
              {uiT("ui.widget_theme_49e95abc")} </Text>
            <View style={styles.settingItemColumn}>
              <Text style={[styles.settingSubtext, { color: theme.textSecondary }]}>
                {uiT("ui.choose_a_color_mode_first_or_pick_a_manual_gradient_preset_1a1c2485")} </Text>
              <View style={styles.modeSelector}>
                {WIDGET_COLOR_MODE_OPTIONS.map((option) => {
                  const isSelected = widgetStreakGradient === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.modeButton,
                        {
                          borderColor: isSelected ? theme.primary : theme.border,
                          backgroundColor: theme.cardBackground,
                        },
                      ]}
                      onPress={() => handleWidgetGradientChange(option.value)}
                    >
                      <View style={styles.modeTextContainer}>
                        <Text
                          style={[
                            styles.modeTitle,
                            { color: isSelected ? theme.primary : theme.textColor },
                          ]}
                        >
                          {option.title}
                        </Text>
                        <Text
                          style={[
                            styles.modeDescription,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {option.description}
                        </Text>
                      </View>
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                        size={20}
                        color={isSelected ? theme.primary : theme.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text
                style={[
                  styles.manualSectionTitle,
                  { color: theme.textSecondary, borderTopColor: theme.border },
                ]}
              >
                {uiT("ui.manual_gradient_presets_425a8534")} </Text>
              <View style={styles.gradientSelector}>
                {WIDGET_STREAK_GRADIENT_OPTIONS.map((option) => {
                  const isSelected = widgetStreakGradient === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.gradientButton,
                        {
                          borderColor: isSelected ? theme.primary : theme.border,
                          backgroundColor: theme.cardBackground,
                        },
                      ]}
                      onPress={() => handleWidgetGradientChange(option.value)}
                    >
                      <View style={styles.gradientPreviewContainer}>
                        <LinearGradient
                          colors={option.preview as any}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.gradientPreview}
                        />
                      </View>
                      <Text
                        style={[
                          styles.gradientLabel,
                          {
                            color: isSelected
                              ? theme.primary
                              : theme.textSecondary,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        ) : null}

        {supportsWidgets ? (
          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textColor, borderBottomColor: theme.border },
              ]}
            >
              {uiT("ui.background_updates_e4503bee")} </Text>

            <View
              style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            >
              <Ionicons
                name="sync"
                size={24}
                color={theme.primary}
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, { color: theme.textColor }]}>
                  {uiT("ui.background_refresh_52f661a1")} </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.periodically_check_for_external_reviews_and_keep_widget_counts_up_44bf86dd")} </Text>
              </View>
              <Switch
                accessibilityLabel={uiT("ui.background_widget_refresh_f91d5ba7")}
                accessibilityHint={uiT("ui.controls_whether_kakehashi_updates_home_widgets_while_the_app_is_3837657e")}
                value={widgetBackgroundRefreshEnabled}
                onValueChange={handleWidgetBackgroundRefreshChange}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
          </View>
        ) : null}

        {supportsWidgets && isPortegoDebugUser ? (
          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textColor, borderBottomColor: theme.border },
              ]}
            >
              {uiT("ui.widget_debug_35692bc6")} </Text>
            <View style={styles.settingItemColumn}>
              <Text style={[styles.settingSubtext, { color: theme.textSecondary }]}>
                {uiT("ui.portego_only_tool_inspect_currently_scheduled_home_widget_timelin_de4d86dd")} </Text>
              <TouchableOpacity
                style={[
                  styles.debugRefreshButton,
                  {
                    borderColor: theme.primary,
                    backgroundColor: theme.cardBackground,
                    opacity: isWidgetDebugLoading ? 0.7 : 1,
                  },
                ]}
                onPress={() => {
                  void refreshWidgetDebugData();
                }}
                disabled={isWidgetDebugLoading}
              >
                <Text
                  style={[styles.debugRefreshText, { color: theme.primary }]}
                >
                  {isWidgetDebugLoading
                    ? uiT("ui.refreshing_1c0def7b")
                    : uiT("ui.refresh_scheduled_updates_88c0938a")}
                </Text>
                <Ionicons
                  name="refresh"
                  size={16}
                  color={theme.primary}
                />
              </TouchableOpacity>

              {widgetDebugLastRefreshedAt ? (
                <Text style={[styles.debugMetaText, { color: theme.textSecondary }]}>
                  {uiT("ui.last_refreshed_58095fd7")}{" "}
                  {widgetDebugLastRefreshedAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              ) : null}

              {widgetDebugData ? (
                <View
                  style={[
                    styles.debugTimelineCard,
                    { borderColor: theme.border, backgroundColor: theme.backgroundColor },
                  ]}
                >
                  <Text style={[styles.debugMetaText, { color: theme.textSecondary }]}>
                    {uiT("ui.source_c707ee4e")} {widgetDebugData.source} · {widgetDebugData.entryCount}{" "}
                    {uiT("ui.entries_87d05cd0")} </Text>
                  {widgetDebugData.error ? (
                    <Text style={[styles.debugErrorText, { color: theme.error }]}>
                      {widgetDebugData.error}
                    </Text>
                  ) : null}
                  {futureWidgetDebugEntries.length === 0 ? (
                    <Text
                      style={[styles.debugEmptyText, { color: theme.textSecondary }]}
                    >
                      {uiT("ui.no_future_widget_updates_are_currently_scheduled_59dac69f")} </Text>
                  ) : (
                    futureWidgetDebugEntries.map((entry, index) => {
                      const subtitle =
                        entry.mode === "reviews"
                          ? `${entry.reviewsCountValue} reviews · ${entry.reviewsSecondaryLabel}`
                          : `${entry.streakPrimaryLabel} · ${entry.streakSecondaryLabel} · ${entry.streakTertiaryLabel}`;

                      return (
                        <View
                          key={`${entry.timestamp}-${index}`}
                          style={[
                            styles.debugTimelineRow,
                            {
                              borderBottomColor: theme.border,
                              borderBottomWidth:
                                index === futureWidgetDebugEntries.length - 1
                                  ? 0
                                  : StyleSheet.hairlineWidth,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.debugTimelineTitle, { color: theme.textColor }]}
                          >
                            {entry.localDateLabel} · {entry.mode}
                          </Text>
                          <Text
                            style={[
                              styles.debugTimelineSubtitle,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {subtitle}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  content: {
    paddingTop: 16,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingItemColumn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
  },
  settingSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  gradientSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modeSelector: {
    marginTop: 10,
    gap: 10,
  },
  modeButton: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modeTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  modeDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  manualSectionTitle: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  gradientButton: {
    width: "31.5%",
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
  },
  gradientPreviewContainer: {
    width: "100%",
    height: 22,
    borderRadius: 6,
    overflow: "hidden",
  },
  gradientPreview: {
    width: "100%",
    height: 22,
  },
  gradientLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  debugRefreshButton: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  debugRefreshText: {
    fontSize: 13,
    fontWeight: "700",
  },
  debugMetaText: {
    marginTop: 8,
    fontSize: 12,
  },
  debugTimelineCard: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  debugTimelineRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  debugTimelineTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  debugTimelineSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  debugEmptyText: {
    marginTop: 8,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  debugErrorText: {
    marginTop: 8,
    fontSize: 12,
    paddingHorizontal: 10,
  },
});
