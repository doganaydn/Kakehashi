import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../utils/theme";
import { useLearningContentStore } from "./store";
import { useActiveContent, packageManager } from "./package-store";
import { packageSummary, type TranslationPackage } from "./resolver";
import { selectTranslationPackage } from "./import-file";

export function ContentLanguageSetting() {
  const { theme } = useTheme();
  const language = useLearningContentStore(s => s.language);
  const setLanguage = useLearningContentStore(s => s.setLanguage);
  const active = useActiveContent();
  const imported = packageManager.state(s => s.packet);
  const hydrated = packageManager.state(s => s.hydrated);
  const storageError = packageManager.state(s => s.error);
  const [candidate, setCandidate] = useState<TranslationPackage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void packageManager.hydrate(); }, []);
  const summaryText = (packet: TranslationPackage) => {
    const count = packageSummary(packet);
    return `${count.radical} radicals · ${count.kanji} kanji · ${count.vocabulary + count.kana_vocabulary} vocabulary · ${count.sentences} sentences\nLevels: ${count.levels.join(", ")}`;
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
    catch { setError("Could not save the package. Your current content is unchanged. Please try again."); }
    finally { setBusy(false); }
  }
  async function reset() {
    setBusy(true); setError(null);
    try { await packageManager.reset(); setCandidate(null); }
    catch { setError("Could not restore bundled content. Your current package is unchanged."); }
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
        <Text style={[styles.settingText, {color: theme.textColor}]}>Optional translation package</Text>
        <Text style={[styles.settingSubtext, {color: theme.textSecondary}]}>Load translated meanings and example sentences from a file. Missing translations use the original English.</Text>
      </View>
      <Switch accessibilityLabel="Use translation package" value={language === "tr"}
        trackColor={{true: theme.primary}} style={{flexShrink: 0}}
        onValueChange={enabled => setLanguage(enabled ? "tr" : "en")} />
    </View>
    <View style={styles.packageArea}>
      <Text style={{color: theme.textColor, fontWeight: "600"}}>{imported ? "Imported package" : "Bundled content"}</Text>
      {active && <Text style={[styles.settingSubtext, {color: theme.textSecondary}]}>Language: Turkish (tr){"\n"}{active.name} · v{active.version}{"\n"}{summaryText(active)}</Text>}
      {button(busy ? "Processing…" : "Import translation file", () => {void pick();})}
      {candidate && <View style={[styles.preview, {borderColor: theme.border}]}>
        <Text style={{color: theme.textColor, fontWeight: "600"}}>Language: Turkish (tr) · {candidate.name} · v{candidate.version}</Text>
        <Text style={[styles.settingSubtext, {color: theme.textSecondary}]}>{summaryText(candidate)}</Text>
        <Text style={[styles.settingSubtext, {color: theme.textSecondary}]}>File format checked; translation accuracy has not been verified. This replaces the entire active package. Translations are shown only when their source matches.</Text>
        {button("Use this package", () => {void activate();})}
        {button("Cancel", () => setCandidate(null))}
      </View>}
      {imported && button("Restore bundled content", () => Alert.alert(
        "Restore bundled content?", "The imported package will be replaced by the bundled content. Your account and study progress will stay the same.",
        [{text: "Cancel", style: "cancel"}, {text: "Restore", onPress: () => {void reset();}}]))}
      {(error || storageError) && <Text accessibilityRole="alert" style={[styles.settingSubtext, {color: theme.textColor}]}>{error || storageError}</Text>}
      <Text style={[styles.settingSubtext, {color: theme.textSecondary}]}>Packages are stored on your device for offline use. Interface language and answer grading stay the same.</Text>
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
