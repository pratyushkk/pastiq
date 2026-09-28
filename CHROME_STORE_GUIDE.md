# 🚀 Chrome Web Store Publishing Guide for Pastiq

This guide contains everything you need to publish **Pastiq** to the **Google Chrome Web Store**.

---

## 📁 Pre-Generated Ready-to-Upload Files

All necessary assets and packages have already been generated and are ready on your machine:

1. **Extension Package (ZIP)**:
   - Location: [`release/pastiq-v1.0.0-chrome.zip`](file:///C:/Users/PRATYUSH/OneDrive/Desktop/Pastiq/release/pastiq-v1.0.0-chrome.zip)
   - Size: ~380 KB (clean production build with Manifest V3 and `manifest.json` at root).

2. **Store Graphics & Screenshots**:
   - **Store Icon (128×128)**: [`icons/icon128.png`](file:///C:/Users/PRATYUSH/OneDrive/Desktop/Pastiq/icons/icon128.png)
   - **Screenshot 1 (1280×800)**: [`store-assets/chrome-screenshot-1-overview-1280x800.png`](file:///C:/Users/PRATYUSH/OneDrive/Desktop/Pastiq/store-assets/chrome-screenshot-1-overview-1280x800.png)
   - **Screenshot 2 (1280×800)**: [`store-assets/chrome-screenshot-2-quick-palette-1280x800.png`](file:///C:/Users/PRATYUSH/OneDrive/Desktop/Pastiq/store-assets/chrome-screenshot-2-quick-palette-1280x800.png)
   - **Small Promo Tile (440×280)**: [`store-assets/chrome-promo-tile-440x280.png`](file:///C:/Users/PRATYUSH/OneDrive/Desktop/Pastiq/store-assets/chrome-promo-tile-440x280.png)
   - **Marquee Promo Tile (1400×560)**: [`store-assets/chrome-marquee-promo-1400x560.png`](file:///C:/Users/PRATYUSH/OneDrive/Desktop/Pastiq/store-assets/chrome-marquee-promo-1400x560.png)

---

## ⚡ Step 1: Open Chrome Web Store Developer Console

1. Open your browser and navigate to:
   👉 **[https://chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)**
2. Sign in with your Google account.
3. If this is your first time registering as a Chrome Web Store developer:
   - Accept the Developer Agreement.
   - Pay the one-time $5 USD registration fee required by Google.

---

## 📦 Step 2: Upload Your Extension Package

1. In the top-right corner of the Developer Console, click **+ New Item**.
2. Drag and drop your packaged ZIP file:
   ```
   C:\Users\PRATYUSH\OneDrive\Desktop\Pastiq\release\pastiq-v1.0.0-chrome.zip
   ```
3. Chrome Web Store will inspect and unpack your manifest. Once uploaded, the edit screen will open.

---

## 📝 Step 3: Store Listing Tab

Copy and paste the exact values below:

### Basic Details
- **Name**:
  ```text
  Pastiq — Clipboard & Command Center
  ```
- **Summary (Short Description)** *(max 132 chars)*:
  ```text
  Fast, privacy-first clipboard manager, snippet expander, and universal browser command center.
  ```

- **Detailed Description**:
  ```text
  Pastiq is a fast, local-first Clipboard Manager, Snippet Tool, and lightweight browser Command Center designed for people who copy and paste constantly while browsing.

  Built for speed, keyboard efficiency, and absolute privacy, Pastiq combines your clipboard history, reusable text templates, and essential page actions into one unified, lightning-fast search interface.

  The core philosophy:
  COPY → SAVE → SEARCH → PASTE → ACT

  ==================================================
  🌟 KEY FUNCTIONALITIES & FEATURES
  ==================================================

  1. 🗄️ SMART LOCAL CLIPBOARD HISTORY
  • Automatic, Event-Driven Capture: Automatically preserves copied text, links, code, and snippets with zero background CPU polling loops.
  • Rich Clip Metadata: Displays character counts, word counts, timestamps, and source domain information for every item.
  • Pin Important Items: Pin frequently used text, addresses, or code snippets so they are never lost or removed by auto-cleanup.
  • Configurable History Limits: Choose your desired history retention limit (100, 500, 1,000, 5,000, or unlimited). Old unpinned clips are pruned automatically.

  2. ⚡ UNIVERSAL SEARCH & COMMAND CENTER
  • Unified Ranked Search: Typing a keyword simultaneously surfaces matching clipboard items, saved snippets, and context-aware browser actions.
  • Keyboard-First Workflow: Navigate results with Arrow keys (↑ / ↓), press Enter to copy/paste immediately, or press Delete to remove an item without touching your mouse.
  • Power Command Syntax (Optional): Type /page to filter page actions or /tab to manage your tabs directly from the search bar.

  3. 📝 REUSABLE SNIPPETS & SAFE TEXT EXPANSION
  • Canned Text & Templates: Save standard emails, code snippets, formatted messages, and addresses.
  • In-Page Trigger Expansion: Type a registered shortcut prefix (such as ;email or ;addr) in any regular text box or form field, and Pastiq expands it instantly.
  • Strict Sensitive Field Shield: Built-in safety filters guarantee snippet expanders will never run or record in password, credit card, CVV, or authentication fields.

  4. 🎯 ONE-CLICK PAGE & BROWSER ACTIONS
  • Clean Copy Visible Page Text: Copies clean, readable article text while automatically stripping out ads, cookie banners, navigation menus, and scripts.
  • Force Copy Selected Text: Extracts highlighted text even on sites that attempt to disable normal right-click or text selection.
  • Instant Page Extraction: One-click actions to copy the current page title, URL, or focused element.
  • Fast Browser Navigation: Open new tabs, reload the active tab, duplicate tabs, or quickly jump to Downloads and History.

  5. 🚀 FLOATING IN-PAGE QUICK PALETTE
  • Press Ctrl + Shift + Space anywhere on any website to summon a Spotlight-style floating palette.
  • Search your history and paste clips directly into active form inputs without switching away from your current webpage.

  6. 🔒 100% LOCAL-FIRST PRIVACY PROMISE
  • Local Storage Only: All clips, snippets, and preferences reside strictly on your device inside browser IndexedDB and local storage.
  • No Cloud Telemetry: Pastiq does not operate an external clipboard server, does not require an account, and does not upload your clipboard data to any cloud service.
  • Domain Blocklist: Easily add sensitive domains (e.g. banking or internal tools) where Pastiq should completely suspend capture.

  ==================================================
  ⌨️ DEFAULT KEYBOARD SHORTCUTS
  ==================================================
  • Ctrl + Shift + P — Open Pastiq Window
  • Ctrl + Shift + Space — Summon In-Page Quick Palette
  • Alt + Shift + C — Clean Copy Visible Page Text
  • Alt + Shift + X — Force Copy Selected Text
  • Ctrl + K — Focus Search Input
  • Esc — Close Palette / Popup

  ==================================================
  🌐 LINKS & SUPPORT
  ==================================================
  • Official Website: https://pratyushkk.github.io/pastiq-website/
  • Privacy Policy: https://pratyushkk.github.io/pastiq-website/privacy.html
  • Open-Source Repository: https://github.com/pratyushkk/pastiq
  ```

### Categorization & URLs
- **Category**: `Productivity` (or `Workflow & Planning`)
- **Language**: `English (United States)`
- **Official URL / Homepage**:
  ```text
  https://pratyushkk.github.io/pastiq-website/
  ```
- **Support URL**:
  ```text
  https://github.com/pratyushkk/pastiq/issues
  ```

### Upload Graphic Assets
- **Store Icon (128x128)**: Upload `icons/icon128.png`
- **Screenshots (1280x800)**:
  - Upload `store-assets/chrome-screenshot-1-overview-1280x800.png`
  - Upload `store-assets/chrome-screenshot-2-quick-palette-1280x800.png`
- **Small Promo Tile (440x280)**: Upload `store-assets/chrome-promo-tile-440x280.png`
- **Marquee Promo Tile (1400x560)**: Upload `store-assets/chrome-marquee-promo-1400x560.png`

---

## 🛡️ Step 4: Privacy Practices Tab (CRITICAL)

Google strictly checks this section before approving extensions. Fill out the fields as follows:

### 1. Single Purpose Declaration
```text
To provide a fast, local-first clipboard and snippet manager that lets users capture, search, and reuse copied text and web content without leaving their workflow.
```

### 2. Permission Justifications
When Google prompts for why each permission is required, paste these exact explanations:

- **`clipboardRead`**:
  ```text
  Required to capture text, code, and links copied by the user into local clipboard history.
  ```

- **`clipboardWrite`**:
  ```text
  Required to paste or copy saved clips and expanded snippets back to the clipboard on user command.
  ```

- **`storage`**:
  ```text
  Used to persist user settings, snippet templates, and local clipboard items in browser local storage and IndexedDB.
  ```

- **`activeTab`**:
  ```text
  Required for user-triggered page actions (e.g. copying clean page text or page URL/title) on the currently active tab.
  ```

- **`scripting`**:
  ```text
  Used to safely execute on-demand text extraction and snippet insertion into active form fields when triggered by the user.
  ```

- **`contextMenus`**:
  ```text
  Provides right-click context menu options to save selected text directly into Pastiq clipboard history.
  ```

- **Host Permissions / Content Scripts (`<all_urls>`)**:
  ```text
  Required to summon the in-page Quick Palette (Ctrl+Shift+Space) and enable snippet auto-expansion (e.g. replacing ";email" in text inputs) across web pages. It includes a sensitive-field shield that strictly ignores password, credit card, and authentication fields.
  ```

### 3. Data Usage Disclosures
- **Does this extension collect personally identifiable information (PII)?**
  Select: **No**
- **Data certifications**:
  - Check ✅ *“I do not sell or transfer user data to third parties, outside of the approved use cases”*
  - Check ✅ *“I do not use or transfer user data for purposes that are unrelated to my item’s single purpose”*
  - Check ✅ *“I do not use or transfer user data to determine creditworthiness or for lending purposes”*

### 4. Privacy Policy URL
```text
https://pratyushkk.github.io/pastiq-website/privacy.html
```

---

## 🌐 Step 5: Distribution Tab

- **Visibility**: `Public`
- **Pricing**: `Free`
- **Regions**: `All regions`

---

## 🚀 Step 6: Submit for Review

1. Click **Save draft**, then review all tabs for green checkmarks.
2. Click **Submit for Review**.
3. Google review typically completes in **24 to 72 hours**. You will receive an automated email from Google as soon as Pastiq is published live on the Chrome Web Store!
