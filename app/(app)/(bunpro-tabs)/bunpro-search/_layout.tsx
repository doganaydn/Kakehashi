import { uiT, useInterfaceLanguage } from "../../../../src/features/interface-language/runtime";
import { Stack, useRouter } from "expo-router";
import { supportsNativeTabs } from "../../../../src/utils/nativeTabs";
import { bunproNativeSearchBarRef } from "./searchBarRef";

export default function BunproSearchLayout() {
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
                ref: bunproNativeSearchBarRef,
                placement: "automatic",
                placeholder: uiT("ui.search_bunpro_grammar_or_vocabulary_53042d3d"),
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
