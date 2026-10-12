import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsRowIcon } from "../../../ui/settings/settings-row-icon";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";
import { SettingsIcon as Ionicons } from "../../../ui/settings/settings-icon";
import React from "react";
import { LevelRecapIcon } from "../../../components/wrapped/LevelRecapIcon";

import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import {
  AdvancedSetting,
  AdvancedSettingsGroup,
} from "../components/AdvancedSettings";
import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function LevelRecapSection() {
  useInterfaceLanguage();
  const {
    dashboardData,
    handleOpenLevelAnalyticsExportModal,
    isExportingLevelAnalytics,
    router,
    showLevelRecapSection,
    theme,
    updateSectionOffset,
  } = useSettingsControllerContext();

  return (
    <>
      {/* Level Recap */}
      {showLevelRecapSection && (
        <SettingsSectionSurface
          style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
          onLayout={(event) => {
            updateSectionOffset("levelRecap", event.nativeEvent.layout.y);
          }}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textColor, borderBottomColor: theme.border },
            ]}
          >
            {uiT("ui.level_recap_368c8143")} </Text>

          <AdvancedSettingsGroup>
            {dashboardData.currentLevel > 1 && (
              <TouchableOpacity
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
                onPress={() =>
                  router.push(
                    `/level-wrapped/${dashboardData.currentLevel - 1}`,
                  )
                }
              >
                <View style={styles.settingIcon}>
                  <LevelRecapIcon size={24} color="#7c3aed" />
                </View>
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.level_1709305c")} {dashboardData.currentLevel - 1} {uiT("ui.summary_8e76a94a")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.view_your_previous_level_recap_61e932cd")} </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}

            <AdvancedSetting>
              <TouchableOpacity
                style={[
                  styles.settingItem,
                  { borderBottomColor: "transparent" },
                ]}
                onPress={() => {
                  handleOpenLevelAnalyticsExportModal();
                }}
                disabled={isExportingLevelAnalytics}
              >

                <SettingsRowIcon setting="export-level" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.export_level_analytics_79267e55")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.choose_levels_and_export_summary_or_detailed_csv_1653421e")} </Text>
                </View>
                {isExportingLevelAnalytics ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                )}
              </TouchableOpacity>
            </AdvancedSetting>
          </AdvancedSettingsGroup>
        </SettingsSectionSurface>
      )}
    </>
  );
}
