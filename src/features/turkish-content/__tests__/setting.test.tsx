import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { ContentLanguageSetting } from "../ContentLanguageSetting";
import { useLearningContentStore } from "../store";

jest.mock("../../../utils/theme", () => ({useTheme: () => ({theme: {
  textColor: "#111", textSecondary: "#555", primary: "#08f",
}})}));

it("lets the user turn Turkish content off and back on", () => {
  useLearningContentStore.setState({language: "tr"});
  const screen = render(<ContentLanguageSetting />);
  const toggle = screen.getByLabelText("Türkçe öğrenme içeriği");
  fireEvent(toggle, "valueChange", false);
  expect(useLearningContentStore.getState().language).toBe("en");
  expect(screen.getByLabelText("Türkçe öğrenme içeriği").props.value).toBe(false);
  fireEvent(toggle, "valueChange", true);
  expect(useLearningContentStore.getState().language).toBe("tr");
});
