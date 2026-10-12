import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsRowIcon } from "../../../ui/settings/settings-row-icon";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";
import { SettingsIcon as Ionicons } from "../../../ui/settings/settings-icon";
import React from "react";

import { Switch, Text, TouchableOpacity, View } from "react-native";

import {
  AdvancedSetting,
  AdvancedSettingsGroup,
} from "../components/AdvancedSettings";
import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function NotificationsSection() {
  useInterfaceLanguage();
  const {
    dailyLessonReminderEnabled,
    dailyLessonReminderMinimum,
    dailyLessonReminderMinimumMax,
    dailyLessonReminderMinimumMin,
    dailyLessonReminderMinimumStep,
    dailyReviewReminderEnabled,
    dailyReviewReminderHour,
    dailyReviewReminderMinute,
    enableReviewNotifications,
    formatReminderTimeLabel,
    getNextDailyLessonReminderMinimum,
    getPreviousDailyLessonReminderMinimum,
    handleBadgeNotificationChange,
    handleDailyLessonReminderChange,
    handleDailyLessonReminderMinimumChange,
    handleDailyReviewReminderChange,
    handleReviewNotificationChange,
    handleShowPendingNotifications,
    isAnyDailyReminderEnabled,
    openReminderTimeModal,
    Platform,
    showBadgeNotifications,
    theme,
    updateSectionOffset,
  } = useSettingsControllerContext();

  return (
    <>
      {/* Notifications Section */}
      <SettingsSectionSurface
        style={[
          styles.section,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          },
        ]}
        onLayout={(event) => {
          updateSectionOffset("notifications", event.nativeEvent.layout.y);
        }}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textColor, borderBottomColor: theme.border },
          ]}
        >
          {uiT("ui.notifications_78801183")} </Text>

        {Platform.OS !== "android" && (
          <View
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
          >

            <SettingsRowIcon setting="badge-notify" color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.app_badge_notifications_a1903329")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.show_review_count_in_app_icon_badge_89e148e1")} </Text>
            </View>
            <Switch
              value={showBadgeNotifications}
              onValueChange={handleBadgeNotificationChange}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
        )}

        <View
          style={[
            styles.settingItem,
            {
              borderBottomColor:
                Platform.OS === "ios" || Platform.OS === "android" || __DEV__
                  ? theme.border
                  : "transparent",
            },
          ]}
        >

          <SettingsRowIcon setting="review-notify" color={theme.primary} />
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              {uiT("ui.review_notifications_9e7c277b")} </SettingsLabel>
            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {uiT("ui.get_notified_when_new_reviews_become_available_7ca7f769")} </Text>
          </View>
          <Switch
            value={enableReviewNotifications}
            onValueChange={handleReviewNotificationChange}
            trackColor={{ false: "#767577", true: theme.primary }}
            thumbColor="#f4f3f4"
          />
        </View>

        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <>
            <View
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
            >

              <SettingsRowIcon setting="daily-review-reminder" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.daily_review_reminder_da6aa108")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.send_one_reminder_at_your_chosen_local_time_if_reviews_are_still_56171ab7")} </Text>
              </View>
              <Switch
                value={dailyReviewReminderEnabled}
                onValueChange={handleDailyReviewReminderChange}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>

            <View
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
            >

              <SettingsRowIcon setting="daily-lesson-reminder" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.daily_lesson_reminder_48a35c8a")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.send_one_reminder_when_your_minimum_daily_lessons_are_not_met_and_09eea02b")} </Text>
              </View>
              <Switch
                value={dailyLessonReminderEnabled}
                onValueChange={handleDailyLessonReminderChange}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>

            {dailyLessonReminderEnabled && (
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
              >
                <Ionicons
                  name="options"
                  size={24}
                  color={theme.primary}
                  style={styles.settingIcon}
                />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.minimum_daily_lessons_c7339169")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.set_your_daily_lesson_goal_value_value_step_value_bb330e57", {value1: (dailyLessonReminderMinimumMin), value2: (dailyLessonReminderMinimumMax), value3: (dailyLessonReminderMinimumStep)})}
                  </Text>
                </View>
                <View style={styles.batchSizeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.batchSizeButton,
                      { backgroundColor: theme.border },
                      dailyLessonReminderMinimum <=
                        dailyLessonReminderMinimumMin &&
                        styles.batchSizeButtonDisabled,
                    ]}
                    onPress={() =>
                      void handleDailyLessonReminderMinimumChange(
                        getPreviousDailyLessonReminderMinimum(
                          dailyLessonReminderMinimum,
                        ),
                      )
                    }
                    disabled={
                      dailyLessonReminderMinimum <=
                      dailyLessonReminderMinimumMin
                    }
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={
                        dailyLessonReminderMinimum <=
                        dailyLessonReminderMinimumMin
                          ? theme.textSecondary
                          : theme.textColor
                      }
                    />
                  </TouchableOpacity>
                  <Text
                    style={[styles.batchSizeValue, { color: theme.textColor }]}
                  >
                    {dailyLessonReminderMinimum}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.batchSizeButton,
                      { backgroundColor: theme.border },
                      dailyLessonReminderMinimum >=
                        dailyLessonReminderMinimumMax &&
                        styles.batchSizeButtonDisabled,
                    ]}
                    onPress={() =>
                      void handleDailyLessonReminderMinimumChange(
                        getNextDailyLessonReminderMinimum(
                          dailyLessonReminderMinimum,
                        ),
                      )
                    }
                    disabled={
                      dailyLessonReminderMinimum >=
                      dailyLessonReminderMinimumMax
                    }
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={
                        dailyLessonReminderMinimum >=
                        dailyLessonReminderMinimumMax
                          ? theme.textSecondary
                          : theme.textColor
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  borderBottomColor: __DEV__ ? theme.border : "transparent",
                  opacity: isAnyDailyReminderEnabled ? 1 : 0.5,
                },
              ]}
              disabled={!isAnyDailyReminderEnabled}
              onPress={openReminderTimeModal}
            >
              <Ionicons
                name="time-outline"
                size={24}
                color={theme.primary}
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.reminder_time_80381e78")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.shared_by_daily_review_and_lesson_reminders_d0464f3c")} </Text>
              </View>
              <Text
                style={[styles.settingValueText, { color: theme.textColor }]}
              >
                {formatReminderTimeLabel(
                  dailyReviewReminderHour,
                  dailyReviewReminderMinute,
                )}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </>
        )}

        {__DEV__ && (
          <AdvancedSettingsGroup>
            <AdvancedSetting>
              <TouchableOpacity
                style={[
                  styles.settingItem,
                  { borderBottomColor: "transparent" },
                ]}
                onPress={handleShowPendingNotifications}
              >

                <SettingsRowIcon setting="scheduled-notify" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.view_scheduled_notifications_9c44bf74")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.debug_see_all_pending_notifications_and_badges_adfc60d0")} </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </AdvancedSetting>
          </AdvancedSettingsGroup>
        )}
      </SettingsSectionSurface>
    </>
  );
}
