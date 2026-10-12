import { uiT, interfaceLocale, useInterfaceLanguage } from "../interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import type { DOMProps } from "expo/dom";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHideTabBar } from "../../contexts/TabBarVisibilityContext";
import type { Subject } from "../../utils/api";
import { getAllSubjects } from "../../utils/cache";
import { useAuthStore } from "../../utils/store";
import { useTheme } from "../../utils/theme";
import { NotebookEditorSession } from "./NotebookEditorSession";
import type { NotebookEditorSubject, NotebookSentenceInput } from "./editor-contract";
import { getNotebookStartupScript } from "./editor-loading";
import { pageText, type NotebookPage } from "./model";
import {
  duplicateNotebookBlocks,
  duplicateNotebookTitle,
  nativeTemplateContent,
  newNotebookId,
  notebookDescendantIds,
  notebookPageTree,
  NOTEBOOK_TEMPLATES,
} from "./native-page-helpers";
import { useNotebooks } from "./use-notebooks";
import { useHandwriting } from "./use-handwriting";
import { useNativeInlineHandwriting } from "./use-native-inline-handwriting";

type Sheet = { type: "create"; parentId: string | null } | { type: "actions" | "move" | "icon"; pageId: string } | { type: "trash" } | null;
type IconName = keyof typeof Ionicons.glyphMap;

/** Require an authenticated account before mounting the store/editor, including deep links. */
export default function NotebookWorkspace({ showBackButton = false }: { showBackButton?: boolean }) {
  useInterfaceLanguage();
  const accountId = useAuthStore((state) => state.apiToken && state.userData?.id ? String(state.userData.id) : null);
  if (!accountId) return <Redirect href="/" />;
  return <AuthorizedNotebookWorkspace key={accountId} showBackButton={showBackButton} />;
}

