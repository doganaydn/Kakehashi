import { uiT } from "../interface-language/runtime";
import type { SettingsArtworkName } from "../../ui/settings/artwork";
export const SETTINGS_CATEGORIES: readonly {
  id: string;
  title: string;
  description: string;
  icon: SettingsArtworkName;
  sections: readonly string[];
  group: string;
}[] = [
  {
    id: "reviews",
    get title() { return uiT("ui.reviews_84cb7871"); },
    get description() { return uiT("ui.answer_modes_review_order_and_feedback_c310dfac"); },
    icon: "reviews",
    sections: ["reviews"],
    group: "Study",
  },
  {
    id: "lessons",
    get title() { return uiT("ui.lessons_cb4ad503"); },
    get description() { return uiT("ui.daily_pace_ordering_and_lesson_layout_1ccb7e43"); },
    icon: "lessons",
    sections: ["lessons"],
    group: "Study",
  },
  {
    id: "vocabulary",
    get title() { return uiT("ui.vocabulary_kanji_9ca7447f"); },
    get description() { return uiT("ui.context_stroke_practice_and_item_details_2dbb7e37"); },
    icon: "kanji",
    sections: ["vocabContext", "kanji", "subjectDetails", "subjectLists"],
    group: "Study",
  },
  {
    id: "bunpro",
    title: "Bunpro",
    get description() { return uiT("ui.connection_and_grammar_review_preferences_2fa2bc8b"); },
    icon: "bunpro",
    sections: ["bunproReviews"],
    group: "Study",
  },
  {
    id: "reading",
    get title() { return uiT("ui.reading_listening_6e4eb42e"); },
    get description() { return uiT("ui.news_lyrics_voices_and_music_playback_e38988fa"); },
    icon: "reader",
    sections: ["readingDefaults", "voice", "musicPlayback"],
    group: "Study",
  },
  {
    id: "appearance",
    get title() { return uiT("ui.appearance_3907fa7f"); },
    get description() { return uiT("ui.theme_text_navigation_and_widgets_1f242fe1"); },
    icon: "appearance",
    sections: ["appearance", "theme", "widgets"],
    group: "Personalize",
  },
  {
    id: "reminders",
    get title() { return uiT("ui.reminders_haptics_d1ee76da"); },
    get description() { return uiT("ui.notifications_and_feedback_on_your_device_4cc663ac"); },
    icon: "notify",
    sections: ["notifications", "haptic"],
    group: "Personalize",
  },
  {
    id: "profile",
    get title() { return uiT("ui.profile_notes_ab872ca3"); },
    get description() { return uiT("ui.your_avatar_connections_and_note_editor_f3a55fa8"); },
    icon: "profile",
    sections: ["profile", "notes"],
    group: "Account & app",
  },
  {
    id: "data",
    get title() { return uiT("ui.data_progress_ada87aef"); },
    get description() { return uiT("ui.cache_maintenance_and_level_summaries_b63a85c2"); },
    icon: "storage",
    sections: ["dataStorage", "levelRecap"],
    group: "Account & app",
  },
  {
    id: "support",
    get title() { return uiT("ui.help_account_ee114dac"); },
    get description() { return uiT("ui.feedback_support_and_your_account_f3768155"); },
    icon: "support",
    sections: ["support", "patreon", "account"],
    group: "Account & app",
  },
  {
    id: "developer",
    get title() { return uiT("ui.developer_tools_96f0c06b"); },
    get description() { return uiT("ui.restricted_diagnostics_and_api_history_78bb9a34"); },
    icon: "settings",
    sections: ["apiDebug"],
    group: "Account & app",
  },
];
