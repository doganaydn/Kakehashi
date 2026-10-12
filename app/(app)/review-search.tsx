import { uiT, useInterfaceLanguage } from "../../src/features/interface-language/runtime";
import { Stack, useRouter } from "expo-router";
import SubjectSearchScreen from "../../src/screens/SubjectSearchScreen";
import { supportsNativeTabs } from "../../src/utils/nativeTabs";

export default function ReviewSearchScreen() {
  useInterfaceLanguage();
  const router = useRouter();
  const showNativeSearchBar = supportsNativeTabs();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerBackTitleVisible: false,
          headerTransparent: showNativeSearchBar,
          headerShadowVisible: !showNativeSearchBar,
          // @ts-ignore iOS-only native search bar options
          headerSearchBarOptions: showNativeSearchBar
            ? {
                placement: "automatic",
                placeholder: uiT("ui.search_kanji_vocabulary_or_meanings_d720abb2"),
                autoFocus: true,
                hideNavigationBar: false,
                onChangeText: (
                  event: { nativeEvent?: { text?: string } } | undefined
                ) => {
                  const text = event?.nativeEvent?.text ?? "";
                  router.setParams({ query: text });
                },
                onCancelButtonPress: () => {
                  router.setParams({ query: "" });
                },
              }
            : undefined,
        }}
      />
      <SubjectSearchScreen
        forceInlineSearchBar={!showNativeSearchBar}
        topPadding={showNativeSearchBar ? 60 : 12}
        showNativeTopTitle={false}
      />
    </>
  );
}
