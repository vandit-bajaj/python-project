---
name: mobile-camera-qa
description: Checklist for testing DermaLens camera and upload flows on real iPhone and Android devices plus automated fake-camera runs. Use when changing capture, permissions or quality-gate code.
---
# Mobile camera QA

## Automated (Chromium only)
- Launch with `--use-fake-device-for-media-stream --use-file-for-fake-video-capture=<fixture file>`.
- WebKit has no equivalent; iOS camera is manual.

## Manual, per reference device in `docs/devices.md`
1. First visit: permission prompt appears after the primer screen; Allow works.
2. Deny, then re-enter: the recovery state explains how to re-enable the camera.
3. Rotate the phone mid-capture; the layout and stream recover.
4. Background the tab and return; the camera restarts and the light turned off while hidden.
5. Leave the flow; the camera indicator turns off.
6. Capture 20 times; the app stays responsive and memory stays flat.
7. Upload: a portrait photo, a landscape photo, a screenshot and a low-light photo each give a clear result or message.
8. Bad input (dark, blurry, profile, glasses, heavy makeup) is rejected with specific advice.
9. Record device, OS, browser, result and date in `docs/devices.md`.
