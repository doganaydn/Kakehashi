import { uiT, interfaceLocale, useInterfaceLanguage } from "../features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type Subject, getSubject } from "../utils/api";
import { getSubjectById } from "../utils/cache";
import { fontStyles } from "../utils/fonts";
import { registerOpenNoteSubjectPreview } from "../utils/note-subject-preview-state";
import { rememberNoteSubjectType } from "../utils/note-subject-metadata";
import { type SubjectType, useSubjectColors } from "../utils/subjectColors";
import { useAuthStore } from "../utils/store";
import { useTheme } from "../utils/theme";

type NoteSubjectPreviewProps = {
  linkText: string;
  onClose: () => void;
  subjectId: number;
};

function isSubject(value: unknown): value is Subject {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Subject>;
  return (
    Number.isInteger(candidate.id) &&
    typeof candidate.object === "string" &&
    !!candidate.data &&
    Array.isArray(candidate.data.meanings)
  );
}

function getPrimaryMeaning(subject: Subject): string {
  return (
    subject.data.meanings.find((meaning) => meaning.primary)?.meaning ||
    subject.data.meanings[0]?.meaning ||
    "Unknown meaning"
  );
}

function getSubjectType(type: string): SubjectType {
  switch (type) {
    case "radical":
    case "kanji":
    case "kana_vocabulary":
      return type;
    default:
      return "vocabulary";
  }
}

function formatSubjectType(type: string): string {
  return type.replace("_", " ");
}

function formatPartsOfSpeech(partsOfSpeech: string[] | null): string {
  return (partsOfSpeech ?? [])
    .map((part) => part.replaceAll("_", " "))
    .join(" · ");
}

function getUniqueReadings(
  readings: NonNullable<Subject["data"]["readings"]>,
): string {
  return Array.from(new Set(readings.map((reading) => reading.reading))).join(
    " · ",
  );
}