function AuthorizedNotebookWorkspace({ showBackButton }: { showBackButton: boolean }) {
  useInterfaceLanguage();
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams<{ page?: string }>();
  const store = useNotebooks();
  const { persistDrafts, flushDrafts, mutate } = store;
  const [selection, setSelection] = useState(() => ({ id: params.page ?? null, generation: 0 }));
  const selectedId = selection.id;
  const setSelectedId = useCallback((id: string | null) => {
    setSelection((current) => current.id === id ? current : { id, generation: current.generation + 1 });
  }, []);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [sheet, setSheet] = useState<Sheet>(null);
  const [busy, setBusy] = useState(false);
  const [editorVersion, setEditorVersion] = useState(0);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [readyEditorKey, setReadyEditorKey] = useState<string | null>(null);
  const editorKey = `${store.accountId}:${selectedId}:${selection.generation}:${editorVersion}`;
  const currentEditorKey = useRef(editorKey);
  currentEditorKey.current = editorKey;
  const editorReady = readyEditorKey === editorKey;
  const [subjects, setSubjects] = useState<NotebookEditorSubject[]>([]);
  const domOptions = useMemo<DOMProps>(() => ({
    style: { flex: 1, backgroundColor: theme.cardBackground }, scrollEnabled: false, bounces: false,
    containerStyle: { flex: 1, backgroundColor: theme.cardBackground },
    injectedJavaScriptBeforeContentLoaded: getNotebookStartupScript(isDark ? "dark" : "light", theme.cardBackground),
    keyboardDisplayRequiresUserAction: false, hideKeyboardAccessoryView: true,
    onError: () => { setEditorError(uiT("ui.message_049ed38d9d77")); },
    onHttpError: () => { setEditorError(uiT("ui.message_049ed38d9d77")); },
  }), [isDark, theme.cardBackground]);
  const pages = store.state?.pages ?? EMPTY_PAGES;
  const page = pages.find((item) => item.id === selectedId && !item.trashedAt);
  useHideTabBar(!!page);
  const currentPageId = page?.id;
  const handwriting = useHandwriting(store.accountId, currentPageId, isDark ? "dark" : "light", persistDrafts);
  const nativeHandwriting = useNativeInlineHandwriting(store.accountId, currentPageId, persistDrafts, editorKey, theme.cardBackground);
  useEffect(() => {
    if (!currentPageId || editorReady || editorError) return;
    const timeout = setTimeout(() => setEditorError(uiT("ui.message_475329653784")), 45000);
    return () => clearTimeout(timeout);
  }, [currentPageId, editorVersion, editorReady, editorError]);
  const activePages = useMemo(() => pages.filter((item) => !item.trashedAt), [pages]);
  const trash = useMemo(() => pages.filter((item) => !!item.trashedAt).sort((a, b) => (b.trashedAt ?? "").localeCompare(a.trashedAt ?? "")), [pages]);
  const favorites = useMemo(() => activePages.filter((item) => item.favorite), [activePages]);
  const tree = useMemo(() => notebookPageTree(pages, expanded), [pages, expanded]);
  const searchResults = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return search ? activePages.filter((item) => `${item.title}\n${pageText(item, store.state?.sentences ?? [])}`.toLocaleLowerCase().includes(search)) : [];
  }, [activePages, query, store.state?.sentences]);
  const activeDraft = page ? store.drafts[page.id] : undefined;
  const sheetPage = sheet && "pageId" in sheet ? pages.find((item) => item.id === sheet.pageId) : undefined;
  const moveTargets = useMemo(() => {
    if (sheet?.type !== "move") return [];
    const excluded = notebookDescendantIds(pages, sheet.pageId);
    return activePages.filter((item) => !excluded.has(item.id));
  }, [activePages, pages, sheet]);

  useEffect(() => {
    setSelectedId(params.page ?? null);
    setSheet(null);
    setSubjects([]);
  }, [store.accountId, params.page, setSelectedId]);

  useEffect(() => {
    if (!currentPageId || subjects.length) return;
    let cancelled = false;
    void getAllSubjects().then((items) => {
      if (cancelled) return;
      setSubjects((items ?? []).filter((subject: Subject) => ["radical", "kanji", "vocabulary", "kana_vocabulary"].includes(subject.object)).map((subject: Subject) => ({
        id: subject.id,
        object: subject.object as NotebookEditorSubject["object"],
        data: {
          characters: subject.data.characters ?? null,
          slug: subject.data.slug,
          level: subject.data.level,
          meanings: subject.data.meanings.map(({ meaning, primary }) => ({ meaning, primary })),
          ...(subject.data.auxiliary_meanings?.length ? { auxiliary_meanings: subject.data.auxiliary_meanings } : {}),
          ...(subject.data.readings ? { readings: subject.data.readings.map(({ reading, primary }) => ({ reading, primary })) } : {}),
          ...(!subject.data.characters && subject.data.character_images?.length ? { character_images: subject.data.character_images.map(({ url }) => ({ url })) } : {}),
          ...(subject.data.pronunciation_audios?.length ? { pronunciation_audios: subject.data.pronunciation_audios.map(({ url }) => ({ url })) } : {}),
          ...(subject.data.context_sentences ? { context_sentences: subject.data.context_sentences } : {}),
        },
      })));
    }).catch(() => { /* Existing references still render when the vocabulary cache is unavailable. */ });
    return () => { cancelled = true; };
  }, [currentPageId, subjects.length]);

  const openPage = useCallback(async (id: string | null) => {
    // The hook persists drafts before a network attempt, so offline navigation is safe.
    try { await persistDrafts(); }
    catch { setEditorError(uiT("ui.message_a7460c81512d")); return; }
    void flushDrafts().catch(() => undefined);
    setSelectedId(id);
    setEditorError(null);
    setSheet(null);
  }, [flushDrafts, persistDrafts, setSelectedId]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (sheet) { setSheet(null); return true; }
      if (selectedId) { void openPage(null); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [openPage, selectedId, sheet]);

  const runAction = async (operation: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await operation(); }
    catch (error) { Alert.alert(uiT("ui.notebook_couldn_t_be_updated_68ed2319"), error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  };

  const createPage = (templateId: string, parentId: string | null) => runAction(async () => {
    await store.flushDrafts();
    const template = NOTEBOOK_TEMPLATES.find((item) => item.id === templateId)!;
    const id = newNotebookId();
    await store.mutate({ action: "create_page", page: { id, title: templateId === "blank" ? "" : template.title, icon: template.icon, parentId, content: nativeTemplateContent(templateId), sortOrder: activePages.length } });
    if (parentId) setExpanded((current) => new Set([...current, parentId]));
    setSheet(null);
    setSelectedId(id);
  });

  const changePage = (target: NotebookPage, patch: Partial<Pick<NotebookPage, "favorite" | "parentId">>) => runAction(async () => {
    // The client saves this page's draft and rebases its revision atomically.
    await store.mutate({ action: "update_page", pageId: target.id, expectedRevision: target.revision, patch });
    setSheet(null);
  });

  const duplicatePage = (target: NotebookPage) => runAction(async () => {
    await store.flushDrafts();
    const id = newNotebookId();
    await store.mutate({ action: "create_page", page: { id, title: duplicateNotebookTitle(target.title), icon: target.icon, parentId: target.parentId, content: duplicateNotebookBlocks(target.content), sortOrder: activePages.length } });
    setSelectedId(id);
    setSheet(null);
  });

  const trashPage = (target: NotebookPage) => runAction(async () => {
    await store.mutate({ action: "trash_page", pageId: target.id, expectedRevision: target.revision });
    if (notebookDescendantIds(pages, target.id).has(selectedId ?? "")) setSelectedId(null);
    setSheet(null);
  });

  const saveSentence = useCallback(async (input: NotebookSentenceInput) => {
    const id = input.id ?? newNotebookId("sentence");
    const result = await mutate({ action: "upsert_sentence", sentence: { id, japanese: input.japanese, kana: input.kana, english: input.english, subjectIds: input.subjectIds }, expectedRevision: input.revision ?? -1 });
    const sentence = result.state.sentences.find((item) => item.id === (result.sentenceId ?? id));
    if (!sentence) throw new Error("The sentence could not be saved. Please try again.");
    return sentence;
  }, [mutate]);

  const openSubject = useCallback(async (id: number) => {
    await persistDrafts();
    void flushDrafts().catch(() => undefined);
    router.push({ pathname: "/subject/[id]", params: { id: String(id) } });
  }, [flushDrafts, persistDrafts]);
  const reportEditorError = useCallback(async (message: string) => { setEditorError(message); }, []);
  const reportEditorReady = useCallback(async () => {
    // A previous page may finish loading after navigation or a retry.
    if (currentEditorKey.current === editorKey) setReadyEditorKey(editorKey);
  }, [editorKey]);

  const resolveDraft = (keep: boolean) => {
    if (!page) return;
    if (keep) {
      void runAction(async () => { const copy = await store.duplicateDraft(page.id); setSelectedId(copy.id); setEditorVersion((value) => value + 1); });
    } else {
      Alert.alert(uiT("ui.load_the_saved_version_482a1157"), uiT("ui.the_unsaved_changes_on_this_device_will_be_discarded_8a595a97"), [
        { text: uiT("ui.cancel_19766ed6"), style: "cancel" },
        { text: uiT("ui.load_saved_version_dbfaa86e"), style: "destructive", onPress: () => void runAction(async () => { await store.discardDraft(page.id); setEditorVersion((value) => value + 1); }) },
      ]);
    }
  };

  function pageRow(target: NotebookPage, depth = 0, hasChildren = false) {
    return <View key={target.id} style={{ flexDirection: "row", alignItems: "center", paddingLeft: Math.min(depth, 6) * 20 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${expanded.has(target.id) ? "Collapse" : "Expand"} ${target.title || "Untitled"}`} disabled={!hasChildren} onPress={() => setExpanded((current) => { const next = new Set(current); if (next.has(target.id)) next.delete(target.id); else next.add(target.id); return next; })} style={{ width: 32, minHeight: 52, alignItems: "center", justifyContent: "center", opacity: hasChildren ? 1 : 0 }}>
        <Ionicons name={expanded.has(target.id) ? "chevron-down" : "chevron-forward"} size={16} color={theme.textSecondary} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${target.title || "Untitled"}`} onPress={() => void openPage(target.id)} onLongPress={() => setSheet({ type: "actions", pageId: target.id })} style={({ pressed }) => ({ flex: 1, flexDirection: "row", gap: 12, alignItems: "center", minHeight: 52, opacity: pressed ? 0.55 : 1 })}>
        <PageIcon value={target.icon} size={23} />
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, color: theme.textColor }}>{target.title || uiT("ui.untitled_f59ab8d1")}</Text>
      </Pressable>
      <IconButton icon="ellipsis-horizontal" label={uiT("ui.dynamic_34e14d665e15", {value1: (target.title || "Untitled")})} onPress={() => setSheet({ type: "actions", pageId: target.id })} color={theme.textSecondary} />
    </View>;
  }

  const saveLabel = activeDraft?.conflict ? "Needs review" : store.saveStatus === "saving" ? "Saving…" : store.saveStatus === "offline" ? "Saved on device" : store.saveStatus === "error" ? "Couldn't sync" : "Saved";
  const error = editorError || store.error;

  return <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: theme.cardBackground }}>
    {page ? <>
      <View style={[styles.navigation, { borderBottomColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={uiT("ui.back_to_notebooks_4c9ea926")} onPress={() => void openPage(null)} style={styles.backButton}>
          <Ionicons name="chevron-back" size={23} color={theme.textColor} />
          <Text style={{ fontSize: 16, color: theme.textColor }}>{uiT("ui.notebooks_0ae9bd5b")}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" accessibilityLabel={uiT("ui.dynamic_cc5c8e234d8d", {value1: (saveLabel)})} onPress={() => void store.flushDrafts().catch(() => undefined)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 12, color: activeDraft?.conflict || store.saveStatus === "error" ? theme.error : theme.textSecondary }}>{saveLabel}</Text>
        </Pressable>
        <IconButton icon="ellipsis-horizontal" label={uiT("ui.page_actions_adc00f39")} onPress={() => setSheet({ type: "actions", pageId: page.id })} color={theme.textColor} />
      </View>
      {activeDraft?.conflict ? <View style={[styles.notice, { backgroundColor: theme.backgroundColor, borderBottomColor: theme.border }]}>
        <Text selectable style={{ color: theme.textColor, fontSize: 14, lineHeight: 20 }}>{uiT("ui.this_page_changed_on_another_device_your_edits_are_kept_here_e43bc9ca")}</Text>
        <View style={{ flexDirection: "row", gap: 18 }}><TextButton title={uiT("ui.keep_as_new_page_e31b46b8")} onPress={() => resolveDraft(true)} /><TextButton title={uiT("ui.load_saved_version_dbfaa86e")} onPress={() => resolveDraft(false)} /></View>
      </View> : error ? <View style={[styles.notice, { backgroundColor: theme.backgroundColor, borderBottomColor: theme.border }]}>
        <Text selectable style={{ color: theme.error, fontSize: 13, lineHeight: 18 }}>{error}</Text>
        <TextButton title={uiT("ui.retry_942087cc")} onPress={() => {
          if (editorError) { setEditorError(null); setEditorVersion((value) => value + 1); }
          else void runAction(async () => { await store.flushDrafts(); await store.refresh(); });
        }} />
      </View> : null}
      <View style={{ flex: 1, backgroundColor: theme.cardBackground }}>
        <NotebookEditorSession
          {...handwriting}
          {...nativeHandwriting.editorProps}
          inlineHandwritingAvailable={false}
          key={editorKey}
          page={page}
          hasDraft={!!activeDraft}
          updatePageDraft={store.updatePageDraft}
          sentences={store.state?.sentences ?? []}
          pages={activePages.filter((item) => item.id !== page.id).map(({ id, title, icon }) => ({ id, title, icon }))}
          subjects={subjects}
          theme={isDark ? "dark" : "light"}
          themeBackground={theme.cardBackground}
          onOpenPage={openPage}
          onOpenSubject={openSubject}
          onSaveSentence={saveSentence}
          onError={reportEditorError}
          onReady={reportEditorReady}
          dom={domOptions}
        />
        {nativeHandwriting.overlay}
        {!editorReady ? <View testID="notebook-editor-loading" style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.cardBackground, alignItems: "center", justifyContent: "center" }]}>
          {!editorError ? <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><ActivityIndicator color={theme.textSecondary} /><Text style={{ color: theme.textSecondary }}>{uiT("ui.opening_page_f53b55a1")}</Text></View> : null}
        </View> : null}
      </View>
    </> : <>
      <View style={[styles.navigation, { borderBottomWidth: 0 }]}>
        {showBackButton ? <IconButton icon="chevron-back" label={uiT("ui.back_76900f1b")} onPress={() => router.back()} color={theme.textColor} /> : null}
        <View style={{ flex: 1 }} />
        <IconButton icon="trash-outline" label={uiT("ui.open_trash_05187ac7")} onPress={() => setSheet({ type: "trash" })} color={theme.textSecondary} />
        <IconButton icon="create-outline" label={uiT("ui.new_notebook_page_46071460")} onPress={() => setSheet({ type: "create", parentId: null })} color={theme.textColor} disabled={!store.state || !store.available} />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }} refreshControl={<RefreshControl refreshing={store.loading && !!store.state} onRefresh={() => void store.refresh().catch(() => undefined)} tintColor={theme.textSecondary} />}>
        <Text accessibilityRole="header" style={{ fontSize: 32, fontWeight: "700", letterSpacing: -0.9, color: theme.textColor, marginBottom: 23 }}>{uiT("ui.notebooks_0ae9bd5b")}</Text>
        <View style={{ flexDirection: "row", gap: 9, alignItems: "center", paddingHorizontal: 12, height: 44, borderRadius: 8, backgroundColor: theme.backgroundColor }}>
          <Ionicons name="search" size={19} color={theme.textSecondary} />
          <TextInput value={query} onChangeText={setQuery} placeholder={uiT("ui.search_your_pages_81c008fe")} placeholderTextColor={theme.textSecondary} accessibilityLabel={uiT("ui.search_notebook_pages_deba4e52")} clearButtonMode="while-editing" autoCapitalize="none" autoCorrect={false} returnKeyType="search" style={{ flex: 1, height: 44, fontSize: 16, color: theme.textColor }} />
        </View>
        {error ? <View style={{ paddingVertical: 20, gap: 4 }}><Text selectable style={{ color: theme.error, fontSize: 14, lineHeight: 20 }}>{error}</Text><TextButton title={uiT("ui.try_again_d8b8392e")} onPress={() => void store.refresh().catch(() => undefined)} /></View> : null}
        {!store.available && store.state && !store.loading && !error ? <View style={{ paddingVertical: 20, gap: 4 }}><Text selectable style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20 }}>{uiT("ui.notebook_syncing_is_unavailable_right_now_4f8caf33")}</Text><TextButton title={uiT("ui.try_again_d8b8392e")} onPress={() => void store.refresh().catch(() => undefined)} /></View> : null}
        {store.loading && !store.state ? <ActivityIndicator color={theme.textSecondary} style={{ paddingVertical: 60 }} /> : !store.state ? <EmptyState icon="cloud-offline-outline" title={uiT("ui.your_pages_couldn_t_be_loaded_d0098407")} description={uiT("ui.check_your_connection_then_try_again_f8744edb")} /> : query.trim() ? <>
          <SectionLabel>{searchResults.length} {searchResults.length === 1 ? "result" : "results"}</SectionLabel>
          {searchResults.length ? searchResults.map((item) => pageRow(item)) : <EmptyState icon="search-outline" title={uiT("ui.no_matching_pages_6b6a460b")} description={uiT("ui.try_a_page_title_a_word_or_a_phrase_from_your_notes_ceb6151f")} />}
        </> : <>
          {favorites.length ? <><SectionLabel>{uiT("ui.favorites_7a1f2a83")}</SectionLabel>{favorites.map((item) => pageRow(item))}</> : null}
          <SectionLabel>{uiT("ui.pages_9046da16")}</SectionLabel>
          {tree.map(({ page: item, depth, hasChildren }) => pageRow(item, depth, hasChildren))}
          {activePages.length === 0 ? <EmptyState icon="document-text-outline" title={uiT("ui.a_place_for_your_japanese_933a338a")} description={uiT("ui.keep_lesson_notes_grammar_patterns_and_words_you_want_to_remember_02bb8029")} /> : null}
          <Pressable accessibilityRole="button" onPress={() => setSheet({ type: "create", parentId: null })} disabled={!store.available} style={{ minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 35, opacity: store.available ? 1 : 0.4 }}>
            <Ionicons name="add" size={24} color={theme.textSecondary} /><Text style={{ color: theme.textSecondary, fontSize: 16 }}>{uiT("ui.new_page_40126b0e")}</Text>
          </Pressable>
        </>}
      </ScrollView>
    </>}
    <Modal visible={!!sheet} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSheet(null)}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.cardBackground }} edges={["top", "bottom"]}>
        <View style={[styles.navigation, { borderBottomColor: theme.border, paddingLeft: 20 }]}>
          <Text numberOfLines={1} accessibilityRole="header" style={{ flex: 1, fontSize: 18, fontWeight: "600", color: theme.textColor }}>{sheet?.type === "create" ? uiT("ui.new_page_40126b0e") : sheet?.type === "trash" ? uiT("ui.trash_c560122a") : sheet?.type === "move" ? uiT("ui.move_page_6347249d") : sheet?.type === "icon" ? uiT("ui.page_icon_99d0f3e6") : sheetPage?.title || uiT("ui.untitled_f59ab8d1")}</Text>
          {busy ? <ActivityIndicator color={theme.textSecondary} /> : null}
          <IconButton icon="close" label={uiT("ui.close_sheet_d39e50fe")} onPress={() => setSheet(null)} color={theme.textSecondary} />
        </View>
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          {sheet?.type === "create" ? NOTEBOOK_TEMPLATES.map((template) => <Pressable key={template.id} accessibilityRole="button" disabled={busy} onPress={() => void createPage(template.id, sheet.parentId)} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 17, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border, opacity: pressed || busy ? 0.5 : 1 })}>
            <PageIcon value={template.icon} size={27} /><View style={{ flex: 1, gap: 4 }}><Text style={{ fontSize: 17, fontWeight: "500", color: theme.textColor }}>{template.title}</Text><Text style={{ fontSize: 14, lineHeight: 20, color: theme.textSecondary }}>{template.description}</Text></View><Ionicons name="chevron-forward" size={18} color={theme.textLight} />
          </Pressable>) : null}
          {sheet?.type === "actions" && sheetPage ? <>
            <ActionRow icon={sheetPage.favorite ? "star" : "star-outline"} title={sheetPage.favorite ? "Remove from favorites" : "Add to favorites"} disabled={busy} onPress={() => void changePage(sheetPage, { favorite: !sheetPage.favorite })} />
            <ActionRow icon="happy-outline" title={uiT("ui.change_icon_87f2c4e6")} onPress={() => setSheet({ type: "icon", pageId: sheetPage.id })} />
            <ActionRow icon="document-outline" title={uiT("ui.add_a_subpage_e6b2c91f")} onPress={() => setSheet({ type: "create", parentId: sheetPage.id })} />
            <ActionRow icon="copy-outline" title={uiT("ui.duplicate_02cdaabf")} disabled={busy} onPress={() => void duplicatePage(sheetPage)} />
            <ActionRow icon="folder-open-outline" title={uiT("ui.move_to_beb8194b")} onPress={() => setSheet({ type: "move", pageId: sheetPage.id })} />
            <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 12 }} />
            <ActionRow icon="trash-outline" title={uiT("ui.move_to_trash_b250a454")} destructive disabled={busy} onPress={() => void trashPage(sheetPage)} />
            <Text selectable style={{ fontSize: 13, lineHeight: 19, color: theme.textSecondary, paddingVertical: 22 }}>{uiT("ui.last_edited_43c314d4")} {new Date(sheetPage.updatedAt).toLocaleDateString(interfaceLocale(), { month: "short", day: "numeric", year: "numeric" })}</Text>
          </> : null}
          {sheet?.type === "icon" && sheetPage ? <>
            <Text style={{ color: theme.textSecondary, fontSize: 14, paddingVertical: 12 }}>{uiT("ui.choose_an_icon_for_this_page_f6b17615")}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>{PAGE_ICONS.map((icon) => <Pressable key={icon} accessibilityRole="button" accessibilityLabel={`Use ${icon} icon`} onPress={() => { store.updatePageDraft(sheetPage.id, { icon }); setSheet(null); }} style={{ width: 54, height: 54, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: sheetPage.icon === icon ? theme.textColor : theme.border, borderRadius: 8 }}><PageIcon value={icon} size={29} /></Pressable>)}</View>
            <ActionRow icon="close-circle-outline" title={uiT("ui.remove_icon_93d6de71")} onPress={() => { store.updatePageDraft(sheetPage.id, { icon: "" }); setSheet(null); }} />
          </> : null}
          {sheet?.type === "move" && sheetPage ? <>
            <ActionRow icon="documents-outline" title={uiT("ui.pages_top_level_b244f81a")} disabled={busy || sheetPage.parentId === null} onPress={() => void changePage(sheetPage, { parentId: null })} />
            {moveTargets.map((target) => <ActionRow key={target.id} emoji={target.icon || "📄"} title={target.title || "Untitled"} disabled={busy || sheetPage.parentId === target.id} onPress={() => void changePage(sheetPage, { parentId: target.id })} />)}
          </> : null}
          {sheet?.type === "trash" ? <>
            {trash.length === 0 ? <EmptyState icon="trash-outline" title={uiT("ui.trash_is_empty_52a78027")} description={uiT("ui.pages_you_delete_can_be_restored_here_3e77a14d")} /> : <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20, paddingVertical: 12 }}>{uiT("ui.restore_a_page_to_bring_it_and_its_subpages_back_8d00ded9")}</Text>}
            {trash.map((target) => <View key={target.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }}><PageIcon value={target.icon} size={24} /><Text numberOfLines={2} style={{ flex: 1, fontSize: 16, color: theme.textColor }}>{target.title || uiT("ui.untitled_f59ab8d1")}</Text><IconButton icon="arrow-undo-outline" label={`Restore ${target.title || "Untitled"}`} color={theme.textColor} disabled={busy} onPress={() => void runAction(async () => { await store.mutate({ action: "restore_page", pageId: target.id, expectedRevision: target.revision }); })} /><IconButton icon="trash-outline" label={uiT("ui.dynamic_40111d7e0aa5", {value1: (target.title || "Untitled")})} color={theme.error} disabled={busy} onPress={() => Alert.alert(uiT("ui.delete_this_page_permanently_c0427781"), uiT("ui.this_page_and_its_subpages_cannot_be_recovered_689b19f1"), [{ text: uiT("ui.cancel_19766ed6"), style: "cancel" }, { text: uiT("ui.delete_permanently_280b10c8"), style: "destructive", onPress: () => void runAction(async () => { await store.mutate({ action: "delete_page", pageId: target.id, expectedRevision: target.revision }); }) }])} /></View>)}
          </> : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </SafeAreaView>;
}

