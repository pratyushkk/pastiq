import { TextExtractor } from './extractor';
import { TextExpander } from './expander';
import type { ClipboardItem, CopyPageFilterOptions } from '../types';

class PastiqContentController {
  private expander: TextExpander;
  private isPaletteOpen = false;
  private paletteContainer: HTMLElement | null = null;
  private lastFocusedElement: HTMLElement | null = null;

  constructor() {
    this.expander = new TextExpander();
    this.initCopyListener();
    this.initMessageListener();
    this.initKeyboardShortcut();
  }

  // 1. Passive event-driven copy capture
  private initCopyListener(): void {
    document.addEventListener('copy', (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (TextExpander.isSensitiveField(activeEl)) {
        // Strict privacy guard: never capture passwords, credit cards, or tokens
        return;
      }

      // Check if text was copied
      setTimeout(async () => {
        let text = '';
        if (window.getSelection()) {
          text = window.getSelection()?.toString().trim() || '';
        }

        // If selection is inside an input/textarea
        if (!text && activeEl instanceof HTMLInputElement && activeEl.type !== 'password') {
          const start = activeEl.selectionStart || 0;
          const end = activeEl.selectionEnd || 0;
          text = activeEl.value.substring(start, end).trim();
        }

        if (text && text.length > 0) {
          this.notifyCaptured(text);
        }
      }, 50);
    }, { capture: true, passive: true });
  }

  private notifyCaptured(text: string, metadata?: any): void {
    try {
      chrome.runtime.sendMessage({
        action: 'CLIPBOARD_CAPTURED',
        payload: {
          content: text,
          sourceUrl: window.location.href,
          sourceDomain: window.location.hostname,
          pageTitle: document.title || window.location.hostname,
          metadata
        }
      });
    } catch {
      // Runtime might be disconnected or not active
    }
  }