export default function NoteSubjectPreview({
  linkText,
  onClose,
  subjectId,
}: NoteSubjectPreviewProps) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const apiToken = useAuthStore((state) => state.apiToken);
  const subjectColors = useSubjectColors();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const handleViewFullDetails = useCallback(() => {
    onClose();
    router.push({
      pathname: "/subject/[id]",
      params: {
        id: subjectId.toString(),
      },
    });
  }, [onClose, subjectId]);

  useEffect(() => registerOpenNoteSubjectPreview(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadSubject() {
      setIsLoading(true);
      setError(false);
      setSubject(null);

      try {
        const cachedSubject = await getSubjectById(subjectId);
        if (cancelled) return;

        if (isSubject(cachedSubject)) {
          rememberNoteSubjectType(cachedSubject.id, cachedSubject.object);
          setSubject(cachedSubject);
          return;
        }

        if (!apiToken) throw new Error("No WaniKani account is available.");

        const fetchedSubject = await getSubject(apiToken, subjectId);
        if (cancelled) return;
        if (!isSubject(fetchedSubject))
          throw new Error("Invalid subject data.");
        rememberNoteSubjectType(fetchedSubject.id, fetchedSubject.object);
        setSubject(fetchedSubject);
      } catch {
        if (!cancelled) {
          setSubject(null);
          setError(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadSubject();
    return () => {
      cancelled = true;
    };
  }, [apiToken, loadAttempt, subjectId]);

  const previewData = useMemo(() => {
    if (!subject) return null;

    const orderedReadings = [...(subject.data.readings ?? [])].sort(
      (left, right) =>
        left.primary === right.primary ? 0 : left.primary ? -1 : 1,
    );
    const readingRows =
      subject.object === "kanji"
        ? [
            {
              label: uiT("ui.on_yomi_0140b21d"),
              value: getUniqueReadings(
                orderedReadings.filter((reading) => reading.type === "onyomi"),
              ),
            },
            {
              label: uiT("ui.kun_yomi_29f1e4b7"),
              value: getUniqueReadings(
                orderedReadings.filter((reading) => reading.type === "kunyomi"),
              ),
            },
            {
              label: uiT("ui.nanori_cf453dce"),
              value: getUniqueReadings(
                orderedReadings.filter((reading) => reading.type === "nanori"),
              ),
            },
          ].filter((row) => row.value.length > 0)
        : [
            {
              label: uiT("ui.reading_463816d0"),
              value: getUniqueReadings(orderedReadings),
            },
          ].filter((row) => row.value.length > 0);
    const meanings = Array.from(
      new Set(subject.data.meanings.map((meaning) => meaning.meaning)),
    )
      .slice(0, 4)
      .join(" · ");

    return {
      characters: subject.data.characters || getPrimaryMeaning(subject),
      meanings,
      readingRows,
      partsOfSpeech: formatPartsOfSpeech(subject.data.parts_of_speech),
      type: formatSubjectType(subject.object),
    };
  }, [subject, interfaceLocale()]);

  const subjectColor = subject
    ? subjectColors.getColorForType(getSubjectType(subject.object))
    : theme.primary;
  const headerTextColor = theme.headerText;
  const cardWidth = Math.min(380, width - 32);
  const cardMaxHeight = Math.max(
    240,
    height - Math.max(insets.top, 16) - Math.max(insets.bottom, 16) - 32,
  );

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible
    >
      <View style={styles.overlay}>
        <Pressable
          accessible={false}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            {
              width: cardWidth,
              maxHeight: cardMaxHeight,
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={[styles.header, { backgroundColor: subjectColor }]}>
            <View style={styles.headerText}>
              <Text
                numberOfLines={2}
                selectable
                style={[
                  styles.characters,
                  fontStyles.japaneseText,
                  { color: headerTextColor },
                ]}
              >
                {previewData?.characters || linkText}
              </Text>
              {subject ? (
                <Text style={[styles.headerMeta, { color: headerTextColor }]}>
                  {previewData?.type} {uiT("ui.level_c93d7b88")} {subject.data.level}
                </Text>
              ) : null}
            </View>

            <Pressable
              accessibilityLabel={uiT("ui.close_word_preview_60e901c4")}
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.55 : 1 },
              ]}
            >
              <Ionicons name="close" size={22} color={headerTextColor} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            contentInsetAdjustmentBehavior="never"
          >
            {isLoading ? (
              <View style={styles.state}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text
                  style={[styles.stateText, { color: theme.textSecondary }]}
                >
                  {uiT("ui.loading_subject_19bae2ce")} </Text>
              </View>
            ) : error || !previewData ? (
              <View style={styles.state}>
                <Text
                  selectable
                  style={[styles.stateText, { color: theme.textSecondary }]}
                >
                  {uiT("ui.this_linked_subject_could_not_be_loaded_it_may_no_longer_be_avail_6c08616d")} </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setLoadAttempt((attempt) => attempt + 1)}
                  style={({ pressed }) => [
                    styles.retryButton,
                    { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Text style={[styles.retryText, { color: theme.primary }]}>
                    {uiT("ui.try_again_d8b8392e")} </Text>
                </Pressable>
              </View>
            ) : (
              <>
                {previewData.readingRows.map((readingRow) => (
                  <View key={readingRow.label} style={styles.row}>
                    <Text
                      style={[styles.label, { color: theme.textSecondary }]}
                    >
                      {readingRow.label}
                    </Text>
                    <Text
                      selectable
                      style={[
                        styles.value,
                        fontStyles.japaneseText,
                        { color: theme.textColor },
                      ]}
                    >
                      {readingRow.value}
                    </Text>
                  </View>
                ))}

                <View style={styles.row}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>
                    {uiT("ui.meaning_1f5d64b9")} </Text>
                  <Text
                    selectable
                    style={[styles.value, { color: theme.textColor }]}
                  >
                    {previewData.meanings}
                  </Text>
                </View>

                {previewData.partsOfSpeech ? (
                  <View style={styles.row}>
                    <Text
                      style={[styles.label, { color: theme.textSecondary }]}
                    >
                      {uiT("ui.grammar_1325f21d")} </Text>
                    <Text
                      selectable
                      style={[styles.value, { color: theme.textColor }]}
                    >
                      {previewData.partsOfSpeech}
                    </Text>
                  </View>
                ) : null}
              </>
            )}

            <Pressable
              accessibilityHint={uiT("ui.opens_the_complete_subject_page_fa25f3b7")}
              accessibilityLabel={uiT("ui.view_full_details_d4d3a809")}
              accessibilityRole="button"
              onPress={handleViewFullDetails}
              style={({ pressed }) => [
                styles.detailsButton,
                {
                  backgroundColor: subjectColor,
                  opacity: pressed ? 0.65 : 1,
                },
              ]}
            >
              <Text
                style={[styles.detailsButtonText, { color: headerTextColor }]}
              >
                {uiT("ui.view_full_details_d4d3a809")} </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={headerTextColor}
              />
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.48)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    minHeight: 82,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  characters: {
    fontSize: 27,
    lineHeight: 36,
    fontWeight: "700",
  },
  headerMeta: {
    fontSize: 13,
    opacity: 0.88,
    textTransform: "capitalize",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 14,
  },
  row: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    lineHeight: 23,
  },
  state: {
    minHeight: 120,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailsButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  detailsButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
