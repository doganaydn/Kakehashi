import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsRowIcon } from "../../../ui/settings/settings-row-icon";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";
import { SettingsIcon as Ionicons } from "../../../ui/settings/settings-icon";
import React from "react";

import {
  ActivityIndicator,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  AdvancedSetting,
  AdvancedSettingsGroup,
} from "../components/AdvancedSettings";
import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function VoiceSettingsSection() {
  useInterfaceLanguage();
  const {
    autoplayLessonReadingAudio,
    autoplayVocabularyAudio,
    formatByteSize,
    formatCount,
    getVocabularyAudioVoiceLabel,
    handleClearOfflineAudioCache,
    handleOfflineVocabularyAudioToggle,
    isClearingOfflineAudioCache,
    offlineAudioCacheFileCount,
    offlineAudioCacheSizeBytes,
    offlineAudioProgress,
    offlineVocabularyAudioEnabled,
    openVocabularyAudioVoicePicker,
    setAutoplayLessonReadingAudio,
    setAutoplayVocabularyAudio,
    theme,
    updateSectionOffset,
    userData,
    vocabularyAudioVoice,
  } = useSettingsControllerContext();

  return (
    <>
      {/* Voice Settings Section */}
      <SettingsSectionSurface
        style={[
          styles.section,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          },
        ]}
        onLayout={(event) => {
          updateSectionOffset("voice", event.nativeEvent.layout.y);
        }}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textColor, borderBottomColor: theme.border },
          ]}
        >
          {uiT("ui.japanese_voice_c3ded1d3")} </Text>

        <AdvancedSettingsGroup>
          <View
            style={[styles.settingItem, { borderBottomColor: "transparent" }]}
          >

            <SettingsRowIcon setting="autoplay-vocabulary" color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.autoplay_vocabulary_audio_8f0896f2")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.automatically_play_audio_after_answering_vocabulary_reading_quest_459817a6")} </Text>
            </View>
            <Switch
              value={autoplayVocabularyAudio}
              onValueChange={setAutoplayVocabularyAudio}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          <View
            style={[styles.settingItem, { borderBottomColor: "transparent" }]}
          >

            <SettingsRowIcon setting="autoplay-lessons" color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.autoplay_lesson_reading_audio_d077dab0")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.automatically_play_vocabulary_audio_when_opening_the_reading_tab_bbf86a8c")} </Text>
            </View>
            <Switch
              value={autoplayLessonReadingAudio}
              onValueChange={setAutoplayLessonReadingAudio}
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>

          {/* Voice Actor Selection (show when any vocab autoplay mode is enabled) */}
          {(autoplayVocabularyAudio || autoplayLessonReadingAudio) && (
            <View
              style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            >

              <SettingsRowIcon setting="voice-actor" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.voice_actor_9e68522f")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.choose_female_male_random_or_both_playback_d5dd8ca1")} </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.voiceSelectionButton,
                  { borderColor: theme.border },
                ]}
                onPress={openVocabularyAudioVoicePicker}
              >
                <View style={styles.voiceSelectionButtonContent}>
                  <Text
                    style={[
                      styles.voiceSelectionText,
                      { color: theme.textColor },
                    ]}
                  >
                    {getVocabularyAudioVoiceLabel(vocabularyAudioVoice)}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={theme.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            </View>
          )}

          <AdvancedSetting>
            <View
              style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            >

              <SettingsRowIcon setting="offline-audio" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.offline_vocabulary_audio_1017ad29")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.pre_download_pronunciation_audio_by_level_so_replay_keeps_working_ce65bec9")} </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary, marginTop: 6 },
                  ]}
                >
                  {offlineAudioProgress.inProgress
                    ? uiT("ui.downloading_value_value_clips_4e02c333", {value1: (offlineAudioProgress.completed), value2: (offlineAudioProgress.total)})
                    : uiT("ui.cached_clips_value_value_ef51b89e", {value1: (formatCount(offlineAudioCacheFileCount)), value2: (formatByteSize(
                        offlineAudioCacheSizeBytes,
                      ))})}
                </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary, marginTop: 4 },
                  ]}
                >
                  {uiT("ui.scope_levels_1_value_both_voices_f6a39e25", {value1: (Math.max(
                    1,
                    Math.floor((userData?.level ?? 1) + 1),
                  ))})}
                </Text>
              </View>
              <Switch
                value={offlineVocabularyAudioEnabled}
                onValueChange={handleOfflineVocabularyAudioToggle}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>

            {offlineVocabularyAudioEnabled && (
              <View style={styles.offlineAudioDeleteRow}>
                <TouchableOpacity
                  style={[
                    styles.offlineAudioDeleteIconButton,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.cardBackground,
                    },
                  ]}
                  onPress={handleClearOfflineAudioCache}
                  disabled={isClearingOfflineAudioCache}
                  accessibilityRole="button"
                  accessibilityLabel={uiT("ui.delete_offline_vocabulary_audio_cache_f52d8bab")}
                >
                  {isClearingOfflineAudioCache ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.textSecondary}
                    />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color="#d9534f" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </AdvancedSetting>
        </AdvancedSettingsGroup>
      </SettingsSectionSurface>
    </>
  );
}
