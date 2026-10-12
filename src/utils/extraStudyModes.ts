import { uiT } from "../features/interface-language/runtime";
import { type Ionicons } from "@expo/vector-icons";
import { EXTRA_STUDY_SESSION_STORAGE_KEYS } from "./extraStudySessionPersistence";

export type ExtraStudyModeId =
  | "recent-lessons"
  | "random-test"
  | "reading-test"
  | "hiragana-vocab-meaning"
  | "similar-kanji"
  | "kana-kanji-test"
  | "listening-practice"
  | "audio-vocab"
  | "context-sentence-practice"
  | "jlpt-quiz"
  | "text-analysis"
  | "writing-practice"
  | "crossword"
  | "word-search"
  | "wordle"
  | "custom-review"
  | "custom-lessons"
  | "subject-lists"
  | "asr-reading-debug";

export type ExtraStudyModeDefinition = {
  id: ExtraStudyModeId;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconText?: string;
  route: string;
  hiddenByDefault?: boolean;
  requiresUsername?: string;
};

export const EXTRA_STUDY_MODE_DEFINITIONS: ExtraStudyModeDefinition[] = [
  {
    id: "recent-lessons",
    get title() { return uiT("ui.recent_lessons_20d9a4d8"); },
    get subtitle() { return uiT("ui.practice_your_recently_unlocked_items_72ff9157"); },
    icon: "time",
    route: "/recent-lessons-review",
  },
  {
    id: "random-test",
    get title() { return uiT("ui.random_test_b7448a38"); },
    get subtitle() { return uiT("ui.test_yourself_on_any_learned_items_59478b01"); },
    icon: "dice",
    route: "/test-config",
  },
  {
    id: "reading-test",
    get title() { return uiT("ui.vocab_reading_db4cbfd3"); },
    get subtitle() { return uiT("ui.english_to_kana_reading_practice_36ab7662"); },
    icon: "language",
    route: "/meaning-reading-config",
  },
  {
    id: "hiragana-vocab-meaning",
    get title() { return uiT("ui.hiragana_vocab_c0c944e5"); },
    get subtitle() { return uiT("ui.read_hiragana_prompts_and_answer_in_english_0c762db7"); },
    icon: "text",
    iconText: "あ",
    route: "/hiragana-vocab-meaning-config",
  },
  {
    id: "similar-kanji",
    get title() { return uiT("ui.similar_kanji_6df70171"); },
    get subtitle() { return uiT("ui.match_lookalike_kanji_to_their_meanings_17546770"); },
    icon: "git-compare",
    route: "/similar-kanji-config",
  },
  {
    id: "kana-kanji-test",
    get title() { return uiT("ui.kana_to_kanji_612a3750"); },
    get subtitle() { return uiT("ui.read_kana_prompts_and_answer_in_kanji_a66bec8f"); },
    icon: "swap-horizontal",
    route: "/kana-kanji-config",
  },
  {
    id: "audio-vocab",
    get title() { return uiT("ui.audio_vocab_31f3aa3d"); },
    get subtitle() { return uiT("ui.listen_to_a_word_and_recall_its_english_meaning_fdd9e2ba"); },
    icon: "volume-high",
    route: "/audio-vocab",
  },
  {
    id: "listening-practice",
    get title() { return uiT("ui.listening_practice_a4e07133"); },
    get subtitle() { return uiT("ui.learn_from_anime_context_with_audio_316f79ce"); },
    icon: "headset",
    route: "/listening-practice-config",
  },
  {
    id: "context-sentence-practice",
    get title() { return uiT("ui.context_sentences_0461dd8f"); },
    get subtitle() { return uiT("ui.fill_the_missing_vocab_from_sentence_context_53d052c0"); },
    icon: "chatbubble-ellipses",
    route: "/context-sentence-practice-config",
  },
  {
    id: "jlpt-quiz",
    get title() { return uiT("ui.jlpt_quiz_5280ece2"); },
    get subtitle() { return uiT("ui.quick_quizzes_and_timed_n5_n1_mock_exams_4d7ffef6"); },
    icon: "school",
    route: "/jlpt",
  },
  {
    id: "text-analysis",
    get title() { return uiT("ui.japanese_text_9d51300d"); },
    get subtitle() { return uiT("ui.analyze_pasted_grammar_and_vocabulary_76126877"); },
    icon: "document-text",
    route: "/text-reader",
  },
  {
    id: "writing-practice",
    get title() { return uiT("ui.kanji_writing_da747d0f"); },
    get subtitle() { return uiT("ui.practice_stroke_order_by_drawing_2995df58"); },
    icon: "brush",
    route: "/writing-practice-config",
  },
  {
    id: "crossword",
    get title() { return uiT("ui.crossword_468aceb8"); },
    get subtitle() { return uiT("ui.solve_a_hiragana_crossword_from_english_clues_356e9260"); },
    icon: "grid",
    route: "/crossword-config",
  },
  {
    id: "word-search",
    get title() { return uiT("ui.word_search_2a17a96d"); },
    get subtitle() { return uiT("ui.find_kana_readings_or_kanji_from_vocabulary_clues_a91028dd"); },
    icon: "search",
    route: "/word-search-config",
  },
  {
    id: "wordle",
    get title() { return uiT("ui.kana_wordle_640f06f7"); },
    get subtitle() { return uiT("ui.guess_the_target_reading_in_limited_tries_4e3d36b2"); },
    icon: "game-controller",
    route: "/wordle-config",
    requiresUsername: "Portego",
  },
  {
    id: "custom-review",
    get title() { return uiT("ui.custom_review_384832ab"); },
    get subtitle() { return uiT("ui.study_specific_items_of_your_choice_fff84d58"); },
    icon: "options",
    route: "/custom-review-selection",
  },
  {
    id: "custom-lessons",
    get title() { return uiT("ui.custom_lessons_d4dcbb33"); },
    get subtitle() { return uiT("ui.learn_specific_items_of_your_choice_81e912ac"); },
    icon: "book",
    route: "/custom-lesson-selection",
  },
  {
    id: "subject-lists",
    get title() { return uiT("ui.subject_lists_20c1f7d1"); },
    get subtitle() { return uiT("ui.manage_saved_collections_for_custom_study_813ad41f"); },
    icon: "list",
    route: "/subject-lists",
  },
  {
    id: "asr-reading-debug",
    get title() { return uiT("ui.asr_reading_debug_3311a8b0"); },
    get subtitle() { return uiT("ui.inspect_japanese_asr_alternatives_8b7fb1c5"); },
    icon: "mic",
    route: "/asr-reading-debug",
    hiddenByDefault: true,
    requiresUsername: "Portego",
  },
];

