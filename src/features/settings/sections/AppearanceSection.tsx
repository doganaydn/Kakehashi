import { uiT, useInterfaceLanguage } from "../../interface-language/runtime";
import { InterfaceLanguageSetting } from "../../interface-language/InterfaceLanguageSetting";
import { SettingsSectionSurface } from "../../../ui/settings/settings-section-surface";
import { SettingsLabel } from "../../../ui/settings/settings-search";
import {
  SettingsIcon as Ionicons,
  SettingsIcon as MaterialCommunityIcons,
} from "../../../ui/settings/settings-icon";
import React from "react";
import { ContentLanguageSetting } from "../../turkish-content/ContentLanguageSetting";
import type { Href } from "expo-router";
import { Platform, Text, TouchableOpacity, View } from "react-native";

import { useSettingsControllerContext } from "../SettingsControllerContext";
import { styles } from "../styles";
import { formatAppTextSizeScale, useSettingsStore } from "../../../utils/store";

const APP_TEXT_SIZE_SETTINGS_ROUTE = "/app-text-size-settings" as Href;

export function AppearanceSection() {
  useInterfaceLanguage();
  const { router, theme, updateSectionOffset } = useSettingsControllerContext();
  const appTextSizeScale = useSettingsStore((state) => state.appTextSizeScale);
  const showAppTextSizeSetting = Platform.OS === "ios";

  return (
    <>
      {/* Appearance Section */}
      <SettingsSectionSurface
        style={[
          styles.section,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          },
        ]}
        onLayout={(event) => {
          updateSectionOffset("appearance", event.nativeEvent.layout.y);
        }}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textColor, borderBottomColor: theme.border },
          ]}
        >
          {uiT("ui.appearance_3907fa7f")} </Text>

        <InterfaceLanguageSetting />
        <ContentLanguageSetting />
        <TouchableOpacity style={styles.settingItem} accessibilityRole="button"
          accessibilityLabel={uiT("ui.open_turkish_synonym_transfer_0592072c")}
          onPress={() => router.push("/turkish-synonyms" as Href)}>
          <Ionicons name="cloud-upload-outline" size={24} color={theme.primary} style={styles.settingIcon}/>
          <View style={{flex: 1}}>
            <SettingsLabel style={{color: theme.textColor, fontSize: 16}}>{uiT("ui.add_turkish_synonyms_to_wanikani_f2e6b76b")}</SettingsLabel>
            <Text style={{color: theme.textSecondary, fontSize: 14}}>{uiT("ui.choose_levels_and_review_suggestions_f566a1e4")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary}/>
        </TouchableOpacity>

        {showAppTextSizeSetting ? (
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={() => router.push(APP_TEXT_SIZE_SETTINGS_ROUTE)}
            accessibilityRole="button"
            accessibilityLabel={uiT("ui.open_app_text_size_settings_474ed936")}
          >
            <Ionicons
              name="text-outline"
              size={24}
              color={theme.primary}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <SettingsLabel
                style={[styles.settingText, { color: theme.textColor }]}
              >
                {uiT("ui.app_text_size_866b45cd")} </SettingsLabel>
              <Text
                style={[styles.settingSubtext, { color: theme.textSecondary }]}
              >
                {uiT("ui.adjust_text_size_across_kakehashi_5577f6b5")} </Text>
            </View>
            <Text
              style={[styles.settingValueText, { color: theme.textSecondary }]}
            >
              {formatAppTextSizeScale(appTextSizeScale)}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: theme.border }]}
          onPress={() => router.push("/tab-settings")}
        >
          <Ionicons
            name="apps"
            size={24}
            color={theme.primary}
            style={styles.settingIcon}
          />
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              {uiT("ui.customize_tabs_2d2fca4d")} </SettingsLabel>
            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {uiT("ui.choose_which_tabs_to_show_in_the_navigation_bar_89bcc269")} </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: theme.border }]}
          onPress={() => router.push("/subject-colors-settings")}
        >
          <Ionicons
            name="color-palette"
            size={24}
            color={theme.primary}
            style={styles.settingIcon}
          />
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              {uiT("ui.subject_colors_df0341bb")} </SettingsLabel>
            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {uiT("ui.customize_radical_kanji_and_vocabulary_colors_6fcc6571")} </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { borderBottomColor: "transparent" }]}
          onPress={() => router.push("/home-customization-settings")}
        >
          <MaterialCommunityIcons
            name="view-dashboard-outline"
            size={24}
            color={theme.primary}
            style={styles.settingIcon}
          />
          <View style={styles.settingTextContainer}>
            <SettingsLabel
              style={[styles.settingText, { color: theme.textColor }]}
            >
              {uiT("ui.home_customization_2482c0e7")} </SettingsLabel>
            <Text
              style={[styles.settingSubtext, { color: theme.textSecondary }]}
            >
              {uiT("ui.reorder_add_remove_and_theme_home_widgets_b03fcd28")} </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </SettingsSectionSurface>
    </>
  );
}
