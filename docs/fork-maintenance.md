# Fork development and upstream contributions

## Two workspaces

- `kakehashi-tr`, branch `turkish-content`: personal Android integration and delivery. Retains the personal application identity, signing compatibility, disabled official OTA, temporary 64 MiB storage quota and separate Turkish content distribution.
- `kakehashi-translation-pr`: clean upstream contribution workspace. Each change starts on its own `fix/…`, `feature/…`, `docs/…` or `test/…` branch from current `upstream/main`. This directory name is historical; it can prepare any focused contribution.

The merged `optional-translation-packages` branch remains in Git history. Do not reuse that branch for new PRs. Do not open a PR from `turkish-content`: it includes personal release changes.

## Future changes

1. Preserve any existing work in the PR workspace, then refresh upstream and start a new branch:

   ```powershell
   ./scripts/fork/Start-UpstreamChange.ps1 -Branch fix/short-description -Refresh
   ```

   This uses the existing sibling PR worktree, refuses uncommitted work, and creates an untracked branch with `origin` as its push remote. It does not push or create a PR. Completed branches remain available; no cleanup or reset is automatic.

2. Implement the upstream-compatible change there first. Keep UI behavior consistent with the developer's code. Include focused regression tests for behavior changes. Follow the upstream `CONTRIBUTING.md` and applicable `AGENTS.md` instructions.
3. Run relevant tests in the PR workspace. Record exact commands, base/head commits, results and device-test limits in the local preparation folder `paylasim/kakehashi-upstream-prs/<change>/` outside the app repository. Use a workspace-local test cache; never commit cache files.
4. Commit only the focused changes. From the personal checkout, run:

   ```powershell
   ./scripts/fork/Test-UpstreamChange.ps1 -Branch fix/short-description
   ```

   For a known scope add `-AllowedPaths @('src/path.ts', 'src/__tests__/path.test.ts')`. Native work requires `-AllowNativeChanges` plus manual review of identity/signing/OTA. This guard checks the selected branch's clean PR workspace, committed file scope and ancestry; it does not prove correctness or run tests. Refresh upstream before the final check; if it moved, integrate it into the topic branch and rerun affected tests.

5. Review the entire `upstream/main...<branch>` diff and confirm the PR worktree is clean. No personal APK identity, version bumps, signatures, build helpers, full Turkish JSON, unrelated fixes or generated assets belong in an ordinary feature PR. Build and package changes can be proposed separately when relevant.
6. Push the focused branch to **origin only**. Preparing/pushing a branch does not open a PR. Keep title and body drafts outside the topic branch. Open the PR only when the user explicitly asks, targeting `Portego-00/Kakehashi:main`. Never automatically send comments or messages to the developer.
7. After the contribution commit is ready, integrate it into `turkish-content` (normally cherry-pick the focused commit), run affected checks, and build a personal APK if needed. Personal version/identity changes are committed only on that branch. When the developer merges/releases changes, fetch upstream and integrate normally; review any duplicate changes or conflicts rather than resetting the personal branch.

## Current prepared change

`fix/lesson-similar-kanji-translations` contains translation display corrections and regression tests for lesson visually similar kanji cards, Custom Lessons/Custom Review selection lists, and Similar Kanji matching options and answer reveals. The existing resolver preserves opt-in and source-match fallback. Matching retains original round labels if translations make choices indistinguishable; round data and grading remain unchanged. No new JSON fields, account writes or native changes are included. The branch name reflects the first fix; the PR title/body describe the complete scope.

Review material: `paylasim/kakehashi-upstream-prs/lesson-similar-kanji/` in the parent project. The source correction was already delivered personally in tr.21; its clean upstream branch is independent of APK version commits. PR creation remains a separate explicit step.

The same preparation branch now also includes Vocab Reading prompts/sentence hints, Kana to Kanji sentence hints, Context Sentences question/result translations, Crossword meaning clues/hints/results and Word Search meanings (including restored puzzles). Source matching, original puzzle/session state, Japanese answers, grading and original-English Anki exports are preserved. No translation is inferred from an ID alone. Combined validation: 25 suites / 220 tests; targeted ESLint passed. Repository-wide TypeScript checking is not clean and is not a passing validation claim.

Vocab Reading follow-up: accepted alternative/whitelisted prompts display the full translated subject meaning set; kanji vocabulary hints translate from complete cached records while saved English hints and accepted answers remain unchanged. Combined validation is now 26 suites / 226 tests, with targeted ESLint passing.

User preference (2026-10-18): preserve the original reading UI. A recognized prompt shows a single translated primary meaning; other translations appear only through the existing Context Hint, alongside preserved sentence/kanji vocabulary hints. This supersedes the full-meaning-set headline above. 26 suites / 227 tests and targeted ESLint passed.


## Mnemonic package infrastructure (18 October 2026)

Separate branch `feature/translation-package-mnemonics` starts at upstream `33578f0`; it does not extend PR #124. Format v4 adds independently matched meaning/reading mnemonics and hints. Existing renderers and text-token colors are reused; translations switch to original English in place. The contribution is integrated into `turkish-content`, with no APK rebuild or version bump. The full personal content package remains format v3 (content v1.6.0), 9,441 sentences through level 25; no mnemonic translations are included. Preparation and validation records: parent project `paylasim/kakehashi-upstream-prs/mnemonic-translations/`. A new PR still requires an explicit request.


## Personal cloud configuration (21 October 2026)

Personal builds need the public Supabase client URL and anon key in the gitignored `.env.local` to use the existing session streak and study-time sync. Preserve this local file when moving the build workspace; never commit user credentials or copy another installation’s private app data. The build staging copy includes local environment files, and Expo loads `.env.local`. Validate the public configuration before building. tr.36/code61 confirmed streak38 and combined54h4m in both installations without clearing or replacing the official app. Local ledgers retain separate device IDs; existing verified RPC history merging handles synchronization. This personal build configuration does not belong in an upstream feature PR.


## Upstream integration and search labels (27 October 2026)

Integrated upstream/main cef3b74 (updates #128, #129, #133 and merged #127) into turkish-content. Resolved parser changes by retaining v4 mnemonic fields alongside upstream per-entry validation and bounded text/list fields; all 9,409 subjects in personal v4 package 1.9.3 parse successfully. Retained personal identity, signing, disabled OTA, storage quota and gitignored cloud configuration.

Focused contribution branch fix/search-result-translations starts at cef3b74. Main subject search and legacy search modal now render optional translated primary meanings using complete source records and the existing resolver. Ranking and query matching remain original; this does not implement translated-meaning search. Contribution validation: 2 suites / 9 tests; personal integration: same 9 tests; upstream merge regression: 6 suites / 253 tests. Targeted ESLint has no errors and eight existing component warnings; test file lint clean. Structural contribution check passed. PR draft: parent paylasim/kakehashi-upstream-prs/search-result-translations/. No PR or developer message published. tr.37/code62 build prepared for user testing; device validation must be recorded separately.


### Translated search queries (27 October follow-up)

The user also requested matching Turkish queries. This supersedes the label-only scope above. fix/search-result-translations now searches reviewed primary and alternative meanings through the existing source-matched resolver, preserving original search and filtered result limits. Turkish case/keyboard folding supports ışık/IŞIK/isik and gölet/golet. Translation-off, missing, draft and stale entries do not contribute aliases. Clean and personal validation: 4 suites / 41 tests; targeted lint zero errors/eight existing warnings; structural check passed. tr.38/code63 is the follow-up build. No PR or developer message was published.
