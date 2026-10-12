import { uiT, useInterfaceLanguage } from "../../../../src/features/interface-language/runtime";
import { Stack } from "expo-router";
import React from "react";
import { useTheme } from "../../../../src/utils/theme";

export default function NewsLayout() {
  useInterfaceLanguage();
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.cardBackground,
        },
        headerTintColor: theme.textColor,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerShadowVisible: false, // Cleaner look
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: uiT("ui.news_69752f23"),
        }}
      />
    </Stack>
  );
}
