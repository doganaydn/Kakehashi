import { uiT } from "../features/interface-language/runtime";
import { StyleSheet } from "react-native";

export const DEFAULT_APP_TEXT_SIZE_SCALE = 1;
export const APP_TEXT_SIZE_SCALE_MIN = 1;
export const APP_TEXT_SIZE_SCALE_MAX = 3;

export const APP_TEXT_SIZE_OPTIONS = [
  {
    get label() { return uiT("ui.default_21b111cb"); },
    get description() { return uiT("ui.standard_app_text_size_edda9d12"); },
    scale: 1,
  },
  {
    get label() { return uiT("ui.large_ab80540d"); },
    get description() { return uiT("ui.a_comfortable_increase_for_larger_screens_7bbe287e"); },
    scale: 1.15,
  },
  {
    get label() { return uiT("ui.extra_large_f44f24c7"); },
    get description() { return uiT("ui.bigger_text_for_extended_reading_bd6534d5"); },
    scale: 1.3,
  },
  {
    get label() { return uiT("ui.largest_5511a4b7"); },
    get description() { return uiT("ui.maximum_text_size_for_phones_and_tablets_5c8797e2"); },
    scale: 1.5,
  },
  {
    get label() { return uiT("ui.huge_f171571d"); },
    get description() { return uiT("ui.larger_text_for_desktop_sized_displays_2911c04b"); },
    scale: 2,
  },
  {
    get label() { return uiT("ui.ultra_ac364e1a"); },
    get description() { return uiT("ui.extra_large_text_for_distant_viewing_7a5548b5"); },
    scale: 3,
  },
] as const;

export type AppTextSizeScale = (typeof APP_TEXT_SIZE_OPTIONS)[number]["scale"];

let currentAppTextSizeScale: AppTextSizeScale = DEFAULT_APP_TEXT_SIZE_SCALE;
let didInstallAppTextSizePreprocessors = false;

type StyleSheetWithPreprocessors = typeof StyleSheet & {
  setStyleAttributePreprocessor?: (
    property: string,
    process: (propValue: unknown) => unknown
  ) => void;
};

export function normalizeAppTextSizeScale(value: unknown): AppTextSizeScale {
  const numericValue =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : DEFAULT_APP_TEXT_SIZE_SCALE;

  return APP_TEXT_SIZE_OPTIONS.reduce<AppTextSizeScale>((closest, option) => {
    const closestDistance = Math.abs(closest - numericValue);
    const optionDistance = Math.abs(option.scale - numericValue);

    return optionDistance < closestDistance ? option.scale : closest;
  }, DEFAULT_APP_TEXT_SIZE_SCALE);
}

export function formatAppTextSizeScale(scale: number): string {
  return `${Math.round(normalizeAppTextSizeScale(scale) * 100)}%`;
}

export function applyAppTextSizeScale(scale: unknown): void {
  currentAppTextSizeScale = normalizeAppTextSizeScale(scale);
}

function scaleTextStyleValue(value: unknown): unknown {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return value;
  }

  return Number((value * currentAppTextSizeScale).toFixed(2));
}

export function installAppTextSizePreprocessors(): void {
  if (didInstallAppTextSizePreprocessors) {
    return;
  }

  const setStyleAttributePreprocessor = (
    StyleSheet as StyleSheetWithPreprocessors
  ).setStyleAttributePreprocessor;
  if (typeof setStyleAttributePreprocessor !== "function") {
    return;
  }

  didInstallAppTextSizePreprocessors = true;
  setStyleAttributePreprocessor("fontSize", scaleTextStyleValue);
  setStyleAttributePreprocessor("lineHeight", scaleTextStyleValue);
}
