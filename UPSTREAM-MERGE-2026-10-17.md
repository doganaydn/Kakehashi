# Upstream integration — 17 October 2026

Baseline: personal build `1.5.0-tr.18`, commit `f723c05`.
Upstream: `8ac088c` (16 October), including:

- `ffd51d2`: Android subject-details freezes, personal vocabulary and review flows.
- `7da2c52`: note formatting and mobile Bunpro reviews.
- `222a0bd`: Bunpro study flows, settings persistence and lesson tools.
- `8ac088c`: review-details keyboard shortcuts on native and web.

## Conflict resolution

Subject List now respects upstream's Hide Meanings preference while resolving
visible meanings from the imported Turkish package. Hidden meanings also stay
out of accessibility labels. Added a regression test with Turkish display enabled.

VocabularyDetails tests retain both the Turkish sentence/display tests and
upstream's case/whitespace similar-vocabulary regression. Production vocabulary
normalization uses upstream's locale-independent `toLowerCase` fix for Hermes.

## Validation and scope

46 affected native and translation test suites / 692 tests passed. No account
writes or transfer/resume actions were executed outside mocked tests.
Project-wide TypeScript checking remains non-clean: existing errors, upstream
Bunpro fixture typings and Deno/website dependency/configuration diagnostics are
reported in the local integration log. It is not presented as a passing check.

The interface remains English. Optional learning translations, synonym transfer,
personal application ID/signing and disabled upstream OTA are preserved.
The v1.5.0 learning JSON remains unchanged (SHA256
`8982af02762a5120f0702c770b45c2fc9f3b427ed5ee5e57bb7d3d69804507a7`).

Personal delivery version: `1.5.0-tr.19`, code 44, arm64-v8a. Build/signature and
device-test status are recorded in the external `BUILD-MANIFEST-tr.19.json`.
The separate optional-translation-packages branch / upstream PR #117 is unchanged.
