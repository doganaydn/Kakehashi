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

export function KanjiLearningSection() {
  useInterfaceLanguage();
  const {
    groupKanjiVocabularyExamplesByReading,
    setGroupKanjiVocabularyExamplesByReading,
    setShowInlineRadicalReminders,
    setShowKanjiEtymology,
    setKanjiReadingTextToSpeechEnabled,
    setShowOnyomiInKatakana,
    setShowStrokeOrder,
    setStrokeLeniency,
    setVisuallySimilarKanjiSource,
    showInlineRadicalReminders,
    showKanjiEtymology,
    kanjiReadingTextToSpeechEnabled,
    showOnyomiInKatakana,
    showStrokeOrder,
    strokeLeniency,
    theme,
    updateSectionOffset,
    visuallySimilarKanjiSource,
  } = useSettingsControllerContext();

  return (
    <>
      {/* Kanji Learning Section */}
      <SettingsSectionSurface
        style={[
          styles.section,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          },
        ]}
        onLayout={(event) => {
          updateSectionOffset("kanji", event.nativeEvent.layout.y);
        }}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textColor, borderBottomColor: theme.border },
          ]}
        >
          {uiT("ui.kanji_learning_b4e0879a")} </Text>

        <AdvancedSettingsGroup>
          <View
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
          >

            <SettingsRowIcon setting="stroke-animation" color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.stroke_order_animation_42d704c1")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.show_animated_stroke_order_in_kanji_details_8d1b7b68")} </Text>
            </View>
            <Switch
              value={showStrokeOrder}
              onValueChange={setShowStrokeOrder}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
          >

            <SettingsRowIcon setting="radical-reminders" color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.inline_radical_reminders_da63a6aa")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.show_radical_mnemonics_and_illustrations_inside_kanji_details_d8941395")} </Text>
            </View>
            <Switch
              value={showInlineRadicalReminders}
              onValueChange={setShowInlineRadicalReminders}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
              accessibilityLabel={uiT("ui.show_inline_radical_reminders_13b14c83")}
            />
          </View>

          <View
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
          >

            <SettingsRowIcon setting="etymology" color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.kanji_etymology_cc05e5b5")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.show_character_origins_and_structure_in_details_and_lessons_1fc817cc")} </Text>
            </View>
            <Switch
              value={showKanjiEtymology}
              onValueChange={setShowKanjiEtymology}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
              accessibilityLabel={uiT("ui.show_kanji_etymology_cab99ca7")}
            />
          </View>

          <View
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
          >

            <SettingsRowIcon setting="reading-speech" color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.kanji_reading_speech_9264f5d6")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.tap_a_kanji_reading_to_hear_it_with_your_device_s_japanese_voice_b8645783")} </Text>
            </View>
            <Switch
              value={kanjiReadingTextToSpeechEnabled}
              onValueChange={setKanjiReadingTextToSpeechEnabled}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
              accessibilityLabel={uiT("ui.enable_kanji_reading_speech_94ad0e23")}
            />
          </View>

          <AdvancedSetting>
            <View
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
            >

              <SettingsRowIcon setting="stroke-strictness" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.stroke_strictness_a4d8a3f9")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.tolerance_for_stroke_accuracy_68ccb029")} </Text>
              </View>
              <View style={styles.batchSizeSelector}>
                <TouchableOpacity
                  style={[
                    styles.batchSizeButton,
                    { backgroundColor: theme.border },
                    strokeLeniency <= 0.8 && styles.batchSizeButtonDisabled,
                  ]}
                  onPress={() => {
                    const levels = [0.8, 1.2, 1.8, 2.5];
                    // Find closest level index for legacy values
                    const currentIdx = levels.findIndex(
                      (l, i) => strokeLeniency <= l || i === levels.length - 1,
                    );
                    if (currentIdx > 0) {
                      setStrokeLeniency(levels[currentIdx - 1]);
                    }
                  }}
                  disabled={strokeLeniency <= 0.8}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={
                      strokeLeniency <= 0.8
                        ? theme.textSecondary
                        : theme.textColor
                    }
                  />
                </TouchableOpacity>
                <Text
                  style={[styles.leniencyValue, { color: theme.textColor }]}
                >
                  {strokeLeniency <= 0.8
                    ? uiT("ui.very_strict_a51ce93c")
                    : strokeLeniency <= 1.2
                      ? uiT("ui.strict_2e1a4c07")
                      : strokeLeniency <= 1.8
                        ? uiT("ui.lenient_5aa0926b")
                        : uiT("ui.very_lenient_a143e307")}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.batchSizeButton,
                    { backgroundColor: theme.border },
                    strokeLeniency >= 2.5 && styles.batchSizeButtonDisabled,
                  ]}
                  onPress={() => {
                    const levels = [0.8, 1.2, 1.8, 2.5];
                    // Find closest level index for legacy values
                    const currentIdx = levels.findIndex(
                      (l, i) => strokeLeniency <= l || i === levels.length - 1,
                    );
                    if (currentIdx < levels.length - 1) {
                      setStrokeLeniency(levels[currentIdx + 1]);
                    } else if (strokeLeniency > 2.5) {
                      // Handle legacy values above max - snap to max
                      setStrokeLeniency(2.5);
                    }
                  }}
                  disabled={strokeLeniency >= 2.5}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={
                      strokeLeniency >= 2.5
                        ? theme.textSecondary
                        : theme.textColor
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
            >

              <SettingsRowIcon setting="reading-examples" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.group_vocabulary_by_reading_b99dc5b3")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.organize_kanji_examples_under_on_yomi_kun_yomi_and_nanori_reading_02ec0060")} </Text>
              </View>
              <Switch
                value={groupKanjiVocabularyExamplesByReading}
                onValueChange={setGroupKanjiVocabularyExamplesByReading}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
                accessibilityLabel={uiT("ui.group_kanji_vocabulary_examples_by_reading_3e0814a5")}
              />
            </View>

            <View
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
            >
              <Text
                style={[
                  styles.settingIcon,
                  {
                    fontSize: 20,
                    fontWeight: "bold",
                    color: theme.primary,
                    width: 24,
                    textAlign: "center",
                  },
                ]}
              >
                ア
              </Text>
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.katakana_madness_c21f54fc")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.display_on_yomi_readings_in_katakana_instead_of_hiragana_28f05c90")} </Text>
              </View>
              <Switch
                value={showOnyomiInKatakana}
                onValueChange={setShowOnyomiInKatakana}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>

            <View
              style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            >

              <SettingsRowIcon setting="similar-kanji-source" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.similar_kanji_source_cc585406")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {visuallySimilarKanjiSource === "wanikani"
                    ? uiT("ui.using_wanikani_s_built_in_similar_kanji_3dc9ec9b")
                    : uiT("ui.using_niai_community_database_more_comprehensive_996862a4")}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.voiceSelectionButton,
                  { borderColor: theme.border },
                ]}
                onPress={() =>
                  setVisuallySimilarKanjiSource(
                    visuallySimilarKanjiSource === "wanikani"
                      ? "niai"
                      : "wanikani",
                  )
                }
              >
                <Text
                  style={[
                    styles.voiceSelectionText,
                    { color: theme.textColor },
                  ]}
                >
                  {visuallySimilarKanjiSource === "wanikani"
                    ? "WaniKani"
                    : uiT("ui.niai_d72a745b")}
                </Text>
              </TouchableOpacity>
            </View>
          </AdvancedSetting>
        </AdvancedSettingsGroup>
      </SettingsSectionSurface>
    </>
  );
}
