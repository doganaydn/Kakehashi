import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsRowIcon } from "../../../ui/settings/settings-row-icon";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";
import { SettingsDisclosure } from "../components/settings-disclosure";
import { ReviewAnswerModeSetting } from "../components/review-answer-mode-setting";
import React from "react";
import { useSettingsStore } from "../../../utils/store";

import { SettingsIcon as Ionicons } from "../../../ui/settings/settings-icon";
import { Switch, Text, TouchableOpacity, View } from "react-native";

import {
  AdvancedSetting,
  AdvancedSettingsGroup,
} from "../components/AdvancedSettings";
import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";
import { ReviewPresetsSetting } from "../components/review-presets-setting";

export function ReviewSettingsSection() {
  useInterfaceLanguage();
  const jitaiCycleAllFonts = useSettingsStore(
    (state) => state.jitaiCycleAllFonts,
  );
  const setJitaiCycleAllFonts = useSettingsStore(
    (state) => state.setJitaiCycleAllFonts,
  );
  const {
    acceptAnyKanjiOnyomiReading,
    acceptUserSynonymsAsAnswers,
    Alert,
    allowSkippingReviews,
    ankiCardMode,
    ankiCardModeScope,
    ankiGroupQuestions,
    autoSwitchKeyboard,
    backToBackImmediateRetryIncorrect,
    backToBackQuestions,
    canDecreaseReviewCharacterFontScale,
    canIncreaseReviewCharacterFontScale,
    canDecreaseReviewInputFontScale,
    canIncreaseReviewInputFontScale,
    customReviewOrder,
    disableAutoProgressOnCloseAnswer,
    disableAutoProgressOnCorrect,
    disableAutoProgressOnWrong,
    effectiveReviewWrapUpQuestionGap,
    formatReviewFontScale,
    getReviewOrderLabel,
    getSrsProgressionCardModeLabel,
    JAPANESE_KEYBOARD_SETUP_INSTRUCTIONS,
    jitaiEnabled,
    jitaiSelectedFontIds,
    KeyboardManager,
    openReviewShortcutModal,
    openSrsProgressionCardModePicker,
    Platform,
    prioritizeCriticalItems,
    REVIEW_CHARACTER_FONT_SCALE_STEP,
    REVIEW_INPUT_FONT_SCALE_STEP,
    reviewAnimatePreviousQuestion,
    reviewBatchSize,
    reviewBatchSizeEnabled,
    reviewCharacterFontScale,
    reviewInputFontScale,
    reviewOrder,
    reviewSearchButtonEnabled,
    reviewTypeOrderEnabled,
    reviewWrapUpTargetMax,
    reviewWrapUpTargetMin,
    reviewWrapUpTargetStep,
    reviewWrapUpTargetSubjects,
    router,
    setAcceptAnyKanjiOnyomiReading,
    setAcceptUserSynonymsAsAnswers,
    setAllowSkippingReviews,
    setAutoSwitchKeyboard,
    setBackToBackImmediateRetryIncorrect,
    setBackToBackQuestions,
    setDisableAutoProgressOnCloseAnswer,
    setDisableAutoProgressOnCorrect,
    setDisableAutoProgressOnWrong,
    setJitaiEnabled,
    setPrioritizeCriticalItems,
    setReviewAnimatePreviousQuestion,
    setReviewBatchSize,
    setReviewBatchSizeEnabled,
    setReviewCharacterFontScale,
    setReviewInputFontScale,
    setReviewSearchButtonEnabled,
    setReviewWrapUpTargetSubjects,
    setShowAddSynonymButton,
    setShowAnswerStopDetailsPreview,
    setShowAnswerStopSubjectDetails,
    setShowReviewItemLevelAndSrsStage,
    setShowVocabContextSentencesInReviews,
    setVoiceReviewAnswersEnabled,
    showAddSynonymButton,
    showAnswerStopSubjectDetails,
    showReviewItemLevelAndSrsStage,
    showVocabContextSentencesInReviews,
    srsProgressionCardDisplayMode,
    theme,
    updateSectionOffset,
    voiceReviewAnswersEnabled,
  } = useSettingsControllerContext();

  return (
    <>
      {/* Review Settings Section */}
      <SettingsSectionSurface
        style={[
          styles.section,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          },
        ]}
        onLayout={(event) => {
          updateSectionOffset("reviews", event.nativeEvent.layout.y);
        }}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textColor, borderBottomColor: theme.border },
          ]}
        >
          {uiT("ui.review_settings_eefd091e")} </Text>
        <AdvancedSettingsGroup grouped>
          <ReviewAnswerModeSetting />
          <View>
            <View
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
            >

              <SettingsRowIcon setting="pause-wrong" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.pause_on_wrong_answer_0133de00")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.show_correct_answer_and_options_before_progressing_7841fc6e")} </Text>
              </View>
              <Switch
                value={disableAutoProgressOnWrong}
                onValueChange={setDisableAutoProgressOnWrong}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            {(ankiCardMode || Platform.OS === "android") && (
              <TouchableOpacity
                style={[
                  styles.settingItemColumn,
                  { borderBottomColor: theme.border },
                ]}
                onPress={() => router.push("/anki-settings")}
                activeOpacity={0.78}
              >
                <View style={styles.settingRow}>

                  <SettingsRowIcon setting="anki-advanced" color={theme.primary} />
                  <View style={styles.settingTextContainer}>
                    <SettingsLabel
                      style={[styles.settingText, { color: theme.textColor }]}
                    >
                      {Platform.OS === "android"
                        ? uiT("ui.anki_settings_export_65d38aae")
                        : uiT("ui.anki_advanced_settings_5c5537a2")}
                    </SettingsLabel>
                    <Text
                      style={[
                        styles.settingSubtext,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {ankiCardMode
                        ? uiT("ui.applies_to_value_value_7c6c61bd", {value1: (ankiCardModeScope), value2: (ankiGroupQuestions ? uiT("ui.grouped_cards_enabled_17163d1c") : uiT("ui.grouped_cards_disabled_e52ac3d8"))})
                        : uiT("ui.configure_ankidroid_context_sentence_export_4081ff64")}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>
          <SettingsDisclosure
            title={uiT("ui.order_session_size_3c7072eb")}
            description={uiT("ui.priority_question_pairing_and_workload_954e1e22")}
            icon="order"
          >
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
              onPress={() => router.push("/review-order-settings")}
            >

              <SettingsRowIcon setting="subject-order" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.review_order_1f1edc73")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.reviews_value_custom_value_dee317df", {value1: (reviewTypeOrderEnabled
                      ? uiT("ui.value_type_groups_d9fbb76c", {value1: (getReviewOrderLabel(reviewOrder))})
                      : getReviewOrderLabel(reviewOrder)), value2: (getReviewOrderLabel(customReviewOrder))})}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            <AdvancedSetting>
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
              >

                <SettingsRowIcon setting="priority" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.prioritize_critical_items_293fc0cc")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.show_current_level_apprentice_radicals_kanji_first_2ac244bd")} </Text>
                </View>
                <Switch
                  value={prioritizeCriticalItems}
                  onValueChange={setPrioritizeCriticalItems}
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

                <SettingsRowIcon setting="back-to-back" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.back_to_back_questions_559ccdbc")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.show_meaning_and_reading_questions_consecutively_for_each_item_4d23d7cd")} </Text>
                </View>
                <Switch
                  value={backToBackQuestions}
                  onValueChange={setBackToBackQuestions}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor="#f4f3f4"
                  disabled={
                    ankiCardMode &&
                    ankiGroupQuestions &&
                    ankiCardModeScope === "both"
                  }
                />
              </View>
            </AdvancedSetting>
            <AdvancedSetting>
              {backToBackQuestions &&
              !(
                ankiCardMode &&
                ankiGroupQuestions &&
                ankiCardModeScope === "both"
              ) ? (
                <View
                  style={[
                    styles.settingItem,
                    { borderBottomColor: theme.border },
                  ]}
                >

                  <SettingsRowIcon setting="retry" color={theme.primary} />
                  <View style={styles.settingTextContainer}>
                    <SettingsLabel
                      style={[styles.settingText, { color: theme.textColor }]}
                    >
                      {uiT("ui.immediate_retry_on_wrong_c93d8cea")} </SettingsLabel>
                    <Text
                      style={[
                        styles.settingSubtext,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {uiT("ui.re_ask_failed_questions_right_away_in_back_to_back_mode_8db0d464")} </Text>
                  </View>
                  <Switch
                    value={backToBackImmediateRetryIncorrect}
                    onValueChange={setBackToBackImmediateRetryIncorrect}
                    trackColor={{ false: "#767577", true: theme.primary }}
                    thumbColor="#f4f3f4"
                  />
                </View>
              ) : null}
            </AdvancedSetting>
            <AdvancedSetting>
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
              >

                <SettingsRowIcon setting="wrap-up" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.wrap_up_target_9fb61040")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.subjects_left_after_tapping_wrap_up_5_20_paired_questions_stay_wi_5fad280b")} {effectiveReviewWrapUpQuestionGap} {uiT("ui.questions_61d8b6e2")} </Text>
                </View>
                <View style={styles.batchSizeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.batchSizeButton,
                      { backgroundColor: theme.border },
                      reviewWrapUpTargetSubjects <= reviewWrapUpTargetMin &&
                        styles.batchSizeButtonDisabled,
                    ]}
                    onPress={() =>
                      reviewWrapUpTargetSubjects > reviewWrapUpTargetMin &&
                      setReviewWrapUpTargetSubjects(
                        reviewWrapUpTargetSubjects - reviewWrapUpTargetStep,
                      )
                    }
                    disabled={
                      reviewWrapUpTargetSubjects <= reviewWrapUpTargetMin
                    }
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={
                        reviewWrapUpTargetSubjects <= reviewWrapUpTargetMin
                          ? theme.textSecondary
                          : theme.textColor
                      }
                    />
                  </TouchableOpacity>
                  <Text
                    style={[styles.batchSizeValue, { color: theme.textColor }]}
                  >
                    {reviewWrapUpTargetSubjects}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.batchSizeButton,
                      { backgroundColor: theme.border },
                      reviewWrapUpTargetSubjects >= reviewWrapUpTargetMax &&
                        styles.batchSizeButtonDisabled,
                    ]}
                    onPress={() =>
                      reviewWrapUpTargetSubjects < reviewWrapUpTargetMax &&
                      setReviewWrapUpTargetSubjects(
                        reviewWrapUpTargetSubjects + reviewWrapUpTargetStep,
                      )
                    }
                    disabled={
                      reviewWrapUpTargetSubjects >= reviewWrapUpTargetMax
                    }
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={
                        reviewWrapUpTargetSubjects >= reviewWrapUpTargetMax
                          ? theme.textSecondary
                          : theme.textColor
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </AdvancedSetting>
            <AdvancedSetting>
              <View
                style={[
                  styles.settingItem,
                  {
                    borderBottomColor: reviewBatchSizeEnabled
                      ? theme.border
                      : "transparent",
                  },
                ]}
              >

                <SettingsRowIcon setting="review-cap" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.review_batch_size_4040bacd")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.cap_the_number_of_reviews_loaded_into_the_queue_1568f267")} </Text>
                </View>
                <Switch
                  value={reviewBatchSizeEnabled}
                  onValueChange={setReviewBatchSizeEnabled}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor="#f4f3f4"
                />
              </View>
            </AdvancedSetting>
            <AdvancedSetting>
              {reviewBatchSizeEnabled && (
                <View
                  style={[
                    styles.settingItem,
                    { borderBottomColor: "transparent" },
                  ]}
                >

                  <SettingsRowIcon setting="review-count" color={theme.primary} />
                  <View style={styles.settingTextContainer}>
                    <SettingsLabel
                      style={[styles.settingText, { color: theme.textColor }]}
                    >
                      {uiT("ui.batch_size_c4857cd1")} </SettingsLabel>
                    <Text
                      style={[
                        styles.settingSubtext,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {uiT("ui.number_of_items_per_review_session_5_100_34be1497")} </Text>
                  </View>
                  <View style={styles.batchSizeSelector}>
                    <TouchableOpacity
                      style={[
                        styles.batchSizeButton,
                        { backgroundColor: theme.border },
                        reviewBatchSize <= 5 && styles.batchSizeButtonDisabled,
                      ]}
                      onPress={() =>
                        reviewBatchSize > 5 &&
                        setReviewBatchSize(reviewBatchSize - 5)
                      }
                      disabled={reviewBatchSize <= 5}
                    >
                      <Ionicons
                        name="remove"
                        size={18}
                        color={
                          reviewBatchSize <= 5
                            ? theme.textSecondary
                            : theme.textColor
                        }
                      />
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.batchSizeValue,
                        { color: theme.textColor },
                      ]}
                    >
                      {reviewBatchSize}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.batchSizeButton,
                        { backgroundColor: theme.border },
                        reviewBatchSize >= 100 &&
                          styles.batchSizeButtonDisabled,
                      ]}
                      onPress={() =>
                        reviewBatchSize < 100 &&
                        setReviewBatchSize(reviewBatchSize + 5)
                      }
                      disabled={reviewBatchSize >= 100}
                    >
                      <Ionicons
                        name="add"
                        size={18}
                        color={
                          reviewBatchSize >= 100
                            ? theme.textSecondary
                            : theme.textColor
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </AdvancedSetting>
            <AdvancedSetting>
              {reviewBatchSizeEnabled ? <ReviewPresetsSetting /> : null}
            </AdvancedSetting>
          </SettingsDisclosure>
          <SettingsDisclosure
            title={uiT("ui.answer_feedback_53c17d78")}
            description={uiT("ui.pauses_accepted_answers_and_corrections_f84f7c75")}
            icon="answer"
          >
            <AdvancedSetting>
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
              >

                <SettingsRowIcon setting="pause-close" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.pause_on_close_answer_737b2b66")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.for_fuzzy_meaning_matches_confirm_whether_to_mark_correct_or_inco_5b2949e0")} </Text>
                </View>
                <Switch
                  value={disableAutoProgressOnCloseAnswer}
                  onValueChange={setDisableAutoProgressOnCloseAnswer}
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

                <SettingsRowIcon setting="skip" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.allow_skipping_reviews_e1f9a50b")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.submit_an_empty_answer_to_move_the_item_to_the_end_and_reset_it_3c4086f2")} </Text>
                </View>
                <Switch
                  value={allowSkippingReviews}
                  onValueChange={setAllowSkippingReviews}
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

                <SettingsRowIcon setting="pause-correct" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.pause_on_correct_answer_1e40fb3e")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.show_accepted_answers_before_progressing_0bf30c50")} </Text>
                </View>
                <Switch
                  value={disableAutoProgressOnCorrect}
                  onValueChange={setDisableAutoProgressOnCorrect}
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

                <SettingsRowIcon setting="details-auto" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.show_details_on_answer_pause_d0749ed8")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.slide_subject_details_below_the_answer_field_when_reviews_pause_96da8553")} </Text>
                </View>
                <View style={styles.settingTrailingControls}>
                  <TouchableOpacity
                    style={[
                      styles.settingHelpButton,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.isDark ? "#1f1f1f" : "#f5f5f5",
                      },
                    ]}
                    onPress={() => setShowAnswerStopDetailsPreview(true)}
                    activeOpacity={0.75}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={uiT("ui.preview_answer_pause_details_setting_8da37442")}
                  >
                    <Ionicons
                      name="help"
                      size={16}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                  <Switch
                    value={showAnswerStopSubjectDetails}
                    onValueChange={setShowAnswerStopSubjectDetails}
                    trackColor={{ false: "#767577", true: theme.primary }}
                    thumbColor="#f4f3f4"
                  />
                </View>
              </View>
            </AdvancedSetting>
            <AdvancedSetting>
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
              >

                <SettingsRowIcon setting="synonyms" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.accept_user_synonyms_22fc0401")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.accept_your_custom_synonyms_as_correct_meaning_answers_5d42888a")} </Text>
                </View>
                <Switch
                  value={acceptUserSynonymsAsAnswers}
                  onValueChange={setAcceptUserSynonymsAsAnswers}
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

                <SettingsRowIcon setting="add-synonym" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.show_synonym_button_76fc9434")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.show_the_synonym_action_when_a_meaning_answer_is_paused_as_wrong_847b6a9e")} </Text>
                </View>
                <Switch
                  value={showAddSynonymButton}
                  onValueChange={setShowAddSynonymButton}
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

                <SettingsRowIcon setting="onyomi" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.accept_any_on_yomi_kanji_b87362cc")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.treat_all_on_yomi_readings_as_correct_in_kanji_reading_reviews_33f61a01")} </Text>
                </View>
                <Switch
                  value={acceptAnyKanjiOnyomiReading}
                  onValueChange={setAcceptAnyKanjiOnyomiReading}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor="#f4f3f4"
                />
              </View>
            </AdvancedSetting>
          </SettingsDisclosure>
          <SettingsDisclosure
            title={uiT("ui.prompt_display_8f341726")}
            description={uiT("ui.text_size_hints_and_review_information_465972d4")}
            icon="text"
          >
            <View
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
            >

              <SettingsRowIcon setting="character-size" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.review_character_size_ab236bdb")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.make_review_characters_smaller_or_larger_without_changing_other_t_46ef0c96")} </Text>
              </View>
              <View style={styles.batchSizeSelector}>
                <TouchableOpacity
                  style={[
                    styles.batchSizeButton,
                    { backgroundColor: theme.border },
                    !canDecreaseReviewCharacterFontScale &&
                      styles.batchSizeButtonDisabled,
                  ]}
                  onPress={() =>
                    canDecreaseReviewCharacterFontScale &&
                    setReviewCharacterFontScale(
                      reviewCharacterFontScale -
                        REVIEW_CHARACTER_FONT_SCALE_STEP,
                    )
                  }
                  disabled={!canDecreaseReviewCharacterFontScale}
                  accessibilityRole="button"
                  accessibilityLabel={uiT("ui.decrease_review_character_size_e97325c8")}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={
                      canDecreaseReviewCharacterFontScale
                        ? theme.textColor
                        : theme.textSecondary
                    }
                  />
                </TouchableOpacity>
                <Text
                  style={[
                    styles.batchSizeValue,
                    styles.reviewCharacterSizeValue,
                    { color: theme.textColor },
                  ]}
                >
                  {formatReviewFontScale(reviewCharacterFontScale)}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.batchSizeButton,
                    { backgroundColor: theme.border },
                    !canIncreaseReviewCharacterFontScale &&
                      styles.batchSizeButtonDisabled,
                  ]}
                  onPress={() =>
                    canIncreaseReviewCharacterFontScale &&
                    setReviewCharacterFontScale(
                      reviewCharacterFontScale +
                        REVIEW_CHARACTER_FONT_SCALE_STEP,
                    )
                  }
                  disabled={!canIncreaseReviewCharacterFontScale}
                  accessibilityRole="button"
                  accessibilityLabel={uiT("ui.increase_review_character_size_502f4ed4")}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={
                      canIncreaseReviewCharacterFontScale
                        ? theme.textColor
                        : theme.textSecondary
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
            <AdvancedSetting>
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
              >

                <SettingsRowIcon setting="input-size" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.review_input_size_f727103b")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.scale_the_answer_text_size_in_reviews_461da01e")} </Text>
                </View>
                <View style={styles.batchSizeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.batchSizeButton,
                      { backgroundColor: theme.border },
                      !canDecreaseReviewInputFontScale &&
                        styles.batchSizeButtonDisabled,
                    ]}
                    onPress={() =>
                      canDecreaseReviewInputFontScale &&
                      setReviewInputFontScale(
                        reviewInputFontScale - REVIEW_INPUT_FONT_SCALE_STEP,
                      )
                    }
                    disabled={!canDecreaseReviewInputFontScale}
                    accessibilityRole="button"
                    accessibilityLabel={uiT("ui.decrease_review_input_size_f749aa47")}
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={
                        canDecreaseReviewInputFontScale
                          ? theme.textColor
                          : theme.textSecondary
                      }
                    />
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.batchSizeValue,
                      styles.reviewCharacterSizeValue,
                      { color: theme.textColor },
                    ]}
                  >
                    {formatReviewFontScale(reviewInputFontScale)}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.batchSizeButton,
                      { backgroundColor: theme.border },
                      !canIncreaseReviewInputFontScale &&
                        styles.batchSizeButtonDisabled,
                    ]}
                    onPress={() =>
                      canIncreaseReviewInputFontScale &&
                      setReviewInputFontScale(
                        reviewInputFontScale + REVIEW_INPUT_FONT_SCALE_STEP,
                      )
                    }
                    disabled={!canIncreaseReviewInputFontScale}
                    accessibilityRole="button"
                    accessibilityLabel={uiT("ui.increase_review_input_size_11cd3dbe")}
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={
                        canIncreaseReviewInputFontScale
                          ? theme.textColor
                          : theme.textSecondary
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </AdvancedSetting>
            <AdvancedSetting>
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
              >

                <SettingsRowIcon setting="review-search" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.review_search_button_95ff3c0c")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.show_a_search_shortcut_below_wrap_up_during_reviews_70b5a0db")} </Text>
                </View>
                <Switch
                  value={reviewSearchButtonEnabled}
                  onValueChange={setReviewSearchButtonEnabled}
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
                <View style={styles.settingIcon}>
                  <Ionicons name="chart" size={24} color={theme.primary} />
                </View>
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.srs_progression_96060b33")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.show_the_new_srs_stage_of_the_submitted_answer_7487b93b")} </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.voiceSelectionButton,
                    { borderColor: theme.border },
                  ]}
                  onPress={openSrsProgressionCardModePicker}
                  activeOpacity={0.7}
                >
                  <View style={styles.voiceSelectionButtonContent}>
                    <Text
                      style={[
                        styles.voiceSelectionText,
                        { color: theme.textColor },
                      ]}
                    >
                      {getSrsProgressionCardModeLabel(
                        srsProgressionCardDisplayMode,
                      )}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={14}
                      color={theme.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </AdvancedSetting>
            <AdvancedSetting>
              <View
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
              >

                <SettingsRowIcon setting="subject-meta" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.show_item_level_srs_stage_342011cd")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.display_the_subject_level_and_current_srs_stage_during_reviews_256135b9")} </Text>
                </View>
                <Switch
                  value={showReviewItemLevelAndSrsStage}
                  onValueChange={setShowReviewItemLevelAndSrsStage}
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

                <SettingsRowIcon setting="review-context" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.vocabulary_context_sentence_hints_9ea91fd4")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.show_context_sentence_hints_during_vocabulary_review_questions_tr_5e28f748")} </Text>
                </View>
                <Switch
                  value={showVocabContextSentencesInReviews}
                  onValueChange={setShowVocabContextSentencesInReviews}
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

                <SettingsRowIcon setting="question-motion" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.animate_previous_question_4dd7c365")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.move_the_previous_answer_card_from_center_to_top_left_6c4b4921")} </Text>
                </View>
                <Switch
                  value={reviewAnimatePreviousQuestion}
                  onValueChange={setReviewAnimatePreviousQuestion}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor="#f4f3f4"
                />
              </View>
            </AdvancedSetting>
          </SettingsDisclosure>
          <SettingsDisclosure
            title={uiT("ui.font_practice_37a0560b")}
            description={uiT("ui.a_font_pool_for_varied_japanese_handwriting_8ed11ba7")}
            icon="font"
          >
            <View
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
            >

              <SettingsRowIcon setting="font-shuffle" color={theme.primary} />
              <View style={styles.settingTextContainer}>
                <SettingsLabel
                  style={[styles.settingText, { color: theme.textColor }]}
                >
                  {uiT("ui.jitai_font_randomizer_871cacaa")} </SettingsLabel>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.randomize_japanese_fonts_during_reviews_and_lesson_quizzes_to_imp_6feb765b")} </Text>
              </View>
              <Switch
                value={jitaiEnabled}
                onValueChange={setJitaiEnabled}
                trackColor={{ false: "#767577", true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            {jitaiEnabled && (
              <TouchableOpacity
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
                onPress={() => router.push("/jitai-font-settings")}
              >

                <SettingsRowIcon setting="font-pool" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.jitai_font_pool_353e7a6d")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.value_selected_manage_fonts_and_downloads_e13a413b", {value1: (jitaiSelectedFontIds.length)})}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
            {jitaiEnabled && (
              <AdvancedSetting>
                <View
                  style={[
                    styles.settingItem,
                    { borderBottomColor: theme.border },
                  ]}
                >

                  <SettingsRowIcon setting="font-cycle" color={theme.primary} />
                  <View style={styles.settingTextContainer}>
                    <SettingsLabel
                      style={[styles.settingText, { color: theme.textColor }]}
                    >
                      {uiT("ui.cycle_through_all_jitai_fonts_871f6cb7")} </SettingsLabel>
                    <Text
                      style={[
                        styles.settingSubtext,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {uiT("ui.cycle_all_selected_styles_with_source_han_sans_second_unless_show_7788d91e")} </Text>
                  </View>
                  <Switch
                    accessibilityLabel={uiT("ui.cycle_through_all_jitai_fonts_871f6cb7")}
                    value={jitaiCycleAllFonts}
                    onValueChange={setJitaiCycleAllFonts}
                    trackColor={{ false: "#767577", true: theme.primary }}
                    thumbColor="#f4f3f4"
                  />
                </View>
              </AdvancedSetting>
            )}
          </SettingsDisclosure>
          <SettingsDisclosure
            title={uiT("ui.keyboard_input_91a84d83")}
            description={uiT("ui.shortcuts_japanese_input_and_voice_answers_c46ccc64")}
            icon="keyboard"
            accessibilityLabel={uiT("ui.advanced_settings_7b0bd218")}
          >
            <AdvancedSetting>
              <TouchableOpacity
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.border },
                ]}
                onPress={openReviewShortcutModal}
              >

                <SettingsRowIcon setting="shortcuts" color={theme.primary} />
                <View style={styles.settingTextContainer}>
                  <SettingsLabel
                    style={[styles.settingText, { color: theme.textColor }]}
                  >
                    {uiT("ui.review_key_shortcuts_e5e97748")} </SettingsLabel>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {uiT("ui.external_keyboards_only_1c3499dc")} </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </AdvancedSetting>
            <AdvancedSetting>
              {KeyboardManager &&
                (Platform.OS === "ios" || Platform.OS === "android") && (
                  <View
                    style={[
                      styles.settingItem,
                      { borderBottomColor: "transparent" },
                    ]}
                  >

                    <SettingsRowIcon setting="japanese-keyboard" color={theme.primary} />
                    <View style={styles.settingTextContainer}>
                      <SettingsLabel
                        style={[styles.settingText, { color: theme.textColor }]}
                      >
                        {uiT("ui.japanese_input_keyboard_9bcb6103")} </SettingsLabel>
                      <Text
                        style={[
                          styles.settingSubtext,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {uiT("ui.automatically_switch_to_a_japanese_keyboard_for_japanese_answer_e_a5d63683")} </Text>
                    </View>
                    <Switch
                      value={autoSwitchKeyboard}
                      onValueChange={async (value) => {
                        if (value && KeyboardManager) {
                          const hasJa =
                            await KeyboardManager.hasJapaneseKeyboard();
                          if (!hasJa) {
                            Alert.alert(
                              uiT("ui.no_japanese_keyboard_ffbd52b8"),
                              JAPANESE_KEYBOARD_SETUP_INSTRUCTIONS,
                            );
                            return;
                          }
                        }
                        setAutoSwitchKeyboard(value);
                      }}
                      trackColor={{ false: "#767577", true: theme.primary }}
                      thumbColor="#f4f3f4"
                    />
                  </View>
                )}
            </AdvancedSetting>
            <AdvancedSetting>
              {Platform.OS === "ios" && (
                <View
                  style={[
                    styles.settingItem,
                    { borderBottomColor: theme.border },
                  ]}
                >

                  <SettingsRowIcon setting="voice-input" color={theme.primary} />
                  <View style={styles.settingTextContainer}>
                    <View style={styles.settingRow}>
                      <SettingsLabel
                        style={[styles.settingText, { color: theme.textColor }]}
                      >
                        {uiT("ui.voice_review_answers_598c83f0")} </SettingsLabel>
                      <View style={styles.betaBadge}>
                        <Text style={styles.betaBadgeText}>{uiT("ui.beta_639181fd")}</Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.settingSubtext,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {uiT("ui.tap_the_mic_once_to_answer_consecutive_questions_tap_again_to_sto_5b4f6d76")} </Text>
                  </View>
                  <Switch
                    value={voiceReviewAnswersEnabled}
                    onValueChange={setVoiceReviewAnswersEnabled}
                    trackColor={{ false: "#767577", true: theme.primary }}
                    thumbColor="#f4f3f4"
                  />
                </View>
              )}
            </AdvancedSetting>
          </SettingsDisclosure>
        </AdvancedSettingsGroup>
      </SettingsSectionSurface>
    </>
  );
}
