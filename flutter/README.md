# IELTS HERO — Flutter edition

This is the first Flutter/Dart migration pass based on the uploaded IELTS HERO React + TypeScript project.

## Included
- Flutter Material 3 app shell with Learn, Voice, Cue Cards and Vocabulary tabs.
- The original 100-unit curriculum and 10 learning sections.
- Two practice lessons per unit.
- Local XP, gems and lesson progress using shared_preferences.
- Paper Warm, Soft Sage and Midnight Slate themes.
- Speaking practice with speech-to-text and text-to-speech where supported.
- Cue-card bank and vocabulary practice.
- Server-side Gemini API copied from the original project into backend/server.ts.

## Porting status
This is a first migration pass, not a complete feature-parity claim. Analytics, weekly reports, leaderboard, phrasebook, vocabulary mastery, offline sync reconciliation, sound effects and some modal flows still need separate Flutter implementations. The current Voice Studio is turn-based examiner chat, not Gemini Live low-latency audio.

The original supplied image files are not included in this initial GitHub branch; built-in Flutter icons and gradients are used so the source remains lightweight.

## Setup
Install Flutter stable and Android Studio, then run:

```powershell
flutter create . --platforms=android,windows,macos,linux,web
New-Item -ItemType Directory -Force .\\android\\app\\src\\main\\res\\drawable | Out-Null
Copy-Item .\\config\\AndroidManifest.xml .\\android\\app\\src\\main\\AndroidManifest.xml -Force
Copy-Item .\\config\\ielts_hero_icon.xml .\\android\\app\\src\\main\\res\\drawable\\ielts_hero_icon.xml -Force
flutter pub get
flutter analyze
flutter run
```

Build Android and Windows:

```powershell
flutter build apk --release
flutter build windows --release
```

## Android app identity and microphone\n\nThe Android manifest requests microphone and internet access for speech recognition and sets the installed app name to **IELTS HERO**. The launcher icon is the custom green IELTS HERO mark. Android may still show a separate microphone permission prompt the first time you tap the mic.\n\n## Gemini model and free usage

The backend is pinned to **`gemini-2.5-flash`**. It uses the Gemini Developer API through Google AI Studio; it does not require a Gemini Advanced subscription. Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey), then add it as the private `GEMINI_API_KEY` environment secret in your Render service. Do not put the key in Flutter code or share it in the app.

Google lists Gemini 2.5 Flash with free-tier input and output tokens, subject to account/model rate limits and availability. Free access is limited, not unlimited; requests may be temporarily rejected when the quota is reached. Check the current [official Gemini API pricing and free-tier limits](https://ai.google.dev/gemini-api/docs/pricing).

## Gemini backend\nIn a separate terminal:

```powershell
cd backend
npm install
```

Copy `.env.example` to `.env`, set `GEMINI_API_KEY`, then run `npm run dev`. Never put the Gemini API key in Flutter source code. Deploy the backend to HTTPS and launch Flutter with:

```powershell
flutter run --dart-define=IELTS_API_URL=https://YOUR-API-HOST
```

For Android Emulator, the host machine is commonly `http://10.0.2.2:3000`.

## Microphone permissions
After generating platform folders, add the required microphone/speech permissions to AndroidManifest.xml and any other target platform configuration. Speech recognition availability depends on platform services.

## Source
Original project: uploaded IELTS HERO React + TypeScript + Vite + Express + Gemini source.
