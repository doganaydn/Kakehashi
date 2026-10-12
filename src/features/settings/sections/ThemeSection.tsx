import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import React from "react";
import { Text } from "react-native";
import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";
import { SettingsChoiceCards } from "../../../ui/settings/settings-choice-cards";
export function ThemeSection() {
  useInterfaceLanguage();
  const { theme, themeMode, setThemeMode, updateSectionOffset } =
    useSettingsControllerContext();
  return (
    <SettingsSectionSurface
      style={[
        styles.section,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
      onLayout={(event) =>
        updateSectionOffset("theme", event.nativeEvent.layout.y)
      }
    >
      <Text
        style={[
          styles.sectionTitle,
          { color: theme.textColor, borderBottomColor: theme.border },
        ]}
      >
        {uiT("ui.theme_efb52e71")} </Text>
      <SettingsChoiceCards
        label={uiT("ui.appearance_3907fa7f")}
        value={themeMode}
        theme={theme}
        compact
        options={[
          {
            value: "system",
            label: uiT("ui.system_6725e7bb"),
            description: uiT("ui.match_your_device_05215f60"),
            art: "system",
          },
          {
            value: "light",
            label: uiT("ui.light_dbcd5e7b"),
            description: uiT("ui.bright_surfaces_bebb5275"),
            art: "light",
          },
          {
            value: "dark",
            label: uiT("ui.dark_60acc53f"),
            description: uiT("ui.comfort_after_dark_c9a9579f"),
            art: "dark",
          },
          {
            value: "sepia",
            label: uiT("ui.sepia_7464e26f"),
            description: uiT("ui.warm_reading_paper_8dffe8d9"),
            art: "sepia",
          },
          {
            value: "midnight",
            label: uiT("ui.midnight_aa996cf2"),
            description: uiT("ui.pure_black_cbc0064d"),
            art: "midnight",
          },
        ]}
        onChange={setThemeMode}
      />
    </SettingsSectionSurface>
  );
}
