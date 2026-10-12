import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import {SettingsIcon as Ionicons} from "../../../ui/settings/settings-icon";
import React from "react";

import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function LevelAnalyticsExportModal() {
  useInterfaceLanguage();
  const {
    availableLevelAnalyticsLevels,
    clearLevelAnalyticsLevels,
    handleConfirmLevelAnalyticsExport,
    isExportingLevelAnalytics,
    levelAnalyticsExportFormat,
    selectAllLevelAnalyticsLevels,
    selectedLevelAnalyticsLevels,
    setLevelAnalyticsExportFormat,
    setShowLevelAnalyticsExportModal,
    sheetBottomPadding,
    sheetHorizontalPadding,
    showLevelAnalyticsExportModal,
    theme,
    toggleLevelAnalyticsLevelSelection,
  } = useSettingsControllerContext();

  return (
    <>
      <Modal
        visible={showLevelAnalyticsExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLevelAnalyticsExportModal(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setShowLevelAnalyticsExportModal(false)}
        >
          <View
            style={[
              styles.voicePickerModalOverlay,
              {
                paddingHorizontal: sheetHorizontalPadding,
                paddingBottom: sheetBottomPadding,
              },
            ]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.levelAnalyticsExportModalContent,
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                <Text
                  style={[
                    styles.voicePickerModalTitle,
                    { color: theme.textColor, paddingBottom: 8 },
                  ]}
                >
                  {uiT("ui.export_level_analytics_79267e55")} </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary, paddingHorizontal: 16 },
                  ]}
                >
                  {uiT("ui.select_dataset_type_and_levels_to_include_in_your_csv_export_92a087fc")} </Text>

                <View style={styles.levelAnalyticsFormatRow}>
                  <TouchableOpacity
                    style={[
                      styles.levelAnalyticsFormatButton,
                      {
                        borderColor:
                          levelAnalyticsExportFormat === "summary"
                            ? theme.primary
                            : theme.border,
                        backgroundColor:
                          levelAnalyticsExportFormat === "summary"
                            ? `${theme.primary}20`
                            : "transparent",
                      },
                    ]}
                    onPress={() => setLevelAnalyticsExportFormat("summary")}
                  >
                    <Text
                      style={[
                        styles.levelAnalyticsFormatButtonTitle,
                        {
                          color:
                            levelAnalyticsExportFormat === "summary"
                              ? theme.primary
                              : theme.textColor,
                        },
                      ]}
                    >
                      {uiT("ui.summary_8e76a94a")} </Text>
                    <Text
                      style={[
                        styles.levelAnalyticsFormatButtonSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {uiT("ui.one_row_per_level_b4668689")} </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.levelAnalyticsFormatButton,
                      {
                        borderColor:
                          levelAnalyticsExportFormat === "detailed"
                            ? theme.primary
                            : theme.border,
                        backgroundColor:
                          levelAnalyticsExportFormat === "detailed"
                            ? `${theme.primary}20`
                            : "transparent",
                      },
                    ]}
                    onPress={() => setLevelAnalyticsExportFormat("detailed")}
                  >
                    <Text
                      style={[
                        styles.levelAnalyticsFormatButtonTitle,
                        {
                          color:
                            levelAnalyticsExportFormat === "detailed"
                              ? theme.primary
                              : theme.textColor,
                        },
                      ]}
                    >
                      {uiT("ui.detailed_6d46fcd5")} </Text>
                    <Text
                      style={[
                        styles.levelAnalyticsFormatButtonSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {uiT("ui.one_row_per_subject_2be52e78")} </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.levelAnalyticsLevelHeader}>
                  <Text
                    style={[
                      styles.levelAnalyticsLevelTitle,
                      { color: theme.textColor },
                    ]}
                  >
                    {uiT("ui.included_levels_9e04b7ec")}{selectedLevelAnalyticsLevels.length})
                  </Text>
                  <View style={styles.levelAnalyticsQuickActions}>
                    <TouchableOpacity
                      style={[
                        styles.levelAnalyticsQuickActionButton,
                        { borderColor: theme.border },
                      ]}
                      onPress={selectAllLevelAnalyticsLevels}
                    >
                      <Text
                        style={[
                          styles.levelAnalyticsQuickActionText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {uiT("ui.all_a52ace42")} </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.levelAnalyticsQuickActionButton,
                        { borderColor: theme.border },
                      ]}
                      onPress={clearLevelAnalyticsLevels}
                    >
                      <Text
                        style={[
                          styles.levelAnalyticsQuickActionText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {uiT("ui.none_dc937b59")} </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  style={styles.levelAnalyticsLevelsScroll}
                  contentContainerStyle={styles.levelAnalyticsLevelsContent}
                  showsVerticalScrollIndicator={false}
                >
                  {availableLevelAnalyticsLevels.map((level) => {
                    const isSelected =
                      selectedLevelAnalyticsLevels.includes(level);
                    return (
                      <TouchableOpacity
                        key={`level-export-${level}`}
                        style={[
                          styles.levelAnalyticsLevelRow,
                          { borderBottomColor: theme.border },
                        ]}
                        onPress={() =>
                          toggleLevelAnalyticsLevelSelection(level)
                        }
                      >
                        <Text
                          style={[
                            styles.levelAnalyticsLevelRowText,
                            { color: theme.textColor },
                          ]}
                        >
                          {uiT("ui.level_1709305c")} {level}
                        </Text>
                        <Ionicons
                          name={isSelected ? "checkbox" : "square-outline"}
                          size={22}
                          color={
                            isSelected ? theme.primary : theme.textSecondary
                          }
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.reminderTimeActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.reminderTimeButton,
                      { borderColor: theme.border },
                    ]}
                    onPress={() => setShowLevelAnalyticsExportModal(false)}
                  >
                    <Text
                      style={[
                        styles.reminderTimeButtonText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {uiT("ui.cancel_19766ed6")} </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.reminderTimeButton,
                      styles.reminderTimeSaveButton,
                      {
                        backgroundColor:
                          selectedLevelAnalyticsLevels.length > 0
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                    onPress={() => {
                      void handleConfirmLevelAnalyticsExport();
                    }}
                    disabled={
                      selectedLevelAnalyticsLevels.length === 0 ||
                      isExportingLevelAnalytics
                    }
                  >
                    <Text
                      style={[styles.reminderTimeButtonText, { color: "#fff" }]}
                    >
                      {uiT("ui.export_csv_91f71c14")} </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
