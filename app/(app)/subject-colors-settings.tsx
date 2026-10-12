import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { SettingsIcon as Ionicons } from "../../src/ui/settings/settings-icon";

import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "../../src/utils/store";
import {
  DEFAULT_SUBJECT_COLORS,
  normalizeHexColor,
  type SubjectColorType,
} from "../../src/utils/subjectColors";
import { useTheme } from "../../src/utils/theme";

// Only import expo/ui on iOS - it uses SwiftUI which doesn't exist on Android
const SwiftUI = Platform.OS === "ios" ? require("@expo/ui/swift-ui") : null;

type DraftState = Record<SubjectColorType, string>;
type PresetKey = "light" | "dark" | "sepia" | "midnight";

type SubjectPresetSet = {
  key: PresetKey;
  title: string;
  description: string;
  colors: Record<SubjectColorType, string>;
};

const SUBJECT_COLOR_KEYS: SubjectColorType[] = [
  "radical",
  "kanji",
  "vocabulary",
];

const SUBJECT_COLOR_PRESET_SETS: SubjectPresetSet[] = [
  {
    key: "light",
    get title() { return uiT("ui.light_dbcd5e7b"); },
    get description() { return uiT("ui.classic_default_palette_for_light_mode_045eff0c"); },
    colors: {
      radical: "#3c9bff",
      kanji: "#fa1f62",
      vocabulary: "#9c38d9",
    },
  },
  {
    key: "dark",
    get title() { return uiT("ui.dark_60acc53f"); },
    get description() { return uiT("ui.deep_tones_for_dark_mode_6f04e3f7"); },
    colors: {
      radical: "#1f4f85",
      kanji: "#8f1d43",
      vocabulary: "#5b2a82",
    },
  },
  {
    key: "sepia",
    get title() { return uiT("ui.sepia_7464e26f"); },
    get description() { return uiT("ui.warmer_tones_tuned_for_sepia_reading_3565dfbc"); },
    colors: {
      radical: "#4f90cc",
      kanji: "#dc5f72",
      vocabulary: "#8f4fc5",
    },
  },
  {
    key: "midnight",
    get title() { return uiT("ui.midnight_aa996cf2"); },
    get description() { return uiT("ui.extra_dark_high_contrast_midnight_accents_d06cdb90"); },
    colors: {
      radical: "#173a63",
      kanji: "#701534",
      vocabulary: "#432060",
    },
  },
];

const SUBJECT_COLOR_ITEMS: {
  key: SubjectColorType;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  {
    key: "radical",
    get title() { return uiT("ui.radicals_80608601"); },
    get description() { return uiT("ui.used_for_radical_cards_tags_and_highlights_41b0b4f3"); },
    icon: "shapes",
  },
  {
    key: "kanji",
    get title() { return uiT("ui.kanji_45f62a35"); },
    get description() { return uiT("ui.used_for_kanji_cards_badges_and_reading_accents_a6988354"); },
    icon: "language",
  },
  {
    key: "vocabulary",
    get title() { return uiT("ui.vocabulary_eebd90a0"); },
    get description() { return uiT("ui.used_for_vocabulary_cards_chips_and_context_accents_a985306f"); },
    icon: "book",
  },
];

function isValidHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function toEditableHex(value: string): string {
  return normalizeHexColor(value).replace(/^#/, "").toUpperCase();
}

function toValidSubjectColor(value: string, fallback: string): string {
  const normalized = normalizeHexColor(value || "");

  if (/^#[0-9a-f]{8}$/i.test(normalized)) {
    return normalized.slice(0, 7);
  }

  if (isValidHexColor(normalized)) {
    return normalized;
  }

  return fallback;
}

function getThemePresetKey(themeMode: string, isDark: boolean): PresetKey {
  if (themeMode === "dark") return "dark";
  if (themeMode === "sepia") return "sepia";
  if (themeMode === "midnight") return "midnight";
  if (themeMode === "light") return "light";

  return isDark ? "dark" : "light";
}

export default function SubjectColorsSettings() {
  useInterfaceLanguage();
  const { theme, themeMode } = useTheme();
  const insets = useSafeAreaInsets();

  const radicalColor = useSettingsStore((state) => state.radicalColor);
  const kanjiColor = useSettingsStore((state) => state.kanjiColor);
  const vocabularyColor = useSettingsStore((state) => state.vocabularyColor);
  const setRadicalColor = useSettingsStore((state) => state.setRadicalColor);
  const setKanjiColor = useSettingsStore((state) => state.setKanjiColor);
  const setVocabularyColor = useSettingsStore(
    (state) => state.setVocabularyColor
  );

  const activeColors = useMemo(
    () => ({
      radical: normalizeHexColor(radicalColor || DEFAULT_SUBJECT_COLORS.radical),
      kanji: normalizeHexColor(kanjiColor || DEFAULT_SUBJECT_COLORS.kanji),
      vocabulary: normalizeHexColor(
        vocabularyColor || DEFAULT_SUBJECT_COLORS.vocabulary
      ),
    }),
    [kanjiColor, radicalColor, vocabularyColor]
  );

  const [drafts, setDrafts] = useState<DraftState>({
    radical: toEditableHex(activeColors.radical),
    kanji: toEditableHex(activeColors.kanji),
    vocabulary: toEditableHex(activeColors.vocabulary),
  });

  useEffect(() => {
    setDrafts({
      radical: toEditableHex(activeColors.radical),
      kanji: toEditableHex(activeColors.kanji),
      vocabulary: toEditableHex(activeColors.vocabulary),
    });
  }, [activeColors.kanji, activeColors.radical, activeColors.vocabulary]);

  const activeThemePresetKey = getThemePresetKey(themeMode, theme.isDark);

  const setColor = (key: SubjectColorType, color: string) => {
    if (key === "radical") {
      setRadicalColor(color);
      return;
    }

    if (key === "kanji") {
      setKanjiColor(color);
      return;
    }

    setVocabularyColor(color);
  };

  const applyColor = (key: SubjectColorType, color: string) => {
    const normalized = toValidSubjectColor(color, activeColors[key]);
    setColor(key, normalized);
    setDrafts((prev) => ({
      ...prev,
      [key]: toEditableHex(normalized),
    }));
  };

  const handleDraftChange = (key: SubjectColorType, nextDraft: string) => {
    const sanitized = nextDraft.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);

    setDrafts((prev) => ({
      ...prev,
      [key]: sanitized.toUpperCase(),
    }));

    if (sanitized.length === 6) {
      applyColor(key, sanitized);
    }
  };

  const handleDraftBlur = (key: SubjectColorType) => {
    const draftWithHash = normalizeHexColor(drafts[key]);

    if (isValidHexColor(draftWithHash)) {
      applyColor(key, draftWithHash);
      return;
    }

    setDrafts((prev) => ({
      ...prev,
      [key]: toEditableHex(activeColors[key]),
    }));
  };

  const applyPresetSet = (preset: SubjectPresetSet) => {
    const normalizedSet = {
      radical: toValidSubjectColor(preset.colors.radical, activeColors.radical),
      kanji: toValidSubjectColor(preset.colors.kanji, activeColors.kanji),
      vocabulary: toValidSubjectColor(
        preset.colors.vocabulary,
        activeColors.vocabulary
      ),
    };

    setRadicalColor(normalizedSet.radical);
    setKanjiColor(normalizedSet.kanji);
    setVocabularyColor(normalizedSet.vocabulary);

    setDrafts({
      radical: toEditableHex(normalizedSet.radical),
      kanji: toEditableHex(normalizedSet.kanji),
      vocabulary: toEditableHex(normalizedSet.vocabulary),
    });
  };

  const isPresetActive = (preset: SubjectPresetSet) => {
    return SUBJECT_COLOR_KEYS.every(
      (key) =>
        normalizeHexColor(preset.colors[key]) === normalizeHexColor(activeColors[key])
    );
  };

  const resetDefaults = () => {
    setRadicalColor(DEFAULT_SUBJECT_COLORS.radical);
    setKanjiColor(DEFAULT_SUBJECT_COLORS.kanji);
    setVocabularyColor(DEFAULT_SUBJECT_COLORS.vocabulary);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}> 
      <StatusBar style={theme.statusBarStyle} />

      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.border,
            paddingTop: Math.max(insets.top, 60),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={uiT("ui.go_back_6aadac2f")}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textColor }]}>{uiT("ui.subject_colors_df0341bb")}</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetDefaults}
          accessibilityRole="button"
          accessibilityLabel={uiT("ui.reset_to_default_subject_colors_26b8fe2a")}
        >
          <Text style={[styles.resetButtonText, { color: theme.primary }]}>{uiT("ui.reset_daee7606")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
      >
        <View
          style={[
            styles.presetSection,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.presetTitle, { color: theme.textColor }]}>{uiT("ui.preset_sets_aacb9f3f")}</Text>
          <Text style={[styles.presetSubtitle, { color: theme.textSecondary }]}> 
            {uiT("ui.apply_all_three_colors_at_once_the_highlighted_set_matches_your_c_70fdd9e0")} </Text>

          <View style={styles.presetSetGrid}>
            {SUBJECT_COLOR_PRESET_SETS.map((preset) => {
              const active = isPresetActive(preset);
              const matchesTheme = preset.key === activeThemePresetKey;

              return (
                <TouchableOpacity
                  key={preset.key}
                  style={[
                    styles.presetSetCard,
                    {
                      borderColor: active ? theme.primary : theme.border,
                      backgroundColor: theme.isDark ? "#161616" : "#f8f8f8",
                    },
                  ]}
                  onPress={() => applyPresetSet(preset)}
                  accessibilityRole="button"
                  accessibilityLabel={uiT("ui.dynamic_83fa9e6db8ab", {value1: (preset.title)})}
                >
                  <View style={styles.presetSetHeader}>
                    <Text style={[styles.presetSetTitle, { color: theme.textColor }]}>
                      {preset.title}
                    </Text>
                    {matchesTheme ? (
                      <View
                        style={[
                          styles.themeBadge,
                          { backgroundColor: theme.primary },
                        ]}
                      >
                        <Text style={styles.themeBadgeText}>{uiT("ui.theme_efb52e71")}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text
                    style={[styles.presetSetDescription, { color: theme.textSecondary }]}
                  >
                    {preset.description}
                  </Text>

                  <View style={styles.presetSwatchesRow}>
                    {SUBJECT_COLOR_KEYS.map((key) => (
                      <View key={`${preset.key}-${key}`} style={styles.presetSwatchItem}>
                        <View
                          style={[
                            styles.presetSwatch,
                            {
                              backgroundColor: preset.colors[key],
                              borderColor: theme.border,
                            },
                          ]}
                        />
                        <Text style={[styles.presetSwatchLabel, { color: theme.textSecondary }]}> 
                          {key === "radical"
                            ? "R"
                            : key === "kanji"
                            ? "K"
                            : "V"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {SUBJECT_COLOR_ITEMS.map((item) => {
          const currentColor = activeColors[item.key];

          return (
            <View
              key={item.key}
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name={item.icon} size={20} color={currentColor} />
                  <Text style={[styles.cardTitle, { color: theme.textColor }]}> 
                    {item.title}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <View
                    style={[
                      styles.colorPreview,
                      { backgroundColor: currentColor, borderColor: theme.border },
                    ]}
                  />
                  {Platform.OS === "ios" && SwiftUI ? (
                    <SwiftUI.Host
                      matchContents
                      style={styles.colorPickerButtonHost}
                      colorScheme={theme.isDark ? "dark" : "light"}
                    >
                      <SwiftUI.ColorPicker
                        label=""
                        selection={currentColor}
                        supportsOpacity={false}
                        onSelectionChange={(value: string) =>
                          applyColor(item.key, value)
                        }
                      />
                    </SwiftUI.Host>
                  ) : null}
                </View>
              </View>

              <Text style={[styles.cardDescription, { color: theme.textSecondary }]}> 
                {item.description}
              </Text>

              {Platform.OS === "ios" && SwiftUI ? null : (
                <View style={styles.inputRow}>
                  <Text style={[styles.hashPrefix, { color: theme.textSecondary }]}>#</Text>
                  <TextInput
                    value={drafts[item.key]}
                    onChangeText={(text) => handleDraftChange(item.key, text)}
                    onBlur={() => handleDraftBlur(item.key)}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={6}
                    style={[
                      styles.hexInput,
                      {
                        color: theme.textColor,
                        borderColor: theme.border,
                        backgroundColor: theme.isDark ? "#1f1f1f" : "#f6f6f6",
                      },
                    ]}
                    selectionColor={currentColor}
                  />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  resetButton: {
    minWidth: 56,
    alignItems: "flex-end",
    paddingVertical: 4,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  content: {
    padding: 16,
    gap: 14,
  },
  presetSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  presetTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  presetSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  presetSetGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  presetSetCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  presetSetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  presetSetTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  presetSetDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
  },
  themeBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  themeBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  presetSwatchesRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  presetSwatchItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  presetSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
  presetSwatchLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  colorPreview: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
  },
  colorPickerButtonHost: {
    width: 32,
    height: 32,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  inputRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hashPrefix: {
    fontSize: 18,
    fontWeight: "600",
  },
  hexInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