export const DEFAULT_HOME_EXTRA_STUDY_MODE_ORDER: ExtraStudyModeId[] =
  EXTRA_STUDY_MODE_DEFINITIONS.filter((mode) => !mode.hiddenByDefault).map(
    (mode) => mode.id,
  );

export const RESUMABLE_EXTRA_STUDY_MODE_SESSION_KEYS: Partial<
  Record<ExtraStudyModeId, string>
> = {
  "audio-vocab": EXTRA_STUDY_SESSION_STORAGE_KEYS.AUDIO_VOCAB,
  "random-test": EXTRA_STUDY_SESSION_STORAGE_KEYS.RANDOM_TEST,
  "reading-test": EXTRA_STUDY_SESSION_STORAGE_KEYS.MEANING_READING,
  "hiragana-vocab-meaning":
    EXTRA_STUDY_SESSION_STORAGE_KEYS.HIRAGANA_VOCAB_MEANING,
  "similar-kanji": EXTRA_STUDY_SESSION_STORAGE_KEYS.SIMILAR_KANJI,
  "kana-kanji-test": EXTRA_STUDY_SESSION_STORAGE_KEYS.KANA_KANJI,
  "listening-practice": EXTRA_STUDY_SESSION_STORAGE_KEYS.LISTENING_PRACTICE,
  "context-sentence-practice":
    EXTRA_STUDY_SESSION_STORAGE_KEYS.CONTEXT_SENTENCE_PRACTICE,
  "writing-practice": EXTRA_STUDY_SESSION_STORAGE_KEYS.WRITING_PRACTICE,
  crossword: EXTRA_STUDY_SESSION_STORAGE_KEYS.CROSSWORD,
  "word-search": EXTRA_STUDY_SESSION_STORAGE_KEYS.WORD_SEARCH,
  wordle: EXTRA_STUDY_SESSION_STORAGE_KEYS.WORDLE,
  "custom-review": EXTRA_STUDY_SESSION_STORAGE_KEYS.CUSTOM_REVIEW,
};

export const RESUMABLE_EXTRA_STUDY_MODE_SESSION_ENTRIES = Object.entries(
  RESUMABLE_EXTRA_STUDY_MODE_SESSION_KEYS,
) as [ExtraStudyModeId, string][];

const VALID_EXTRA_STUDY_MODE_IDS = new Set<ExtraStudyModeId>(
  EXTRA_STUDY_MODE_DEFINITIONS.map((mode) => mode.id),
);

function normalizeModeIdList(
  value: unknown,
  allowedModeIds: Set<ExtraStudyModeId>,
): ExtraStudyModeId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique: ExtraStudyModeId[] = [];

  value.forEach((entry) => {
    if (!isExtraStudyModeId(entry)) {
      return;
    }

    if (!allowedModeIds.has(entry)) {
      return;
    }

    if (!unique.includes(entry)) {
      unique.push(entry);
    }
  });

  return unique;
}

export function isExtraStudyModeId(value: unknown): value is ExtraStudyModeId {
  return (
    typeof value === "string" &&
    VALID_EXTRA_STUDY_MODE_IDS.has(value as ExtraStudyModeId)
  );
}

export function getAvailableExtraStudyModes(
  username?: string | null,
): ExtraStudyModeDefinition[] {
  const normalizedUsername = username?.trim().toLowerCase() ?? "";

  return EXTRA_STUDY_MODE_DEFINITIONS.filter((mode) => {
    if (!mode.requiresUsername) {
      return true;
    }

    return mode.requiresUsername.trim().toLowerCase() === normalizedUsername;
  });
}

export function normalizeHomeExtraStudyHiddenModeIds(
  value: unknown,
): ExtraStudyModeId[] {
  return normalizeModeIdList(value, VALID_EXTRA_STUDY_MODE_IDS);
}

export function normalizeHomeExtraStudyModeOrder(
  value: unknown,
  availableModes: ExtraStudyModeDefinition[],
  hiddenModeIds: unknown = [],
): ExtraStudyModeId[] {
  const availableModeIds = availableModes.map((mode) => mode.id);
  const allowed = new Set<ExtraStudyModeId>(availableModeIds);
  const hiddenModeIdSet = new Set(
    normalizeModeIdList(hiddenModeIds, allowed),
  );
  const defaultVisibleModes = availableModes
    .filter((mode) => !mode.hiddenByDefault && !hiddenModeIdSet.has(mode.id))
    .map((mode) => mode.id);

  const unique = normalizeModeIdList(value, allowed).filter(
    (modeId) => !hiddenModeIdSet.has(modeId),
  );

  defaultVisibleModes.forEach((modeId) => {
    if (!unique.includes(modeId)) {
      unique.push(modeId);
    }
  });

  return unique;
}
