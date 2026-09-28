import { ClipboardItem, Snippet, Folder, Settings } from '../types';

export const DB_NAME = 'pastiq_db';
export const DB_VERSION = 1;

export const STORES = {
  CLIPBOARD_ITEMS: 'clipboard_items',
  SNIPPETS: 'snippets',
  FOLDERS: 'folders',
  SETTINGS: 'settings',
  METADATA: 'metadata',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  historyLimit: 500,
  captureEnabled: true,
  sensitiveProtection: true,
  neverCaptureDomains: [
    'chase.com',
    'bankofamerica.com',
    'wellsfargo.com',
    '1password.com',
    'bitwarden.com',
    'lastpass.com'
  ],
  textExpansionEnabled: true,
  expansionTrigger: ';',
  theme: 'cinematic',
  compactMode: false,
  closePopupOnCopy: true,
  plan: 'free',
  autoCleanupDays: 0,
  imageCaptureEnabled: true,
  maxImageSizeKB: 512,
  copyPageFilter: {
    stripNav: true,
    stripClutter: true,
    preserveHeadings: true,
    preserveLists: true
  }
};

export const INITIAL_FOLDERS: Folder[] = [
  { id: 'f_work', name: 'Work', color: '#38BDF8', createdAt: Date.now() },
  { id: 'f_personal', name: 'Personal', color: '#818CF8', createdAt: Date.now() },
  { id: 'f_code', name: 'Code', color: '#34D399', createdAt: Date.now() },
  { id: 'f_emails', name: 'Emails', color: '#F472B6', createdAt: Date.now() }
];

export const INITIAL_SNIPPETS: Snippet[] = [
  {
    id: 'snip_email_reply',
    name: 'Quick Email Reply',
    shortcut: ';email',
    content: "Hello,\n\nThank you for getting in touch. I'll review this and get back to you shortly.\n\nRegards,",
    folderId: 'f_emails',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    useCount: 0
  },
  {
    id: 'snip_gh',
    name: 'GitHub Profile',
    shortcut: ';gh',
    content: 'https://github.com',
    folderId: 'f_code',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    useCount: 0
  }
];

let dbInstance: IDBDatabase | null = null;

export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. clipboard_items store
      if (!db.objectStoreNames.contains(STORES.CLIPBOARD_ITEMS)) {
        const itemStore = db.createObjectStore(STORES.CLIPBOARD_ITEMS, { keyPath: 'id' });
        itemStore.createIndex('createdAt', 'createdAt', { unique: false });
        itemStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        itemStore.createIndex('lastUsedAt', 'lastUsedAt', { unique: false });
        itemStore.createIndex('pinned', 'pinned', { unique: false });
        itemStore.createIndex('type', 'type', { unique: false });
        itemStore.createIndex('folderId', 'folderId', { unique: false });
        itemStore.createIndex('sourceDomain', 'sourceDomain', { unique: false });
        itemStore.createIndex('isSnippet', 'isSnippet', { unique: false });
      }

      // 2. snippets store
      if (!db.objectStoreNames.contains(STORES.SNIPPETS)) {
        const snippetStore = db.createObjectStore(STORES.SNIPPETS, { keyPath: 'id' });
        snippetStore.createIndex('shortcut', 'shortcut', { unique: true });
        snippetStore.createIndex('folderId', 'folderId', { unique: false });
        snippetStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // 3. folders store
      if (!db.objectStoreNames.contains(STORES.FOLDERS)) {
        db.createObjectStore(STORES.FOLDERS, { keyPath: 'id' });
      }

      // 4. settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      // 5. metadata store
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }
    };

    request.onsuccess = async (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      
      // Auto seed initial data if first run
      await seedInitialData(dbInstance);
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

async function seedInitialData(db: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction([STORES.SETTINGS, STORES.FOLDERS, STORES.SNIPPETS], 'readwrite');
    const settingsStore = tx.objectStore(STORES.SETTINGS);
    const foldersStore = tx.objectStore(STORES.FOLDERS);
    const snippetsStore = tx.objectStore(STORES.SNIPPETS);

    const getReq = settingsStore.get('main_settings');
    getReq.onsuccess = () => {
      if (!getReq.result) {
        settingsStore.put({ key: 'main_settings', value: DEFAULT_SETTINGS });
        for (const folder of INITIAL_FOLDERS) {
          foldersStore.put(folder);
        }
        for (const snip of INITIAL_SNIPPETS) {
          snippetsStore.put(snip);
        }
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve(); // graceful non-fatal
  });
}
