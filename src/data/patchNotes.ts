import { uiT } from "../features/interface-language/runtime";
export type PatchNoteChangeType = "feature" | "improvement" | "fix" | "design";

export type PatchNoteChange = {
  type: PatchNoteChangeType;
  title: string;
  description?: string;
  link?: {
    route: string;
    params?: Record<string, string>;
    label: string;
  };
};

export type PatchNote = {
  version: string;
  date: string; // ISO date string
  changes: PatchNoteChange[];
};

// Color and icon configuration for each change type
export const CHANGE_TYPE_CONFIG: Record<
  PatchNoteChangeType,
  { icon: string; label: string; color: string; backgroundColor: string }
> = {
  feature: {
    icon: "sparkles",
    get label() { return uiT("release_notes.18fdd549b2ed"); },
    color: "#9333EA",
    backgroundColor: "rgba(147, 51, 234, 0.15)",
  },
  improvement: {
    icon: "trending-up",
    get label() { return uiT("release_notes.c3b959224fda"); },
    color: "#3B82F6",
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  fix: {
    icon: "bug",
    get label() { return uiT("release_notes.1246fc93bca0"); },
    color: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  design: {
    icon: "color-palette",
    get label() { return uiT("release_notes.0072e6b93494"); },
    color: "#EC4899",
    backgroundColor: "rgba(236, 72, 153, 0.15)",
  },
};

// Get the current patch notes version (latest version)
export const getCurrentPatchNotesVersion = (): string => {
  return PATCH_NOTES[0]?.version ?? "0.0.0";
};

// Patch notes data - add new entries at the TOP of this array
export const PATCH_NOTES: PatchNote[] = [
  {
    version: "1.5.1",
    date: "2026-10-10",
    changes: [
      {
        type: "design",
        get title() { return uiT("release_notes.f15550acd30a"); },
        get description() { return uiT("release_notes.8a892bd2d838"); },
        link: { route: "/settings", get label() { return uiT("ui.open_settings_3f940108"); } },
      },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-10-09",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.64f9048dacfe"); },
        get description() { return uiT("release_notes.ab580a68987c"); },
        link: { route: "/widget-settings", get label() { return uiT("release_notes.417deafbb258"); } },
      },
    ],
  },
  {
    version: "1.4.24",
    date: "2026-10-08",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.review_presets_6addcd9f"); },
        get description() { return uiT("release_notes.ae52470fc9c8"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
    ],
  },
  {
    version: "1.4.23",
    date: "2026-10-07",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.b8e159fd7fc8"); },
        get description() { return uiT("release_notes.6414b2dc9f8e"); },
      },
    ],
  },
  {
    version: "1.4.22",
    date: "2026-10-05",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.306489892646"); },
        get description() { return uiT("release_notes.6c0926f87a91"); },
        link: { route: "/(app)/(tabs)/progress", get label() { return uiT("release_notes.00d70365fc68"); } },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.569906d85911"); },
        get description() { return uiT("release_notes.f166d17c41c4"); },
        link: {
          route: "/home-customization-settings",
          get label() { return uiT("release_notes.9dd60a912a4f"); },
        },
      },
    ],
  },
  {
    version: "1.4.21",
    date: "2026-10-02",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.f67631a840a6"); },
        get description() { return uiT("release_notes.d353ff13ded9"); },
      },
    ],
  },
  {
    version: "1.4.20",
    date: "2026-09-30",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.7cea7ffd9613"); },
        get description() { return uiT("release_notes.f0c3461a0e5f"); },
      },
    ],
  },
  {
    version: "1.4.19",
    date: "2026-09-27",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.2aeff15f13ca"); },
        get description() { return uiT("release_notes.e9d39d1f5ccc"); },
        link: {
          route: "/tab-settings",
          get label() { return uiT("ui.customize_tabs_2d2fca4d"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.46962201a908"); },
        get description() { return uiT("release_notes.e8604514979e"); },
      },
    ],
  },
  {
    version: "1.4.18",
    date: "2026-09-24",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.ec577ad121ad"); },
        get description() { return uiT("release_notes.94bbf3b1ced3"); },
      },
    ],
  },
  {
    version: "1.4.17",
    date: "2026-09-22",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.139ff5ec59f7"); },
        get description() { return uiT("release_notes.c1fcdc8c8031"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.5cd78a3b8980"); },
        get description() { return uiT("release_notes.3eff1b7b585d"); },
        link: {
          route: "/widget-settings",
          get label() { return uiT("release_notes.be646e0cbfdd"); },
        },
      },
    ],
  },
  {
    version: "1.4.16",
    date: "2026-09-20",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.c0edf50c6064"); },
        get description() { return uiT("release_notes.33dfaa2a61e7"); },
      },
    ],
  },
  {
    version: "1.4.15",
    date: "2026-09-15",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.c2025f523406"); },
        get description() { return uiT("release_notes.5767283aaf3d"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.4785b8015948"); },
        get description() { return uiT("release_notes.1888f53741f8"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.880e8ca90faf"); },
        get description() { return uiT("release_notes.883d063b3d5e"); },
      },
    ],
  },
  {
    version: "1.4.14",
    date: "2026-09-13",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.e7271a6ec526"); },
        get description() { return uiT("release_notes.ff84e253f67c"); },
      },
    ],
  },
  {
    version: "1.4.13",
    date: "2026-09-12",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.d2fc8950be12"); },
        get description() { return uiT("release_notes.eea291184dc8"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.15953ad578ad"); },
        get description() { return uiT("release_notes.dab501d9239e"); },
      },
    ],
  },
  {
    version: "1.4.12",
    date: "2026-09-08",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.d3548996fe1a"); },
        get description() { return uiT("release_notes.e4ec194b547f"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.caf5ef7ec873"); },
        get description() { return uiT("release_notes.d38c9b8f940e"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.299c6ccf950f"); },
        get description() { return uiT("release_notes.8e7a90f2917c"); },
      },
    ],
  },
  {
    version: "1.4.11",
    date: "2026-09-07",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.6a457735a078"); },
        get description() { return uiT("release_notes.764f445116ac"); },
      },
    ],
  },
  {
    version: "1.4.10",
    date: "2026-09-05",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.c689a1b775f4"); },
        get description() { return uiT("release_notes.944bc93a297f"); },
      },
      {
        type: "feature",
        get title() { return uiT("ui.lesson_search_button_6d2a2b2d"); },
        get description() { return uiT("release_notes.692a3fc75ae0"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.39b25df08a75"); },
        get description() { return uiT("release_notes.d7da65074b86"); },
      },
    ],
  },
  {
    version: "1.4.9",
    date: "2026-09-03",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.audio_vocab_31f3aa3d"); },
        get description() { return uiT("release_notes.c9384aed2f99"); },
        link: {
          route: "/audio-vocab",
          get label() { return uiT("release_notes.c6643127ce0f"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.bf4bd245e28f"); },
        get description() { return uiT("release_notes.07baa4141b84"); },
      },
    ],
  },
  {
    version: "1.4.8",
    date: "2026-08-31",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.8f66a7437685"); },
        get description() { return uiT("release_notes.15a70d62d63d"); },
        link: {
          route: "/jlpt",
          get label() { return uiT("release_notes.026d3bc61dd5"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.2cbca6f3925a"); },
        get description() { return uiT("release_notes.c30735b295d1"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.b4b23e69dc60"); },
        get description() { return uiT("release_notes.d8abd20e4d68"); },
      },
    ],
  },
  {
    version: "1.4.7",
    date: "2026-08-30",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.word_search_2a17a96d"); },
        get description() { return uiT("release_notes.ecbc7d71dfac"); },
        link: {
          route: "/word-search-config",
          get label() { return uiT("release_notes.0a4b0494ef9d"); },
        },
      },
    ],
  },
  {
    version: "1.3.1",
    date: "2026-08-23",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.5110d9338ff7"); },
        get description() { return uiT("release_notes.327f91610b5a"); },
      },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-08-22",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.2237ca7c708a"); },
        get description() { return uiT("release_notes.9a6e76aac4ec"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.86f644edbdf6"); },
        get description() { return uiT("release_notes.05a11e1b4814"); },
      },
    ],
  },
  {
    version: "1.2.99",
    date: "2026-08-19",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.35816aec8763"); },
        get description() { return uiT("release_notes.d7d6626b9616"); },
        link: {
          route: "/subject-lists",
          get label() { return uiT("release_notes.3af7259e37b8"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.ed750c75e852"); },
        get description() { return uiT("release_notes.4ec69884ed42"); },
        link: {
          route: "/custom-review-selection",
          get label() { return uiT("release_notes.ebe1a1e48063"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.34184c401c16"); },
        get description() { return uiT("release_notes.ceec4e6fe7ff"); },
      },
    ],
  },
  {
    version: "1.2.98",
    date: "2026-08-17",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.c94b4c93bb85"); },
        get description() { return uiT("release_notes.ffa4602c5406"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.0f6344eb7e05"); },
        get description() { return uiT("release_notes.aaf4319b2910"); },
      },
    ],
  },
  {
    version: "1.2.97",
    date: "2026-08-10",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.3f7f33c068e3"); },
        get description() { return uiT("release_notes.ec93c12d8df8"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.cfe8e423545d"); },
        get description() { return uiT("release_notes.423cfe13a1eb"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.116a2bfb7692"); },
        get description() { return uiT("release_notes.b18860abeaad"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.94344de5559c"); },
        get description() { return uiT("release_notes.8e9518e1a04d"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.d78c690f96db"); },
        get description() { return uiT("release_notes.15e2994aac93"); },
      },
      {
        type: "feature",
        get title() { return uiT("ui.review_input_size_f727103b"); },
        get description() { return uiT("release_notes.842cca4ef5c9"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.efb59af79425"); },
        get description() { return uiT("release_notes.c4cfc3b22172"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.89b9b8b3f078"); },
        get description() { return uiT("release_notes.ca63e690e107"); },
      },
    ],
  },
  {
    version: "1.2.96",
    date: "2026-08-01",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.bf303a58b975"); },
        get description() { return uiT("release_notes.85d7b59b83c5"); },
        link: {
          route: "/settings",
          params: { scrollTo: "lessons" },
          get label() { return uiT("release_notes.bd93917c945e"); },
        },
      },
    ],
  },
  {
    version: "1.2.95",
    date: "2026-07-29",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.kanji_reading_speech_9264f5d6"); },
        get description() { return uiT("release_notes.f1327ec983d6"); },
        link: {
          route: "/settings",
          params: { scrollTo: "kanji" },
          get label() { return uiT("release_notes.2eb86885856b"); },
        },
      },
    ],
  },
  {
    version: "1.2.94",
    date: "2026-07-28",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.a38e538ea06b"); },
        get description() { return uiT("release_notes.5bb09e0f21aa"); },
      },
      {
        type: "feature",
        get title() { return uiT("ui.kanji_etymology_cc05e5b5"); },
        get description() { return uiT("release_notes.e5e05293b809"); },
        link: {
          route: "/settings",
          params: { scrollTo: "kanji" },
          get label() { return uiT("release_notes.2eb86885856b"); },
        },
      },
    ],
  },
  {
    version: "1.2.93",
    date: "2026-07-27",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.f80f262a8324"); },
        get description() { return uiT("release_notes.db2deb3be03f"); },
      },
    ],
  },
  {
    version: "1.2.92",
    date: "2026-07-25",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.af92a3bc0816"); },
        get description() { return uiT("release_notes.43b81f8e1a57"); },
        link: {
          route: "/settings",
          params: { scrollTo: "kanji" },
          get label() { return uiT("release_notes.2eb86885856b"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.6667bc5e5407"); },
        get description() { return uiT("release_notes.3c3a285ab596"); },
        link: {
          route: "/subject-lists",
          get label() { return uiT("release_notes.3af7259e37b8"); },
        },
      },
    ],
  },
  {
    version: "1.2.91",
    date: "2026-07-24",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.84df71d9cec2"); },
        get description() { return uiT("release_notes.e44735f7662c"); },
        link: {
          route: "/jitai-font-settings",
          get label() { return uiT("release_notes.28c82f8ff285"); },
        },
      },
    ],
  },
  {
    version: "1.2.90",
    date: "2026-07-23",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.66e1a8ef8f1c"); },
        get description() { return uiT("release_notes.32542044a8a0"); },
      },
      {
        type: "feature",
        get title() { return uiT("ui.vocabulary_frequency_746baa1e"); },
        get description() { return uiT("release_notes.b05da87d6a81"); },
      },
      {
        type: "feature",
        get title() { return uiT("ui.inline_radical_reminders_da63a6aa"); },
        get description() { return uiT("release_notes.4d4a37bdd1f1"); },
        link: {
          route: "/settings",
          params: { scrollTo: "kanji" },
          get label() { return uiT("release_notes.2eb86885856b"); },
        },
      },
    ],
  },
  {
    version: "1.2.89",
    date: "2026-07-20",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.faa94fd668bf"); },
        get description() { return uiT("release_notes.785961d34a92"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.5c7ffafb7d85"); },
        get description() { return uiT("release_notes.a54c3cd372d1"); },
      },
      {
        type: "feature",
        get title() { return uiT("ui.weekend_lesson_reminders_6c531722"); },
        get description() { return uiT("release_notes.a8d458d4b884"); },
      },
    ],
  },
  {
    version: "1.2.88",
    date: "2026-06-26",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.similar_kanji_match_e9a0b1a8"); },
        get description() { return uiT("release_notes.23527e243d7c"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.9372dce0b0dc"); },
        get description() { return uiT("release_notes.b669b2b52de2"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.3415c21a2a2a"); },
        get description() { return uiT("release_notes.e07a51e32c11"); },
      },
    ],
  },
  {
    version: "1.2.87",
    date: "2026-06-23",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.45eb7bd7ab98"); },
        get description() { return uiT("release_notes.fba42e011e00"); },
      },
    ],
  },
  {
    version: "1.2.86",
    date: "2026-06-22",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.098f29bc0863"); },
        get description() { return uiT("release_notes.d401b271123e"); },
        link: {
          route: "/anki-settings",
          get label() { return uiT("release_notes.ad95c6b4173c"); },
        },
      },
    ],
  },
  {
    version: "1.2.85",
    date: "2026-06-21",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.02ec3cd77e64"); },
        get description() { return uiT("release_notes.7b59fa4313a8"); },
      },
    ],
  },
  {
    version: "1.2.84",
    date: "2026-06-20",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.816b0ebc0bd2"); },
        get description() { return uiT("release_notes.d09a72aa453e"); },
        link: {
          route: "/subject-lists",
          get label() { return uiT("release_notes.3af7259e37b8"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.4562f619c28f"); },
        get description() { return uiT("release_notes.292faa69d8a2"); },
      },
    ],
  },
  {
    version: "1.2.83",
    date: "2026-06-19",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.7b8e16fabae0"); },
        get description() { return uiT("release_notes.3ee7faec9b7d"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.fe9e5c111598"); },
        get description() { return uiT("release_notes.15070b4df57b"); },
      },
    ],
  },
  {
    version: "1.2.82",
    date: "2026-06-18",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.app_text_size_866b45cd"); },
        get description() { return uiT("release_notes.e98ab70afbe5"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.c94987238107"); },
        get description() { return uiT("release_notes.e8d95890a257"); },
      },
    ],
  },
  {
    version: "1.2.81",
    date: "2026-06-17",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.8d10fd24c26b"); },
        get description() { return uiT("release_notes.7e0162a29735"); },
      },
    ],
  },
  {
    version: "1.2.80",
    date: "2026-06-15",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.eff66ba9f9c7"); },
        get description() { return uiT("release_notes.48b261f84e63"); },
      },
    ],
  },
  {
    version: "1.2.79",
    date: "2026-06-14",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.vocabulary_context_sentence_hints_9ea91fd4"); },
        get description() { return uiT("release_notes.bb9ca8748136"); },
      },
    ],
  },
  {
    version: "1.2.78",
    date: "2026-06-11",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.c2cb2ac46c65"); },
        get description() { return uiT("release_notes.8b3b75b10e35"); },
        link: {
          route: "/study-time",
          get label() { return uiT("release_notes.a35396f98f5d"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.6068eff17286"); },
        get description() { return uiT("release_notes.367e5aadb072"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.1e164fd11c17"); },
        get description() { return uiT("release_notes.44d84443a93f"); },
      },
    ],
  },
  {
    version: "1.2.77",
    date: "2026-06-09",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.7d5ad555352e"); },
        get description() { return uiT("release_notes.33806e94258e"); },
      },
    ],
  },
  {
    version: "1.2.76",
    date: "2026-06-08",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.4cb75d8123c5"); },
        get description() { return uiT("release_notes.10a32ea4ba40"); },
        link: {
          route: "/review-order-settings",
          get label() { return uiT("release_notes.4aef31c0efe4"); },
        },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.072e0daf8a8e"); },
        get description() { return uiT("release_notes.5a74cfd41da4"); },
        link: {
          route: "/subject-lists",
          get label() { return uiT("release_notes.3af7259e37b8"); },
        },
      },
    ],
  },
  {
    version: "1.2.75",
    date: "2026-06-04",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.7fd5810cd491"); },
        get description() { return uiT("release_notes.fc6fcfedc2ba"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.a9d629650f52"); },
        get description() { return uiT("release_notes.6f7ea52e358e"); },
      },
    ],
  },
  {
    version: "1.2.74",
    date: "2026-06-03",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.6066f2aa998f"); },
        get description() { return uiT("release_notes.a83750177d55"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.7e6a19bb86fb"); },
        get description() { return uiT("release_notes.da55fe52bc38"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.e2b5288b60fa"); },
        get description() { return uiT("release_notes.239b8c7347a7"); },
      },
    ],
  },
  {
    version: "1.2.73",
    date: "2026-06-02",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.ec4bb5e4126e"); },
        get description() { return uiT("release_notes.b2354287aec2"); },
      },
    ],
  },
  {
    version: "1.2.72",
    date: "2026-06-01",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.d776da7de656"); },
        get description() { return uiT("release_notes.ce9ffc1f99f4"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.f8dec8fd7072"); },
        get description() { return uiT("release_notes.fec1f7d7b6b2"); },
      },
    ],
  },
  {
    version: "1.2.71",
    date: "2026-05-31",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.2c1523e059f8"); },
        get description() { return uiT("release_notes.b6dc3de5fb3e"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.fb730d7759bf"); },
        get description() { return uiT("release_notes.a2e9d5f41677"); },
      },
    ],
  },
  {
    version: "1.2.70",
    date: "2026-05-29",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.e25d54c57e32"); },
        get description() { return uiT("release_notes.6d437db2e5ea"); },
      },
    ],
  },
  {
    version: "1.2.68",
    date: "2026-05-25",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.a1115719ba7d"); },
        get description() { return uiT("release_notes.9bff895d6e9f"); },
      },
    ],
  },
  {
    version: "1.2.67",
    date: "2026-05-24",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.4746a702c649"); },
        get description() { return uiT("release_notes.86e891a346bb"); },
      },
    ],
  },
  {
    version: "1.2.66",
    date: "2026-05-21",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.fcbf21368ebf"); },
        get description() { return uiT("release_notes.96bed549be8e"); },
      },
    ],
  },
  {
    version: "1.2.65",
    date: "2026-05-19",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.e573500352a5"); },
        get description() { return uiT("release_notes.cfca3aa1c35a"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.0b6f9e7f8326"); },
        get description() { return uiT("release_notes.1b6873ec51ca"); },
      },
      {
        type: "feature",
        get title() { return uiT("ui.review_character_size_ab236bdb"); },
        get description() { return uiT("release_notes.84cd22f72c9a"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
    ],
  },
  {
    version: "1.2.64",
    date: "2026-05-16",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.1576077f8933"); },
        get description() { return uiT("release_notes.1177aefd3b8f"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
    ],
  },
  {
    version: "1.2.63",
    date: "2026-05-15",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.c17f291be9ae"); },
        get description() { return uiT("release_notes.231936513003"); },
      },
      {
        type: "feature",
        get title() { return uiT("ui.single_kanji_vocab_similar_kanji_9d0c6c09"); },
        get description() { return uiT("release_notes.1f4d076c3a8c"); },
      },
    ],
  },
  {
    version: "1.2.62",
    date: "2026-05-14",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.7ac2eb600dcb"); },
        get description() { return uiT("release_notes.4b8685ba0653"); },
      },
    ],
  },
  {
    version: "1.2.61",
    date: "2026-05-11",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.aa5f311adda9"); },
        get description() { return uiT("release_notes.730938484862"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.df2c90cc02b0"); },
        get description() { return uiT("release_notes.19a7d5dccf31"); },
        link: {
          route: "/settings",
          params: { scrollTo: "lessons" },
          get label() { return uiT("release_notes.bd93917c945e"); },
        },
      },
    ],
  },
  {
    version: "1.2.60",
    date: "2026-05-08",
    changes: [
      {
        type: "design",
        get title() { return uiT("release_notes.afcfe0b2f9c7"); },
        get description() { return uiT("release_notes.228203d73ca3"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.da74eb51fc15"); },
        get description() { return uiT("release_notes.2fabc23f301b"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.6d54f3fdfc00"); },
        get description() { return uiT("release_notes.af827174a56f"); },
      },
    ],
  },
  {
    version: "1.2.59",
    date: "2026-05-07",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.c3e37efd4328"); },
        get description() { return uiT("release_notes.457b58d7ce8a"); },
      },
    ],
  },
  {
    version: "1.2.58",
    date: "2026-05-03",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.c3a15c97220e"); },
        get description() { return uiT("release_notes.8cd2c5917ff6"); },
      },
    ],
  },
  {
    version: "1.2.57",
    date: "2026-04-30",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.b3c4ff21ae14"); },
        get description() { return uiT("release_notes.f462d1d97882"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.d6423b3ffb91"); },
        get description() { return uiT("release_notes.b68627e0825a"); },
      },
    ],
  },
  {
    version: "1.2.56",
    date: "2026-04-28",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.c9fd4a53d817"); },
        get description() { return uiT("release_notes.9a2a2801c531"); },
      },
    ],
  },
  {
    version: "1.2.55",
    date: "2026-04-27",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.e2f6b43b7526"); },
        get description() { return uiT("release_notes.73196dbbda1a"); },
      },
    ],
  },
  {
    version: "1.2.54",
    date: "2026-04-26",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.affde5129687"); },
        get description() { return uiT("release_notes.b68f548d5712"); },
      },
    ],
  },
  {
    version: "1.2.53",
    date: "2026-04-24",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.034c4a873b4f"); },
        get description() { return uiT("release_notes.d7f5dca18cb5"); },
        link: {
          route: "/settings",
          params: { scrollTo: "lessons" },
          get label() { return uiT("release_notes.bd93917c945e"); },
        },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.7ed5df0cd59a"); },
        get description() { return uiT("release_notes.7d50e25a7900"); },
      },
    ],
  },
  {
    version: "1.2.52",
    date: "2026-04-22",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.6e932e0a959b"); },
        get description() { return uiT("release_notes.babd0e7c02e8"); },
        link: {
          route: "/tab-settings",
          get label() { return uiT("ui.customize_tabs_2d2fca4d"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.d7ded78cf8a6"); },
        get description() { return uiT("release_notes.c800f0fa47be"); },
      },
    ],
  },
  {
    version: "1.2.51",
    date: "2026-04-18",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.pause_on_close_answer_737b2b66"); },
        get description() { return uiT("release_notes.7e31fcb6c3c0"); },
      },
      {
        type: "design",
        get title() { return uiT("release_notes.4e3907ebab3a"); },
        get description() { return uiT("release_notes.8850190f3351"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.690ecdca4fa1"); },
        get description() { return uiT("release_notes.eec0ba3fc392"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.0a1cca708eb3"); },
        get description() { return uiT("release_notes.1596a6b4d5c7"); },
      },
    ],
  },
  {
    version: "1.2.50",
    date: "2026-04-16",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.bd081abf8d01"); },
        get description() { return uiT("release_notes.5800105b98d4"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.13313849a86e"); },
        get description() { return uiT("release_notes.268c26bbf073"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.a1aa0fdb3f5c"); },
        get description() { return uiT("release_notes.564bcc198886"); },
      },
    ],
  },
  {
    version: "1.2.49",
    date: "2026-04-13",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.75325bfe4950"); },
        get description() { return uiT("release_notes.e68505298dd4"); },
      },
    ],
  },
  {
    version: "1.2.48",
    date: "2026-04-10",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.069d2af33bd3"); },
        get description() { return uiT("release_notes.f228d7c7cd06"); },
        link: {
          route: "/anki-settings",
          get label() { return uiT("release_notes.ad95c6b4173c"); },
        },
      },
    ],
  },
  {
    version: "1.2.47",
    date: "2026-04-09",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.340f8d632c82"); },
        get description() { return uiT("release_notes.ee996cd10017"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.b91a994aafac"); },
        get description() { return uiT("release_notes.801a188b95b5"); },
        link: {
          route: "/settings",
          params: { scrollTo: "lessons" },
          get label() { return uiT("release_notes.bd93917c945e"); },
        },
      },
      {
        type: "design",
        get title() { return uiT("release_notes.d554d55015e4"); },
        get description() { return uiT("release_notes.6b513abd1ca6"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.1be900aa1da4"); },
        get description() { return uiT("release_notes.713b78a17ea3"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.9372dce0b0dc"); },
        get description() { return uiT("release_notes.2d799cb75054"); },
      },
    ],
  },
  {
    version: "1.2.46",
    date: "2026-04-07",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.8a2bedd19fef"); },
        get description() { return uiT("release_notes.8235e7800ea7"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.9b4818c9c670"); },
        get description() { return uiT("release_notes.41ebe19ad6b6"); },
      },
    ],
  },
  {
    version: "1.2.45",
    date: "2026-04-06",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.6dff07427449"); },
        get description() { return uiT("release_notes.5e932b4a6da1"); },
      },
    ],
  },
  {
    version: "1.2.44",
    date: "2026-04-04",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.82b6c674c5b7"); },
        get description() { return uiT("release_notes.e3a4706f1305"); },
      },
    ],
  },
  {
    version: "1.2.43",
    date: "2026-04-03",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.31563c0e3125"); },
        get description() { return uiT("release_notes.81569f78e0d5"); },
        link: {
          route: "/settings",
          params: { scrollTo: "vocabContext" },
          get label() { return uiT("ui.open_settings_3f940108"); },
        },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.6a2ec5e450ca"); },
        get description() { return uiT("release_notes.c89b3f0eec71"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.6aecd8c0f90c"); },
        get description() { return uiT("release_notes.228e5fd4e432"); },
      },
    ],
  },
  {
    version: "1.2.42",
    date: "2026-03-31",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.buttonless_anki_mode_4915d5f1"); },
        get description() { return uiT("release_notes.4ef0665b349b"); },
        link: {
          route: "/anki-settings",
          get label() { return uiT("release_notes.ad95c6b4173c"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.847175f1a2f0"); },
        get description() { return uiT("release_notes.a9ec9e627622"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.86ea1635364a"); },
        get description() { return uiT("release_notes.681c29a76bdb"); },
      },
    ],
  },
  {
    version: "1.2.41",
    date: "2026-03-30",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.7893ef11e092"); },
        get description() { return uiT("release_notes.ddffba2001ae"); },
      },
      {
        type: "design",
        get title() { return uiT("release_notes.8dd0054b4af8"); },
        get description() { return uiT("release_notes.385acd7ceb91"); },
      },
    ],
  },
  {
    version: "1.2.40",
    date: "2026-03-29",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.c876724e2522"); },
        get description() { return uiT("release_notes.9b0266805373"); },
      },
    ],
  },
  {
    version: "1.2.39",
    date: "2026-03-28",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.95d8dd40a12e"); },
        get description() { return uiT("release_notes.ebbedb2ea47b"); },
      },
    ],
  },
  {
    version: "1.2.38",
    date: "2026-03-27",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.4c3cca1e64cc"); },
        get description() { return uiT("release_notes.db94690b3ad1"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.2ee6724180cb"); },
        get description() { return uiT("release_notes.3298e6aecfb8"); },
      },
    ],
  },
  {
    version: "1.2.37",
    date: "2026-03-26",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.30b39a93ceca"); },
        get description() { return uiT("release_notes.009f239fb28c"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.4a44e257a1ce"); },
        get description() { return uiT("release_notes.e7f7fe7d6bcb"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.e4f8083fcd97"); },
        get description() { return uiT("release_notes.c3e8a7177131"); },
        link: {
          route: "/anki-settings",
          get label() { return uiT("release_notes.ad95c6b4173c"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.430d6a9cb736"); },
        get description() { return uiT("release_notes.5ae351e43be6"); },
      },
    ],
  },
  {
    version: "1.2.36",
    date: "2026-03-25",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.c1c2c7b5c57e"); },
        get description() { return uiT("release_notes.f3df687eb279"); },
      },
    ],
  },
  {
    version: "1.2.35",
    date: "2026-03-24",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.home_customization_2482c0e7"); },
        get description() { return uiT("release_notes.cb8b043ad13e"); },
        link: {
          route: "/home-customization-settings",
          get label() { return uiT("release_notes.9b6bc7c06b3d"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.cd61272a8e81"); },
        get description() { return uiT("release_notes.00071bb5ed6b"); },
      },
    ],
  },
  {
    version: "1.2.34",
    date: "2026-03-23",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.c29038949973"); },
        get description() { return uiT("release_notes.f10459d033ab"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.efa0b061c61f"); },
        get description() { return uiT("release_notes.9445f6ff48c6"); },
        link: {
          route: "/anki-settings",
          get label() { return uiT("release_notes.ad95c6b4173c"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.5dfb637b508b"); },
        get description() { return uiT("release_notes.e8d2207a3b22"); },
        link: {
          route: "/tab-settings",
          get label() { return uiT("ui.customize_tabs_2d2fca4d"); },
        },
      },
    ],
  },
  {
    version: "1.2.33",
    date: "2026-03-22",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.78dc15446a88"); },
        get description() { return uiT("release_notes.d38ceac01f75"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.fe196edae8e2"); },
        get description() { return uiT("release_notes.b5df294121e8"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.f4ab782e77a6"); },
        get description() { return uiT("release_notes.84131e5b15f9"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.7731a2f1ce22"); },
        get description() { return uiT("release_notes.0a710f7c3a49"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.e19b7f2ce105"); },
        get description() { return uiT("release_notes.ad469f5e8e4f"); },
        link: {
          route: "/settings",
          params: { scrollTo: "vocabContext" },
          get label() { return uiT("ui.open_settings_3f940108"); },
        },
      },
    ],
  },
  {
    version: "1.2.32",
    date: "2026-03-20",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.e3eb06f91119"); },
        get description() { return uiT("release_notes.488c6b45e077"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.6fe72315be7e"); },
        get description() { return uiT("release_notes.900a5e2c8e16"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.61906c02a4ce"); },
        get description() { return uiT("release_notes.ba9a82234cb1"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.abb2045030fb"); },
        get description() { return uiT("release_notes.59c5ba11b29a"); },
      },
    ],
  },
  {
    version: "1.2.31",
    date: "2026-03-18",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.77762f4feb59"); },
        get description() { return uiT("release_notes.239a0dcb1431"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.bac12d256d96"); },
        get description() { return uiT("release_notes.f0c3746de8f0"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.100ce83db2f3"); },
        get description() { return uiT("release_notes.6317b3682ff3"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.583f7e4231e2"); },
        get description() { return uiT("release_notes.ef77d2797fdb"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.f1981471f681"); },
        get description() { return uiT("release_notes.3ac6e69b3655"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.d236baffa5ee"); },
        get description() { return uiT("release_notes.97ace19f74b1"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.952e461f7376"); },
        get description() { return uiT("release_notes.9df6fff507ad"); },
      },
    ],
  },
  {
    version: "1.2.30",
    date: "2026-03-17",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.1181ae1fafa3"); },
        get description() { return uiT("release_notes.b408198f5de9"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.a6440cd2968c"); },
        get description() { return uiT("release_notes.b24b389bd62a"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.e9d7993a31ac"); },
        get description() { return uiT("release_notes.e75f4cb92006"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.00dad813f24c"); },
        get description() { return uiT("release_notes.7238b293cf32"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.28a23583ab30"); },
        get description() { return uiT("release_notes.0d3e2b6c0006"); },
      },
    ],
  },
  {
    version: "1.2.29",
    date: "2026-03-16",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.d30afb25154c"); },
        get description() { return uiT("release_notes.4df2f21375b6"); },
        link: {
          route: "/anki-settings",
          get label() { return uiT("release_notes.ad95c6b4173c"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.d537ca2524f2"); },
        get description() { return uiT("release_notes.8b3ed30df61d"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.f360acde3fc1"); },
        get description() { return uiT("release_notes.a3184d3402a1"); },
      },
    ],
  },
  {
    version: "1.2.28",
    date: "2026-03-15",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.6bce3e0af349"); },
        get description() { return uiT("release_notes.d7900bdba256"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.33777f95a1d2"); },
        get description() { return uiT("release_notes.31f8a670705d"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.b5ad5ade9808"); },
        get description() { return uiT("release_notes.1bdac9316da7"); },
      },
    ],
  },
  {
    version: "1.2.27",
    date: "2026-03-14",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.bfa94ea82de1"); },
        get description() { return uiT("release_notes.40a4dddb0e39"); },
        link: {
          route: "/widget-settings",
          get label() { return uiT("release_notes.0311ad459105"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.637e387dce37"); },
        get description() { return uiT("release_notes.49b7c598dabf"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.90ccf4478186"); },
        get description() { return uiT("release_notes.d98d524e71eb"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.3a5a23ee6a1f"); },
        get description() { return uiT("release_notes.e218ee9c3f71"); },
        link: {
          route: "/review-order-settings",
          get label() { return uiT("release_notes.ba21228c371b"); },
        },
      },
      {
        type: "design",
        get title() { return uiT("release_notes.ec753490e07b"); },
        get description() { return uiT("release_notes.809fa13d22d7"); },
        link: {
          route: "/settings",
          get label() { return uiT("ui.open_settings_3f940108"); },
        },
      },
    ],
  },
  {
    version: "1.2.26",
    date: "2026-03-11",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.23b488aed08d"); },
        get description() { return uiT("release_notes.c10d9b87895d"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.7f428bf8f3c9"); },
        get description() { return uiT("release_notes.8955692ef4e7"); },
      },
    ],
  },
  {
    version: "1.2.25",
    date: "2026-03-10",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.bb89cc931045"); },
        get description() { return uiT("release_notes.c9430d0b9c91"); },
        link: {
          route: "/settings",
          get label() { return uiT("ui.open_settings_3f940108"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.9af17b5e78ce"); },
        get description() { return uiT("release_notes.a0d47666bbac"); },
      },
    ],
  },
  {
    version: "1.2.24",
    date: "2026-03-09",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.subject_lists_20c1f7d1"); },
        get description() { return uiT("release_notes.a5f0e41bb115"); },
        link: {
          route: "/settings",
          params: { scrollTo: "subjectLists" },
          get label() { return uiT("ui.open_settings_3f940108"); },
        },
      },
    ],
  },
  {
    version: "1.2.23",
    date: "2026-03-08",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.pitch_accent_visualization_b7f4abf3"); },
        get description() { return uiT("release_notes.f7395b34e89f"); },
        link: {
          route: "/settings",
          params: { scrollTo: "vocabContext" },
          get label() { return uiT("ui.open_settings_3f940108"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.333c2522e750"); },
        get description() { return uiT("release_notes.feaa594fb940"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.215388b390f5"); },
        get description() { return uiT("release_notes.5dddb5faec22"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.f3c94183062d"); },
        get description() { return uiT("release_notes.fb21e9dc452b"); },
      },
      {
        type: "design",
        get title() { return uiT("release_notes.394d140e6a2c"); },
        get description() { return uiT("release_notes.bc3996faaad8"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.cb38e74d9cfc"); },
        get description() { return uiT("release_notes.710bca7032bf"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.01e036dc6069"); },
        get description() { return uiT("release_notes.d67b8ee8c4b8"); },
      },
    ],
  },
  {
    version: "1.2.22",
    date: "2026-03-07",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.7ffeae678432"); },
        get description() { return uiT("release_notes.2888939d2623"); },
      },
    ],
  },
  {
    version: "1.2.21",
    date: "2026-03-06",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.09f3c5d2c08d"); },
        get description() { return uiT("release_notes.c863390e132d"); },
        link: {
          route: "/writing-practice-config",
          get label() { return uiT("release_notes.0f7a7ac0d17b"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.2afcf628ed2b"); },
        get description() { return uiT("release_notes.f1e987460014"); },
      },
    ],
  },
  {
    version: "1.2.20",
    date: "2026-03-05",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.bba9cbe2c585"); },
        get description() { return uiT("release_notes.49fadee5d174"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
    ],
  },
  {
    version: "1.2.19",
    date: "2026-03-04",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.62a8037bd800"); },
        get description() { return uiT("release_notes.bb6fee613811"); },
        link: {
          route: "/context-sentence-practice-config",
          get label() { return uiT("release_notes.5bdc4be3f184"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("ui.daily_lesson_limit_fc8fbcb3"); },
        get description() { return uiT("release_notes.d4938349b2c1"); },
        link: {
          route: "/settings",
          params: { scrollTo: "lessons" },
          get label() { return uiT("release_notes.bd93917c945e"); },
        },
      },
    ],
  },
  {
    version: "1.2.18",
    date: "2026-03-03",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.f98595c554c2"); },
        get description() { return uiT("release_notes.a1e9859d68ee"); },
        link: {
          route: "/settings",
          get label() { return uiT("ui.open_settings_3f940108"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.f489f7a78fd4"); },
        get description() { return uiT("release_notes.c58f3fca5de7"); },
        link: {
          route: "/context-sentence-practice-config",
          get label() { return uiT("release_notes.5bdc4be3f184"); },
        },
      },
    ],
  },
  {
    version: "1.2.17",
    date: "2026-03-02",
    changes: [
      {
        type: "improvement",
        get title() { return uiT("release_notes.c20050bdc20d"); },
        get description() { return uiT("release_notes.3c5693c26c14"); },
      },
    ],
  },
  {
    version: "1.2.16",
    date: "2026-03-01",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.8af118d0a34e"); },
        get description() { return uiT("release_notes.7e766a6f77ae"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.c2457fb12fec"); },
        get description() { return uiT("release_notes.32fb120c3775"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.c910200e2482"); },
        get description() { return uiT("release_notes.0705a2111db0"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.482e0f566919"); },
        get description() { return uiT("release_notes.25e9e0cac28f"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.726bb32f0fd0"); },
        get description() { return uiT("release_notes.c35d65f5e9fa"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.919714dc4ea2"); },
        get description() { return uiT("release_notes.60ef1921073d"); },
        link: {
          route: "/settings",
          get label() { return uiT("ui.open_settings_3f940108"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.959655a2171c"); },
        get description() { return uiT("release_notes.ef478305b70c"); },
        link: {
          route: "/settings",
          get label() { return uiT("ui.open_settings_3f940108"); },
        },
      },
    ],
  },
  {
    version: "1.2.15",
    date: "2026-02-27",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.2b69e6f79346"); },
        get description() { return uiT("release_notes.aeb5194dcbf8"); },
      },
    ],
  },
  {
    version: "1.2.14",
    date: "2026-02-26",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.bef56bf830b9"); },
        get description() { return uiT("release_notes.0e16b149eedf"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
    ],
  },
  {
    version: "1.2.13",
    date: "2026-02-24",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.pause_on_correct_answer_1e40fb3e"); },
        get description() { return uiT("release_notes.1bc74e3483f5"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.97014227b2da"); },
        get description() { return uiT("release_notes.10c7852da44d"); },
      },
    ],
  },
  {
    version: "1.2.12",
    date: "2026-02-23",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.6311e12da57b"); },
        get description() { return uiT("release_notes.0f6b171b248e"); },
      },
    ],
  },
  {
    version: "1.2.11",
    date: "2026-02-22",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.777a274a3f6e"); },
        get description() { return uiT("release_notes.a4f106f4951a"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.72392114b639"); },
        get description() { return uiT("release_notes.30e34a2bd59e"); },
      },
    ],
  },
  {
    version: "1.2.10",
    date: "2026-02-21",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.31150888f129"); },
        get description() { return uiT("release_notes.e9427ee2e172"); },
        link: {
          route: "/context-sentence-practice-config",
          get label() { return uiT("release_notes.00e19ec3190a"); },
        },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.b242f887676a"); },
        get description() { return uiT("release_notes.c5aa1815ce13"); },
      },
    ],
  },
  {
    version: "1.2.8",
    date: "2026-02-20",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.e6df3573f885"); },
        get description() { return uiT("release_notes.f659285fad7e"); },
        link: {
          route: "/listening-practice-config",
          get label() { return uiT("release_notes.646e75bdd8f9"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.a56e002ae656"); },
        get description() { return uiT("release_notes.699d091730b0"); },
      },
    ],
  },
  {
    version: "1.2.7",
    date: "2026-02-19",
    changes: [
      {
        type: "fix",
        get title() { return uiT("release_notes.0b334dc51308"); },
        get description() { return uiT("release_notes.9cec3d3ab869"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.bb002f0b7cd4"); },
        get description() { return uiT("release_notes.189cb4f1279e"); },
      },
    ],
  },
  {
    version: "1.2.6",
    date: "2026-02-17",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.51820a5afb68"); },
        get description() { return uiT("release_notes.41e7fc2f7db5"); },
        link: {
          route: "/kana-kanji-config",
          get label() { return uiT("release_notes.3152e81e82e3"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.fe0d6a05755b"); },
        get description() { return uiT("release_notes.8d78cadb3f26"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
    ],
  },
  {
    version: "1.2.5",
    date: "2026-02-16",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.a8b8901c4337"); },
        get description() { return uiT("release_notes.6550a3660ad4"); },
        link: {
          route: "/settings",
          get label() { return uiT("release_notes.5615fa822e79"); },
        },
      },
    ],
  },
  {
    version: "1.2.4",
    date: "2026-02-15",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.34f64f998e2a"); },
        get description() { return uiT("release_notes.bb776b99008e"); },
        link: {
          route: "/translator",
          get label() { return uiT("release_notes.60d87612fcc2"); },
        },
      },
    ],
  },
  {
    version: "1.2.3",
    date: "2026-02-12",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.eb5b03e555a6"); },
        get description() { return uiT("release_notes.3b3f9b3c7d7f"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.dcd4ee838ecc"); },
        get description() { return uiT("release_notes.111387a4bf4d"); },
      },
    ],
  },
  {
    version: "1.2.2",
    date: "2026-02-11",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.3f838ec4b228"); },
        get description() { return uiT("release_notes.415fa40ad59c"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.d8b91b8fc2c5"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.fc103a7114d3"); },
        get description() { return uiT("release_notes.f3b7a8ccfae5"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.ff34b964aacd"); },
        },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.a245ee314ec3"); },
        get description() { return uiT("release_notes.af6b5d69a1d9"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.2c44d4c01e05"); },
        get description() { return uiT("release_notes.f9c8ef8c4731"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.692374a1f36e"); },
        get description() { return uiT("release_notes.62a7433ff180"); },
      },
    ],
  },
  {
    version: "1.2.1",
    date: "2026-02-10",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.68f6cad3e626"); },
        get description() { return uiT("release_notes.dd9562947c0a"); },
        link: {
          route: "/immersion-kit-settings",
          params: { showSection: "anilist" },
          get label() { return uiT("release_notes.d667f0ab5984"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.ca92273b3e99"); },
        get description() { return uiT("release_notes.5b0acb02471f"); },
        link: {
          route: "/settings",
          params: { scrollTo: "kanji" },
          get label() { return uiT("release_notes.e590ec48d5c0"); },
        },
      },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-02-09",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.db5331a24c39"); },
        get description() { return uiT("release_notes.691297197e5f"); },
        link: {
          route: "/settings",
          params: { scrollTo: "levelRecap" },
          get label() { return uiT("release_notes.3e95946ee742"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("ui.review_batch_size_4040bacd"); },
        get description() { return uiT("release_notes.e6064e465313"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.3890ae2a6e12"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.913480d18081"); },
        get description() { return uiT("release_notes.0a2c1c5d8339"); },
        link: {
          route: "/listening-practice-config",
          get label() { return uiT("release_notes.9b4221e3e5b5"); },
        },
      },
      {
        type: "design",
        get title() { return uiT("release_notes.48170736262c"); },
        get description() { return uiT("release_notes.4bd509d36a33"); },
      },
    ],
  },
  {
    version: "1.0.8",
    date: "2026-02-06",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.98c4460f4853"); },
        get description() { return uiT("release_notes.d11aad82e84e"); },
      },
      {
        type: "improvement",
        get title() { return uiT("release_notes.a25dbd3bc378"); },
        get description() { return uiT("release_notes.74e8788f71ce"); },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.f6708925f130"); },
        get description() { return uiT("release_notes.9e43e621f713"); },
        link: {
          route: "/settings",
          params: { scrollTo: "lessons" },
          get label() { return uiT("release_notes.3890ae2a6e12"); },
        },
      },
    ],
  },
  {
    version: "1.0.7",
    date: "2026-02-05",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.b11b89741853"); },
        get description() { return uiT("release_notes.3196440acd05"); },
        link: {
          route: "/tab-settings",
          get label() { return uiT("ui.customize_tabs_2d2fca4d"); },
        },
      },
    ],
  },
  {
    version: "1.0.6",
    date: "2026-02-04",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.7378a0abe6c6"); },
        get description() { return uiT("release_notes.d97a4b57aed8"); },
        link: {
          route: "/settings",
          get label() { return uiT("release_notes.ad6802eb4247"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.636525da8c6f"); },
        get description() { return uiT("release_notes.6f6b82bbb9bb"); },
      },
    ],
  },
  {
    version: "1.0.5",
    date: "2026-02-03",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.a258726410d1"); },
        get description() { return uiT("release_notes.2a825a6715ee"); },
        link: {
          route: "/settings",
          params: { scrollTo: "kanji" },
          get label() { return uiT("release_notes.0ac8685e0b11"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("ui.back_to_back_questions_559ccdbc"); },
        get description() { return uiT("release_notes.3d9522835658"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.3890ae2a6e12"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.117ed9537c97"); },
        get description() { return uiT("release_notes.52a1959c2133"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.d4e0f3ad4f4b"); },
        get description() { return uiT("release_notes.1e40e42b3b79"); },
      },
    ],
  },
  {
    version: "1.0.4",
    date: "2026-02-02",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.katakana_madness_c21f54fc"); },
        get description() { return uiT("release_notes.25201bdf5bf5"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.3890ae2a6e12"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("ui.kanji_writing_practice_590d1ada"); },
        get description() { return uiT("release_notes.317e9f98575c"); },
        link: {
          route: "/writing-practice-config",
          get label() { return uiT("release_notes.8fb2b4181cb2"); },
        },
      },
    ],
  },
  {
    version: "1.0.3",
    date: "2026-01-31",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.user_synonyms_4eacfc42"); },
        get description() { return uiT("release_notes.7b6f6ad98822"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.6313fd5fdcc2"); },
        },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.7375c29392cf"); },
        get description() { return uiT("release_notes.e065979997af"); },
      },
    ],
  },
  {
    version: "1.0.2",
    date: "2026-01-30",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.993941a4159d"); },
        get description() { return uiT("release_notes.fc3b03478f2a"); },
      },
    ],
  },
  {
    version: "1.0.1",
    date: "2026-01-29",
    changes: [
      {
        type: "feature",
        get title() { return uiT("release_notes.049b0ee94748"); },
        get description() { return uiT("release_notes.7ba0aa5b8916"); },
        link: {
          route: "/settings",
          params: { scrollTo: "lessons" },
          get label() { return uiT("release_notes.0ac8685e0b11"); },
        },
      },
      {
        type: "feature",
        get title() { return uiT("release_notes.fc0a6e2b9924"); },
        get description() { return uiT("release_notes.9156aaa9ff60"); },
        link: {
          route: "/settings",
          params: { scrollTo: "reviews" },
          get label() { return uiT("release_notes.3890ae2a6e12"); },
        },
      },
      {
        type: "design",
        get title() { return uiT("release_notes.464fe646455b"); },
        get description() { return uiT("release_notes.644ee446da2d"); },
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-01-28",
    changes: [
      {
        type: "feature",
        get title() { return uiT("ui.stroke_order_animation_42d704c1"); },
        get description() { return uiT("release_notes.74016e60bb45"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.b90ce280886e"); },
        get description() { return uiT("release_notes.efc132a4a963"); },
      },
      {
        type: "fix",
        get title() { return uiT("release_notes.a422ac0c20a8"); },
        get description() { return uiT("release_notes.2058f847bf0d"); },
      },
    ],
  },
];
