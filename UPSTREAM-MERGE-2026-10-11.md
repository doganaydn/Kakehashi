# Upstream integration — 11 October 2026

Merged Portego-00/Kakehashi main at e9d29f4 (Android widgets and settings redesign) into turkish-content.

Preserved personal Android application ID, display name, URL scheme, disabled upstream OTA updates, imported translation packages, inline meaning display, and synonym transfer. Android version is 1.5.0-tr.15, version code 40. Added translation package and synonym transfer labels to the new settings search.

Validation: 15 focused Jest suites, 266 tests passed. Settings tests rerun after search integration: 5 passed. All dependency patches applied successfully; no merge conflict markers remain; the staged whitespace check reported one inherited trailing blank line in upstream homeWidgetLayout.ios.tsx. Full TypeScript check did not pass: missing website/service dependencies and other application/test typing errors remain. No Android APK or device/widget validation was performed in this integration.

Translation package remains v1.5.0 with 5,522 sentences covering levels 1–15. No WaniKani account operations were performed. Historical planning records have since been archived outside the fork.
