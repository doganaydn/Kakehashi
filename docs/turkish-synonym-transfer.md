# Selective Turkish synonym transfer

Open **Settings → Appearance → Add Turkish synonyms to WaniKani**. Opening this page, importing a display package, loading history and preparing a preview never write to WaniKani.

## User flow

1. Choose individual levels or a range, up to your current WaniKani level.
2. Select radicals, kanji and/or vocabulary (including kana vocabulary).
3. Select study states. Only learning items are selected by default; lessons not started, burned and locked topics are explicit alternatives.
4. Prepare a network-verified preview. Uncheck entire topics or individual suggestions. Existing case-equivalent synonyms cannot be added again.
5. Confirm the account, selected levels and maximum number of new synonyms. Only then does the worker write.

Suggestions come from the active **imported** format-v3 package, specifically each subject's `synonymAnswers.values` with an `editorial-reviewed` status. Display primary/alternatives and sentences never implicitly become transfer answers. The old app-supplied catalog is no longer bundled. Older v1/v2 packages still work for display but cannot prepare or resume additions; receipt-based undo remains available even with no package loaded.

Import `translation-packages/wanikani-tr-v3.json` for both display and selective transfer. The file preserves the existing meanings/sentences and separately lists the existing reviewed meaning candidates; it is not a new translation pass. A schema/status marker is not a signature or a guarantee of linguistic accuracy. Review the file's suggestions before confirming account writes. This feature uses personal synonyms and leaves reading grading unchanged. The existing Accept User Synonyms setting still controls synonym answers.

Changing/removing the active package invalidates an unconfirmed preview or stops further additions. Resuming history validates each stored selected answer against the currently imported explicit answer list and live subject source. Importing a file never writes to an account.

## Preservation and recovery

Fresh source subjects, study state and online materials are checked during preparation and again during execution. Missing or changed sources are excluded/blocked. Each save re-reads the server synonyms and applies only selected additions; notes and existing synonyms remain untouched. Saves are serialized with existing synonym editors. A create conflict (422) is handled by reading the material created meanwhile and merging additions.

A per-account, device-local journal has a small record per subject. No API token is stored in it. Intent is durable before writing, and successful receipts record only additions made by that save. Loading history never resumes a worker. Closing the screen, backgrounding or switching accounts pauses after the current item. Resume is explicitly confirmed. One worker runs at a time, with spaced requests.

**Undo / cancel this transfer** removes only exact additions identified by saved receipts and cancels unsent work. Other synonyms and notes are preserved. Interrupted undo retains its operation mode and cannot accidentally resume additions.

If a request may have succeeded but the receipt was lost, meanings found in that ambiguous window are marked uncertain. They are not claimed as owned or automatically removed by undo. History is available only on this device; clearing app data loses receipts. The API has no atomic cross-device merge: an unrelated client editing the same array during the final read/write window can still race this operation.

A token with Study Materials create/update permissions is required. Network, permission and validation failures stop the worker with an error; it never automatically restarts. [API contract](https://docs.api.wanikani.com/20170710/#study-materials).

## Validation and maintenance

Tests use mocked API responses and storage only, covering filters, source changes, Turkish duplicates, confirmation gating, account switches, concurrent editors, durable intent failures, pause/resume, ambiguous success and receipt-based undo. No real account mutations are part of development validation. 176 focused tests pass across 18 suites. Targeted lint passes; the project-wide type check still reports pre-existing unrelated errors. Physical device verification is pending with a same-signed arm64 APK (1.4.8-tr.14).

The UI is English and the original app design is retained. This implementation is on `turkish-content`; no upstream PR has been submitted. The earlier direct package-answer acceptance plan is deferred in favor of this explicitly confirmed synonym flow.

## Preview navigation

Only reached levels are shown, with labeled From/To range inputs. Topics with no new suggestions are hidden by default; they can be shown explicitly. Unchecking a topic never hides it merely because its selection is empty. Filter the preview by level and browse 30 topics per page. Filters and pages affect only display; final confirmation includes all selected topics across pages and levels.

The user reports successful multi-topic transfer, pause, restart with explicit resume and undo on a Samsung Galaxy A55 for tr.11. The tr.12 navigation changes still require physical display verification.
