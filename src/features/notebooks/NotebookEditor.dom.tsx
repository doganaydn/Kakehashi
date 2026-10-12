"use dom";
import { uiT, interfaceLocale, useInterfaceLanguage, useInterfaceLanguageStore } from "../interface-language/runtime";

import { Component, useCallback, useDeferredValue, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BlockNoteView } from '@blocknote/mantine';
import { en } from '@blocknote/core/locales';
import { filterSuggestionItems, insertOrUpdateBlockForSlashMenu } from '@blocknote/core/extensions';
import { getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote, type DefaultReactSuggestionItem, type FloatingUIOptions } from '@blocknote/react';
import { autoPlacement, offset, shift, size } from '@floating-ui/react-dom';
import { ArrowDown, ArrowUp, ArrowUpRight, Bold, BookOpen, Check, CheckSquare, ChevronDown, Code, Copy, FileText, Heading1, Heading2, Indent, Italic, Keyboard, Lightbulb, Link2, List, ListOrdered, MessageSquareText, Minus, Outdent, Pencil, Plus, Quote, Redo2, Search, Table2, Trash2, Type, Underline, Undo2, Volume2, X } from 'lucide-react';
import { toHiragana } from 'wanakana';
import type { NotebookBlock, NotebookSentence } from './model';
import type { NotebookEditorProps, NotebookEditorSubject, NotebookSentenceInput } from './editor-contract';
import type { NotebookDrawingPayload } from '../../../web/src/features/notebooks/handwriting';
import { isNotebookPaperColor, type NotebookPaperColor } from '../../../web/src/features/notebooks/paper-appearance';
import type { NativeInkStart } from './native-inline-contract';
import { MobileNotebookStudyContext, mobileNotebookSchema, SubjectCharacter, subjectLabel, subjectMeaning, subjectReading } from './mobile-editor-schema';
import { MobilePageIcon } from './mobile-page-icon';
import '@blocknote/mantine/style.css';
import './mobile-editor.css';

type Editor = typeof mobileNotebookSchema.BlockNoteEditor;
type PartialBlock = typeof mobileNotebookSchema.PartialBlock;
type Picker = { type: 'blocks' | 'format' | 'word' | 'page' | 'link' } | { type: 'sentence'; sentenceId?: string } | { type: 'preview'; subjectId: number };

const suggestionPosition: FloatingUIOptions = {
  useFloatingOptions: {
    strategy: 'fixed',
    middleware: [offset(8), autoPlacement({ allowedPlacements: ['top-start', 'bottom-start'], padding: { top: 8, bottom: 64, left: 12, right: 12 } }), shift({ padding: 12 }), size({ padding: { top: 8, bottom: 64, left: 12, right: 12 }, apply({ availableHeight, elements }) { elements.floating.style.maxHeight = `${Math.max(0, Math.min(280, availableHeight))}px`; } })],
  },
};

function isSafeLink(href: string) {
  if (!href || /[\u0000-\u0020\u007f\\]/.test(href)) return false;
  if (href.startsWith('/') && !href.startsWith('//')) return true;
  try { return ['https:', 'http:', 'mailto:'].includes(new URL(href).protocol); } catch { return false; }
}

function findSubjects(subjects: NotebookEditorSubject[], query: string, type = 'all') {
  const needle = query.trim().normalize('NFKC').toLocaleLowerCase();
  const kana = toHiragana(needle);
  return subjects.flatMap((subject) => {
    if (type !== 'all' && subject.object !== type && !(type === 'vocabulary' && subject.object === 'kana_vocabulary')) return [];
    const values = [subjectLabel(subject), ...subject.data.meanings.map((entry) => entry.meaning), ...(subject.data.auxiliary_meanings?.filter((entry) => entry.type === 'whitelist').map((entry) => entry.meaning) || []), ...(subject.data.readings?.map((entry) => entry.reading) || [])].map((value) => value.normalize('NFKC').toLocaleLowerCase());
    const exact = values.some((value) => value === needle || value === kana);
    return !needle || values.some((value) => value.includes(needle) || value.includes(kana)) ? [{ subject, score: exact ? 0 : 1 }] : [];
  }).sort((a, b) => a.score - b.score || (a.subject.data.level || 0) - (b.subject.data.level || 0)).slice(0, 50).map(({ subject }) => subject);
}

function insertBlock(editor: Editor, block: PartialBlock) {
  editor.focus();
  const cursor = editor.getTextCursorPosition();
  if (cursor.block.content === undefined) {
    const inserted = editor.insertBlocks([block, { type: 'paragraph' }], cursor.block, 'after');
    editor.setTextCursorPosition(inserted[1], 'start');
    return inserted[0];
  } else return insertOrUpdateBlockForSlashMenu(editor, block);
}

class EditorBoundary extends Component<{ children: ReactNode; onError?: NotebookEditorProps['onError'] }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(error: Error) { void this.props.onError?.(error.message); }
  render() { return this.state.error ? <div className="nb-load-error" role="alert"><BookOpen size={28} /><p>{uiT("ui.this_page_could_not_be_opened_d8caf126")}</p><p>{uiT("ui.return_to_your_notebooks_and_try_again_your_saved_page_is_unchang_bfe41de5")}</p></div> : this.props.children; }
}

export default function NotebookEditor(props: NotebookEditorProps) {
  useInterfaceLanguage();
  useLayoutEffect(() => { useInterfaceLanguageStore.getState().setLanguage(props.interfaceLanguage ?? "en"); }, [props.interfaceLanguage]);
  return <EditorBoundary key={props.pageId} onError={props.onError}><EditorContent {...props} /></EditorBoundary>;
}

