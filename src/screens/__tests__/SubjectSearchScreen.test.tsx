import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";

import SubjectSearchScreen from "../SubjectSearchScreen";
import SearchModal from "../../components/SearchModal";

jest.mock("@shopify/flash-list", () => ({
  FlashList: jest.requireActual("react-native").FlatList,
}));

const mockResolveMeaning = jest.fn(() => null);
const mockMeaning = jest.fn((subject, fallback) => fallback);
const mockDisplay = { meaning: mockMeaning, resolveMeaning: mockResolveMeaning };
jest.mock("../../features/translation-packages/display", () => ({
  useLearningDisplay: () => mockDisplay,
}));

jest.mock("react-native-worklets", () => jest.requireActual("react-native-worklets/lib/module/mock"));
jest.mock("react-native-reanimated", () => jest.requireActual("react-native-reanimated/mock"));

const mockRouter = { push: jest.fn() };
const mockDashboardData = { assignments: [] };
let mockDimensions = { width: 390, height: 844, scale: 3, fontScale: 1 };
let mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
let mockSupportsNativeTabs = false;

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true, default: () => mockDimensions,
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockInsets,
}));
jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: { View: jest.requireActual("react-native").View },
  Easing: { bezier: () => undefined },
  ReduceMotion: { System: "system" },
  useSharedValue: (value: number) => jest.requireActual("react").useRef({ value }).current,
  useAnimatedStyle: (callback: () => object) => callback(),
  withTiming: (value: number) => value,
}));
const mockSubjects = [
  ...Array.from({ length: 220 }, (_, index) => ({
    id: index + 1,
    object: "vocabulary",
    data: {
      level: 1,
      characters: "場所",
      meanings: [{ meaning: "Place", primary: true }],
      readings: [],
      parts_of_speech: ["noun"],
    },
  })),
  {
    id: 500,
    object: "vocabulary",
    data: {
      level: 10,
      characters: "日本",
      meanings: [{ meaning: "Place in Japan", primary: true }],
      readings: [],
      parts_of_speech: ["proper noun"],
    },
  },
  {
    id: 9232,
    object: "kana_vocabulary",
    data: {
      level: 21,
      characters: "ドキドキ",
      meanings: [{ meaning: "Pounding Heart", primary: true }],
      parts_of_speech: ["adverb"],
    },
  },
];

jest.mock("expo-router", () => {
  const React = jest.requireActual("react");
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => ({}),
    useFocusEffect: (callback: () => void) => React.useEffect(callback, [callback]),
  };
});

jest.mock("../../hooks/useDashboardData", () => ({
  useDashboardData: () => ({ dashboardData: mockDashboardData }),
}));
jest.mock("../../utils/store", () => ({ useAuthStore: () => ({ apiToken: "token" }) }));
jest.mock("../../utils/cache", () => ({
  checkSubjectsCacheHealth: jest.fn(() => Promise.resolve({ isHealthy: true, issues: [] })),
  getAllSubjects: jest.fn(() => Promise.resolve(mockSubjects)),
  saveToCache: jest.fn(),
}));
jest.mock("../../utils/api", () => ({
  getSubjects: jest.fn(() => Promise.resolve({ data: mockSubjects })),
  getAllAssignmentsCached: jest.fn(() => Promise.resolve({ data: [] })),
}));
jest.mock("../../utils/nativeTabs", () => ({ supportsNativeTabs: () => mockSupportsNativeTabs }));
jest.mock("../../utils/fonts", () => ({ fontStyles: {} }));
jest.mock("../../utils/radicalSvg", () => ({
  pickBestImage: () => null,
  useRemoteSvg: () => null,
}));
jest.mock("expo-blur", () => {
  const { View } = jest.requireActual("react-native");
  return { BlurView: View };
});
jest.mock("@expo/vector-icons", () => {
  const React = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");
  return { Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name) };
});
jest.mock("../../components/GlassButton", () => {
  const React = jest.requireActual("react");
  const { TouchableOpacity } = jest.requireActual("react-native");
  return {
    GlassButton: ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) =>
      React.createElement(TouchableOpacity, { onPress }, children),
  };
});
jest.mock("../../utils/subjectColors", () => ({
  getSubjectTypeColor: () => "#8800cc",
  useSubjectColors: () => ({ radical: "#0088cc", kanji: "#cc0088", vocabulary: "#8800cc" }),
}));
jest.mock("../../utils/theme", () => ({
  useTheme: () => ({
    theme: {
      isDark: false, primary: "#6d28d9", textColor: "#111111", textSecondary: "#666666",
      textLight: "#888888", border: "#dddddd", cardBackground: "#ffffff",
      backgroundColor: "#f5f5f5", error: "#dc2626",
    },
  }),
}));

