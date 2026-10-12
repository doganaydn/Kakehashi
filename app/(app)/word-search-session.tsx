import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WordSearchBoard from "../../src/components/word-search-board";
import { useSession } from "../../src/contexts/AuthContext";
import { useActivityTracking } from "../../src/hooks/useActivityTracking";
import {
  type Assignment,
  type Subject as ApiSubject,
  getAllAssignmentsCached,
} from "../../src/utils/api";
import { getAllSubjects, getSubjectById } from "../../src/utils/cache";
import {
  EXTRA_STUDY_SESSION_STORAGE_KEYS,
  clearExtraStudySessionState,
  loadExtraStudySessionState,
  saveExtraStudySessionState,
} from "../../src/utils/extraStudySessionPersistence";
import {
  getExtraStudyCandidateSubjectIds,
  getSelectedListSubjectIdSet,
  subjectMatchesExtraStudyLevel,
  subjectMatchesExtraStudySrsStage,
  subjectMatchesSelectedLists,
} from "../../src/utils/extraStudySubjectLists";
import { fontStyles } from "../../src/utils/fonts";
import * as Haptics from "../../src/utils/haptics";
import { getAssignmentsFromPermanentStorage } from "../../src/utils/permanentStorage";
import { useAuthStore } from "../../src/utils/store";
import { useTheme } from "../../src/utils/theme";
import {
  getWordSearchAllowedSrsStages,
  getWordSearchGridSize,
  sanitizeWordSearchConfig,
  type WordSearchConfig,
} from "../../src/utils/wordSearchConfig";
import {
  findWordSearchEntry,
  generateWordSearch,
  normalizeWordSearchReading,
  type WordSearchCandidate,
  type WordSearchCell,
  type WordSearchEntry,
  type WordSearchPuzzle,
} from "../../src/utils/wordSearchGenerator";

const SESSION_KEY = EXTRA_STUDY_SESSION_STORAGE_KEYS.WORD_SEARCH;
const SUCCESS_COLOR = "#20A464";

type SavedWordSearchSession = {
  savedAt: number;
  elapsedMs: number;
  config: WordSearchConfig;
  puzzle: WordSearchPuzzle;
  foundEntryIds: string[];
  foundPaths: Record<string, WordSearchCell[]>;
  hintedEntryIds: string[];
  mistakes: number;
};

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getPrimaryMeaning(subject: ApiSubject): string | null {
  const meanings = subject.data.meanings ?? [];
  const primary = meanings.find((meaning) => meaning.primary) ?? meanings[0];
  const value = primary?.meaning?.trim();
  return value || null;
}

function getPrimaryReading(subject: ApiSubject): string | null {
  const readings = subject.data.readings ?? [];
  const primary = readings.find((reading) => reading.primary) ?? readings[0];
  const value = primary?.reading?.trim();
  return value ? normalizeWordSearchReading(value) : null;
}

function buildCandidates(subjects: ApiSubject[]): WordSearchCandidate[] {
  return subjects.flatMap((subject) => {
    if (subject.object !== "vocabulary") {
      return [];
    }
    const written = subject.data.characters?.trim();
    const reading = getPrimaryReading(subject);
    const meaning = getPrimaryMeaning(subject);
    if (!written || !reading || !meaning) {
      return [];
    }
    return [
      {
        subjectId: subject.id,
        written,
        reading,
        meaning,
        level: subject.data.level,
      },
    ];
  });
}