function EditorContent(props: NotebookEditorProps) {
  useInterfaceLanguage();
  const { value, sentences, pages, subjects, theme, readOnly = false, title, icon, onTitleChange } = props;
  const actions = useRef(props);
  actions.current = props;
  const [draftTitle, setDraftTitle] = useState(title || '');
  const [picker, setPicker] = useState<Picker | null>(null);
  const [notice, setNotice] = useState('');
  const [styles, setStyles] = useState<Record<string, unknown>>({});
  const titleInput = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(true);
  const drawingBusy = useRef(false);
  const nativeStartBusy = useRef(false);
  const nativeSaveBusy = useRef(false);
  const [nativeStarting, setNativeStarting] = useState(false);
  const [nativeAutoStartBlockId, setNativeAutoStartBlockId] = useState<string | null>(null);
  const [nativeFullscreenBlockId, setNativeFullscreenBlockId] = useState<string | null>(null);
  const nativeEditing = !!props.nativeHandwritingState || nativeStarting || !!nativeAutoStartBlockId || !!nativeFullscreenBlockId;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const editor = useCreateBlockNote({
    schema: mobileNotebookSchema,
    initialContent: value.length ? value as PartialBlock[] : [{ type: 'paragraph' }],
    dictionary: { ...en, placeholders: { ...en.placeholders, default: 'Write something…' } },
    links: { isValidLink: isSafeLink, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } },
    domAttributes: { editor: { 'aria-label': 'Notebook page content', spellcheck: 'false', autocapitalize: 'sentences' } },
    pasteHandler: ({ event, defaultPasteHandler }) => {
      if (event.clipboardData?.files.length) {
        setNotice(uiT("ui.message_154d4bc84a86"));
        if (!event.clipboardData.getData('text/plain')) return true;
      }
      return defaultPasteHandler();
    },
  });

  // Native autosave echoes must never replace the document or Japanese composition.
  // A different page (or explicit conflict reload) remounts the outer boundary.
  useLayoutEffect(() => {
    document.documentElement.dataset.notebookTheme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.style.setProperty('--nb-bg', props.themeBackground || (theme === 'dark' ? '#1e1e1e' : '#ffffff'));
  }, [theme, props.themeBackground]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const updateViewport = () => {
      document.documentElement.style.setProperty('--nb-viewport-height', `${viewport?.height || window.innerHeight}px`);
      document.documentElement.style.setProperty('--nb-viewport-top', `${viewport?.offsetTop || 0}px`);
    };
    updateViewport();
    viewport?.addEventListener('resize', updateViewport);
    viewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);
    // Native may cover the WebView until this signal arrives; waiting for a
    // paint would depend on WebKit scheduling frames for an obscured view.
    void actions.current.onReady?.();
    return () => { viewport?.removeEventListener('resize', updateViewport); viewport?.removeEventListener('scroll', updateViewport); window.removeEventListener('resize', updateViewport); };
  }, []);

  useEffect(() => editor.onSelectionChange(() => setStyles(editor.getActiveStyles())), [editor]);
  useEffect(() => { const input = titleInput.current; if (input) { input.style.height = 'auto'; input.style.height = `${input.scrollHeight}px`; } }, [draftTitle]);

  const report = useCallback((caught: unknown) => setNotice(caught instanceof Error ? caught.message : 'This change could not be completed. Please try again.'), []);
  const addHandwriting = useCallback(() => {
    if (actions.current.readOnly || !actions.current.nativeHandwritingAvailable || actions.current.nativeHandwritingState || nativeStartBusy.current) return;
    setPicker(null);
    const inserted = insertBlock(editor, { type: 'handwriting', props: { drawingId: '', inkFormat: 'strokes-v1', width: 768, height: 384, paperColor: 'auto' } });
    setNativeAutoStartBlockId(inserted.id);
    editor.blur(); titleInput.current?.blur();
    void actions.current.onChange(editor.document as NotebookBlock[]).catch(report);
  }, [editor, report]);
  const editDrawing = useCallback(async (blockId: string, sourceId: string) => {
    if (drawingBusy.current || actions.current.readOnly || !actions.current.handwritingAvailable || !actions.current.onEditHandwriting) return;
    drawingBusy.current = true;
    setPicker(null);
    editor.blur(); titleInput.current?.blur();
    try {
      const saved = await actions.current.onEditHandwriting(sourceId);
      if (!saved || !mounted.current) return;
      const current = editor.getBlock(blockId);
      if (!current || current.type !== 'handwriting' || current.props.drawingId !== sourceId || current.props.inkFormat === 'strokes-v1') throw new Error('This block changed. Reopen Handwriting to recover your saved drawing.');
      editor.updateBlock(blockId, { type: 'handwriting', props: saved });
      await actions.current.onChange(editor.document as NotebookBlock[]);
      await actions.current.onHandwritingCommitted?.(saved.drawingId);
      if (mounted.current) setNotice('');
    } catch (error) { if (mounted.current) report(error); }
    finally { drawingBusy.current = false; }
  }, [editor, report]);
  const saveInlineDrawing = useCallback(async (blockId: string, sourceId: string, payload: NotebookDrawingPayload) => {
    const currentBlock = () => {
      const block = editor.getBlock(blockId);
      if (!mounted.current || actions.current.readOnly || !block || block.type !== 'handwriting' || block.props.inkFormat !== 'strokes-v1' || block.props.drawingId !== sourceId) throw new Error('This handwriting block changed. Reopen it to recover your draft.');
      return block;
    };
    try {
      currentBlock();
      const save = actions.current.onSaveInlineHandwriting;
      if (!save) throw new Error('Reopen this notebook to save your handwriting.');
      const saved = await save(blockId, sourceId, payload);
      currentBlock();
      editor.updateBlock(blockId, { type: 'handwriting', props: { ...saved, inkFormat: 'strokes-v1' } });
      await actions.current.onChange(editor.document as NotebookBlock[]);
      // A closed page or a deleted/replaced block must retain its recovery copy.
      const block = editor.getBlock(blockId);
      if (!mounted.current || !block || block.type !== 'handwriting' || block.props.drawingId !== saved.drawingId) return;
      await actions.current.onInlineHandwritingCommitted?.(blockId, saved.drawingId);
      if (mounted.current) setNotice('');
    } catch (caught) {
      // Replacing the asset remounts its canvas. Keep persistence failures
      // visible here so that canvas unmount cannot hide a failed commit.
      if (mounted.current) report(caught);
      throw caught;
    }
  }, [editor, report]);
  const startNativeDrawing = useCallback(async (input: NativeInkStart) => {
    const block = editor.getBlock(input.blockId);
    if (!mounted.current || actions.current.readOnly || nativeStartBusy.current || actions.current.nativeHandwritingState || !block || block.type !== 'handwriting' || block.props.drawingId !== input.drawingId) throw new Error('Finish the current handwriting area before opening another.');
    const start = actions.current.onNativeHandwritingStart;
    if (!start || !actions.current.nativeHandwritingAvailable) throw new Error('This build cannot open inline handwriting.');
    nativeStartBusy.current = true; setNativeStarting(true); setNativeAutoStartBlockId(null);
    try { await start(input); }
    catch (caught) { if (mounted.current) report(caught); throw caught; }
    finally { nativeStartBusy.current = false; if (mounted.current) setNativeStarting(false); }
  }, [editor, report]);
  const saveNativeDrawing = useCallback(async (blockId: string, sourceId: string) => {
    if (nativeSaveBusy.current) return;
    const currentBlock = () => {
      const block = editor.getBlock(blockId);
      if (!mounted.current || actions.current.readOnly || !block || block.type !== 'handwriting' || block.props.drawingId !== sourceId) throw new Error('This handwriting block changed. Its recovery copy has been kept.');
      return block;
    };
    nativeSaveBusy.current = true;
    try {
      currentBlock();
      const save = actions.current.onNativeHandwritingSave;
      if (!save) throw new Error('Reopen this notebook to save your handwriting.');
      const saved = await save(blockId, sourceId);
      const source = currentBlock();
      editor.updateBlock(blockId, { type: 'handwriting', props: { ...saved, inkFormat: saved.inkFormat ?? 'pencilkit-v1', paperColor: source.props.paperColor, previewFormat: saved.previewFormat ?? '' } });
      await actions.current.onChange(editor.document as NotebookBlock[]);
      const block = editor.getBlock(blockId);
      if (!mounted.current || !block || block.type !== 'handwriting' || block.props.drawingId !== saved.drawingId) return;
      await actions.current.onNativeHandwritingCommitted?.(blockId, saved.drawingId);
      if (mounted.current) setNotice('');
    } catch (caught) { if (mounted.current) report(caught); throw caught; }
    finally { nativeSaveBusy.current = false; }
  }, [editor, report]);
  const changePaperColor = useCallback(async (blockId: string, paperColor: NotebookPaperColor) => {
    const source = editor.getBlock(blockId);
    if (!mounted.current || actions.current.readOnly || nativeSaveBusy.current || !source || source.type !== 'handwriting' || !isNotebookPaperColor(paperColor)) throw new Error('This handwriting area cannot be changed right now.');
    try {
      if (actions.current.nativeHandwritingState?.blockId === blockId) {
        const update = actions.current.onNativeHandwritingPaperColor;
        if (!update) throw new Error('Reopen this notebook to change its paper color.');
        await update(blockId, paperColor);
      }
      const current = editor.getBlock(blockId);
      if (!mounted.current || !current || current.type !== 'handwriting' || current.props.drawingId !== source.props.drawingId) throw new Error('This handwriting block changed. Reopen it before changing paper color.');
      editor.updateBlock(blockId, { type: 'handwriting', props: { paperColor } });
      await actions.current.onChange(editor.document as NotebookBlock[]);
      if (mounted.current) setNotice('');
    } catch (caught) { if (mounted.current) report(caught); throw caught; }
  }, [editor, report]);
  const insertWord = useCallback((subject: NotebookEditorSubject, inline = false) => {
    editor.focus();
    const wordProps = { subjectId: subject.id, label: subjectLabel(subject) };
    if (inline) {
      const current = editor.getTextCursorPosition().block;
      if (current.content === undefined) editor.setTextCursorPosition(editor.insertBlocks([{ type: 'paragraph' }], current, 'after')[0], 'start');
      editor.insertInlineContent([{ type: 'vocabularyMention', props: wordProps }, ' ']);
    } else insertBlock(editor, { type: 'vocabulary', props: wordProps });
    setPicker(null);
  }, [editor]);
  const slashItems = useMemo<DefaultReactSuggestionItem[]>(() => [
    ...(props.nativeHandwritingAvailable ? [{ title: uiT("ui.handwriting_95a98bc8"), aliases: ['drawing', 'pencil', 'ink'], group: 'Study', icon: <Pencil size={18} />, onItemClick: addHandwriting }] : []),
    { title: uiT("ui.word_3a2860ec"), aliases: ['vocabulary', 'kanji', 'radical'], group: 'Study', icon: <BookOpen size={18} />, onItemClick: () => setPicker({ type: 'word' }) },
    { title: uiT("ui.sentence_e006e2f1"), aliases: ['example', 'context'], group: 'Study', icon: <MessageSquareText size={18} />, onItemClick: () => setPicker({ type: 'sentence' }) },
    { title: uiT("ui.page_link_58dc76eb"), aliases: ['page', 'note'], group: 'Study', icon: <FileText size={18} />, onItemClick: () => setPicker({ type: 'page' }) },
    { title: uiT("ui.callout_14bfdc0e"), aliases: ['tip', 'grammar'], group: 'Study', icon: <Lightbulb size={18} />, onItemClick: () => insertBlock(editor, { type: 'callout' }) },
    ...getDefaultReactSlashMenuItems(editor),
  ], [editor, addHandwriting, props.nativeHandwritingAvailable, interfaceLocale()]);
  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);
  const sentenceMap = useMemo(() => new Map(sentences.map((sentence) => [sentence.id, sentence])), [sentences]);
  const pageMap = useMemo(() => new Map(pages.map((page) => [page.id, page])), [pages]);
  const toggleStyle = (style: 'bold' | 'italic' | 'underline') => { editor.focus(); editor.toggleStyles({ [style]: true }); setStyles(editor.getActiveStyles()); };

  return <MobileNotebookStudyContext value={{ subjects: subjectMap, sentences: sentenceMap, pages: pageMap, readOnly, theme, themeBackground: props.themeBackground, onPaperColorChange: changePaperColor, nativeAutoStartBlockId, onNativeFullscreenChange: (blockId, fullscreen) => { if (mounted.current) setNativeFullscreenBlockId((current) => fullscreen ? blockId : current === blockId ? null : current); }, onNativePreparing: () => setNativeStarting(true), onNativePrepared: () => { if (mounted.current) { setNativeStarting(false); setNativeAutoStartBlockId(null); } }, nativeHandwriting: { nativeHandwritingAvailable: props.nativeHandwritingAvailable, nativeHandwritingState: props.nativeHandwritingState, onNativeHandwritingStart: startNativeDrawing, onNativeHandwritingLayout: props.onNativeHandwritingLayout, onNativeHandwritingCommand: props.onNativeHandwritingCommand, onNativeHandwritingResize: props.onNativeHandwritingResize, onNativeHandwritingClose: props.onNativeHandwritingClose }, saveNativeHandwriting: saveNativeDrawing, loadInlineHandwriting: props.inlineHandwritingAvailable ? props.onLoadInlineHandwriting : undefined, persistInlineHandwriting: props.inlineHandwritingAvailable ? props.onPersistInlineHandwriting : undefined, saveInlineHandwriting: props.inlineHandwritingAvailable ? saveInlineDrawing : undefined, loadHandwritingPreview: props.onLoadHandwritingPreview, onEditHandwriting: props.handwritingAvailable ? (blockId, drawingId) => { void editDrawing(blockId, drawingId); } : undefined, onPreviewSubject: (subjectId) => setPicker({ type: 'preview', subjectId }), onOpenPage: (pageId) => { void actions.current.onOpenPage(pageId).catch(report); }, onEditSentence: (sentenceId) => setPicker({ type: 'sentence', sentenceId }) }}>
    <div className="nb-mobile" data-native-handwriting={nativeEditing ? 'true' : undefined} onPointerDownCapture={(event) => { if (nativeEditing && event.target instanceof Element && !event.target.closest('.nb-native-handwriting')) { event.preventDefault(); event.stopPropagation(); } }} onKeyDownCapture={(event) => { if (nativeEditing && event.target instanceof Element && !event.target.closest('.nb-native-handwriting')) { event.preventDefault(); event.stopPropagation(); } }} onDropCapture={(event) => { if (event.dataTransfer.files.length) { event.preventDefault(); event.stopPropagation(); setNotice(uiT("ui.message_154d4bc84a86")); } }}>
      {notice ? <div className="nb-notice" role="status"><span>{notice}</span><button type="button" className="nb-icon-button" aria-label={uiT("ui.message_a17991767970")} onClick={() => setNotice('')}><X size={18} /></button></div> : null}
      <main className="nb-scroll">
        {title !== undefined ? <div className="nb-page-heading">{icon ? <span className="nb-page-icon" aria-hidden><MobilePageIcon icon={icon} size={42} /></span> : null}<textarea ref={titleInput} className="nb-title" aria-label={uiT("ui.message_02660ffe391c")} value={draftTitle} rows={1} placeholder={uiT("ui.untitled_f59ab8d1")} maxLength={240} readOnly={readOnly || nativeEditing || !onTitleChange} onChange={(event) => { const next = event.target.value.replace(/\n/g, ''); setDraftTitle(next); void actions.current.onTitleChange?.(next).catch(report); }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); editor.focus(); editor.setTextCursorPosition(editor.document[0], 'start'); } }} /></div> : null}
        <BlockNoteView editor={editor} theme={theme} editable={!readOnly} formattingToolbar={false} sideMenu={false} slashMenu={false} filePanel={false} onChange={() => { void actions.current.onChange(editor.document as NotebookBlock[]).catch(report); }}>
          <SuggestionMenuController triggerCharacter="/" floatingUIOptions={suggestionPosition} getItems={async (query) => filterSuggestionItems(slashItems, query)} />
          <SuggestionMenuController triggerCharacter="@" floatingUIOptions={suggestionPosition} minQueryLength={1} getItems={async (query) => findSubjects(subjects, query).slice(0, 15).map((subject) => ({ title: subjectLabel(subject), subtext: [subjectReading(subject), subjectMeaning(subject)].filter(Boolean).join(' · '), icon: <BookOpen size={17} />, onItemClick: () => insertWord(subject, true) }))} />
        </BlockNoteView>
      </main>
      {!readOnly ? <div className="nb-toolbar" role="toolbar" aria-label={uiT("ui.message_416e466c88b7")}>
        <button type="button" className="nb-tool nb-add-tool" aria-label={uiT("ui.message_cf416ab8da83")} onMouseDown={(event) => event.preventDefault()} onClick={() => setPicker({ type: 'blocks' })}><Plus size={23} /></button>
        <div className="nb-toolbar-scroll">
          {props.nativeHandwritingAvailable ? <button type="button" className="nb-tool" aria-label={uiT("ui.message_32d6d35232de")} onMouseDown={(event) => event.preventDefault()} onClick={addHandwriting}><Pencil size={20} /></button> : null}
          <button type="button" className="nb-tool" aria-label={uiT("ui.message_8a929f303859")} onMouseDown={(event) => event.preventDefault()} onClick={() => setPicker({ type: 'format' })}><span className="nb-aa">{uiT("ui.aa_81acaafb")}</span><ChevronDown size={12} /></button>
          <button type="button" className="nb-tool" aria-label={uiT("ui.bold_94fee62e")} aria-pressed={Boolean(styles.bold)} onMouseDown={(event) => event.preventDefault()} onClick={() => toggleStyle('bold')}><Bold size={20} /></button>
          <button type="button" className="nb-tool" aria-label={uiT("ui.italic_9bf37cb5")} aria-pressed={Boolean(styles.italic)} onMouseDown={(event) => event.preventDefault()} onClick={() => toggleStyle('italic')}><Italic size={20} /></button>
          <button type="button" className="nb-tool" aria-label={uiT("ui.underline_02f84326")} aria-pressed={Boolean(styles.underline)} onMouseDown={(event) => event.preventDefault()} onClick={() => toggleStyle('underline')}><Underline size={20} /></button>
          <button type="button" className="nb-tool" aria-label={uiT("ui.message_386111dde618")} onMouseDown={(event) => event.preventDefault()} onClick={() => insertBlock(editor, { type: 'checkListItem' })}><CheckSquare size={20} /></button>
          <button type="button" className="nb-tool" aria-label={uiT("ui.message_b1109578faef")} onMouseDown={(event) => event.preventDefault()} onClick={() => setPicker({ type: 'link' })}><Link2 size={20} /></button>
          <button type="button" className="nb-tool" aria-label={uiT("ui.undo_a8283ade")} onMouseDown={(event) => event.preventDefault()} onClick={() => { editor.focus(); editor.undo(); }}><Undo2 size={20} /></button>
          <button type="button" className="nb-tool" aria-label={uiT("ui.message_74273989b096")} onMouseDown={(event) => event.preventDefault()} onClick={() => { editor.focus(); editor.redo(); }}><Redo2 size={20} /></button>
        </div>
        <button type="button" className="nb-tool nb-keyboard-tool" aria-label={uiT("ui.message_7f4e2e1d11a4")} onClick={() => { editor.blur(); titleInput.current?.blur(); }}><Keyboard size={21} /><ChevronDown size={11} /></button>
      </div> : null}
    </div>
    {picker ? <EditorPicker key={`${picker.type}-${picker.type === 'sentence' ? picker.sentenceId || 'new' : picker.type === 'preview' ? picker.subjectId : ''}`} picker={picker} editor={editor} subjects={subjects} sentences={sentences} pages={pages} onClose={() => setPicker(null)} onWord={insertWord} onSentence={(sentence) => { insertBlock(editor, { type: 'sentence', props: { sentenceId: sentence.id } }); setPicker(null); }} onSaveSentence={(input) => actions.current.onSaveSentence(input)} onOpenSubject={(id) => actions.current.onOpenSubject(id)} onPickerChange={setPicker} onHandwriting={props.nativeHandwritingAvailable ? addHandwriting : undefined} /> : null}
  </MobileNotebookStudyContext>;
}

