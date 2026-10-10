import React from "react";
import { Switch, Text, View } from "react-native";
import { useTheme } from "../../utils/theme";
import { useLearningContentStore } from "./store";

export function ContentLanguageSetting() {
  const { theme } = useTheme();
  const language = useLearningContentStore(s => s.language);
  const setLanguage = useLearningContentStore(s => s.setLanguage);
  return <View style={{paddingVertical: 12}}>
    <View style={{flexDirection: "row", alignItems: "center", justifyContent: "space-between"}}>
      <Text style={{color: theme.textColor, fontSize: 16}}>Türkçe öğrenme içeriği</Text>
      <Switch accessibilityLabel="Türkçe öğrenme içeriği" value={language === "tr"}
        onValueChange={enabled => setLanguage(enabled ? "tr" : "en")} />
    </View>
    <Text style={{color: theme.textSecondary, marginTop: 6}}>
      Deneme: 21 anlam ve 35 kontrol edilmiş örnek. Eksik içerik İngilizce gösterilir.
      Uygulamanın menü dili değişmez.
    </Text>
  </View>;
}
