import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsRowIcon } from "../../../ui/settings/settings-row-icon";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";
import { SettingsChoiceCards } from "../../../ui/settings/settings-choice-cards";
import { SettingsDisclosure } from "../components/settings-disclosure";
import React from "react";
import { SettingsIcon as Ionicons } from "../../../ui/settings/settings-icon";
import { Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

import {
  AdvancedSetting,
  AdvancedSettingsGroup,
} from "../components/AdvancedSettings";
import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";
import {
  LESSON_SRS_THRESHOLD_MAX,
  normalizeLessonSrsThreshold,
} from "../../../utils/lessonSrsThreshold";
import { useSettingsStore } from "../../../utils/store";

function LessonThresholdInput({
  accessibilityLabel,
  borderColor,
  textColor,
  value,
  onChange,
}: {
  accessibilityLabel: string;
  borderColor: string;
  textColor: string;
  value: number;
  onChange: (value: number) => void;
}) {
  useInterfaceLanguage();
  const [draftValue, setDraftValue] = React.useState(String(value));
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (!isEditing) {
      setDraftValue(String(value));
    }
  }, [isEditing, value]);

  const commitDraftValue = () => {
    const normalizedValue = normalizeLessonSrsThreshold(
      draftValue.length > 0 ? Number(draftValue) : 0,
    );
    onChange(normalizedValue);
    setDraftValue(String(normalizedValue));
    setIsEditing(false);
  };

  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={uiT("ui.enter_zero_to_disable_this_limit_d6bee738")}
      style={[styles.lessonThresholdInput, { borderColor, color: textColor }]}
      value={draftValue}
      onFocus={() => {
        setIsEditing(true);
        if (value === 0) {
          setDraftValue("");
        }
      }}
      onChangeText={(text) => setDraftValue(text.replace(/\D/g, ""))}
      onBlur={commitDraftValue}
      onSubmitEditing={commitDraftValue}
      keyboardType="number-pad"
      inputMode="numeric"
      maxLength={String(LESSON_SRS_THRESHOLD_MAX).length}
      selectTextOnFocus={value > 0}
      textAlign="center"
    />
  );
}

