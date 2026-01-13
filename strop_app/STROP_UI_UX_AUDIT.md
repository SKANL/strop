# 🕵️‍♂️ STROP UI/UX & Architecture Audit Report

**Date:** January 12, 2026
**Auditor:** Antigravity (Senior Lead Product Designer & Flutter Engineer)
**Version Reviewed:** 1.0.0-dev

## 1. Executive Summary

The current state of the STROP mobile application represents a **High-Fidelity Visual Prototype** rather than a production-ready application. The visual implementation is outstanding, adhering strictly to the Design Manifesto (Shadows, Colors, Material 3). However, the business logic, API integration, and offline capabilities are almost entirely non-existent (stubbed with `TODO` comments).

*   **Overall Score:** **45/100**
    *   🎨 **Visual Fidelity:** 95/100 (Pixel-perfect implementation of specs)
    *   🏗️ **Architecture:** 80/100 (Clean implementation, good folder structure)
    *   ⚙️ **Functionality:** 10/100 (Critical logic is mocked or missing)

*   **Critical Blockers (Must Fix for MVP):**
    1.  **No Photo Picker:** The "Evidence" step in `CreateIncidentPage` is purely visual. No camera or gallery integration.
    2.  **No Offline Queue:** The core "Offline First" requirement is implemented as a comment (`// TODO: Submit incident via Bloc`).
    3.  **Missing Logic Layer:** The Bloc implementation is hinted at but not connected to the UI.
    4.  **No Real Auth:** The shell assumes a happy path; no evidence of the authentication flow or error states.

*   **Quick Wins:**
    1.  Extract `StropCard` and shared widgets to `lib/presentation/shared/widgets` (currently seems empty or mis-structured).
    2.  Implement the `image_picker` package in `CreateIncidentPage`.
    3.  Connect the `Submission` button to a real Repository method.

## 2. Visual Architecture Analysis

### Theme & Styling (`lib/core/theme`)
*   **Status:** ✅ **EXCELLENT**
*   **Audit:**
    *   **Material 3:** Correctly enabled (`useMaterial3: true`).
    *   **Colors:** `AppColors.dart` perfectly matches `STROP_MOBILE_APP.md`. Specific semantic colors (e.g., `orderInstructionColor = Color(0xFF2196F3)`) are hardcoded as constants, ensuring brand consistency.
    *   **Dark Mode:** "Pure Black" is avoided (`#121212` is used), adhering to `UI.md`.
    *   **Typography:** The hierarchy is well-defined.
    *   **Shadows:** `AppShadows.dart` exists, implementing the "Colored Shadows" rule.

### Component Reuse
*   **Status:** ⚠️ **WARNING**
*   **Audit:**
    *   The `lib/presentation/shared/widgets` directory appears to be underutilized.
    *   Screens like `CreateIncidentPage` are initiating their own styling (e.g., `_buildPhotoThumbnail`, `_buildStepDot`) which should be extracted into reusable `StropThumbnail` or `StropStepper` widgets.

## 3. Screen-by-Screen Deep Dive

### [Shell] `MainShellPage`
*   **Current State:** A responsive scaffold handling navigation.
*   **UX Fidelity:** **10/10**.
*   **Field Usability:**
    *   ✅ **Touch Targets:** Explicitly enforces `minHeight: 48` on navigation items.
    *   ✅ **Responsiveness:** Automatically switches to `NavigationRail` for tablets (>600dp).
    *   ✅ **FAB:** Correctly styled with `AppShadows.fab`.
*   **Code Quality:** Clean, readable, uses `go_router` best practices.

### [Feature] `CreateIncidentPage` (The Wizard)
*   **Current State:** A 3-step visual wizard (Evidence -> Context -> Review).
*   **Current Gaps:**
    *   ❌ **Photo Picker:** Clicking "Add Photo" does nothing (mocked).
    *   ❌ **Voice Input:** Microphone icon is present but non-functional.
    *   ❌ **QR Scanner:** QR button exists but is `TODO`.
    *   ❌ **Submission:** Clicking "Enviar" shows a SnackBar but performs no network/db action.
*   **Field Usability:**
    *   ✅ **Progress:** Linear indicator clearly shows step 1/3.
    *   ✅ **Contrast:** Critical priority toggle changes color drastically (Red), making it impossible to miss in sunlight.
    *   ✅ **Input:** Uses `TextCapitalization.sentences` which is helpful for rapid typing.
*   **Code Quality:** **Low (Spaghetti Potential).** The file is ~700 lines. The step building methods (`_buildStep1Evidence`) should be their own Widgets to prevent this file from becoming unmaintainable.

## 4. Interaction & State Feedback

*   **Loading States:** ❌ Not observed. No skeletons or spinners found in the audited code.
*   **Offline Indicators:** ❌ **CRITICAL MISSING**. No logic found to check connectivity or show "Saved for later sync" messages, which is a core MVP requirement.
*   **Feedback:** The SnackBar implementation is good (`AppColors.success`), but it's currently faked.

## 5. Senior Recommendations (The Roadmap)

To move from "Prototype" to "Professional MVP", execute this roadmap:

| Priority | Task | Description |
| :--- | :--- | :--- |
| 🚨 **P0** | **Implement Logic Layer** | Connect `CreateIncidentPage` to a `Cubit`/`Bloc`. Move all `// TODO` logic into the state manager. |
| 🚨 **P0** | **Offline Queue** | Implement `isar` or `hive` to store incidents locally when `Connectivity` is none. |
| 🚨 **P0** | **Photo Integration** | Implement `image_picker` and `tus_client` (Resumable Uploads) as specified in docs. |
| 🔸 **P1** | **Refactor Wizard** | Extract `Step1Evidence`, `Step2Context` into separate widget files in `presentation/incidents/widgets/`. |
| 🔸 **P1** | **Create Shared Components** | Extract `StropCard` and `StropBadge` to `shared/widgets` to enforce shadow/color rules globally. |
| 🔹 **P2** | **Voice & QR** | Implement the "Quick Capture" features (speech_to_text, qr_code_scanner). |

---

**Summary Statement:**
The code is beautiful but hollow. The "V1" feels extremely premium to use, but it currently creates no value as it cannot save data. Focus 100% of effort now on **Logic Integration** and **Offline Capabilities**.
