import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import React from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function BunproSurveyModal() {
  useInterfaceLanguage();
  const {
    bunproFeatureRequestInput,
    bunproIntegrationAnswer,
    bunproUsageAnswer,
    handleBunproUsageSelection,
    handleSubmitBunproSurvey,
    isSubmittingBunproSurvey,
    modalHeaderPaddingTop,
    setBunproFeatureRequestInput,
    setBunproIntegrationAnswer,
    setShowBunproSurveyModal,
    showBunproSurvey,
    showBunproSurveyModal,
    theme,
  } = useSettingsControllerContext();

  return (
    <>
      {showBunproSurvey && (
        <Modal
          visible={showBunproSurveyModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            if (isSubmittingBunproSurvey) {
              return;
            }
            setShowBunproSurveyModal(false);
          }}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.backgroundColor },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  backgroundColor: theme.cardBackground,
                  borderBottomColor: theme.border,
                  paddingTop: modalHeaderPaddingTop,
                },
              ]}
            >
              <TouchableOpacity
                disabled={isSubmittingBunproSurvey}
                onPress={() => setShowBunproSurveyModal(false)}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    {
                      color: theme.primary,
                      opacity: isSubmittingBunproSurvey ? 0.65 : 1,
                    },
                  ]}
                >
                  {uiT("ui.close_7d9eb7ac")} </Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.textColor }]}>
                {uiT("ui.bunpro_survey_001933d9")} </Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.bunproSurveyModalContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.super_short_this_helps_prioritize_bunpro_support_in_the_app_29651ecf")} </Text>

              <Text
                style={[
                  styles.bunproSurveyQuestion,
                  { color: theme.textColor, marginTop: 16 },
                ]}
              >
                {uiT("ui.do_you_use_bunpro_1f7175f2")} </Text>

              <View style={styles.bunproSurveyButtonRow}>
                <TouchableOpacity
                  style={[
                    styles.bunproSurveyChoiceButton,
                    {
                      backgroundColor:
                        bunproUsageAnswer === "yes"
                          ? theme.primary
                          : theme.backgroundColor,
                      borderColor:
                        bunproUsageAnswer === "yes"
                          ? theme.primary
                          : theme.border,
                      opacity: isSubmittingBunproSurvey ? 0.65 : 1,
                    },
                  ]}
                  disabled={isSubmittingBunproSurvey}
                  onPress={() => {
                    void handleBunproUsageSelection("yes");
                  }}
                >
                  <Text
                    style={[
                      styles.bunproSurveyChoiceButtonText,
                      {
                        color:
                          bunproUsageAnswer === "yes"
                            ? "#FFFFFF"
                            : theme.textColor,
                      },
                    ]}
                  >
                    {uiT("ui.yes_85a39ab3")} </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.bunproSurveyChoiceButton,
                    {
                      backgroundColor:
                        bunproUsageAnswer === "no"
                          ? theme.primary
                          : theme.backgroundColor,
                      borderColor:
                        bunproUsageAnswer === "no"
                          ? theme.primary
                          : theme.border,
                      opacity: isSubmittingBunproSurvey ? 0.65 : 1,
                    },
                  ]}
                  disabled={isSubmittingBunproSurvey}
                  onPress={() => {
                    void handleBunproUsageSelection("no");
                  }}
                >
                  <Text
                    style={[
                      styles.bunproSurveyChoiceButtonText,
                      {
                        color:
                          bunproUsageAnswer === "no"
                            ? "#FFFFFF"
                            : theme.textColor,
                      },
                    ]}
                  >
                    {uiT("ui.no_1ea442a1")} </Text>
                </TouchableOpacity>
              </View>

              {bunproUsageAnswer === "yes" && (
                <View style={styles.bunproSurveyFollowUpContainer}>
                  <Text
                    style={[
                      styles.bunproSurveyQuestion,
                      { color: theme.textColor, marginBottom: 8 },
                    ]}
                  >
                    {uiT("ui.would_you_want_bunpro_inside_this_app_too_a477e9dc")} </Text>

                  <View style={styles.bunproSurveyButtonRow}>
                    <TouchableOpacity
                      style={[
                        styles.bunproSurveyChoiceButton,
                        {
                          backgroundColor:
                            bunproIntegrationAnswer === "yes"
                              ? theme.primary
                              : theme.backgroundColor,
                          borderColor:
                            bunproIntegrationAnswer === "yes"
                              ? theme.primary
                              : theme.border,
                          opacity: isSubmittingBunproSurvey ? 0.65 : 1,
                        },
                      ]}
                      disabled={isSubmittingBunproSurvey}
                      onPress={() => setBunproIntegrationAnswer("yes")}
                    >
                      <Text
                        style={[
                          styles.bunproSurveyChoiceButtonText,
                          {
                            color:
                              bunproIntegrationAnswer === "yes"
                                ? "#FFFFFF"
                                : theme.textColor,
                          },
                        ]}
                      >
                        {uiT("ui.yes_85a39ab3")} </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.bunproSurveyChoiceButton,
                        {
                          backgroundColor:
                            bunproIntegrationAnswer === "no"
                              ? theme.primary
                              : theme.backgroundColor,
                          borderColor:
                            bunproIntegrationAnswer === "no"
                              ? theme.primary
                              : theme.border,
                          opacity: isSubmittingBunproSurvey ? 0.65 : 1,
                        },
                      ]}
                      disabled={isSubmittingBunproSurvey}
                      onPress={() => setBunproIntegrationAnswer("no")}
                    >
                      <Text
                        style={[
                          styles.bunproSurveyChoiceButtonText,
                          {
                            color:
                              bunproIntegrationAnswer === "no"
                                ? "#FFFFFF"
                                : theme.textColor,
                          },
                        ]}
                      >
                        {uiT("ui.no_1ea442a1")} </Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    value={bunproFeatureRequestInput}
                    onChangeText={setBunproFeatureRequestInput}
                    editable={!isSubmittingBunproSurvey}
                    multiline
                    numberOfLines={3}
                    placeholder={uiT("ui.optional_what_bunpro_features_would_you_like_here_e43a3dd3")}
                    placeholderTextColor={theme.textSecondary}
                    style={[
                      styles.bunproSurveyInput,
                      {
                        color: theme.textColor,
                        borderColor: theme.border,
                        backgroundColor: theme.backgroundColor,
                      },
                    ]}
                  />

                  <TouchableOpacity
                    style={[
                      styles.bunproSurveySubmitButton,
                      {
                        backgroundColor: theme.primary,
                        opacity: isSubmittingBunproSurvey ? 0.65 : 1,
                      },
                    ]}
                    disabled={isSubmittingBunproSurvey}
                    onPress={() => {
                      void handleSubmitBunproSurvey();
                    }}
                  >
                    <Text style={styles.bunproSurveySubmitButtonText}>
                      {isSubmittingBunproSurvey ? uiT("ui.saving_dc85af8f") : uiT("ui.submit_155f816c")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {bunproUsageAnswer === "no" && (
                <TouchableOpacity
                  style={[
                    styles.bunproSurveySubmitButton,
                    {
                      backgroundColor: theme.primary,
                      opacity: isSubmittingBunproSurvey ? 0.65 : 1,
                      marginTop: 14,
                    },
                  ]}
                  disabled={isSubmittingBunproSurvey}
                  onPress={() => {
                    void handleSubmitBunproSurvey();
                  }}
                >
                  <Text style={styles.bunproSurveySubmitButtonText}>
                    {isSubmittingBunproSurvey ? uiT("ui.saving_dc85af8f") : uiT("ui.submit_155f816c")}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}
    </>
  );
}
