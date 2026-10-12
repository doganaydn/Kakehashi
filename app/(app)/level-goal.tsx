import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import React from "react";
import { Redirect, router, Stack, useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";
import { useAuthStore } from "../../src/utils/store";
import { useTheme } from "../../src/utils/theme";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import {
  canAccessLevelGoals,
  replaceGoal,
} from "../../src/features/level-goals/model";
import { useLevelGoals } from "../../src/features/level-goals/use-level-goals";
import { LevelGoalEditor } from "../../src/features/level-goals/level-goal-editor";

export default function LevelGoalRoute() {
  useInterfaceLanguage();
  const username = useAuthStore((s) => s.userData?.username);
  return canAccessLevelGoals(username) ? (
    <GoalRoute />
  ) : (
    <Redirect href="/(app)/(tabs)" />
  );
}
function GoalRoute() {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ fresh?: string }>();
  const { dashboardData } = useDashboardData();
  const level =
    useAuthStore((s) => s.userData?.level) ?? dashboardData.currentLevel;
  const goals = useLevelGoals(level, dashboardData.levelProgressions);
  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
      <Stack.Screen
        options={{
          title: uiT("ui.your_goal_617b0ae7"),
          headerShown: true,
          headerTintColor: theme.textColor,
          headerStyle: { backgroundColor: theme.backgroundColor },
          headerShadowVisible: false,
        }}
      />
      {level < 60 ? (
        <LevelGoalEditor
          currentLevel={level}
          progressions={dashboardData.levelProgressions}
          existing={params.fresh === "1" ? null : goals.state.active}
          now={goals.now}
          onClose={() => router.back()}
          onRemove={() =>
            goals.update((s) => ({
              ...replaceGoal(s, null, goals.now),
              widgetHidden: true,
            }))
          }
          onSave={(goal) =>
            goals.update((s) => ({
              ...replaceGoal(s, goal, goals.now),
              widgetHidden: false,
            }))
          }
        />
      ) : (
        <Text style={{ color: theme.textColor, padding: 24 }}>
          {uiT("ui.you_reached_level_60_your_current_goal_is_on_the_level_screen_23af842a")} </Text>
      )}
    </View>
  );
}
