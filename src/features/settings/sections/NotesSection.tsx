import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsRowIcon } from "../../../ui/settings/settings-row-icon";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";

import React from "react";

import { Switch, Text, View } from "react-native";

import { useSettingsStore } from "../../../utils/store";
import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function NotesSection() {
  useInterfaceLanguage();
  const advancedNoteEditorEnabled = useSettingsStore(
    (state) => state.advancedNoteEditorEnabled,
  );
  const setAdvancedNoteEditorEnabled = useSettingsStore(
    (state) => state.setAdvancedNoteEditorEnabled,
  );
  const { theme, updateSectionOffset } = useSettingsControllerContext();

  return (
    <SettingsSectionSurface
      style={[
        styles.section,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
        },
      ]}
      onLayout={(event) => {
        updateSectionOffset("notes", event.nativeEvent.layout.y);
      }}
    >
      <Text
        style={[
          styles.sectionTitle,
          { color: theme.textColor, borderBottomColor: theme.border },
        ]}
      >
        {uiT("ui.notes_8a7525b1")} </Text>

      <View style={[styles.settingItem, { borderBottomColor: "transparent" }]}>

        <SettingsRowIcon setting="advanced-note" color={theme.primary} />
        <View style={styles.settingTextContainer}>
          <SettingsLabel
            style={[styles.settingText, { color: theme.textColor }]}
          >
            {uiT("ui.advanced_note_editor_cf326221")} </SettingsLabel>
          <Text style={[styles.settingSubtext, { color: theme.textSecondary }]}>
            {uiT("ui.use_formatting_and_subject_links_in_study_notes_existing_formatte_b06a6f4f")} </Text>
        </View>
        <Switch
          accessibilityLabel={uiT("ui.advanced_note_editor_cf326221")}
          value={advancedNoteEditorEnabled}
          onValueChange={setAdvancedNoteEditorEnabled}
          trackColor={{ false: "#767577", true: theme.primary }}
          thumbColor="#f4f3f4"
        />
      </View>
    </SettingsSectionSurface>
  );
}
