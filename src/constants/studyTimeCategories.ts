import { uiT } from "../features/interface-language/runtime";
import type { Ionicons } from "@expo/vector-icons";
import type { ActivityCategory } from "../services/timeTrackingCore";

type IoniconName = keyof typeof Ionicons.glyphMap;

export type StudyTimeCategoryMeta = {
  label: string;
  icon: IoniconName;
  color: string;
};

export const STUDY_TIME_CATEGORY_META: Record<ActivityCategory, StudyTimeCategoryMeta> = {
  reviews: { get label() { return uiT("ui.reviews_84cb7871"); }, icon: "albums-outline", color: "#00AAFF" },
  lessons: { get label() { return uiT("ui.lessons_cb4ad503"); }, icon: "school-outline", color: "#FF00AA" },
  extra_study: { get label() { return uiT("ui.extra_study_055dce81"); }, icon: "barbell-outline", color: "#AA00FF" },
  news: { get label() { return uiT("ui.nhk_news_f0e3c27e"); }, icon: "newspaper-outline", color: "#FF7043" },
  songs: { get label() { return uiT("ui.songs_bc676135"); }, icon: "musical-notes-outline", color: "#1DB954" },
  epub: { get label() { return uiT("ui.reading_463816d0"); }, icon: "book-outline", color: "#FFB300" },
  video: { get label() { return uiT("ui.video_d534be82"); }, icon: "play-circle-outline", color: "#E53935" },
};
