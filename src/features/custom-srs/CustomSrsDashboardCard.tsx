import { uiT, interfaceLocale, useInterfaceLanguage } from "../interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import * as Haptics from "../../utils/haptics";
import { useSubjectColors } from "../../utils/subjectColors";
import { useTheme } from "../../utils/theme";
import { nextCustomReviewAt, useCustomSrs } from "./data";

export default function CustomSrsDashboardCard({ style }: { style?: StyleProp<ViewStyle> }) {
  useInterfaceLanguage();
  const { theme } = useTheme();
  const colors = useSubjectColors();
  const customSrs = useCustomSrs();
  const nextReview = nextCustomReviewAt(customSrs.state);
  const packCount = customSrs.state.enrolledPackIds.length;
  const lessonCount = customSrs.lessonWords.length;
  const reviewCount = customSrs.reviewWords.length;
  const lessonDisabled = customSrs.loading || lessonCount === 0;
  const reviewDisabled = customSrs.loading || reviewCount === 0;
  const nextReviewLabel = !customSrs.loading && reviewCount === 0 && nextReview
    ? `Next ${new Date(nextReview).toLocaleString(interfaceLocale(), { weekday: "short", hour: "numeric", minute: "2-digit" })}`
    : null;

  function open(path: "" | "/lessons" | "/reviews") {
    void Haptics.selectionAsync();
    router.push(`/custom-vocabulary${path}` as never);
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }, style]}>
      <View style={styles.header}>
        <Ionicons name="albums-outline" size={20} color={colors.vocabulary} />
        <View style={styles.flex}>
          <Text style={[styles.title, { color: theme.textColor }]}>{uiT("ui.vocabulary_packs_cca9cdc3")}</Text>
          {!customSrs.loading ? (
            <Text style={[styles.subtitle, styles.headerSubtitle, { color: theme.textSecondary }]}>
              {packCount === 0 ? uiT("ui.add_a_pack_to_get_started_263ede05") : uiT("ui.value_value_added_e58e9974", {value1: (packCount), value2: (packCount === 1 ? uiT("ui.pack_4862f447") : uiT("ui.packs_dbd1afe9"))})}
            </Text>
          ) : null}
        </View>
        {customSrs.loading || customSrs.syncing ? (
          <ActivityIndicator size="small" color={colors.vocabulary} accessibilityLabel={uiT("ui.syncing_vocabulary_packs_9bc01daa")} />
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={uiT("ui.dynamic_5b5f47fb9661", {value1: (lessonCount)})}
        accessibilityState={{ disabled: lessonDisabled, busy: customSrs.loading }}
        disabled={lessonDisabled}
        onPress={() => open("/lessons")}
        style={({ pressed }) => [styles.action, { borderTopColor: theme.border, opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="book-outline" size={19} color={lessonDisabled ? theme.textLight : colors.vocabulary} />
        <Text style={[styles.label, styles.flex, { color: lessonDisabled ? theme.textSecondary : theme.textColor }]}>{uiT("ui.lessons_cb4ad503")}</Text>
        <Text style={[styles.count, { color: lessonDisabled ? theme.textLight : colors.vocabulary }]}>{customSrs.loading ? "—" : lessonCount}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.textLight} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={uiT("ui.dynamic_f5ecd3b14cb2", {value1: (reviewCount)})}
        accessibilityHint={nextReviewLabel ?? undefined}
        accessibilityState={{ disabled: reviewDisabled, busy: customSrs.loading }}
        disabled={reviewDisabled}
        onPress={() => open("/reviews")}
        style={({ pressed }) => [styles.action, { borderTopColor: theme.border, opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="refresh-outline" size={19} color={reviewDisabled ? theme.textLight : colors.vocabulary} />
        <View style={styles.flex}>
          <Text style={[styles.label, { color: reviewDisabled ? theme.textSecondary : theme.textColor }]}>{uiT("ui.reviews_84cb7871")}</Text>
          {nextReviewLabel ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{nextReviewLabel}</Text> : null}
        </View>
        <Text style={[styles.count, { color: reviewDisabled ? theme.textLight : colors.vocabulary }]}>{customSrs.loading ? "—" : reviewCount}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.textLight} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={uiT("ui.explore_vocabulary_packs_51faaba9")}
        onPress={() => open("")}
        style={({ pressed }) => [styles.action, { borderTopColor: theme.border, opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="grid-outline" size={19} color={colors.vocabulary} />
        <Text style={[styles.label, styles.flex, { color: theme.textColor }]}>{uiT("ui.explore_packs_88f52bc1")}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.textLight} />
      </Pressable>

      {customSrs.error ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={uiT("ui.retry_vocabulary_pack_sync_c67b343d")}
          onPress={() => { void customSrs.refresh().catch(() => {}); }}
          style={({ pressed }) => [styles.syncError, { borderTopColor: theme.border, opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="cloud-offline-outline" size={17} color={theme.error} />
          <Text style={[styles.subtitle, styles.flex, { color: theme.error }]}>{uiT("ui.couldn_t_sync_progress_tap_to_retry_771d81f9")}</Text>
          <Ionicons name="refresh-outline" size={16} color={theme.error} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderCurve: "continuous", borderWidth: 1, marginBottom: 16, overflow: "hidden", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 14 },
  title: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { marginTop: 2 },
  action: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 54, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  count: { fontSize: 20, fontWeight: "700", fontVariant: ["tabular-nums"] },
  label: { fontSize: 15, fontWeight: "600" },
  subtitle: { fontSize: 12, lineHeight: 18 },
  syncError: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  flex: { flex: 1, minWidth: 0 },
});
