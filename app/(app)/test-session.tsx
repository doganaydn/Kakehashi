import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useActivityTracking } from "../../src/hooks/useActivityTracking";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ExtraStudyCompletionTransition, {
  useExtraStudyResultsReveal,
} from "../../src/components/ExtraStudyCompletionTransition";
import AudioVocabPrompt from "../../src/components/audio-vocab-prompt";
import ExtraStudyModeAccess from "../../src/components/ExtraStudyModeAccess";
import { createAudioVocabCard } from "../../src/utils/audioVocabStudy";
import ReviewQuestionScreen from "../../src/components/ReviewQuestionScreen";
import ReviewResultsScreen from "../../src/components/ReviewResultsScreen";
import { useSession } from "../../src/contexts/AuthContext";
import {
  Assignment,
  Subject as ApiSubject,
  getAllAssignmentsCached,
  getStudyMaterials,
} from "../../src/utils/api";
import { getAllSubjects, getSubjectById } from "../../src/utils/cache";
import {
  getExtraStudyCandidateSubjectIds,
  getSelectedListSubjectIdSet,
  parseSelectedListIds,
  subjectMatchesExtraStudyLevel,
  subjectMatchesExtraStudySrsStage,
  subjectMatchesSelectedLists,
} from "../../src/utils/extraStudySubjectLists";
import {
  EXTRA_STUDY_SESSION_STORAGE_KEYS,
  getAccountScopedExtraStudySessionStorageKey,
  clearExtraStudySessionState,
  loadExtraStudySessionState,
  saveExtraStudySessionState,
} from "../../src/utils/extraStudySessionPersistence";
import {
  getRecentRandomTestSubjectIds,
  loadRandomTestSubjectHistory,
  saveRandomTestSubjectHistoryEntry,
  selectRandomTestSubjects,
} from "../../src/utils/randomTestHistory";
import { buildReviewQuestionQueue } from "../../src/utils/reviewOrdering";
import { useAuthStore, useSettingsStore } from "../../src/utils/store";
import { useTheme } from "../../src/utils/theme";

type QuestionType = "meaning" | "reading";
type TestSessionMode = "random-test" | "hiragana-vocab-meaning" | "audio-vocab";

interface TestStudyMaterials {
  meaning_synonyms?: string[];
}

interface TestQuestion {
  id: number;
  subject: ApiSubject;
  questionType: QuestionType;
  isAnkiMode?: boolean;
  requiredTypes?: QuestionType[];
}

interface RandomTestReviewItem {
  id: number;
  assignmentId: number;
  subjectId: number;
  subject: ApiSubject;
  srsStage?: number;
  meaningDone: boolean;
  readingDone: boolean;
  meaningApplicable: boolean;
  readingApplicable: boolean;
  meaningIncorrect: number;
  readingIncorrect: number;
  meaningCorrectlyAnswered: boolean;
  readingCorrectlyAnswered: boolean;
  meaningIncorrectCounted: boolean;
  readingIncorrectCounted: boolean;
}

interface SrsGroupsConfig {
  apprentice: boolean;
  guru: boolean;
  master: boolean;
  enlightened: boolean;
  burned: boolean;
}

interface TestSessionConfig {
  includeRadicals: boolean;
  includeKanji: boolean;
  includeVocabulary: boolean;
  includeKanaVocabulary: boolean;
  numberOfQuestions: number;
  includeMeaning: boolean;
  includeReading: boolean;
  srsGroups: SrsGroupsConfig;
  useCustomLevelRange: boolean;
  minLevel: number;
  maxLevel: number;
  selectedListIds: string[];
  autoPlayAudio?: boolean;
  audioSource?: "word" | "sentence";
}

interface RandomTestProgress {
  current: number;
  total: number;
  meaningCorrect: number;
  readingCorrect: number;
  totalItems: number;
  answeredCount: number;
  completedItems: number;
  meaningAttempts: number;
  readingAttempts: number;
  correctAnswersCount: number;
}

const DEFAULT_SRS_GROUPS: SrsGroupsConfig = {
  apprentice: true,
  guru: true,
  master: true,
  enlightened: true,
  burned: true,
};
const REVIEW_MAX_QUESTION_GAP = 10;
const HIRAGANA_VOCAB_MEANING_MODE_PARAM = "hiragana-vocab-meaning";

const createInitialProgressCounters = () => ({
  answeredCount: 0,
  meaningAttempts: 0,
  readingAttempts: 0,
  meaningCorrect: 0,
  readingCorrect: 0,
  correctAnswersCount: 0,
});

type RandomTestProgressCounters = ReturnType<typeof createInitialProgressCounters>;

interface RandomTestSavedSession {
  savedAt: number;
  config: TestSessionConfig;
  testQuestions: TestQuestion[];
  currentQuestionIndex: number;
  reviewItems: RandomTestReviewItem[];
  progressCounters: RandomTestProgressCounters;
}

const RANDOM_TEST_SESSION_KEY = EXTRA_STUDY_SESSION_STORAGE_KEYS.RANDOM_TEST;

const isSrsStageAllowed = (
  stage: number,
  srsGroups: SrsGroupsConfig,
): boolean => {
  if (stage >= 1 && stage <= 4) return srsGroups.apprentice;
  if (stage >= 5 && stage <= 6) return srsGroups.guru;
  if (stage === 7) return srsGroups.master;
  if (stage === 8) return srsGroups.enlightened;
  if (stage === 9) return srsGroups.burned;
  return false;
};

const hasReadingQuestion = (subject: ApiSubject): boolean => {
  if (subject.object === "radical") {
    return false;
  }

  const readings = subject.data.readings;
  return Array.isArray(readings) && readings.length > 0;
};

function resolveTestSessionMode(rawMode: unknown): TestSessionMode {
  if (rawMode === "audio-vocab") return "audio-vocab";
  if (
    typeof rawMode === "string" &&
    rawMode.trim() === HIRAGANA_VOCAB_MEANING_MODE_PARAM
  ) {
    return "hiragana-vocab-meaning";
  }
  return "random-test";
}

