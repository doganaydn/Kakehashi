import { uiT, useInterfaceLanguage } from "../features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  useWindowDimensions,
  View,
} from "react-native";

import { type Subject, getSubjects } from "../utils/api";
import { getAllSubjects } from "../utils/cache";
import { fontStyles } from "../utils/fonts";
import {
  type SubjectType,
  useSubjectColors,
} from "../utils/subjectColors";
import { useAuthStore } from "../utils/store";
import {
  getDefaultSubjectSearchConfig,
  rankSubjectsByQuery,
  sortSubjectsByLevelAndType,
} from "../utils/subjectSearch";
import { useTheme } from "../utils/theme";
import { matchesVocabularyTypes } from "../utils/vocabularyTypeFilter";
import { VocabularyTypeFilter } from "./vocabulary-type-filter";

type NoteSubjectLinkPickerProps = {
  initialQuery: string;
  selectedText?: string;
  includeCharacters?: boolean;
  onIncludeCharactersChange?: (enabled: boolean) => void;
  linkedSubjectId?: number;
  onCancel: () => void;
  onRemove?: () => void;
  onSearchFocus?: TextInputProps["onFocus"];
  onSelect: (subject: Subject) => void;
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

function getDisplayCharacters(subject: Subject): string {
  return subject.data.characters || getPrimaryMeaning(subject);
}

function getReadings(subject: Subject): string {
  const readings = subject.data.readings ?? [];
  const ordered = [...readings].sort((left, right) =>
    left.primary === right.primary ? 0 : left.primary ? -1 : 1,
  );

  return Array.from(new Set(ordered.map((reading) => reading.reading)))
    .slice(0, 2)
    .join(" · ");
}

function formatSubjectType(type: string): string {
  return type.replace("_", " ");
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

export default function NoteSubjectLinkPicker({
  initialQuery,
  selectedText,
  includeCharacters = false,
  onIncludeCharactersChange,
  linkedSubjectId,
  onCancel,
  onRemove,
  onSearchFocus,
  onSelect,
}: NoteSubjectLinkPickerProps) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const apiToken = useAuthStore((state) => state.apiToken);
  const subjectColors = useSubjectColors();
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [vocabularyTypes, setVocabularyTypes] = useState<string[]>([]);
  const [showVocabularyTypes, setShowVocabularyTypes] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSubjects() {
      setIsLoading(true);
      setError(null);

      try {
        const cachedSubjects = (await getAllSubjects()).filter(isSubject);
        if (cancelled) return;

        if (cachedSubjects.length > 0) {
          setSubjects(cachedSubjects);
          return;
        }

        if (!apiToken) {
          throw new Error("No WaniKani account is available.");
        }

        const response = await getSubjects(apiToken);
        if (cancelled) return;
        setSubjects(response.data.filter(isSubject));
      } catch {
        if (!cancelled) {
          setError(uiT("ui.message_d7dedd4beae4"));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadSubjects();
    return () => {
      cancelled = true;
    };
  }, [apiToken, loadAttempt]);

  const results = useMemo(() => {
    const trimmedQuery = deferredQuery.trim();
    if (subjects.length === 0) return [];

    const matchingSubjects = subjects.filter((subject) =>
      matchesVocabularyTypes(subject, vocabularyTypes),
    );
    if (!trimmedQuery) {
      return vocabularyTypes.length > 0
        ? sortSubjectsByLevelAndType(matchingSubjects).slice(0, 60)
        : [];
    }

    const config = getDefaultSubjectSearchConfig(trimmedQuery.length);
    return rankSubjectsByQuery(matchingSubjects, trimmedQuery, {
      minScore: config.minScore,
    })
      .slice(0, Math.min(config.maxResults, 60))
      .map(({ subject }) => subject);
  }, [deferredQuery, subjects, vocabularyTypes]);

  const renderSubject = useCallback(
    ({ item }: { item: Subject }) => {
      const meaning = getPrimaryMeaning(item);
      const readings = getReadings(item);
      const color = subjectColors.getColorForType(
        getSubjectType(item.object),
      );

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={uiT("ui.dynamic_72b09baa7c3d", {value1: (getDisplayCharacters(item)), value2: (meaning)})}
          onPress={() => onSelect(item)}
          style={({ pressed }) => [
            styles.resultRow,
            {
              borderBottomColor: theme.border,
              backgroundColor: pressed ? theme.headerSurface : theme.cardBackground,
            },
          ]}
        >
          <View style={[styles.subjectMark, { backgroundColor: color }]}>
            <Text
              numberOfLines={1}
              style={[
                styles.subjectCharacters,
                fontStyles.japaneseText,
                { color: theme.headerText },
              ]}
            >
              {getDisplayCharacters(item)}
            </Text>
          </View>

          <View style={styles.resultText}>
            <Text
              numberOfLines={1}
              style={[styles.resultMeaning, { color: theme.textColor }]}
            >
              {meaning}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.resultMeta, { color: theme.textSecondary }]}
            >
              {readings
                ? uiT("ui.value_level_value_150b607a", {value1: (readings), value2: (item.data.level)})
                : uiT("ui.value_level_value_150b607a", {value1: (formatSubjectType(item.object)), value2: (item.data.level)})}
            </Text>
          </View>

          <Ionicons name="link" size={17} color={theme.textSecondary} />
        </Pressable>
      );
    },
    [onSelect, subjectColors, theme],
  );

  const trimmedQuery = query.trim();
  const isSearching = query !== deferredQuery;
  const showsCharactersChoice = Boolean(selectedText?.trim() && onIncludeCharactersChange);
  const pickerHeight = Math.min(380, Math.max(168, windowHeight * 0.34) + (showsCharactersChoice ? 56 : 0));

  return (
    <View
      accessibilityViewIsModal
      style={[
        styles.container,
        {
          height: pickerHeight,
          borderColor: theme.border,
          backgroundColor: theme.cardBackground,
        },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={uiT("ui.back_to_note_0115b46d")}
          hitSlop={8}
          onPress={onCancel}
          style={({ pressed }) => [
            styles.headerButton,
            { opacity: pressed ? 0.55 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textColor} />
        </Pressable>

        <Text style={[styles.title, { color: theme.textColor }]}>{uiT("ui.link_a_subject_f3d9072e")}</Text>

        {linkedSubjectId && onRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={uiT("ui.remove_word_link_40cec423")}
            hitSlop={8}
            onPress={onRemove}
            style={({ pressed }) => [
              styles.removeButton,
              { opacity: pressed ? 0.55 : 1 },
            ]}
          >
            <Text style={[styles.removeText, { color: theme.error }]}>{uiT("ui.remove_c3812fc4")}</Text>
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      <View
        style={[
          styles.searchBox,
          { borderColor: theme.border, backgroundColor: theme.backgroundColor },
        ]}
      >
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          clearButtonMode="while-editing"
          onChangeText={setQuery}
          onFocus={onSearchFocus}
          onSubmitEditing={() => Keyboard.dismiss()}
          placeholder={uiT("ui.japanese_reading_or_meaning_6e8ba177")}
          placeholderTextColor={theme.textLight}
          returnKeyType="search"
          style={[styles.searchInput, { color: theme.textColor }]}
          value={query}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            vocabularyTypes.length > 0
              ? uiT("ui.dynamic_30b97ad5b6e5", {value1: (vocabularyTypes.length)})
              : "Vocabulary type filters"
          }
          accessibilityState={{ selected: vocabularyTypes.length > 0 }}
          onPress={() => {
            Keyboard.dismiss();
            setShowVocabularyTypes(true);
          }}
          style={({ pressed }) => [
            styles.filterButton,
            { opacity: pressed ? 0.55 : 1 },
          ]}
        >
          <Ionicons
            name={vocabularyTypes.length > 0 ? "options" : "options-outline"}
            size={20}
            color={vocabularyTypes.length > 0 ? theme.primary : theme.textSecondary}
          />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>{uiT("ui.loading_subjects_52f3eede")}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text selectable style={[styles.stateText, { color: theme.textSecondary }]}>
            {error}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setLoadAttempt((attempt) => attempt + 1)}
            style={({ pressed }) => [
              styles.retryButton,
              { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[styles.retryText, { color: theme.primary }]}>{uiT("ui.try_again_d8b8392e")}</Text>
          </Pressable>
        </View>
      ) : !trimmedQuery && vocabularyTypes.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>{uiT("ui.search_for_the_subject_this_text_should_open_1f72ed0b")}</Text>
        </View>
      ) : isSearching ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>{uiT("ui.no_matching_subjects_7c916ea7")}</Text>
        </View>
      ) : (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          data={results}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSubject}
        />
      )}
      {showsCharactersChoice ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={uiT("ui.include_japanese_text_2e596991")}
          accessibilityHint={uiT("ui.adds_the_subject_s_japanese_text_after_your_selected_text_inside_8be7d8c9")}
          accessibilityState={{ checked: includeCharacters }}
          onPress={() => onIncludeCharactersChange?.(!includeCharacters)}
          style={({ pressed }) => [
            styles.charactersChoice,
            { borderTopColor: theme.border, backgroundColor: pressed ? theme.headerSurface : theme.cardBackground },
          ]}
        >
          <Ionicons
            name={includeCharacters ? "checkbox" : "square-outline"}
            size={22}
            color={includeCharacters ? theme.primary : theme.textSecondary}
          />
          <View style={styles.charactersChoiceText}>
            <Text style={[styles.charactersChoiceTitle, { color: theme.textColor }]}>{uiT("ui.include_japanese_text_2e596991")}</Text>
            <Text style={[styles.charactersChoiceHint, { color: theme.textSecondary }]}>{uiT("ui.add_it_after_the_selected_text_5faab69e")}</Text>
          </View>
        </Pressable>
      ) : null}
      {showVocabularyTypes ? (
        <Modal
          transparent
          animationType="fade"
          onRequestClose={() => setShowVocabularyTypes(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.filterKeyboardContainer}
          >
            <View style={styles.filterBackdrop}>
              <View
                accessibilityViewIsModal
                style={[
                  styles.filterDialog,
                  { backgroundColor: theme.cardBackground, borderColor: theme.border },
                ]}
              >
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.title, { color: theme.textColor }]}>{uiT("ui.filter_subjects_28e12438")}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={uiT("ui.close_vocabulary_type_filters_167fe148")}
                    onPress={() => setShowVocabularyTypes(false)}
                    style={styles.filterButton}
                  >
                    <Ionicons name="close" size={22} color={theme.textColor} />
                  </Pressable>
                </View>
                <ScrollView
                  style={styles.filterOptions}
                  contentInsetAdjustmentBehavior="automatic"
                  contentContainerStyle={styles.filterContent}
                  keyboardDismissMode="on-drag"
                  keyboardShouldPersistTaps="handled"
                >
                  <VocabularyTypeFilter
                    subjects={subjects}
                    selected={vocabularyTypes}
                    onChange={setVocabularyTypes}
                    initiallyExpanded
                  />
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  charactersChoice: {
    minHeight: 56,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  charactersChoiceText: { flex: 1, gap: 2 },
  charactersChoiceTitle: { fontSize: 14, fontWeight: "500" },
  charactersChoiceHint: { fontSize: 12 },
  container: {
    width: "100%",
    flexShrink: 1,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  header: {
    minHeight: 44,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  removeButton: {
    minWidth: 64,
    minHeight: 36,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  removeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchBox: {
    minHeight: 42,
    margin: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    fontSize: 15,
  },
  filterButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  filterKeyboardContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  filterBackdrop: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  filterDialog: {
    maxHeight: "80%",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  filterContent: {
    padding: 16,
  },
  filterOptions: {
    flexShrink: 1,
  },
  resultRow: {
    minHeight: 62,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subjectMark: {
    minWidth: 48,
    maxWidth: 100,
    height: 44,
    paddingHorizontal: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectCharacters: {
    fontSize: 18,
    fontWeight: "700",
  },
  resultText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  resultMeaning: {
    fontSize: 15,
    fontWeight: "600",
  },
  resultMeta: {
    fontSize: 13,
  },
  centerState: {
    flex: 1,
    paddingHorizontal: 24,
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
});
