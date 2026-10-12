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

export function VocabularyContextSection() {
  useInterfaceLanguage();
  const {
    hideContextSentenceTranslations,
    hideContextSentenceTranslationsCompletely,
    router,
    setHideContextSentenceTranslations,
    setHideContextSentenceTranslationsCompletely,
    setShowContextSentenceSpeedControl,
    setShowMediaContextSentences,
    setShowPatternsOfUse,
    setShowPitchAccent,
    setShowSimilarVocabulary,
    setShowSingleKanjiVocabularySimilarKanji,
    setShowVocabularyFrequency,
    setShowJLPTLevel,
    showContextSentenceSpeedControl,
    showMediaContextSentences,
    showPatternsOfUse,
    showPitchAccent,
    showSimilarVocabulary,
    showSingleKanjiVocabularySimilarKanji,
    showVocabularyFrequency,
    showJLPTLevel,
    theme,
    updateSectionOffset,
  } = useSettingsControllerContext();

  return (
    <>
      {/* Vocabulary Context Section */}
      <SettingsSectionSurface
        style={[
          styles.section,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          },
        ]}
        onLayout={(event) => {
          updateSectionOffset("vocabContext", event.nativeEvent.layout.y);
        }}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textColor, borderBottomColor: theme.border },
          ]}
        >
          {uiT("ui.vocabulary_context_fba1e029")} </Text>

        <AdvancedSettingsGroup>
          <View
            style={[styles.settingItem, { borderBottomColor: "transparent" }]}
          >

            <SettingsRowIcon setting="pitch-graph" color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.pitch_accent_visualization_b7f4abf3")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.show_high_low_pitch_patterns_in_vocabulary_details_and_lesson_pag_e715b60d")} </Text>
            </View>
            <Switch
              value={showPitchAccent}
              onValueChange={setShowPitchAccent}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View
            style={[styles.settingItem, { borderBottomColor: "transparent" }]}
          >

            <SettingsRowIcon setting="hide-translation" color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.hide_translations_until_tapped_91778f1e")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.hide_english_translations_in_vocabulary_details_and_lessons_until_7f7c646d")} </Text>
            </View>
            <Switch
              accessibilityLabel={uiT("ui.hide_context_sentence_translations_until_tapped_a871187e")}
              value={hideContextSentenceTranslations}
              onValueChange={setHideContextSentenceTranslations}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
              disabled={hideContextSentenceTranslationsCompletely}
            />
          </View>

          <View
            style={[styles.settingItem, { borderBottomColor: "transparent" }]}
          >

            <SettingsRowIcon setting="media-context" color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.media_context_sentences_e683aa86")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.show_vocabulary_examples_from_anime_dramas_and_games_e4ea2b17")} </Text>
            </View>
            <Switch
              value={showMediaContextSentences}
              onValueChange={setShowMediaContextSentences}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <AdvancedSetting>
            <View
              style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            >

              <SettingsRowIcon setting="remove-translation" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.remove_translations_4a207a0b")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.show_only_japanese_in_context_sentences_media_examples_and_patter_b913d7eb")} </Text>
              </View>
              <Switch
                accessibilityLabel={uiT("ui.remove_context_sentence_translations_ede3835b")}
                value={hideContextSentenceTranslationsCompletely}
                onValueChange={setHideContextSentenceTranslationsCompletely}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            <View
              style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            >

              <SettingsRowIcon setting="jlpt" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.jlpt_level_d8254872")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.show_estimated_jlpt_levels_for_kanji_and_vocabulary_in_details_re_212fec45")} </Text>
              </View>
              <Switch
                accessibilityLabel={uiT("ui.show_jlpt_levels_4f9aeadd")}
                value={showJLPTLevel}
                onValueChange={setShowJLPTLevel}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            <View
              style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            >

              <SettingsRowIcon setting="vocab-frequency" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.vocabulary_frequency_746baa1e")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.show_jiten_frequency_ranks_and_enable_lesson_and_custom_review_fi_e81debfe")} </Text>
              </View>
              <Switch
                value={showVocabularyFrequency}
                onValueChange={setShowVocabularyFrequency}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
                accessibilityLabel={uiT("ui.show_vocabulary_frequency_ranks_1a6590f6")}
              />
            </View>
            <View
              style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            >

              <SettingsRowIcon setting="patterns" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.patterns_of_use_19a9469c")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.show_selectable_usage_patterns_in_vocabulary_details_and_lesson_p_6df1a8b3")} </Text>
              </View>
              <Switch
                value={showPatternsOfUse}
                onValueChange={setShowPatternsOfUse}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            <View
              style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            >

              <SettingsRowIcon setting="similar-vocab" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.similar_vocabulary_bf78b6ba")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.show_vocabulary_with_matching_readings_and_meanings_in_vocabulary_9a99567a")} </Text>
              </View>
              <Switch
                value={showSimilarVocabulary}
                onValueChange={setShowSimilarVocabulary}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>

            <View
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
            >

              <SettingsRowIcon setting="similar-single-kanji" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.single_kanji_vocab_similar_kanji_9d0c6c09")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.show_visually_similar_kanji_on_vocabulary_details_and_lessons_whe_3f220b95")} </Text>
              </View>
              <Switch
                value={showSingleKanjiVocabularySimilarKanji}
                onValueChange={setShowSingleKanjiVocabularySimilarKanji}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            <View
              style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            >

              <SettingsRowIcon setting="audio-speed" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.context_audio_speed_control_a4be828f")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.show_per_sentence_playback_speed_controls_in_vocabulary_context_b0bc727f")} </Text>
              </View>
              <Switch
                value={showContextSentenceSpeedControl}
                onValueChange={setShowContextSentenceSpeedControl}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            {showMediaContextSentences && (
              <TouchableOpacity
                style={[
                  styles.settingItem,
                  {
                    borderColor: theme.border,
                    borderBottomWidth: 0,
                  },
                ]}
                onPress={() => router.push("/immersion-kit-settings")}
              >

                <SettingsRowIcon setting="anime-list" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.manage_anime_list_03ace016")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.manually_select_available_animes_9ba104f4")} </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </AdvancedSetting>
        </AdvancedSettingsGroup>
      </SettingsSectionSurface>
    </>
  );
}
