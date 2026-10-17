# Kakehashi Türkçe — official upstream base

2026-10-17: upstream/main 33578f0 is the application baseline, including merged PR #117 and learning pages #121. The old src/features/turkish-content prototype is removed; runtime screens and translation behavior use the developer's implementation.

Personal Android adaptations: com.portego00.kakehashi.tr, Kakehashi Türkçe, kakehashitr scheme (including widget), existing signing key, version 1.5.0-tr.22 / code 47 / arm64-v8a. Official OTA is disabled for this personal build. Generated DOM source maps are excluded from release assets.

Temporary native fix: AsyncStorage_db_size_in_MB=64 instead of the library default 6 MiB. Official installed app logs showed SQLiteFullException. The full 9,409-subject package fails a simulated 6 MiB budget and activates/rehydrates at 64 MiB. This is a storage quota fix, not a claim about RAM usage or unlimited future capacity.

Translation file: translation-packages/wanikani-tr-v3.json, v1.5.1, 5,522 sentences in levels 1–15. Distribution data is not bundled into the runtime. Use Settings → Appearance → Advanced settings. The developer's default is opt-in; enable the package if necessary after updating. No automatic synonym transfer or account changes.

Before replacement, the prototype was retained in Git history and local branch personal-prototype-before-upstream-base. Phone installation and package import must be checked separately after APK delivery.

Lesson visually similar kanji cards now use the existing learning-content resolver in both kanji and single-kanji vocabulary sections. English fallback and source-matching safeguards remain enabled; no account writes.

Extra Study custom lesson/review selection and Similar Kanji matching now show package meanings. Ambiguous translated choices retain original round labels; matching and persisted sessions are unchanged. 177 tests passed on the clean contribution branch.
