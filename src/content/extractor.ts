import { CopyPageFilterOptions } from '../types';

/**
 * Clean and legitimate visible text extractor.
 * Adheres strictly to browser security boundaries and extracts
 * only visible, user-accessible content while stripping clutter.
 */
export class TextExtractor {
  // Elements that typically contain clutter/chrome rather than main reading text
  private static readonly CLUTTER_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED',
    'SVG', 'CANVAS', 'AUDIO', 'VIDEO', 'NAV', 'HEADER', 'FOOTER',
    'ASIDE', 'DIALOG', 'MENU'
  ]);

  private static readonly CLUTTER_SELECTORS = [
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    '[aria-hidden="true"]',
    '.ad',
    '.ads',
    '.advertisement',
    '.cookie-banner',
    '.cookie-notice',
    '.popup',
    '.modal',
    '.nav',
    '.navbar',
    '.sidebar',
    '.footer'
  ];

  /**
   * Extracts clean page text formatted with headings, lists, and paragraphs.
   */
  public static extractCleanPageText(options: CopyPageFilterOptions): string {
    const root = document.body;
    if (!root) return '';

    // Identify main content container if possible (e.g. <main>, <article>, or fallback to body)
    const mainCandidate = options.stripNav
      ? (document.querySelector('main') || document.querySelector('article') || document.querySelector('[role="main"]') || root)
      : root;

    const buffer: string[] = [];
    this.traverseNode(mainCandidate, buffer, options);

    const result = buffer.join('')
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks to max 2
      .trim();

    return result || (document.title ? `${document.title}\n\n(No visible text found)` : '');
  }

  /**
   * Traverses DOM nodes recursively, extracting visible text while respecting structure.
   */
  private static traverseNode(node: Node, buffer: string[], options: CopyPageFilterOptions): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim().length > 0) {
        // Collapse internal whitespace
        buffer.push(text.replace(/[\t\r\f]+/g, ' '));
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tagName = el.tagName.toUpperCase();

    // Check if element is clutter
    if (options.stripClutter && this.CLUTTER_TAGS.has(tagName)) {
      return;
    }

    // Check visibility
    if (!this.isVisible(el)) {
      return;
    }

    // Check clutter selectors if enabled
    if (options.stripClutter && options.stripNav) {
      for (const selector of this.CLUTTER_SELECTORS) {
        if (el.matches?.(selector)) return;
      }
    }

    const isHeading = options.preserveHeadings && /^H[1-6]$/.test(tagName);
    const isListItem = options.preserveLists && tagName === 'LI';
    const isParagraph = tagName === 'P';
    const isBlock = this.isBlockElement(tagName);

    if (isHeading) {
      const level = parseInt(tagName.charAt(1), 10);
      buffer.push('\n\n' + '#'.repeat(level) + ' ');
    } else if (isParagraph) {
      buffer.push('\n\n');
    } else if (isListItem) {
      buffer.push('\n• ');
    } else if (isBlock) {
      buffer.push('\n');
    }

    // Traverse children
    for (let i = 0; i < el.childNodes.length; i++) {
      this.traverseNode(el.childNodes[i], buffer, options);
    }

    if (isHeading || isParagraph) {
      buffer.push('\n');
    }
  }

  /**
   * Checks if an element is currently rendered and visible.
   */
  private static isVisible(el: HTMLElement): boolean {
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;

    // Fast check for inline styles
    if (el.style) {
      if (el.style.display === 'none' || el.style.visibility === 'hidden' || el.style.opacity === '0') {
        return false;
      }
    }

    // Detailed computed style check
    try {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
        return false;
      }
      // Check geometry
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0 && el.children.length === 0) {
        return false;
      }
    } catch {
      // Fallback
    }

    return true;
  }

  private static isBlockElement(tagName: string): boolean {
    return [
      'DIV', 'P', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'NAV',
      'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'LI', 'TABLE', 'TR', 'FORM'
    ].includes(tagName);
  }

  /**
   * Legitimate extraction of currently selected text or focused element text,
   * even when CSS user-select: none or intercepted event handlers are present.
   */
  public static extractSelectedText(): string {
    // 1. Standard window selection
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      return selection.toString().trim();
    }

    // 2. Selection inside input or textarea
    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
      const start = activeEl.selectionStart;
      const end = activeEl.selectionEnd;
      if (start !== null && end !== null && start !== end) {
        return activeEl.value.substring(start, end).trim();
      }
      if (activeEl.value.trim()) {
        return activeEl.value.trim();
      }
    }

    // 3. Selection in contentEditable
    if (activeEl && (activeEl as HTMLElement).isContentEditable) {
      return (activeEl.textContent || '').trim();
    }

    return '';
  }

  /**
   * Extracts clean text from the currently active or targeted DOM element.
   */
  public static extractCurrentElementText(): string {
    const el = document.activeElement as HTMLElement;
    if (!el || el === document.body || el === document.documentElement) {
      // If no active element, attempt to grab selection or focused container
      return this.extractSelectedText();
    }

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      return el.value.trim();
    }

    const text = el.innerText || el.textContent || '';
    return text.replace(/[\t\r\f]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * Temporarily enables text selection on the page if user-select: none is blocking user.
   */
  public static unlockTextSelection(): void {
    const styleId = 'pastiq-unlock-selection-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        * {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
      `;
      document.head.appendChild(style);
      setTimeout(() => {
        style.remove();
      }, 30000); // Revert after 30 seconds
    }
  }
}
