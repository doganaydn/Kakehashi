import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LessonPicker, {
  LessonPickerItem,
} from "../../src/components/LessonPicker";
import { useSession } from "../../src/contexts/AuthContext";
import {
  getAvailableLessons,
  getAssignmentsOptimized,
  getSubjects,
} from "../../src/utils/api";
import { getRemainingDailyLessonSlots } from "../../src/utils/dailyLessonLimit";
import { useAuthStore, useSettingsStore } from "../../src/utils/store";
import { useTheme } from "../../src/utils/theme";

const isLessonPickerSubjectObject = (
  object: string
): object is LessonPickerItem["subject"]["object"] =>
  object === "radical" ||
  object === "kanji" ||
  object === "vocabulary" ||
  object === "kana_vocabulary";

export default function LessonPickerScreen() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const { apiToken } = useAuthStore();
  const dailyLessonLimit = useSettingsStore((state) => state.dailyLessonLimit);
  const excludeKanaVocabularyFromLessons = useSettingsStore(
    (state) => state.excludeKanaVocabularyFromLessons
  );
  const { isLoading: isAuthLoading } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [allLessons, setAllLessons] = useState<LessonPickerItem[]>([]);

  const loadLessons = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    if (!apiToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch available lessons
      const lessonsResponse = await getAvailableLessons(apiToken);

      if (lessonsResponse.data.length === 0) {
        Alert.alert(
          uiT("ui.no_lessons_available_3ea7844b"),
          uiT("ui.you_don_t_have_any_lessons_available_right_now_4399b03c"),
          [{ text: uiT("ui.ok_565339bc"), onPress: () => router.back() }]
        );
        return;
      }

      // Extract subject IDs from assignments
      const subjectIds = lessonsResponse.data.map(
        (assignment) => assignment.data.subject_id
      );

      // Fetch subject data for these assignments
      const subjectsResponse = await getSubjects(
        apiToken,
        {
          ids: subjectIds,
        },
        { skipCollectionCache: true }
      );

      // Create lesson picker items by combining assignment and subject data
      const items: LessonPickerItem[] = [];

      lessonsResponse.data.forEach((assignment) => {
        const subject = subjectsResponse.data.find(
          (s) => s.id === assignment.data.subject_id
        );

        if (!subject) {
          console.error(
            `Could not find subject for assignment ${assignment.id}`
          );
          return;
        }
        if (!isLessonPickerSubjectObject(subject.object)) {
          return;
        }
        if (
          excludeKanaVocabularyFromLessons &&
          subject.object === "kana_vocabulary"
        ) {
          return;
        }

        items.push({
          id: assignment.id,
          assignmentId: assignment.id,
          subjectId: assignment.data.subject_id,
          subject: {
            id: subject.id,
            object: subject.object,
            data: {
              parts_of_speech: subject.data.parts_of_speech,
              characters: subject.data.characters,
              meanings: subject.data.meanings,
              readings: subject.data.readings ?? undefined,
              level: subject.data.level,
              character_images: subject.data.character_images ?? undefined, // Include character images for radical SVG fallback
            },
          },
        });
      });

      if (items.length === 0) {
        Alert.alert(
          uiT("ui.no_lessons_available_3ea7844b"),
          uiT("ui.no_lessons_are_available_with_your_current_kana_vocabulary_filter_9df5668f"),
          [{ text: uiT("ui.ok_565339bc"), onPress: () => router.back() }]
        );
        return;
      }

      setAllLessons(items);
    } catch (error) {
      console.error("Error loading lessons:", error);
      Alert.alert(uiT("ui.error_54a0e8c1"), uiT("ui.failed_to_load_lessons_please_try_again_ba45f7c0"), [
        { text: uiT("ui.ok_565339bc"), onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [apiToken, excludeKanaVocabularyFromLessons, isAuthLoading]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const navigateToLessons = useCallback((selectedLessons: LessonPickerItem[]) => {
    router.replace({
      pathname: "/lessons",
      params: {
        selectedLessonIds: JSON.stringify(
          selectedLessons.map((lesson) => lesson.assignmentId)
        ),
      },
    });
  }, []);

  const handleStartLessons = useCallback(async (selectedLessons: LessonPickerItem[]) => {
    if (selectedLessons.length === 0) {
      Alert.alert(
        uiT("ui.no_lessons_selected_87514e44"),
        uiT("ui.please_select_at_least_one_lesson_to_start_5a13afd7")
      );
      return;
    }

    if (dailyLessonLimit > 0 && apiToken) {
      try {
        const assignmentsResponse = await getAssignmentsOptimized(
          apiToken,
          {},
          { forceFullRefresh: false }
        );
        const remainingDailyLessonSlots = getRemainingDailyLessonSlots(
          dailyLessonLimit,
          assignmentsResponse.data
        );

        if (selectedLessons.length > remainingDailyLessonSlots) {
          const overBy = selectedLessons.length - remainingDailyLessonSlots;
          const lessonPlural = overBy === 1 ? "lesson" : "lessons";
          const slotPlural =
            remainingDailyLessonSlots === 1 ? "slot" : "slots";

          Alert.alert(
            uiT("ui.daily_lesson_limit_warning_1397a393"),
            uiT("ui.you_ve_selected_value_lessons_which_is_value_value_over_your_rema_29059e22", {value1: (selectedLessons.length), value2: (overBy), value3: (lessonPlural), value4: (remainingDailyLessonSlots), value5: (slotPlural)}),
            [
              { text: uiT("ui.cancel_19766ed6"), style: "cancel" },
              {
                text: uiT("ui.continue_31fbef16"),
                onPress: () => navigateToLessons(selectedLessons),
              },
            ]
          );
          return;
        }
      } catch (error) {
        console.warn(
          "[LessonPicker] Failed to validate daily lesson limit before start:",
          error
        );
      }
    }

    navigateToLessons(selectedLessons);
  }, [apiToken, dailyLessonLimit, navigateToLessons]);

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      >
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textColor }]}>
            {uiT("ui.loading_lessons_d19eb1da")} </Text>
        </View>
      </View>
    );
  }

  return (
    <LessonPicker
      lessons={allLessons}
      onStart={handleStartLessons}
      onCancel={handleCancel}
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
});
