import { uiT, useInterfaceLanguage } from "../interface-language/runtime";
import { SettingsLabel } from "../../ui/settings/settings-search";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../utils/theme";
import { useLearningContentStore } from "./store";
import { useActiveContent, packageManager } from "./package-store";
import { packageSummary, type TranslationPackage } from "./resolver";
import { selectTranslationPackage } from "./import-file";

export function ContentLanguageSetting() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const language = useLearningContentStore(s => s.language);
  const setLanguage = useLearningContentStore(s => s.setLanguage);
  const active = useActiveContent();
  const imported = packageManager.state(s => s.packet);
  const hydrated = packageManager.state(s => s.hydrated);
  const storageError = packageManager.state(s => s.error);
  const [candidate, setCandidate] = useState<TranslationPackage | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void packageManager.hydrate(); }, []);
  const levelRanges = (levels: number[]) => {
    const parts: string[] = [];
    for (let i = 0; i < levels.length; i++) {
      const first = levels[i]; let last = first;
      while (levels[i + 1] === last + 1) last = levels[++i];
      parts.push(first === last ? String(first) : `${first}–${last}`);
    }
    return parts.join(", ");
  };
  const summaryText = (packet: TranslationPackage) => {
    const count = packageSummary(packet);
    return uiT("ui.dynamic_3512ec7b365b", {value1: (count.radical + count.kanji + count.vocabulary + count.kana_vocabulary), value2: (count.sentences), value3: (levelRanges(count.levels))});
  };
  const detailsText = (packet: TranslationPackage) => {
    const count = packageSummary(packet);
    return uiT("ui.dynamic_24e1a0f34959", {value1: (packet.name), value2: (count.radical), value3: (count.kanji), value4: (count.vocabulary + count.kana_vocabulary), value5: (packet.schemaVersion === 3 && packet.scope === "display-and-synonyms" ? uiT("ui.dynamic_15cc235e5ae8") : uiT("ui.dynamic_4472f08dfd9a"))});
  };
  async function pick() {
    setBusy(true); setError(null);
    try { const packet = await selectTranslationPackage(); if (packet) setCandidate(packet); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not read the file. Your current package is unchanged."); }
    finally { setBusy(false); }
  }
  async function activate() {
    if (!candidate) return;
    setBusy(true); setError(null);
    try { await packageManager.activate(candidate); setLanguage("tr"); setCandidate(null); }
    catch { setError(uiT("ui.message_6b9d734fa20e")); }
    finally { setBusy(false); }
  }
  async function reset() {
    setBusy(true); setError(null);
    try { await packageManager.reset(); setCandidate(null); }
    catch { setError(uiT("ui.message_a946f90d21bc")); }
    finally { setBusy(false); }
  }
  const disabled = busy || !hydrated;
  const button = (label: string, action: () => void) => <TouchableOpacity
    accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled}
    onPress={action} style={[styles.button, {borderColor: theme.border, opacity: disabled ? 0.5 : 1}]}>
    <Text style={{color: theme.primary, fontSize: 14}}>{label}</Text>
  </TouchableOpacity>;
  return <View>
    <View style={styles.settingItem}>
      <Ionicons name="language-outline" size={24} color={theme.primary} style={styles.settingIcon} />
      <View style={styles.settingTextContainer}>
        <SettingsLabel style={[styles.settingText, {color: theme.textColor}]}>{uiT("ui.optional_translation_package_be086037")}</SettingsLabel>
        <Text style={[styles.settingSubtext, {color: theme.textSecondary}]}>{uiT("ui.load_meanings_and_example_sentences_from_a_file_e421fd23")}</Text>
      </View>
      <Switch accessibilityLabel={uiT("ui.use_translation_package_a98d10c0")} value={language === "tr"}
        trackColor={{true: theme.primary}} style={{flexShrink: 0}}
        onValueChange={enabled => setLanguage(enabled ? "tr" : "en")} />
    </View>
    <View style={styles.packageArea}>
      <Text style={{color: theme.textColor, fontWeight: "600"}}>{imported ? uiT("ui.imported_package_d0004193") : uiT("ui.no_translation_package_loaded_ff554ee1")}</Text>
      {active && <Text style={[styles.settingSubtext, {color: theme.textSecondary}]}>{uiT("ui.turkish_v_80b75c3c")}{active.version}{"\n"}{summaryText(active)}</Text>}
      {active && button(showDetails ? "Hide package details" : "Package details", () => setShowDetails(value => !value))}
      {active && showDetails && <Text style={[styles.settingSubtext, {color: theme.textSecondary}]}>{detailsText(active)}</Text>}
      {button(busy ? "Processing…" : "Import translation file", () => {void pick();})}
      {candidate && <View style={[styles.preview, {borderColor: theme.border}]}>
        <Text style={{color: theme.textColor, fontWeight: "600"}}>{uiT("ui.language_turkish_tr_bab7338b")} {candidate.name} {uiT("ui.v_0bb917d8")}{candidate.version}</Text>
        <Text style={[styles.settingSubtext, {color: theme.textSecondary}]}>{summaryText(candidate)}{"\n"}{candidate.schemaVersion === 3 && candidate.scope === "display-and-synonyms" ? uiT("ui.display_synonym_suggestions_af6d8305") : uiT("ui.display_only_2a6230a4")}</Text>
        <Text style={[styles.settingSubtext, {color: theme.textSecondary}]}>{uiT("ui.replaces_the_current_package_format_checked_translation_accuracy_d9d5f68a")}</Text>
        {button("Use this package", () => {void activate();})}
        {button("Cancel", () => setCandidate(null))}
      </View>}
      {imported && button("Remove translation package", () => Alert.alert(
        uiT("ui.remove_translation_package_2cb0ef8b"), uiT("ui.translations_will_use_the_original_english_your_account_and_study_55bf2be1"),
        [{text: uiT("ui.cancel_19766ed6"), style: "cancel"}, {text: uiT("ui.remove_c3812fc4"), onPress: () => {void reset();}}]))}
      {(error || storageError) && <Text accessibilityRole="alert" style={[styles.settingSubtext, {color: theme.textColor}]}>{error || storageError}</Text>}
      <Text style={[styles.settingSubtext, {color: theme.textSecondary}]}>{uiT("ui.stored_on_this_device_missing_translations_use_english_db33175a")}</Text>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  settingItem: {flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12},
  settingIcon: {marginRight: 16},
  settingTextContainer: {flex: 1, minWidth: 0, marginRight: 12},
  settingText: {fontSize: 16},
  settingSubtext: {fontSize: 14, marginTop: 4},
  packageArea: {paddingHorizontal: 16, paddingBottom: 16},
  button: {borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 10},
  preview: {borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 12},
});
