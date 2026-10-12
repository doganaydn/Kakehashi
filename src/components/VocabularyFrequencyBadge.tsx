import { useInterfaceLanguage, uiT } from "../features/interface-language/runtime";
import React from "react";
import { StyleSheet, Text } from "react-native";
import { useVocabularyFrequency } from "../hooks/useVocabularyFrequency";
import type { VocabularyFrequencySubject } from "../services/vocabularyFrequencyService";
import { useSettingsStore } from "../utils/store";
import { useTheme } from "../utils/theme";

interface VocabularyFrequencyBadgeProps {
  subject: VocabularyFrequencySubject;
  variant?: "review" | "details";
}

export default function VocabularyFrequencyBadge({
  subject,
  variant = "review",
}: VocabularyFrequencyBadgeProps) {
  useInterfaceLanguage();
  const settingEnabled = useSettingsStore(
    (state) => state.showVocabularyFrequency,
  );

  if (!settingEnabled) {
    return null;
  }

  return <EnabledVocabularyFrequencyBadge subject={subject} variant={variant} />;
}

function EnabledVocabularyFrequencyBadge({
  subject,
  variant = "review",
}: VocabularyFrequencyBadgeProps) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const { result, isLoading } = useVocabularyFrequency(subject);
  const isDetails = variant === "details";
  const value = result
    ? `#${result.frequencyRank.toLocaleString()}`
    : "#---";
  const accessibilityLabel = result
    ? uiT("ui.dynamic_ba9103f2c58f", {value1: (value)})
    : isLoading
      ? "Vocabulary frequency loading"
      : "Vocabulary frequency unavailable";

  return (
    <Text
      selectable
      style={[
        isDetails ? styles.detailsText : styles.reviewText,
        isDetails && { color: theme.textColor },
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {value}
    </Text>
  );
}

const styles = StyleSheet.create({
  reviewText: {
    marginTop: 8,
    minWidth: 44,
    textAlign: "center",
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  detailsText: {
    fontSize: 16,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
});
