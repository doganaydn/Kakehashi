import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsRowIcon } from "../../../ui/settings/settings-row-icon";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";
import { SettingsChoiceCards } from "../../../ui/settings/settings-choice-cards";
import { SettingsIcon as Ionicons } from "../../../ui/settings/settings-icon";
import React from "react";

import { Switch, Text, View } from "react-native";

import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function ReadingDefaultsSection() {
  useInterfaceLanguage();
  const {
    handleBlockedFullModeSelection,
    hasStoredJpdbApiKey,
    hideNewsFuriganaByDefault,
    hideVocabularyTooltipMeanings,
    hideVocabularyTooltipReadings,
    newsDefaultStudyMode,
    setHideNewsFuriganaByDefault,
    setHideVocabularyTooltipMeanings,
    setHideVocabularyTooltipReadings,
    setNewsDefaultStudyMode,
    setSongsLyricsDefaultStudyMode,
    songsLyricsDefaultStudyMode,
    SONG_LYRICS_STUDY_MODE_DEFAULT_OPTIONS,
    STUDY_MODE_DEFAULT_OPTIONS,
    StyleSheet,
    theme,
    updateSectionOffset,
  } = useSettingsControllerContext();

  return (
    <>
      <SettingsSectionSurface
        style={[
          styles.section,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          },
        ]}
        onLayout={(event) => {
          updateSectionOffset("readingDefaults", event.nativeEvent.layout.y);
        }}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textColor, borderBottomColor: theme.border },
          ]}
        >
          {uiT("ui.reading_defaults_df5e164d")} </Text>

        <View
          style={[
            styles.settingItemColumn,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View style={[styles.settingRow, { marginBottom: 8 }]}>
            <Ionicons
              name="newspaper-outline"
              size={24}
              color={theme.primary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.nhk_news_default_view_ec3e90f6")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.pick_the_study_mode_that_opens_first_in_news_articles_b995f06d")} </Text>
            </View>
          </View>
          <SettingsChoiceCards
            compact
            label={uiT("ui.news_study_mode_c13f8527")}
            value={newsDefaultStudyMode}
            theme={theme}
            options={STUDY_MODE_DEFAULT_OPTIONS.map((option) => ({
              ...option,
              description:
                option.value === "full" && !hasStoredJpdbApiKey
                  ? "Connect JPDB"
                  : undefined,
              art: `news-${option.value}`,

            }))}
            onChange={(value) => {
              if (value === "full" && !hasStoredJpdbApiKey) {
                handleBlockedFullModeSelection("news");
                return;
              }
              setNewsDefaultStudyMode(value);
            }}
          />
        </View>

        <View
          style={[
            styles.settingItem,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme.border,
            },
          ]}
        >

          <SettingsRowIcon setting="furigana" color={theme.primary} />
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              {uiT("ui.hide_furigana_by_default_27a81862")} </SettingsLabel>
            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {uiT("ui.start_news_articles_without_furigana_when_no_study_mode_is_select_72596f1d")} </Text>
          </View>
          <Switch
            value={hideNewsFuriganaByDefault}
            onValueChange={setHideNewsFuriganaByDefault}
            trackColor={{ false: "#767577", true: theme.primary }}
            thumbColor="#f4f3f4"
          />
        </View>

        <View
          style={[
            styles.settingItem,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme.border,
            },
          ]}
        >

          <SettingsRowIcon setting="hide-tooltip-meaning" color={theme.primary} />
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              {uiT("ui.hide_meaning_in_tooltips_7f8fe39b")} </SettingsLabel>
            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {uiT("ui.tap_the_meaning_row_in_reader_vocabulary_tooltips_to_reveal_it_500a3661")} </Text>
          </View>
          <Switch
            value={hideVocabularyTooltipMeanings}
            onValueChange={setHideVocabularyTooltipMeanings}
            trackColor={{ false: "#767577", true: theme.primary }}
            thumbColor="#f4f3f4"
          />
        </View>

        <View
          style={[
            styles.settingItem,
            {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme.border,
            },
          ]}
        >

          <SettingsRowIcon setting="hide-tooltip-reading" color={theme.primary} />
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              {uiT("ui.hide_reading_in_tooltips_3b1b0707")} </SettingsLabel>
            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {uiT("ui.tap_the_reading_row_in_reader_vocabulary_tooltips_to_reveal_it_d3ceb054")} </Text>
          </View>
          <Switch
            value={hideVocabularyTooltipReadings}
            onValueChange={setHideVocabularyTooltipReadings}
            trackColor={{ false: "#767577", true: theme.primary }}
            thumbColor="#f4f3f4"
          />
        </View>

        <View
          style={[
            styles.settingItemColumn,
            { borderBottomColor: "transparent" },
          ]}
        >
          <View style={[styles.settingRow, { marginBottom: 8 }]}>
            <Ionicons
              name="musical-notes-outline"
              size={24}
              color={theme.primary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.song_lyrics_default_view_d78b3a75")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.pick_the_default_study_mode_for_lyric_lines_711a4ac1")} </Text>
            </View>
          </View>
          <SettingsChoiceCards
            compact
            label={uiT("ui.song_lyrics_study_mode_ce0d8e4c")}
            value={songsLyricsDefaultStudyMode}
            theme={theme}
            options={SONG_LYRICS_STUDY_MODE_DEFAULT_OPTIONS.map((option) => ({
              ...option,
              description:
                option.value === "full" && !hasStoredJpdbApiKey
                  ? "Connect JPDB"
                  : undefined,
              art: `lyrics-${option.value}`,

            }))}
            onChange={(value) => {
              if (value === "full" && !hasStoredJpdbApiKey) {
                handleBlockedFullModeSelection("lyrics");
                return;
              }
              setSongsLyricsDefaultStudyMode(value);
            }}
          />
        </View>
      </SettingsSectionSurface>
    </>
  );
}