beforeEach(() => {
  jest.useFakeTimers();
  mockResolveMeaning.mockReset();
  mockDimensions = { width: 390, height: 844, scale: 3, fontScale: 1 };
  mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  mockSupportsNativeTabs = false;
});
afterEach(() => jest.useRealTimers());

it("finds ドキドキ by romaji and opens its subject details", async () => {
  const screen = render(<SubjectSearchScreen />);
  await waitFor(() => expect(screen.UNSAFE_getByType(FlatList).props.data).toHaveLength(200));

  fireEvent.changeText(screen.getByPlaceholderText("Search kanji, vocabulary, or meanings..."), "Dokidoki");
  await act(async () => { jest.advanceTimersByTime(400); });

  await screen.findByText("Pounding Heart");
  expect(screen.UNSAFE_getByType(FlatList).props.data.map((item: { id: number }) => item.id)).toEqual([9232]);
  fireEvent.press(screen.getByText("ドキドキ"));
  expect(mockRouter.push).toHaveBeenCalledWith("/subject/9232");
});

it("filters browsing and ranked search before result limits, and restores results when cleared", async () => {
  const screen = render(<SubjectSearchScreen />);
  await waitFor(() => expect(screen.UNSAFE_getByType(FlatList).props.data).toHaveLength(200));

  fireEvent.press(screen.getByLabelText("Search filters"));
  await act(async () => { jest.advanceTimersByTime(350); });
  fireEvent.press(screen.getByLabelText("Vocab type: All"));
  fireEvent.press(screen.getByLabelText("Proper noun vocabulary type"));
  expect(screen.getByLabelText("Proper noun vocabulary type").props.accessibilityState.checked).toBe(true);
  fireEvent.press(screen.getByRole("button", { name: "Apply Filters" }));
  expect(screen.getByLabelText("Search filters, 1 active")).toBeTruthy();

  await waitFor(() => {
    expect(screen.UNSAFE_getByType(FlatList).props.data.map((item: { id: number }) => item.id)).toEqual([500]);
  });
  expect(screen.getByLabelText("Search filters, 1 active")).toBeTruthy();

  fireEvent.changeText(screen.getByPlaceholderText("Search kanji, vocabulary, or meanings..."), "place");
  await act(async () => { jest.advanceTimersByTime(400); });
  await screen.findByText("Place in Japan");
  await waitFor(() => {
    expect(screen.UNSAFE_getByType(FlatList).props.data.map((item: { id: number }) => item.id)).toEqual([500]);
  });

  fireEvent.press(screen.getByLabelText("Search filters, 1 active"));
  await act(async () => { jest.advanceTimersByTime(350); });
  const collapsedType = screen.getByLabelText("Vocab type: Proper noun");
  if (!collapsedType.props.accessibilityState.expanded) fireEvent.press(collapsedType);
  fireEvent.press(screen.getByLabelText("Clear vocabulary types"));
  fireEvent.press(screen.getByRole("button", { name: "Apply Filters" }));

  await waitFor(() => expect(screen.UNSAFE_getByType(FlatList).props.data.length).toBeGreaterThan(1));
  expect(screen.getByLabelText("Search filters")).toBeTruthy();
}, 20000);

