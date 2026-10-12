import { uiT } from "../features/interface-language/runtime";
import { CoachMarkStep } from "../components/CoachMarks";

/**
 * Tutorial steps for the Songs tab screen
 * These steps introduce users to the music discovery features
 */
export const SONGS_TUTORIAL_STEPS: Omit<CoachMarkStep, "target">[] = [
  {
    id: "songs-welcome",
    get title() { return uiT("ui.welcome_to_music_918308c0"); },
    get description() { return uiT("ui.discover_japanese_songs_and_learn_vocabulary_through_lyrics_let_m_5a48894d"); },
    position: "bottom",
    icon: "musical-notes",
  },
  {
    id: "songs-search",
    get title() { return uiT("ui.search_for_songs_72438717"); },
    get description() { return uiT("ui.search_for_any_japanese_song_by_title_or_artist_we_ll_find_it_on_f9f7574c"); },
    position: "bottom",
    icon: "search",
  },
  {
    id: "songs-categories",
    get title() { return uiT("ui.discover_music_6621e0c6"); },
    get description() { return uiT("ui.browse_curated_categories_like_new_releases_popular_j_pop_and_ani_a444be60"); },
    position: "top",
    icon: "albums",
  },
];

/**
 * Tutorial steps for the Song Lyrics screen
 * These steps explain the lyrics viewing and override features
 */
export const LYRICS_TUTORIAL_STEPS: Omit<CoachMarkStep, "target">[] = [
  {
    id: "lyrics-welcome",
    get title() { return uiT("ui.song_lyrics_15abe7ff"); },
    get description() { return uiT("ui.view_lyrics_synced_to_the_music_with_vocabulary_from_your_wanikan_1fc29546"); },
    position: "bottom",
    icon: "document-text",
  },
  {
    id: "lyrics-sync",
    get title() { return uiT("ui.synced_lyrics_ffaf312c"); },
    get description() { return uiT("ui.when_available_lyrics_scroll_automatically_with_the_music_you_can_dda5de14"); },
    position: "bottom",
    icon: "sync",
    pointerPosition: "left",
  },
  {
    id: "lyrics-settings",
    get title() { return uiT("ui.fix_mismatched_content_706c0333"); },
    get description() { return uiT("ui.sometimes_the_wrong_video_or_lyrics_are_matched_tap_here_to_manua_3d8d03ec"); },
    position: "bottom",
    icon: "warning",
    important: true,
    pointerPosition: "left",
  },
  {
    id: "lyrics-vocabulary",
    get title() { return uiT("ui.learn_vocabulary_893bbc68"); },
    get description() { return uiT("ui.tap_any_highlighted_word_to_see_its_meaning_reading_and_wanikani_7333d17a"); },
    position: "bottom",
    icon: "school",
  },
];

/**
 * Tutorial steps for the Translator screen
 * These steps explain the translation and WaniKani highlight features
 */
export const TRANSLATOR_TUTORIAL_STEPS: Omit<CoachMarkStep, "target">[] = [
  {
    id: "translator-welcome",
    get title() { return uiT("ui.welcome_to_translator_bd3d3eeb"); },
    get description() { return uiT("ui.translate_between_english_and_japanese_and_discover_wanikani_voca_901f8d04"); },
    position: "bottom",
    icon: "language",
  },
  {
    id: "translator-input",
    get title() { return uiT("ui.enter_text_4e20cb45"); },
    get description() { return uiT("ui.type_or_paste_text_here_use_the_swap_button_to_switch_between_eng_10c138e8"); },
    position: "bottom",
    icon: "create",
  },
  {
    id: "translator-highlights",
    get title() { return uiT("ui.wanikani_study_mode_3c1be928"); },
    get description() { return uiT("ui.when_viewing_japanese_text_tap_this_button_to_highlight_vocabular_fd90358f"); },
    position: "bottom",
    icon: "school",
    important: true,
    pointerPosition: "top",
  },
];

/**
 * AsyncStorage keys for tutorial completion tracking
 */
export const TUTORIAL_STORAGE_KEYS = {
  SONGS_COMPLETED: "tutorial_songs_completed_v1",
  LYRICS_COMPLETED: "tutorial_lyrics_completed_v1",
  TRANSLATOR_COMPLETED: "tutorial_translator_completed_v1",
} as const;
