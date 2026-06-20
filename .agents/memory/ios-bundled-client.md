---
name: iOS bundled client code
description: The App Store iOS app runs bundled JS — frontend changes in the repo do not reach it without a new App Store build.
---

## Rule
All fixes for the currently-published iOS App Store build must be **server-side only**. Client-side React/TypeScript changes are invisible to users on the installed app.

## Why
The Capacitor iOS app bundles the compiled web assets at build time. API calls go to the production server URL, but the HTML/JS/CSS is loaded from the local bundle inside the IPA. Deploying new frontend code to the server does not update what the app renders.

## How to apply
- Server routes and services → changes take effect immediately on deploy
- Frontend components → only take effect in a new App Store build
- When the old client sends POST /process-text it expects a synchronous completed case in the response — never return {status:"processing"} as the old client has no polling fallback