it("keeps native search actions reachable as the window opens, closes, and moves its rail", async () => {
  mockSupportsNativeTabs = true;
  const screen = render(<SubjectSearchScreen />);
  await waitFor(() => expect(screen.UNSAFE_getByType(FlatList).props.data).toHaveLength(200));

  const floatingControls = () => screen.UNSAFE_getAllByType(View).find((view) =>
    StyleSheet.flatten(view.props.style)?.position === "absolute"
    && StyleSheet.flatten(view.props.style)?.borderRadius === 30);
  expect(floatingControls()).toBeUndefined();

  mockDimensions = { ...mockDimensions, width: 1040, height: 730 };
  mockInsets = { ...mockInsets, right: 84 };
  screen.rerender(<SubjectSearchScreen />);
  expect(StyleSheet.flatten(floatingControls()!.props.style)).toMatchObject({ right: 108 });
  expect(screen.getAllByLabelText("Search filters")).toHaveLength(1);

  mockInsets = { ...mockInsets, left: 84, right: 0 };
  screen.rerender(<SubjectSearchScreen />);
  expect(StyleSheet.flatten(floatingControls()!.props.style)).toMatchObject({ right: 24 });
  expect(StyleSheet.flatten(screen.UNSAFE_getAllByType(View)[0].props.style)).toMatchObject({ paddingLeft: 84, paddingRight: 0 });

  mockDimensions = { ...mockDimensions, width: 390, height: 844 };
  screen.rerender(<SubjectSearchScreen />);
  expect(floatingControls()).toBeUndefined();
  expect(screen.getAllByLabelText("Search filters")).toHaveLength(1);
});

 it("renders translated meanings from full source records and updates when translations change", async () => {
  const sourceSnapshot = JSON.stringify(mockSubjects);
  mockMeaning.mockImplementation((subject, fallback) => subject.id === 9232 ? "Kalp Çarpıntısı" : fallback);
  const screen = render(<SubjectSearchScreen />);
  await waitFor(() => expect(screen.UNSAFE_getByType(FlatList).props.data).toHaveLength(200));
  fireEvent.changeText(screen.getByPlaceholderText("Search kanji, vocabulary, or meanings..."), "Dokidoki");
  await act(async () => { jest.advanceTimersByTime(400); });
  expect(await screen.findByText("Kalp Çarpıntısı")).toBeTruthy();
  expect(mockMeaning).toHaveBeenCalledWith(mockSubjects.find(s => s.id === 9232), "Pounding Heart");
  mockMeaning.mockImplementation((subject, fallback) => fallback);
  screen.rerender(<SubjectSearchScreen />);
  expect(await screen.findByText("Pounding Heart")).toBeTruthy();
  expect(JSON.stringify(mockSubjects)).toBe(sourceSnapshot);
});

it.each(["Pounding", "carpinti", "YÜREK"])("shows translated modal search results for %s", async query => {
  mockResolveMeaning.mockImplementation(subject => subject.id === 9232 ? { primary: "Kalp Çarpıntısı", alternatives: ["Yürek"] } : null);
  mockMeaning.mockImplementation((subject, fallback) => subject.id === 9232 ? "Kalp Çarpıntısı" : fallback);
  const screen = render(<SearchModal visible onClose={jest.fn()} />);
  await screen.findByPlaceholderText("Search kanji, vocabulary, or meanings...");
  fireEvent.changeText(screen.getByPlaceholderText("Search kanji, vocabulary, or meanings..."), query);
  await act(async () => { jest.advanceTimersByTime(700); });
  expect(await screen.findByText("Kalp Çarpıntısı")).toBeTruthy();
  expect(mockMeaning).toHaveBeenCalledWith(mockSubjects.find(s => s.id === 9232), "Pounding Heart");
  mockMeaning.mockImplementation((subject, fallback) => fallback);
  screen.rerender(<SearchModal visible onClose={jest.fn()} />);
  expect(await screen.findByText("Pounding Heart")).toBeTruthy();
});

it.each(["Kalp Çarpıntısı", "YUREK", "yürek"])("finds Turkish primary and alternative meanings: %s", async query => {
  mockResolveMeaning.mockImplementation(subject => subject.id === 9232 ? { primary: "Kalp Çarpıntısı", alternatives: ["Yürek"] } : null);
  const screen = render(<SubjectSearchScreen />);
  await waitFor(() => expect(screen.UNSAFE_getByType(FlatList).props.data).toHaveLength(200));
  fireEvent.changeText(screen.getByPlaceholderText("Search kanji, vocabulary, or meanings..."), query);
  await act(async () => { jest.advanceTimersByTime(400); });
  await waitFor(() => expect(screen.UNSAFE_getByType(FlatList).props.data.map(item => item.id)).toContain(9232));
});
