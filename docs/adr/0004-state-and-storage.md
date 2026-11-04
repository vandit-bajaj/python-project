# ADR 0004: Client State Management and Local-First History Storage

- Status: accepted
- Date: 2026-11-04

## Context
DermaLens operates without user accounts or cloud databases. Users still benefit from local scan history, progress comparison, and persistent settings across visits. However, mobile browsers (particularly iOS Safari) have aggressive storage eviction policies for regular websites that haven't been visited in approximately 7 days.

## Decision
1. **Client State**:
   - Use **Zustand** for lightweight, performant UI and capture session state.
   - Separate transient capture/stream state from persistent scan outcomes.
2. **Persistent Storage**:
   - Use **Dexie.js (IndexedDB)** for local history and scan metadata.
   - Store numerical scores, timestamps, and schema versioning by default.
   - Store low-resolution image thumbnails *only* when the user explicitly opts in.
   - Full-resolution face photos are **never** stored in IndexedDB; they exist in volatile memory only during active analysis.
3. **Safari Storage Eviction Handling**:
   - Call `navigator.storage.persist()` on supported browsers.
   - Provide a prominent "Export Data" JSON backup and "Delete All Data" control in the user interface.
   - Clearly display warnings on iOS Safari that browser cache clear or extended inactivity may evict local history.

## Alternatives Considered
- **LocalStorage**: Rejected due to 5MB quota limit, synchronous I/O blocking the main thread, and lack of structured binary indexing.
- **Remote Cloud Sync**: Rejected per Rule 30 (zero backend, zero image upload guarantee).

## Consequences
- **Positive**: Zero backend overhead, absolute privacy preservation, fast asynchronous queries via Dexie.
- **Negative**: Best-effort persistence on iOS Safari; requires graceful migration schemas across analyzer versions.
