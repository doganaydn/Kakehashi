import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";
import { SettingsIcon as Ionicons } from "../../../ui/settings/settings-icon";
import React from "react";

import { Text, TouchableOpacity, View } from "react-native";

import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function ApiDebugSection() {
  useInterfaceLanguage();
  const {
    canAccessApiDebugTools,
    handleClearApiDebug,
    handleClearApiTimeline,
    handleDevClearAndLogout,
    handleExportApiTimeline,
    handleShowApiDetails,
    handleShowApiSummary,
    handleShowApiTimelineSummary,
    theme,
    updateSectionOffset,
  } = useSettingsControllerContext();

  return (
    <>
      {/* API Debug Section - Dev and Portego */}
      {canAccessApiDebugTools && (
        <SettingsSectionSurface
          style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
          onLayout={(event) => {
            updateSectionOffset("apiDebug", event.nativeEvent.layout.y);
          }}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textColor, borderBottomColor: theme.border },
            ]}
          >
            {uiT("ui.api_debug_tools_d518ef47")} </Text>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={handleShowApiTimelineSummary}
          >
            <Ionicons
              name="time"
              size={24}
              color={theme.primary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.show_api_timeline_summary_ce9041db")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.print_request_timeline_stats_with_slowest_calls_bf364459")} </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={handleExportApiTimeline}
          >
            <Ionicons
              name="download-outline"
              size={24}
              color={theme.primary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.export_api_timeline_json_5071b5e8")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.export_url_params_response_preview_and_timing_per_call_7fae2475")} </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={handleShowApiSummary}
          >
            <Ionicons
              name="bar-chart"
              size={24}
              color={theme.primary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.show_api_summary_43dc5a4c")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.print_api_call_statistics_to_console_18aa556f")} </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={handleShowApiDetails}
          >
            <Ionicons
              name="list"
              size={24}
              color={theme.primary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.show_api_details_50a5a5e2")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.print_detailed_call_log_with_timestamps_and_payloads_353000c7")} </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={handleClearApiTimeline}
          >
            <Ionicons
              name="trash-outline"
              size={24}
              color="#ff9500"
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.clear_api_timeline_51eaa4bf")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.remove_captured_request_timeline_entries_only_3fca0105")} </Text>
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
                borderBottomColor: __DEV__ ? theme.border : "transparent",
              },
            ]}
            onPress={handleClearApiDebug}
          >
            <Ionicons
              name="trash-bin"
              size={24}
              color="#ff9500"
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.clear_api_debug_history_21bf6fe2")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.reset_api_call_history_and_in_memory_cache_b454033f")} </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: "transparent" }]}
              onPress={handleDevClearAndLogout}
            >
              <Ionicons
                name="bug"
                size={24}
                color="#ff3b30"
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: "#ff3b30" }]}
                >
                  {uiT("ui.clear_all_data_logout_c42eb1d7")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.completely_reset_app_to_fresh_state_for_debugging_first_time_issu_d971ff4d")} </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </SettingsSectionSurface>
      )}
    </>
  );
}
