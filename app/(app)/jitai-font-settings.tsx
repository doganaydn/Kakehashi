import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { SettingsIcon as Ionicons } from "../../src/ui/settings/settings-icon";

import { File } from "expo-file-system";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  downloadJitaiFont,
  formatJitaiFontSize,
  getDefaultJitaiSelectedFontIds,
  getInstalledJitaiFonts,
  importCustomJitaiFont,
  JITAI_DOWNLOADABLE_FONTS,
  loadDownloadedJitaiFonts,
  MAX_CUSTOM_JITAI_FONT_SIZE_BYTES,
  removeDownloadedJitaiFont,
  sanitizeJitaiSelectedFontIds,
  type DownloadedJitaiFont,
} from "../../src/utils/jitaiFonts";
import { useSettingsStore } from "../../src/utils/store";
import { useTheme } from "../../src/utils/theme";

const FONT_PREVIEW_TEXT = "日本語の読み練習 こんにちは 漢字 カタカナ";
const CUSTOM_FONT_IMPORT_ACTION_ID = "custom-font-import";

function isFilePickerCancellation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return /cancel|canceled|cancelled|abort/i.test(message);
}

export default function JitaiFontSettingsScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { jitaiSelectedFontIds, setJitaiSelectedFontIds } = useSettingsStore();

  const [downloadedJitaiFonts, setDownloadedJitaiFonts] = useState<
    DownloadedJitaiFont[]
  >([]);
  const [isLoadingJitaiFonts, setIsLoadingJitaiFonts] = useState(false);
  const [hasInitializedJitaiFonts, setHasInitializedJitaiFonts] =
    useState(false);
  const [jitaiFontActionId, setJitaiFontActionId] = useState<string | null>(
    null,
  );

  const refreshJitaiFonts = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setIsLoadingJitaiFonts(true);
      }
      const installedFonts = await loadDownloadedJitaiFonts();
      setDownloadedJitaiFonts(installedFonts);
    } catch (error) {
      console.error("Failed to refresh Jitai fonts:", error);
    } finally {
      setHasInitializedJitaiFonts(true);
      if (showLoader) {
        setIsLoadingJitaiFonts(false);
      }
    }
  }, []);

  const installedJitaiFonts = useMemo(
    () => getInstalledJitaiFonts(downloadedJitaiFonts),
    [downloadedJitaiFonts],
  );

  const downloadableJitaiFonts = useMemo(() => {
    const downloadedIds = new Set(downloadedJitaiFonts.map((font) => font.id));
    return JITAI_DOWNLOADABLE_FONTS.filter((font) => !downloadedIds.has(font.id));
  }, [downloadedJitaiFonts]);

  useEffect(() => {
    refreshJitaiFonts(true);
  }, [refreshJitaiFonts]);

  useEffect(() => {
    if (!hasInitializedJitaiFonts) {
      return;
    }

    const sanitized = sanitizeJitaiSelectedFontIds(
      jitaiSelectedFontIds,
      downloadedJitaiFonts,
    );
    const hasSameSelection =
      sanitized.length === jitaiSelectedFontIds.length &&
      sanitized.every((value, index) => value === jitaiSelectedFontIds[index]);

    if (!hasSameSelection) {
      setJitaiSelectedFontIds(sanitized);
    }
  }, [
    hasInitializedJitaiFonts,
    downloadedJitaiFonts,
    jitaiSelectedFontIds,
    setJitaiSelectedFontIds,
  ]);

  const toggleJitaiFontSelection = (fontId: string) => {
    if (jitaiSelectedFontIds.includes(fontId)) {
      if (jitaiSelectedFontIds.length === 1) {
        Alert.alert(
          uiT("ui.at_least_one_font_is_required_4b611790"),
          uiT("ui.keep_at_least_one_font_selected_for_jitai_78070c88"),
        );
        return;
      }
      setJitaiSelectedFontIds(
        jitaiSelectedFontIds.filter((selectedId) => selectedId !== fontId),
      );
      return;
    }

    setJitaiSelectedFontIds([...jitaiSelectedFontIds, fontId]);
  };

  const handleDownloadJitaiFont = async (fontId: string) => {
    try {
      setJitaiFontActionId(fontId);
      const downloadedFont = await downloadJitaiFont(fontId);

      // Update locally first to keep list mounted and avoid UI flicker.
      setDownloadedJitaiFonts((previous) => {
        const withoutExisting = previous.filter((font) => font.id !== downloadedFont.id);
        return [...withoutExisting, downloadedFont];
      });

      const currentSelection = useSettingsStore.getState().jitaiSelectedFontIds;
      if (!currentSelection.includes(downloadedFont.id)) {
        setJitaiSelectedFontIds([...currentSelection, downloadedFont.id]);
      }
    } catch (error) {
      console.error("Failed to download Jitai font:", error);
      Alert.alert(
        uiT("ui.download_failed_eae34ccb"),
        uiT("ui.could_not_download_this_font_please_check_your_connection_and_try_81cc3a8a"),
      );
    } finally {
      setJitaiFontActionId(null);
    }
  };

  const handleImportCustomJitaiFont = async () => {
    try {
      setJitaiFontActionId(CUSTOM_FONT_IMPORT_ACTION_ID);
      const result = await File.pickFileAsync();
      const pickedFile = Array.isArray(result) ? result[0] : result;
      if (!pickedFile) {
        return;
      }

      const customFont = await importCustomJitaiFont({
        uri: pickedFile.uri,
        name: pickedFile.name,
        size: pickedFile.size,
      });

      setDownloadedJitaiFonts((previous) => [...previous, customFont]);

      const currentSelection = useSettingsStore.getState().jitaiSelectedFontIds;
      if (!currentSelection.includes(customFont.id)) {
        setJitaiSelectedFontIds([...currentSelection, customFont.id]);
      }

      Alert.alert(
        uiT("ui.font_added_8dc92891"),
        uiT("ui.value_is_now_included_in_jitai_randomization_b69d0a95", {value1: (customFont.displayName)}),
      );
    } catch (error) {
      if (isFilePickerCancellation(error)) {
        return;
      }

      console.error("Failed to import custom Jitai font:", error);
      Alert.alert(
        uiT("ui.could_not_add_font_d8db8473"),
        error instanceof Error
          ? error.message
          : "The selected font could not be imported.",
      );
    } finally {
      setJitaiFontActionId(null);
    }
  };

  const handleRemoveStoredJitaiFont = (
    fontId: string,
    displayName: string,
    isCustom: boolean,
  ) => {
    Alert.alert(
      isCustom ? "Remove custom font" : "Remove downloaded font",
      uiT("ui.remove_value_from_local_storage_9d094709", {value1: (displayName)}),
      [
        { text: uiT("ui.cancel_19766ed6"), style: "cancel" },
        {
          text: uiT("ui.remove_c3812fc4"),
          style: "destructive",
          onPress: async () => {
            try {
              setJitaiFontActionId(fontId);
              await removeDownloadedJitaiFont(fontId);

              // Remove locally first to keep list mounted and avoid UI flicker.
              setDownloadedJitaiFonts((previous) =>
                previous.filter((font) => font.id !== fontId),
              );

              const currentSelection = useSettingsStore.getState().jitaiSelectedFontIds;
              const nextSelection = currentSelection.filter(
                (selectedId) => selectedId !== fontId,
              );
              setJitaiSelectedFontIds(
                nextSelection.length > 0
                  ? nextSelection
                  : getDefaultJitaiSelectedFontIds(),
              );
            } catch (error) {
              console.error("Failed to remove Jitai font:", error);
              Alert.alert(uiT("ui.error_54a0e8c1"), uiT("ui.could_not_remove_this_font_7186bb58"));
            } finally {
              setJitaiFontActionId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar style={theme.statusBarStyle} />

      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.backgroundColor,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: theme.textColor }]}>
            {uiT("ui.jitai_fonts_85ef08c9")} </Text>
          <Text style={[styles.subtitle, { color: theme.textColor }]}>
            {uiT("ui.value_selected_for_random_mode_5cb9081f", {value1: (jitaiSelectedFontIds.length)})}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.installed_fonts_505198c6")} </Text>
          <Text style={[styles.sectionSubtext, { color: theme.textSecondary }]}>
            {uiT("ui.select_the_fonts_to_include_in_jitai_randomization_each_row_inclu_a417e568")} </Text>

          {isLoadingJitaiFonts ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                {uiT("ui.loading_fonts_d133f6ce")} </Text>
            </View>
          ) : (
            <View style={styles.fontList}>
              {installedJitaiFonts.map((font) => {
                const isSelected = jitaiSelectedFontIds.includes(font.id);
                const isBusy = jitaiFontActionId === font.id;
                return (
                  <View
                    key={font.id}
                    style={[
                      styles.fontCard,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.cardBackground,
                      },
                    ]}
                  >
                    <View style={styles.fontRowTop}>
                      <TouchableOpacity
                        style={styles.fontSelectArea}
                        onPress={() => toggleJitaiFontSelection(font.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isSelected ? "checkbox" : "square-outline"}
                          size={20}
                          color={isSelected ? theme.primary : theme.textSecondary}
                        />
                        <View style={styles.fontInfo}>
                          <Text style={[styles.fontName, { color: theme.textColor }]}>
                            {font.displayName}
                          </Text>
                          <Text style={[styles.fontMeta, { color: theme.textSecondary }]}>
                            {font.source === "bundled"
                              ? uiT("ui.included_with_app_a4c555d9")
                              : font.source === "custom"
                                ? uiT("ui.custom_font_c039b7e2")
                                : uiT("ui.downloaded_f0b0738f")}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {font.source !== "bundled" && (
                        <TouchableOpacity
                          style={styles.actionIconButton}
                          onPress={() =>
                            handleRemoveStoredJitaiFont(
                              font.id,
                              font.displayName,
                              font.source === "custom",
                            )
                          }
                          disabled={Boolean(jitaiFontActionId)}
                          activeOpacity={0.7}
                        >
                          {isBusy ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                          ) : (
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={theme.textSecondary}
                            />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.previewText,
                        { color: theme.textColor, fontFamily: font.family },
                      ]}
                    >
                      {FONT_PREVIEW_TEXT}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.add_your_own_font_b9aac86d")} </Text>
          <Text style={[styles.sectionSubtext, { color: theme.textSecondary }]}>
            {uiT("ui.import_a_ttf_or_otf_file_from_your_device_choose_a_font_with_japa_2e37e02e")} </Text>

          <TouchableOpacity
            style={[
              styles.customFontButton,
              {
                borderColor: theme.primary,
                opacity: jitaiFontActionId ? 0.7 : 1,
              },
            ]}
            onPress={handleImportCustomJitaiFont}
            disabled={Boolean(jitaiFontActionId)}
            activeOpacity={0.75}
          >
            {jitaiFontActionId === CUSTOM_FONT_IMPORT_ACTION_ID ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons
                name="document-attach-outline"
                size={20}
                color={theme.primary}
              />
            )}
            <Text
              style={[styles.customFontButtonText, { color: theme.primary }]}
            >
              {uiT("ui.choose_font_file_af720cc9")} </Text>
          </TouchableOpacity>
          <Text style={[styles.importNote, { color: theme.textSecondary }]}>
            {uiT("ui.maximum_value_only_import_fonts_you_have_permission_to_use_aab639ff", {value1: (formatJitaiFontSize(
              MAX_CUSTOM_JITAI_FONT_SIZE_BYTES,
            ))})}
          </Text>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.more_fonts_cf76106b")} </Text>
          <Text style={[styles.sectionSubtext, { color: theme.textSecondary }]}>
            {uiT("ui.download_extra_fonts_on_demand_they_are_stored_locally_and_not_bu_267bbbec")} </Text>

          {downloadableJitaiFonts.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {uiT("ui.all_available_fonts_are_already_downloaded_7392c872")} </Text>
          ) : (
            <View style={styles.fontList}>
              {downloadableJitaiFonts.map((font) => {
                const isBusy = jitaiFontActionId === font.id;
                return (
                  <View
                    key={font.id}
                    style={[
                      styles.downloadRow,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.cardBackground,
                      },
                    ]}
                  >
                    <View style={styles.downloadInfo}>
                      <Text style={[styles.fontName, { color: theme.textColor }]}>
                        {font.displayName}
                      </Text>
                      <Text style={[styles.fontMeta, { color: theme.textSecondary }]}>
                        {font.styleLabel
                          ? uiT("ui.value_value_download_97db9c46", {value1: (font.styleLabel), value2: (formatJitaiFontSize(
                              font.sizeBytes,
                            ))})
                          : uiT("ui.value_download_255860d2", {value1: (formatJitaiFontSize(font.sizeBytes))})}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.downloadButton,
                        {
                          backgroundColor: theme.primary,
                          opacity: jitaiFontActionId ? 0.7 : 1,
                        },
                      ]}
                      onPress={() => handleDownloadJitaiFont(font.id)}
                      disabled={Boolean(jitaiFontActionId)}
                      activeOpacity={0.8}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.downloadButtonText}>{uiT("ui.download_d6eafe82")}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionSubtext: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  fontList: {
    gap: 8,
  },
  fontCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  fontRowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fontSelectArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  fontInfo: {
    marginLeft: 10,
    flex: 1,
  },
  fontName: {
    fontSize: 14,
    fontWeight: "600",
  },
  fontMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  previewText: {
    fontSize: 22,
    marginTop: 8,
    lineHeight: 34,
  },
  customFontButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  customFontButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  importNote: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  downloadRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  downloadInfo: {
    flex: 1,
    marginRight: 12,
  },
  downloadButton: {
    minWidth: 96,
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  downloadButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
  },
});
