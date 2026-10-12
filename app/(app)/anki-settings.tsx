import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { SettingsChoiceCards } from "../../src/ui/settings/settings-choice-cards";
import { SettingsFoldout } from "../../src/ui/settings/settings-foldout";
import { SettingsIcon as Ionicons } from "../../src/ui/settings/settings-icon";

import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AnkiDroidExportSettingsButton } from "../../src/components/AnkiDroidExportButton";
import { useSettingsStore } from "../../src/utils/store";
import { useTheme } from "../../src/utils/theme";

type AnkiScope = "both" | "meaning" | "reading";

const ANKI_SCOPE_OPTIONS: { value: AnkiScope; label: string }[] = [
  { value: "both", get label() { return uiT("ui.both_b6c1d862"); } },
  { value: "meaning", get label() { return uiT("ui.meaning_1f5d64b9"); } },
  { value: "reading", get label() { return uiT("ui.reading_463816d0"); } },
];

export default function AnkiSettingsScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const {
    ankiDroidExportEnabled,
    setAnkiDroidExportEnabled,
    ankiCardModeScope,
    setAnkiCardModeScope,
    ankiGroupQuestions,
    setAnkiGroupQuestions,
    ankiAskIncorrectPart,
    setAnkiAskIncorrectPart,
    ankiHideAnswerCompletely,
    setAnkiHideAnswerCompletely,
    ankiButtonlessMode,
    setAnkiButtonlessMode,
    ankiShowReplayAudioButton,
    setAnkiShowReplayAudioButton,
    ankiShowOtherAcceptedAnswersAndUserSynonyms,
    setAnkiShowOtherAcceptedAnswersAndUserSynonyms,
    ankiShowKanjiComposition,
    setAnkiShowKanjiComposition,
    ankiShowWaniKaniGrammarTags,
    setAnkiShowWaniKaniGrammarTags,
    ankiShowPitchAccentNumbers,
    setAnkiShowPitchAccentNumbers,
    ankiShowPitchAccentGraph,
    setAnkiShowPitchAccentGraph,
  } = useSettingsStore();

  const handleScopeChange = (scope: AnkiScope) => {
    setAnkiCardModeScope(scope);
    if (scope !== "both" && ankiGroupQuestions) {
      setAnkiGroupQuestions(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <StatusBar style={theme.statusBarStyle} />

      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.backgroundColor,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: theme.textColor }]}>
            {uiT("ui.anki_settings_a19896ad")} </Text>
          <Text style={[styles.subtitle, { color: theme.textColor }]}>
            {uiT("ui.fine_tune_reveal_and_answer_behavior_4267a177")} </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.card_behavior_733c828e")} </Text>
          <SettingsChoiceCards
            label={uiT("ui.anki_applies_to_7cc2f981")}
            compact
            value={ankiCardModeScope}
            theme={theme}
            options={[
              { value: "both", label: uiT("ui.both_b6c1d862"), art: "both" },
              { value: "meaning", label: uiT("ui.meanings_6379cd5b"), art: "meaning" },
              { value: "reading", label: uiT("ui.readings_f3a97d44"), art: "reading" },
            ]}
            onChange={handleScopeChange}
          />
          <View
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
          >
            <Ionicons
              name="git-merge-outline"
              size={20}
              color={theme.primary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingText, { color: theme.textColor }]}>
                {uiT("ui.group_questions_136e1916")} </Text>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.show_meaning_and_reading_together_in_one_card_bc727a8b")} </Text>
              {ankiCardModeScope !== "both" && (
                <Text
                  style={[styles.inlineHint, { color: theme.textSecondary }]}
                >
                  {uiT("ui.only_available_when_both_is_selected_7622ede0")} </Text>
              )}
            </View>
            <Switch
              value={ankiGroupQuestions}
              onValueChange={setAnkiGroupQuestions}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
              disabled={ankiCardModeScope !== "both"}
            />
          </View>
          {ankiGroupQuestions && ankiCardModeScope === "both" ? (
            <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
              <Ionicons name="help-circle-outline" size={20} color={theme.primary} style={styles.settingIcon} />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, { color: theme.textColor }]}>{uiT("ui.ask_which_part_was_wrong_5b798c4e")}</Text>
                <Text style={[styles.settingSubtext, { color: theme.textSecondary }]}>
                  {uiT("ui.choose_meaning_reading_or_both_in_grouped_reviews_off_marks_both_6fa161b6")} </Text>
              </View>
              <Switch
                accessibilityLabel={uiT("ui.ask_which_part_was_wrong_5b798c4e")}
                value={ankiAskIncorrectPart}
                onValueChange={setAnkiAskIncorrectPart}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
          ) : null}
          <View
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
          >
            <Ionicons
              name="eye-off-outline"
              size={20}
              color={theme.primary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingText, { color: theme.textColor }]}>
                {uiT("ui.hide_answer_completely_d3066785")} </Text>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.off_show_the_answer_blurred_before_reveal_on_hide_the_answer_comp_1d69b411")} </Text>
            </View>
            <Switch
              value={ankiHideAnswerCompletely}
              onValueChange={setAnkiHideAnswerCompletely}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          <View
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
          >
            <Ionicons
              name="hand-left-outline"
              size={20}
              color={theme.primary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingText, { color: theme.textColor }]}>
                {uiT("ui.buttonless_anki_mode_4915d5f1")} </Text>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.after_reveal_tap_left_for_incorrect_tap_right_for_correct_swipe_u_72a3b49e")} </Text>
            </View>
            <Switch
              value={ankiButtonlessMode}
              onValueChange={setAnkiButtonlessMode}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
          <SettingsFoldout
            theme={theme}
            title={uiT("ui.after_revealing_the_card_89bf5d80")}
            description={uiT("ui.audio_alternate_answers_composition_and_pitch_120320e8")}
            icon="cards"
          >
            <View
              style={[styles.settingRow, { borderBottomColor: theme.border }]}
            >
              <Ionicons
                name="volume-high-outline"
                size={20}
                color={theme.primary}
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, { color: theme.textColor }]}>
                  {uiT("ui.show_replay_button_33209341")} </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.after_revealing_an_anki_card_show_a_replay_button_to_play_vocabul_3bd84d19")} </Text>
              </View>
              <Switch
                value={ankiShowReplayAudioButton}
                onValueChange={setAnkiShowReplayAudioButton}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            <View
              style={[styles.settingRow, { borderBottomColor: theme.border }]}
            >
              <Ionicons
                name="list-outline"
                size={20}
                color={theme.primary}
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, { color: theme.textColor }]}>
                  {uiT("ui.show_other_accepted_answers_3d19a349")} </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.in_anki_cards_also_show_non_primary_accepted_answers_and_your_use_b2324230")} </Text>
              </View>
              <Switch
                value={ankiShowOtherAcceptedAnswersAndUserSynonyms}
                onValueChange={setAnkiShowOtherAcceptedAnswersAndUserSynonyms}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            <View
              style={[styles.settingRow, { borderBottomColor: theme.border }]}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color={theme.primary}
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, { color: theme.textColor }]}>
                  {uiT("ui.show_kanji_composition_957eeca9")} </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.after_revealing_a_vocabulary_card_show_its_kanji_and_their_meanin_04d1dc76")} </Text>
              </View>
              <Switch
                accessibilityLabel={uiT("ui.show_kanji_composition_957eeca9")}
                value={ankiShowKanjiComposition}
                onValueChange={setAnkiShowKanjiComposition}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            <View
              style={[styles.settingRow, { borderBottomColor: theme.border }]}
            >
              <Ionicons
                name="text-outline"
                size={20}
                color={theme.primary}
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, { color: theme.textColor }]}>
                  {uiT("ui.show_pitch_accent_number_72448bd7")} </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.in_anki_cards_show_compact_pitch_accent_notation_after_reveal_whe_2fa13b36")} </Text>
              </View>
              <Switch
                value={ankiShowPitchAccentNumbers}
                onValueChange={setAnkiShowPitchAccentNumbers}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            <View
              style={[styles.settingRow, { borderBottomColor: theme.border }]}
            >
              <Ionicons
                name="pulse-outline"
                size={20}
                color={theme.primary}
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, { color: theme.textColor }]}>
                  {uiT("ui.show_pitch_accent_graph_5fdb68e3")} </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.in_anki_cards_also_show_a_compact_pitch_accent_graph_after_reveal_349da247")} </Text>
              </View>
              <Switch
                value={ankiShowPitchAccentGraph}
                onValueChange={setAnkiShowPitchAccentGraph}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            <View style={[styles.settingRow, styles.settingRowLast]}>
              <Ionicons
                name="library-outline"
                size={20}
                color={theme.primary}
                style={styles.settingIcon}
              />
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, { color: theme.textColor }]}>
                  {uiT("ui.show_part_of_speech_bbd4153f")} </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.in_anki_cards_show_wanikani_part_of_speech_info_including_transit_073c848e")} </Text>
              </View>
              <Switch
                value={ankiShowWaniKaniGrammarTags}
                onValueChange={setAnkiShowWaniKaniGrammarTags}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
          </SettingsFoldout>
        </View>

        {Platform.OS === "android" && (
          <View
            style={[
              styles.section,
              styles.exportSection,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
              {uiT("ui.external_export_20d18397")} </Text>
            <Text
              style={[styles.exportDescription, { color: theme.textSecondary }]}
            >
              {uiT("ui.send_vocabulary_context_sentences_directly_to_your_ankidroid_coll_8ded57c7")} </Text>
            <View
              style={[styles.settingRow, { borderBottomColor: theme.border }]}
            >
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, { color: theme.textColor }]}>
                  {uiT("ui.enable_anki_export_db282dc5")} </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.show_anki_export_buttons_beside_context_sentences_5c57dc80")} </Text>
              </View>
              <Switch
                accessibilityLabel={uiT("ui.enable_anki_export_db282dc5")}
                value={ankiDroidExportEnabled}
                onValueChange={setAnkiDroidExportEnabled}
                trackColor={{ true: theme.primary }}
              />
            </View>
            {ankiDroidExportEnabled && <AnkiDroidExportSettingsButton />}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 6,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 14,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    paddingBottom: 12,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  exportSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  exportDescription: {
    fontSize: 13,
    lineHeight: 18,
    paddingBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingText: {
    fontSize: 15,
    fontWeight: "600",
  },
  settingSubtext: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  inlineHint: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  scopeSelector: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: -2,
  },
  scopeButton: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  scopeButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
