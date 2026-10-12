# UI localization source inventory

This first-party interface source inventory is separate from learning-content packages. It does not enable an interface language selector or change runtime behavior.

See [scope and workflow](ARAYUZ-CEVIRI-KAPSAMI.md), [per-file coverage](source/COVERAGE.md), and [manifest](source/manifest.json).

`source/en.json` contains likely UI candidates; `source/review-needed.en.json` retains ambiguous candidates. Both require editorial cleanup. Counts are source candidates, not verified unique translatable messages. `occurrences.json.gz` maps keys to files, lines, context and expressions. Dynamic/plural/native-format sites have separate review lists.

Regenerate from the repository root:

```sh
node scripts/extract-ui-translation-source.cjs
```

All tracked files in declared roots have a scan/exclusion disposition. Dependencies, learning/reference content and build assets are outside the inventory. Preserve placeholders, split keys for differing contexts and plan English fallback. Native strings and third-party controls need separate integration.
