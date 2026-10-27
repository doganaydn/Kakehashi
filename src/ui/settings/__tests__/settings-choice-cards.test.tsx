import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { SettingsChoiceCards } from "../settings-choice-cards";

let mockFontScale = 1;
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: 393, height: 852, scale: 2.75, fontScale: mockFontScale }),
}));
jest.mock("../settings-search", () => ({ useSettingsSearchEntry: jest.fn() }));
jest.mock("../screen-preview", () => ({ SettingsScreenPreview: () => null }));
jest.mock("../review-mode-preview", () => ({ ReviewModeSketch: () => null }));
jest.mock("../settings-icon", () => ({ SettingsIcon: () => null }));
const theme = { primary: "#38f", textColor: "#111", textSecondary: "#666", cardBackground: "#fff", border: "#ddd" };
const options = ["System", "Light", "Dark", "Sepia", "Midnight"].map(value => ({ value, label: value, art: "theme-light" as any }));
function rowOf(card: any) {
 let parent = card.parent;
 while (parent && parent.props.style?.flexDirection !== "row") parent = parent.parent;
 return parent;
}
beforeEach(() => { mockFontScale = 1; });
it.each([2, 3, 5])("keeps %s options in explicit rows across fractional widths without wrapping", count => {
 const screen = render(<SettingsChoiceCards label="Layout" value="System" options={options.slice(0, count)} onChange={jest.fn()} theme={theme} />);
 const cards = screen.getAllByRole("radio");
 const columns = count === 3 ? 3 : 2;
 const grid = screen.root.findAll(node => !!node.props.onLayout && node.props.style?.gap === 8)[0];
 for (const width of [320, 319.6363525390625, 316.7272644042969]) {
  act(() => grid.props.onLayout({ nativeEvent: { layout: { width } } }));
  expect(rowOf(cards[0])).toBe(rowOf(cards[1]));
  if (count === 3) expect(rowOf(cards[1])).toBe(rowOf(cards[2]));
  if (count > columns) expect(rowOf(cards[columns])).not.toBe(rowOf(cards[0]));
  for (const card of cards) {
   const style = StyleSheet.flatten(card.props.style);
   expect(style.flex).toBe(1);
   expect(style.width).toBeUndefined();
   expect(rowOf(card).props.style.flexWrap).toBeUndefined();
  }
 }
});
it("retains large-text single columns, selection, disabled choices and callbacks", () => {
 mockFontScale = 1.5;
 const onChange = jest.fn();
 const screen = render(<SettingsChoiceCards label="Layout" value="System" options={[options[0], options[1], { ...options[2], disabled: true }]} onChange={onChange} theme={theme} />);
 const cards = screen.getAllByRole("radio");
 expect(rowOf(cards[0])).not.toBe(rowOf(cards[1]));
 expect(screen.getByRole("radio", { name: "System" }).props.accessibilityState.checked).toBe(true);
 fireEvent.press(screen.getByRole("radio", { name: "Light" })); expect(onChange).toHaveBeenCalledWith("Light");
 fireEvent.press(screen.getByRole("radio", { name: "Dark" })); expect(onChange).toHaveBeenCalledTimes(1);
});
