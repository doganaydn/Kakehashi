# Turkish answers without WaniKani synonyms — proposed plan

Status: planning only. No answer grading or WaniKani account data has been changed.

## User requirement

The owner already added Turkish user synonyms to their own WaniKani account. A new user importing the Turkish package must also be able to answer in Turkish without adding those synonyms. Other languages are outside this work's scope.

Translations and permitted answers are separate data. Accept Turkish meaning answers locally in the personal Kakehashi fork. Keep original English answers and existing personal synonyms working. Reading questions continue to use Japanese reading rules. This does not add Turkish support to the WaniKani website or other apps.

## Package contract

Add a new versioned schema supporting explicit accepted-answer lists and a separate approval state. Do not silently reinterpret display-only schema 1/2 packages as answer-enabled packages. Preserve backwards-compatible imports and rendering. A future upgraded package retains all existing translations and example sentences.

Each subject has independently checked accepted Turkish answers. Display primary/alternatives are candidates, not an automatic whitelist. Long explanatory labels, usage notes, slash-separated explanations and complete sentences must not become accepted answers. Do not infer stems, verb forms, synonyms or paraphrases during grading. Reuse complete original-source matching (ID, type, characters, all meanings and readings); if the source is stale, deactivate package-based answers for that subject.

## Settings and grading

Provide a separate English setting: **Accept Turkish meaning answers**, initially off. Explain that the setting affects correct/incorrect results in this app and does not add WaniKani synonyms. It may be enabled only for a package with reviewed answer lists. Keep its state separate from the translation display switch; replacing or restoring a package must re-evaluate its answer capability. Existing account synonyms follow existing app behavior when the package option is off.

Use one shared grading service across relevant lesson quizzes, reviews and applicable meaning practice. Audit typed-answer, voice and choice flows so the same accepted set cannot disagree across screens. Do not simply inject package answers into account study materials: that could leak them into account-writing actions and apply the English typo tolerance. Keep package-derived answers transient and separate from stored user synonyms.

Initially compare Turkish answers exactly after NFC Unicode normalization, Turkish-aware lowercase conversion, trimming and collapsing repeated whitespace. Preserve Turkish letters and word boundaries. No approximate/AI grading and no general accent stripping. Diacritic-free typing can be a later explicit feature; it is not silently enabled. Original English answer rules remain as they are. Review interactions with source blacklist rules and warning precedence explicitly rather than bypassing them accidentally.

A correctly accepted Turkish meaning follows the existing correct-answer/session/submission path. Normal review outcome submission remains in place; this plan does not introduce a new account mutation or synchronize synonyms. A real incorrect Turkish answer must still be recorded as incorrect. Frozen session state or equivalent protection is needed if the active package changes during a question.

## Delivery sequence

1. Audit every grading entry point and existing synonym setting, including lesson quizzes, reviews, voice and choice flows. Document actual supported surfaces before implementation.
2. Add the versioned accepted-answer contract and parser tests while retaining schema 1/2 display behavior.
3. Prepare a small reviewed pilot of radical, kanji and vocabulary answers from different levels. Check multiword labels, homographs, Turkish I/İ/ı/i and examples where explanatory translations must be excluded.
4. Implement the shared Turkish matcher and independent English-labelled setting. Connect all relevant meaning flows; leave Japanese reading grading unchanged.
5. Run unit and UI integration tests, then device testing with an account-state fixture that has no Turkish synonyms. Do not clear or alter the owner's existing synonyms to simulate a new user.
6. Expand the checked answer lists to the complete Turkish package after the pilot is validated. Existing display and sentence translations stay intact. Publish completed code and documentation to origin/turkish-content; APK Release publishing remains a separate action.

## Acceptance checks

- A user with no Turkish synonyms can enable package answers and correctly answer a supported radical, kanji or vocabulary meaning.
- English and personal synonym answers keep their existing behavior.
- Turkish uppercase/lowercase and equivalent Unicode spellings match; repeated spaces do not cause errors.
- Unsupported words, unchecked answers, missing subjects, wrong subject types and changed source data cannot be accepted through the package.
- Reading answers cannot be satisfied by Turkish meaning text.
- Older display-only packages do not acquire answer acceptance automatically.
- Disabling/removing/replacing the package removes its acceptance ability without changing account synonyms.
- Correct and incorrect grading follows existing review error counts, retry rules, offline queue behavior and submission handling.

Standing authorization: completed Kakehashi changes and these planning documents are committed and pushed to the user's fork. Implementation of this proposed grading feature has not yet started.
