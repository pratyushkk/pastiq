import { Snippet } from '../types';

/**
 * Lightweight, privacy-first Text Expansion engine.
 * Never runs global scans or MutationObservers.
 * Strictly ignores password, financial, and authentication fields.
 */
export class TextExpander {
  private buffer = '';
  private lastInputTime = 0;
  private readonly BUFFER_TIMEOUT_MS = 2500; // Reset buffer if user paused typing
  private snippets: Snippet[] = [];
  private triggerPrefix = ';';
  private enabled = true;

  constructor() {
    this.initListeners();
    this.refreshSnippets();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public setTriggerPrefix(prefix: string): void {
    this.triggerPrefix = prefix;
  }

  public updateSnippets(snippets: Snippet[]): void {
    this.snippets = snippets;
  }

  public async refreshSnippets(): Promise<void> {
    try {
      chrome.runtime.sendMessage({ action: 'GET_SNIPPETS' }, (response) => {
        if (response && response.snippets) {
          this.snippets = response.snippets;
        }
      });
    } catch {
      // Ignored if runtime not ready
    }
  }

  /**
   * Evaluates whether an element is sensitive (password, card, token, etc.)
   */
  public static isSensitiveField(element: Element | null): boolean {
    if (!element) return false;

    if (element instanceof HTMLInputElement) {
      const type = (element.type || '').toLowerCase();
      if (['password', 'hidden'].includes(type)) return true;

      const autocomplete = (element.autocomplete || '').toLowerCase();
      if (
        autocomplete.includes('password') ||
        autocomplete.includes('cc-') ||
        autocomplete.includes('cvv') ||
        autocomplete.includes('csc') ||
        autocomplete.includes('credit-card') ||
        autocomplete.includes('one-time-code') ||
        autocomplete.includes('pin')
      ) {
        return true;
      }

      const name = (element.name || '').toLowerCase();
      const id = (element.id || '').toLowerCase();
      const sensitiveKeywords = ['pass', 'pwd', 'cvv', 'cvc', 'cardnum', 'secret', 'token', 'auth'];
      if (sensitiveKeywords.some(kw => name.includes(kw) || id.includes(kw))) {
        return true;
      }
    }

    // Check parent or attributes for data-sensitive
    if (element.closest('[data-sensitive="true"], [data-privacy="sensitive"], form[action*="login"] [type="password"]')) {
      return true;
    }

    return false;
  }

  private initListeners(): void {
    // Listen to keydown to track shortcut buffer in active editable elements
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.enabled) return;

      const activeEl = document.activeElement;
      if (!activeEl) return;

      // Ignore sensitive inputs
      if (TextExpander.isSensitiveField(activeEl)) {
        this.buffer = '';
        return;
      }

      const isInput = activeEl instanceof HTMLInputElement && ['text', 'search', 'email', 'url', ''].includes(activeEl.type);
      const isTextArea = activeEl instanceof HTMLTextAreaElement;
      const isEditable = (activeEl as HTMLElement).isContentEditable;

      if (!isInput && !isTextArea && !isEditable) {
        this.buffer = '';
        return;
      }

      // Check buffer timeout
      const now = Date.now();
      if (now - this.lastInputTime > this.BUFFER_TIMEOUT_MS) {
        this.buffer = '';
      }
      this.lastInputTime = now;

      if (e.key === 'Backspace') {
        this.buffer = this.buffer.slice(0, -1);
        return;
      }

      if (e.key === 'Escape' || e.key === 'Enter' || e.key.length > 1) {
        if (e.key !== 'Enter' && e.key !== 'Tab') {
          // Non-printable key, don't clear unless space/enter/esc
          return;
        }
        this.buffer = '';
        return;
      }

      // Append character to buffer
      this.buffer += e.key;

      // Only evaluate if buffer starts with trigger or contains trigger
      if (this.buffer.includes(this.triggerPrefix)) {
        this.checkMatch(activeEl as HTMLElement, e);
      }

      // Keep buffer reasonably small (max 40 chars)
      if (this.buffer.length > 40) {
        this.buffer = this.buffer.slice(-30);
      }
    }, true);
  }

  private checkMatch(target: HTMLElement, event: KeyboardEvent): void {
    // Check if buffer ends with any snippet shortcut
    for (const snippet of this.snippets) {
      const shortcut = snippet.shortcut;
      if (this.buffer.endsWith(shortcut)) {
        // Match found!
        event.preventDefault();
        event.stopPropagation();
        this.performReplacement(target, shortcut, snippet.content);
        this.buffer = '';
        // Notify usage
        try {
          chrome.runtime.sendMessage({ action: 'SNIPPET_USED', payload: { id: snippet.id } });
        } catch {}
        break;
      }
    }
  }

  private performReplacement(target: HTMLElement, shortcut: string, content: string): void {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      const start = target.selectionStart || 0;
      const val = target.value;
      const prefix = val.substring(0, start);
      const suffix = val.substring(target.selectionEnd || start);

      if (prefix.endsWith(shortcut)) {
        const replaceStart = prefix.length - shortcut.length;
        const newVal = prefix.substring(0, replaceStart) + content + suffix;
        target.value = newVal;
        const newCursorPos = replaceStart + content.length;
        target.setSelectionRange(newCursorPos, newCursorPos);
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (target.isContentEditable) {
      // ContentEditable replacement
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const range = selection.getRangeAt(0);

      // Backtrack shortcut length in text node
      if (range.startContainer.nodeType === Node.TEXT_NODE) {
        const nodeText = range.startContainer.textContent || '';
        const offset = range.startOffset;
        const beforeCursor = nodeText.substring(0, offset);

        if (beforeCursor.endsWith(shortcut)) {
          const deleteRange = document.createRange();
          deleteRange.setStart(range.startContainer, offset - shortcut.length);
          deleteRange.setEnd(range.startContainer, offset);
          deleteRange.deleteContents();

          const insertNode = document.createTextNode(content);
          deleteRange.insertNode(insertNode);

          // Move cursor after inserted node
          const newRange = document.createRange();
          newRange.setStartAfter(insertNode);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
  }
}
