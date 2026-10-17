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
