import { widgetUiLabel } from "../features/interface-language/runtime";
import { requireOptionalNativeModule } from "expo-modules-core";
import type { HomeWidgetController } from "./homeWidgetController";
import type { HomeWidgetProps } from "./homeWidget";

function localizeProps(props: HomeWidgetProps): HomeWidgetProps {
  const copy = { ...props };
  const fields = ["reviewsPrimaryLabel", "reviewsSecondaryLabel", "reviewsTertiaryLabel", "criticalPrimaryLabel", "criticalSecondaryLabel", "criticalTertiaryLabel", "streakPrimaryLabel", "streakSecondaryLabel", "streakTertiaryLabel"] as const;
  for (const field of fields) copy[field] = widgetUiLabel(props[field]);
  return copy;
}

type NativeEntry = { timestamp: number; props: HomeWidgetProps };
type NativeHomeWidget = {
  updateSnapshot: (json: string) => void;
  updateTimeline: (json: string) => void;
  reload: () => void;
  getTimeline: () => Promise<string>;
  requestPin: () => Promise<boolean>;
};

const nativeWidget = requireOptionalNativeModule<NativeHomeWidget>("KakehashiHomeWidget");

const controller: HomeWidgetController = {
  updateSnapshot: (props) => nativeWidget?.updateSnapshot(JSON.stringify(localizeProps(props))),
  updateTimeline: (entries) => nativeWidget?.updateTimeline(JSON.stringify(
    entries.map(({ date, props }) => ({ timestamp: date.getTime(), props: localizeProps(props) })),
  )),
  reload: () => nativeWidget?.reload(),
  getTimeline: async () => {
    const entries: NativeEntry[] = JSON.parse(await nativeWidget?.getTimeline() ?? "[]");
    return entries.map(({ timestamp, props }) => ({ date: new Date(timestamp), props }));
  },
};

export default controller;

export async function requestPinHomeWidget(): Promise<boolean> {
  return await nativeWidget?.requestPin() ?? false;
}
