# Turkish Learning Content

An optional Turkish learning content package for Kakehashi. The application interface remains in its existing language.

Import **wanikani-tr-v3.json** from **Settings → Appearance → Advanced settings** and enable translation display.

## Coverage

- Turkish meanings for levels 1–60: 491 radicals, 2,101 kanji and 6,817 vocabulary items, including kana vocabulary.
- 9,441 example sentence translations and usage notes for levels 1–25.
- Turkish synonym suggestions for optional, user-confirmed transfer to WaniKani.

The v3 package does not include mnemonics. For the personal mnemonic pilot, install **1.5.0-tr.26 or newer** and import **wanikani-tr-v4.json** instead. It preserves all existing meanings, synonym suggestions and 9,441 examples, and adds 462 mnemonic/hint fields for 203 level 9 subjects. Format v4 requires the mnemonic extension; do not import it into older official builds that only support v3.

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
