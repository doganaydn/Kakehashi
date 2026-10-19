import React from "react";
import { Platform, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

interface MnemonicTagProps {
  children: string;
  style: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
}

/** Keep the original badge colors with a single naturally sized attachment. */
export function MnemonicTag({ children, style, textStyle }: MnemonicTagProps) {
  if (Platform.OS !== "android") {
    return <View style={style}><Text style={textStyle}>{children}</Text></View>;
  }
  const badgeStyle = StyleSheet.flatten(style);
  return (
    <View style={[style, { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, marginHorizontal: badgeStyle?.marginHorizontal ?? 2 }]}>
      <Text style={[textStyle, { includeFontPadding: false }]}>{children}</Text>
    </View>
  );
}
