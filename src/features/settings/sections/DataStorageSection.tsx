import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";
import { SettingsIcon as Ionicons } from "../../../ui/settings/settings-icon";
import React from "react";

import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function DataStorageSection() {
  useInterfaceLanguage();
  const {
    cacheHealthStatus,
    handleCheckCacheHealth,
    handleRepairCache,
    isCheckingCacheHealth,
    isRepairingCache,
    showDataStorageSection,
    theme,
    updateSectionOffset,
  } = useSettingsControllerContext();

  return (
    <>
      {/* Data & Storage Section - Feature flagged by user email */}
      {showDataStorageSection && (
        <SettingsSectionSurface
          style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
          onLayout={(event) => {
            updateSectionOffset("dataStorage", event.nativeEvent.layout.y);
          }}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.textColor, borderBottomColor: theme.border },
            ]}
          >
            {uiT("ui.data_storage_31423c3c")} </Text>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={handleCheckCacheHealth}
            disabled={isCheckingCacheHealth || isRepairingCache}
          >
            <Ionicons
              name="medkit"
              size={24}
              color={theme.primary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.check_cache_health_7d0f00fa")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {cacheHealthStatus
                  ? cacheHealthStatus.isHealthy
                    ? uiT("ui.healthy_value_subjects_d780acff", {value1: (cacheHealthStatus.validSubjects)})
                    : uiT("ui.issues_detected_value_problem_s_f6e37e78", {value1: (cacheHealthStatus.issues.length)})
                  : uiT("ui.verify_search_and_offline_data_integrity_9091c1d2")}
              </Text>
            </View>
            {isCheckingCacheHealth ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textSecondary}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            onPress={handleRepairCache}
            disabled={isRepairingCache || isCheckingCacheHealth}
          >
            <Ionicons
              name="build"
              size={24}
              color="#ff9500"
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.repair_cache_ba243317")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.fix_corrupted_data_for_search_and_offline_mode_8f08fba4")} </Text>
            </View>
            {isRepairingCache ? (
              <ActivityIndicator size="small" color="#ff9500" />
            ) : (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textSecondary}
              />
            )}
          </TouchableOpacity>
        </SettingsSectionSurface>
      )}
    </>
  );
}
