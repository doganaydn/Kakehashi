import { uiT, useInterfaceLanguage } from "../../../../src/features/interface-language/runtime";
import { Stack, useRouter } from "expo-router";
import { supportsNativeTabs } from "../../../../src/utils/nativeTabs";
import { nativeSearchBarRef } from "./searchBarRef";

export default function SearchLayout() {
  useInterfaceLanguage();
  const router = useRouter();
  const showNativeSearchBar = supportsNativeTabs();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "",
          headerShown: showNativeSearchBar,
          headerTransparent: true,
          headerShadowVisible: false,
          // @ts-ignore
          headerSearchBarOptions: showNativeSearchBar
            ? {
                ref: nativeSearchBarRef,
                placement: "automatic",
                placeholder: uiT("ui.search_kanji_vocabulary_or_meanings_d720abb2"),
                autoFocus: true,
                onChangeText: (event) => {
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
    </Stack>
  );
}
