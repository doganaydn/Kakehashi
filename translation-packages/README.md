# Turkish Learning Content

An optional Turkish learning content package for Kakehashi. The application interface remains in its existing language.

Import **wanikani-tr-v3.json** from **Settings → Appearance → Advanced settings** and enable translation display.

## Coverage

- Turkish meanings for levels 1–60: 491 radicals, 2,101 kanji and 6,817 vocabulary items, including kana vocabulary.
- 9,441 example sentence translations and usage notes for levels 1–25.
- Turkish synonym suggestions for optional, user-confirmed transfer to WaniKani.

The v3 package does not include mnemonics. For the personal mnemonic pilot, install **1.5.0-tr.26 or newer** and import **wanikani-tr-v4.json** instead. Version 1.8.2 preserves all existing meanings, synonym suggestions and 9,441 examples, and includes 1,283 mnemonic/hint fields for 565 subjects across levels 7, 8 and 9. Format v4 requires the mnemonic extension; do not import it into older official builds that only support v3.

Missing or outdated translations fall back to the original content. Importing a package does not automatically add synonyms or change answer grading.

## Review status

Translations were prepared with AI assistance and checked in a separate review pass using the same model. They have not received independent expert review; corrections may still be needed. “Editorial-reviewed” is an internal workflow status, not expert certification.

## Version 1.6.0

Adds 3,919 checked example translations and usage notes for levels 16–25. Previously exported examples, Turkish meanings, synonym suggestions and package identity are preserved. Subject 7549 now uses its updated English source-meaning list. File format remains version 3 and works without the future mnemonic extension.

The adjacent manifest records counts, source hashes and the package checksum. It is a maintenance record and should not be imported into the app. Sample files in this directory are separate integration examples.

## Version 1.7.0 — v4 pilot

Adds level 9 meaning/reading mnemonics and their hints. Source text is matched independently for each field, and original English remains available through the existing toggle. Turkish sound cues use reading markup rather than mixed-case emphasis. Radical names follow the existing catalog; kanji and vocabulary meanings follow their context. This is a user-test package, with the same separate AI review process described above. The v3 package remains available unchanged.

## Version 1.7.1 — paragraph formatting

Adds paragraph breaks at editorial transitions in 76 mnemonic fields. Wording, markup, meanings, synonym suggestions and examples are unchanged. Re-import the updated v4 JSON; the existing tr.26 APK supports it without rebuilding. User feedback on the translation wording is still being collected.

## Version 1.7.2 — simpler mnemonic wording

Reviews all 462 level 9 fields and revises 253: every reading mnemonic, every reading hint, and 33 meaning/hint fields. Familiar readings are combined in plain language with a Latin-letter pronunciation and the Japanese spelling. Long vowels and sound changes remain explicit; paragraph breaks, radical names and useful story connections are preserved. The other 209 fields remain unchanged. Meanings, synonym suggestions and sentence records outside the mnemonic fields are identical to the v3 package. Re-import the JSON in tr.26; no APK update is needed.

The file is compact JSON: removing formatting whitespace makes it smaller than the indented v3 file despite the added mnemonic data. The simplified wording also slightly reduces size. Subject or sentence coverage has not been reduced.

## Version 1.7.3 — minimal reading reminders

Follows the original mnemonic's teaching scope: familiar readings receive a short reminder rather than a repeated answer or romaji breakdown. New reading stories and necessary sound-change explanations remain. Removes the separate pronunciation row from reading mnemonics. Revises 178 reading fields; other content is unchanged. Re-import the JSON in the existing tr.26 application.

## Version 1.7.4 — kanji markup review

Checks all 162 fields for the 41 level 9 kanji and corrects 40 fields. Restores missing reading tags on mnemonic sound cues, marks target kanji meanings where present, keeps punctuation outside sound tags, and preserves catalog names for the Infinity and Horns radicals. Original hints without highlighting remain uncluttered. No additional romaji, pronunciation rows, UI changes or APK update are introduced.

## Version 1.8.0 — vivid level 9 stories

Reviews all 462 level 9 fields and revises 254. Meaning stories and genuinely new reading mnemonics now use concrete actions, memorable details and natural paragraph breaks. Hints recall the same scene. Familiar reading reminders, direct compositions and clear visual radical descriptions stay concise where a longer story adds no learning value.

This is the continuing writing standard for future levels: keep the source's teaching link, adapt soundplay to natural Turkish, preserve radical catalog names and semantic tags, and avoid routine romaji, mixed-case emphasis, repeated pronunciation rows or formulaic endings. Vivid storytelling does not replace accurate readings or imply that invented scenes are historical facts. This package still covers mnemonic translations only at level 9; future levels have not been added.

Previous meanings, synonym suggestions and 9,441 sentences are preserved. The same tr.26 APK supports this content update. Translations received a separate pass using the same model, not independent expert review; individual user review remains separate.

## Version 1.8.1 — level 8 mnemonics

Adds all 409 source mnemonic/hint fields for 181 level 8 subjects: 14 radicals, 34 kanji, 127 vocabulary and 6 kana vocabulary items. Level 9's 462 fields remain identical. New meaning and reading stories follow the vivid-story standard; familiar readings stay concise. Radical names follow the Turkish catalog, sound cues preserve kana distinctions, and hints follow their corresponding scenes.

Drafts and a separate review pass are recorded locally; this is the same-model editorial process described above, not independent expert or individual user approval. Full-package loading, source-matched resolution, changed-source fallback, persistence and mnemonic rendering passed 3 suites / 18 tests. Re-import the JSON in the existing tr.26 APK; no rebuild is needed. Levels 7 down to 1 are the next mnemonic work, in that order, and are not included yet.

## Version 1.8.2 — level 7 mnemonics

Adds all 412 mnemonic/hint fields for 181 level 7 subjects: 20 radicals, 37 kanji, 122 vocabulary and 2 kana vocabulary items. All level 8 and 9 mnemonic fields remain identical. Meanings, synonym suggestions and 9,441 sentence translations are preserved.

New stories follow the same vivid Turkish writing standard; familiar readings stay short. Each subject has a separate review record, including corrections to sound cues, kana length, grammatical distinctions and story/hint consistency. The review is a separate pass by the same model, not independent expert review or individual user approval. Re-import the v4 JSON in tr.26; no APK rebuild is needed. Level 6 is the next mnemonic work and is not included yet.
