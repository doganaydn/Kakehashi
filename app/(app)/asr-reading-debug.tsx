import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  convertKatakanaToHiragana,
  convertRomajiToHiragana,
} from "../../src/utils/answerChecker";
import { getAllSubjects } from "../../src/utils/cache";
import { fontStyles } from "../../src/utils/fonts";
import { useAuthStore } from "../../src/utils/store";
import { useTheme } from "../../src/utils/theme";

type DebugAlternative = {
  transcript: string;
  normalized: string;
  lookupKey: string;
  wkReadings: string[];
  composedReadingsPreview: string[];
  composedReadingsTotal: number;
  composedReadingsCapped: boolean;
  directKanaMatch: boolean;
  wkMapMatch: boolean;
  composedKanjiMatch: boolean;
  expectedKanjiMatch: boolean;
  readingMatchSources: ("kana-direct" | "wk-map" | "kanji-composed")[];
  bestKanaCandidate: string;
  bestKanaSource: "none" | "kana-direct" | "wk-map" | "kanji-composed";
  bestKanaMatchesExpectedReading: boolean;
  matchMethod: "none" | "kana-direct" | "wk-map" | "kanji-composed" | "multiple";
  confidence: number;
  isExpected: boolean;
};

type LiveKanaCandidate = {
  kana: string;
  probability: number;
};

type DebugResultEvent = {
  id: string;
  isFinal: boolean;
  createdAt: number;
  alternatives: DebugAlternative[];
};

const MAX_ALTERNATIVES = 10;
const MAX_COMPOSED_READING_CANDIDATES = 1024;
const COMPOSED_READING_PREVIEW_LIMIT = 20;
const KANJI_CHARACTER_REGEX = /[\u3400-\u4DBF\u4E00-\u9FFF]/;
const KANA_CHARACTER_REGEX = /[\u3040-\u309F\u30A0-\u30FF]/;

