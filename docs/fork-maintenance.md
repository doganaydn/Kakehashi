# Fork maintenance

The current installation data is translation-packages/wanikani-tr-v3.json, with its v3 schema and manifest. No learning catalogue is embedded in the app. Two small legacy test fixtures remain for v1/v2 compatibility; full-package tests use the current distribution.

On 12 October 2026, redundant full-size legacy distributions, the unused OriginalMeaning component and the deferred direct-grading plan were removed. Historical personal planning notes were archived outside the repository, and TURKCE-DEVAM.md now summarizes the current state. 17,678,241 bytes of obsolete files were removed locally; the local archive also preserves the former continuation log. Git history retains previously committed files.

Validation: 15 affected Jest suites / 96 tests passed. The current v3 package hash is unchanged; no runtime grading/account behavior changed and no APK was rebuilt. UI source inventory and its sharing archive were regenerated after removal of the unused component. Local delivery archives and check caches are ignored.

Upstream-owned files were left intact. Future cleanup should check references before deleting fixtures or code and retain the current translation package and localization inventory.
