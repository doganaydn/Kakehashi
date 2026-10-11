# Optional translation packages

## Try the prototype

In Settings → Appearance, enable **Optional translation package**, choose **Import translation file**, inspect the summary and select **Use this package**. Importing replaces the entire active package; packages are not merged. Disable the option to restore original English learning content. The interface language remains English.

The public sample `translation-packages/wanikani-tr.json` contains 491 radical names, 2,101 kanji meanings, 6,757 vocabulary meanings, 60 kana vocabulary meanings and 857 example sentences (409 at level 8, 448 at level 9). It contains no WaniKani user synonyms, account data or credentials. Unfinished examples are not exposed as ready translations.

## File contract

The parser in `src/features/turkish-content/resolver.ts` is the authoritative schema. Use the sample JSON for an exact example of metadata and subject records. Records carry original source information, a translated primary meaning and alternatives, and optional examples with separate translations and usage explanations. Version 2 supports image-only radicals using a null character value. The current parser accepts Turkish (`tr`) packages only. Extending the parser and language setting to other language identifiers remains future work; the English settings wording presents the intended general feature.

A translation is displayed only if its original source matches the live subject. Both source sentences must match for an example. Missing translations and source mismatches use original English. Local imports use chunked storage and atomic activation, and Settings can remove the imported package and return display meanings to original English. No demo package is bundled for display. The old pilot JSON is retained only as a test fixture.

Mnemonic and hint translations are not implemented. Answer grading is unchanged. Imported meanings are not automatically accepted as review answers and are not sent to WaniKani. A separate [user-confirmed synonym transfer](turkish-synonym-transfer.md) uses the app-supplied Turkish catalog, independently of imported display packages.

## Development and checks

Install the dependencies using the original project's setup. From the repository root, run:

```sh
npx jest --runInBand --testPathPattern="src/features/turkish-content/__tests__|src/components/__tests__/(KanjiDetailsEtymology|RadicalDetails.translation|KanjiReadingExamples|VocabularyDetails.customSrs|LessonDetailScreen.largeText).test"
```

Tests and package samples live inside this repository; no parent project files are needed. Older package samples under `tests/fixtures/translation-packages` are regression fixtures, not current installation files.

The personal Android variant uses `com.portego00.kakehashi.tr`. Version 1.4.8-tr.10 is an arm64 prototype. Local build caches, credentials and generated APKs are excluded from source control. The existing Android debug signing setup is suitable for this personal prototype; this repository does not introduce production release signing.

## Upstream updates

Keep `main` as the upstream baseline and changes on `turkish-content`. Fetch upstream, merge its main branch into a trial branch, resolve conflicts and run the translation tests and Android build before updating the personal branch. Do not force-sync the feature branch to upstream.
