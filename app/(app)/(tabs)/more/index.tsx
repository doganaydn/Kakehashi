import { uiT, useInterfaceLanguage } from "../../../../src/features/interface-language/runtime";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTabNavigation } from "../../../../src/hooks/useTabNavigation";
import { useTheme } from "../../../../src/utils/theme";

export default function MoreScreen() {
  useInterfaceLanguage();
  const { overflow } = useTabNavigation();
  const { theme } = useTheme();
  return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
    {overflow.map(tab => <TouchableOpacity key={tab.id} accessibilityRole="button" accessibilityLabel={tab.label}
      onPress={() => router.push(`/(app)/(tabs)/more/${tab.id}` as Href)}
      style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: theme.border }}>
      <Ionicons name={tab.icon} size={24} color={theme.primary} />
      <View style={{ flex: 1, gap: 4 }}><Text style={{ color: theme.textColor, fontSize: 17, fontWeight: "600" }}>{tab.label}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{tab.description}</Text></View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </TouchableOpacity>)}
    <TouchableOpacity accessibilityRole="button" onPress={() => router.push("/tab-settings")} style={{ paddingVertical: 20 }}>
      <Text style={{ color: theme.primary, fontSize: 16 }}>{uiT("ui.customize_tabs_c4f73a60")}</Text>
    </TouchableOpacity>
    </ScrollView>
  </SafeAreaView>;
}
