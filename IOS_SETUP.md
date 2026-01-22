# MedNote AI - iOS App Store Submission Guide

## Overview
This guide walks you through submitting MedNote AI to the Apple App Store.

## Prerequisites
- Mac computer with Xcode 15+ installed
- Apple Developer Program membership ($99/year)
- Apple Developer account configured in Xcode

## Step 1: Download the iOS Project

1. Download the `ios` folder from this Replit project to your Mac
2. The folder structure should be:
   ```
   ios/
   ├── App/
   │   ├── App.xcodeproj
   │   ├── App/
   │   └── Podfile
   ```

## Step 2: Install CocoaPods Dependencies

Open Terminal, navigate to the `ios/App` folder and run:

```bash
cd ios/App
pod install
```

## Step 3: Open in Xcode

Open the workspace file (not the project file):

```bash
open App.xcworkspace
```

## Step 4: Configure Signing & Capabilities

1. Select the **App** target in Xcode
2. Go to **Signing & Capabilities** tab
3. Select your **Team** (your Apple Developer account)
4. The Bundle Identifier is set to: `com.mednote.ai`
   - Change this if you need a different bundle ID
5. Add **Sign in with Apple** capability:
   - Click **+ Capability**
   - Select **Sign in with Apple**

## Step 5: Configure App Icons

Replace the placeholder icons in `App/App/Assets.xcassets/AppIcon.appiconset/`:

Required sizes:
- 1024x1024 (App Store)
- 180x180 (iPhone @3x)
- 120x120 (iPhone @2x)
- 167x167 (iPad Pro)
- 152x152 (iPad)
- 76x76 (iPad @1x)

You can use the logo at `client/src/assets/generated_images/minimalist_medical_ai_logo_icon.png` as a base.

## Step 6: Configure Launch Screen

The default launch screen is in `Base.lproj/LaunchScreen.storyboard`. Customize as needed.

## Step 7: Update Version Numbers

1. Select the **App** target
2. Go to **General** tab
3. Set **Version** (e.g., 1.0.0)
4. Set **Build** (e.g., 1)

## Step 8: Build and Test

1. Select an iOS Simulator or your connected iPhone
2. Click **Run** (Cmd+R)
3. Test all functionality:
   - Sign in with Apple
   - Audio recording
   - AI transcription
   - Medical note generation

## Step 9: Archive for App Store

1. Select **Any iOS Device** as the build target
2. Go to **Product > Archive**
3. Wait for the archive to complete

## Step 10: Upload to App Store Connect

1. Open **Window > Organizer**
2. Select your archive
3. Click **Distribute App**
4. Select **App Store Connect**
5. Follow the prompts to upload

## Step 11: App Store Connect Configuration

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app with bundle ID `com.mednote.ai`
3. Fill in app information:
   - App Name: MedNote AI
   - Primary Language: English
   - Category: Medical
   - Content Rights: Does not contain third-party content
4. Add screenshots for different device sizes
5. Write app description and keywords
6. Configure pricing (free with in-app purchases for Paddle subscription)
7. Submit for review

## App Store Requirements

### Privacy Policy
You need a privacy policy URL. Key points to include:
- Audio recording for transcription
- Medical data handling
- HIPAA compliance measures
- Data storage and security

### Age Rating
Select: 17+ (Medical/Treatment Information)

### In-App Purchases
Configure your Paddle subscription as a non-consumable or auto-renewable subscription.

## Troubleshooting

### "Signing certificate not found"
- Open Xcode Preferences > Accounts
- Click your Apple ID > Manage Certificates
- Add a new iOS Distribution certificate

### "Provisioning profile doesn't include capability"
- Go to Apple Developer portal
- Add "Sign in with Apple" to your App ID
- Regenerate provisioning profile

### Build fails with CocoaPods error
```bash
cd ios/App
pod deintegrate
pod install
```

## Support

For issues with the app itself, check the Replit project logs.
For App Store submission issues, contact Apple Developer Support.
