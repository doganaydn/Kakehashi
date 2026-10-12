import { uiT, interfaceLocale, useInterfaceLanguage } from "../interface-language/runtime";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, useSettingsStore } from '../../utils/store';
import { useTheme } from '../../utils/theme';
import { fieldLabel, type HistoryPage, type HistoryEntry } from '../../../shared/subject-history/model';

import { HistoryDiff } from "./HistoryDiff";
import { useSubjectColors, getReadableTextColor } from "../../utils/subjectColors";

// Account-scoped, bounded cache. Nothing is requested until the sheet is opened.
const cache = new Map<string, { at: number; page: HistoryPage }>();
let cacheToken: string | null = null;
async function readHistory(subjectId: number, cursor: string | null, token: string, signal: AbortSignal): Promise<HistoryPage> {
  if (cacheToken !== token) { cache.clear(); cacheToken = token; }
  const key = `${subjectId}:${cursor ?? ''}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 86_400_000) return hit.page;
  const url = new URL(process.env.EXPO_PUBLIC_SUBJECT_HISTORY_URL || 'https://kakehashiapp.com/api/subjects/history');
  url.searchParams.set('subjectId', String(subjectId));
  if (cursor) url.searchParams.set('cursor', cursor);
  const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, signal });
  if (!response.ok) throw new Error('History could not be loaded. Please try again.');
  const page: HistoryPage = await response.json();
  if (cacheToken === token) { if (cache.size >= 100) cache.delete(cache.keys().next().value!); cache.set(key, { at: Date.now(), page }); }
  return page;
}

export function SubjectHistoryButton({ subjectId, label, meaning, subjectType = "kanji", iconColor = "#fff" }: { subjectId: number; label: string; meaning?: string; subjectType?: string; iconColor?: string }) {
  useInterfaceLanguage();
  const [open, setOpen] = useState(false);
  const [contentMounted, setContentMounted] = useState(false);
  const { theme } = useTheme();
  const token = useAuthStore(state => state.apiToken);
  const showSubjectHistory = useSettingsStore(state => state.showSubjectHistory);
  if (!showSubjectHistory || !Number.isSafeInteger(subjectId) || subjectId < 1) return null;
  return <>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={uiT("ui.change_history_964de7c9")} onPress={() => { setContentMounted(true); setOpen(true); }} style={styles.trigger}><Ionicons name="time-outline" size={20} color={iconColor} /></TouchableOpacity>
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" backdropColor={theme.backgroundColor} onRequestClose={() => setOpen(false)} onDismiss={() => { setOpen(false); setContentMounted(false); }}>
      {/* Preserve the painted sheet until the native dismissal animation finishes. */}
      {contentMounted ? <HistoryContent key={`${subjectId}:${token}`} token={token} subjectId={subjectId} label={label} meaning={meaning} subjectType={subjectType} onClose={() => setOpen(false)} /> : null}
    </Modal>
  </>;
}
function HistoryContent({ subjectId, label, meaning, subjectType, onClose, token }: { subjectId: number; label: string; meaning?: string; subjectType: string; onClose: () => void; token: string | null }) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = useSubjectColors();
  const hero = subjectType === "radical" ? colors.radical : subjectType === "kanji" ? colors.kanji : colors.vocabulary;
  const heroInk = getReadableTextColor(hero);
  const [cursor, setCursor] = useState<string | null>(null);
  const [pages, setPages] = useState<HistoryPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true); setError(false);
    if (!token) { setError(true); setLoading(false); return; }
    const timeout = setTimeout(() => controller.abort(), 20_000);
    readHistory(subjectId, cursor, token, controller.signal).then(page => {
      if (!controller.signal.aborted) setPages(old => cursor ? [...old, page] : [page]);
    }).catch(() => { if (active) setError(true); }).finally(() => { clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [subjectId, cursor, token, retry]);
  const text = { color: theme.textColor };
  const muted = { color: theme.textLight };
  const entries = pages.flatMap(page => page.entries);
  const next = pages.at(-1)?.cursor;
  const baseline = pages[0]?.baselineAt;
  return <View style={[styles.screen, { backgroundColor: theme.backgroundColor, paddingTop: 0 }]}>
    <View style={{ backgroundColor: hero, paddingTop: 16, paddingBottom: 24 }}>
      <View style={styles.header}><Text accessibilityRole="header" style={{ fontSize: 15, fontWeight: '600', color: heroInk }}>{uiT("ui.change_history_964de7c9")}</Text><Pressable accessibilityRole="button" accessibilityLabel={uiT("ui.close_change_history_4451a8b9")} onPress={onClose} style={styles.close}><Ionicons name="close" size={24} color={heroInk} /></Pressable></View>
      <Text style={{ color: heroInk, fontSize: label.length > 6 ? 30 : 48, textAlign: 'center', marginTop: 8 }}>{label}</Text>
      {meaning ? <Text style={{ color: heroInk, fontSize: 20, fontWeight: '600', textAlign: 'center', marginTop: 6 }}>{meaning}</Text> : null}
    </View>
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
      {entries.map((entry, index) => <HistoryItem key={entry.id} entry={entry} subjectType={subjectType} initiallyOpen={index === 0} />)}
      {loading ? <ActivityIndicator style={styles.status} color={theme.textColor} accessibilityLabel={uiT("ui.loading_history_f6c8ca7e")} /> : null}
      {error ? <View style={styles.status}><Text style={text}>{uiT("ui.history_could_not_be_loaded_350c1dcb")}</Text><Pressable accessibilityRole="button" onPress={() => setRetry(value => value + 1)} style={styles.retry}><Text style={text}>{uiT("ui.try_again_d8b8392e")}</Text></Pressable></View> : null}
      {!loading && !error && !entries.length ? <Text style={[styles.status, text]}>{uiT("ui.no_changes_recorded_yet_0dbc9c4d")}</Text> : null}
      {next && !loading && !error ? <Pressable accessibilityRole="button" style={[styles.more, { borderColor: theme.border }]} onPress={() => setCursor(next)}><Text style={text}>{uiT("ui.load_older_changes_2cfae79a")}</Text></Pressable> : null}
      {pages.length ? <Text style={[styles.coverage, muted]}>{baseline ? uiT("ui.tracking_since_value_earlier_coverage_is_partial_archived_content_e5bdb346", {value1: (new Date(baseline).toLocaleDateString())}) : uiT("ui.this_subject_has_not_been_archived_yet_check_back_after_the_next_750736c9")}</Text> : null}
    </ScrollView>
  </View>;
}
function HistoryItem({ entry, subjectType, initiallyOpen }: { entry: HistoryEntry; subjectType: string; initiallyOpen: boolean }) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(initiallyOpen);
  return <View style={[styles.entry, { borderColor: theme.border }]}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} style={styles.dateRow} onPress={() => setExpanded(value => !value)}>
      <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={16} color={theme.textLight} />
      <Text style={[styles.date, { color: theme.textColor }]}>{entry.source?.kind === "archive" ? uiT("ui.pre_2019_archive_6f6a7515") : new Date(entry.updatedAt).toLocaleDateString(interfaceLocale(), { year: "numeric", month: "long", day: "numeric" })}</Text>
      <Text style={{ color: theme.textLight, fontSize: 12 }}>{entry.changes.length} {entry.source?.kind === "archive" ? uiT("ui.archived_fields_7401eead") : entry.changes.length === 1 ? uiT("ui.change_12ea12ea") : uiT("ui.changes_d0b4ba23")}</Text>
    </Pressable>
    {expanded && entry.source?.kind === 'archive' ? <View style={{ gap: 8, marginTop: 12 }}><Text style={{ color: theme.textLight, lineHeight: 20 }}>{entry.source.summary} {uiT("ui.compared_on_1979cbe2")} {new Date(entry.source.comparedAt ?? entry.observedAt).toLocaleDateString()}.</Text><Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(entry.source!.url); }}><Text style={{ color: theme.textColor, textDecorationLine: 'underline', paddingVertical: 8 }}>{uiT("ui.tofugu_archive_55c11f74")}</Text></Pressable>{entry.source.licenseUrl ? <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(entry.source!.licenseUrl!); }}><Text style={{ color: theme.textColor, textDecorationLine: 'underline', paddingVertical: 8 }}>{uiT("ui.cc_by_sa_4_0_47f00cd3")}</Text></Pressable> : null}</View> : null}
    {expanded ? entry.changes.map(change => <View key={change.field} style={{ marginTop: 24 }}>
      <View style={styles.field}><Ionicons name={change.field.endsWith('_subject_ids') ? 'git-network-outline' : /mnemonic|hint/.test(change.field) ? 'book-outline' : 'list-outline'} size={18} color={theme.textLight} /><Text accessibilityRole="header" style={{ color: theme.textColor, fontWeight: '600', fontSize: 18 }}>{fieldLabel(change.field)}</Text></View>
      <HistoryDiff archived={entry.source?.kind === 'archive'} change={change} labels={entry.labels} subjectType={subjectType} />
    </View>) : null}
  </View>;
}
const styles = StyleSheet.create({
  trigger: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  body: { paddingHorizontal: 20 },
  entry: { paddingVertical: 24, borderBottomWidth: StyleSheet.hairlineWidth },
  date: { fontSize: 16, fontWeight: '600' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  coverage: { fontSize: 12, lineHeight: 19, marginTop: 24 },
  status: { marginVertical: 24 },
  retry: { paddingVertical: 14 },
  more: { padding: 14, borderWidth: 1, borderRadius: 6, alignItems: 'center', marginTop: 20 },
});
