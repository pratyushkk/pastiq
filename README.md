# Pastiq — Premium Local-First Clipboard + Lightweight Command Center

> **COPY → SAVE → SEARCH → PASTE → ACT**

Pastiq is a production-quality, local-first **Clipboard Manager, Snippet Tool, and lightweight browser Command Center** designed for everyday use in Google Chrome (Manifest V3).

It combines three closely related workflows into one unified, blazing-fast search experience:
1. **Clipboard**: Store and instantly retrieve anything you copy.
2. **Snippets**: Reusable text with safe in-page auto-expansion (`;email`, `;github`, `;addr`).
3. **Command Center**: Run browser actions (`new tab`, `reload`, `close tab`, `history`, `downloads`) and page actions (`copy selected`, `copy page text`, `copy element`, `copy URL`, `copy title`, `save page`) directly from the search bar.

---

## 🌐 Official Website & Links

- **Live Website**: [https://pratyushkk.github.io/pastiq-website/](https://pratyushkk.github.io/pastiq-website/)
- **Website Repository**: [pratyushkk/pastiq-website](https://github.com/pratyushkk/pastiq-website)
- **Privacy Policy**: [https://pratyushkk.github.io/pastiq-website/privacy.html](https://pratyushkk.github.io/pastiq-website/privacy.html)

---

## 🌟 Core Philosophy & Design

- **Unified Command Center**: The search bar intelligently displays matching **Clips**, **Snippets**, and **Commands** simultaneously.
- **Slate Visual Identity**: Dark, premium, professional, and understated. Built with centralized CSS design tokens (`#11161C`, `#151B22`, `#1A2129`, `#60A5FA`).
- **Zero Friction**: Standard search works instantly without needing to memorize commands or syntax.
- **Power Syntax (Optional)**: Type `/page` to show page actions or `/tab` to show tab commands.
- **100% Local-First Privacy**: IndexedDB local storage. Zero accounts, zero external servers, zero clipboard telemetry.

---

## 🚀 Key Features

### 1. 🗄️ Clipboard History
- **Automatic Event-Driven Capture**: Automatically saves copied text, links, code, and images without polling loops or CPU overhead.
- **Rich Data Model**: Stores character count, word count, timestamps, source domain, page title, pinned status, and content type.
- **IndexedDB Multi-Store**: Isolated local database with indexes on `createdAt`, `lastUsedAt`, `pinned`, `type`, and `domain`.
- **Configurable History Limits**: 100, 500 (default), 1,000, 5,000, or unlimited. Pinned items are never deleted by cleanup.

### 2. ⚡ Universal Command Center & Ranked Search
- Search field focuses automatically upon launch.
- Typing `github` shows:
  - **CLIPS**: Matching saved clips from GitHub
  - **SNIPPETS**: Saved `;github` snippet
  - **COMMANDS**: "Open GitHub", "Search Google for 'github'", "Copy current page URL", "Copy current page title"
- Full keyboard navigation:
  - <kbd>↑</kbd> / <kbd>↓</kbd> Navigate items across any section
  - <kbd>Enter</kbd> Copy / Paste / Execute
  - <kbd>Delete</kbd> Delete highlighted clip
  - <kbd>Esc</kbd> Close popup

### 3. 🎯 Page & Browser Actions
- **Page Actions**:
  - `Copy selected text`: Copies selection even when ordinary selection is restricted.
  - `Copy visible page text`: Clean article text stripping scripts, ads, and navigation clutter while preserving headings (`#`) and lists (`•`).
  - `Copy current element`: Extracts text from the active or focused element.
  - `Copy page URL` and `Copy page title`: Instant extraction to clipboard.
  - `Save page`: Saves page title & link into Pastiq clipboard history.
- **Browser Actions**:
  - Open new tab, Duplicate tab, Reload page, Close current tab.
  - Open Downloads, History, Extensions, Settings.

### 4. 📝 Snippets & Safe Text Expansion
- Save frequently typed responses, links, or templates.
- **In-Page Expansion**: Type registered shortcuts (e.g. `;email`) in non-sensitive text fields to expand saved text.
- **Strict Sensitive Shield**: Automatically refuses to monitor or expand on `password`, `credit-card`, `cvv`, `auth token`, or hidden inputs.

### 5. 🚀 In-Page Quick Palette
- Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Space</kbd> on **any webpage** to open a floating Spotlight-style palette.
- Search and paste items directly into active form fields without switching tabs.

### 6. 🔒 Context Menus
- **Selected text**:
  - `Pastiq: Save to Pastiq`
  - `Pastiq: Copy with Pastiq`
  - `Pastiq: Create snippet`
- **Page**:
  - `Pastiq: Save page`
  - `Pastiq: Copy page URL`
  - `Pastiq: Copy page title`
  - `Pastiq: Copy page text`

### 7. ☁️ Sync (Coming Soon)
- Clearly showcased as **"Coming Soon in V2"** in the UI.
- Built on a clean `ClipboardRepository` interface to allow future zero-knowledge encrypted multi-device sync without refactoring the UI.

---

## 🎨 Slate Design Tokens

```css
--bg-primary: #11161C;
--bg-secondary: #151B22;

--surface: #1A2129;
--surface-elevated: #222B35;
--surface-hover: #28333E;
--surface-active: #303C48;

--border-subtle: #28323C;
--border-default: #34404C;
--border-strong: #465361;

--text-primary: #F1F5F9;
--text-secondary: #CBD5E1;
--text-muted: #94A3B8;
--text-disabled: #64748B;

--accent: #60A5FA;
--accent-hover: #3B82F6;
--accent-soft: rgba(96,165,250,0.12);
--accent-border: rgba(96,165,250,0.35);

--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 10px;
--radius-xl: 12px;
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> | Browser | Open Pastiq Popup window |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Space</kbd> | Any Webpage | Summon floating in-page Quick Palette |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>⌘K</kbd> | Inside Popup | Jump to and focus search bar |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd> | Active Tab | Clean Copy Visible Page Text |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> | Active Tab | Force Copy Selected Text (Difficult Pages) |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Palette / Popup | Navigate results across all sections |
| <kbd>Enter</kbd> | Palette / Popup | Copy, paste, or execute command |
| <kbd>Delete</kbd> | Palette / Popup | Delete highlighted clip |
| <kbd>Esc</kbd> | Palette / Popup | Close palette / popup |
| <kbd>;</kbd> + `<shortcut>` | Text Fields | Auto-expand snippet (e.g. `;email`) |

---

## 📦 Installation in Google Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button.
4. Select the **`dist`** directory inside this folder:
   ```
   C:\Users\PRATYUSH\OneDrive\Desktop\Pastiq\dist
   ```
5. Pin **Pastiq** from your Chrome extensions menu for instant access!

---

## 🛠️ Build & Verification Commands

```bash
# Compile and bundle to dist/
npm run build

# Start watch mode for real-time development
npm run watch

# Run test suite (ranking, privacy, extraction, command filtering)
npm test

# Regenerate PNG icons
npm run generate-icons
```
