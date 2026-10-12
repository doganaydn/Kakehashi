import { uiT, useInterfaceLanguage } from "../features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "../utils/store";
import { useTheme } from "../utils/theme";
import KanjiWriterQuiz from "./KanjiWriterQuiz";

interface KanjiPracticeModalProps {
  visible: boolean;
  onClose: () => void;
  character: string;
  meaning?: string;
  reading?: string;
}

export default function KanjiPracticeModal({
  visible,
  onClose,
  character,
  meaning,
  reading,
}: KanjiPracticeModalProps) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { strokeLeniency } = useSettingsStore();

  // On Android, modals cover full screen so we need safe area padding
  const topPadding = Platform.OS === "android" ? insets.top : 10;
  const [isComplete, setIsComplete] = useState(false);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0);

  const handleComplete = useCallback(
    (result: { totalMistakes: number; character: string }) => {
      setTotalMistakes(result.totalMistakes);
      setIsComplete(true);
    },
    []
  );

  const handlePracticeAgain = useCallback(() => {
    setAttemptKey((prev) => prev + 1);
    setIsComplete(false);
    setTotalMistakes(0);
  }, []);

  const handleClose = useCallback(() => {
    setIsComplete(false);
    setTotalMistakes(0);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.backgroundColor,
              paddingTop: topPadding,
            },
          ]}
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textColor }]}>
            {uiT("ui.practice_writing_f0911467")} </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Kanji Info */}
        <View style={styles.kanjiInfo}>
          {meaning && (
            <Text style={[styles.meaningText, { color: theme.textColor }]}>
              {meaning}
            </Text>
          )}
          {reading && (
            <Text style={[styles.readingText, { color: theme.textSecondary }]}>
              {reading}
            </Text>
          )}
        </View>

        {/* Quiz or Results */}
        <View style={styles.quizContainer}>
          {isComplete ? (
            <View style={styles.resultsContainer}>
              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                <Ionicons
                  name={totalMistakes === 0 ? "trophy" : "checkmark-circle"}
                  size={64}
                  color={totalMistakes === 0 ? "#ffc107" : "#4caf50"}
                />
                <Text style={[styles.resultTitle, { color: theme.textColor }]}>
                  {totalMistakes === 0 ? uiT("ui.perfect_bd57f3b9") : uiT("ui.complete_d0957425")}
                </Text>
                <Text
                  style={[styles.resultSubtitle, { color: theme.textSecondary }]}
                >
                  {totalMistakes === 0
                    ? uiT("ui.no_mistakes_88ef4b7f")
                    : uiT("ui.value_mistakevalue_bcc4d0ca", {value1: (totalMistakes), value2: (totalMistakes !== 1 ? "s" : "")})}
                </Text>

                <View style={styles.resultButtons}>
                  <TouchableOpacity
                    style={[
                      styles.practiceAgainButton,
                      { backgroundColor: "#4caf50" },
                    ]}
                    onPress={handlePracticeAgain}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.practiceAgainText}>{uiT("ui.practice_again_7842287f")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.doneButton,
                      {
                        backgroundColor: theme.isDark ? "#2a2a2a" : "#f5f5f5",
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={handleClose}
                  >
                    <Text
                      style={[styles.doneButtonText, { color: theme.textColor }]}
                    >
                      {uiT("ui.done_11a6767d")} </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <KanjiWriterQuiz
              key={`${character}-${attemptKey}`}
              character={character}
              onComplete={handleComplete}
              leniency={strokeLeniency}
              showHintAfterMisses={3}
            />
          )}
        </View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  kanjiInfo: {
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 24,
  },
  meaningText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  readingText: {
    fontSize: 18,
    marginTop: 4,
    textAlign: "center",
  },
  quizContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  resultCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    width: "100%",
    maxWidth: 320,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 16,
  },
  resultSubtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  resultButtons: {
    marginTop: 32,
    gap: 12,
    width: "100%",
  },
  practiceAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  practiceAgainText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  doneButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
