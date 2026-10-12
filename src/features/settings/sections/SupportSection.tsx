import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";
import {
  SettingsIcon as Ionicons,
  SettingsIcon as MaterialCommunityIcons,
} from "../../../ui/settings/settings-icon";
import React from "react";
import GitHubMark from "../../../components/GitHubMark";

import { Text, TouchableOpacity, View } from "react-native";

import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function SupportSection() {
  useInterfaceLanguage();
  const {
    getCurrentPatchNotesVersion,
    handlePatreonPress,
    handleRateAppPress,
    lastSeenPatchNotesVersion,
    Platform,
    router,
    setShowBunproSurveyModal,
    setShowOpenSourceModal,
    showBunproSurvey,
    theme,
    updateSectionOffset,
  } = useSettingsControllerContext();

  return (
    <>
      {/* Support Section */}
      <SettingsSectionSurface
        style={[
          styles.section,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          },
        ]}
        onLayout={(event) => {
          updateSectionOffset("support", event.nativeEvent.layout.y);
        }}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textColor, borderBottomColor: theme.border },
          ]}
        >
          {uiT("ui.support_be91940b")} </Text>

        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: theme.border }]}
          onPress={() => router.push("/issues")}
        >
          <Ionicons
            name="chat"
            size={24}
            color={theme.primary}
            style={styles.settingIcon}
          />
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              {uiT("ui.issues_feedback_c7ece822")} </SettingsLabel>

            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {uiT("ui.join_the_discussion_report_bugs_and_request_features_b4de4270")} </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: theme.border }]}
          onPress={() => setShowOpenSourceModal(true)}
        >
          <View style={styles.settingIcon}>
            <GitHubMark
              size={24}
              color={theme.isDark ? "#FFFFFF" : "#24292F"}
              accessibilityLabel={uiT("ui.github_f911e414")}
            />
          </View>
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              {uiT("ui.open_source_fdb627ef")} </SettingsLabel>
            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {uiT("ui.contribute_to_kakehashi_or_star_the_repo_c01fe36d")} </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              borderBottomColor: theme.border,
            },
          ]}
          onPress={() => {
            void handleRateAppPress();
          }}
        >
          <Ionicons
            name="star"
            size={24}
            color="#FFD700"
            style={styles.settingIcon}
          />
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              {uiT("ui.rate_app_b2eeb197")} </SettingsLabel>
            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {uiT("ui.help_others_discover_this_app_6b23d004")} </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: theme.border }]}
          onPress={() => {
            void handlePatreonPress();
          }}
        >
          <MaterialCommunityIcons
            name="patreon"
            size={24}
            color={theme.textColor}
            style={styles.settingIcon}
          />
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              Patreon
            </SettingsLabel>
            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {uiT("ui.support_the_app_with_recurring_support_94259a73")} </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              borderBottomColor:
                showBunproSurvey || Platform.OS === "android"
                  ? theme.border
                  : "transparent",
            },
          ]}
          onPress={() => router.push("/whats-new")}
        >
          <Ionicons
            name="sparkles"
            size={24}
            color={theme.primary}
            style={styles.settingIcon}
          />
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              {uiT("ui.what_s_new_561b17ed")} </SettingsLabel>
            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {uiT("ui.see_the_latest_updates_02a0035d")} </Text>
          </View>
          {lastSeenPatchNotesVersion !== getCurrentPatchNotesVersion() && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>{uiT("ui.new_a253ff09")}</Text>
            </View>
          )}
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        {showBunproSurvey && (
          <TouchableOpacity
            style={[
              styles.settingItem,
              {
                borderBottomColor:
                  Platform.OS === "android" ? theme.border : "transparent",
              },
            ]}
            onPress={() => setShowBunproSurveyModal(true)}
          >
            <Ionicons
              name="survey"
              size={24}
              color={theme.primary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.bunpro_survey_001933d9")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.2_quick_questions_de9c30fc")} </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        )}

        {Platform.OS === "android" && (
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            onPress={() => router.push("/tip-developer")}
          >
            <Ionicons
              name="gift"
              size={24}
              color={theme.primary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.tip_developer_b34defc4")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.support_ongoing_development_4c7e318c")} </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </SettingsSectionSurface>
    </>
  );
}
