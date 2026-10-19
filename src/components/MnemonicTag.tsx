import React, { useState } from "react";
import { Platform, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle, type TextLayoutEvent } from "react-native";

interface MnemonicTagProps {
  children: string;
  style: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
}

/** Keep the original badge colors with a single naturally sized attachment. */
export function MnemonicTag({ children, style, textStyle }: MnemonicTagProps) {
  const [baselineOffset, setBaselineOffset] = useState(0);
  if (Platform.OS !== "android") {
    return <View style={style}><Text style={textStyle}>{children}</Text></View>;
  }
  const badgeStyle = StyleSheet.flatten(style);
  const onTextLayout = ({ nativeEvent }: TextLayoutEvent) => {
    const line = nativeEvent.lines.at(-1);
    if (!line) return;
    // The inline attachment bottom sits on the surrounding text baseline.
    // Move only its drawing down by the label descender plus bottom padding;
    // never change its measured height or introduce another inline View.
    const offset = line.height - line.ascender + 2;
    if (Number.isFinite(offset) && offset >= 0) setBaselineOffset(previous => previous === offset ? previous : offset);
  };
  return (
    <View style={[style, { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, marginHorizontal: badgeStyle?.marginHorizontal ?? 2, transform: [{ translateY: baselineOffset }] }]}>
      <Text onTextLayout={onTextLayout} style={[textStyle, { includeFontPadding: false }]}>{children}</Text>
    </View>
  );
}