export function LessonSettingsSection() {
  useInterfaceLanguage();
  const lessonSearchButtonEnabled = useSettingsStore(
    (state) => state.lessonSearchButtonEnabled,
  );
  const setLessonSearchButtonEnabled = useSettingsStore(
    (state) => state.setLessonSearchButtonEnabled,
  );
  const apprenticeLessonThreshold = useSettingsStore(
    (state) => state.apprenticeLessonThreshold,
  );
  const guruLessonThreshold = useSettingsStore(
    (state) => state.guruLessonThreshold,
  );
  const setApprenticeLessonThreshold = useSettingsStore(
    (state) => state.setApprenticeLessonThreshold,
  );
  const setGuruLessonThreshold = useSettingsStore(
    (state) => state.setGuruLessonThreshold,
  );
  const {
    dailyLessonLimit,
    dailyLessonLimitMax,
    dailyLessonLimitMin,
    dailyLessonLimitStep,
    dailyLessonReminderIncludeWeekends,
    excludeKanaVocabularyFromLessons,
    getLessonOrderLabel,
    getNextDailyLessonLimit,
    getPreviousDailyLessonLimit,
    handleDailyLessonLimitToggle,
    handleDailyLessonReminderIncludeWeekendsChange,
    interleaveLessonTypesEnabled,
    isDailyLessonLimitEnabled,
    lessonBatchSize,
    minimumRadicalKanjiPerBatchEnabled,
    lessonOrder,
    lessonPickerViewMode,
    lessonTypeOrderEnabled,
    router,
    setDailyLessonLimit,
    setExcludeKanaVocabularyFromLessons,
    setLessonBatchSize,
    setLessonPickerViewMode,
    setShowMnemonicIllustrations,
    setSinglePageLessonView,
    setSkipCustomLessonQuiz,
    showMnemonicIllustrations,
    singlePageLessonView,
    skipCustomLessonQuiz,
    theme,
    updateSectionOffset,
  } = useSettingsControllerContext();
  const lessonOrderSummary = [
    getLessonOrderLabel(lessonOrder),
    lessonTypeOrderEnabled
      ? "type groups"
      : interleaveLessonTypesEnabled
        ? "interleaved mix"
        : null,
    minimumRadicalKanjiPerBatchEnabled ? "batch minimums" : null,
  ]
    .filter(Boolean)
    .join(" + ");

  return (
    <>
      {/* Lesson Settings Section */}
      <SettingsSectionSurface
        style={[
          styles.section,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          },
        ]}
        onLayout={(event) => {
          updateSectionOffset("lessons", event.nativeEvent.layout.y);
        }}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textColor, borderBottomColor: theme.border },
          ]}
        >
          {uiT("ui.lesson_settings_665263b5")} </Text>
        <AdvancedSettingsGroup grouped>
          <View>
            <View
              style={[styles.settingItem, { borderBottomColor: "transparent" }]}
            >

              <SettingsRowIcon setting="lesson-count" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.lesson_batch_size_5675b8f2")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.number_of_items_per_lesson_batch_2_10_87144064")} </Text>
              </View>
              <View style={styles.batchSizeSelector}>
                <TouchableOpacity
                  style={[
                    styles.batchSizeButton,
                    { backgroundColor: theme.border },
                    lessonBatchSize <= 2 && styles.batchSizeButtonDisabled,
                  ]}
                  onPress={() =>
                    lessonBatchSize > 2 &&
                    setLessonBatchSize(lessonBatchSize - 1)
                  }
                  disabled={lessonBatchSize <= 2}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={
                      lessonBatchSize <= 2
                        ? theme.textSecondary
                        : theme.textColor
                    }
                  />
                </TouchableOpacity>
                <Text
                  style={[styles.batchSizeValue, { color: theme.textColor }]}
                >
                  {lessonBatchSize}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.batchSizeButton,
                    { backgroundColor: theme.border },
                    lessonBatchSize >= 10 && styles.batchSizeButtonDisabled,
                  ]}
                  onPress={() =>
                    lessonBatchSize < 10 &&
                    setLessonBatchSize(lessonBatchSize + 1)
                  }
                  disabled={lessonBatchSize >= 10}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={
                      lessonBatchSize >= 10
                        ? theme.textSecondary
                        : theme.textColor
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View
              style={[
                styles.settingItem,
                {
                  borderBottomColor: theme.border,
                },
              ]}
            >

              <SettingsRowIcon setting="daily-cap" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.daily_lesson_limit_fc8fbcb3")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.cap_lessons_per_day_in_your_device_timezone_88dd1c02")} </Text>
              </View>
              <Switch
                value={isDailyLessonLimitEnabled}
                onValueChange={handleDailyLessonLimitToggle}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            {isDailyLessonLimitEnabled && (
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
              >

                <SettingsRowIcon setting="daily-count" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.daily_limit_5a2f8b3d")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.number_of_lessons_per_day_value_value_step_value_1a60b29c", {value1: (dailyLessonLimitMin), value2: (dailyLessonLimitMax), value3: (dailyLessonLimitStep)})}
                  </Text>
                </View>
                <View style={styles.batchSizeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.batchSizeButton,
                      { backgroundColor: theme.border },
                      dailyLessonLimit <= dailyLessonLimitMin &&
                        styles.batchSizeButtonDisabled,
                    ]}
                    onPress={() =>
                      dailyLessonLimit > dailyLessonLimitMin &&
                      setDailyLessonLimit(
                        getPreviousDailyLessonLimit(dailyLessonLimit),
                      )
                    }
                    disabled={dailyLessonLimit <= dailyLessonLimitMin}
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={
                        dailyLessonLimit <= dailyLessonLimitMin
                          ? theme.textSecondary
                          : theme.textColor
                      }
                    />
                  </TouchableOpacity>
                  <Text
                    style={[styles.batchSizeValue, { color: theme.textColor }]}
                  >
                    {dailyLessonLimit}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.batchSizeButton,
                      { backgroundColor: theme.border },
                      dailyLessonLimit >= dailyLessonLimitMax &&
                        styles.batchSizeButtonDisabled,
                    ]}
                    onPress={() =>
                      dailyLessonLimit < dailyLessonLimitMax &&
                      setDailyLessonLimit(
                        getNextDailyLessonLimit(dailyLessonLimit),
                      )
                    }
                    disabled={dailyLessonLimit >= dailyLessonLimitMax}
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={
                        dailyLessonLimit >= dailyLessonLimitMax
                          ? theme.textSecondary
                          : theme.textColor
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <View
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
            >

              <SettingsRowIcon setting="apprentice-cap" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.apprentice_lesson_threshold_620882cc")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.stop_offering_home_page_lessons_above_this_count_0_no_limit_7e80ee4d")} </Text>
              </View>
              <LessonThresholdInput
                accessibilityLabel={uiT("ui.apprentice_lesson_threshold_f75cff42")}
                borderColor={theme.border}
                textColor={theme.textColor}
                value={apprenticeLessonThreshold}
                onChange={setApprenticeLessonThreshold}
              />
            </View>
            <View
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
            >

              <SettingsRowIcon setting="guru-cap" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.guru_lesson_threshold_c5d4bece")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.stop_offering_home_page_lessons_above_this_count_0_no_limit_7e80ee4d")} </Text>
              </View>
              <LessonThresholdInput
                accessibilityLabel={uiT("ui.guru_lesson_threshold_5730babb")}
                borderColor={theme.border}
                textColor={theme.textColor}
                value={guruLessonThreshold}
                onChange={setGuruLessonThreshold}
              />
            </View>
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
              onPress={() => router.push("/lesson-order-settings")}
            >

              <SettingsRowIcon setting="lesson-order" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.lesson_order_bed9fc2e")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {lessonOrderSummary}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <SettingsDisclosure
            title={uiT("ui.lesson_presentation_c8301635")}
            description={uiT("ui.browsing_detail_layout_and_illustrations_c525f6aa")}
            icon="lessons"
          >
            <AdvancedSetting>
              <SettingsChoiceCards
                label={uiT("ui.lesson_picker_layout_e0e6af46")}
                compact
                value={lessonPickerViewMode}
                theme={theme}
                options={[
                  { value: "cards", label: uiT("ui.cards_a52fcbbc"), art: "tiles" },
                  { value: "list", label: uiT("ui.list_6f202f54"), art: "list" },
                ]}
                onChange={setLessonPickerViewMode}
              />
            </AdvancedSetting>
            <AdvancedSetting>
              <SettingsChoiceCards
                label={uiT("ui.lesson_detail_layout_6b74fa02")}
                compact
                value={singlePageLessonView ? "page" : "tabs"}
                theme={theme}
                options={[
                  { value: "tabs", label: uiT("ui.tabs_8e5ea509"), art: "tabs" },
                  { value: "page", label: uiT("ui.single_page_6c9b2e0e"), art: "page" },
                ]}
                onChange={(value) => setSinglePageLessonView(value === "page")}
              />
            </AdvancedSetting>
            <AdvancedSetting>
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: "transparent" },
                ]}
              >

                <SettingsRowIcon setting="mnemonic-images" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.mnemonic_illustrations_2ca37ec3")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.show_radical_mnemonic_images_in_subject_details_and_lesson_pages_658dff47")} </Text>
                </View>
                <Switch
                  value={showMnemonicIllustrations}
                  onValueChange={setShowMnemonicIllustrations}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor="#f4f3f4"
                />
              </View>
            </AdvancedSetting>
          </SettingsDisclosure>
          <SettingsDisclosure
            title={uiT("ui.advanced_lesson_preferences_6bc516c9")}
            description={uiT("ui.content_filters_quizzes_and_reminders_043924ac")}
            icon="settings"
            accessibilityLabel={uiT("ui.advanced_settings_7b0bd218")}
          >
            <AdvancedSetting>
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
              >

                <SettingsRowIcon setting="weekend-reminders" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.weekend_lesson_reminders_6c531722")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.send_lesson_reminders_on_saturdays_and_sundays_93eb2c5f")} </Text>
                </View>
                <Switch
                  value={dailyLessonReminderIncludeWeekends}
                  onValueChange={(includeWeekends) => {
                    void handleDailyLessonReminderIncludeWeekendsChange(
                      includeWeekends,
                    );
                  }}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor="#f4f3f4"
                />
              </View>
            </AdvancedSetting>
            <AdvancedSetting>
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
              >

                <SettingsRowIcon setting="exclude-kana" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.hide_kana_vocabulary_ec445f1b")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.exclude_kana_vocabulary_from_lessons_and_lesson_counts_f2bfe6eb")} </Text>
                </View>
                <Switch
                  value={excludeKanaVocabularyFromLessons}
                  onValueChange={setExcludeKanaVocabularyFromLessons}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor="#f4f3f4"
                />
              </View>
            </AdvancedSetting>
            <AdvancedSetting>
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
              >

                <SettingsRowIcon setting="lesson-search" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.lesson_search_button_6d2a2b2d")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.search_from_lesson_cards_without_leaving_your_lesson_session_648deaaf")} </Text>
                </View>
                <Switch
                  accessibilityLabel={uiT("ui.lesson_search_button_6d2a2b2d")}
                  value={lessonSearchButtonEnabled}
                  onValueChange={setLessonSearchButtonEnabled}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor="#f4f3f4"
                />
              </View>
            </AdvancedSetting>
            <AdvancedSetting>
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
              >

                <SettingsRowIcon setting="skip-lesson-quiz" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.skip_custom_lesson_quiz_d6d55140")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.skip_the_quiz_step_in_custom_lessons_a653c9bb")} </Text>
                </View>
                <Switch
                  value={skipCustomLessonQuiz}
                  onValueChange={setSkipCustomLessonQuiz}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor="#f4f3f4"
                />
              </View>
            </AdvancedSetting>
          </SettingsDisclosure>
        </AdvancedSettingsGroup>
      </SettingsSectionSurface>
    </>
  );
}
