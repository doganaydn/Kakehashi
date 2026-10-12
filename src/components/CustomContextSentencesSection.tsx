import { uiT, useInterfaceLanguage } from "../features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  deleteCustomContextSentence,
  getCustomContextSentencesForSubject,
  updateCustomContextSentence,
  upsertCustomContextSentence,
} from "../services/customContextSentenceService";
import type {
  CustomContextSentence,
  CustomContextSentenceDisplayMode,
} from "../types/customContextSentence";
import { azureSpeechService } from "../utils/azureSpeech";
import { azureTranslatorService } from "../utils/azureTranslator";
import { tryBlankContextSentence } from "../utils/contextSentenceCloze";
import { getReadableTextColor, withAlpha } from "../utils/subjectColors";
import { useAuthStore, useSettingsStore } from "../utils/store";
import { useTheme } from "../utils/theme";

const TRANSLATION_DEBOUNCE_MS = 650;
const ICON_HIT_SLOP = { top: 4, right: 4, bottom: 4, left: 4 };

type ManuallyEditedField = "japanese" | "english" | null;

export interface CustomContextSentencesSectionProps {
  subjectId: number;
  subjectCharacters: string;
  subjectReadings: readonly string[];
  accentColor?: string;
}

export interface CustomContextSentencesSectionHandle {
  openNewEditor: () => void;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

function hasNonAbortFailure(
  results: readonly PromiseSettledResult<string>[],
): boolean {
  return results.some(
    (result) => result.status === "rejected" && !isAbortError(result.reason),
  );
}

export const CustomContextSentencesSection = React.forwardRef<
  CustomContextSentencesSectionHandle,
  CustomContextSentencesSectionProps
>(function CustomContextSentencesSection(
  { subjectId, subjectCharacters, subjectReadings, accentColor },
  ref,
) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const userId = useAuthStore((state) => state.userData?.id ?? null);
  const hideTranslationsCompletely = useSettingsStore(
    (state) => state.hideContextSentenceTranslationsCompletely,
  );
  const resolvedAccentColor = accentColor ?? theme.primary;
  const accentTextColor = getReadableTextColor(resolvedAccentColor);

  const [sentences, setSentences] = useState<CustomContextSentence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftJapanese, setDraftJapanese] = useState("");
  const [draftKana, setDraftKana] = useState("");
  const [draftEnglish, setDraftEnglish] = useState("");
  const [draftDisplayMode, setDraftDisplayMode] =
    useState<CustomContextSentenceDisplayMode>("kanji");
  const [lastEditedField, setLastEditedField] =
    useState<ManuallyEditedField>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const translationGenerationRef = useRef(0);
  const translationAbortRef = useRef<AbortController | null>(null);
  const playbackGenerationRef = useRef(0);

  const japaneseVocabularyForms = useMemo(
    () =>
      subjectCharacters.trim().length > 0 ? [subjectCharacters.trim()] : [],
    [subjectCharacters],
  );
  const kanaVocabularyForms = useMemo(
    () =>
      Array.from(
        new Set(subjectReadings.map((value) => value.trim()).filter(Boolean)),
      ),
    [subjectReadings],
  );

  const japaneseDraftMatchesSubject =
    draftJapanese.trim().length > 0 &&
    tryBlankContextSentence(draftJapanese, japaneseVocabularyForms) !== null;
  const kanaDraftMatchesSubject =
    draftKana.trim().length > 0 &&
    tryBlankContextSentence(
      draftKana,
      kanaVocabularyForms.length > 0
        ? kanaVocabularyForms
        : japaneseVocabularyForms,
      { allowShortKanaConjugation: japaneseDraftMatchesSubject },
    ) !== null;
  const completeDraftMatchesSubject =
    japaneseDraftMatchesSubject && kanaDraftMatchesSubject;
  const hasCompleteDraft = Boolean(
    draftJapanese.trim() && draftKana.trim() && draftEnglish.trim(),
  );
  const canSave = Boolean(
    userId &&
      hasCompleteDraft &&
      completeDraftMatchesSubject &&
      !isTranslating &&
      !isSaving,
  );

  const cancelTranslations = useCallback(() => {
    translationGenerationRef.current += 1;
    translationAbortRef.current?.abort();
    translationAbortRef.current = null;
    if (mountedRef.current) {
      setIsTranslating(false);
    }
  }, []);

