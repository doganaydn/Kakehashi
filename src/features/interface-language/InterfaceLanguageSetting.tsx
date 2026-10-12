import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../utils/theme";
import { SettingsLabel } from "../../ui/settings/settings-search";
import { uiT, useInterfaceLanguageStore } from "./runtime";

export function InterfaceLanguageSetting() {
  const { theme } = useTheme();
  const language = useInterfaceLanguageStore((s) => s.language);
  const setLanguage = useInterfaceLanguageStore((s) => s.setLanguage);
  if (Platform.OS !== "android") return null;
  return <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
    <SettingsLabel style={{ color: theme.textColor, fontSize: 16 }}>{uiT("common.interface_language")}</SettingsLabel>
    <Text style={{ color: theme.textSecondary, marginTop: 4 }}>{uiT("common.interface_language_help")}</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
      {(["en", "tr"] as const).map((code) => <TouchableOpacity key={code}
        accessibilityRole="radio" accessibilityState={{ checked: code === language }}
        accessibilityLabel={code === "en" ? "English" : "Türkçe"}
        onPress={() => setLanguage(code)}
        style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: "center", borderRadius: 8,
          borderWidth: 1, borderColor: theme.primary, backgroundColor: code === language ? theme.primary : theme.cardBackground }}>
        <Text style={{ color: code === language ? "#fff" : theme.textColor }}>{code === "en" ? "English" : "Türkçe"}</Text>
      </TouchableOpacity>)}
    </View>
  </View>;
}
