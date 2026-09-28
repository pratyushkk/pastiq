# Pastiq Privacy Policy & Security Guarantee

> **"Your clipboard stays on your device."**

Privacy is the foundational design principle of Pastiq. Clipboard data often contains private notes, addresses, code, tokens, or personal messages. Pastiq was engineered from line 1 to be completely offline and local-first.

---

## 1. Zero External Data Transmission
- Pastiq does **not** send clipboard content to any server, cloud provider, or third party.
- V1 contains **zero backend infrastructure, zero cloud database integration, and zero network APIs**.
- Pastiq does **not** include Google Analytics, Mixpanel, Sentry, or any third-party telemetry scripts that could inadvertently intercept clipboard contents.

## 2. 100% Local Storage Architecture
- All clipboard records, snippets, folders, and settings are saved exclusively in your browser's private **IndexedDB** database on your local disk.
- If you uninstall Pastiq or clear your browser site data, your local database is completely wiped with no copy left anywhere else.

## 3. Sensitive Field Shield
Pastiq automatically detects sensitive input fields and **refuses to capture clipboard data or expand snippets** when interacting with:
- `<input type="password">`
- Fields containing password managers or `autocomplete="current-password"` / `autocomplete="new-password"`
- Credit card inputs (`autocomplete="cc-number"`, `autocomplete="cc-csc"`, CVV, CVC)
- Hidden form inputs (`<input type="hidden">`)
- Fields explicitly tagged with `data-sensitive="true"`

## 4. Domain Blocklist (Never Capture)
Users have full control to specify domains where Pastiq should completely deactivate clipboard monitoring. By default, major banking institutions and password manager domains are pre-populated, and you can add any personal or corporate intranet domains at any time in **Settings → Privacy**.

## 5. Legitimate Text Extraction Boundary
The "Copy Text" and "Copy Page Text" features only access content that is already visibly rendered on the page and accessible to your browser session. Pastiq **never**:
- Bypasses paywalls
- Bypasses DRM or copy protection mechanisms
- Circumvents browser authentication or origin security sandboxing
- Accesses private cross-origin iframes that Chrome prevents extensions from accessing

## 6. Future Multi-Device Sync (V2 Preview)
When cloud synchronization is introduced in V2, it will use an **end-to-end zero-knowledge encryption architecture** where keys are derived locally on your device. Plaintext clipboard data will never be stored or visible on any server.
