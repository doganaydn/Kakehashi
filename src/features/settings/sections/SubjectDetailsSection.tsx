import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsRowIcon } from "../../../ui/settings/settings-row-icon";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";

import React from "react";

import { Switch, Text, View } from "react-native";

import { useSettingsStore } from "../../../utils/store";
import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function SubjectDetailsSection() {
  useInterfaceLanguage();
  const { theme, updateSectionOffset } = useSettingsControllerContext();
  const showSubjectHistory = useSettingsStore(
    (state) => state.showSubjectHistory,
  );
  const setShowSubjectHistory = useSettingsStore(
    (state) => state.setShowSubjectHistory,
  );

  return (
    <SettingsSectionSurface
      style={[
        styles.section,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
      onLayout={(event) => {
        updateSectionOffset("subjectDetails", event.nativeEvent.layout.y);
      }}
    >
      <Text
        style={[
          styles.sectionTitle,
          { color: theme.textColor, borderBottomColor: theme.border },
        ]}
      >
        {uiT("ui.subject_details_3628f952")} </Text>
      <View style={[styles.settingItem, { borderBottomColor: "transparent" }]}>

        <SettingsRowIcon setting="history" color={theme.primary} />
        <View style={styles.settingTextContainer}>
          <SettingsLabel
            style={[styles.settingText, { color: theme.textColor }]}
          >
            {uiT("ui.subject_update_history_54c273de")} </SettingsLabel>
          <Text style={[styles.settingSubtext, { color: theme.textSecondary }]}>
            {uiT("ui.show_the_update_history_button_on_subject_detail_pages_0b61dbec")} </Text>
        </View>
        <Switch
          value={showSubjectHistory}
          onValueChange={setShowSubjectHistory}
          trackColor={{ false: "#767577", true: theme.primary }}
          thumbColor="#f4f3f4"
          accessibilityLabel={uiT("ui.show_subject_update_history_3d79d270")}
        />
      </View>
    </SettingsSectionSurface>
  );
}
