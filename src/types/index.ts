export type ContentType = 'text' | 'code' | 'url' | 'image' | 'color';

export interface ClipboardItem {
  id: string;
  content: string;
  type: ContentType;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number;
  charCount: number;
  wordCount: number;
  pinned: boolean;
  favorite: boolean;
  folderId?: string;
  tags?: string[];
  sourceUrl?: string;
  sourceDomain?: string;
  pageTitle?: string;
  isSnippet: boolean;
  isManual: boolean;
  metadata?: {
    mimeType?: string;
    width?: number;
    height?: number;
    sizeBytes?: number;
    language?: string;
    colorHex?: string;
  };
}

export interface Snippet {
  id: string;
  name: string;
  shortcut: string; // e.g. ";email"
  content: string;
  folderId?: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
  useCount: number;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface CopyPageFilterOptions {
  stripNav: boolean;
  stripClutter: boolean;
  preserveHeadings: boolean;
  preserveLists: boolean;
}

export interface Settings {
  historyLimit: number; // 100, 500, 1000, 5000, 0 = unlimited
  captureEnabled: boolean;
  sensitiveProtection: boolean;
  neverCaptureDomains: string[];
  textExpansionEnabled: boolean;
  expansionTrigger: string; // e.g. ";"
  theme: 'cinematic' | 'dark' | 'navy';
  compactMode: boolean;
  closePopupOnCopy: boolean;
  plan: 'free' | 'pro';
  autoCleanupDays: number; // 0 = off, 7, 30, 90
  imageCaptureEnabled: boolean;
  maxImageSizeKB: number; // e.g. 512 KB
  copyPageFilter: CopyPageFilterOptions;
}

export interface SearchFilter {
  query?: string;
  type?: ContentType | 'all';
  folderId?: string;
  pinnedOnly?: boolean;
  snippetsOnly?: boolean;
  domain?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  items: ClipboardItem[];
  total: number;
  hasMore: boolean;
}

export interface StorageStats {
  totalItems: number;
  pinnedItems: number;
  totalSnippets: number;
  totalFolders: number;
  approxSizeKB: number;
}

// Inter-process messaging types
export type MessagePayload =
  | { action: 'CLIPBOARD_CAPTURED'; payload: Partial<ClipboardItem> }
  | { action: 'GET_SETTINGS' }
  | { action: 'SETTINGS_UPDATED'; payload: Partial<Settings> }
  | { action: 'COPY_TEXT_LEGITIMATE'; payload: { mode: 'selected' | 'page'; filterOptions?: CopyPageFilterOptions } }
  | { action: 'EXPAND_SNIPPET'; payload: { shortcut: string } }
  | { action: 'SNIPPET_MATCH_QUERY'; payload: { prefix: string } }
  | { action: 'OPEN_COMMAND_PALETTE' }
  | { action: 'TRIGGER_FORCE_COPY' };