const TRANSCRIPT_PUNCTUATION_REGEX =
  /[。、，,．\.!?！？:：;；'"`´「」『』（）\(\)\[\]【】{}…・]/g;

function formatConfidence(confidence: number): string {
  if (confidence < 0) {
    return "n/a";
  }
  return `${Math.round(confidence * 100)}%`;
}

function compactJapaneseText(text: string): string {
  return text
    .normalize("NFKC")
    .trim()
    .replace(TRANSCRIPT_PUNCTUATION_REGEX, "")
    .replace(/\s+/g, "");
}

function matchesJapaneseAnswer(input: string, expected: string): boolean {
  return (
    input === expected ||
    input.replace(/^〜/, "") === expected.replace(/^〜/, "")
  );
}

export default function AsrReadingDebugScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const { userData } = useAuthStore();
  const router = useRouter();

  const isAuthorized = userData?.username === "Portego";

  const supportsOnDeviceRecognition = useMemo(() => {
    try {
      return ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
    } catch {
      return false;
    }
  }, []);

  const [expectedReading, setExpectedReading] = useState("");
  const [expectedKanji, setExpectedKanji] = useState("");
  const [useOnDeviceRecognition, setUseOnDeviceRecognition] = useState(
    supportsOnDeviceRecognition,
  );
  const [isRecognitionAvailable, setIsRecognitionAvailable] = useState(true);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [liveKanaProbability, setLiveKanaProbability] = useState<number | null>(
    null,
  );
  const [liveKanaCandidates, setLiveKanaCandidates] = useState<
    LiveKanaCandidate[]
  >([]);
  const [latestAlternatives, setLatestAlternatives] = useState<
    DebugAlternative[]
  >([]);
  const [resultHistory, setResultHistory] = useState<DebugResultEvent[]>([]);
  const [wkReadingMap, setWkReadingMap] = useState<Record<string, string[]>>({});
  const [wkSingleKanjiReadingMap, setWkSingleKanjiReadingMap] = useState<
    Record<string, string[]>
  >({});
  const [wkSubjectCount, setWkSubjectCount] = useState(0);
  const [wkReadingMapEntryCount, setWkReadingMapEntryCount] = useState(0);
  const [wkReadingMapReadingCount, setWkReadingMapReadingCount] = useState(0);
  const [wkSingleKanjiEntryCount, setWkSingleKanjiEntryCount] = useState(0);
  const [isWkReadingMapLoading, setIsWkReadingMapLoading] = useState(false);
  const [wkReadingMapError, setWkReadingMapError] = useState<string | null>(
    null,
  );

  const normalizeJapaneseReading = useCallback((text: string): string => {
    const compactTranscript = compactJapaneseText(text);
    if (!compactTranscript) {
      return "";
    }

    const hiraganaCandidate = convertKatakanaToHiragana(compactTranscript);
    if (/[A-Za-z]/.test(hiraganaCandidate)) {
      return convertRomajiToHiragana(hiraganaCandidate);
    }

    return hiraganaCandidate;
  }, []);

  const acceptedReadings = useMemo(
    () =>
      Array.from(
        new Set(
          expectedReading
            .split(/[,\n、\s]+/)
            .map((reading) => normalizeJapaneseReading(reading))
            .filter((reading) => reading.length > 0),
        ),
      ),
    [expectedReading, normalizeJapaneseReading],
  );

  const normalizedExpectedReading = acceptedReadings[0] ?? "";
  const acceptedReadingSet = useMemo(
    () => new Set(acceptedReadings),
    [acceptedReadings],
  );
  const normalizedExpectedKanji = useMemo(
    () => compactJapaneseText(expectedKanji),
    [expectedKanji],
  );

  const buildWkReadingMaps = useCallback(
    (
      subjects: any[],
    ): {
      wordReadings: Record<string, string[]>;
      singleKanjiReadings: Record<string, string[]>;
    } => {
      const charactersToReadings = new Map<string, Set<string>>();
      const kanjiToReadings = new Map<string, Set<string>>();

      for (const subject of subjects) {
        const subjectCharactersRaw =
          typeof subject?.data?.characters === "string"
            ? subject.data.characters
            : "";
        const subjectCharacters = compactJapaneseText(subjectCharactersRaw);
        if (!subjectCharacters) {
          continue;
        }

        const subjectReadings = Array.isArray(subject?.data?.readings)
          ? subject.data.readings
          : [];
        if (subjectReadings.length === 0) {
          continue;
        }

        if (!charactersToReadings.has(subjectCharacters)) {
          charactersToReadings.set(subjectCharacters, new Set<string>());
        }

        const wordReadingsSet = charactersToReadings.get(subjectCharacters);
        if (!wordReadingsSet) {
          continue;
        }

        for (const readingEntry of subjectReadings) {
          const readingRaw =
            typeof readingEntry?.reading === "string" ? readingEntry.reading : "";
          const normalizedReading = convertKatakanaToHiragana(
            compactJapaneseText(readingRaw),
          );
          if (normalizedReading) {
            wordReadingsSet.add(normalizedReading);
          }
        }

        if (subject.object !== "kanji") {
          continue;
        }

        if (
          subjectCharacters.length !== 1 ||
          !KANJI_CHARACTER_REGEX.test(subjectCharacters)
        ) {
          continue;
        }

        if (!kanjiToReadings.has(subjectCharacters)) {
          kanjiToReadings.set(subjectCharacters, new Set<string>());
        }

        const kanjiReadingsSet = kanjiToReadings.get(subjectCharacters);
        if (!kanjiReadingsSet) {
          continue;
        }

        for (const readingEntry of subjectReadings) {
          const readingRaw =
            typeof readingEntry?.reading === "string" ? readingEntry.reading : "";
          const normalizedReading = convertKatakanaToHiragana(
            compactJapaneseText(readingRaw),
          );
          if (normalizedReading) {
            kanjiReadingsSet.add(normalizedReading);
          }
        }
      }

      const wordReadings: Record<string, string[]> = {};
      charactersToReadings.forEach((readings, characters) => {
        wordReadings[characters] = Array.from(readings);
      });

      const singleKanjiReadings: Record<string, string[]> = {};
      kanjiToReadings.forEach((readings, kanji) => {
        singleKanjiReadings[kanji] = Array.from(readings);
      });

      return {
        wordReadings,
        singleKanjiReadings,
      };
    },
    [],
  );

  const buildComposedReadingsFromKanji = useCallback(
    (
      lookupKey: string,
    ): { readings: string[]; total: number; capped: boolean } => {
      if (!lookupKey || !KANJI_CHARACTER_REGEX.test(lookupKey)) {
        return {
          readings: [],
          total: 0,
          capped: false,
        };
      }

      const tokens = Array.from(lookupKey);
      let combinations = new Set<string>([""]);
      let capped = false;

      for (const token of tokens) {
        let tokenReadings: string[] = [];

        if (KANJI_CHARACTER_REGEX.test(token)) {
          tokenReadings = wkSingleKanjiReadingMap[token] ?? [];
        } else if (KANA_CHARACTER_REGEX.test(token)) {
          const normalizedKana = normalizeJapaneseReading(token);
          tokenReadings = normalizedKana ? [normalizedKana] : [];
        } else {
          tokenReadings = [token];
        }

        tokenReadings = Array.from(new Set(tokenReadings));

        if (tokenReadings.length === 0) {
          return {
            readings: [],
            total: 0,
            capped: false,
          };
        }

        const nextCombinations = new Set<string>();
        outer: for (const prefix of combinations) {
          for (const reading of tokenReadings) {
            nextCombinations.add(`${prefix}${reading}`);
            if (nextCombinations.size >= MAX_COMPOSED_READING_CANDIDATES) {
              capped = true;
              break outer;
            }
          }
        }

        combinations = nextCombinations;
        if (combinations.size === 0) {
          return {
            readings: [],
            total: 0,
            capped,
          };
        }
      }

      const readings = Array.from(combinations);
      return {
        readings,
        total: readings.length,
        capped,
      };
    },
    [normalizeJapaneseReading, wkSingleKanjiReadingMap],
  );

  const selectBestKanaCandidate = useCallback(
    (params: {
      directKanaCandidate: string;
      wkReadings: string[];
      composedReadings: string[];
    }): {
      bestKanaCandidate: string;
      bestKanaSource: "none" | "kana-direct" | "wk-map" | "kanji-composed";
      bestKanaMatchesExpectedReading: boolean;
    } => {
      const candidateScores = new Map<
        string,
        { score: number; source: "kana-direct" | "wk-map" | "kanji-composed" }
      >();

      const upsertCandidate = (
        kana: string,
        source: "kana-direct" | "wk-map" | "kanji-composed",
        baseScore: number,
      ) => {
        if (!kana) {
          return;
        }

        let score = baseScore;
        if (normalizedExpectedReading && kana === normalizedExpectedReading) {
          score += 3;
        } else if (acceptedReadingSet.has(kana)) {
          score += 1.5;
        }

        const existing = candidateScores.get(kana);
        if (!existing || score > existing.score) {
          candidateScores.set(kana, { score, source });
        }
      };

      if (params.directKanaCandidate) {
        upsertCandidate(params.directKanaCandidate, "kana-direct", 1.2);
      }
      for (const reading of params.wkReadings) {
        upsertCandidate(reading, "wk-map", 1.0);
      }
      for (const reading of params.composedReadings) {
        upsertCandidate(reading, "kanji-composed", 0.8);
      }

      let bestKanaCandidate = "";
      let bestKanaSource: "none" | "kana-direct" | "wk-map" | "kanji-composed" =
        "none";
      let bestScore = -1;

      candidateScores.forEach((value, kana) => {
        if (value.score > bestScore) {
          bestScore = value.score;
          bestKanaCandidate = kana;
          bestKanaSource = value.source;
        }
      });

      return {
        bestKanaCandidate,
        bestKanaSource,
        bestKanaMatchesExpectedReading:
          bestKanaCandidate.length > 0 &&
          acceptedReadingSet.has(bestKanaCandidate),
      };
    },
    [acceptedReadingSet, normalizedExpectedReading],
  );

  const selectMostProbableLiveKana = useCallback(
    (
      alternatives: DebugAlternative[],
    ): {
      kana: string;
      probability: number | null;
      topCandidates: LiveKanaCandidate[];
    } => {
      const kanaScores = new Map<string, number>();

      alternatives.forEach((alternative, index) => {
        const kana = alternative.bestKanaCandidate;
        if (!kana) {
          return;
        }

        const confidenceWeight =
          alternative.confidence >= 0
            ? alternative.confidence
            : Math.max(0.1, 0.35 - index * 0.05);
        const expectedBoost =
          normalizedExpectedReading && kana === normalizedExpectedReading
            ? 1.0
            : 0;
        const sourceBoost =
          alternative.bestKanaSource === "kana-direct"
            ? 0.2
            : alternative.bestKanaSource === "wk-map"
              ? 0.15
              : alternative.bestKanaSource === "kanji-composed"
                ? 0.1
                : 0;

        const finalScore = confidenceWeight + expectedBoost + sourceBoost;
        kanaScores.set(kana, (kanaScores.get(kana) ?? 0) + finalScore);
      });

      const totalScore = Array.from(kanaScores.values()).reduce(
        (sum, value) => sum + value,
        0,
      );

      const topCandidates = Array.from(kanaScores.entries())
        .map(([kana, score]) => ({
          kana,
          probability: totalScore > 0 ? score / totalScore : 0,
        }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 5);

      const best = topCandidates[0];
      return {
        kana: best?.kana ?? "",
        probability: best ? best.probability : null,
        topCandidates,
      };
    },
    [normalizedExpectedReading],
  );

  const mapAlternatives = useCallback(
    (
      results: {
        transcript: string;
        confidence: number;
      }[],
    ): DebugAlternative[] => {
      return results.map((result) => {
        const transcript = typeof result.transcript === "string" ? result.transcript : "";
        const normalized = normalizeJapaneseReading(transcript);
        const lookupKey = compactJapaneseText(transcript);
        const hasKanji = KANJI_CHARACTER_REGEX.test(lookupKey);
        const directKanaCandidate =
          normalized && !KANJI_CHARACTER_REGEX.test(normalized)
            ? normalized
            : "";
        const wkReadings =
          lookupKey && hasKanji ? wkReadingMap[lookupKey] ?? [] : [];
        const composedResult =
          hasKanji && wkReadings.length === 0
            ? buildComposedReadingsFromKanji(lookupKey)
            : { readings: [], total: 0, capped: false };
        const composedReadings = composedResult.readings;
        const directKanaMatch =
          directKanaCandidate.length > 0 &&
          acceptedReadingSet.has(directKanaCandidate);
        const wkMapMatch = wkReadings.some((reading) =>
          acceptedReadingSet.has(reading),
        );
        const composedKanjiMatch = composedReadings.some((reading) =>
          acceptedReadingSet.has(reading),
        );
        const expectedKanjiMatch =
          normalizedExpectedKanji.length > 0 &&
          matchesJapaneseAnswer(lookupKey, normalizedExpectedKanji);

        const readingMatchSources: DebugAlternative["readingMatchSources"] = [];
        if (directKanaMatch) {
          readingMatchSources.push("kana-direct");
        }
        if (wkMapMatch) {
          readingMatchSources.push("wk-map");
        }
        if (composedKanjiMatch) {
          readingMatchSources.push("kanji-composed");
        }

        const isExpected = readingMatchSources.length > 0;
        const bestKanaSelection = selectBestKanaCandidate({
          directKanaCandidate,
          wkReadings,
          composedReadings,
        });

        let matchMethod: DebugAlternative["matchMethod"] = "none";
        if (readingMatchSources.length === 1) {
          matchMethod = readingMatchSources[0];
        } else if (readingMatchSources.length > 1) {
          matchMethod = "multiple";
        }

        return {
          transcript,
          normalized,
          lookupKey,
          wkReadings,
          composedReadingsPreview: composedReadings.slice(
            0,
            COMPOSED_READING_PREVIEW_LIMIT,
          ),
          composedReadingsTotal: composedResult.total,
          composedReadingsCapped: composedResult.capped,
          directKanaMatch,
          wkMapMatch,
          composedKanjiMatch,
          expectedKanjiMatch,
          readingMatchSources,
          bestKanaCandidate: bestKanaSelection.bestKanaCandidate,
          bestKanaSource: bestKanaSelection.bestKanaSource,
          bestKanaMatchesExpectedReading:
            bestKanaSelection.bestKanaMatchesExpectedReading,
          matchMethod,
          confidence: result.confidence ?? -1,
          isExpected,
        };
      });
    },
    [
      acceptedReadingSet,
      buildComposedReadingsFromKanji,
      normalizeJapaneseReading,
      normalizedExpectedKanji,
      selectBestKanaCandidate,
      wkReadingMap,
    ],
  );

  const checkVoicePermissions = useCallback(async (): Promise<boolean> => {
    try {
      const available = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
      setIsRecognitionAvailable(available);

      if (!available) {
        setVoiceError(uiT("ui.message_dc6cbc309fb4"));
        return false;
      }

      const result = useOnDeviceRecognition
        ? await ExpoSpeechRecognitionModule.getMicrophonePermissionsAsync()
        : await ExpoSpeechRecognitionModule.getPermissionsAsync();

      return result.granted;
    } catch (error) {
      console.error("ASR debug: permission check failed", error);
      setVoiceError(uiT("ui.message_4e7cecda89c3"));
      return false;
    }
  }, [useOnDeviceRecognition]);

  const requestVoicePermissions = useCallback(async (): Promise<boolean> => {
    try {
      const result = useOnDeviceRecognition
        ? await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync()
        : await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!result.granted) {
        setVoiceError(uiT("ui.message_b0375de83dab"));
      }

      return result.granted;
    } catch (error) {
      console.error("ASR debug: permission request failed", error);
      setVoiceError(uiT("ui.message_be32ea6b670f"));
      return false;
    }
  }, [useOnDeviceRecognition]);

  const startRecognition = useCallback(async () => {
    if (!isAuthorized) {
      return;
    }

    const hasPermissions = await checkVoicePermissions();
    if (!hasPermissions) {
      const granted = await requestVoicePermissions();
      if (!granted) {
        return;
      }
    }

    setVoiceError(null);
    setInterimTranscript("");
    setLiveKanaProbability(null);
    setLiveKanaCandidates([]);
    setLatestAlternatives([]);

    try {
      await ExpoSpeechRecognitionModule.start({
        lang: "ja-JP",
        interimResults: true,
        continuous: false,
        maxAlternatives: MAX_ALTERNATIVES,
        addsPunctuation: false,
        iosTaskHint: "confirmation",
        requiresOnDeviceRecognition: useOnDeviceRecognition,
        contextualStrings: acceptedReadings.slice(0, 100),
      });
    } catch (error) {
      console.error("ASR debug: failed to start recognition", error);
      setVoiceError(uiT("ui.message_817e17f60198"));
    }
  }, [
    acceptedReadings,
    checkVoicePermissions,
    isAuthorized,
    requestVoicePermissions,
    useOnDeviceRecognition,
  ]);

  const stopRecognition = useCallback(async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error("ASR debug: failed to stop recognition", error);
    }
  }, []);

  const clearResults = useCallback(() => {
    setVoiceError(null);
    setInterimTranscript("");
    setLiveKanaProbability(null);
    setLiveKanaCandidates([]);
    setLatestAlternatives([]);
    setResultHistory([]);
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    void checkVoicePermissions();
  }, [checkVoicePermissions, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    let cancelled = false;

    const loadWkReadingMap = async () => {
      setIsWkReadingMapLoading(true);
      setWkReadingMapError(null);

      try {
        const subjects = await getAllSubjects();
        if (cancelled) {
          return;
        }

        const readingMaps = buildWkReadingMaps(subjects);
        const wordEntryCount = Object.keys(readingMaps.wordReadings).length;
        const readingCount = Object.values(readingMaps.wordReadings).reduce(
          (total, readings) => total + readings.length,
          0,
        );
        const singleKanjiEntryCount = Object.keys(
          readingMaps.singleKanjiReadings,
        ).length;

        setWkReadingMap(readingMaps.wordReadings);
        setWkSingleKanjiReadingMap(readingMaps.singleKanjiReadings);
        setWkSubjectCount(subjects.length);
        setWkReadingMapEntryCount(wordEntryCount);
        setWkReadingMapReadingCount(readingCount);
        setWkSingleKanjiEntryCount(singleKanjiEntryCount);
      } catch (error) {
        console.error("ASR debug: failed to build WK reading map", error);
        if (!cancelled) {
          setWkReadingMapError(
            uiT("ui.message_eda6dfc2540a"),
          );
          setWkReadingMap({});
          setWkSingleKanjiReadingMap({});
          setWkSubjectCount(0);
          setWkReadingMapEntryCount(0);
          setWkReadingMapReadingCount(0);
          setWkSingleKanjiEntryCount(0);
        }
      } finally {
        if (!cancelled) {
          setIsWkReadingMapLoading(false);
        }
      }
    };

    void loadWkReadingMap();

    return () => {
      cancelled = true;
    };
  }, [buildWkReadingMaps, isAuthorized]);

  useEffect(() => {
    return () => {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        // no-op
      }
    };
  }, []);

  useSpeechRecognitionEvent("start", () => {
    if (!isAuthorized) {
      return;
    }
    setIsRecognizing(true);
    setVoiceError(null);
    setInterimTranscript("");
    setLiveKanaProbability(null);
    setLiveKanaCandidates([]);
  });

  useSpeechRecognitionEvent("end", () => {
    if (!isAuthorized) {
      return;
    }
    setIsRecognizing(false);
  });

  useSpeechRecognitionEvent("result", (event) => {
    if (!isAuthorized || !event.results?.length) {
      return;
    }

    const alternatives = mapAlternatives(event.results);
    const liveKana = selectMostProbableLiveKana(alternatives);

    setLatestAlternatives(alternatives);
    setLiveKanaProbability(liveKana.probability);
    setLiveKanaCandidates(liveKana.topCandidates);
    setResultHistory((previous) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        isFinal: event.isFinal,
        createdAt: Date.now(),
        alternatives,
      },
      ...previous,
    ].slice(0, 40));

    setInterimTranscript(liveKana.kana);
  });

  useSpeechRecognitionEvent("error", (event) => {
    if (!isAuthorized) {
      return;
    }

    setIsRecognizing(false);
    setInterimTranscript("");
    setLiveKanaProbability(null);
    setLiveKanaCandidates([]);

    let message = "Speech recognition failed.";
    if (event.error === "not-allowed") {
      message = "Microphone/speech permission denied.";
    } else if (event.error === "no-speech" || event.error === "speech-timeout") {
      message = "No speech detected. Try again.";
    } else if (event.error === "language-not-supported") {
      message = "ja-JP recognition is not supported on this device.";
    } else if (event.message) {
      message = event.message;
    }

    setVoiceError(message);
  });

  if (!isAuthorized) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      >
        <StatusBar style={theme.statusBarStyle} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textColor }]}>
            {uiT("ui.asr_reading_debug_3311a8b0")} </Text>
        </View>
        <View style={styles.centeredContent}>
          <Ionicons name="lock-closed-outline" size={36} color={theme.error} />
          <Text style={[styles.lockedTitle, { color: theme.textColor }]}>
            {uiT("ui.access_restricted_a3966fe9")} </Text>
          <Text style={[styles.lockedSubtitle, { color: theme.textSecondary }]}>
            {uiT("ui.this_screen_is_only_available_to_user_portego_1ffc26ae")} </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar style={theme.statusBarStyle} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>
          {uiT("ui.asr_reading_debug_3311a8b0")} </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.section,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.expected_reading_hiragana_08abdec4")} </Text>
          <TextInput
            value={expectedReading}
            onChangeText={setExpectedReading}
            placeholder="たべる"
            placeholderTextColor={theme.textLight}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            style={[
              styles.input,
              { color: theme.textColor, borderColor: theme.border },
              fontStyles.japaneseText,
            ]}
          />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {uiT("ui.primary_expected_reading_9f8a4cc7")}{" "}
            <Text style={[styles.metaValue, { color: theme.textColor }]}>
              {normalizedExpectedReading || "—"}
            </Text>
          </Text>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {uiT("ui.accepted_readings_normalized_b409e16b")}{" "}
            <Text style={[styles.metaValue, { color: theme.textColor }]}>
              [{acceptedReadings.join(", ") || uiT("ui.empty_2e1cfa82")}]
            </Text>
          </Text>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {uiT("ui.tip_you_can_enter_multiple_accepted_readings_separated_by_comma_o_a543a650")} </Text>
          <Text style={[styles.sectionTitle, { color: theme.textColor, marginTop: 12 }]}>
            {uiT("ui.expected_answer_in_kanji_ee498019")} </Text>
          <TextInput
            value={expectedKanji}
            onChangeText={setExpectedKanji}
            placeholder="食べる"
            placeholderTextColor={theme.textLight}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            style={[
              styles.input,
              { color: theme.textColor, borderColor: theme.border },
              fontStyles.japaneseText,
            ]}
          />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {uiT("ui.normalized_expected_kanji_d8121620")}{" "}
            <Text style={[styles.metaValue, { color: theme.textColor }]}>
              {normalizedExpectedKanji || "—"}
            </Text>
          </Text>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {uiT("ui.contextualstrings_38c0665c")}{" "}
            <Text style={[styles.metaValue, { color: theme.textColor }]}>
              [{acceptedReadings.join(", ") || uiT("ui.empty_2e1cfa82")}]
            </Text>
          </Text>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {uiT("ui.lang_ja_jp_maxalternatives_ce35a5a5")} {MAX_ALTERNATIVES}{uiT("ui.iostaskhint_confirmation_8e852978")} </Text>
          {Platform.OS === "ios" && (
            <View style={styles.onDeviceRow}>
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {uiT("ui.on_device_recognition_100924ae")} </Text>
              <Switch
                value={useOnDeviceRecognition}
                onValueChange={setUseOnDeviceRecognition}
                disabled={!supportsOnDeviceRecognition}
              />
            </View>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: isRecognizing ? "#b91c1c" : theme.primary,
              },
            ]}
            onPress={() => {
              if (isRecognizing) {
                void stopRecognition();
              } else {
                void startRecognition();
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isRecognizing ? "stop-circle-outline" : "mic-outline"}
              size={18}
              color="white"
            />
            <Text style={styles.actionButtonText}>
              {isRecognizing ? uiT("ui.stop_cae7d57b") : uiT("ui.start_e4bb9f1e")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accent }]}
            onPress={clearResults}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color="white" />
            <Text style={styles.actionButtonText}>{uiT("ui.clear_83b12c22")}</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.live_status_8b9c58df")} </Text>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {uiT("ui.recognizer_b077697d")}{" "}
            <Text style={[styles.metaValue, { color: theme.textColor }]}>
              {isRecognizing ? uiT("ui.listening_2efa9bd9") : uiT("ui.idle_ab0171ca")}
            </Text>
          </Text>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {uiT("ui.recognition_available_b2a5a256")}{" "}
            <Text style={[styles.metaValue, { color: theme.textColor }]}>
              {isRecognitionAvailable ? uiT("ui.yes_85a39ab3") : uiT("ui.no_1ea442a1")}
            </Text>
          </Text>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {uiT("ui.wk_reading_map_49562ca6")}{" "}
            <Text style={[styles.metaValue, { color: theme.textColor }]}>
              {isWkReadingMapLoading ? uiT("ui.building_c1e75128") : uiT("ui.ready_5fa7aac5")}
            </Text>
          </Text>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {uiT("ui.cached_subjects_5ef28b93")}{" "}
            <Text style={[styles.metaValue, { color: theme.textColor }]}>
              {wkSubjectCount}
            </Text>{" "}
            {uiT("ui.word_map_entries_3ab3aa86")}{" "}
            <Text style={[styles.metaValue, { color: theme.textColor }]}>
              {wkReadingMapEntryCount}
            </Text>{" "}
            {uiT("ui.single_kanji_entries_b841c05b")}{" "}
            <Text style={[styles.metaValue, { color: theme.textColor }]}>
              {wkSingleKanjiEntryCount}
            </Text>{" "}
            {uiT("ui.known_readings_323d0b2d")}{" "}
            <Text style={[styles.metaValue, { color: theme.textColor }]}>
              {wkReadingMapReadingCount}
            </Text>
          </Text>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {uiT("ui.live_kana_most_probable_97e95301")}{" "}
            <Text
              style={[
                styles.metaValue,
                { color: theme.textColor },
                fontStyles.japaneseText,
              ]}
            >
              {interimTranscript || "—"}
            </Text>
          </Text>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {uiT("ui.live_probability_5b500720")}{" "}
            <Text style={[styles.metaValue, { color: theme.textColor }]}>
              {liveKanaProbability !== null
                ? formatConfidence(liveKanaProbability)
                : "—"}
            </Text>
          </Text>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {uiT("ui.top_kana_options_d8f5ff76")}{" "}
            <Text style={[styles.metaValue, { color: theme.textColor }]}>
              {liveKanaCandidates.length > 0
                ? liveKanaCandidates
                    .map((candidate) =>
                      `${candidate.kana} (${formatConfidence(
                        candidate.probability,
                      )})`,
                    )
                    .join(" • ")
                : "—"}
            </Text>
          </Text>
          {wkReadingMapError ? (
            <View
              style={[styles.errorBox, { backgroundColor: `${theme.error}22` }]}
            >
              <Text style={[styles.errorText, { color: theme.error }]}>
                {wkReadingMapError}
              </Text>
            </View>
          ) : null}
          {voiceError ? (
            <View
              style={[styles.errorBox, { backgroundColor: `${theme.error}22` }]}
            >
              <Text style={[styles.errorText, { color: theme.error }]}>
                {voiceError}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.section,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.latest_alternatives_2ba7ffcb")} </Text>
          {latestAlternatives.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {uiT("ui.no_alternatives_yet_start_recording_and_speak_one_reading_7ed4fbe2")} </Text>
          ) : (
            latestAlternatives.map((alternative, index) => (
              <View
                key={`latest-${index}-${alternative.transcript}`}
                style={[
                  styles.alternativeRow,
                  {
                    borderColor: theme.border,
                    backgroundColor: alternative.isExpected
                      ? `${theme.primary}1A`
                      : "transparent",
                  },
                ]}
              >
                <View style={styles.alternativeHeader}>
                  <Text style={[styles.altRank, { color: theme.textSecondary }]}>
                    #{index + 1}
                  </Text>
                  <Text style={[styles.altConfidence, { color: theme.textSecondary }]}>
                    {formatConfidence(alternative.confidence)}
                  </Text>
                  <Text
                    style={[
                      styles.matchBadge,
                      {
                        backgroundColor: alternative.isExpected
                          ? "#16a34a"
                          : `${theme.border}`,
                        color: alternative.isExpected ? "white" : theme.textSecondary,
                      },
                    ]}
                  >
                    {alternative.isExpected ? uiT("ui.match_eaa42a15") : uiT("ui.no_match_16826644")}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.altNormalized,
                    { color: theme.textColor },
                    fontStyles.japaneseText,
                  ]}
                >
                  {uiT("ui.kana_guess_3e1ecd4b")} {alternative.bestKanaCandidate || "—"}
                </Text>
                <Text style={[styles.altMeta, { color: theme.textSecondary }]}>
                  {uiT("ui.kana_source_139f6c77")} {alternative.bestKanaSource}
                </Text>
                <Text style={[styles.altMeta, { color: theme.textSecondary }]}>
                  {uiT("ui.matches_expected_reading_5189ddeb")}{" "}
                  {alternative.bestKanaMatchesExpectedReading ? uiT("ui.yes_8a798890") : uiT("ui.no_9390298f")}
                </Text>
                <Text
                  style={[
                    styles.altMeta,
                    { color: theme.textSecondary },
                    fontStyles.japaneseText,
                  ]}
                >
                  {uiT("ui.reading_match_sources_47266fbe")}{" "}
                  {alternative.readingMatchSources.join(", ") || "none"}
                </Text>
                <Text
                  style={[
                    styles.altMeta,
                    { color: theme.textSecondary },
                    fontStyles.japaneseText,
                  ]}
                >
                  {uiT("ui.wk_readings_193fd041")} {alternative.wkReadings.join(", ") || "none"}
                </Text>
                <Text
                  style={[
                    styles.altMeta,
                    { color: theme.textSecondary },
                    fontStyles.japaneseText,
                  ]}
                >
                  {uiT("ui.composed_readings_79d6da23")}{" "}
                  {alternative.composedReadingsPreview.join(", ") || "none"}
                  {alternative.composedReadingsTotal >
                  alternative.composedReadingsPreview.length
                    ? uiT("ui.value_7c827d57", {value1: (alternative.composedReadingsTotal -
                        alternative.composedReadingsPreview.length)})
                    : ""}
                  {alternative.composedReadingsCapped ? uiT("ui.capped_1f77c393") : ""}
                </Text>
                <Text style={[styles.altMeta, { color: theme.textSecondary }]}>
                  {uiT("ui.direct_kana_match_5e37a418")} {alternative.directKanaMatch ? uiT("ui.yes_8a798890") : uiT("ui.no_9390298f")}
                  {"  "}•{"  "}{uiT("ui.wk_map_match_7fd87d27")} {alternative.wkMapMatch ? uiT("ui.yes_8a798890") : uiT("ui.no_9390298f")}
                  {"  "}•{"  "}{uiT("ui.composed_match_5e2a5b66")}{" "}
                  {alternative.composedKanjiMatch ? uiT("ui.yes_8a798890") : uiT("ui.no_9390298f")}
                </Text>
                <Text style={[styles.altMeta, { color: theme.textSecondary }]}>
                  {uiT("ui.expected_kanji_match_0ef5e444")}{" "}
                  {alternative.expectedKanjiMatch ? uiT("ui.yes_8a798890") : uiT("ui.no_9390298f")}
                </Text>
              </View>
            ))
          )}
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              marginBottom: 24,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.result_event_history_7f3e9baa")} </Text>
          {resultHistory.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {uiT("ui.no_result_events_captured_yet_880d3563")} </Text>
          ) : (
            resultHistory.map((event) => (
              <View
                key={event.id}
                style={[
                  styles.historyEvent,
                  { borderColor: theme.border, backgroundColor: theme.backgroundColor },
                ]}
              >
                <Text style={[styles.historyEventTitle, { color: theme.textColor }]}>
                  {event.isFinal ? uiT("ui.final_f4ed8fa6") : uiT("ui.interim_93539c18")} •{" "}
                  {new Date(event.createdAt).toLocaleTimeString()}
                </Text>
                {event.alternatives.map((alternative, index) => (
                  <Text
                    key={`${event.id}-${index}`}
                    style={[
                      styles.historyEventLine,
                      {
                        color: alternative.isExpected
                          ? "#16a34a"
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    #{index + 1} {uiT("ui.kana_f74d3e50")}{alternative.bestKanaCandidate || "—"} (
                    {formatConfidence(alternative.confidence)}{uiT("ui.source_338d330b")} {alternative.bestKanaSource}{uiT("ui.match_9bbb75d5")} {alternative.bestKanaMatchesExpectedReading ? uiT("ui.yes_8a798890") : uiT("ui.no_9390298f")}]
                    {normalizedExpectedKanji
                      ? uiT("ui.kanji_value_eb3cd3d3", {value1: (alternative.expectedKanjiMatch ? uiT("ui.yes_8a798890") : uiT("ui.no_9390298f"))})
                      : ""}
                  </Text>
                ))}
              </View>
            ))
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
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 20,
  },
  metaValue: {
    fontWeight: "600",
  },
  onDeviceRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  errorBox: {
    marginTop: 8,
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  alternativeRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  alternativeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  altRank: {
    fontSize: 12,
    fontWeight: "700",
  },
  altConfidence: {
    fontSize: 12,
    marginLeft: 10,
  },
  matchBadge: {
    marginLeft: "auto",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
  altTranscript: {
    fontSize: 18,
    marginBottom: 2,
  },
  altNormalized: {
    fontSize: 13,
    marginBottom: 2,
  },
  altMeta: {
    fontSize: 12,
    lineHeight: 18,
  },
  historyEvent: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  historyEventTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  historyEventLine: {
    fontSize: 12,
    lineHeight: 18,
  },
  centeredContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  lockedTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "700",
  },
  lockedSubtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