function normalizeKatakanaToHiragana(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCodePoint(code - 0x60);
    } else {
      out += ch;
    }
  }
  return out;
}

function getPrimaryReadingAsHiragana(subject: ApiSubject): string | null {
  if (
    subject.object === "kana_vocabulary" &&
    typeof subject.data.characters === "string" &&
    subject.data.characters.trim().length > 0
  ) {
    return normalizeKatakanaToHiragana(subject.data.characters.trim());
  }

  const readings = subject.data.readings;
  if (!Array.isArray(readings) || readings.length === 0) {
    return null;
  }

  const primaryReading = readings.find((reading) => reading.primary) ?? readings[0];
  const rawReading =
    typeof primaryReading?.reading === "string"
      ? primaryReading.reading.trim()
      : "";
  if (!rawReading) {
    return null;
  }

  return normalizeKatakanaToHiragana(rawReading);
}

const TARGET_KANJI_REGEX = /[\u3400-\u4DBF\u4E00-\u9FFF々〆ヵヶ]/g;

function maskTargetKanjiInSentence(
  sentence: string,
  targetCharacters: string,
): string {
  const trimmedTarget = targetCharacters.trim();
  TARGET_KANJI_REGEX.lastIndex = 0;
  if (!trimmedTarget || !TARGET_KANJI_REGEX.test(trimmedTarget)) {
    return sentence;
  }

  TARGET_KANJI_REGEX.lastIndex = 0;
  let maskedSentence = sentence;
  const maskedTarget = trimmedTarget.replace(TARGET_KANJI_REGEX, "○");
  let replacedExactTarget = false;
  if (maskedTarget !== trimmedTarget) {
    const withExactReplacement = maskedSentence.split(trimmedTarget).join(maskedTarget);
    replacedExactTarget = withExactReplacement !== maskedSentence;
    maskedSentence = withExactReplacement;
  }

  if (replacedExactTarget) {
    return maskedSentence;
  }

  TARGET_KANJI_REGEX.lastIndex = 0;
  const kanjiChunks = Array.from(
    new Set(trimmedTarget.match(TARGET_KANJI_REGEX) ?? []),
  ).sort((a, b) => b.length - a.length);

  for (const chunk of kanjiChunks) {
    maskedSentence = maskedSentence
      .split(chunk)
      .join("○".repeat(chunk.length));
  }

  return maskedSentence;
}

function buildHiraganaMeaningContextHints(
  subject: ApiSubject,
): { ja?: string; en?: string }[] {
  const contextSentences = (subject.data as any).context_sentences;
  if (!Array.isArray(contextSentences) || contextSentences.length === 0) {
    return [];
  }

  const targetCharacters =
    typeof subject.data.characters === "string"
      ? subject.data.characters.trim()
      : "";

  return contextSentences
    .map((sentence: any) => {
      const rawJa = typeof sentence?.ja === "string" ? sentence.ja.trim() : "";
      const maskedJa =
        rawJa && targetCharacters
          ? maskTargetKanjiInSentence(rawJa, targetCharacters)
          : rawJa;

      // For this quiz mode, hide translations so hints don't leak the answer.
      if (!maskedJa) {
        return null;
      }

      return {
        ja: maskedJa || undefined,
      };
    })
    .filter((hint): hint is { ja?: string; en?: string } => Boolean(hint));
}

const getAvailableQuestionTypes = (
  subject: ApiSubject,
  config: TestSessionConfig,
): QuestionType[] => {
  const types: QuestionType[] = [];

  if (config.includeMeaning) {
    types.push("meaning");
  }

  if (config.includeReading && hasReadingQuestion(subject)) {
    types.push("reading");
  }

  return types;
};

const countCompletedItems = (reviewItems: RandomTestReviewItem[]): number => {
  return reviewItems.filter((item) => {
    const needsMeaning = item.meaningApplicable;
    const needsReading = item.readingApplicable;

    if (!needsMeaning && !needsReading) {
      return false;
    }

    if (needsMeaning && !item.meaningDone) {
      return false;
    }

    if (needsReading && !item.readingDone) {
      return false;
    }

    return true;
  }).length;
};

interface RandomQueueBehaviorOptions {
  groupQuestions: boolean;
  backToBack: boolean;
  questionTypeOrderEnabled: boolean;
  questionTypeOrder: QuestionType;
  maxQuestionGap: number;
}

