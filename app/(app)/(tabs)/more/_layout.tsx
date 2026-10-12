import { uiT, useInterfaceLanguage } from "../../../../src/features/interface-language/runtime";
import { Stack } from "expo-router";
import { TAB_INFO } from "../../../../src/utils/tabNavigation";
export default function MoreLayout() {
  useInterfaceLanguage();
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="index" options={{ title: uiT("ui.more_d47d7cb0") }} />
    {TAB_INFO.filter(tab => !tab.isRequired).map(tab => <Stack.Screen key={tab.id} name={tab.id} options={{ title: tab.label }} />)}
  </Stack>;
}
