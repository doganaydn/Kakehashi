import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import React from "react";
import { Picker } from "@react-native-picker/picker";
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function ReminderTimeModal() {
  useInterfaceLanguage();
  const {
    handleSaveReminderTime,
    reminderHourDraft,
    reminderMinuteDraft,
    setReminderHourDraft,
    setReminderMinuteDraft,
    setShowReminderTimeModal,
    sheetBottomPadding,
    sheetHorizontalPadding,
    showReminderTimeModal,
    theme,
  } = useSettingsControllerContext();

  return (
    <>
      <Modal
        visible={showReminderTimeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReminderTimeModal(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setShowReminderTimeModal(false)}
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
                  styles.reminderTimeModalContent,
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                <Text
                  style={[
                    styles.voicePickerModalTitle,
                    { color: theme.textColor, paddingBottom: 8 },
                  ]}
                >
                  {uiT("ui.daily_reminder_time_a5685c36")} </Text>
                <Text
                  style={[
                    styles.settingSubtext,
                    { color: theme.textSecondary, paddingHorizontal: 16 },
                  ]}
                >
                  {uiT("ui.shared_by_daily_review_and_lesson_reminders_in_your_local_timezon_62060e7d")} </Text>
                <View
                  style={[
                    styles.reminderTimePickerContainer,
                    {
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.reminderTimePickerRow}>
                    <View style={styles.reminderTimePickerColumn}>
                      <Text
                        style={[
                          styles.reminderTimePickerLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {uiT("ui.hour_f0063b80")} </Text>
                      <Picker
                        selectedValue={reminderHourDraft}
                        onValueChange={(value) =>
                          setReminderHourDraft(Number(value))
                        }
                        style={[
                          styles.reminderTimeValuePicker,
                          { color: theme.textColor },
                        ]}
                        itemStyle={[
                          styles.reminderTimeValuePickerItem,
                          { color: theme.textColor },
                        ]}
                      >
                        {Array.from({ length: 24 }, (_, hour) => (
                          <Picker.Item
                            key={`reminder-hour-${hour}`}
                            label={hour.toString().padStart(2, "0")}
                            value={hour}
                          />
                        ))}
                      </Picker>
                    </View>
                    <View style={styles.reminderTimePickerColumn}>
                      <Text
                        style={[
                          styles.reminderTimePickerLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {uiT("ui.minute_4b78665b")} </Text>
                      <Picker
                        selectedValue={reminderMinuteDraft}
                        onValueChange={(value) =>
                          setReminderMinuteDraft(Number(value))
                        }
                        style={[
                          styles.reminderTimeValuePicker,
                          { color: theme.textColor },
                        ]}
                        itemStyle={[
                          styles.reminderTimeValuePickerItem,
                          { color: theme.textColor },
                        ]}
                      >
                        {Array.from({ length: 60 }, (_, minute) => (
                          <Picker.Item
                            key={`reminder-minute-${minute}`}
                            label={minute.toString().padStart(2, "0")}
                            value={minute}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
                <View style={styles.reminderTimeActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.reminderTimeButton,
                      { borderColor: theme.border },
                    ]}
                    onPress={() => setShowReminderTimeModal(false)}
                  >
                    <Text
                      style={[
                        styles.reminderTimeButtonText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {uiT("ui.cancel_19766ed6")} </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.reminderTimeButton,
                      styles.reminderTimeSaveButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => void handleSaveReminderTime()}
                  >
                    <Text
                      style={[styles.reminderTimeButtonText, { color: "#fff" }]}
                    >
                      {uiT("ui.save_1509f561")} </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