const buildRandomTestSession = (
  subjects: ApiSubject[],
  config: TestSessionConfig,
  queueBehavior: RandomQueueBehaviorOptions,
  selectionOptions: {
    avoidSubjectIds?: ReadonlySet<number>;
  } = {},
): {
  questions: TestQuestion[];
  reviewItems: RandomTestReviewItem[];
} => {
  const candidates = subjects.filter(
    (subject) => getAvailableQuestionTypes(subject, config).length > 0,
  );

  if (candidates.length === 0) {
    return { questions: [], reviewItems: [] };
  }

  const maxSubjects = Math.min(config.numberOfQuestions, candidates.length);
  const selectedSubjects = selectRandomTestSubjects(candidates, maxSubjects, {
    avoidSubjectIds: selectionOptions.avoidSubjectIds,
  });
  const questions: TestQuestion[] = [];
  const reviewItems: RandomTestReviewItem[] = [];
  const subjectById = new Map<number, ApiSubject>();

  selectedSubjects.forEach((subject, index) => {
    const availableTypes = getAvailableQuestionTypes(subject, config);
    subjectById.set(subject.id, subject);

    reviewItems.push({
      id: subject.id,
      assignmentId: -(index + 1),
      subjectId: subject.id,
      subject,
      meaningDone: false,
      readingDone: false,
      meaningApplicable: availableTypes.includes("meaning"),
      readingApplicable: availableTypes.includes("reading"),
      meaningIncorrect: 0,
      readingIncorrect: 0,
      meaningCorrectlyAnswered: false,
      readingCorrectlyAnswered: false,
      meaningIncorrectCounted: false,
      readingIncorrectCounted: false,
    });

  });

  const pushQuestion = (subjectId: number, questionType: QuestionType) => {
    const subject = subjectById.get(subjectId);
    if (!subject) return;

    questions.push({
      id: questions.length,
      subject,
      questionType,
      isAnkiMode: false,
      requiredTypes: [questionType],
    });
  };

  if (config.includeMeaning && config.includeReading) {
    const queueItems = reviewItems.map((item) => ({
      id: item.id,
      subject: {
        object: item.subject.object as
          | "radical"
          | "kanji"
          | "vocabulary"
          | "kana_vocabulary",
        data: {
          readings: item.subject.data.readings,
        },
      },
    }));

    const orderedQueue = buildReviewQuestionQueue(queueItems, {
      groupQuestions: queueBehavior.groupQuestions,
      backToBack: queueBehavior.backToBack,
      questionTypeOrderEnabled: queueBehavior.questionTypeOrderEnabled,
      questionTypeOrder: queueBehavior.questionTypeOrder,
      maxQuestionGap: queueBehavior.maxQuestionGap,
    });

    orderedQueue.forEach((queueQuestion) => {
      pushQuestion(queueQuestion.itemId, queueQuestion.type);
    });
  } else if (config.includeMeaning) {
    reviewItems.forEach((item) => {
      pushQuestion(item.subjectId, "meaning");
    });
  } else {
    reviewItems.forEach((item) => {
      if (item.readingApplicable) {
        pushQuestion(item.subjectId, "reading");
      }
    });
  }

  return { questions, reviewItems };
};

export default function TestSessionRoute() {
  useInterfaceLanguage();
  const params = useLocalSearchParams();
  return resolveTestSessionMode(params.mode) === "audio-vocab" ? (
    <ExtraStudyModeAccess modeId="audio-vocab">
      <TestSessionScreen />
    </ExtraStudyModeAccess>
  ) : (
    <TestSessionScreen />
  );
}