const EMPTY_PAGES: NotebookPage[] = [];
const PAGE_ICONS = ["📄", "📓", "📖", "文", "栞", "桜", "🌸", "📝", "💬", "🎧", "🎌", "💡", "⭐", "🍵", "🌱", "🎯"];
const PRESET_PAGE_ICONS: Record<string, IconName> = {
  "📄": "document-text-outline",
  "📓": "journal-outline",
  "📖": "book-outline",
  "文": "language-outline",
  "栞": "bookmark-outline",
  "桜": "flower-outline",
  "🌸": "flower-outline",
  "📝": "create-outline",
  "💬": "chatbubble-ellipses-outline",
  "🎧": "headset-outline",
  "🎌": "flag-outline",
  "💡": "bulb-outline",
  "⭐": "star-outline",
  "🍵": "cafe-outline",
  "🌱": "leaf-outline",
  "🎯": "locate-outline",
};

function IconButton({ icon, label, onPress, color, disabled = false }: { icon: IconName; label: string; onPress: () => void; color: string; disabled?: boolean }) {
  useInterfaceLanguage();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => ({ width: 44, minHeight: 44, justifyContent: "center", alignItems: "center", opacity: disabled ? 0.35 : pressed ? 0.5 : 1 })}><Ionicons name={icon} size={22} color={color} /></Pressable>;
}

