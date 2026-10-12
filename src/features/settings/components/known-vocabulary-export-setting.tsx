import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Clipboard, Text, TouchableOpacity, View } from "react-native";

import { buildKnownVocabularyList } from "../../../utils/known-vocabulary-export";
import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function KnownVocabularyExportSetting() {
  useInterfaceLanguage();
  const { dashboardData, theme } = useSettingsControllerContext();

  const copyKnownVocabulary = () => {
    if (
      !dashboardData.dataLoadingState.assignments ||
      !dashboardData.dataLoadingState.subjects
    ) {
      Alert.alert(
        uiT("ui.vocabulary_data_not_ready_ec11b34a"),
        uiT("ui.refresh_your_dashboard_and_wait_for_your_wanikani_progress_to_fin_0f46629c"),
      );
      return;
    }

    try {
      const words = buildKnownVocabularyList(
        dashboardData.subjects,
        dashboardData.assignments,
      );

      if (words.length === 0) {
        Alert.alert(
          uiT("ui.no_vocabulary_to_copy_d1799a9f"),
          uiT("ui.complete_a_wanikani_vocabulary_lesson_to_add_words_to_your_known_64993103"),
        );
        return;
      }

      Clipboard.setString(words.join("\n"));
      Alert.alert(
        uiT("ui.vocabulary_copied_30676b05"),
        uiT("ui.value_value_copied_to_your_clipboard_one_per_line_you_can_paste_t_cad1a29a", {value1: (words.length.toLocaleString()), value2: (words.length === 1 ? "word" : "words")}),
      );
    } catch (error) {
      console.error("Failed to copy known vocabulary:", error);
      Alert.alert(
        uiT("ui.could_not_copy_vocabulary_e8b8e12d"),
        uiT("ui.refresh_your_dashboard_and_try_again_29a15e03"),
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: "transparent" }]}
      onPress={copyKnownVocabulary}
      accessibilityRole="button"
      accessibilityLabel={uiT("ui.copy_known_vocabulary_4f14e1de")}
      accessibilityHint={uiT("ui.copies_your_learned_wanikani_vocabulary_to_the_clipboard_one_japa_b8ccea61")}
    >
      <Ionicons
        name="copy-outline"
        size={24}
        color={theme.primary}
        style={styles.settingIcon}
      />
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingText, { color: theme.textColor }]}>
          {uiT("ui.copy_known_vocabulary_4f14e1de")} </Text>
        <Text style={[styles.settingSubtext, { color: theme.textSecondary }]}>
          {uiT("ui.copy_wanikani_vocabulary_from_completed_lessons_including_kana_on_26b3ea0f")} </Text>
      </View>
    </TouchableOpacity>
  );
}
