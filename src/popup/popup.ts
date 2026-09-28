import { repository } from '../storage/repository';
import type { ClipboardItem, SearchFilter, Settings, Snippet } from '../types';
import { getMatchingCommands, STATIC_COMMANDS, CommandItem } from '../commands/index';

type ActiveTabType = 'clips' | 'snippets' | 'commands';

interface SelectableItem {
  id: string;
  kind: 'clip' | 'snippet' | 'command';
  data: ClipboardItem | Snippet | CommandItem;
}

class PastiqPopupController {
  private activeTab: chrome.tabs.Tab | null = null;
  private settings: Settings | null = null;
  private currentNavTab: ActiveTabType = 'clips';
  private searchQuery = '';
  private searchDebounceTimer: any = null;

  // Flattened list of selectable elements for keyboard navigation
  private selectableItems: SelectableItem[] = [];
  private selectedIndex = 0;

  // Data cache
  private clips: ClipboardItem[] = [];
  private snippets: Snippet[] = [];

  // DOM Elements
  private searchInput!: HTMLInputElement;
  private clearSearchBtn!: HTMLButtonElement;
  private kbdHint!: HTMLElement;
  private resultsContainer!: HTMLElement;
  private emptyStateView!: HTMLElement;
  private toastPill!: HTMLElement;
  private toastText!: HTMLElement;
  private footerCount!: HTMLElement;
  private statusDot!: HTMLElement;
  private btnToggleCapture!: HTMLButtonElement;
  private btnOpenSettings!: HTMLButtonElement;
  private inlineCreator!: HTMLElement;
  private btnCloseCreator!: HTMLButtonElement;
  private btnSaveNewSnippet!: HTMLButtonElement;
  private crSnippetName!: HTMLInputElement;
  private crSnippetShortcut!: HTMLInputElement;
  private crSnippetContent!: HTMLTextAreaElement;

  constructor() {
    document.addEventListener('DOMContentLoaded', () => this.init());
  }

  private async init(): Promise<void> {
    this.bindElements();
    this.bindEvents();
    this.detectOsKbdHint();

    // Query active tab once
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.activeTab = tab || null;
    } catch {
      this.activeTab = null;
    }

