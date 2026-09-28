import {
  ClipboardItem,
  ContentType,
  Folder,
  SearchFilter,
  SearchResult,
  Settings,
  Snippet,
  StorageStats
} from '../types';
import { getDB, STORES, DEFAULT_SETTINGS } from './db';

export interface ClipboardRepository {
  getItems(filter?: SearchFilter): Promise<SearchResult>;
  getItemById(id: string): Promise<ClipboardItem | null>;
  saveItem(item: Partial<ClipboardItem> & { content: string }): Promise<ClipboardItem>;
  updateItem(id: string, updates: Partial<ClipboardItem>): Promise<ClipboardItem | null>;
  deleteItem(id: string): Promise<boolean>;
  clearHistory(options?: { olderThanDays?: number; includePinned?: boolean }): Promise<number>;
  togglePin(id: string): Promise<boolean>;
  touchItem(id: string): Promise<void>;

  getSnippets(): Promise<Snippet[]>;
  getSnippetByShortcut(shortcut: string): Promise<Snippet | null>;
  saveSnippet(snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt' | 'useCount'> & Partial<Snippet>): Promise<Snippet>;
  deleteSnippet(id: string): Promise<boolean>;
  incrementSnippetUsage(id: string): Promise<void>;

  getFolders(): Promise<Folder[]>;
  saveFolder(folder: Folder): Promise<Folder>;
  deleteFolder(id: string): Promise<boolean>;

  getSettings(): Promise<Settings>;
  saveSettings(settings: Partial<Settings>): Promise<Settings>;
  getStorageStats(): Promise<StorageStats>;
  cleanupOldItems(): Promise<number>;
}

export class LocalIndexedDBRepository implements ClipboardRepository {
  private static instance: LocalIndexedDBRepository;

  public static getInstance(): LocalIndexedDBRepository {
    if (!LocalIndexedDBRepository.instance) {
      LocalIndexedDBRepository.instance = new LocalIndexedDBRepository();
    }
    return LocalIndexedDBRepository.instance;
  }

