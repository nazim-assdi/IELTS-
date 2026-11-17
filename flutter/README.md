# IELTS HERO — Flutter edition

A four-skill IELTS learning companion built with Flutter and a server-side Gemini API.

## Learning experience

- 100 curriculum units with four AI-supported lesson slots per unit (400 lesson slots).
- Four-skill lesson packs: Speaking, Listening, Reading and Writing, with Bangla explanations and vocabulary.
- AI examiner chat and Gemini Live voice practice through the Render backend.
- English dictionary with definitions, pronunciation, examples, synonyms, saved words and recent searches.
- English ↔ Bangla translation.
- Cue-card library and vocabulary practice.
- Personal study planner, daily goals, streaks and local learning progress.
- Adaptive Mistake Review: incorrect lesson answers are saved locally and scheduled for review at increasing intervals (1, 3, 7, 14 and 30 days).
- IELTS Mock Test Centre with Academic/General Training Task 1 prompts, short Listening and Reading diagnostics, Writing workspace, typed Speaking reflection, saved attempts and AI-generated skill feedback with a seven-day practice plan.

## Mock Test Centre — current scope

The current release contains a **35-minute learning diagnostic preview**, not a full-length IELTS mock examination. It includes four objective questions each for Listening and Reading, two Writing prompts and one typed Speaking reflection. The Listening passage is spoken using the device's English text-to-speech voice; it is not an original recorded IELTS-style audio track.

Only objective Listening and Reading answers are shown as percentages. Writing and typed Speaking responses receive qualitative coaching only. A typed response cannot measure real spoken fluency or pronunciation. AI feedback is for practice and is not an official IELTS score or an examiner's assessment.

The full IELTS Academic test is 2 hours 45 minutes: Listening approximately 30 minutes, Reading 60 minutes, Writing 60 minutes, and Speaking 11–14 minutes. The current diagnostic preview does not yet reproduce the complete official question counts, section timings, recordings or examiner interview. See the [official IELTS test format](https://ielts.org/take-a-test/test-types/ielts-academic-test).

## Adaptive practice

When a learner selects an incorrect answer in a lesson, IELTS HERO stores the question, selected answer, correct answer and explanation in a local mistake bank. Learners can reveal the answer and mark whether they remembered it. Correct recalls move to longer review intervals; missed recalls return to the next-day queue. The mistake bank is stored on the device using SharedPreferences and is not yet synchronised across devices.

Mock test attempts are saved locally (up to the latest 20). When the backend is available, the app requests Gemini feedback based on submitted responses and objective question results. If AI analysis is unavailable, the screen shows a local next-step recommendation instead.

## Technical architecture

- Flutter Material 3 application.
- `shared_preferences` for local progress, study plan, mock history and mistake review.
- Render Node.js backend under `flutter/backend`.
- Gemini API key stays in Render's private environment variables; it must never be placed in Flutter source code or the APK.
- Current backend defaults are configured in `flutter/backend/server.ts`; optional Render environment overrides include `GEMINI_TEXT_MODEL`, `GEMINI_TEXT_FALLBACK_MODELS` and `GEMINI_LIVE_MODEL`.
- `/health` exposes service readiness and configured model names.

## Setup

Install Flutter stable and Android Studio, then run:

```powershell
flutter create . --platforms=android,web
New-Item -ItemType Directory -Force .\android\app\src\main\res\drawable | Out-Null
Copy-Item .\config\AndroidManifest.xml .\android\app\src\main\AndroidManifest.xml -Force
Copy-Item .\config\ielts_hero_icon.xml .\android\app\src\main\res\drawable\ielts_hero_icon.xml -Force
flutter pub get
flutter analyze
flutter test
flutter run
```

Build Android:

```powershell
flutter build apk --release
```

## Gemini backend

In a separate terminal:

```powershell
cd backend
npm install
```

Create a local `.env` from `.env.example` and set `GEMINI_API_KEY` for local development. For Render, set it as a private environment variable in the service dashboard. Do not paste the key into chat, commit it to GitHub, or embed it in the APK.

Deploy the backend to HTTPS and launch Flutter with:

```powershell
flutter run --dart-define=IELTS_API_URL=https://YOUR-API-HOST
```

For Android Emulator, the host machine is commonly `http://10.0.2.2:3000`.

## Platform and test limitations

The checked-in CI workflow currently analyzes and builds the Android release APK. Windows, macOS, Linux and iOS need their own platform builds, signing and device testing. Microphone and speech-recognition availability depends on platform permissions and installed speech services.

Use official IELTS sample materials and preparation guidance alongside this app: [IELTS preparation resources](https://ielts.org/take-a-test/preparation-resources).