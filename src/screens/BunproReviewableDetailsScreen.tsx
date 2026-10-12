import { uiT, useInterfaceLanguage } from "../features/interface-language/runtime";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BunproDetailsContent } from "../components/bunpro/bunpro-details-content";
import { useAuthStore } from "../utils/store";
import { useTheme } from "../utils/theme";
import { isPortegoUsername } from "../utils/portegoAccess";

export default function BunproReviewableDetailsScreen() {
  useInterfaceLanguage();
  const params = useLocalSearchParams<{ kind?: string; slug?: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { userData } = useAuthStore();
  let slug = params.slug ?? "";
  try { slug = decodeURIComponent(slug); } catch { /* Preserve malformed slugs for the API's validation. */ }
  const kind = params.kind === "vocab" ? "vocab" : "grammar";
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderBottomColor: theme.border, borderBottomWidth: 1 }}><Pressable accessibilityRole="button" accessibilityLabel={uiT("ui.back_76900f1b")} onPress={() => router.back()} style={{ minHeight: 48, paddingVertical: 12, paddingRight: 24 }}><Text style={{ color: theme.textColor }}>{uiT("ui.back_9c47d2b0")}</Text></Pressable><Text style={{ color: theme.textColor, fontWeight: "600" }}>Bunpro {kind === "vocab" ? uiT("ui.vocabulary_0c7e0de2") : uiT("ui.grammar_e05eb8a4")}</Text></View>
    {isPortegoUsername(userData?.username) ? <BunproDetailsContent key={`${kind}:${slug}`} kind={kind} slug={slug} /> : <Text style={{ padding: 24, color: theme.textColor }}>{uiT("ui.bunpro_is_currently_available_only_for_the_portego_account_35918821")}</Text>}
  </SafeAreaView>;
}
