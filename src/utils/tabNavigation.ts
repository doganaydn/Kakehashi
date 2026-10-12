import { uiT } from "../features/interface-language/runtime";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supportsNativeTabs } from "./nativeTabs";

export type TabId =
  | "home"
  | "progress"
  | "news"
  | "songs"
  | "items"
  | "analytics"
  | "epubs"
  | "videos"
  | "mangas"
  | "notebooks";

interface TabInfo {
  id: TabId;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  sfIcon?: string;
  isRequired?: boolean;
  isClusterable?: boolean; // Can be clustered inside progress
  requiresFeatureFlag?: boolean;
}

export const TAB_INFO: TabInfo[] = [
  {
    id: "home",
    get label() { return uiT("ui.home_3a786953"); },
    get description() { return uiT("ui.dashboard_with_reviews_lessons_and_progress_1ae4c3d8"); },
    icon: "home",
    sfIcon: "house.fill",
    isRequired: true,
  },
  {
    id: "progress",
    get label() { return uiT("ui.level_1709305c"); },
    get description() { return uiT("ui.current_level_progress_and_srs_stages_9f857f9c"); },
    icon: "trending-up",
    sfIcon: "chart.line.text.clipboard.fill",
    isRequired: true,
  },
  {
    id: "items",
    get label() { return uiT("ui.items_fb8e7a1a"); },
    get description() { return uiT("ui.browse_all_radicals_kanji_and_vocabulary_d34cccff"); },
    icon: "library",
    sfIcon: "square.stack.3d.up.fill",
    isClusterable: true,
  },
  {
    id: "analytics",
    get label() { return uiT("ui.analytics_94c116ee"); },
    get description() { return uiT("ui.detailed_statistics_and_review_history_3ea89922"); },
    icon: "analytics",
    sfIcon: "chart.bar.fill",
    isClusterable: true,
  },
  {
    id: "epubs",
    get label() { return uiT("ui.books_9da7f76b"); },
    get description() { return uiT("ui.epub_library_and_reader_ea2fe5b7"); },
    icon: "book",
    sfIcon: "book.closed.fill",
  },
  {
    id: "videos",
    get label() { return uiT("ui.video_d534be82"); },
    get description() { return uiT("ui.video_player_with_transcripts_and_wanikani_jpdb_integration_07c0d33b"); },
    icon: "videocam",
    sfIcon: "play.square.fill",
  },
  {
    id: "mangas",
    get label() { return uiT("ui.manga_69fc4fcd"); },
    get description() { return uiT("ui.cbz_pdf_manga_reader_with_ocr_sentence_and_word_lookup_f39b2f04"); },
    icon: "bookmarks",
    sfIcon: "books.vertical.fill",
  },
  {
    id: "notebooks",
    get label() { return uiT("ui.notebooks_0ae9bd5b"); },
    get description() { return uiT("ui.study_notes_linked_vocabulary_and_shared_notebook_pages_6c6b2353"); },
    icon: "document-text",
    sfIcon: "note.text",
  },
  {
    id: "news",
    get label() { return uiT("ui.news_69752f23"); },
    get description() { return uiT("ui.latest_updates_from_wanikani_72d08a9b"); },
    icon: "newspaper",
    sfIcon: "newspaper.fill",
  },
  {
    id: "songs",
    get label() { return uiT("ui.music_6eb00b4b"); },
    get description() { return uiT("ui.japanese_songs_for_learning_9f924109"); },
    icon: "musical-notes",
    sfIcon: "music.note.list",
    requiresFeatureFlag: true,
  },
];

export function getMaxTabsForDevice(): number {
  if (Platform.OS !== "ios") {
    return 5;
  }

  return supportsNativeTabs() ? 4 : 5;
}

export function partitionTabs(order: readonly string[], maxTabs: number, showSongs: boolean, showManga: boolean) {
  const selected = new Set(["home", "progress", ...order]);
  const enabled = TAB_INFO.filter(tab => selected.has(tab.id)
    && (tab.id !== "songs" || showSongs)
    && (tab.id !== "mangas" || showManga));
  const hasOverflow = enabled.length > maxTabs;
  const direct = enabled.slice(0, hasOverflow ? maxTabs - 1 : maxTabs);
  return { direct, overflow: enabled.slice(direct.length), enabled };
}