  // 2. Message listener for actions from context menus & background
  private initMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.action) {
        case 'FORCE_COPY_SELECTED': {
          TextExtractor.unlockTextSelection();
          const selectedText = TextExtractor.extractSelectedText();
          if (selectedText) {
            navigator.clipboard.writeText(selectedText).then(() => {
              this.notifyCaptured(selectedText);
              this.showToast('Copied Selected Text');
              sendResponse({ success: true, count: selectedText.length });
            }).catch(() => {
              this.showToast('Could not access clipboard', true);
              sendResponse({ success: false });
            });
          } else {
            this.showToast('No text selected', true);
            sendResponse({ success: false, reason: 'empty' });
          }
          return true;
        }

        case 'COPY_PAGE_TEXT': {
          const options: CopyPageFilterOptions = message.payload?.filterOptions || {
            stripNav: true,
            stripClutter: true,
            preserveHeadings: true,
            preserveLists: true
          };

          const cleanText = TextExtractor.extractCleanPageText(options);
          if (cleanText) {
            navigator.clipboard.writeText(cleanText).then(() => {
              this.notifyCaptured(cleanText);
              this.showToast(`Clean Page Text Copied (${cleanText.length} chars)`);
              sendResponse({ success: true, count: cleanText.length });
            }).catch(() => {
              this.showToast('Could not access clipboard', true);
              sendResponse({ success: false });
            });
          } else {
            this.showToast('No readable page text found', true);
            sendResponse({ success: false, reason: 'empty' });
          }
          return true;
        }

        case 'UNLOCK_SELECTION': {
          TextExtractor.unlockTextSelection();
          this.showToast('Text selection enabled');
          sendResponse({ success: true });
          return true;
        }

        case 'COPY_CURRENT_ELEMENT': {
          const elementText = TextExtractor.extractCurrentElementText();
          if (elementText) {
            navigator.clipboard.writeText(elementText).then(() => {
              this.notifyCaptured(elementText);
              this.showToast('Copied Element Text');
              sendResponse({ success: true, count: elementText.length });
            }).catch(() => {
              this.showToast('Could not access clipboard', true);
              sendResponse({ success: false });
            });
          } else {
            this.showToast('No element text found', true);
            sendResponse({ success: false, reason: 'empty' });
          }
          return true;
        }

        case 'COPY_TEXT_DIRECT': {
          if (message.payload?.text) {
            navigator.clipboard.writeText(message.payload.text).then(() => {
              this.showToast('Copied to clipboard');
              sendResponse({ success: true });
            }).catch(() => {
              sendResponse({ success: false });
            });
          }
          return true;
        }

        case 'SETTINGS_CHANGED': {
          if (message.payload) {
            if (typeof message.payload.textExpansionEnabled === 'boolean') {
              this.expander.setEnabled(message.payload.textExpansionEnabled);
            }
            if (message.payload.expansionTrigger) {
              this.expander.setTriggerPrefix(message.payload.expansionTrigger);
            }
            this.expander.refreshSnippets();
          }
          sendResponse({ success: true });
          return true;
        }

        case 'TOGGLE_QUICK_PALETTE': {
          this.toggleQuickPalette();
          sendResponse({ success: true });
          return true;
        }
      }
    });
  }

  // 3. In-page shortcut listener (Ctrl+Shift+Space / Alt+Shift+V)
  private initKeyboardShortcut(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Toggle palette on Ctrl+Shift+Space or Alt+Shift+V
      if ((e.ctrlKey && e.shiftKey && e.code === 'Space') || (e.altKey && e.shiftKey && e.key.toLowerCase() === 'v')) {
        e.preventDefault();
        e.stopPropagation();
        this.toggleQuickPalette();
      } else if (e.key === 'Escape' && this.isPaletteOpen) {
        this.closeQuickPalette();
      }
    }, true);
  }

  // 4. Subtle non-intrusive Toast
  private showToast(message: string, isError = false): void {
    const existing = document.getElementById('pastiq-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'pastiq-toast';
    toast.className = `pastiq-toast ${isError ? 'error' : ''}`;
    toast.innerHTML = `
      <div class="pastiq-toast-dot"></div>
      <span class="pastiq-toast-text">${message}</span>
    `;

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 250);
    }, 2000);
  }

  // 5. In-page Command Palette Overlay
  private toggleQuickPalette(): void {
    if (this.isPaletteOpen) {
      this.closeQuickPalette();
    } else {
      this.openQuickPalette();
    }
  }

  private openQuickPalette(): void {
    if (this.isPaletteOpen) return;
    this.lastFocusedElement = document.activeElement as HTMLElement;

    this.paletteContainer = document.createElement('div');
    this.paletteContainer.id = 'pastiq-palette-overlay';
    this.paletteContainer.innerHTML = `
      <div class="pastiq-palette-backdrop"></div>
      <div class="pastiq-palette-card">
        <div class="pastiq-palette-header">
          <div class="pastiq-palette-brand">
            <img src="${chrome.runtime.getURL('icons/icon32.png')}" width="18" height="18" alt="PASTIQ" style="border-radius: 4px; display: block;" />
            <span>PASTIQ</span>
          </div>
          <span class="pastiq-palette-badge">Instant Paste</span>
        </div>
        <div class="pastiq-palette-search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="pastiq-palette-input" placeholder="Search clipboard & snippets..." autofocus autocomplete="off" />
        </div>
        <div class="pastiq-palette-list" id="pastiq-palette-list">
          <div class="pastiq-palette-loading">Loading items...</div>
        </div>
        <div class="pastiq-palette-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> paste / copy</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.paletteContainer);
    this.isPaletteOpen = true;

    const input = this.paletteContainer.querySelector('#pastiq-palette-input') as HTMLInputElement;
    const listEl = this.paletteContainer.querySelector('#pastiq-palette-list') as HTMLElement;
    const backdrop = this.paletteContainer.querySelector('.pastiq-palette-backdrop') as HTMLElement;

    backdrop.onclick = () => this.closeQuickPalette();

    let items: ClipboardItem[] = [];
    let selectedIndex = 0;

    const renderList = (data: ClipboardItem[]) => {
      items = data;
      selectedIndex = 0;
      if (items.length === 0) {
        listEl.innerHTML = '<div class="pastiq-palette-empty">No matching clipboard items found</div>';
        return;
      }

      listEl.innerHTML = items.map((item, idx) => `
        <div class="pastiq-palette-item ${idx === 0 ? 'selected' : ''}" data-index="${idx}">
          <div class="pastiq-item-type-tag ${item.type}">${item.type}</div>
          <div class="pastiq-item-content">${this.escapeHtml(item.content.slice(0, 140))}</div>
          ${item.pinned ? '<span class="pastiq-pin-indicator">★</span>' : ''}
        </div>
      `).join('');

      // Click to select
      listEl.querySelectorAll('.pastiq-palette-item').forEach(el => {
        el.addEventListener('click', () => {
          const index = parseInt(el.getAttribute('data-index') || '0', 10);
          this.executePasteOrCopy(items[index]);
        });
      });
    };

    const updateSelection = () => {
      const allEls = listEl.querySelectorAll('.pastiq-palette-item');
      allEls.forEach((el, idx) => {
        el.classList.toggle('selected', idx === selectedIndex);
        if (idx === selectedIndex) {
          el.scrollIntoView({ block: 'nearest' });
        }
      });
    };

    // Load initial recent items
    chrome.runtime.sendMessage({ action: 'GET_RECENT_ITEMS', payload: { limit: 15 } }, (res) => {
      if (res && res.items) {
        renderList(res.items);
      } else {
        listEl.innerHTML = '<div class="pastiq-palette-empty">No items in clipboard history</div>';
      }
    });

    // Handle search input debounced
    let searchDebounce: any;
    input.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        const query = input.value.trim();
        chrome.runtime.sendMessage({ action: 'SEARCH_ITEMS', payload: { query, limit: 15 } }, (res) => {
          if (res && res.items) {
            renderList(res.items);
          }
        });
      }, 100);
    });

    // Keyboard navigation inside palette
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length > 0) {
          selectedIndex = (selectedIndex + 1) % items.length;
          updateSelection();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length > 0) {
          selectedIndex = (selectedIndex - 1 + items.length) % items.length;
          updateSelection();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          this.executePasteOrCopy(items[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.closeQuickPalette();
      }
    });

    setTimeout(() => input.focus(), 20);
  }

  private executePasteOrCopy(item: ClipboardItem): void {
    const text = item.content;
    const target = this.lastFocusedElement;
    this.closeQuickPalette();

    // Check if target is an editable input and not sensitive
    if (target && !TextExpander.isSensitiveField(target)) {
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        target.focus();
        const start = target.selectionStart || 0;
        const end = target.selectionEnd || 0;
        const val = target.value;
        target.value = val.substring(0, start) + text + val.substring(end);
        target.selectionStart = target.selectionEnd = start + text.length;
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
        this.showToast('Pasted into active field');
        return;
      } else if (target.isContentEditable) {
        target.focus();
        document.execCommand('insertText', false, text);
        this.showToast('Pasted into active editor');
        return;
      }
    }

    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Copied to clipboard');
    }).catch(() => {
      this.showToast('Failed to copy', true);
    });
  }

  private closeQuickPalette(): void {
    if (this.paletteContainer) {
      this.paletteContainer.remove();
      this.paletteContainer = null;
    }
    this.isPaletteOpen = false;
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Instantiate content controller on web pages
if (typeof window !== 'undefined' && !window.location.protocol.startsWith('chrome')) {
  new PastiqContentController();
}