  const stopPlayback = useCallback(async () => {
    playbackGenerationRef.current += 1;
    if (mountedRef.current) {
      setPlayingId(null);
    }
    await azureSpeechService.stop();
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      translationGenerationRef.current += 1;
      translationAbortRef.current?.abort();
      translationAbortRef.current = null;
      playbackGenerationRef.current += 1;
      void azureSpeechService.stop();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setSentences([]);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setSectionError(null);

    void getCustomContextSentencesForSubject(userId, subjectId)
      .then((storedSentences) => {
        if (!cancelled) {
          setSentences(storedSentences);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSectionError(uiT("ui.message_c9d84a7db327"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [subjectId, userId]);

  const translationSourceText =
    lastEditedField === "japanese"
      ? draftJapanese
      : lastEditedField === "english"
        ? draftEnglish
        : "";

  useEffect(() => {
    if (!editorVisible || !lastEditedField || !translationSourceText.trim()) {
      return;
    }

    const requestGeneration = translationGenerationRef.current;
    let controller: AbortController | null = null;

    const timeout = setTimeout(() => {
      controller = new AbortController();
      translationAbortRef.current = controller;
      setIsTranslating(true);
      setTranslationError(null);

      const isCurrentRequest = () =>
        mountedRef.current &&
        !controller?.signal.aborted &&
        translationGenerationRef.current === requestGeneration;

      const showTranslationFailure = () => {
        if (isCurrentRequest()) {
          setTranslationError(
            uiT("ui.message_b3887b330bc6"),
          );
        }
      };

      const synchronizeDraft = async () => {
        const sourceText = translationSourceText.trim();

        if (lastEditedField === "japanese") {
          const results = await Promise.allSettled([
            azureTranslatorService.translate(sourceText, "ja", "en", {
              signal: controller?.signal,
            }),
            azureTranslatorService.transliterateJapaneseToKana(sourceText, {
              signal: controller?.signal,
            }),
          ]);

          if (!isCurrentRequest()) {
            return;
          }

          const [englishResult, kanaResult] = results;
          if (englishResult.status === "fulfilled") {
            setDraftEnglish(englishResult.value);
          }
          if (kanaResult.status === "fulfilled") {
            setDraftKana(kanaResult.value);
          }
          if (hasNonAbortFailure(results)) {
            showTranslationFailure();
          }
          return;
        }

        try {
          const japanese = await azureTranslatorService.translate(
            sourceText,
            "en",
            "ja",
            { signal: controller?.signal },
          );
          if (!isCurrentRequest()) {
            return;
          }
          setDraftJapanese(japanese);

          const kana = await azureTranslatorService.transliterateJapaneseToKana(
            japanese,
            { signal: controller?.signal },
          );
          if (isCurrentRequest()) {
            setDraftKana(kana);
          }
        } catch (error) {
          if (!isAbortError(error)) {
            showTranslationFailure();
          }
        }
      };

      void synchronizeDraft().finally(() => {
        if (isCurrentRequest()) {
          setIsTranslating(false);
          translationAbortRef.current = null;
        }
      });
    }, TRANSLATION_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      translationGenerationRef.current += 1;
      controller?.abort();
      if (translationAbortRef.current === controller) {
        translationAbortRef.current = null;
      }
    };
  }, [editorVisible, lastEditedField, translationSourceText]);

  const resetEditor = useCallback(() => {
    setEditingId(null);
    setDraftJapanese("");
    setDraftKana("");
    setDraftEnglish("");
    setDraftDisplayMode("kanji");
    setLastEditedField(null);
    setTranslationError(null);
    setEditorError(null);
    setIsSaving(false);
  }, []);

  const openNewEditor = useCallback(() => {
    cancelTranslations();
    void stopPlayback();
    resetEditor();
    setEditorVisible(true);
  }, [cancelTranslations, resetEditor, stopPlayback]);

  useImperativeHandle(ref, () => ({ openNewEditor }), [openNewEditor]);

  const openEditEditor = useCallback(
    (sentence: CustomContextSentence) => {
      cancelTranslations();
      void stopPlayback();
      setEditingId(sentence.id);
      setDraftJapanese(sentence.japanese);
      setDraftKana(sentence.kana);
      setDraftEnglish(sentence.english);
      setDraftDisplayMode(sentence.displayMode);
      setLastEditedField(null);
      setTranslationError(null);
      setEditorError(null);
      setIsSaving(false);
      setEditorVisible(true);
    },
    [cancelTranslations, stopPlayback],
  );

  const closeEditor = useCallback(() => {
    if (isSaving) {
      return;
    }
    cancelTranslations();
    void stopPlayback();
    setEditorVisible(false);
    resetEditor();
  }, [cancelTranslations, isSaving, resetEditor, stopPlayback]);

  const handleManualJapaneseChange = useCallback(
    (value: string) => {
      cancelTranslations();
      setTranslationError(null);
      setEditorError(null);
      setDraftJapanese(value);
      setLastEditedField("japanese");
    },
    [cancelTranslations],
  );

  const handleManualEnglishChange = useCallback(
    (value: string) => {
      cancelTranslations();
      setTranslationError(null);
      setEditorError(null);
      setDraftEnglish(value);
      setLastEditedField("english");
    },
    [cancelTranslations],
  );

  const handlePlay = useCallback(
    async (text: string, id: string) => {
      const normalizedText = text.trim();
      if (!normalizedText) {
        return;
      }

      const playbackGeneration = playbackGenerationRef.current + 1;
      playbackGenerationRef.current = playbackGeneration;

      try {
        if (playingId === id) {
          await azureSpeechService.stop();
          if (
            mountedRef.current &&
            playbackGenerationRef.current === playbackGeneration
          ) {
            setPlayingId(null);
          }
          return;
        }

        await azureSpeechService.stop();
        if (
          !mountedRef.current ||
          playbackGenerationRef.current !== playbackGeneration
        ) {
          return;
        }

        setPlayingId(id);
        await azureSpeechService.speak(
          normalizedText,
          undefined,
          () => {
            if (
              mountedRef.current &&
              playbackGenerationRef.current === playbackGeneration
            ) {
              setPlayingId(null);
            }
          },
          () => {
            if (
              mountedRef.current &&
              playbackGenerationRef.current === playbackGeneration
            ) {
              setPlayingId(null);
              if (editorVisible) {
                setEditorError(uiT("ui.message_33bdeda1f7be"));
              } else {
                setSectionError(uiT("ui.message_33bdeda1f7be"));
              }
            }
          },
        );
      } catch {
        if (
          mountedRef.current &&
          playbackGenerationRef.current === playbackGeneration
        ) {
          setPlayingId(null);
          if (editorVisible) {
            setEditorError(uiT("ui.message_33bdeda1f7be"));
          } else {
            setSectionError(uiT("ui.message_33bdeda1f7be"));
          }
        }
      }
    },
    [editorVisible, playingId],
  );

  const handleSave = useCallback(async () => {
    setEditorError(null);

    if (!userId) {
      setEditorError(uiT("ui.message_e47c72e5a3c4"));
      return;
    }

    if (!hasCompleteDraft) {
      setEditorError(uiT("ui.message_4aed33e9a302"));
      return;
    }

    if (!completeDraftMatchesSubject) {
      setEditorError(
        uiT("ui.dynamic_8bf373b7b12f", {value1: (subjectCharacters || "this vocabulary")}),
      );
      return;
    }

    cancelTranslations();
    setIsSaving(true);

    try {
      const savedSentence = await upsertCustomContextSentence(userId, {
        id: editingId ?? undefined,
        subjectId,
        japanese: draftJapanese,
        kana: draftKana,
        english: draftEnglish,
        displayMode: draftDisplayMode,
      });

      if (!mountedRef.current) {
        return;
      }

      setSentences((currentSentences) => {
        const sentenceIndex = currentSentences.findIndex(
          (sentence) => sentence.id === savedSentence.id,
        );
        if (sentenceIndex < 0) {
          return [...currentSentences, savedSentence];
        }

        const nextSentences = [...currentSentences];
        nextSentences[sentenceIndex] = savedSentence;
        return nextSentences;
      });
      setSectionError(null);
      void stopPlayback();
      setEditorVisible(false);
      resetEditor();
    } catch {
      if (mountedRef.current) {
        setEditorError(uiT("ui.message_d8a7f8bab237"));
        setIsSaving(false);
      }
    }
  }, [
    cancelTranslations,
    draftDisplayMode,
    draftEnglish,
    draftJapanese,
    draftKana,
    editingId,
    hasCompleteDraft,
    resetEditor,
    completeDraftMatchesSubject,
    stopPlayback,
    subjectCharacters,
    subjectId,
    userId,
  ]);

  const confirmDelete = useCallback(
    (sentence: CustomContextSentence) => {
      if (!userId) {
        return;
      }

      Alert.alert(
        uiT("ui.delete_this_sentence_e4f74138"),
        uiT("ui.this_removes_it_from_this_device_63865e6d"),
        [
          { text: uiT("ui.cancel_19766ed6"), style: "cancel" },
          {
            text: uiT("ui.delete_e2d0a549"),
            style: "destructive",
            onPress: () => {
              void deleteCustomContextSentence(userId, sentence.id)
                .then((deleted) => {
                  if (deleted && mountedRef.current) {
                    setSentences((currentSentences) =>
                      currentSentences.filter(
                        (currentSentence) =>
                          currentSentence.id !== sentence.id,
                      ),
                    );
                    setSectionError(null);
                  }
                })
                .catch(() => {
                  if (mountedRef.current) {
                    setSectionError(
                      uiT("ui.message_cd4a50e5def5"),
                    );
                  }
                });
            },
          },
        ],
      );
    },
    [userId],
  );

  const toggleSavedDisplayMode = useCallback(
    (sentence: CustomContextSentence) => {
      if (!userId) {
        return;
      }

      const nextDisplayMode: CustomContextSentenceDisplayMode =
        sentence.displayMode === "kanji" ? "kana" : "kanji";
      setSentences((currentSentences) =>
        currentSentences.map((currentSentence) =>
          currentSentence.id === sentence.id
            ? { ...currentSentence, displayMode: nextDisplayMode }
            : currentSentence,
        ),
      );

      void updateCustomContextSentence(userId, sentence.id, {
        displayMode: nextDisplayMode,
      })
        .then((updatedSentence) => {
          if (!updatedSentence) {
            throw new Error("Custom context sentence no longer exists.");
          }
          if (!mountedRef.current) {
            return;
          }
          setSentences((currentSentences) =>
            currentSentences.map((currentSentence) =>
              currentSentence.id === updatedSentence.id
                ? updatedSentence
                : currentSentence,
            ),
          );
          setSectionError(null);
        })
        .catch(() => {
          if (!mountedRef.current) {
            return;
          }
          setSentences((currentSentences) =>
            currentSentences.map((currentSentence) =>
              currentSentence.id === sentence.id &&
              currentSentence.displayMode === nextDisplayMode
                ? { ...currentSentence, displayMode: sentence.displayMode }
                : currentSentence,
            ),
          );
          setSectionError(
            uiT("ui.message_2a2a1dcdbe8b"),
          );
        });
    },
    [userId],
  );

  const draftPlaybackId = "custom-context-draft";

  return (
    <>
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={resolvedAccentColor} />
        </View>
      ) : sentences.length > 0 ? (
        <View
          style={[styles.sentenceList, { borderTopColor: theme.border }]}
        >
          {sentences.map((sentence, index) => {
            const displayedJapanese =
              sentence.displayMode === "kana"
                ? sentence.kana
                : sentence.japanese;
            const isPlaying = playingId === sentence.id;

            return (
              <View
                key={sentence.id}
                style={[
                  styles.sentenceRow,
                  index < sentences.length - 1 && {
                    borderBottomColor: theme.border,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={styles.sentenceCopy}>
                  <Text
                    selectable
                    style={[styles.japaneseText, { color: theme.textColor }]}
                  >
                    {displayedJapanese}
                  </Text>
                  {!hideTranslationsCompletely && (
                    <Text
                      selectable
                      style={[styles.englishText, { color: theme.textSecondary }]}
                    >
                      {sentence.english}
                    </Text>
                  )}
                </View>

                <View style={styles.rowActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      isPlaying ? "Stop sentence audio" : "Play sentence audio"
                    }
                    hitSlop={ICON_HIT_SLOP}
                    onPress={() =>
                      void handlePlay(displayedJapanese, sentence.id)
                    }
                    style={({ pressed }) => [
                      styles.rowAction,
                      {
                        backgroundColor: isPlaying
                          ? resolvedAccentColor
                          : "transparent",
                        opacity: pressed ? 0.5 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isPlaying ? "stop" : "play"}
                      size={17}
                      color={isPlaying ? accentTextColor : resolvedAccentColor}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      sentence.displayMode === "kanji"
                        ? "Show this sentence in kana"
                        : "Show this sentence in kanji"
                    }
                    hitSlop={ICON_HIT_SLOP}
                    onPress={() => toggleSavedDisplayMode(sentence)}
                    style={({ pressed }) => [
                      styles.rowAction,
                      { opacity: pressed ? 0.5 : 1 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.displayModeText,
                        { color: resolvedAccentColor },
                      ]}
                    >
                      {sentence.displayMode === "kanji" ? "漢字" : "かな"}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={uiT("ui.edit_custom_context_sentence_64167094")}
                    hitSlop={ICON_HIT_SLOP}
                    onPress={() => openEditEditor(sentence)}
                    style={({ pressed }) => [
                      styles.rowAction,
                      { opacity: pressed ? 0.5 : 1 },
                    ]}
                  >
                    <Ionicons
                      name="pencil"
                      size={16}
                      color={theme.textSecondary}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={uiT("ui.delete_custom_context_sentence_161affec")}
                    hitSlop={ICON_HIT_SLOP}
                    onPress={() => confirmDelete(sentence)}
                    style={({ pressed }) => [
                      styles.rowAction,
                      { opacity: pressed ? 0.5 : 1 },
                    ]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color={theme.error}
                    />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {sectionError ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.sectionError, { color: theme.error }]}
        >
          {sectionError}
        </Text>
      ) : null}

      <Modal
        visible={editorVisible}
        animationType="slide"
        presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
        onRequestClose={closeEditor}
      >
        <SafeAreaView
          edges={["top", "bottom"]}
          style={[
            styles.modalContainer,
            { backgroundColor: theme.backgroundColor },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: theme.border }]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={uiT("ui.cancel_editing_custom_context_sentence_434c52d1")}
                disabled={isSaving}
                onPress={closeEditor}
                style={({ pressed }) => [
                  styles.headerButton,
                  { opacity: pressed || isSaving ? 0.5 : 1 },
                ]}
              >
                <Text
                  style={[styles.headerButtonText, { color: theme.textSecondary }]}
                >
                  {uiT("ui.cancel_19766ed6")} </Text>
              </Pressable>
              <Text
                numberOfLines={1}
                style={[styles.modalTitle, { color: theme.textColor }]}
              >
                {editingId ? uiT("ui.edit_sentence_977d96c1") : uiT("ui.new_sentence_c9f2c882")}
              </Text>
              <View style={styles.headerButton} />
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.editorContent}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={[
                  styles.fieldLabel,
                  styles.japaneseFieldLabel,
                  { color: theme.textColor },
                ]}
              >
                {uiT("ui.japanese_be4ee906")} </Text>

              <View style={styles.inputWithAction}>
                <TextInput
                  accessibilityLabel={uiT("ui.japanese_sentence_7f9bffd7")}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlignVertical="top"
                  placeholder={uiT("ui.dynamic_9e6368b4b9cf", {value1: (subjectCharacters)})}
                  placeholderTextColor={theme.textLight}
                  value={draftJapanese}
                  onChangeText={handleManualJapaneseChange}
                  style={[
                    styles.textInput,
                    styles.japaneseInput,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.border,
                      color: theme.textColor,
                    },
                  ]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    playingId === draftPlaybackId
                      ? "Stop draft sentence audio"
                      : "Play draft sentence audio"
                  }
                  disabled={!draftJapanese.trim()}
                  onPress={() =>
                    void handlePlay(draftJapanese, draftPlaybackId)
                  }
                  style={({ pressed }) => [
                    styles.draftPlayButton,
                    {
                      backgroundColor:
                        playingId === draftPlaybackId
                          ? resolvedAccentColor
                          : withAlpha(resolvedAccentColor, 0.1),
                      opacity:
                        pressed || !draftJapanese.trim() ? 0.45 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      playingId === draftPlaybackId ? "stop" : "volume-medium"
                    }
                    size={19}
                    color={
                      playingId === draftPlaybackId
                        ? accentTextColor
                        : resolvedAccentColor
                    }
                  />
                </Pressable>
              </View>

              {draftJapanese.trim() && !japaneseDraftMatchesSubject ? (
                <Text
                  style={[styles.validationText, { color: theme.error }]}
                >
                  {uiT("ui.use_c36d819e")} {subjectCharacters || uiT("ui.this_vocabulary_63cd8b17")} {uiT("ui.in_the_japanese_version_7588355e")} </Text>
              ) : draftKana.trim() && !kanaDraftMatchesSubject ? (
                <Text
                  style={[styles.validationText, { color: theme.error }]}
                >
                  {uiT("ui.use_one_of_this_vocabulary_s_readings_in_the_kana_version_723b9be5")} </Text>
              ) : null}

              <View style={styles.englishHeader}>
                <Text
                  style={[styles.fieldLabel, { color: theme.textColor }]}
                >{uiT("common.english")}</Text>
                {isTranslating ? (
                  <View style={styles.translationStatus}>
                    <ActivityIndicator
                      size="small"
                      color={resolvedAccentColor}
                    />
                    <Text
                      style={[
                        styles.translationStatusText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {uiT("ui.updating_dfe40efe")} </Text>
                  </View>
                ) : null}
              </View>
              <TextInput
                accessibilityLabel={uiT("ui.english_translation_3c1709ce")}
                multiline
                autoCapitalize="sentences"
                autoCorrect
                textAlignVertical="top"
                placeholder={uiT("ui.english_translation_3c1709ce")}
                placeholderTextColor={theme.textLight}
                value={draftEnglish}
                onChangeText={handleManualEnglishChange}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                    color: theme.textColor,
                  },
                ]}
              />

              {translationError ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.inlineError, { color: theme.error }]}
                >
                  {translationError}
                </Text>
              ) : null}

              <View
                style={[
                  styles.localNote,
                  { backgroundColor: withAlpha(theme.textSecondary, 0.08) },
                ]}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={16}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.localNoteText, { color: theme.textSecondary }]}
                >
                  {uiT("ui.saved_only_on_this_device_these_sentences_do_not_sync_1c801cae")} </Text>
              </View>

              {editorError ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.inlineError, { color: theme.error }]}
                >
                  {editorError}
                </Text>
              ) : null}
            </ScrollView>

            <View
              style={[
                styles.modalFooter,
                {
                  backgroundColor: theme.backgroundColor,
                  borderTopColor: theme.border,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={uiT("ui.save_custom_context_sentence_1494c19b")}
                accessibilityState={{ disabled: !canSave }}
                disabled={!canSave}
                onPress={() => void handleSave()}
                style={({ pressed }) => [
                  styles.saveButton,
                  {
                    backgroundColor: resolvedAccentColor,
                    opacity: !canSave || pressed ? 0.45 : 1,
                  },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={accentTextColor} />
                ) : (
                  <Text
                    style={[styles.saveButtonText, { color: accentTextColor }]}
                  >
                    {uiT("ui.save_sentence_5cf12afc")} </Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  sentenceList: {
    marginTop: 14,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  loadingState: {
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sentenceRow: {
    minHeight: 70,
    paddingVertical: 11,
    paddingLeft: 14,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  sentenceCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  japaneseText: {
    fontSize: 17,
    lineHeight: 25,
    fontFamily: "SourceHanSansJP-Regular",
  },
  englishText: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 20,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowAction: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  displayModeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  sectionError: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  headerButton: {
    minWidth: 70,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  headerButtonText: {
    fontSize: 16,
  },
  modalTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
  editorContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  japaneseFieldLabel: {
    marginBottom: 8,
  },
  inputWithAction: {
    position: "relative",
  },
  textInput: {
    minHeight: 108,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 16,
    lineHeight: 23,
  },
  japaneseInput: {
    paddingRight: 58,
    fontFamily: "SourceHanSansJP-Regular",
  },
  draftPlayButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  validationText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  englishHeader: {
    minHeight: 28,
    marginTop: 18,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  translationStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  translationStatusText: {
    fontSize: 12,
  },
  inlineError: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  localNote: {
    marginTop: 18,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  localNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  modalFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  saveButton: {
    minHeight: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});

export default CustomContextSentencesSection;
