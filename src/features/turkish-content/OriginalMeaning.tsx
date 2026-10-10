import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../utils/theme";

export function OriginalMeaning({english, alternatives}: {english: string; alternatives: string[]}) {
  const { theme } = useTheme();
  return <View style={{marginVertical: 6}}>
    <Text selectable style={{color: theme.textSecondary}}>İngilizce: {english}</Text>
    {alternatives.length > 0 && <Text selectable style={{color: theme.textColor, marginTop: 4}}>
      Türkçe diğer karşılıklar: {alternatives.join(", ")}
    </Text>}
  </View>;
}
