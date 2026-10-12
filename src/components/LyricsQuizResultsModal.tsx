import { uiT, useInterfaceLanguage } from "../features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import type { ReactElement } from "react";
import { useMemo } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { LyricsQuizQuestion } from "../utils/lyricsQuiz";
import { fontStyles } from "../utils/fonts";
import { isWaniKaniBackedMatch } from "../utils/textHighlighting";
import { useTheme } from "../utils/theme";

interface LyricsQuizResultsModalProps {
  visible: boolean;
  songTitle: string;
  artist: string;
  questions: LyricsQuizQuestion[];
  answers: Record<number, string>;
  attempts: Record<number, string[]>;
  onClose: () => void;
  onRestart: () => void;
  onOpenItem: (question: LyricsQuizQuestion) => void;
}

export function LyricsQuizResultsModal({
  visible,
  songTitle,
  artist,
  questions,
  answers,
  attempts,
  onClose,
  onRestart,
  onOpenItem,
}: LyricsQuizResultsModalProps): ReactElement {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const summary = useMemo(() => {
    let answeredCount = 0;
    let firstTryCount = 0;
    let mistakeCount = 0;
    let responseCount = 0;

    for (const question of questions) {
      const questionAttempts = attempts[question.lineIndex] ?? [];
      const isAnswered =
        answers[question.lineIndex] === question.answer;
      const wrongAttempts = questionAttempts.filter(
        (answer) => answer !== question.answer,
      ).length;

      responseCount += questionAttempts.length;
      mistakeCount += wrongAttempts;
      if (isAnswered) {
        answeredCount += 1;
        if (questionAttempts[0] === question.answer) {
          firstTryCount += 1;
        }
      }
    }

    return {
      answeredCount,
      firstTryCount,
      mistakeCount,
      responseCount,
      accuracy:
        responseCount > 0
          ? Math.round((answeredCount / responseCount) * 100)
          : 0,
    };
  }, [answers, attempts, questions]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
      onRequestClose={onClose}
    >
      <SafeAreaView
        edges={["top", "bottom"]}
        style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.headerSide} />
          <Text
            style={[styles.headerTitle, { color: theme.textColor }]}
            numberOfLines={1}
          >
            {uiT("ui.song_quiz_results_6e0e14fe")} </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={uiT("ui.close_song_quiz_results_a7460eb2")}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              { opacity: pressed ? 0.55 : 1 },
            ]}
          >
            <Ionicons name="close" size={22} color={theme.textColor} />
          </Pressable>
        </View>

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={[styles.songInfo, { borderBottomColor: theme.border }]}>
            <Text
              selectable
              style={[styles.songTitle, { color: theme.textColor }]}
              numberOfLines={1}
            >
              {songTitle || uiT("ui.song_quiz_a35d3cd1")}
            </Text>
            {artist ? (
              <Text
                selectable
                style={[styles.artist, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {artist}
              </Text>
            ) : null}

            <View style={styles.summaryRow}>
              <View style={styles.accuracyBlock}>
                <Text
                  selectable
                  style={[styles.accuracyValue, { color: theme.secondary }]}
                >
                  {summary.accuracy}%
                </Text>
                <Text style={[styles.accuracyLabel, { color: theme.textSecondary }]}>
                  {uiT("ui.response_accuracy_fd30fcf7")} </Text>
              </View>
              <View style={styles.summaryStats}>
                <Text style={[styles.summaryStat, { color: theme.textColor }]}>
                  {summary.answeredCount}/{questions.length} {uiT("ui.answered_68c780cd")} </Text>
                <Text style={[styles.summaryStat, { color: theme.textColor }]}>
                  {summary.firstTryCount} {uiT("ui.first_try_c6d81def")} </Text>
                <Text style={[styles.summaryStat, { color: theme.textColor }]}>
                  {summary.mistakeCount} {uiT("ui.mistakes_6294ed26")} </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            {uiT("ui.responses_9b4c6d73")} </Text>
          <View style={[styles.responseList, { borderTopColor: theme.border }]}>
            {questions.map((question) => {
              const questionAttempts = attempts[question.lineIndex] ?? [];
              const isCorrect =
                answers[question.lineIndex] === question.answer;
              const wrongCount = questionAttempts.filter(
                (answer) => answer !== question.answer,
              ).length;
              const isWaniKaniItem = isWaniKaniBackedMatch(
                question.answerItem,
              );
              const canOpenDetails = isCorrect && isWaniKaniItem;
              const latestResponse =
                questionAttempts[questionAttempts.length - 1];
              const responseText = isCorrect
                ? question.answer
                : latestResponse ?? "—";
              const primaryReading =
                question.answerItem.readings?.find((reading) => reading.primary)
                  ?.reading ?? question.answerItem.readings?.[0]?.reading;
              const statusText = isCorrect
                ? wrongCount === 0
                  ? "Correct first try"
                  : `${wrongCount} ${wrongCount === 1 ? "mistake" : "mistakes"}`
                : questionAttempts.length > 0
                  ? "Not completed"
                  : "Skipped";
              const statusColor = isCorrect
                ? wrongCount === 0
                  ? "#16a34a"
                  : "#d97706"
                : questionAttempts.length > 0
                  ? "#dc2626"
                  : theme.textSecondary;

              return (
                <Pressable
                  key={question.lineIndex}
                  accessibilityRole={canOpenDetails ? "button" : undefined}
                  accessibilityLabel={
                    canOpenDetails
                      ? uiT("ui.dynamic_7c827f65655c", {value1: (question.answer)})
                      : undefined
                  }
                  disabled={!canOpenDetails}
                  onPress={() => onOpenItem(question)}
                  style={({ pressed }) => [
                    styles.responseRow,
                    {
                      borderBottomColor: theme.border,
                      opacity: pressed ? 0.62 : 1,
                    },
                  ]}
                >
                  <View style={styles.responseStatusIcon}>
                    <Ionicons
                      name={
                        isCorrect
                          ? wrongCount === 0
                            ? "checkmark-circle"
                            : "alert-circle"
                          : questionAttempts.length > 0
                            ? "close-circle"
                            : "remove-circle-outline"
                      }
                      size={20}
                      color={statusColor}
                    />
                  </View>
                  <View style={styles.responseContent}>
                    <View style={styles.responseAnswerRow}>
                      <Text
                        selectable
                        style={[
                          styles.responseAnswer,
                          fontStyles.japaneseText,
                          { color: theme.textColor },
                        ]}
                      >
                        {responseText}
                      </Text>
                      {isCorrect && isWaniKaniItem ? (
                        <Text
                          style={[
                            styles.responseLevel,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {uiT("ui.lv_ab6378f0")} {question.answerItem.level}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      selectable
                      style={[
                        styles.responseMeaning,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {isCorrect
                        ? primaryReading
                          ? uiT("ui.value_value_939adcc9", {value1: (primaryReading), value2: (question.answerItem.meaning)})
                          : question.answerItem.meaning
                        : latestResponse
                          ? uiT("ui.latest_response_cb7b195a")
                          : uiT("ui.no_response_yet_c818615c")}
                    </Text>
                    <Text style={[styles.responseStatus, { color: statusColor }]}>
                      {statusText}
                    </Text>
                  </View>
                  {canOpenDetails ? (
                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color={theme.textSecondary}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              borderTopColor: theme.border,
              backgroundColor: theme.backgroundColor,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={uiT("ui.restart_song_quiz_fafedfe1")}
            onPress={onRestart}
            style={({ pressed }) => [
              styles.footerButton,
              { borderColor: theme.border, opacity: pressed ? 0.62 : 1 },
            ]}
          >
            <Ionicons name="refresh" size={17} color={theme.textColor} />
            <Text style={[styles.footerButtonText, { color: theme.textColor }]}>
              {uiT("ui.restart_6b983a81")} </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={uiT("ui.close_results_and_continue_listening_da55a7b6")}
            onPress={onClose}
            style={({ pressed }) => [
              styles.footerButton,
              {
                borderColor: theme.primary,
                backgroundColor: theme.primary,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Text style={[styles.footerButtonText, styles.primaryButtonText]}>
              {uiT("ui.continue_listening_7d9d5852")} </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSide: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  songInfo: {
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 3,
  },
  songTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  artist: {
    fontSize: 14,
  },
  summaryRow: {
    paddingTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
  },
  accuracyBlock: {
    minWidth: 112,
  },
  accuracyValue: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  accuracyLabel: {
    fontSize: 12,
  },
  summaryStats: {
    flex: 1,
    gap: 7,
  },
  summaryStat: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  sectionTitle: {
    paddingTop: 22,
    paddingBottom: 10,
    fontSize: 16,
    fontWeight: "700",
  },
  responseList: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  responseRow: {
    minHeight: 86,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  responseStatusIcon: {
    width: 24,
    alignItems: "center",
  },
  responseContent: {
    flex: 1,
    gap: 2,
  },
  responseAnswerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  responseAnswer: {
    fontSize: 21,
    fontWeight: "700",
  },
  responseLevel: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  responseMeaning: {
    fontSize: 13,
    lineHeight: 18,
  },
  responseStatus: {
    paddingTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  footerButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    borderCurve: "continuous",
    gap: 7,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  primaryButtonText: {
    color: "#fff",
  },
});
