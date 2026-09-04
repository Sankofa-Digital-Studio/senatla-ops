# Mobile access release v0.5.1

## Visitor contract

- iPhone and iPad visitors see an `iPhone / iPad` menu option and a recommended Apple card. The supported install path is Safari > Share > Add to Home Screen.
- Android visitors see `Download Android` in the menu and receive the current unsigned UAT APK from the `dev-latest` GitHub release.
- Desktop and unidentified visitors see `Get the app`, leading to both clearly labelled choices.

The iOS native target is simulator-built in CI. It is deliberately not advertised as an installable IPA until Apple signing and TestFlight/App Store distribution exist.

## Version contract

- Web/package: `0.5.1`
- Android: `versionName 0.5.1`, `versionCode 501`
- iOS: `MARKETING_VERSION 0.5.1`, `CURRENT_PROJECT_VERSION 501`
- Application ID / bundle ID: `za.co.senatlatrading.ops`

## Verification evidence

- Production Angular build
- TypeScript application and spec typecheck
- Landing component tests covering Android, iPhone, iPadOS, and desktop detection
- Cypress browser flows for default, Apple, and Android visitors
- Native Android and iOS CI gates on the release pull request

Snapshots:

- `docs/visuals/platform-download-menu-v0.5.1/ios-menu-390x844.png`
- `docs/visuals/platform-download-menu-v0.5.1/android-menu-390x844.png`