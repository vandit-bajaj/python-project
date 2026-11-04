# DermaLens — Human Action Items

This document tracks items that require human accounts, external credentials, or physical device hardware testing. The automated engineering loop cannot perform these actions autonomously and logs them here with exact steps.

---

## High Priority / Current Phase (Phase 0)

### 1. Connect GitHub Repository to Vercel
- **Context**: Camera features require HTTPS on real phones; Vercel preview deploys provide instant HTTPS URLs for mobile testing per PR.
- **Steps**:
  1. Go to [vercel.com](https://vercel.com) and log into your account.
  2. Click **Add New...** > **Project**.
  3. Import the GitHub repository: `https://github.com/vandit-bajaj/python-project`.
  4. In the Project Configuration:
     - **Framework Preset**: Next.js
     - **Root Directory**: `apps/web` (Enable the checkbox: *"Include source files outside the Root Directory in the Build Step"* so workspace packages like `packages/*` build correctly).
     - **Build Command**: `pnpm turbo build --filter=web`
     - **Install Command**: `pnpm install --frozen-lockfile`
  5. Deploy.
  6. Under **Project Settings > Deployment Protection**, ensure preview deployments are password/auth protected if you want privacy before launch, or keep `noindex` headers active.

### 2. Record Physical Test Devices in `docs/devices.md`
- **Context**: Roadmap D4 requires testing on both iPhone and Android, with one mid-range reference device designated per platform.
- **Steps**:
  1. Open [docs/devices.md](file:///c:/Users/vandi/Downloads/python-project/docs/devices.md).
  2. In the table, fill in:
     - Exact iPhone model (e.g. iPhone 13 / 14 / 15), iOS version, and Safari version.
     - Exact Android model (e.g. Pixel 7a, Samsung Galaxy A54), Android OS version, and Chrome version.
  3. Mark one device per platform with `Yes` in the **Reference?** column.

---

## Pending Physical Device Verification (Post-Phase 0)

### 3. Verify Camera Permissions on Physical Devices (Phase 1)
- **Status**: Pending Phase 1 implementation & deployment
- **Steps**:
  1. Open the Vercel preview deploy link on the reference iPhone in Safari.
  2. Confirm the permission primer appears and tapping "Allow" launches the camera stream.
  3. Repeat on the reference Android phone in Chrome.
  4. Note any permission quirks in `docs/devices.md`.

### 4. Client-side PDF Download on Mobile Browsers (Phase 5)
- **Status**: Pending Phase 5 implementation
- **Steps**:
  1. Run a sample scan on iPhone Safari.
  2. Tap "Export PDF" and confirm iOS opens the file save/share sheet cleanly without page reloading.
  3. Repeat on Android Chrome and verify download to device storage.
