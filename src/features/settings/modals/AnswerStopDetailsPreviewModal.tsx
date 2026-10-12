import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import {SettingsIcon as Ionicons} from "../../../ui/settings/settings-icon";
import React from "react";

import { Image } from "expo-image";
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function AnswerStopDetailsPreviewModal() {
  useInterfaceLanguage();
  const {
    answerStopPreviewImageHeight,
    setShowAnswerStopDetailsPreview,
    sheetBottomPadding,
    sheetHorizontalPadding,
    showAnswerStopDetailsPreview,
    STOP_DETAILS_PREVIEW_IMAGE,
    theme,
  } = useSettingsControllerContext();

  return (
    <>
      <Modal
        visible={showAnswerStopDetailsPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAnswerStopDetailsPreview(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setShowAnswerStopDetailsPreview(false)}
        >
          <View
            style={[
              styles.voicePickerModalOverlay,
              {
                paddingHorizontal: sheetHorizontalPadding,
                paddingBottom: sheetBottomPadding,
              },
            ]}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.answerStopPreviewCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.answerStopPreviewHeader}>
                  <View
                    style={[
                      styles.answerStopPreviewIcon,
                      {
                        backgroundColor: theme.isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.04)",
                      },
                    ]}
                  >
                    <Ionicons name="help" size={17} color={theme.primary} />
                  </View>
                  <Text
                    style={[
                      styles.answerStopPreviewTitle,
                      { color: theme.textColor },
                    ]}
                  >
                    {uiT("ui.answer_pause_details_b769f5de")} </Text>
                </View>

                <Text
                  style={[
                    styles.answerStopPreviewDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  {uiT("ui.when_a_review_stops_after_an_answer_the_answer_field_actions_and_1652702f")} </Text>

                <View
                  style={[
                    styles.answerStopPreviewScreenshotFrame,
                    {
                      backgroundColor: theme.backgroundColor,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Image
                    source={STOP_DETAILS_PREVIEW_IMAGE}
                    style={[
                      styles.answerStopPreviewScreenshot,
                      { height: answerStopPreviewImageHeight },
                    ]}
                    contentFit="contain"
                    accessibilityLabel={uiT("ui.preview_of_the_answer_pause_details_sheet_6578855e")}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.answerStopPreviewCloseButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setShowAnswerStopDetailsPreview(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.answerStopPreviewCloseText}>{uiT("ui.got_it_5ad3dbd1")}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