async function loadCandidateSubjects(
  config: WordSearchConfig,
  apiToken: string | null,
  userLevel: number,
): Promise<ApiSubject[]> {
  const allowedStages = getWordSearchAllowedSrsStages(config);
  const [cachedSubjectData, cachedAssignmentData, selectedListSubjectIds] =
    await Promise.all([
      getAllSubjects(),
      getAssignmentsFromPermanentStorage({ ignoreTTL: true }),
      getSelectedListSubjectIdSet(config.selectedListIds),
    ]);
  const allSubjects = Array.isArray(cachedSubjectData)
    ? (cachedSubjectData as ApiSubject[])
    : [];
  let assignments = Array.isArray(cachedAssignmentData)
    ? (cachedAssignmentData as Assignment[])
    : [];

  if (assignments.length === 0 && apiToken) {
    try {
      const response = await getAllAssignmentsCached(apiToken, {
        srs_stages: Array.from(allowedStages),
      });
      assignments = response.data;
    } catch (error) {
      console.warn(
        "Word Search: couldn't refresh assignments; continuing offline",
        error,
      );
    }
  }

  const activeAssignments = assignments.filter(
    (assignment) =>
      !assignment.data.hidden &&
      Boolean(assignment.data.unlocked_at) &&
      assignment.data.srs_stage > 0,
  );
  const subjectIdToStage = new Map<number, number>(
    activeAssignments.map((assignment) => [
      assignment.data.subject_id,
      assignment.data.srs_stage,
    ]),
  );
  const candidateSubjectIds = getExtraStudyCandidateSubjectIds(
    activeAssignments,
    config.selectedListIds,
    selectedListSubjectIds,
  );
  const subjectById = new Map<number, ApiSubject>(
    allSubjects.map((subject) => [subject.id, subject]),
  );

  const missingSubjectIds = candidateSubjectIds.filter(
    (subjectId) => !subjectById.has(subjectId),
  );
  const missingSubjects = await Promise.all(
    missingSubjectIds.map((subjectId) => getSubjectById(subjectId)),
  );
  missingSubjects.forEach((subject, index) => {
    if (subject) {
      subjectById.set(missingSubjectIds[index], subject as ApiSubject);
    }
  });

  return candidateSubjectIds
    .map((subjectId) => subjectById.get(subjectId))
    .filter((subject): subject is ApiSubject => Boolean(subject))
    .filter((subject) =>
      subjectMatchesExtraStudySrsStage(
        subject.id,
        subjectIdToStage,
        config.selectedListIds,
        selectedListSubjectIds,
        (stage) => allowedStages.has(stage),
      ),
    )
    .filter((subject) =>
      subjectMatchesExtraStudyLevel(subject.data.level, {
        useCustomLevelRange: config.useCustomLevelRange,
        minLevel: config.minLevel,
        maxLevel: config.maxLevel,
        selectedListIds: config.selectedListIds,
        defaultMaxLevel: userLevel,
      }),
    )
    .filter((subject) =>
      subjectMatchesSelectedLists(
        subject.id,
        config.selectedListIds,
        selectedListSubjectIds,
      ),
    );
}

