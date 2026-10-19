import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { Platform, StyleSheet, Text, View } from "react-native";
import { MnemonicTag } from "../MnemonicTag";

const badgeStyle = { backgroundColor: "#f09", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginHorizontal: 2 };
const labelStyle = { fontSize: 14, fontWeight: "bold" as const, color: "white" };
afterEach(() => jest.restoreAllMocks());
it("preserves original colors in a single rounded Android badge without height changes", () => {
  jest.replaceProperty(Platform, "OS", "android");
  const screen = render(<MnemonicTag style={badgeStyle} textStyle={labelStyle}>Kuzey</MnemonicTag>);
  expect(screen.UNSAFE_getAllByType(View)).toHaveLength(1);
  expect(StyleSheet.flatten(screen.UNSAFE_getByType(View).props.style)).toMatchObject({ backgroundColor: "#f09", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 });
  expect(StyleSheet.flatten(screen.UNSAFE_getByType(View).props.style).height).toBeUndefined();
  expect(StyleSheet.flatten(screen.getByText("Kuzey").props.style)).toMatchObject({ color: "white", includeFontPadding: false });
  fireEvent(screen.getByText("Kuzey"), "textLayout", { nativeEvent: { lines: [{ y: 0, height: 18, ascender: 14 }] } });
  expect(StyleSheet.flatten(screen.UNSAFE_getByType(View).props.style).transform).toEqual([{ translateY: 6 }]);
  expect(StyleSheet.flatten(screen.UNSAFE_getByType(View).props.style).height).toBeUndefined();
  expect(screen.UNSAFE_getAllByType(View)).toHaveLength(1);
  fireEvent(screen.getByText("Kuzey"), "textLayout", { nativeEvent: { lines: [{ y: 0, height: 27, ascender: 21 }] } });
  expect(StyleSheet.flatten(screen.UNSAFE_getByType(View).props.style).transform).toEqual([{ translateY: 8 }]);
});
it("keeps the iOS badge styles unchanged", () => {
  jest.replaceProperty(Platform, "OS", "ios");
  const screen = render(<MnemonicTag style={badgeStyle} textStyle={labelStyle}>north</MnemonicTag>);
  expect(screen.UNSAFE_getByType(View).props.style).toBe(badgeStyle);
  expect(screen.UNSAFE_getByType(Text).props.style).toBe(labelStyle);
});