function EditorPicker({ picker, editor, subjects, sentences, pages, onClose, onWord, onSentence, onSaveSentence, onOpenSubject, onPickerChange, onHandwriting }: {
  picker: Picker; editor: Editor; subjects: NotebookEditorSubject[]; sentences: NotebookSentence[]; pages: NotebookEditorProps['pages']; onClose: () => void; onWord: (subject: NotebookEditorSubject, inline?: boolean) => void; onSentence: (sentence: NotebookSentence) => void; onSaveSentence: (input: NotebookSentenceInput) => Promise<NotebookSentence>; onOpenSubject: (id: number) => Promise<void>; onPickerChange: (picker: Picker) => void; onHandwriting?: () => void;
}) {
  useInterfaceLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [selectedSentence] = useState(() => picker.type === 'sentence' && picker.sentenceId ? sentences.find((entry) => entry.id === picker.sentenceId) : undefined);
  const [query, setQuery] = useState('');
  const [wordType, setWordType] = useState('all');
  const [inline, setInline] = useState(false);
  const [writeSentence, setWriteSentence] = useState(Boolean(selectedSentence));
  const [japanese, setJapanese] = useState(selectedSentence?.japanese || '');
  const [kana, setKana] = useState(selectedSentence?.kana || '');
  const [english, setEnglish] = useState(selectedSentence?.english || '');
  const [subjectIds, setSubjectIds] = useState(selectedSentence?.subjectIds || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [href, setHref] = useState(editor.getSelectedLinkUrl() || '');
  const [linkText, setLinkText] = useState(editor.getSelectedText());
  const audio = useRef<HTMLAudioElement | null>(null);
  const deferredQuery = useDeferredValue(query);
  const words = useMemo(() => findSubjects(subjects, deferredQuery, wordType), [subjects, deferredQuery, wordType]);
  const queryText = deferredQuery.trim().toLocaleLowerCase();
  const sentenceResults = useMemo(() => sentences.filter((entry) => !queryText || [entry.japanese, entry.kana, entry.english].some((text) => text.toLocaleLowerCase().includes(queryText))).slice(0, 40), [sentences, queryText]);
  const builtInResults = useMemo(() => {
    if (!queryText || picker.type !== 'sentence' || writeSentence) return [];
    const result: { subject: NotebookEditorSubject; japanese: string; english: string }[] = [];
    const seen = new Set(sentences.map((entry) => entry.japanese));
    const matchingIds = new Set(words.map((entry) => entry.id));
    for (const subject of subjects) for (const sentence of subject.data.context_sentences || []) {
      if (seen.has(sentence.ja) || !(matchingIds.has(subject.id) || sentence.ja.includes(queryText) || sentence.en.toLocaleLowerCase().includes(queryText))) continue;
      seen.add(sentence.ja); result.push({ subject, japanese: sentence.ja, english: sentence.en });
      if (result.length >= 25) return result;
    }
    return result;
  }, [subjects, sentences, words, queryText, picker.type, writeSentence]);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => { element?.close(); audio.current?.pause(); }; }, []);
  const add = (block: PartialBlock) => { dialog.current?.close(); insertBlock(editor, block); onClose(); };
  const changeType = (block: PartialBlock) => {
    dialog.current?.close();
    editor.focus();
    const current = editor.getTextCursorPosition().block;
    if (current.content !== undefined && Array.isArray(current.content) && block.type !== 'table') editor.updateBlock(current, block);
    else insertBlock(editor, block);
    onClose();
  };
  const saveSentence = async (input: NotebookSentenceInput) => {
    if (saving) return;
    setSaving(true); setError('');
    try { const saved = await onSaveSentence(input); if (selectedSentence) onClose(); else { dialog.current?.close(); onSentence(saved); } }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'The sentence could not be saved. Try again.'); setSaving(false); }
  };
  const blockOptions: { label: string; icon: ReactNode; block: PartialBlock }[] = [
    { label: uiT("ui.text_71988c4d"), icon: <Type size={20} />, block: { type: 'paragraph' } },
    { label: uiT("ui.heading_1_d95e9370"), icon: <Heading1 size={20} />, block: { type: 'heading', props: { level: 1 } } },
    { label: uiT("ui.heading_2_3291955e"), icon: <Heading2 size={20} />, block: { type: 'heading', props: { level: 2 } } },
    { label: uiT("ui.to_do_list_73f58c5e"), icon: <CheckSquare size={20} />, block: { type: 'checkListItem' } },
    { label: uiT("ui.bulleted_list_ce51b395"), icon: <List size={20} />, block: { type: 'bulletListItem' } },
    { label: uiT("ui.numbered_list_cc62f6c7"), icon: <ListOrdered size={20} />, block: { type: 'numberedListItem' } },
    { label: uiT("ui.toggle_list_8315f8ea"), icon: <ChevronDown size={20} />, block: { type: 'toggleListItem' } },
    { label: uiT("ui.quote_eb4cdebd"), icon: <Quote size={20} />, block: { type: 'quote' } },
    { label: uiT("ui.callout_14bfdc0e"), icon: <Lightbulb size={20} />, block: { type: 'callout' } },
    { label: uiT("ui.divider_cc29053f"), icon: <Minus size={20} />, block: { type: 'divider' } },
    { label: uiT("ui.code_340f4630"), icon: <Code size={20} />, block: { type: 'codeBlock' } },
    { label: uiT("ui.table_16d1c905"), icon: <Table2 size={20} />, block: { type: 'table', content: { type: 'tableContent', rows: [{ cells: [[], []] }, { cells: [[], []] }] } } },
  ];
  const preview = picker.type === 'preview' ? subjects.find((entry) => entry.id === picker.subjectId) : undefined;
  const title = picker.type === 'blocks' ? 'Add a block' : picker.type === 'format' ? 'Text style' : picker.type === 'word' ? 'Link a word' : picker.type === 'page' ? 'Link a page' : picker.type === 'sentence' ? selectedSentence ? 'Edit sentence' : 'Add a sentence' : picker.type === 'link' ? 'Add a link' : preview ? subjectLabel(preview) : 'Word details';
  return <dialog ref={dialog} className="nb-sheet" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }} onClick={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <header className="nb-sheet-header"><h2 id={titleId}>{title}</h2><button className="nb-icon-button" type="button" disabled={saving} aria-label={uiT("ui.close_7d9eb7ac")} onClick={onClose}><X size={21} /></button></header>
    <div className="nb-sheet-body">
      {picker.type === 'blocks' || picker.type === 'format' ? <>
        {picker.type === 'blocks' ? <div className="nb-study-options">{[{ type: 'word' as const, label: uiT("ui.word_3a2860ec"), icon: <BookOpen size={21} /> }, { type: 'sentence' as const, label: uiT("ui.sentence_e006e2f1"), icon: <MessageSquareText size={21} /> }, { type: 'page' as const, label: uiT("ui.page_link_58dc76eb"), icon: <FileText size={21} /> }].map((item) => <button key={item.type} type="button" onClick={() => onPickerChange({ type: item.type })}>{item.icon}<span>{item.label}</span></button>)}</div> : null}
        <div className="nb-block-options">{picker.type === 'blocks' && onHandwriting ? <button type="button" onClick={() => { dialog.current?.close(); onHandwriting(); }}><Pencil size={20} /><span>{uiT("ui.handwriting_95a98bc8")}</span></button> : null}{blockOptions.map((item) => <button key={item.label} type="button" onClick={() => picker.type === 'format' ? changeType(item.block) : add(item.block)}>{item.icon}<span>{item.label}</span></button>)}</div>
        {picker.type === 'format' ? <div className="nb-block-options nb-block-actions">
          <button type="button" onClick={() => { dialog.current?.close(); editor.focus(); editor.moveBlocksUp(); onClose(); }}><ArrowUp size={20} />{uiT("ui.move_up_c66feb5e")}</button>
          <button type="button" onClick={() => { dialog.current?.close(); editor.focus(); editor.moveBlocksDown(); onClose(); }}><ArrowDown size={20} />{uiT("ui.move_down_40bb50da")}</button>
          <button type="button" disabled={!editor.canNestBlock()} onClick={() => { dialog.current?.close(); editor.focus(); editor.nestBlock(); onClose(); }}><Indent size={20} />{uiT("ui.indent_7cfcf052")}</button>
          <button type="button" disabled={!editor.canUnnestBlock()} onClick={() => { dialog.current?.close(); editor.focus(); editor.unnestBlock(); onClose(); }}><Outdent size={20} />{uiT("ui.unindent_88951633")}</button>
          <button type="button" onClick={() => { dialog.current?.close(); editor.focus(); const current = editor.getTextCursorPosition().block; const withoutIds = (block: typeof current): PartialBlock => { const { id: _id, children, ...rest } = block; return { ...rest, children: children.map(withoutIds) } as PartialBlock; }; editor.insertBlocks([withoutIds(current)], current, 'after'); onClose(); }}><Copy size={20} />{uiT("ui.duplicate_02cdaabf")}</button>
          <button type="button" className="nb-delete-block" onClick={() => { dialog.current?.close(); editor.focus(); editor.removeBlocks([editor.getTextCursorPosition().block]); onClose(); }}><Trash2 size={20} />{uiT("ui.delete_block_e980a9c5")}</button>
        </div> : null}
      </> : null}
      {picker.type === 'word' ? <>
        <SearchField value={query} onChange={setQuery} label={uiT("ui.search_vocabulary_kanji_or_radicals_ed516f3a")} />
        <div className="nb-tabs" role="tablist" aria-label={uiT("ui.message_fcdbeaa8542a")}>{[['all', 'All'], ['vocabulary', 'Words'], ['kanji', 'Kanji'], ['radical', 'Radicals']].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={wordType === key} onClick={() => setWordType(key)}>{label}</button>)}</div>
        <label className="nb-inline-choice"><input type="checkbox" checked={inline} onChange={(event) => setInline(event.target.checked)} />{uiT("ui.insert_inline_in_the_text_709b1235")}</label>
        <div className="nb-results">{words.map((subject) => <SubjectRow key={subject.id} subject={subject} onClick={() => { dialog.current?.close(); onWord(subject, inline); }} />)}{!words.length ? <p className="nb-empty">{uiT("ui.no_words_found_try_japanese_a_reading_or_a_meaning_d0506917")}</p> : null}</div>
      </> : null}
      {picker.type === 'page' ? <><SearchField value={query} onChange={setQuery} label={uiT("ui.search_pages_fe57215e")} /><div className="nb-results">{pages.filter((page) => !queryText || page.title.toLocaleLowerCase().includes(queryText)).map((page) => <button type="button" className="nb-result" key={page.id} onClick={() => add({ type: 'pageLink', props: { pageId: page.id } })}><MobilePageIcon icon={page.icon} /><span>{page.title || 'Untitled'}</span></button>)}{!pages.length ? <p className="nb-empty">{uiT("ui.create_another_page_to_link_it_here_65fae411")}</p> : null}</div></> : null}
      {picker.type === 'sentence' ? <>
        {!selectedSentence ? <div className="nb-tabs" role="tablist" aria-label={uiT("ui.message_d3e17f422c8e")}><button type="button" role="tab" aria-selected={!writeSentence} disabled={saving} onClick={() => setWriteSentence(false)}>{uiT("ui.your_sentences_ffc3471b")}</button><button type="button" role="tab" aria-selected={writeSentence} disabled={saving} onClick={() => setWriteSentence(true)}>{uiT("ui.write_a_sentence_fb0e7364")}</button></div> : null}
        {writeSentence ? <form className="nb-form" onSubmit={(event) => { event.preventDefault(); void saveSentence({ ...(selectedSentence ? { id: selectedSentence.id, revision: selectedSentence.revision } : {}), japanese: japanese.trim(), kana: kana.trim(), english: english.trim(), subjectIds }); }}>
          <label>{uiT("ui.japanese_be4ee906")}<textarea required maxLength={2000} rows={3} value={japanese} lang="ja" onChange={(event) => setJapanese(event.target.value)} placeholder="日本語の例文" disabled={saving} /></label>
          <label>{uiT("ui.reading_463816d0")} <span className="nb-optional">{uiT("ui.optional_0059798b")}</span><input maxLength={2000} value={kana} lang="ja" onChange={(event) => setKana(event.target.value)} disabled={saving} /></label>
          <label>{uiT("ui.translation_6fbd766b")} <span className="nb-optional">{uiT("ui.optional_0059798b")}</span><textarea maxLength={4000} rows={2} value={english} onChange={(event) => setEnglish(event.target.value)} disabled={saving} /></label>
          <fieldset className="nb-linked-words"><legend>{uiT("ui.linked_vocabulary_da28fe3f")}</legend>{subjectIds.length ? <div className="nb-selected-words">{subjectIds.map((id) => <button key={id} type="button" disabled={saving} aria-label={`Remove ${subjects.find((entry) => entry.id === id) ? subjectLabel(subjects.find((entry) => entry.id === id)!) : id}`} onClick={() => setSubjectIds((current) => current.filter((value) => value !== id))}>{subjects.find((entry) => entry.id === id) ? subjectLabel(subjects.find((entry) => entry.id === id)!) : `Subject ${id}`}<X size={14} /></button>)}</div> : null}<SearchField value={query} onChange={setQuery} label={uiT("ui.search_words_to_link_a584695e")} />{query.trim() ? <div className="nb-linked-word-results">{words.slice(0, 12).map((subject) => <SubjectRow key={subject.id} subject={subject} selected={subjectIds.includes(subject.id)} onClick={() => setSubjectIds((current) => current.includes(subject.id) ? current.filter((id) => id !== subject.id) : current.length < 64 ? [...current, subject.id] : current)} />)}</div> : null}</fieldset>
          {error ? <p className="nb-error" role="alert">{error}</p> : null}<button className="nb-primary-button" type="submit" disabled={saving || !japanese.trim()}>{saving ? 'Saving…' : selectedSentence ? 'Save sentence' : 'Add sentence'}</button>
        </form> : <><SearchField value={query} onChange={setQuery} label={uiT("ui.search_sentences_or_vocabulary_8d8a6379")} /><div className="nb-results">{sentenceResults.map((sentence) => <button key={sentence.id} type="button" className="nb-sentence-result" disabled={saving} onClick={() => { dialog.current?.close(); onSentence(sentence); }}><span lang="ja">{sentence.japanese}</span>{sentence.english ? <span>{sentence.english}</span> : null}</button>)}{builtInResults.map((entry) => <button key={`${entry.subject.id}-${entry.japanese}`} type="button" className="nb-sentence-result" disabled={saving} onClick={() => { void saveSentence({ japanese: entry.japanese, kana: '', english: entry.english, subjectIds: [entry.subject.id] }); }}><span lang="ja">{entry.japanese}</span><span>{entry.english}</span><span className="nb-optional">{uiT("ui.from_21819769")} {subjectLabel(entry.subject)}</span></button>)}{!sentenceResults.length && !builtInResults.length ? <p className="nb-empty">{queryText ? 'No sentences found. Try a word or write an example.' : 'Your linked sentences will appear here. Search vocabulary for examples, or write your own.'}</p> : null}</div>{error ? <p className="nb-error" role="alert">{error}</p> : null}</>}
      </> : null}
      {picker.type === 'link' ? <form className="nb-form" onSubmit={(event) => { event.preventDefault(); const url = /^https?:\/\//i.test(href) || /^(mailto:|\/)/.test(href) ? href.trim() : `https://${href.trim()}`; if (!isSafeLink(url)) { setError(uiT("ui.message_4426622a47c0")); return; } dialog.current?.close(); editor.focus(); editor.createLink(url, linkText || url); onClose(); }}><label>{uiT("ui.link_a6a32dbc")}<input type="text" inputMode="url" value={href} onChange={(event) => setHref(event.target.value)} placeholder="https://" required autoCapitalize="none" autoCorrect="off" /></label><label>{uiT("ui.text_71988c4d")}<input value={linkText} onChange={(event) => setLinkText(event.target.value)} placeholder={uiT("ui.link_text_ac1b459e")} /></label>{error ? <p className="nb-error" role="alert">{error}</p> : null}<button type="submit" className="nb-primary-button">{uiT("ui.add_link_dfe9ca4d")}</button></form> : null}
      {picker.type === 'preview' ? preview ? <div className="nb-subject-preview"><div className="nb-preview-character" data-kind={preview.object}><SubjectCharacter subject={preview} label={subjectLabel(preview)} />{preview.data.pronunciation_audios?.[0]?.url ? <button type="button" className="nb-icon-button" aria-label={uiT("ui.message_2ac7a19213b9")} onClick={() => { const url = preview.data.pronunciation_audios![0].url; audio.current?.pause(); audio.current = new Audio(url); void audio.current.play().catch(() => setError(uiT("ui.message_681bc7698792"))); }}><Volume2 size={22} /></button> : null}</div><dl>{subjectReading(preview) ? <div><dt>{uiT("ui.reading_463816d0")}</dt><dd lang="ja">{subjectReading(preview)}</dd></div> : null}<div><dt>{uiT("ui.meaning_1f5d64b9")}</dt><dd>{subjectMeaning(preview)}</dd></div><div><dt>{uiT("ui.level_1709305c")}</dt><dd>{preview.data.level || '—'}</dd></div></dl>{error ? <p className="nb-error" role="alert">{error}</p> : null}<button className="nb-primary-button" type="button" onClick={() => { void onOpenSubject(preview.id).then(onClose).catch((caught) => setError(caught instanceof Error ? caught.message : 'This word could not be opened.')); }}>{uiT("ui.open_word_details_5fe01af8")} <ArrowUpRight size={18} /></button></div> : <div className="nb-empty"><p>{uiT("ui.this_word_is_not_in_the_downloaded_library_8deebe42")}</p><button type="button" className="nb-primary-button" onClick={() => { void onOpenSubject(picker.subjectId).then(onClose).catch(() => setError(uiT("ui.message_68b297f4f5cf"))); }}>{uiT("ui.open_word_details_5fe01af8")}</button>{error ? <p className="nb-error" role="alert">{error}</p> : null}</div> : null}
    </div>
  </dialog>;
}

function SearchField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  useInterfaceLanguage();
  return <div className="nb-search"><Search size={18} aria-hidden /><input type="search" aria-label={label} placeholder={label} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="off" autoCapitalize="none" autoCorrect="off" /></div>;
}
function SubjectRow({ subject, onClick, selected }: { subject: NotebookEditorSubject; onClick: () => void; selected?: boolean }) {
  useInterfaceLanguage();
  return <button type="button" className="nb-result nb-subject-result" data-kind={subject.object} onClick={onClick} aria-pressed={selected}><span className="nb-result-character"><SubjectCharacter subject={subject} label={subjectLabel(subject)} /></span><span className="nb-result-description"><span>{subjectMeaning(subject)}</span>{subjectReading(subject) ? <span lang="ja">{subjectReading(subject)}</span> : null}</span>{selected ? <Check size={18} /> : <span className="nb-result-level">{subject.data.level ? `Lv ${subject.data.level}` : ''}</span>}</button>;
}
