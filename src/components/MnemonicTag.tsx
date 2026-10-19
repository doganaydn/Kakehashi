import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

interface MnemonicTagProps {
  children: string;
  style: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
}

/** Highlight a mnemonic term without interrupting Android paragraph layout. */
export function MnemonicTag({ children, style, textStyle }: MnemonicTagProps) {
  if (Platform.OS !== "android") {
    return <View style={style}><Text style={textStyle}>{children}</Text></View>;
  }

  // Inline View attachments have their own layout and measured height. On
  // Android they can wrap separately from adjacent text or obscure a line.
  // A native text span shares the paragraph's wrapping and baseline from the
  // first render, including after font-scale and available-width changes.
  const badgeStyle = StyleSheet.flatten(style);
  const fontSize = StyleSheet.flatten(textStyle)?.fontSize ?? 14;
  return (
    <Text style={[textStyle, { backgroundColor: badgeStyle?.backgroundColor, lineHeight: fontSize + 4, includeFontPadding: false }]}>
      {"\u202f"}{children}{"\u202f"}
    </Text>
  );
}
