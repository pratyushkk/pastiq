import { repository } from '../storage/repository';
import type { Settings, Snippet } from '../types';

class PastiqOptionsController {
  private settings!: Settings;
  private snippets: Snippet[] = [];
  private editingSnippetId: string | null = null;

  // Tabs
  private navItems!: NodeListOf<HTMLElement>;
  private tabPanels!: NodeListOf<HTMLElement>;

  // Elements
  private toastEl!: HTMLElement;
  private storageSizeVal!: HTMLElement;
  private storageMetaVal!: HTMLElement;

  constructor() {
    document.addEventListener('DOMContentLoaded', () => this.init());
  }

  private async init(): Promise<void> {
    this.toastEl = document.getElementById('options-toast') as HTMLElement;
    this.storageSizeVal = document.getElementById('storage-size-val') as HTMLElement;
    this.storageMetaVal = document.getElementById('storage-meta-val') as HTMLElement;
    this.navItems = document.querySelectorAll('.nav-item');
    this.tabPanels = document.querySelectorAll('.tab-panel');

    this.initTabs();
    await this.loadSettings();
    await this.loadSnippets();
    await this.updateStorageStats();
    this.bindEvents();
  }

  private initTabs(): void {
    this.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetTab = item.getAttribute('data-tab');
        this.navItems.forEach(n => n.classList.remove('active'));
        this.tabPanels.forEach(p => p.classList.remove('active'));

        item.classList.add('active');
        const activePanel = document.getElementById(`tab-${targetTab}`);
        if (activePanel) activePanel.classList.add('active');
      });
    });
  }

  private async loadSettings(): Promise<void> {
    this.settings = await repository.getSettings();

    // Populate inputs
    const captureEnabled = document.getElementById('setting-capture-enabled') as HTMLInputElement;
    const historyLimit = document.getElementById('setting-history-limit') as HTMLSelectElement;
    const closeOnCopy = document.getElementById('setting-close-on-copy') as HTMLInputElement;
    const autoCleanup = document.getElementById('setting-auto-cleanup') as HTMLSelectElement;
    const imageCapture = document.getElementById('setting-image-capture') as HTMLInputElement;
    const sensitiveProtect = document.getElementById('setting-sensitive-protect') as HTMLInputElement;
    const expansionEnabled = document.getElementById('setting-expansion-enabled') as HTMLInputElement;
    const expansionTrigger = document.getElementById('setting-expansion-trigger') as HTMLInputElement;
    const extractClutter = document.getElementById('setting-extract-clutter') as HTMLInputElement;
    const extractNav = document.getElementById('setting-extract-nav') as HTMLInputElement;
    const extractHeadings = document.getElementById('setting-extract-headings') as HTMLInputElement;
    const extractLists = document.getElementById('setting-extract-lists') as HTMLInputElement;

    if (captureEnabled) captureEnabled.checked = this.settings.captureEnabled;
    if (historyLimit) historyLimit.value = String(this.settings.historyLimit);
    if (closeOnCopy) closeOnCopy.checked = this.settings.closePopupOnCopy;
    if (autoCleanup) autoCleanup.value = String(this.settings.autoCleanupDays);
    if (imageCapture) imageCapture.checked = this.settings.imageCaptureEnabled;
    if (sensitiveProtect) sensitiveProtect.checked = this.settings.sensitiveProtection;
    if (expansionEnabled) expansionEnabled.checked = this.settings.textExpansionEnabled;
    if (expansionTrigger) expansionTrigger.value = this.settings.expansionTrigger || ';';

    if (extractClutter) extractClutter.checked = this.settings.copyPageFilter.stripClutter;
    if (extractNav) extractNav.checked = this.settings.copyPageFilter.stripNav;
    if (extractHeadings) extractHeadings.checked = this.settings.copyPageFilter.preserveHeadings;
    if (extractLists) extractLists.checked = this.settings.copyPageFilter.preserveLists;

    this.renderDomainTags();
  }

  private renderDomainTags(): void {
    const listEl = document.getElementById('domain-tags-list') as HTMLElement;
    if (!listEl) return;

    listEl.innerHTML = (this.settings.neverCaptureDomains || []).map(domain => `
      <div class="domain-chip">
        <span>${domain}</span>
        <button data-domain="${domain}" class="btn-remove-domain" title="Remove domain">×</button>
      </div>
    `).join('');

    listEl.querySelectorAll('.btn-remove-domain').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const domain = (e.currentTarget as HTMLElement).getAttribute('data-domain');
        if (domain) {
          this.settings.neverCaptureDomains = this.settings.neverCaptureDomains.filter(d => d !== domain);
          this.saveSettings();
          this.renderDomainTags();
        }
      });
    });
  }

  private async saveSettings(): Promise<void> {
    await repository.saveSettings(this.settings);
    this.showToast('Settings saved');
  }

  private bindEvents(): void {
    // Checkbox & input changes
    const bindChange = (id: string, callback: (el: any) => void) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          callback(el);
          this.saveSettings();
        });
      }
    };

    bindChange('setting-capture-enabled', (el: HTMLInputElement) => {
      this.settings.captureEnabled = el.checked;
    });

    bindChange('setting-history-limit', (el: HTMLSelectElement) => {
      this.settings.historyLimit = parseInt(el.value, 10);
    });

    bindChange('setting-close-on-copy', (el: HTMLInputElement) => {
      this.settings.closePopupOnCopy = el.checked;
    });

    bindChange('setting-auto-cleanup', (el: HTMLSelectElement) => {
      this.settings.autoCleanupDays = parseInt(el.value, 10);
    });

    bindChange('setting-image-capture', (el: HTMLInputElement) => {
      this.settings.imageCaptureEnabled = el.checked;
    });

    bindChange('setting-sensitive-protect', (el: HTMLInputElement) => {
      this.settings.sensitiveProtection = el.checked;
    });

    bindChange('setting-expansion-enabled', (el: HTMLInputElement) => {
      this.settings.textExpansionEnabled = el.checked;
    });

    const triggerInput = document.getElementById('setting-expansion-trigger') as HTMLInputElement;
    if (triggerInput) {
      triggerInput.addEventListener('input', () => {
        const val = triggerInput.value.trim() || ';';
        this.settings.expansionTrigger = val;
        this.saveSettings();
      });
    }

    bindChange('setting-extract-clutter', (el: HTMLInputElement) => {
      this.settings.copyPageFilter.stripClutter = el.checked;
    });

    bindChange('setting-extract-nav', (el: HTMLInputElement) => {
      this.settings.copyPageFilter.stripNav = el.checked;
    });

    bindChange('setting-extract-headings', (el: HTMLInputElement) => {
      this.settings.copyPageFilter.preserveHeadings = el.checked;
    });

    bindChange('setting-extract-lists', (el: HTMLInputElement) => {
      this.settings.copyPageFilter.preserveLists = el.checked;
    });

    // Add Domain Blocklist
    const inputNewDomain = document.getElementById('input-new-domain') as HTMLInputElement;
    const btnAddDomain = document.getElementById('btn-add-domain') as HTMLButtonElement;
    if (btnAddDomain && inputNewDomain) {
      const handleAdd = () => {
        let domain = inputNewDomain.value.trim().toLowerCase();
        if (domain) {
          domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
          if (!this.settings.neverCaptureDomains.includes(domain)) {
            this.settings.neverCaptureDomains.push(domain);
            this.saveSettings();
            this.renderDomainTags();
            inputNewDomain.value = '';
          }
        }
      };
      btnAddDomain.addEventListener('click', handleAdd);
      inputNewDomain.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAdd();
      });
    }

    // Clear history buttons
    const btnClearUnpinned = document.getElementById('btn-clear-unpinned');
    if (btnClearUnpinned) {
      btnClearUnpinned.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear unpinned clipboard history? Pinned items will remain saved.')) {
          const count = await repository.clearHistory({ includePinned: false });
          this.showToast(`Cleared ${count} items`);
          await this.updateStorageStats();
        }
      });
    }

    const btnClearAll = document.getElementById('btn-clear-all');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', async () => {
        if (confirm('CAUTION: This will delete ALL clipboard items including pinned items. Proceed?')) {
          const count = await repository.clearHistory({ includePinned: true });
          this.showToast(`Erased all ${count} items`);
          await this.updateStorageStats();
        }
      });
    }

    // Snippet modal events
    const snippetModal = document.getElementById('options-snippet-modal') as HTMLElement;
    const btnOpenCreate = document.getElementById('btn-open-create-snippet');
    const btnCloseSnippet = document.getElementById('btn-close-snippet-dialog');
    const btnCancelSnippet = document.getElementById('btn-cancel-snippet-dialog');
    const btnSaveSnippet = document.getElementById('btn-save-snippet-dialog');

    if (btnOpenCreate) {
      btnOpenCreate.addEventListener('click', () => {
        this.editingSnippetId = null;
        (document.getElementById('modal-title') as HTMLElement).textContent = 'New Snippet';
        (document.getElementById('opt-snippet-name') as HTMLInputElement).value = '';
        (document.getElementById('opt-snippet-shortcut') as HTMLInputElement).value = this.settings.expansionTrigger || ';';
        (document.getElementById('opt-snippet-content') as HTMLTextAreaElement).value = '';
        snippetModal.classList.remove('hidden');
      });
    }

    const closeModal = () => snippetModal.classList.add('hidden');
    if (btnCloseSnippet) btnCloseSnippet.addEventListener('click', closeModal);
    if (btnCancelSnippet) btnCancelSnippet.addEventListener('click', closeModal);

    if (btnSaveSnippet) {
      btnSaveSnippet.addEventListener('click', async () => {
        const name = (document.getElementById('opt-snippet-name') as HTMLInputElement).value.trim();
        let shortcut = (document.getElementById('opt-snippet-shortcut') as HTMLInputElement).value.trim();
        const content = (document.getElementById('opt-snippet-content') as HTMLTextAreaElement).value;

        if (!name || !content) {
          alert('Please enter a snippet name and content.');
          return;
        }

        const trigger = this.settings.expansionTrigger || ';';
        if (!shortcut.startsWith(trigger)) {
          shortcut = trigger + shortcut;
        }

        await repository.saveSnippet({
          id: this.editingSnippetId || undefined,
          name,
          shortcut,
          content
        });

        closeModal();
        await this.loadSnippets();
        await this.updateStorageStats();
        this.showToast('Snippet saved');
      });
    }
  }

  private async loadSnippets(): Promise<void> {
    this.snippets = await repository.getSnippets();
    const tbody = document.getElementById('snippets-table-body');
    if (!tbody) return;

    if (this.snippets.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No snippets created yet.</td></tr>';
      return;
    }

    tbody.innerHTML = this.snippets.map(s => `
      <tr>
        <td><strong>${this.escapeHtml(s.name)}</strong></td>
        <td><span class="snippet-shortcut-tag">${this.escapeHtml(s.shortcut)}</span></td>
        <td class="snippet-content-cell">${this.escapeHtml(s.content)}</td>
        <td>${s.useCount || 0} times</td>
        <td>
          <button class="table-btn edit" data-id="${s.id}">Edit</button>
          <button class="table-btn delete" data-id="${s.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    // Attach edit and delete
    tbody.querySelectorAll('.table-btn.edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const s = this.snippets.find(x => x.id === id);
        if (s) {
          this.editingSnippetId = s.id;
          (document.getElementById('modal-title') as HTMLElement).textContent = 'Edit Snippet';
          (document.getElementById('opt-snippet-name') as HTMLInputElement).value = s.name;
          (document.getElementById('opt-snippet-shortcut') as HTMLInputElement).value = s.shortcut;
          (document.getElementById('opt-snippet-content') as HTMLTextAreaElement).value = s.content;
          document.getElementById('options-snippet-modal')?.classList.remove('hidden');
        }
      });
    });

    tbody.querySelectorAll('.table-btn.delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (id && confirm('Delete this snippet?')) {
          await repository.deleteSnippet(id);
          await this.loadSnippets();
          await this.updateStorageStats();
          this.showToast('Snippet deleted');
        }
      });
    });
  }

  private async updateStorageStats(): Promise<void> {
    const stats = await repository.getStorageStats();
    if (this.storageSizeVal) this.storageSizeVal.textContent = `${stats.approxSizeKB} KB`;
    if (this.storageMetaVal) this.storageMetaVal.textContent = `${stats.totalItems} items (${stats.pinnedItems} pinned)`;
  }

  private showToast(message: string): void {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.add('visible');
    setTimeout(() => {
      this.toastEl.classList.remove('visible');
    }, 1800);
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

new PastiqOptionsController();
