# Optional translation packages

## Try the prototype

In Settings → Appearance, enable **Optional translation package**, choose **Import translation file**, inspect the summary and select **Use this package**. Importing replaces the entire active package; packages are not merged. Disable the option to restore original English learning content. The interface language remains English.

The current file `translation-packages/wanikani-tr-v3.json` (package v1.5.0) contains 491 radical names, 2,101 kanji meanings, 6,757 vocabulary meanings, 60 kana vocabulary meanings and 5,522 sentences across levels 1–15. It includes explicit reviewed synonym suggestions, but no personal account data or credentials. Unfinished examples are not exposed as ready translations.

## File contract

The parser in `src/features/turkish-content/resolver.ts` is the authoritative schema. Use the sample JSON for an exact example of metadata and subject records. Records carry original source information, a translated primary meaning and alternatives, and optional examples with separate translations and usage explanations. Version 2 supports image-only radicals using a null character value. The current parser accepts Turkish (`tr`) packages only. Extending the parser and language setting to other language identifiers remains future work; the English settings wording presents the intended general feature.

A translation is displayed only if its original source matches the live subject. Both source sentences must match for an example. Missing translations and source mismatches use original English. Local imports use chunked storage and atomic activation, and Settings can remove the imported package and return display meanings to original English. No demo package is bundled for display. The old pilot JSON is retained only as a test fixture.

Mnemonic and hint translations are not implemented. Answer grading is unchanged. Imported meanings are not automatically accepted as review answers and are not sent to WaniKani. A separate [user-confirmed synonym transfer](turkish-synonym-transfer.md) uses explicit `synonymAnswers` from an imported format-v3 package. Legacy files remain display-only. No translation catalog is embedded in the app.

## Development and checks

Install the dependencies using the original project's setup. From the repository root, run:

```sh
npx jest --runInBand --testPathPattern="src/features/turkish-content/__tests__|src/components/__tests__/(KanjiDetailsEtymology|RadicalDetails.translation|KanjiReadingExamples|VocabularyDetails.customSrs|LessonDetailScreen.largeText).test"
```

Tests and package samples live inside this repository; no parent project files are needed. Two small legacy package samples under `tests/fixtures/translation-packages` cover v1/v2 compatibility; complete-package tests use the current v3 distribution.

The personal Android variant uses `com.portego00.kakehashi.tr`. Version 1.5.0-tr.15 is an arm64 prototype. Local build caches, credentials and generated APKs are excluded from source control. The existing Android debug signing setup is suitable for this personal prototype; this repository does not introduce production release signing.

## Upstream updates

Keep `main` as the upstream baseline and changes on `turkish-content`. Fetch upstream, merge its main branch into a trial branch, resolve conflicts and run the translation tests and Android build before updating the personal branch. Do not force-sync the feature branch to upstream.

Review Complete result cards and Subject List browse/manage/add-item screens also resolve meanings from the active imported package. Source mismatches and disabled translations retain original English; review grading and list membership are unaffected.

Format v3 adds optional per-subject `synonymAnswers: {values: string[], reviewStatus: "editorial-reviewed"}` and `scope: "display-and-synonyms"`. The supplied `wanikani-tr-v3.json` works for display and user-confirmed account transfer; `translation-package-v3.schema.json` documents the format. Do not import the schema file itself. Settings shows a compact summary with expandable details and compressed level ranges.


The current format-v3 `translation-packages/wanikani-tr-v3.json` (package version 1.5.0) contains the same levels 1–60 meanings and synonym suggestions, plus 5,522 reviewed example translations and usage notes across levels 1–15. Existing examples are preserved. Import the updated JSON again to activate the new examples; no new APK is required. Sentence review is a separate pass by the same model, not an independent expert audit.
