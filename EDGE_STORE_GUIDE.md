# 🚀 Microsoft Edge Add-ons Publishing Guide for Pastiq

This guide contains everything you need to publish **Pastiq** to the **Microsoft Edge Add-ons Store**.

---

## 📁 Pre-Generated Ready-to-Upload Files

All necessary assets and packages have already been generated and are ready on your machine:

1. **Extension Package (ZIP)**:
   - Location: [`release/pastiq-v1.0.0-edge.zip`](file:///C:/Users/PRATYUSH/OneDrive/Desktop/Pastiq/release/pastiq-v1.0.0-edge.zip)
   - Size: ~380 KB (clean production build with Manifest V3 and `manifest.json` at root).

2. **Store Graphics & Screenshots**:
   - **Store Logo (300×300)**: [`store-assets/edge-store-logo-300x300.png`](file:///C:/Users/PRATYUSH/OneDrive/Desktop/Pastiq/store-assets/edge-store-logo-300x300.png)
   - **Small Promo Tile (440×280)**: [`store-assets/edge-promo-tile-440x280.png`](file:///C:/Users/PRATYUSH/OneDrive/Desktop/Pastiq/store-assets/edge-promo-tile-440x280.png)
   - **Large Promo Tile (1400×560)**: [`store-assets/edge-promo-tile-1400x560.png`](file:///C:/Users/PRATYUSH/OneDrive/Desktop/Pastiq/store-assets/edge-promo-tile-1400x560.png)
   - **Screenshot 1 (1280×800)**: [`store-assets/edge-screenshot-1-overview-1280x800.png`](file:///C:/Users/PRATYUSH/OneDrive/Desktop/Pastiq/store-assets/edge-screenshot-1-overview-1280x800.png)
   - **Screenshot 2 (1280×800)**: [`store-assets/edge-screenshot-2-quick-palette-1280x800.png`](file:///C:/Users/PRATYUSH/OneDrive/Desktop/Pastiq/store-assets/edge-screenshot-2-quick-palette-1280x800.png)

---

## ⚡ Step 1: Open Microsoft Partner Center (Free Account)

1. Open your browser and go to:
   👉 **[https://partner.microsoft.com/dashboard/microsoftedge](https://partner.microsoft.com/dashboard/microsoftedge)**
2. Sign in with your Microsoft account (personal or work).
3. If you haven't registered as an Edge extension developer yet:
   - Complete the free developer registration form.
   - **Note:** Registering for Microsoft Edge Add-ons is **100% FREE** (no registration fee).

---

## 📦 Step 2: Create New Extension & Upload Package

1. In the Microsoft Edge Developer Dashboard, click **Create new extension** (or **+ New extension**).
2. Drag and drop the packaged ZIP file:
   ```
   C:\Users\PRATYUSH\OneDrive\Desktop\Pastiq\release\pastiq-v1.0.0-edge.zip
   ```
3. Edge Partner Center will validate the package. Once validated, click **Continue**.

---

## 📝 Step 3: Fill in Store Listing Details

Copy and paste the exact values below into each respective field:

### Basic Information
- **Extension Name**:
  ```text
  Pastiq — Clipboard & Command Center
  ```
- **Version**:
  ```text
  1.0.0
  ```
- **Primary Category**:
  ```text
  Productivity
  ```
- **Secondary Category** (optional):
  ```text
  Search tools
  ```

### Descriptions
- **Summary (Short Description)** *(max 100 characters)*:
  ```text
  Fast, privacy-first clipboard manager, snippet expander, and universal browser command center.
  ```

- **Detailed Description**:
  ```markdown
  Pastiq is a fast, local-first Clipboard Manager, Snippet Tool, and lightweight browser Command Center designed for everyday browsing.

  The core philosophy is simple:
  COPY → SAVE → SEARCH → PASTE → ACT

  🌟 KEY FEATURES:

  1. 🗄️ Smart Clipboard History
  - Automatically saves copied text, links, code, and snippets with zero CPU polling.
  - Pin important items so they never get lost or auto-cleaned.
  - Rich metadata: character count, word count, timestamps, and source domain.

  2. ⚡ Universal Command Center
  - Ranked search combines matching clips, snippets, and commands instantly.
  - Arrow-key navigation: type, jump, copy, and paste without touching your mouse.
  - Power syntax: type /page or /tab to surface context-aware actions.

  3. 📝 Reusable Snippets & Auto-Expansion
  - Save frequently used text (emails, addresses, canned replies, templates).
  - Type registered triggers (e.g. ;email) to expand text directly in form fields.

  4. 🎯 One-Click Page & Tab Actions
  - Clean Copy Page Text: extracts readable article text without ads, cookies, or clutter.
  - Force Copy Selected Text: copies text from difficult or restricted web pages.
  - Quick browser controls: reload tab, duplicate tab, new tab, downloads, and history.

  5. 🚀 In-Page Quick Palette
  - Press Ctrl + Shift + Space on any webpage to open a floating Spotlight-style palette.
  - Paste directly into active form fields without switching tabs.

  🔒 100% LOCAL-FIRST PRIVACY:
  - All clipboard history and snippets are stored locally on your device in IndexedDB.
  - Zero telemetry, zero accounts required, zero external cloud servers for clipboard data.
  - Sensitive Shield: Automatically refuses to monitor or expand on passwords, credit card numbers, or security fields.

  ⌨️ DEFAULT SHORTCUTS:
  - Ctrl + Shift + P: Toggle Pastiq window
  - Ctrl + Shift + Space: Summon In-Page Quick Palette
  - Alt + Shift + C: Clean Copy Page Text
  - Alt + Shift + X: Force Copy Selected Text
  ```

### Links
- **Website URL**:
  ```text
  https://pratyushkk.github.io/pastiq-website/
  ```
- **Privacy Policy URL**:
  ```text
  https://pratyushkk.github.io/pastiq-website/privacy.html
  ```
- **Support Contact URL**:
  ```text
  https://github.com/pratyushkk/pastiq/issues
  ```

---

## 🎨 Step 4: Upload Store Graphics & Screenshots

Upload the prepared image files from [`store-assets/`](file:///C:/Users/PRATYUSH/OneDrive/Desktop/Pastiq/store-assets/):

| Asset Field | File to Upload | Dimensions |
| :--- | :--- | :--- |
| **Extension Store Logo** *(Required)* | `store-assets/edge-store-logo-300x300.png` | 300 × 300 px |
| **Small Promotional Tile** | `store-assets/edge-promo-tile-440x280.png` | 440 × 280 px |
| **Large Promotional Tile** *(Optional)* | `store-assets/edge-promo-tile-1400x560.png` | 1400 × 560 px |
| **Screenshot 1** | `store-assets/edge-screenshot-1-overview-1280x800.png` | 1280 × 800 px |
| **Screenshot 2** | `store-assets/edge-screenshot-2-quick-palette-1280x800.png` | 1280 × 800 px |

---

## 🛡️ Step 5: Notes for Certification (Reviewer Justification)

Microsoft certification reviewers will inspect the permissions declared in `manifest.json`.
Paste the following text into the **Notes for certification** text box to ensure immediate approval without review pushback:

```text
Permission Justifications for Reviewers:

1. "clipboardRead" & "clipboardWrite":
Required for core functionality — capturing text/links copied by the user into local history, and allowing one-click copying or pasting of clips and snippets back to the clipboard.

2. "storage":
Used to persist user settings, snippet templates, and local preferences using standard browser storage (chrome.storage.local and IndexedDB). All data remains strictly local on the device.

3. "activeTab" & "scripting":
Required for user-triggered page actions in the Command Center (e.g. "Clean Copy Page Text", "Copy Page URL/Title", and "Copy Selected Text"). Scripts are only executed when explicitly invoked by the user.

4. "contextMenus":
Used to display right-click context menu options ("Save to Pastiq", "Copy with Pastiq") for fast text capture.

5. Content Script "<all_urls>":
Required to power the in-page Quick Palette (Ctrl+Shift+Space overlay) and snippet text auto-expansion (e.g. replacing ";email" in input fields). It incorporates sensitive-field detection that strictly ignores password, credit card, and security fields.
```

---

## 🚀 Step 6: Review & Submit

1. Verify **Markets**: Ensure **"All markets"** is selected and pricing is set to **Free**.
2. Click **Submit** (or **Publish**).
3. The review process typically takes between **12 to 48 hours**. You will receive an automated email from Microsoft once Pastiq is live on the Microsoft Edge Add-ons store!
