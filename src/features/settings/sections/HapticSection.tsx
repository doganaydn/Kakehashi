import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Switch, Text, View } from "react-native";

import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";

export function HapticSection() {
  useInterfaceLanguage();
  const {
    hapticFeedbackEnabled,
    setHapticFeedbackEnabled,
    theme,
    updateSectionOffset,
  } = useSettingsControllerContext();

  return (
    <>
      {/* Feedback Section */}
      <SettingsSectionSurface
        style={[
          styles.section,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          },
        ]}
        onLayout={(event) => {
          updateSectionOffset("haptic", event.nativeEvent.layout.y);
        }}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textColor, borderBottomColor: theme.border },
          ]}
        >
          {uiT("ui.haptic_9b9bf8d6")} </Text>

        <View
          style={[styles.settingItem, { borderBottomColor: "transparent" }]}
        >
          <MaterialIcons
            name="vibration"
            size={24}
            color={theme.primary}
            style={styles.settingIcon}
          />
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              {uiT("ui.haptic_feedback_1dda578b")} </SettingsLabel>
            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {uiT("ui.vibrate_on_key_actions_across_the_app_40cfd5b1")} </Text>
          </View>
          <Switch
            value={hapticFeedbackEnabled}
            onValueChange={setHapticFeedbackEnabled}
            trackColor={{ false: "#767577", true: theme.primary }}
            thumbColor="#f4f3f4"
          />
        </View>
      </SettingsSectionSurface>
    </>
  );
}