  // Type inference helper
  public static detectContentType(content: string): ContentType {
    const trimmed = content.trim();
    if (trimmed.startsWith('data:image/')) return 'image';
    if (/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed)) return 'url';
    if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed) || /^(rgb|hsl)a?\(.+?\)$/i.test(trimmed)) return 'color';
    if (
      trimmed.includes('function ') ||
      trimmed.includes('const ') ||
      trimmed.includes('let ') ||
      trimmed.includes('import ') ||
      trimmed.includes('export ') ||
      trimmed.includes('class ') ||
      trimmed.includes('def ') ||
      trimmed.includes('SELECT ') ||
      (trimmed.includes('{') && trimmed.includes('}')) ||
      (trimmed.includes('</') && trimmed.includes('>'))
    ) {
      return 'code';
    }
    return 'text';
  }

  // 1. Get items with filtering & ranking
  async getItems(filter: SearchFilter = {}): Promise<SearchResult> {
    const db = await getDB();
    const limit = filter.limit ?? 50;
    const offset = filter.offset ?? 0;
    const query = (filter.query || '').trim().toLowerCase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CLIPBOARD_ITEMS], 'readonly');
      const store = tx.objectStore(STORES.CLIPBOARD_ITEMS);
      const items: ClipboardItem[] = [];

      // Open cursor ordered by lastUsedAt (newest first)
      const index = store.index('lastUsedAt');
      const request = index.openCursor(null, 'prev');

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (!cursor) {
          // Finished reading from DB, now filter & rank
          let filtered = items;

          // Apply filters
          if (filter.pinnedOnly) {
            filtered = filtered.filter(i => i.pinned);
          }
          if (filter.snippetsOnly) {
            filtered = filtered.filter(i => i.isSnippet);
          }
          if (filter.type && filter.type !== 'all') {
            filtered = filtered.filter(i => i.type === filter.type);
          }
          if (filter.folderId) {
            filtered = filtered.filter(i => i.folderId === filter.folderId);
          }
          if (filter.domain) {
            filtered = filtered.filter(i => i.sourceDomain?.toLowerCase().includes(filter.domain!.toLowerCase()));
          }

          // If query provided, rank by relevance
          if (query) {
            const scoredItems = filtered.map(item => {
              const text = item.content.toLowerCase();
              const domain = (item.sourceDomain || '').toLowerCase();
              const title = (item.pageTitle || '').toLowerCase();
              const tags = (item.tags || []).join(' ').toLowerCase();

              let score = 0;
              // 1. Exact match
              if (text === query || domain === query) score += 100;
              // 2. Starts with
              else if (text.startsWith(query) || domain.startsWith(query)) score += 60;
              // 3. Contains
              else if (text.includes(query)) score += 40;
              else if (domain.includes(query) || title.includes(query) || tags.includes(query)) score += 20;
              else return null; // no match

              // 4. Recently used boost
              const recencyHours = (Date.now() - item.lastUsedAt) / (1000 * 60 * 60);
              if (recencyHours < 24) score += 10;

              // 5. Pinned boost
              if (item.pinned) score += 15;

              return { item, score };
            }).filter((x): x is { item: ClipboardItem; score: number } => x !== null);

            scoredItems.sort((a, b) => b.score - a.score);
            filtered = scoredItems.map(x => x.item);
          }

          const total = filtered.length;
          const paginated = filtered.slice(offset, offset + limit);

          resolve({
            items: paginated,
            total,
            hasMore: offset + limit < total
          });
          return;
        }

        items.push(cursor.value);
        cursor.continue();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 2. Get item by ID
  async getItemById(id: string): Promise<ClipboardItem | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CLIPBOARD_ITEMS], 'readonly');
      const store = tx.objectStore(STORES.CLIPBOARD_ITEMS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  // 3. Save new or existing item (with deduplication)
  async saveItem(data: Partial<ClipboardItem> & { content: string }): Promise<ClipboardItem> {
    const content = data.content.trim();
    if (!content) throw new Error('Cannot save empty clipboard item');

    const db = await getDB();
    const settings = await this.getSettings();

    // Check if capture is enabled
    if (!settings.captureEnabled && !data.isManual) {
      throw new Error('Clipboard capture is currently paused');
    }

    // Check domain blocklist
    if (data.sourceDomain && settings.neverCaptureDomains?.length) {
      const isBlocked = settings.neverCaptureDomains.some(d => 
        data.sourceDomain?.toLowerCase().includes(d.toLowerCase())
      );
      if (isBlocked) {
        throw new Error('Domain is in never-capture blocklist');
      }
    }

    // Deduplication check: check if the exact content exists already
    const existing = await this.findExactContent(content);
    const now = Date.now();

    if (existing) {
      // Touch and bring to top
      const updated: ClipboardItem = {
        ...existing,
        lastUsedAt: now,
        updatedAt: now,
        sourceUrl: data.sourceUrl || existing.sourceUrl,
        sourceDomain: data.sourceDomain || existing.sourceDomain,
        pageTitle: data.pageTitle || existing.pageTitle
      };
      await this.putItem(updated);
      return updated;
    }

    const type = data.type || LocalIndexedDBRepository.detectContentType(content);
    const charCount = content.length;
    const wordCount = type === 'image' ? 0 : content.split(/\s+/).filter(Boolean).length;

    const newItem: ClipboardItem = {
      id: data.id || 'clip_' + now + '_' + Math.random().toString(36).substring(2, 9),
      content,
      type,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
      charCount,
      wordCount,
      pinned: data.pinned ?? false,
      favorite: data.favorite ?? false,
      folderId: data.folderId,
      tags: data.tags || [],
      sourceUrl: data.sourceUrl,
      sourceDomain: data.sourceDomain,
      pageTitle: data.pageTitle,
      isSnippet: data.isSnippet ?? false,
      isManual: data.isManual ?? false,
      metadata: data.metadata
    };

    await this.putItem(newItem);

    // Run background cleanup asynchronously according to historyLimit
    this.cleanupOldItems().catch(console.error);

    return newItem;
  }

  private async findExactContent(content: string): Promise<ClipboardItem | null> {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORES.CLIPBOARD_ITEMS], 'readonly');
      const store = tx.objectStore(STORES.CLIPBOARD_ITEMS);
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (!cursor) {
          resolve(null);
          return;
        }
        if (cursor.value.content === content) {
          resolve(cursor.value);
          return;
        }
        cursor.continue();
      };
      req.onerror = () => resolve(null);
    });
  }

  private async putItem(item: ClipboardItem): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CLIPBOARD_ITEMS], 'readwrite');
      const store = tx.objectStore(STORES.CLIPBOARD_ITEMS);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // 4. Update item
  async updateItem(id: string, updates: Partial<ClipboardItem>): Promise<ClipboardItem | null> {
    const current = await this.getItemById(id);
    if (!current) return null;

    const updated: ClipboardItem = {
      ...current,
      ...updates,
      updatedAt: Date.now()
    };

    await this.putItem(updated);
    return updated;
  }

  // 5. Delete item
  async deleteItem(id: string): Promise<boolean> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CLIPBOARD_ITEMS], 'readwrite');
      const store = tx.objectStore(STORES.CLIPBOARD_ITEMS);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // 6. Toggle Pin
  async togglePin(id: string): Promise<boolean> {
    const item = await this.getItemById(id);
    if (!item) return false;
    const newPinned = !item.pinned;
    await this.updateItem(id, { pinned: newPinned });
    return newPinned;
  }

  // 7. Touch item (record usage)
  async touchItem(id: string): Promise<void> {
    await this.updateItem(id, { lastUsedAt: Date.now() });
  }

  // 8. Clear history
  async clearHistory(options?: { olderThanDays?: number; includePinned?: boolean }): Promise<number> {
    const db = await getDB();
    const olderThanDays = options?.olderThanDays ?? 0;
    const includePinned = options?.includePinned ?? false;
    const cutoffTime = olderThanDays > 0 ? Date.now() - (olderThanDays * 86400000) : 0;

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CLIPBOARD_ITEMS], 'readwrite');
      const store = tx.objectStore(STORES.CLIPBOARD_ITEMS);
      const req = store.openCursor();
      let deletedCount = 0;

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (!cursor) {
          resolve(deletedCount);
          return;
        }

        const item: ClipboardItem = cursor.value;
        const isOlder = cutoffTime === 0 || item.createdAt < cutoffTime;
        const canDelete = !item.pinned || includePinned;

        if (isOlder && canDelete) {
          cursor.delete();
          deletedCount++;
        }
        cursor.continue();
      };

      req.onerror = () => reject(req.error);
    });
  }

  // 9. Cleanup old unpinned items based on settings limit & autoCleanupDays
  async cleanupOldItems(): Promise<number> {
    const settings = await this.getSettings();
    const db = await getDB();

    // 1. Check autoCleanupDays
    let cleaned = 0;
    if (settings.autoCleanupDays > 0) {
      cleaned += await this.clearHistory({ olderThanDays: settings.autoCleanupDays, includePinned: false });
    }

    // 2. Check historyLimit
    if (settings.historyLimit > 0) {
      const allRes = await this.getItems({ limit: 10000 });
      const unpinned = allRes.items.filter(i => !i.pinned);
      if (unpinned.length > settings.historyLimit) {
        const excess = unpinned.slice(settings.historyLimit);
        for (const item of excess) {
          await this.deleteItem(item.id);
          cleaned++;
        }
      }
    }

    return cleaned;
  }

  // 10. Snippets
  async getSnippets(): Promise<Snippet[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SNIPPETS], 'readonly');
      const store = tx.objectStore(STORES.SNIPPETS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getSnippetByShortcut(shortcut: string): Promise<Snippet | null> {
    const snippets = await this.getSnippets();
    const trimmed = shortcut.trim().toLowerCase();
    return snippets.find(s => s.shortcut.toLowerCase() === trimmed) || null;
  }

  async saveSnippet(data: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt' | 'useCount'> & Partial<Snippet>): Promise<Snippet> {
    const db = await getDB();
    const now = Date.now();
    const snippet: Snippet = {
      id: data.id || 'snip_' + now + '_' + Math.random().toString(36).substring(2, 7),
      name: data.name.trim(),
      shortcut: data.shortcut.trim(),
      content: data.content,
      folderId: data.folderId,
      createdAt: data.createdAt || now,
      updatedAt: now,
      lastUsedAt: data.lastUsedAt,
      useCount: data.useCount ?? 0
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SNIPPETS], 'readwrite');
      const store = tx.objectStore(STORES.SNIPPETS);
      const req = store.put(snippet);
      req.onsuccess = () => resolve(snippet);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteSnippet(id: string): Promise<boolean> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SNIPPETS], 'readwrite');
      const store = tx.objectStore(STORES.SNIPPETS);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async incrementSnippetUsage(id: string): Promise<void> {
    const snippets = await this.getSnippets();
    const target = snippets.find(s => s.id === id);
    if (target) {
      target.useCount = (target.useCount || 0) + 1;
      target.lastUsedAt = Date.now();
      await this.saveSnippet(target);
    }
  }

  // 11. Folders
  async getFolders(): Promise<Folder[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.FOLDERS], 'readonly');
      const store = tx.objectStore(STORES.FOLDERS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async saveFolder(folder: Folder): Promise<Folder> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.FOLDERS], 'readwrite');
      const store = tx.objectStore(STORES.FOLDERS);
      const req = store.put(folder);
      req.onsuccess = () => resolve(folder);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteFolder(id: string): Promise<boolean> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.FOLDERS], 'readwrite');
      const store = tx.objectStore(STORES.FOLDERS);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // 12. Settings
  async getSettings(): Promise<Settings> {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORES.SETTINGS], 'readonly');
      const store = tx.objectStore(STORES.SETTINGS);
      const req = store.get('main_settings');
      req.onsuccess = () => {
        if (req.result && req.result.value) {
          resolve({ ...DEFAULT_SETTINGS, ...req.result.value });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  }

  async saveSettings(settings: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    const db = await getDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SETTINGS], 'readwrite');
      const store = tx.objectStore(STORES.SETTINGS);
      const req = store.put({ key: 'main_settings', value: updated });
      req.onsuccess = () => resolve(updated);
      req.onerror = () => reject(req.error);
    });
  }

  // 13. Storage Statistics
  async getStorageStats(): Promise<StorageStats> {
    const db = await getDB();
    const itemsRes = await this.getItems({ limit: 10000 });
    const snippets = await this.getSnippets();
    const folders = await this.getFolders();

    let totalChars = 0;
    let pinnedCount = 0;

    for (const item of itemsRes.items) {
      totalChars += item.content.length;
      if (item.pinned) pinnedCount++;
    }

    return {
      totalItems: itemsRes.total,
      pinnedItems: pinnedCount,
      totalSnippets: snippets.length,
      totalFolders: folders.length,
      approxSizeKB: Math.round(totalChars / 1024)
    };
  }
}

// Single export of repository instance
export const repository: ClipboardRepository = LocalIndexedDBRepository.getInstance();