    await this.loadSettings();
    await this.refreshDataAndRender();
    this.searchInput.focus();
  }

  private detectOsKbdHint(): void {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    if (this.kbdHint) {
      this.kbdHint.textContent = isMac ? '⌘K' : 'Ctrl K';
    }
  }

  private bindElements(): void {
    this.searchInput = document.getElementById('search-input') as HTMLInputElement;
    this.clearSearchBtn = document.getElementById('btn-clear-search') as HTMLButtonElement;
    this.kbdHint = document.getElementById('kbd-shortcut-hint') as HTMLElement;
    this.resultsContainer = document.getElementById('unified-results-container') as HTMLElement;
    this.emptyStateView = document.getElementById('empty-state-view') as HTMLElement;
    this.toastPill = document.getElementById('toast-pill') as HTMLElement;
    this.toastText = document.getElementById('toast-text') as HTMLElement;
    this.footerCount = document.getElementById('footer-count') as HTMLElement;
    this.statusDot = document.querySelector('.status-dot') as HTMLElement;
    this.btnToggleCapture = document.getElementById('btn-toggle-capture') as HTMLButtonElement;
    this.btnOpenSettings = document.getElementById('btn-open-settings') as HTMLButtonElement;

    // Inline Snippet Creator
    this.inlineCreator = document.getElementById('inline-snippet-creator') as HTMLElement;
    this.btnCloseCreator = document.getElementById('btn-close-creator') as HTMLButtonElement;
    this.btnSaveNewSnippet = document.getElementById('btn-save-new-snippet') as HTMLButtonElement;
    this.crSnippetName = document.getElementById('cr-snippet-name') as HTMLInputElement;
    this.crSnippetShortcut = document.getElementById('cr-snippet-shortcut') as HTMLInputElement;
    this.crSnippetContent = document.getElementById('cr-snippet-content') as HTMLTextAreaElement;
  }

  private bindEvents(): void {
    // Search input
    this.searchInput.addEventListener('input', () => {
      this.searchQuery = this.searchInput.value;
      const hasQuery = this.searchQuery.trim().length > 0;
      this.clearSearchBtn.classList.toggle('visible', hasQuery);
      if (this.kbdHint) this.kbdHint.style.display = hasQuery ? 'none' : 'block';

      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => this.render(), 60);
    });

    this.clearSearchBtn.addEventListener('click', () => {
      this.searchInput.value = '';
      this.searchQuery = '';
      this.clearSearchBtn.classList.remove('visible');
      if (this.kbdHint) this.kbdHint.style.display = 'block';
      this.render();
      this.searchInput.focus();
    });

    // Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach(tabBtn => {
      tabBtn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
        const target = e.currentTarget as HTMLElement;
        target.classList.add('active');
        this.currentNavTab = target.getAttribute('data-tab') as ActiveTabType;
        this.render();
      });
    });

    // Header buttons
    this.btnToggleCapture.addEventListener('click', () => this.toggleCapture());
    this.btnOpenSettings.addEventListener('click', () => chrome.runtime.openOptionsPage());

    // Inline Creator
    this.btnCloseCreator.addEventListener('click', () => this.closeInlineCreator());
    this.btnSaveNewSnippet.addEventListener('click', () => this.saveInlineSnippet());

    // Keyboard navigation
    document.addEventListener('keydown', (e: KeyboardEvent) => this.handleKeyDown(e));

    // Sync coming soon tooltip/toast
    document.querySelector('.sync-tag')?.addEventListener('click', () => {
      this.showToast('Encrypted multi-device sync is planned for V2!');
    });
  }

  private async loadSettings(): Promise<void> {
    this.settings = await repository.getSettings();
    this.updateCaptureStatusUI();
  }

  private updateCaptureStatusUI(): void {
    if (!this.settings) return;
    const isPaused = !this.settings.captureEnabled;
    this.statusDot.classList.toggle('paused', isPaused);
    this.btnToggleCapture.title = isPaused ? 'Capture Paused (Click to resume)' : 'Capture Active (Click to pause)';
  }

  private async toggleCapture(): Promise<void> {
    if (!this.settings) return;
    const nextStatus = !this.settings.captureEnabled;
    this.settings.captureEnabled = nextStatus;
    await repository.saveSettings({ captureEnabled: nextStatus });
    this.updateCaptureStatusUI();
    this.showToast(nextStatus ? 'Capture Resumed' : 'Capture Paused');
  }

  private async refreshDataAndRender(): Promise<void> {
    const [clipsResult, snippets] = await Promise.all([
      repository.getItems({ limit: 100 }),
      repository.getSnippets()
    ]);
    this.clips = clipsResult.items;
    this.snippets = snippets;
    this.render();
  }

  private render(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.selectableItems = [];

    // Branch 1: Unified Command Center Search (when query is present)
    if (q) {
      this.renderUnifiedSearch(q);
      return;
    }

    // Branch 2: Default Tab Views (when query is empty)
    if (this.currentNavTab === 'clips') {
      this.renderDefaultClipsView();
    } else if (this.currentNavTab === 'snippets') {
      this.renderDefaultSnippetsView();
    } else if (this.currentNavTab === 'commands') {
      this.renderDefaultCommandsView();
    }

    this.updateFooterCount();
    this.updateSelectionHighlight();
  }

  // --- RENDERING VIEWS ---

  private renderUnifiedSearch(query: string): void {
    const filteredClips = this.filterClips(query);
    const filteredSnippets = this.filterSnippets(query);
    const matchingCommands = getMatchingCommands(query, this.activeTab || undefined);

    const hasAnyResults = filteredClips.length > 0 || filteredSnippets.length > 0 || matchingCommands.length > 0;
    this.emptyStateView.classList.toggle('hidden', hasAnyResults);

    let html = '';

    // 1. Clips Section
    if (filteredClips.length > 0) {
      html += `
        <section class="results-section">
          <div class="section-header">
            <span class="section-title">📌 Clips (${filteredClips.length})</span>
          </div>
          <div class="items-group">
            ${filteredClips.slice(0, 10).map(clip => {
              const globalIdx = this.selectableItems.length;
              this.selectableItems.push({ id: clip.id, kind: 'clip', data: clip });
              return this.renderClipItemHtml(clip, globalIdx);
            }).join('')}
          </div>
        </section>
      `;
    }

    // 2. Snippets Section
    if (filteredSnippets.length > 0) {
      html += `
        <section class="results-section">
          <div class="section-header">
            <span class="section-title">▣ Snippets (${filteredSnippets.length})</span>
          </div>
          <div class="items-group">
            ${filteredSnippets.slice(0, 8).map(snip => {
              const globalIdx = this.selectableItems.length;
              this.selectableItems.push({ id: snip.id, kind: 'snippet', data: snip });
              return this.renderSnippetItemHtml(snip, globalIdx);
            }).join('')}
          </div>
        </section>
      `;
    }

    // 3. Commands Section
    if (matchingCommands.length > 0) {
      html += `
        <section class="results-section">
          <div class="section-header">
            <span class="section-title">⚙ Commands (${matchingCommands.length})</span>
          </div>
          <div class="items-group">
            ${matchingCommands.map(cmd => {
              const globalIdx = this.selectableItems.length;
              this.selectableItems.push({ id: cmd.id, kind: 'command', data: cmd });
              return this.renderCommandItemHtml(cmd, globalIdx);
            }).join('')}
          </div>
        </section>
      `;
    }

    this.resultsContainer.innerHTML = html;
    this.bindItemClickListeners();
    this.selectedIndex = 0;
  }

  private renderDefaultClipsView(): void {
    const pinnedClips = this.clips.filter(c => c.pinned);
    const recentClips = this.clips.filter(c => !c.pinned);

    if (this.clips.length === 0) {
      this.resultsContainer.innerHTML = '';
      this.emptyStateView.classList.remove('hidden');
      return;
    }

    this.emptyStateView.classList.add('hidden');
    let html = '';

    // Pinned group
    if (pinnedClips.length > 0) {
      html += `
        <section class="results-section">
          <div class="section-header">
            <span class="section-title">📌 Pinned</span>
            <button class="section-action-btn" id="btn-see-all-pinned">See all</button>
          </div>
          <div class="items-group">
            ${pinnedClips.slice(0, 5).map(clip => {
              const globalIdx = this.selectableItems.length;
              this.selectableItems.push({ id: clip.id, kind: 'clip', data: clip });
              return this.renderClipItemHtml(clip, globalIdx);
            }).join('')}
          </div>
        </section>
      `;
    }

    // Recent group
    if (recentClips.length > 0) {
      html += `
        <section class="results-section">
          <div class="section-header">
            <span class="section-title">⚡ Recent</span>
          </div>
          <div class="items-group">
            ${recentClips.slice(0, 30).map(clip => {
              const globalIdx = this.selectableItems.length;
              this.selectableItems.push({ id: clip.id, kind: 'clip', data: clip });
              return this.renderClipItemHtml(clip, globalIdx);
            }).join('')}
          </div>
        </section>
      `;
    }

    this.resultsContainer.innerHTML = html;
    this.bindItemClickListeners();
    this.selectedIndex = 0;
  }

  private renderDefaultSnippetsView(): void {
    if (this.snippets.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="empty-state">
          <p class="empty-headline">No snippets created</p>
          <p class="empty-subtext">Click below to create your first reusable text shortcut.</p>
          <button id="btn-open-creator-empty" class="btn-primary-sm" style="margin-top: 10px;">+ New Snippet</button>
        </div>
      `;
      this.emptyStateView.classList.add('hidden');
      document.getElementById('btn-open-creator-empty')?.addEventListener('click', () => this.openInlineCreator());
      return;
    }

    this.emptyStateView.classList.add('hidden');
    const html = `
      <section class="results-section">
        <div class="section-header">
          <span class="section-title">▣ Saved Snippets (${this.snippets.length})</span>
          <button class="section-action-btn" id="btn-open-creator-tab">+ Add</button>
        </div>
        <div class="items-group">
          ${this.snippets.map(snip => {
            const globalIdx = this.selectableItems.length;
            this.selectableItems.push({ id: snip.id, kind: 'snippet', data: snip });
            return this.renderSnippetItemHtml(snip, globalIdx);
          }).join('')}
        </div>
      </section>
    `;

    this.resultsContainer.innerHTML = html;
    document.getElementById('btn-open-creator-tab')?.addEventListener('click', () => this.openInlineCreator());
    this.bindItemClickListeners();
    this.selectedIndex = 0;
  }

  private renderDefaultCommandsView(): void {
    this.emptyStateView.classList.add('hidden');
    const pageCommands = STATIC_COMMANDS.filter(c => c.category === 'page');
    const browserCommands = STATIC_COMMANDS.filter(c => c.category === 'browser' || c.category === 'clipboard');

    const html = `
      <section class="results-section">
        <div class="section-header">
          <span class="section-title">PAGE ACTIONS</span>
        </div>
        <div class="items-group">
          ${pageCommands.map(cmd => {
            const globalIdx = this.selectableItems.length;
            this.selectableItems.push({ id: cmd.id, kind: 'command', data: cmd });
            return this.renderCommandItemHtml(cmd, globalIdx);
          }).join('')}
        </div>
      </section>

      <section class="results-section">
        <div class="section-header">
          <span class="section-title">BROWSER ACTIONS</span>
        </div>
        <div class="items-group">
          ${browserCommands.map(cmd => {
            const globalIdx = this.selectableItems.length;
            this.selectableItems.push({ id: cmd.id, kind: 'command', data: cmd });
            return this.renderCommandItemHtml(cmd, globalIdx);
          }).join('')}
        </div>
      </section>
    `;

    this.resultsContainer.innerHTML = html;
    this.bindItemClickListeners();
    this.selectedIndex = 0;
  }

  // --- ITEM HTML BUILDERS ---

  private renderClipItemHtml(clip: ClipboardItem, globalIdx: number): string {
    const isImage = clip.type === 'image';
    const isCode = clip.type === 'code';
    const domain = clip.sourceDomain || (clip.sourceUrl ? new URL(clip.sourceUrl).hostname : '');
    const timeAgo = this.formatRelativeTime(clip.lastUsedAt || clip.createdAt);

    let bodyHtml = '';
    if (isImage) {
      bodyHtml = `<img src="${clip.content}" class="item-thumbnail" alt="Screenshot" loading="lazy" />`;
    } else {
      bodyHtml = `<div class="item-text-body ${isCode ? 'is-code' : ''}">${this.escapeHtml(clip.content.slice(0, 180))}</div>`;
    }

    return `
      <div class="result-item" data-index="${globalIdx}" data-id="${clip.id}">
        <div class="item-leading-icon">
          ${this.getLeadingIconSvg(clip.type)}
        </div>
        <div class="item-core">
          <div class="item-row-top">
            <span class="item-title">${this.getDisplayTitle(clip)}</span>
            <span class="item-tag ${clip.type}">${clip.type}</span>
          </div>
          ${bodyHtml}
          <div class="item-meta-row">
            ${domain ? `<span>${domain}</span> • ` : ''}
            <span>${timeAgo}</span>
          </div>
        </div>
        <div class="item-trailing-action">
          <span class="action-pill">Copy</span>
          <div class="item-quick-btns">
            <button class="btn-item-action btn-pin ${clip.pinned ? 'pinned' : ''}" title="${clip.pinned ? 'Unpin' : 'Pin'}">
              ${clip.pinned ? '★' : '☆'}
            </button>
            <button class="btn-item-action btn-del" title="Delete">×</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderSnippetItemHtml(snippet: Snippet, globalIdx: number): string {
    return `
      <div class="result-item" data-index="${globalIdx}" data-id="${snippet.id}">
        <div class="item-leading-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="9"></line>
            <line x1="9" y1="13" x2="15" y2="13"></line>
            <line x1="9" y1="17" x2="11" y2="17"></line>
          </svg>
        </div>
        <div class="item-core">
          <div class="item-row-top">
            <span class="item-title">${this.escapeHtml(snippet.name)}</span>
            <span class="item-snippet-shortcut">${this.escapeHtml(snippet.shortcut)}</span>
          </div>
          <div class="item-text-body">${this.escapeHtml(snippet.content.slice(0, 120))}</div>
        </div>
        <div class="item-trailing-action">
          <span class="action-pill">Paste</span>
        </div>
      </div>
    `;
  }

  private renderCommandItemHtml(cmd: CommandItem, globalIdx: number): string {
    return `
      <div class="result-item" data-index="${globalIdx}" data-id="${cmd.id}">
        <div class="item-leading-icon">
          ${this.getCommandIconSvg(cmd.icon)}
        </div>
        <div class="item-core">
          <div class="item-row-top">
            <span class="item-title">${this.escapeHtml(cmd.title)}</span>
          </div>
          <div class="item-text-body">${this.escapeHtml(cmd.description)}</div>
        </div>
        <div class="item-trailing-action">
          <span class="action-pill">${cmd.actionLabel}</span>
        </div>
      </div>
    `;
  }

  // --- FILTERS & SEARCH RANKING ---

  private filterClips(query: string): ClipboardItem[] {
    const q = query.trim().toLowerCase();
    return this.clips.filter(clip => {
      const text = clip.content.toLowerCase();
      const domain = (clip.sourceDomain || '').toLowerCase();
      const title = (clip.pageTitle || '').toLowerCase();
      return text.includes(q) || domain.includes(q) || title.includes(q);
    });
  }

  private filterSnippets(query: string): Snippet[] {
    const q = query.trim().toLowerCase();
    return this.snippets.filter(s => {
      return s.name.toLowerCase().includes(q) ||
        s.shortcut.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q);
    });
  }

  // --- KEYBOARD & SELECTION DISPATCH ---

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.inlineCreator && !this.inlineCreator.classList.contains('hidden')) {
      if (e.key === 'Escape') this.closeInlineCreator();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.selectableItems.length > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % this.selectableItems.length;
        this.updateSelectionHighlight();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.selectableItems.length > 0) {
        this.selectedIndex = (this.selectedIndex - 1 + this.selectableItems.length) % this.selectableItems.length;
        this.updateSelectionHighlight();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.selectableItems[this.selectedIndex]) {
        this.executeItem(this.selectableItems[this.selectedIndex]);
      }
    } else if (e.key === 'Delete') {
      const active = this.selectableItems[this.selectedIndex];
      if (active && active.kind === 'clip') {
        e.preventDefault();
        repository.deleteItem(active.id).then(() => {
          this.clips = this.clips.filter(c => c.id !== active.id);
          this.render();
          this.showToast('Clip deleted');
        });
      } else if (active && active.kind === 'snippet') {
        e.preventDefault();
        repository.deleteSnippet(active.id).then(() => {
          this.snippets = this.snippets.filter(s => s.id !== active.id);
          this.render();
          this.showToast('Snippet deleted');
        });
      }
    } else if (e.key === 'Escape') {
      window.close();
    }
  }

  private updateSelectionHighlight(): void {
    const allEls = this.resultsContainer.querySelectorAll('.result-item');
    allEls.forEach((el, idx) => {
      const isSelected = idx === this.selectedIndex;
      el.classList.toggle('selected', isSelected);
      if (isSelected) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  private bindItemClickListeners(): void {
    this.resultsContainer.querySelectorAll('.result-item').forEach(el => {
      const idx = parseInt(el.getAttribute('data-index') || '0', 10);
      const id = el.getAttribute('data-id');

      // Click to execute
      el.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.btn-item-action')) return;
        this.selectedIndex = idx;
        this.updateSelectionHighlight();
        this.executeItem(this.selectableItems[idx]);
      });

      // Pin button on clips
      el.querySelector('.btn-pin')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (id) {
          const newPinned = await repository.togglePin(id);
          const target = this.clips.find(c => c.id === id);
          if (target) target.pinned = newPinned;
          this.render();
        }
      });

      // Delete button on clips
      el.querySelector('.btn-del')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (id) {
          await repository.deleteItem(id);
          this.clips = this.clips.filter(c => c.id !== id);
          this.render();
          this.showToast('Clip deleted');
        }
      });
    });
  }

  private async executeItem(item: SelectableItem): Promise<void> {
    if (!item) return;

    if (item.kind === 'clip') {
      const clip = item.data as ClipboardItem;
      try {
        if (clip.type === 'image' && clip.content.startsWith('data:image/')) {
          const res = await fetch(clip.content);
          const blob = await res.blob();
          await navigator.clipboard.write([new window.ClipboardItem({ [blob.type]: blob })]);
        } else {
          await navigator.clipboard.writeText(clip.content);
        }
        await repository.touchItem(clip.id);
        this.showToast('Copied to clipboard');
        if (this.settings?.closePopupOnCopy) {
          setTimeout(() => window.close(), 180);
        }
      } catch {
        navigator.clipboard.writeText(clip.content).then(() => {
          this.showToast('Copied');
          if (this.settings?.closePopupOnCopy) setTimeout(() => window.close(), 180);
        });
      }
    } else if (item.kind === 'snippet') {
      const snippet = item.data as Snippet;
      await navigator.clipboard.writeText(snippet.content);
      await repository.incrementSnippetUsage(snippet.id);
      this.showToast('Snippet copied');
      if (this.settings?.closePopupOnCopy) {
        setTimeout(() => window.close(), 180);
      }
    } else if (item.kind === 'command') {
      const cmd = item.data as CommandItem;
      const res = await cmd.execute({
        activeTab: this.activeTab || undefined,
        query: this.searchQuery
      });
      this.showToast(res.message);
      if (res.success && ['cmd_new_tab', 'cmd_close_tab', 'cmd_open_downloads', 'cmd_open_history', 'cmd_open_extensions'].includes(cmd.id)) {
        setTimeout(() => window.close(), 180);
      }
    }
  }

  // --- INLINE SNIPPET CREATOR ---

  private openInlineCreator(): void {
    this.inlineCreator.classList.remove('hidden');
    this.crSnippetName.value = '';
    this.crSnippetShortcut.value = ';';
    this.crSnippetContent.value = '';
    this.crSnippetName.focus();
  }

  private closeInlineCreator(): void {
    this.inlineCreator.classList.add('hidden');
    this.searchInput.focus();
  }

  private async saveInlineSnippet(): Promise<void> {
    const name = this.crSnippetName.value.trim();
    let shortcut = this.crSnippetShortcut.value.trim();
    const content = this.crSnippetContent.value;

    if (!name || !content) {
      this.showToast('Name and content are required');
      return;
    }

    if (!shortcut.startsWith(';')) {
      shortcut = ';' + shortcut;
    }

    await repository.saveSnippet({ name, shortcut, content });
    this.closeInlineCreator();
    await this.refreshDataAndRender();
    this.showToast(`Snippet "${shortcut}" saved`);
  }

  // --- UTILS ---

  private updateFooterCount(): void {
    const count = this.selectableItems.length;
    this.footerCount.textContent = `${count} ${count === 1 ? 'result' : 'results'}`;
  }

  private showToast(msg: string): void {
    this.toastText.textContent = msg;
    this.toastPill.classList.add('visible');
    setTimeout(() => {
      this.toastPill.classList.remove('visible');
    }, 1600);
  }

  private getDisplayTitle(clip: ClipboardItem): string {
    if (clip.pageTitle) return clip.pageTitle;
    if (clip.type === 'url') return clip.content.replace(/^https?:\/\//, '').split('/')[0];
    const preview = clip.content.trim().slice(0, 32).replace(/\n/g, ' ');
    return preview || 'Clipboard text';
  }

  private formatRelativeTime(timestamp: number): string {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  private getLeadingIconSvg(type: string): string {
    switch (type) {
      case 'url':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
      case 'code':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
      case 'image':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
      default:
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
    }
  }

  private getCommandIconSvg(icon: string): string {
    switch (icon) {
      case 'text':
      case 'element':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      case 'page':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><line x1="16" y1="13" x2="8" y2="13"></line></svg>`;
      case 'link':
      case 'url':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
      case 'reload':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`;
      case 'close':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      case 'plus':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
      case 'search':
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
      default:
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
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

new PastiqPopupController();