function TestSessionScreen() {
  useInterfaceLanguage();
  useActivityTracking("test_session");
  const { theme } = useTheme();
  const { apiToken, userData } = useAuthStore();
  const { isLoading: isAuthLoading } = useSession();
  const params = useLocalSearchParams();
  const sessionMode = resolveTestSessionMode(params.mode);
  const isHiraganaVocabMeaningMode =
    sessionMode === "hiragana-vocab-meaning";
  const isAudioVocabMode = sessionMode === "audio-vocab";
  const isMeaningOnlyVocabMode = isHiraganaVocabMeaningMode || isAudioVocabMode;
  const sessionStorageKey = isAudioVocabMode
    ? getAccountScopedExtraStudySessionStorageKey(
        EXTRA_STUDY_SESSION_STORAGE_KEYS.AUDIO_VOCAB,
        userData?.id ?? "anonymous",
      )
    : isHiraganaVocabMeaningMode
      ? EXTRA_STUDY_SESSION_STORAGE_KEYS.HIRAGANA_VOCAB_MEANING
      : RANDOM_TEST_SESSION_KEY;
  const configRoute = isAudioVocabMode
    ? "/audio-vocab"
    : isHiraganaVocabMeaningMode
      ? "/hiragana-vocab-meaning-config"
      : "/test-config";
  const sessionLabel = isAudioVocabMode
    ? "audio vocab quiz"
    : isHiraganaVocabMeaningMode
      ? "hiragana vocab quiz"
      : "random test";
  const {
    ankiCardMode,
    ankiGroupQuestions,
    ankiCardModeScope,
    backToBackQuestions,
    reviewQuestionOrderEnabled,
    meaningFirst,
    vocabularyAudioVoice,
    acceptUserSynonymsAsAnswers,
  } = useSettingsStore();
  const preferredQuestionType: QuestionType = meaningFirst ? "meaning" : "reading";

  const [isLoading, setIsLoading] = useState(true);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [reviewItems, setReviewItems] = useState<RandomTestReviewItem[]>([]);
  const [progressCounters, setProgressCounters] = useState(
    createInitialProgressCounters(),
  );
  const [isTestComplete, setIsTestComplete] = useState(false);
  const shouldRevealResults = useExtraStudyResultsReveal(isTestComplete);
  const [config, setConfig] = useState<TestSessionConfig | null>(null);
  const [hasRestoredSession, setHasRestoredSession] = useState(false);
  const studyMaterialSubjectIdsKey = useMemo(
    () =>
      [...new Set(reviewItems.map((item) => item.subjectId))]
        .sort((left, right) => left - right)
        .join(","),
    [reviewItems],
  );
  const [sessionStudyMaterials, setSessionStudyMaterials] = useState<{
    subjectIdsKey: string;
    apiToken: string;
    materials: Map<number, TestStudyMaterials>;
  } | null>(null);

  useEffect(() => {
    if (!acceptUserSynonymsAsAnswers) {
      setSessionStudyMaterials(null);
      return;
    }
    if (isAuthLoading || !apiToken || !studyMaterialSubjectIdsKey) return;

    let cancelled = false;
    const loadStudyMaterials = async () => {
      const materialsMap = new Map<number, TestStudyMaterials>();
      try {
        const response = await getStudyMaterials(
          apiToken,
          { subject_ids: studyMaterialSubjectIdsKey.split(",").map(Number) },
          { skipCache: true },
        );
        for (const material of response.data) {
          materialsMap.set(material.data.subject_id, {
            meaning_synonyms: material.data.meaning_synonyms || [],
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("[Random Test] Failed to load user synonyms:", error);
          Alert.alert(
            uiT("ui.user_synonyms_unavailable_4fcac0b2"),
            uiT("ui.your_quiz_will_continue_but_user_synonyms_could_not_be_loaded_and_3604c5fa"),
          );
        }
      }
      if (!cancelled) {
        setSessionStudyMaterials({
          subjectIdsKey: studyMaterialSubjectIdsKey,
          apiToken,
          materials: materialsMap,
        });
      }
    };
    void loadStudyMaterials();
    return () => {
      cancelled = true;
    };
  }, [
    acceptUserSynonymsAsAnswers,
    apiToken,
    isAuthLoading,
    studyMaterialSubjectIdsKey,
  ]);

  // Gate the first render too, before the loading effect has had a chance to run.
  const isLoadingStudyMaterials =
    acceptUserSynonymsAsAnswers &&
    Boolean(studyMaterialSubjectIdsKey) &&
    (isAuthLoading ||
      sessionStudyMaterials?.apiToken !== apiToken ||
      sessionStudyMaterials?.subjectIdsKey !== studyMaterialSubjectIdsKey);

  const handleSynonymAdded = useCallback(
    (subjectId: number, synonyms: string[]) => {
      setSessionStudyMaterials((previous) => {
        if (!previous) return previous;
        const materials = new Map(previous.materials);
        materials.set(subjectId, { meaning_synonyms: synonyms });
        return { ...previous, materials };
      });
    },
    [],
  );

  const clearSavedRandomTestSession = useCallback(async () => {
    await clearExtraStudySessionState(sessionStorageKey);
  }, [sessionStorageKey]);

  const restoreSavedRandomTestSession = useCallback(async (): Promise<boolean> => {
    const savedSession = await loadExtraStudySessionState<RandomTestSavedSession>(
      sessionStorageKey,
    );
    if (!savedSession) {
      return false;
    }

    if (
      !savedSession.config ||
      typeof savedSession.config !== "object" ||
      !Array.isArray(savedSession.testQuestions) ||
      !Array.isArray(savedSession.reviewItems) ||
      savedSession.testQuestions.length === 0
    ) {
      await clearSavedRandomTestSession();
      return false;
    }

    const safeIndex = Math.max(
      0,
      Math.min(
        savedSession.currentQuestionIndex || 0,
        savedSession.testQuestions.length - 1,
      ),
    );

    setConfig({
      ...savedSession.config,
      audioSource:
        savedSession.config.audioSource === "sentence" ? "sentence" : "word",
    });
    setTestQuestions(savedSession.testQuestions);
    setCurrentQuestionIndex(safeIndex);
    setReviewItems(savedSession.reviewItems);
    setProgressCounters({
      ...createInitialProgressCounters(),
      ...(savedSession.progressCounters || {}),
    });
    setIsTestComplete(false);
    setHasRestoredSession(true);
    setIsLoading(false);
    return true;
  }, [clearSavedRandomTestSession, sessionStorageKey]);

  const saveRandomTestSessionForLater = useCallback(async (): Promise<boolean> => {
    if (
      !config ||
      isTestComplete ||
      testQuestions.length === 0 ||
      currentQuestionIndex >= testQuestions.length
    ) {
      return false;
    }

    const payload: RandomTestSavedSession = {
      savedAt: Date.now(),
      config,
      testQuestions,
      currentQuestionIndex,
      reviewItems,
      progressCounters,
    };

    return saveExtraStudySessionState(sessionStorageKey, payload);
  }, [
    config,
    currentQuestionIndex,
    isTestComplete,
    progressCounters,
    reviewItems,
    sessionStorageKey,
    testQuestions,
  ]);

  const loadConfig = useCallback(async () => {
    try {
      const shouldResume = params.resume === "true";
      if (shouldResume) {
        const restored = await restoreSavedRandomTestSession();
        if (restored) {
          return;
        }
        if (!params.sessionId) {
          Alert.alert(
            uiT("ui.session_not_available_3b81ebff"),
            uiT("ui.couldn_t_restore_that_value_e93ff766", {value1: (sessionLabel)}),
            [{ text: uiT("ui.ok_565339bc"), onPress: () => router.replace(configRoute as any) }],
          );
          return;
        }
      }

      setHasRestoredSession(false);

      if (params.sessionId) {
        const configStorageKey = isHiraganaVocabMeaningMode
          ? `hiragana_vocab_meaning_config_${params.sessionId}`
          : `test_config_${params.sessionId}`;
        const configData = await AsyncStorage.getItem(configStorageKey);

        if (!configData) {
          throw new Error("Config not found in AsyncStorage");
        }

        const parsedConfig = JSON.parse(configData);
        setConfig({
          includeRadicals: isMeaningOnlyVocabMode
            ? false
            : parsedConfig.includeRadicals === true,
          includeKanji: isMeaningOnlyVocabMode
            ? false
            : parsedConfig.includeKanji === true,
          autoPlayAudio: parsedConfig.autoPlayAudio !== false,
          audioSource:
            parsedConfig.audioSource === "sentence" ? "sentence" : "word",
          includeVocabulary: parsedConfig.includeVocabulary !== false,
          includeKanaVocabulary: parsedConfig.includeKanaVocabulary !== false,
          numberOfQuestions:
            typeof parsedConfig.numberOfQuestions === "number"
              ? parsedConfig.numberOfQuestions
              : 20,
          includeMeaning:
            isMeaningOnlyVocabMode
              ? true
              : (parsedConfig.questionTypes?.meaning ??
                parsedConfig.includeMeaning ??
                true),
          includeReading:
            isMeaningOnlyVocabMode
              ? false
              : (parsedConfig.questionTypes?.reading ??
                parsedConfig.includeReading ??
                true),
          srsGroups: {
            ...DEFAULT_SRS_GROUPS,
            ...(parsedConfig.srsGroups || {}),
          },
          useCustomLevelRange: parsedConfig.useCustomLevelRange ?? false,
          minLevel: parsedConfig.minLevel ?? 1,
          maxLevel:
            parsedConfig.maxLevel ?? useAuthStore.getState().userData?.level ?? 60,
          selectedListIds: parseSelectedListIds(parsedConfig.selectedListIds),
        });

        await AsyncStorage.removeItem(configStorageKey);
        return;
      }

      setConfig({
        autoPlayAudio: params.autoPlayAudio !== "false",
        audioSource: params.audioSource === "sentence" ? "sentence" : "word",
        includeRadicals:
          !isMeaningOnlyVocabMode && params.includeRadicals === "true",
        includeKanji:
          !isMeaningOnlyVocabMode && params.includeKanji === "true",
        includeVocabulary:
          params.includeVocabulary === "true" ||
          (isMeaningOnlyVocabMode &&
            typeof params.includeVocabulary !== "string"),
        includeKanaVocabulary:
          params.includeKanaVocabulary === "true" ||
          (isMeaningOnlyVocabMode &&
            typeof params.includeKanaVocabulary !== "string"),
        numberOfQuestions:
          Number.parseInt(params.numberOfQuestions as string, 10) || 20,
        includeMeaning:
          isMeaningOnlyVocabMode ||
          params.includeMeaning === "true",
        includeReading:
          !isMeaningOnlyVocabMode && params.includeReading === "true",
        srsGroups: {
          apprentice: params.srsApprentice !== "false",
          guru: params.srsGuru !== "false",
          master: params.srsMaster !== "false",
          enlightened: params.srsEnlightened !== "false",
          burned: params.srsBurned !== "false",
        },
        useCustomLevelRange: params.useCustomLevelRange === "true",
        minLevel: params.minLevel ? parseInt(params.minLevel as string, 10) : 1,
        maxLevel: params.maxLevel
          ? parseInt(params.maxLevel as string, 10)
          : useAuthStore.getState().userData?.level ?? 60,
        selectedListIds: parseSelectedListIds(
          typeof params.selectedListIds === "string"
            ? (params.selectedListIds as string).split(",")
            : [],
        ),
      });
    } catch (error) {
      console.error("Failed to load config:", error);
      Alert.alert(uiT("ui.error_54a0e8c1"), uiT("ui.failed_to_load_test_configuration_9a47354b"), [
        { text: uiT("ui.ok_565339bc"), onPress: () => router.back() },
      ]);
    }
  }, [params.autoPlayAudio, params.audioSource, params.includeKanaVocabulary, params.includeKanji, params.includeMeaning, params.includeRadicals, params.includeReading, params.includeVocabulary, params.maxLevel, params.minLevel, params.numberOfQuestions, params.resume, params.selectedListIds, params.sessionId, params.srsApprentice, params.srsBurned, params.srsEnlightened, params.srsGuru, params.srsMaster, params.useCustomLevelRange, configRoute, isMeaningOnlyVocabMode, isHiraganaVocabMeaningMode, restoreSavedRandomTestSession, sessionLabel, ]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const initializeSessionState = useCallback(
    (questions: TestQuestion[], items: RandomTestReviewItem[]) => {
      setTestQuestions(questions);
      setReviewItems(items);
      setCurrentQuestionIndex(0);
      setIsTestComplete(false);
      setProgressCounters(createInitialProgressCounters());
    },
    [],
  );

  const loadTestQuestions = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    if (!apiToken) {
      setIsLoading(false);
      return;
    }

    if (!config) {
      return;
    }

    const loadRecentRandomTestSubjectIds = async (): Promise<Set<number>> => {
      if (isMeaningOnlyVocabMode) {
        return new Set();
      }

      try {
        const history = await loadRandomTestSubjectHistory();
        return new Set(getRecentRandomTestSubjectIds(history));
      } catch (historyError) {
        console.warn(
          "Random Test: failed to load recent subject history",
          historyError,
        );
        return new Set();
      }
    };

    const saveGeneratedRandomTestHistory = async (
      items: RandomTestReviewItem[],
    ): Promise<void> => {
      if (isMeaningOnlyVocabMode) {
        return;
      }

      try {
        await saveRandomTestSubjectHistoryEntry(
          items.map((item) => item.subjectId),
        );
      } catch (historyError) {
        console.warn(
          "Random Test: failed to save recent subject history",
          historyError,
        );
      }
    };

    let avoidRecentRandomTestSubjectIds = new Set<number>();

    try {
      setIsLoading(true);
      await clearSavedRandomTestSession();
      avoidRecentRandomTestSubjectIds = await loadRecentRandomTestSubjectIds();

      let assignmentsResponse: { data: Assignment[] } | null = null;
      try {
        assignmentsResponse = await getAllAssignmentsCached(apiToken, {
          srs_stages: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        });
      } catch {
        console.warn("Assignments fetch failed; will attempt offline-only mode");
      }

      const selectedListSubjectIds = await getSelectedListSubjectIdSet(
        config.selectedListIds,
      );

      if (
        assignmentsResponse &&
        assignmentsResponse.data.length === 0 &&
        config.selectedListIds.length === 0
      ) {
        Alert.alert(
          uiT("ui.no_learned_items_920cb61f"),
          uiT("ui.you_haven_t_learned_enough_items_yet_to_take_a_test_complete_some_e714c401"),
          [{ text: uiT("ui.ok_565339bc"), onPress: () => router.back() }],
        );
        return;
      }

      if (!assignmentsResponse) {
        throw new Error("Assignments unavailable");
      }

      const subjectIds = getExtraStudyCandidateSubjectIds(
        assignmentsResponse.data,
        config.selectedListIds,
        selectedListSubjectIds,
      );

      const allSubjects: ApiSubject[] = [];
      for (const subjectId of subjectIds) {
        const subject = await getSubjectById(subjectId);
        if (subject) {
          allSubjects.push(subject);
        }
      }

      const subjectIdToStage = new Map<number, number>();
      assignmentsResponse.data.forEach((assignment) => {
        subjectIdToStage.set(assignment.data.subject_id, assignment.data.srs_stage);
      });

      const filteredSubjects = allSubjects.filter((subject) => {
        if (
          isAudioVocabMode &&
          !createAudioVocabCard(subject, undefined, config.audioSource)
        )
          return false;
        if (
          !subjectMatchesExtraStudySrsStage(
            subject.id,
            subjectIdToStage,
            config.selectedListIds,
            selectedListSubjectIds,
            (stage) => isSrsStageAllowed(stage, config.srsGroups),
          )
        ) {
          return false;
        }

        const inLevelRange = subjectMatchesExtraStudyLevel(
          subject.data?.level,
          {
            useCustomLevelRange: config.useCustomLevelRange,
            minLevel: config.minLevel,
            maxLevel: config.maxLevel,
            selectedListIds: config.selectedListIds,
          },
        );

        if (
          isHiraganaVocabMeaningMode &&
          !getPrimaryReadingAsHiragana(subject)
        ) {
          return false;
        }

        switch (subject.object) {
          case "radical":
            return (
              config.includeRadicals &&
              inLevelRange &&
              subjectMatchesSelectedLists(
                subject.id,
                config.selectedListIds,
                selectedListSubjectIds,
              )
            );
          case "kanji":
            return (
              config.includeKanji &&
              inLevelRange &&
              subjectMatchesSelectedLists(
                subject.id,
                config.selectedListIds,
                selectedListSubjectIds,
              )
            );
          case "vocabulary":
            return (
              config.includeVocabulary &&
              inLevelRange &&
              subjectMatchesSelectedLists(
                subject.id,
                config.selectedListIds,
                selectedListSubjectIds,
              )
            );
          case "kana_vocabulary":
            return (
              config.includeKanaVocabulary &&
              inLevelRange &&
              subjectMatchesSelectedLists(
                subject.id,
                config.selectedListIds,
                selectedListSubjectIds,
              )
            );
          default:
            return false;
        }
      });

      if (filteredSubjects.length === 0) {
        Alert.alert(
          uiT("ui.no_matching_items_cef58eee"),
          isAudioVocabMode
            ? uiT("ui.dynamic_10623bbe809a", {value1: (config.audioSource === "sentence" ? uiT("ui.dynamic_148f5422f17d") : uiT("ui.dynamic_4ac726545826"))})
            : "No learned items match your selected criteria. Try expanding subject types or SRS stages.",
          [{ text: uiT("ui.ok_565339bc"), onPress: () => router.back() }],
        );
        return;
      }

      const shouldUseGroupedQuestions =
        ankiCardMode &&
        ankiGroupQuestions &&
        ankiCardModeScope === "both" &&
        config.includeMeaning &&
        config.includeReading;
      const queueBehavior: RandomQueueBehaviorOptions = {
        groupQuestions: shouldUseGroupedQuestions,
        backToBack: backToBackQuestions && !shouldUseGroupedQuestions,
        questionTypeOrderEnabled: reviewQuestionOrderEnabled,
        questionTypeOrder: preferredQuestionType,
        maxQuestionGap: REVIEW_MAX_QUESTION_GAP,
      };

      const { questions, reviewItems: generatedReviewItems } =
        buildRandomTestSession(filteredSubjects, config, queueBehavior, {
          avoidSubjectIds: avoidRecentRandomTestSubjectIds,
        });
      const reviewItemsWithSrs = generatedReviewItems.map((reviewItem) => ({
        ...reviewItem,
        srsStage: subjectIdToStage.get(reviewItem.subjectId),
      }));

      if (questions.length === 0) {
        Alert.alert(
          uiT("ui.no_questions_generated_1985c748"),
          uiT("ui.could_not_generate_questions_with_your_selected_criteria_please_a_b0022810"),
          [{ text: uiT("ui.ok_565339bc"), onPress: () => router.back() }],
        );
        return;
      }

      await saveGeneratedRandomTestHistory(reviewItemsWithSrs);
      initializeSessionState(questions, reviewItemsWithSrs);
    } catch (error) {
      console.warn("Falling back to offline subjects-only mode due to error:", error);

      try {
        const allSubjectsRaw = await getAllSubjects();
        const selectedListSubjectIds = await getSelectedListSubjectIdSet(
          config.selectedListIds,
        );

        if (!allSubjectsRaw || allSubjectsRaw.length === 0) {
          Alert.alert(
            uiT("ui.offline_a1794783"),
            uiT("ui.no_cached_subjects_available_please_open_the_app_online_once_to_c_2c650b66"),
            [{ text: uiT("ui.ok_565339bc"), onPress: () => router.back() }],
          );
          return;
        }

        const filteredSubjects = (allSubjectsRaw as ApiSubject[]).filter((subject) => {
          if (
            isAudioVocabMode &&
            !createAudioVocabCard(subject, undefined, config.audioSource)
          )
            return false;
          const inLevelRange = subjectMatchesExtraStudyLevel(
            subject.data?.level,
            {
              useCustomLevelRange: config.useCustomLevelRange,
              minLevel: config.minLevel,
              maxLevel: config.maxLevel,
              selectedListIds: config.selectedListIds,
            },
          );

          if (
            isHiraganaVocabMeaningMode &&
            !getPrimaryReadingAsHiragana(subject)
          ) {
            return false;
          }

          switch (subject.object) {
            case "radical":
              return (
                config.includeRadicals &&
                inLevelRange &&
                subjectMatchesSelectedLists(
                  subject.id,
                  config.selectedListIds,
                  selectedListSubjectIds,
                )
              );
            case "kanji":
              return (
                config.includeKanji &&
                inLevelRange &&
                subjectMatchesSelectedLists(
                  subject.id,
                  config.selectedListIds,
                  selectedListSubjectIds,
                )
              );
            case "vocabulary":
              return (
                config.includeVocabulary &&
                inLevelRange &&
                subjectMatchesSelectedLists(
                  subject.id,
                  config.selectedListIds,
                  selectedListSubjectIds,
                )
              );
            case "kana_vocabulary":
              return (
                config.includeKanaVocabulary &&
                inLevelRange &&
                subjectMatchesSelectedLists(
                  subject.id,
                  config.selectedListIds,
                  selectedListSubjectIds,
                )
              );
            default:
              return false;
          }
        });

        if (filteredSubjects.length === 0) {
          Alert.alert(uiT("ui.no_matching_items_cef58eee"), isAudioVocabMode
            ? uiT("ui.dynamic_9e6a935cb0d0", {value1: (config.audioSource === "sentence" ? uiT("ui.dynamic_148f5422f17d") : uiT("ui.dynamic_4ac726545826"))})
            : "No cached items match your selected criteria.", [
            { text: uiT("ui.ok_565339bc"), onPress: () => router.back() },
          ]);
          return;
        }

        const shouldUseGroupedQuestions =
          ankiCardMode &&
          ankiGroupQuestions &&
          ankiCardModeScope === "both" &&
          config.includeMeaning &&
          config.includeReading;
        const queueBehavior: RandomQueueBehaviorOptions = {
          groupQuestions: shouldUseGroupedQuestions,
          backToBack: backToBackQuestions && !shouldUseGroupedQuestions,
          questionTypeOrderEnabled: reviewQuestionOrderEnabled,
          questionTypeOrder: preferredQuestionType,
          maxQuestionGap: REVIEW_MAX_QUESTION_GAP,
        };

        const { questions, reviewItems: generatedReviewItems } =
          buildRandomTestSession(filteredSubjects, config, queueBehavior, {
            avoidSubjectIds: avoidRecentRandomTestSubjectIds,
          });

        if (questions.length === 0) {
          Alert.alert(
            uiT("ui.no_questions_generated_1985c748"),
            uiT("ui.could_not_generate_questions_offline_with_your_settings_e881cbe2"),
            [{ text: uiT("ui.ok_565339bc"), onPress: () => router.back() }],
          );
          return;
        }

        await saveGeneratedRandomTestHistory(generatedReviewItems);
        initializeSessionState(questions, generatedReviewItems);
      } catch (fallbackError) {
        console.error("Offline fallback failed:", fallbackError);
        Alert.alert(uiT("ui.error_54a0e8c1"), uiT("ui.failed_to_load_test_questions_7756232c"), [
          { text: uiT("ui.ok_565339bc"), onPress: () => router.back() },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [ankiCardMode, ankiCardModeScope, ankiGroupQuestions, apiToken, backToBackQuestions, config, isAuthLoading, isAudioVocabMode, isMeaningOnlyVocabMode, isHiraganaVocabMeaningMode, preferredQuestionType, reviewQuestionOrderEnabled, clearSavedRandomTestSession, initializeSessionState, ]);

  useEffect(() => {
    if (config && !hasRestoredSession) {
      loadTestQuestions();
    }
  }, [config, hasRestoredSession, loadTestQuestions]);

  const handleAnswer = (
    item: { id: number; subject: any },
    questionType: QuestionType,
    isCorrect: boolean,
    wasIncorrect: boolean,
    isGroupedAnswer: boolean = false,
  ) => {
    const subjectId = item.subject.id;

    setReviewItems((prev) =>
      prev.map((reviewItem) => {
        if (reviewItem.subjectId !== subjectId) {
          return reviewItem;
        }

        if (questionType === "meaning") {
          return {
            ...reviewItem,
            meaningDone: true,
            meaningCorrectlyAnswered: isCorrect,
            meaningIncorrect: isCorrect
              ? reviewItem.meaningIncorrect
              : reviewItem.meaningIncorrect + 1,
            meaningIncorrectCounted: wasIncorrect || !isCorrect,
          };
        }

        return {
          ...reviewItem,
          readingDone: true,
          readingCorrectlyAnswered: isCorrect,
          readingIncorrect: isCorrect
            ? reviewItem.readingIncorrect
            : reviewItem.readingIncorrect + 1,
          readingIncorrectCounted: wasIncorrect || !isCorrect,
        };
      }),
    );

    setProgressCounters((prev) => ({
      ...prev,
      answeredCount:
        !isGroupedAnswer || questionType === "meaning"
          ? prev.answeredCount + 1
          : prev.answeredCount,
      meaningAttempts:
        questionType === "meaning" ? prev.meaningAttempts + 1 : prev.meaningAttempts,
      readingAttempts:
        questionType === "reading" ? prev.readingAttempts + 1 : prev.readingAttempts,
      meaningCorrect:
        questionType === "meaning" && isCorrect
          ? prev.meaningCorrect + 1
          : prev.meaningCorrect,
      readingCorrect:
        questionType === "reading" && isCorrect
          ? prev.readingCorrect + 1
          : prev.readingCorrect,
      correctAnswersCount:
        isCorrect && (!isGroupedAnswer || questionType === "meaning")
          ? prev.correctAnswersCount + 1
          : prev.correctAnswersCount,
    }));

    if (!isGroupedAnswer || questionType === "reading") {
      if (currentQuestionIndex < testQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setIsTestComplete(true);
      }
    }
  };

  const handleSkip = useCallback(
    (_item: { id: number; subject: any }, _questionType: QuestionType) => {
      setTestQuestions((prevQuestions) => {
        if (
          currentQuestionIndex < 0 ||
          currentQuestionIndex >= prevQuestions.length ||
          prevQuestions.length <= 1
        ) {
          return prevQuestions;
        }

        const reordered = [...prevQuestions];
        const [skippedQuestion] = reordered.splice(currentQuestionIndex, 1);
        reordered.push(skippedQuestion);
        return reordered;
      });

      setIsTestComplete(false);
    },
    [currentQuestionIndex],
  );

  useEffect(() => {
    if (isTestComplete) {
      void clearSavedRandomTestSession();
    }
  }, [clearSavedRandomTestSession, isTestComplete]);

  const handleBackToDashboard = () => {
    void clearSavedRandomTestSession();
    router.dismissAll();
    router.replace("/");
  };

  const handleExit = () => {
    Alert.alert(
      uiT("ui.exit_test_d80c3862"),
      uiT("ui.want_to_continue_this_value_later_9a4cf9ac", {value1: (sessionLabel)}),
      [
        { text: uiT("ui.cancel_19766ed6"), style: "cancel" },
        {
          text: uiT("ui.continue_later_ba247ab0"),
          onPress: async () => {
            const wasSaved = await saveRandomTestSessionForLater();
            if (!wasSaved) {
              Alert.alert(uiT("ui.couldn_t_save_progress_7bbcd471"), uiT("ui.please_try_again_in_a_moment_7ba353b0"));
              return;
            }
            router.back();
          },
        },
        {
          text: uiT("ui.exit_d17d84a6"),
          style: "destructive",
          onPress: async () => {
            await clearSavedRandomTestSession();
            router.back();
          },
        },
      ],
    );
  };

  const completedItems = useMemo(
    () => countCompletedItems(reviewItems),
    [reviewItems],
  );

  const progress: RandomTestProgress = useMemo(
    () => ({
      current: progressCounters.answeredCount,
      total: reviewItems.length,
      meaningCorrect: progressCounters.meaningCorrect,
      readingCorrect: progressCounters.readingCorrect,
      totalItems: reviewItems.length,
      answeredCount: progressCounters.answeredCount,
      completedItems,
      meaningAttempts: progressCounters.meaningAttempts,
      readingAttempts: progressCounters.readingAttempts,
      correctAnswersCount: progressCounters.correctAnswersCount,
    }),
    [completedItems, progressCounters, reviewItems.length],
  );

  if (isLoading || isLoadingStudyMaterials) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
          <Text style={[styles.loadingText, { color: theme.textColor }]}>
            {isAudioVocabMode
              ? uiT("ui.preparing_your_audio_vocab_quiz_580e70c8")
              : isHiraganaVocabMeaningMode
                ? uiT("ui.preparing_your_hiragana_vocab_quiz_d738f24b")
                : uiT("ui.preparing_your_test_171d8e3e")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isTestComplete && !shouldRevealResults) {
    return <ExtraStudyCompletionTransition />;
  }

  if (isTestComplete) {
    return (
      <ReviewResultsScreen
        reviewItems={reviewItems as any}
        progress={progress as any}
        submittingResults={false}
        onBackToDashboard={handleBackToDashboard}
        secondaryActionLabel="Take Another Test"
        onSecondaryAction={() => router.replace(configRoute as any)}
      />
    );
  }

  if (testQuestions.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      >
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            {uiT("ui.no_test_questions_available_5053cbef")} </Text>
          <TouchableOpacity
            style={[styles.errorButton, { backgroundColor: theme.secondary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>{uiT("ui.go_back_b8d99df1")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = testQuestions[currentQuestionIndex];
  const audioVocabCard = isAudioVocabMode
    ? createAudioVocabCard(currentQuestion.subject, vocabularyAudioVoice, config?.audioSource)
    : null;
  const shouldUseGroupedQuestions =
    ankiCardMode &&
    ankiGroupQuestions &&
    ankiCardModeScope === "both" &&
    !!config?.includeMeaning &&
    !!config?.includeReading;
  const sessionProgress = {
    totalItems: reviewItems.length,
    currentItem: progress.answeredCount,
    completedCount: completedItems,
    correctAnswersCount: progress.correctAnswersCount,
  };
  const hiraganaMeaningPrompt =
    isHiraganaVocabMeaningMode && currentQuestion.questionType === "meaning"
      ? getPrimaryReadingAsHiragana(currentQuestion.subject) ?? undefined
      : undefined;
  const hiraganaMeaningContextHints =
    isHiraganaVocabMeaningMode && currentQuestion.questionType === "meaning"
      ? buildHiraganaMeaningContextHints(currentQuestion.subject)
      : undefined;

  return (
    <ReviewQuestionScreen
      item={{
        id: currentQuestion.id,
        subject: {
          id: currentQuestion.subject.id,
          object: currentQuestion.subject.object as
            | "radical"
            | "kanji"
            | "vocabulary"
            | "kana_vocabulary",
          data: {
            level: currentQuestion.subject.data.level,
            characters: currentQuestion.subject.data.characters,
            meanings: currentQuestion.subject.data.meanings.map((meaning) => ({
              meaning: meaning.meaning,
              primary: meaning.primary,
              accepted_answer: meaning.accepted_answer,
            })),
            readings: currentQuestion.subject.data.readings?.map((reading) => ({
              reading: reading.reading,
              primary: reading.primary,
              type: reading.type,
              accepted_answer: reading.accepted_answer,
            })),
            character_images:
              currentQuestion.subject.data.character_images || undefined,
            pronunciation_audios:
              currentQuestion.subject.data.pronunciation_audios || undefined,
          },
        },
      }}
      questionType={currentQuestion.questionType}
      studyMaterials={sessionStudyMaterials?.materials.get(
        currentQuestion.subject.id,
      )}
      onSynonymAdded={handleSynonymAdded}
      onAnswer={handleAnswer}
      onSkip={handleSkip}
      onExit={handleExit}
      showHeader={true}
      showBackgroundColor={true}
      totalItems={sessionProgress.totalItems}
      currentItem={sessionProgress.currentItem}
      completedCount={sessionProgress.completedCount}
      correctAnswersCount={sessionProgress.correctAnswersCount}
      forceDisableAnkiGrouping={!shouldUseGroupedQuestions}
      audioPromptReading={audioVocabCard?.reading}
      audioPrompt={
        isAudioVocabMode ? (
          <AudioVocabPrompt
            key={currentQuestion.id}
            subject={currentQuestion.subject}
            autoPlay={config?.autoPlayAudio !== false}
            sentence={audioVocabCard?.sentence?.ja}
          />
        ) : undefined
      }
      overridePromptText={hiraganaMeaningPrompt}
      overridePromptUsesJapaneseFont={Boolean(hiraganaMeaningPrompt)}
      contextSentencesHint={hiraganaMeaningContextHints}
      contextHintMaxItems={3}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  errorButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
