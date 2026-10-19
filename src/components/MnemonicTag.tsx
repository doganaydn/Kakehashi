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

import { useTheme } from "../utils/theme";

function mixHex(color: unknown, target: number, amount: number): string | undefined {
  if (typeof color !== "string" || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return undefined;
  const hex = color.length === 4 ? color.slice(1).split("").map(c => c + c).join("") : color.slice(1);
  const channels = [0, 2, 4].map(offset => Math.round(parseInt(hex.slice(offset, offset + 2), 16) * (1 - amount) + target * amount));
  return "#" + channels.map(channel => channel.toString(16).padStart(2, "0")).join("");
}

interface MnemonicTagProps {
  children: string;
  style: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
}

/** Highlight a mnemonic term without interrupting Android paragraph layout. */
export function MnemonicTag({ children, style, textStyle }: MnemonicTagProps) {
  const { theme } = useTheme();
  if (Platform.OS !== "android") {
    return <View style={style}><Text style={textStyle}>{children}</Text></View>;
  }

  // Inline View attachments have their own layout and measured height. On
  // Android they can wrap separately from adjacent text or obscure a line.
  // A native text span shares the paragraph's wrapping and baseline from the
  // first render, including after font-scale and available-width changes.
  const badgeStyle = StyleSheet.flatten(style);
  const accent = badgeStyle?.backgroundColor;
  const backgroundColor = mixHex(accent, theme.isDark ? 0 : 255, 0.88) ?? accent;
  const color = mixHex(accent, theme.isDark ? 255 : 0, theme.isDark ? 0.55 : 0.48);
  return (
    <Text style={[textStyle, { backgroundColor }, color ? { color } : undefined]}>
      {children}
    </Text>
  );
}
