# Conniku — Mobile App Release Guide

## App Information
- **App Name:** Conniku
- **Package ID:** com.conniku.app
- **Version:** 1.0.0 (versionCode: 1)
- **Category:** Education / Social Networking
- **Min Android:** API 23 (Android 6.0)
- **Min iOS:** 15.0

---

## ANDROID — Google Play Store

### Step 1: Generate Signing Key
```bash
keytool -genkey -v -keystore conniku-release.keystore \
  -alias conniku -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Conniku, OU=Mobile, O=Conniku Inc, L=Santiago, ST=RM, C=CL"
```
**IMPORTANT:** Save this keystore file and passwords securely. You need the same key for all future updates.

### Step 2: Configure Signing in Gradle
Edit `android/app/build.gradle`, add inside `android { }`:
```gradle
signingConfigs {
    release {
        storeFile file('conniku-release.keystore')
        storePassword 'YOUR_STORE_PASSWORD'
        keyAlias 'conniku'
        keyPassword 'YOUR_KEY_PASSWORD'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### Step 3: Build Release APK/AAB
```bash
# Build web assets and sync
npm run mobile:build

# Open Android Studio
npm run mobile:android

# In Android Studio:
# Build > Generate Signed Bundle / APK > Android App Bundle (.aab)
# Select your keystore, enter passwords, choose "release"
```

Or from command line:
```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Step 4: Google Play Console
1. Go to https://play.google.com/console
2. Create new app > "Conniku"
3. Fill in store listing:
   - **Short description:** La plataforma todo-en-uno para estudiantes universitarios
   - **Full description:** (see below)
   - **Category:** Education
   - **Content rating:** Everyone
4. Upload the `.aab` file
5. Set pricing: Free (with in-app purchases)
6. Submit for review

### Store Description (Spanish)
```
Conniku es la plataforma todo-en-uno para tu vida universitaria. Conecta con compañeros, estudia de forma interactiva, y prepárate para tu futuro profesional.

Funciones principales:
• Feed Social — Comparte logros, preguntas y recursos con tu comunidad
• Mensajes — Chat en tiempo real con compañeros, grupos y notas de voz
• Cursos — 60+ cursos con certificados para tu perfil profesional
• Proyectos — Gestiona tus trabajos con documentos e IA integrada
• Comunidades — Únete a grupos de estudio y foros académicos
• Bolsa de Trabajo — Encuentra pasantías, empleo y tutorías
• Eventos — Descubre hackathons, conferencias y meetups
• Mentoría — Conecta con mentores experimentados
• Salas de Estudio — Sesiones Pomodoro compartidas con videollamada
• Marketplace — Comparte y descarga apuntes y recursos

Conniku: Donde los estudiantes se conectan, aprenden y crecen.
```

---

## iOS — Apple App Store

### Step 1: Prerequisites
```bash
# Install Xcode from Mac App Store
# Install CocoaPods
brew install cocoapods

# Or
sudo gem install cocoapods
```

### Step 2: Generate iOS Project
```bash
# Run the setup script
./scripts/setup-ios.sh

# Or manually:
npm run mobile:build
npx cap add ios
npx cap sync ios
npx cap open ios
```

### Step 3: Configure in Xcode
1. Open `ios/App/App.xcworkspace`
2. Select "App" target
3. **Signing & Capabilities:**
   - Team: Your Apple Developer account
   - Bundle Identifier: com.conniku.app
4. **General:**
   - Display Name: Conniku
   - Version: 1.0.0
   - Build: 1
   - Deployment Target: 15.0
5. **Info.plist** — add usage descriptions:
   - Camera Usage: "Conniku necesita acceso a tu cámara para foto de perfil"
   - Microphone Usage: "Conniku necesita acceso al micrófono para mensajes de voz"
   - Photo Library Usage: "Conniku necesita acceso a tus fotos para compartir imágenes"

### Step 4: App Icons
- Place your 1024x1024 icon in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Xcode will auto-generate all required sizes

### Step 5: Build & Submit
1. Product > Archive
2. Distribute App > App Store Connect
3. Upload

### Step 6: App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Create new app > "Conniku"
3. Fill in metadata (same as Play Store description above)
4. Add screenshots (6.7", 6.5", 5.5" iPhone + iPad)
5. Submit for review

---

## Required Screenshots

Capture screenshots at these resolutions:

### iPhone
- 6.7" (1290x2796) — iPhone 15 Pro Max
- 6.5" (1284x2778) — iPhone 14 Plus
- 5.5" (1242x2208) — iPhone 8 Plus

### iPad
- 12.9" (2048x2732) — iPad Pro

### Android
- Phone: 1080x1920 (minimum)
- 7" Tablet: 1200x1920
- 10" Tablet: 1600x2560

### Suggested Screenshots
1. Landing/Welcome screen
2. Feed with posts
3. Messages/Chat
4. Courses catalog
5. User profile
6. Communities
7. Job listings
8. Study rooms

---

## Privacy Policy & Terms
Required for both stores. Must be hosted at:
- https://conniku.com/privacy
- https://conniku.com/terms

---

## Push Notifications Setup

### Android (Firebase)
1. Go to https://console.firebase.google.com
2. Create project "Conniku"
3. Add Android app (com.conniku.app)
4. Download `google-services.json`
5. Place in `android/app/google-services.json`

### iOS (APNs)
1. In Apple Developer portal, create APNs key
2. Download .p8 key file
3. Configure in Firebase or your push service
