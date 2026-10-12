# Optional translation package prototype

This is a personal fork of [Portego-00/Kakehashi](https://github.com/Portego-00/Kakehashi), updated through upstream commit [`e9d29f4`](https://github.com/Portego-00/Kakehashi/commit/e9d29f4bae5eb8c7f673cb43c0bd5adaf527304a), including Android home screen widgets and the settings redesign. The original project and its design remain the foundation of this work.

The `turkish-content` branch adds an optional, locally imported JSON translation package. Learning content uses Turkish from a separate file. Android also has a separate English/Turkish interface setting under **Settings → Appearance → App language**, with English as the default. This prototype currently accepts `tr` learning packages only. Missing or outdated learning translations fall back to the original English.

- Meanings for radicals, kanji, vocabulary and kana vocabulary.
- Japanese example sentences with translated text and separate usage explanations.
- Existing Primary/Alternative rows show translated meanings; Show original English reveals source meanings inline.
- Subject details, lessons, composition cards, visually similar kanji, Subject List, Review Complete and Items lists use the active package. Lesson selection and Items lists show translated meanings without an original-meaning button.
- Imports are checked against subject ID, type, characters, all source meanings and readings. Sentence translations also require matching original Japanese and English text.
- Importing a display package stores it locally and does not change account synonyms or answer grading.
- Import `translation-packages/wanikani-tr-v3.json` for display and explicit synonym suggestions; no catalog is bundled in the app. Older files remain display-only.
- Translation package and synonym transfer settings are available under Appearance and can be found through the new settings search.
- A separate [selective Turkish synonym transfer](docs/turkish-synonym-transfer.md) lets users choose levels, topic types, study states and individual meanings before explicitly confirming an account update. History supports pause/resume and undo of recorded additions.

The implementation was developed with AI assistance as a working prototype. The previous Android build was reported working by its user. The new interface-language work has focused regression tests, while its device and full linguistic review are still pending. Turkish UI resources include machine-generated drafts and individually corrected strings; they are not all independently reviewed translations. The full project TypeScript check still reports errors. This fork is not an official Kakehashi release.

See [the feature and format guide](docs/optional-translation-packages.md). The current Turkish package, **v1.5.0**, includes **491 radical meanings, 2,101 kanji meanings, 6,757 vocabulary meanings, 60 kana vocabulary meanings, and 5,522 example sentences covering levels 1–15**. Meanings cover levels 1–60. Download [wanikani-tr-v3.json](translation-packages/wanikani-tr-v3.json), then use **Settings → Appearance → Import translation file → Use this package** in the personal Android app. The JSON package is separate from the APK; updating the APK does not automatically replace an imported package. Translation preparation, review and personal approval are separate. Sentence translations and usage explanations received a separate second pass with the same AI model, not an independent expert review; package validation does not certify linguistic accuracy.

A separate [UI localization source inventory](localization/ARAYUZ-CEVIRI-KAPSAMI.md) covers mobile, web and native interface candidates. The [Android implementation and review record](localization/ANDROID-YERELLESTIRME.md) explains the runtime resources, native widgets/notifications, exclusions and remaining checks. Interface language is independent of learning packages and does not modify account synonyms or answer grading.

---

# Kakehashi

Kakehashi is an unofficial mobile companion app for
[WaniKani](https://www.wanikani.com), the kanji learning platform. It provides a
native iOS and Android experience for reviews, lessons, progress tracking, study
tools, listening practice, song and lyrics helpers, OCR/text utilities, and home
screen widgets.

Kakehashi is free and community-built. It requires a WaniKani account and is not
affiliated with WaniKani or Tofugu LLC.

## Offline study and widgets

When cached assignments are available, review sessions open without waiting for
a network check. Completed reviews are saved on the device before the next
question appears, and queued results sync with WaniKani when a connection is
available. Background refresh keeps the selected review batch stable, replacing
only unstarted reviews that are no longer due. Requests that reach an
unresponsive connection time out instead of holding the app indefinitely.

On iOS, widget refresh uses Expo's processing task. Keep `processing` in
`UIBackgroundModes`, and keep `com.expo.modules.backgroundtask.processing` in
`BGTaskSchedulerPermittedIdentifiers` in both `app.json` and the checked-in
native `Info.plist` when regenerating the iOS project.

## Saved news

Tap the bookmark on a news card or in the article reader, then find it in **Saved
articles** below **Other News**, or turn on **Saved only** in the top filter menu. Easy and Standard stories keep their available article
text separately from the rotating news cache. Bookmarks stay on the current
device or browser and do not sync between the mobile and web apps. Images and
audio still need a connection unless already cached; clearing app or browser
data removes saved articles.

<p>
  <a href="https://apps.apple.com/app/kakehashi-wanikani-companion/id6757765444">
    <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" height="48" />
  </a>
  <a href="https://play.google.com/store/apps/details?id=com.portego00.kakehashi">
    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" height="48" />
  </a>
</p>

## Building Kakehashi

If this is your first time working with React Native or Expo, start with Expo's
[Set up your environment](https://docs.expo.dev/get-started/set-up-your-environment/?platform=ios&device=simulated&mode=development-build)
guide. Kakehashi uses native iOS and Android projects, so make sure your
simulator or emulator, Xcode/Android Studio, and local tooling are ready before
continuing.

Install dependencies:

```bash
npm install
```

Install iOS pods:

```bash
cd ios
pod install
cd ..
```

Run the app on a simulator or emulator:

```bash
npm run ios
npm run android
```

Run on a connected device:

```bash
npx expo run:ios --device
npx expo run:android --device
```

Run common checks:

```bash
npm run lint
npm test
```

## Kanji composition in Anki reviews

Enable **Settings → Anki Advanced Settings → Show Kanji Composition** to see a
vocabulary word's component kanji and their primary meanings alongside its
revealed answer in compact cards. Tap a card to open that kanji's details;
returning keeps the review answer revealed. On Android, the settings entry is
**Anki Settings & Export**.
The option is off by default and works with grouped, meaning, and reading Anki
cards. Components appear in word order, using the saved subject catalog for
offline review; unavailable components are omitted.

## Review character size

Use **Settings → Review Settings → Review Character Size** on mobile, or
**Settings → Reviews → Review character size** on the web, to shrink review
prompts down to 30% in 10% steps. The default is 100%; answer fields and other
app text keep their own sizes. On the web, you can also change **Question text
size** from the review session's settings button, including on a phone with the
keyboard open.

## Connecting Spotify

The mobile app includes a personal Spotify setup guide in **Settings → Music
Playback → Spotify connection**. See the [Spotify setup guide](docs/spotify-personal-setup.md)
for Premium requirements, developer app settings, and the Client ID setup.
Song search uses the app’s catalog credentials independently of account linking.
Music discovery works over Wi-Fi or mobile data. Empty categories show that no
songs were found; failed requests offer **Try again** for that category.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md)
before opening an issue or pull request.
