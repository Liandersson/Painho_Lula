# Painho Lula — LK Music fork, BitChord v1.9 base

This project is based on the official BitChord `v1.9` source and keeps its Android modules, playback engine, integrations, original Kotlin namespace, and GPL-3.0 license notices.

## Personalization

- Android app name and playback notification channel: **Painho Lula**.
- Launcher icon: the user-provided photo, cropped for a square icon and with the overlaid caption removed so it remains clear at launcher size.
- Application ID remains `com.lk.music`, allowing this build to update the user's existing LK Music install when signed with the same local debug key.
- APK split remains `arm64-v8a` only.
- Runtime target remains Android API 36; upstream compile SDK is 37 for a dependency requirement.

## Build on Pop!_OS

Open this project's `BitChord-1.9` folder in Android Studio and wait for Gradle Sync. In Android Studio Terminal, run:

```sh
./gradlew :app:assembleProdDebug
```

The APK is created in `app/build/outputs/apk/prod/debug/`. Install/update over the existing app from the same laptop with:

```sh
adb install -r app/build/outputs/apk/prod/debug/app-prod-arm64-v8a-debug.apk
```

The release variant is unsigned unless a private keystore is configured. Keep any signing key private.

## Validation status

The app labels, adaptive icon XML, manifest, and Android string XML were statically checked for valid XML and consistent resource references. This environment did not run a Gradle build or install this revision, so compilation and device behavior still need to be confirmed in Android Studio on the user's Pop!_OS setup.

## License

The original `LICENSE` and copyright notices are retained. This derivative remains subject to GPL-3.0; corresponding source is included.
