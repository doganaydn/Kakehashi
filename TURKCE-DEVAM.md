# Kakehashi Türkçe — official upstream base

2026-10-17: upstream/main 33578f0 is the application baseline, including merged PR #117 and learning pages #121. The old src/features/turkish-content prototype is removed; runtime screens and translation behavior use the developer's implementation.

Personal Android adaptations: com.portego00.kakehashi.tr, Kakehashi Türkçe, kakehashitr scheme (including widget), existing signing key, version 1.5.0-tr.25 / code 50 / arm64-v8a. Official OTA is disabled for this personal build. Generated DOM source maps are excluded from release assets.

Temporary native fix: AsyncStorage_db_size_in_MB=64 instead of the library default 6 MiB. Official installed app logs showed SQLiteFullException. The full 9,409-subject package fails a simulated 6 MiB budget and activates/rehydrates at 64 MiB. This is a storage quota fix, not a claim about RAM usage or unlimited future capacity.

Translation file: translation-packages/wanikani-tr-v3.json, v1.6.0, 9,441 sentences in levels 1–25. Distribution data is not bundled into the runtime. Use Settings → Appearance → Advanced settings. The developer's default is opt-in; enable the package if necessary after updating. No automatic synonym transfer or account changes.

Before replacement, the prototype was retained in Git history and local branch personal-prototype-before-upstream-base. Phone installation and package import must be checked separately after APK delivery.

Lesson visually similar kanji cards now use the existing learning-content resolver in both kanji and single-kanji vocabulary sections. English fallback and source-matching safeguards remain enabled; no account writes.

Extra Study custom lesson/review selection and Similar Kanji matching now show package meanings. Ambiguous translated choices retain original round labels; matching and persisted sessions are unchanged. 177 tests passed on the clean contribution branch.

2026-10-18: Vocab Reading, Kana to Kanji hints, Context Sentences, Crossword and Word Search use optional package display. 220 tests/25 suites and targeted ESLint passed. Full project TypeScript checking is not clean. Source sessions/answers and original-English Anki exports are preserved; no JSON data was changed.

2026-10-18: Reading prompts now include accepted alternative/whitelisted meaning groups (full translated meaning set, no invented sense alignment). Kanji vocabulary hints resolve complete cached sources without changing saved English hints. 226 tests / 26 suites and targeted ESLint passed; full project typecheck remains not clean.

2026-10-18 UI preference correction: one translated primary meaning in Vocab Reading's main prompt, alternatives only via existing Context Hint. Existing sentence and kanji vocabulary hints preserved. 227 tests / 26 suites passed; no account or JSON changes.
