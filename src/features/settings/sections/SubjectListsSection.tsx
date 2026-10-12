import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsRowIcon } from "../../../ui/settings/settings-row-icon";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";
import { SettingsIcon as Ionicons } from "../../../ui/settings/settings-icon";
import React from "react";

import { Text, TouchableOpacity, View } from "react-native";

import {
  AdvancedSetting,
  AdvancedSettingsGroup,
} from "../components/AdvancedSettings";
import { KnownVocabularyExportSetting } from "../components/known-vocabulary-export-setting";
import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function SubjectListsSection() {
  useInterfaceLanguage();
  const { router, theme, updateSectionOffset } = useSettingsControllerContext();

  return (
    <>
      {/* Subject Lists Section */}
      <SettingsSectionSurface
        style={[
          styles.section,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          },
        ]}
        onLayout={(event) => {
          updateSectionOffset("subjectLists", event.nativeEvent.layout.y);
        }}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textColor, borderBottomColor: theme.border },
          ]}
        >
          {uiT("ui.subject_lists_20c1f7d1")} </Text>

        <AdvancedSettingsGroup>
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            onPress={() => router.push("/subject-lists")}
          >

            <SettingsRowIcon setting="subject-lists" color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.manage_subject_lists_f2184aa9")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.create_and_manage_saved_subject_collections_for_custom_study_e5cb9ab0")} </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
          <AdvancedSetting>
            <KnownVocabularyExportSetting />
          </AdvancedSetting>
        </AdvancedSettingsGroup>
      </SettingsSectionSurface>
    </>
  );
}