function WordSearchResults({
  puzzle,
  mistakes,
  elapsedMs,
  onPlayAgain,
}: {
  puzzle: WordSearchPuzzle;
  mistakes: number;
  elapsedMs: number;
  onPlayAgain: () => void;
}) {
  useInterfaceLanguage();
  const { theme } = useTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.resultsContent}
    >
      <View
        style={[styles.resultIcon, { backgroundColor: `${SUCCESS_COLOR}20` }]}
      >
        <Ionicons name="checkmark" size={30} color={SUCCESS_COLOR} />
      </View>
      <View style={styles.resultHeading}>
        <Text style={[styles.resultTitle, { color: theme.textColor }]}>{uiT("ui.found_them_all_402ea4de")}</Text>
        <Text style={[styles.resultSubtitle, { color: theme.textSecondary }]}>
          {uiT("ui.nice_work_connecting_each_clue_to_its_japanese_form_48e82806")} </Text>
      </View>

      <View style={styles.statsRow}>
        <View
          style={[
            styles.stat,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.statValue, { color: theme.textColor }]}>
            {puzzle.entries.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{uiT("ui.words_0a8be89a")}</Text>
        </View>
        <View
          style={[
            styles.stat,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.statValue, { color: theme.textColor }]}>
            {mistakes}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{uiT("ui.misses_350cf2c3")}</Text>
        </View>
        <View
          style={[
            styles.stat,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.statValue, { color: theme.textColor }]}>
            {formatElapsed(elapsedMs)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{uiT("ui.time_33b93476")}</Text>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={[styles.reviewTitle, { color: theme.textColor }]}>{uiT("ui.puzzle_review_95e00a68")}</Text>
        {puzzle.entries.map((entry) => (
          <View
            key={entry.id}
            style={[styles.reviewRow, { borderBottomColor: theme.border }]}
          >
            <View style={styles.reviewJapanese}>
              <Text
                selectable
                style={[
                  styles.reviewClue,
                  fontStyles.japaneseBold,
                  { color: theme.textColor },
                ]}
              >
                {entry.clue}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={theme.textSecondary} />
              <Text
                selectable
                style={[
                  styles.reviewAnswer,
                  fontStyles.japaneseBold,
                  { color: SUCCESS_COLOR },
                ]}
              >
                {entry.answer}
              </Text>
            </View>
            <Text selectable style={[styles.reviewMeaning, { color: theme.textSecondary }]}>
              {entry.meaning}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={onPlayAgain}
        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
      >
        <Ionicons name="refresh" size={20} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>{uiT("ui.new_puzzle_847af11c")}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => router.replace("/word-search-config" as any)}
        style={[styles.secondaryButton, { borderColor: theme.border }]}
      >
        <Text style={[styles.secondaryButtonText, { color: theme.textColor }]}>
          {uiT("ui.change_settings_081290d4")} </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function WordSearchSessionContent() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const { apiToken, userData } = useAuthStore();
  const userLevel = userData?.level ?? 60;
  const { isLoading: isAuthLoading } = useSession();
  const params = useLocalSearchParams();
  const [config, setConfig] = useState<WordSearchConfig | null>(null);
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle | null>(null);
  const [foundEntryIds, setFoundEntryIds] = useState<string[]>([]);
  const [foundPaths, setFoundPaths] = useState<Record<string, WordSearchCell[]>>({});
  const [hintedEntryIds, setHintedEntryIds] = useState<string[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [incorrectPath, setIncorrectPath] = useState<WordSearchCell[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "Drag across a word, or tap its first and last letters.",
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [completedElapsedMs, setCompletedElapsedMs] = useState(0);
  const initializedRef = useRef(false);
  const incorrectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useActivityTracking("word_search", {
    enabled: !isLoading && !isComplete && Boolean(puzzle),
  });

  const foundIdSet = useMemo(() => new Set(foundEntryIds), [foundEntryIds]);
  const hintedIdSet = useMemo(() => new Set(hintedEntryIds), [hintedEntryIds]);
  const activeEntry = useMemo<WordSearchEntry | null>(() => {
    if (!puzzle) {
      return null;
    }
    const requested = puzzle.entries.find(
      (entry) => entry.id === activeEntryId && !foundIdSet.has(entry.id),
    );
    return requested ?? puzzle.entries.find((entry) => !foundIdSet.has(entry.id)) ?? null;
  }, [activeEntryId, foundIdSet, puzzle]);

  const resetPuzzleState = useCallback((nextPuzzle: WordSearchPuzzle) => {
    setPuzzle(nextPuzzle);
    setFoundEntryIds([]);
    setFoundPaths({});
    setHintedEntryIds([]);
    setActiveEntryId(nextPuzzle.entries[0]?.id ?? null);
    setIncorrectPath([]);
    setMistakes(0);
    setStatusMessage("Drag across a word, or tap its first and last letters.");
    setStartedAt(Date.now());
    setCompletedElapsedMs(0);
    setIsComplete(false);
    setErrorMessage(null);
  }, []);

  const buildPuzzle = useCallback(
    async (nextConfig: WordSearchConfig) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const subjects = await loadCandidateSubjects(
          nextConfig,
          apiToken,
          userLevel,
        );
        const candidates = buildCandidates(subjects);
        const built = generateWordSearch(candidates, {
          direction: nextConfig.direction,
          size: getWordSearchGridSize(nextConfig.wordCount),
          wordCount: nextConfig.wordCount,
          seed: Date.now(),
        });
        if (built.entries.length < 3) {
          throw new Error(
            "Not enough matching vocabulary to build this puzzle. Try more SRS stages, levels, or another subject list.",
          );
        }
        setConfig(nextConfig);
        resetPuzzleState(built);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "The puzzle couldn't be built. Please try again.";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    },
    [apiToken, resetPuzzleState, userLevel],
  );

  useEffect(() => {
    if (isAuthLoading || initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    let mounted = true;

    const initialize = async () => {
      try {
        if (params.resume === "true") {
          const saved = await loadExtraStudySessionState<SavedWordSearchSession>(
            SESSION_KEY,
          );
          if (
            saved?.config &&
            saved.puzzle?.entries?.length &&
            Array.isArray(saved.puzzle.grid)
          ) {
            if (!mounted) {
              return;
            }
            const restoredConfig = sanitizeWordSearchConfig(
              saved.config,
              userLevel,
            );
            setConfig(restoredConfig);
            setPuzzle(saved.puzzle);
            setFoundEntryIds(saved.foundEntryIds ?? []);
            setFoundPaths(saved.foundPaths ?? {});
            setHintedEntryIds(saved.hintedEntryIds ?? []);
            setMistakes(saved.mistakes ?? 0);
            setActiveEntryId(
              saved.puzzle.entries.find(
                (entry) => !(saved.foundEntryIds ?? []).includes(entry.id),
              )?.id ?? null,
            );
            setStartedAt(Date.now() - Math.max(0, saved.elapsedMs ?? 0));
            setStatusMessage("Puzzle restored. Pick up where you left off.");
            setIsLoading(false);
            return;
          }
          await clearExtraStudySessionState(SESSION_KEY);
        }

        const sessionId =
          typeof params.sessionId === "string" ? params.sessionId : null;
        if (!sessionId) {
          throw new Error("That puzzle configuration is no longer available.");
        }
        const rawConfig = await AsyncStorage.getItem(
          `word_search_config_${sessionId}`,
        );
        await AsyncStorage.removeItem(`word_search_config_${sessionId}`);
        if (!rawConfig) {
          throw new Error("That puzzle configuration is no longer available.");
        }
        const parsedConfig = JSON.parse(rawConfig) as Partial<WordSearchConfig>;
        if (mounted) {
          await buildPuzzle(sanitizeWordSearchConfig(parsedConfig, userLevel));
        }
      } catch (error) {
        if (!mounted) {
          return;
        }
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The puzzle couldn't be loaded.",
        );
        setIsLoading(false);
      }
    };

    void initialize();
    return () => {
      mounted = false;
    };
  }, [buildPuzzle, isAuthLoading, params.resume, params.sessionId, userLevel]);

  const persistSession = useCallback(async () => {
    if (!config || !puzzle || isComplete) {
      return;
    }
    await saveExtraStudySessionState<SavedWordSearchSession>(SESSION_KEY, {
      savedAt: Date.now(),
      elapsedMs: Math.max(0, Date.now() - startedAt),
      config,
      puzzle,
      foundEntryIds,
      foundPaths,
      hintedEntryIds,
      mistakes,
    });
  }, [
    config,
    foundEntryIds,
    foundPaths,
    hintedEntryIds,
    isComplete,
    mistakes,
    puzzle,
    startedAt,
  ]);

  useEffect(() => {
    if (!puzzle || isLoading || isComplete) {
      return;
    }
    const timeout = setTimeout(() => void persistSession(), 160);
    return () => clearTimeout(timeout);
  }, [
    foundEntryIds,
    foundPaths,
    hintedEntryIds,
    isComplete,
    isLoading,
    mistakes,
    persistSession,
    puzzle,
  ]);

  useEffect(
    () => () => {
      if (incorrectTimeoutRef.current) {
        clearTimeout(incorrectTimeoutRef.current);
      }
    },
    [],
  );

  const handleSelection = useCallback(
    (path: WordSearchCell[]) => {
      if (!puzzle || isComplete) {
        return;
      }
      const match = findWordSearchEntry(puzzle, path, foundIdSet);
      if (!match) {
        setMistakes((current) => current + 1);
        setIncorrectPath(path);
        setStatusMessage("That line isn't one of the remaining words.");
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (incorrectTimeoutRef.current) {
          clearTimeout(incorrectTimeoutRef.current);
        }
        incorrectTimeoutRef.current = setTimeout(
          () => setIncorrectPath([]),
          520,
        );
        return;
      }

      const nextFoundIds = [...foundEntryIds, match.id];
      setFoundEntryIds(nextFoundIds);
      setFoundPaths((current) => ({ ...current, [match.id]: path }));
      setStatusMessage(`${match.clue} found — ${match.meaning}.`);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const nextEntry = puzzle.entries.find(
        (entry) => !nextFoundIds.includes(entry.id),
      );
      setActiveEntryId(nextEntry?.id ?? null);
      if (nextFoundIds.length === puzzle.entries.length) {
        const elapsed = Math.max(0, Date.now() - startedAt);
        setCompletedElapsedMs(elapsed);
        setIsComplete(true);
        void clearExtraStudySessionState(SESSION_KEY);
      }
    },
    [foundEntryIds, foundIdSet, isComplete, puzzle, startedAt],
  );

  const useHint = () => {
    if (!activeEntry || hintedIdSet.has(activeEntry.id)) {
      return;
    }
    setHintedEntryIds((current) => [...current, activeEntry.id]);
    setStatusMessage(
      uiT("ui.dynamic_d7cc596108f2", {value1: (activeEntry.answer.charAt(0))}),
    );
    void Haptics.selectionAsync();
  };

  const requestExit = () => {
    if (!puzzle || isComplete) {
      router.back();
      return;
    }
    Alert.alert(uiT("ui.leave_word_search_e4e66b46"), uiT("ui.your_progress_will_be_saved_acb1edc3"), [
      { text: uiT("ui.keep_playing_83a87a71"), style: "cancel" },
      {
        text: uiT("ui.save_leave_78b0905a"),
        onPress: () => {
          void persistSession().finally(() => router.back());
        },
      },
    ]);
  };

  const headerOptions = {
    headerShown: true,
    title: uiT("ui.word_search_2a17a96d"),
    headerBackVisible: false,
    headerTintColor: theme.textColor,
    headerStyle: { backgroundColor: theme.backgroundColor },
    headerShadowVisible: false,
    headerLeft: () => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={uiT("ui.back_76900f1b")}
        hitSlop={12}
        onPress={requestExit}
        style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
      >
        <Ionicons name="arrow-back" size={24} color={theme.textColor} />
      </Pressable>
    ),
  } as const;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundColor }]}>
        <Stack.Screen options={headerOptions} />
        <StatusBar style={theme.statusBarStyle} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingTitle, { color: theme.textColor }]}>
          {uiT("ui.building_your_puzzle_77295ae9")} </Text>
        <Text style={[styles.loadingSubtitle, { color: theme.textSecondary }]}>
          {uiT("ui.choosing_learned_words_that_fit_comfortably_on_screen_f2817079")} </Text>
      </View>
    );
  }

  if (errorMessage || !puzzle || !config) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundColor }]}>
        <Stack.Screen options={headerOptions} />
        <StatusBar style={theme.statusBarStyle} />
        <View style={[styles.errorIcon, { backgroundColor: `${theme.error}18` }]}>
          <Ionicons name="alert-circle-outline" size={30} color={theme.error} />
        </View>
        <Text style={[styles.loadingTitle, { color: theme.textColor }]}>
          {uiT("ui.couldn_t_build_this_puzzle_a9dd6835")} </Text>
        <Text selectable style={[styles.loadingSubtitle, { color: theme.textSecondary }]}>
          {errorMessage ?? uiT("ui.please_change_the_filters_and_try_again_8cb27921")}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/word-search-config" as any)}
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.primaryButtonText}>{uiT("ui.change_settings_081290d4")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isComplete) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.backgroundColor }]}>
        <Stack.Screen options={headerOptions} />
        <StatusBar style={theme.statusBarStyle} />
        <WordSearchResults
          puzzle={puzzle}
          mistakes={mistakes}
          elapsedMs={completedElapsedMs}
          onPlayAgain={() => void buildPuzzle(config)}
        />
      </View>
    );
  }

  const foundPathList = Object.values(foundPaths);
  const hintCell =
    activeEntry && hintedIdSet.has(activeEntry.id) ? activeEntry.path[0] : null;
  const progress = foundEntryIds.length / Math.max(1, puzzle.entries.length);

  return (
    <View style={[styles.screen, { backgroundColor: theme.backgroundColor }]}>
      <Stack.Screen options={headerOptions} />
      <StatusBar style={theme.statusBarStyle} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        scrollEnabled={!isDragging}
        contentContainerStyle={styles.gameContent}
      >
        <View style={styles.progressHeader}>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {foundEntryIds.length} {uiT("ui.of_28391d3b")} {puzzle.entries.length} {uiT("ui.found_bcc649cf")} </Text>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {config.direction === "kanji-to-kana" ? uiT("ui.find_kana_357856c9") : uiT("ui.find_kanji_de853257")}
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: SUCCESS_COLOR, width: `${progress * 100}%` },
            ]}
          />
        </View>

        {activeEntry ? (
          <View
            style={[
              styles.activeClue,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
            ]}
          >
            <View style={styles.activeClueCopy}>
              <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
                {config.direction === "kanji-to-kana"
                  ? uiT("ui.find_the_reading_fb14a93f")
                  : uiT("ui.find_the_written_word_ad296eed")}
              </Text>
              <Text
                selectable
                style={[
                  styles.clueText,
                  fontStyles.japaneseBold,
                  { color: theme.textColor },
                ]}
              >
                {activeEntry.clue}
              </Text>
              <Text selectable style={[styles.clueMeaning, { color: theme.textSecondary }]}>
                {activeEntry.meaning}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={uiT("ui.reveal_first_letter_hint_f56ebca4")}
              disabled={hintedIdSet.has(activeEntry.id)}
              onPress={useHint}
              style={[
                styles.hintButton,
                {
                  backgroundColor: hintedIdSet.has(activeEntry.id)
                    ? `${SUCCESS_COLOR}18`
                    : `${theme.accent}18`,
                },
              ]}
            >
              <Ionicons
                name={hintedIdSet.has(activeEntry.id) ? "checkmark" : "bulb-outline"}
                size={21}
                color={hintedIdSet.has(activeEntry.id) ? SUCCESS_COLOR : theme.accent}
              />
            </TouchableOpacity>
          </View>
        ) : null}

        <WordSearchBoard
          puzzle={puzzle}
          foundPaths={foundPathList}
          hintCell={hintCell}
          incorrectPath={incorrectPath}
          onSelectPath={handleSelection}
          onDragStateChange={setIsDragging}
        />

        <Text
          accessibilityLiveRegion="polite"
          style={[
            styles.status,
            {
              color: incorrectPath.length > 0 ? theme.error : theme.textSecondary,
            },
          ]}
        >
          {statusMessage}
        </Text>

        <View style={styles.clueSectionHeader}>
          <Text style={[styles.clueSectionTitle, { color: theme.textColor }]}>{uiT("ui.clues_86aa514b")}</Text>
          <Text style={[styles.clueSectionHint, { color: theme.textSecondary }]}>
            {uiT("ui.tap_to_focus_6888f5c1")} </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.clueRail}
        >
          {puzzle.entries.map((entry) => {
            const found = foundIdSet.has(entry.id);
            const active = activeEntry?.id === entry.id;
            return (
              <TouchableOpacity
                key={entry.id}
                accessibilityRole="button"
                accessibilityLabel={`${entry.clue}, ${entry.meaning}${found ? ", found" : ""}`}
                accessibilityState={{ selected: active, disabled: found }}
                disabled={found}
                onPress={() => setActiveEntryId(entry.id)}
                activeOpacity={0.8}
                style={[
                  styles.clueChip,
                  {
                    backgroundColor: found
                      ? `${SUCCESS_COLOR}14`
                      : active
                        ? `${theme.primary}14`
                        : theme.cardBackground,
                    borderColor: found
                      ? SUCCESS_COLOR
                      : active
                        ? theme.primary
                        : theme.border,
                  },
                ]}
              >
                <View style={styles.clueChipHeader}>
                  <Text
                    style={[
                      styles.clueChipText,
                      fontStyles.japaneseBold,
                      {
                        color: found
                          ? SUCCESS_COLOR
                          : active
                            ? theme.primary
                            : theme.textColor,
                      },
                    ]}
                  >
                    {entry.clue}
                  </Text>
                  {found ? (
                    <Ionicons name="checkmark-circle" size={16} color={SUCCESS_COLOR} />
                  ) : null}
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.clueChipMeaning, { color: theme.textSecondary }]}
                >
                  {entry.meaning}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.mistakeRow}>
          <Ionicons name="flag-outline" size={15} color={theme.textSecondary} />
          <Text style={[styles.mistakeText, { color: theme.textSecondary }]}>
            {mistakes} {mistakes === 1 ? uiT("ui.miss_80688fc3") : uiT("ui.misses_b36708c7")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default function WordSearchSessionScreen() {
  useInterfaceLanguage();
  return <WordSearchSessionContent />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  loadingTitle: { fontSize: 19, fontWeight: "700", textAlign: "center" },
  loadingSubtitle: { fontSize: 14, lineHeight: 20, maxWidth: 320, textAlign: "center" },
  errorIcon: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  gameContent: { gap: 13, padding: 16, paddingBottom: 28 },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: { fontSize: 12, fontVariant: ["tabular-nums"], fontWeight: "700" },
  progressTrack: { borderRadius: 999, height: 5, overflow: "hidden" },
  progressFill: { borderRadius: 999, height: "100%" },
  activeClue: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    minHeight: 104,
    padding: 15,
  },
  activeClueCopy: { flex: 1, gap: 2 },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  clueText: { fontSize: 29, lineHeight: 38 },
  clueMeaning: { fontSize: 14 },
  hintButton: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 12,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  status: { fontSize: 13, lineHeight: 18, minHeight: 36, textAlign: "center" },
  clueSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clueSectionTitle: { fontSize: 16, fontWeight: "700" },
  clueSectionHint: { fontSize: 12 },
  clueRail: { gap: 9, paddingRight: 16 },
  clueChip: {
    borderCurve: "continuous",
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    minHeight: 62,
    padding: 10,
    width: 126,
  },
  clueChipHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "space-between",
  },
  clueChipText: { flex: 1, fontSize: 17, ...fontStyles.japaneseChip },
  clueChipMeaning: { fontSize: 11 },
  mistakeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
  },
  mistakeText: { fontSize: 12, fontVariant: ["tabular-nums"] },
  resultsContent: { gap: 22, padding: 20, paddingBottom: 36 },
  resultIcon: {
    alignItems: "center",
    alignSelf: "center",
    borderCurve: "continuous",
    borderRadius: 20,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  resultHeading: { gap: 5 },
  resultTitle: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  resultSubtitle: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  statsRow: { flexDirection: "row", gap: 8 },
  stat: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 2,
    minHeight: 72,
    justifyContent: "center",
  },
  statValue: { fontSize: 18, fontVariant: ["tabular-nums"], fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600" },
  reviewSection: { gap: 0 },
  reviewTitle: { fontSize: 17, fontWeight: "700", paddingBottom: 8 },
  reviewRow: { borderBottomWidth: StyleSheet.hairlineWidth, gap: 4, paddingVertical: 12 },
  reviewJapanese: { alignItems: "center", flexDirection: "row", gap: 8 },
  reviewClue: { fontSize: 18 },
  reviewAnswer: { fontSize: 18 },
  reviewMeaning: { fontSize: 13 },
  primaryButton: {
    alignItems: "center",
    alignSelf: "stretch",
    borderCurve: "continuous",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: "700" },
});
