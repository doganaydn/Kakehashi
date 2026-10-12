import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import {SettingsIcon as Ionicons} from "../../../ui/settings/settings-icon";
import React from "react";

import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function AndroidSrsProgressionCardModePickerModal() {
  useInterfaceLanguage();
  const {
    closeSrsProgressionCardModePicker,
    getSrsProgressionCardModeIconName,
    Platform,
    selectSrsProgressionCardMode,
    sheetBottomPadding,
    sheetHorizontalPadding,
    showSrsProgressionCardModeMenu,
    SRS_PROGRESSION_CARD_MODE_OPTIONS,
    srsProgressionCardDisplayMode,
    theme,
  } = useSettingsControllerContext();

  return (
    <>
      {/* Android SRS Progression Card Picker Modal */}
      {Platform.OS === "android" && (
        <Modal
          visible={showSrsProgressionCardModeMenu}
          transparent
          animationType="fade"
          onRequestClose={closeSrsProgressionCardModePicker}
        >
          <TouchableWithoutFeedback onPress={closeSrsProgressionCardModePicker}>
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
                    styles.voicePickerModalContent,
                    { backgroundColor: theme.cardBackground },
                  ]}
                >
                  <Text
                    style={[
                      styles.voicePickerModalTitle,
                      { color: theme.textColor },
                    ]}
                  >
                    {uiT("ui.srs_progression_card_67514dca")} </Text>

                  {SRS_PROGRESSION_CARD_MODE_OPTIONS.map((option) => {
                    const isSelected =
                      srsProgressionCardDisplayMode === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.voicePickerModalOption,
                          { borderTopColor: theme.border },
                        ]}
                        onPress={() =>
                          selectSrsProgressionCardMode(option.value)
                        }
                      >
                        <Ionicons
                          name={getSrsProgressionCardModeIconName(option.value)}
                          size={20}
                          color={theme.textColor}
                        />
                        <Text
                          style={[
                            styles.voicePickerModalOptionText,
                            { color: theme.textColor },
                          ]}
                        >
                          {option.label}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={theme.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    style={[
                      styles.voicePickerModalOption,
                      styles.voicePickerModalCancel,
                      { borderTopColor: theme.border },
                    ]}
                    onPress={closeSrsProgressionCardModePicker}
                  >
                    <Text
                      style={[
                        styles.voicePickerModalCancelText,
                        { color: theme.error },
                      ]}
                    >
                      {uiT("ui.cancel_19766ed6")} </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
  );
}