function TextButton({ title, onPress }: { title: string; onPress: () => void }) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 40, justifyContent: "center" }}><Text style={{ fontSize: 14, fontWeight: "500", color: theme.primary }}>{title}</Text></Pressable>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  return <Text accessibilityRole="header" style={{ marginTop: 28, marginBottom: 7, fontSize: 13, fontWeight: "600", color: theme.textSecondary }}>{children}</Text>;
}

function ActionRow({ icon, emoji, title, onPress, disabled = false, destructive = false }: { icon?: IconName; emoji?: string; title: string; onPress: () => void; disabled?: boolean; destructive?: boolean }) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const color = destructive ? theme.error : theme.textColor;
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", gap: 14, alignItems: "center", minHeight: 54, opacity: disabled ? 0.4 : pressed ? 0.5 : 1 })}>{emoji ? <PageIcon value={emoji} size={24} /> : icon ? <Ionicons name={icon} size={23} color={color} /> : null}<Text numberOfLines={2} style={{ flex: 1, fontSize: 16, color }}>{title}</Text></Pressable>;
}

function PageIcon({ value, size }: { value: string; size: number }) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const presetIcon = !value ? "document-text-outline" : PRESET_PAGE_ICONS[value];
  if (presetIcon) return <Ionicons name={presetIcon} size={size} color={theme.textSecondary} style={{ width: size + 4, textAlign: "center" }} />;
  const isEmoji = /\p{Extended_Pictographic}/u.test(value);
  return <Text style={{ width: size + 4, textAlign: "center", fontSize: size, color: theme.textColor, fontFamily: Platform.OS === "ios" ? isEmoji ? "Apple Color Emoji" : "System" : undefined }}>{value}</Text>;
}

function EmptyState({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  return <View style={{ paddingVertical: 42, alignItems: "center", gap: 10 }}><Ionicons name={icon} size={34} color={theme.textLight} /><Text style={{ fontSize: 18, fontWeight: "600", color: theme.textColor, textAlign: "center" }}>{title}</Text><Text style={{ maxWidth: 280, fontSize: 15, lineHeight: 22, color: theme.textSecondary, textAlign: "center" }}>{description}</Text></View>;
}

const styles = StyleSheet.create({
  navigation: { minHeight: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  backButton: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 44, paddingRight: 8 },
  notice: { paddingHorizontal: 18, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
});
