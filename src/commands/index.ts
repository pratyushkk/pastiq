export interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: 'browser' | 'page' | 'clipboard' | 'web';
  actionLabel: string;
  icon: string;
  keywords: string[];
  shortcutHint?: string;
  execute: (context: CommandContext) => Promise<{ success: boolean; message: string }>;
}

export interface CommandContext {
  activeTab?: chrome.tabs.Tab;
  query?: string;
}

// Built-in Static Commands
export const STATIC_COMMANDS: CommandItem[] = [
  // Page Actions
  {
    id: 'cmd_copy_selected',
    title: 'Copy selected text',
    description: 'Copy currently selected text on active webpage',
    category: 'page',
    actionLabel: 'Copy',
    icon: 'text',
    keywords: ['selected', 'selection', 'text', 'copy', 'highlight', 'page'],
    execute: async ({ activeTab }) => {
      if (!activeTab?.id || isInternalUrl(activeTab.url)) {
        return { success: false, message: 'Cannot access internal browser page' };
      }
      try {
        const res = await chrome.tabs.sendMessage(activeTab.id, { action: 'FORCE_COPY_SELECTED' });
        return { success: !!res?.success, message: res?.success ? 'Selected text copied' : 'No text selected' };
      } catch {
        return { success: false, message: 'Unable to contact page' };
      }
    }
  },
  {
    id: 'cmd_copy_page_text',
    title: 'Copy visible page text',
    description: 'Clean formatted visible text with headings & lists',
    category: 'page',
    actionLabel: 'Copy',
    icon: 'page',
    keywords: ['page', 'visible', 'clean', 'article', 'body', 'content', 'read'],
    execute: async ({ activeTab }) => {
      if (!activeTab?.id || isInternalUrl(activeTab.url)) {
        return { success: false, message: 'Cannot access internal browser page' };
      }
      try {
        const res = await chrome.tabs.sendMessage(activeTab.id, { action: 'COPY_PAGE_TEXT' });
        return { success: !!res?.success, message: res?.success ? 'Visible page text copied' : 'No readable page text' };
      } catch {
        return { success: false, message: 'Unable to contact page' };
      }
    }
  },
  {
    id: 'cmd_copy_element',
    title: 'Copy current element',
    description: 'Copy text of currently focused or active element',
    category: 'page',
    actionLabel: 'Copy',
    icon: 'element',
    keywords: ['element', 'tag', 'node', 'focus', 'active', 'container', 'page'],
    execute: async ({ activeTab }) => {
      if (!activeTab?.id || isInternalUrl(activeTab.url)) {
        return { success: false, message: 'Cannot access internal browser page' };
      }
      try {
        const res = await chrome.tabs.sendMessage(activeTab.id, { action: 'COPY_CURRENT_ELEMENT' });
        return { success: !!res?.success, message: res?.success ? 'Element text copied' : 'No element selected' };
      } catch {
        return { success: false, message: 'Unable to contact page' };
      }
    }
  },
  {
    id: 'cmd_copy_url',
    title: 'Copy current page URL',
    description: 'Copy link of the active tab to clipboard',
    category: 'page',
    actionLabel: 'Copy',
    icon: 'link',
    keywords: ['url', 'link', 'address', 'page', 'href', 'tab'],
    execute: async ({ activeTab }) => {
      if (!activeTab?.url) return { success: false, message: 'No active URL found' };
      await navigator.clipboard.writeText(activeTab.url);
      return { success: true, message: 'Page URL copied' };
    }
  },
  {
    id: 'cmd_copy_title',
    title: 'Copy current page title',
    description: 'Copy title header of active tab to clipboard',
    category: 'page',
    actionLabel: 'Copy',
    icon: 'title',
    keywords: ['title', 'name', 'heading', 'tab', 'page'],
    execute: async ({ activeTab }) => {
      if (!activeTab?.title) return { success: false, message: 'No title found' };
      await navigator.clipboard.writeText(activeTab.title);
      return { success: true, message: 'Page title copied' };
    }
  },
  {
    id: 'cmd_save_page',
    title: 'Save page to Pastiq',
    description: 'Store current tab title & URL into clipboard history',
    category: 'page',
    actionLabel: 'Save',
    icon: 'save',
    keywords: ['save', 'bookmark', 'clip', 'store', 'page', 'pastiq'],
    execute: async ({ activeTab }) => {
      if (!activeTab?.url) return { success: false, message: 'No page to save' };
      chrome.runtime.sendMessage({
        action: 'CLIPBOARD_CAPTURED',
        payload: {
          content: `${activeTab.title || 'Page'}\n${activeTab.url}`,
          type: 'url',
          sourceUrl: activeTab.url,
          pageTitle: activeTab.title,
          isManual: true
        }
      });
      return { success: true, message: 'Saved page to Pastiq' };
    }
  },

  // Browser Actions
  {
    id: 'cmd_new_tab',
    title: 'Open new tab',
    description: 'Launch a blank browser tab',
    category: 'browser',
    actionLabel: 'Open',
    icon: 'plus',
    keywords: ['new', 'tab', 'open', 'create', 'browser'],
    execute: async () => {
      await chrome.tabs.create({});
      return { success: true, message: 'New tab opened' };
    }
  },
  {
    id: 'cmd_duplicate_tab',
    title: 'Duplicate current tab',
    description: 'Clone active tab in a new tab',
    category: 'browser',
    actionLabel: 'Duplicate',
    icon: 'duplicate',
    keywords: ['duplicate', 'clone', 'copy', 'tab'],
    execute: async ({ activeTab }) => {
      if (!activeTab?.id) return { success: false, message: 'No active tab' };
      await chrome.tabs.duplicate(activeTab.id);
      return { success: true, message: 'Tab duplicated' };
    }
  },
  {
    id: 'cmd_reload_page',
    title: 'Reload current page',
    description: 'Refresh the active browser tab',
    category: 'browser',
    actionLabel: 'Reload',
    icon: 'reload',
    keywords: ['reload', 'refresh', 'f5', 'update', 'tab', 'page'],
    execute: async ({ activeTab }) => {
      if (!activeTab?.id) return { success: false, message: 'No active tab' };
      await chrome.tabs.reload(activeTab.id);
      return { success: true, message: 'Page reloaded' };
    }
  },
  {
    id: 'cmd_close_tab',
    title: 'Close current tab',
    description: 'Close active browser tab immediately',
    category: 'browser',
    actionLabel: 'Close',
    icon: 'close',
    keywords: ['close', 'kill', 'remove', 'exit', 'tab'],
    execute: async ({ activeTab }) => {
      if (!activeTab?.id) return { success: false, message: 'No active tab' };
      await chrome.tabs.remove(activeTab.id);
      return { success: true, message: 'Tab closed' };
    }
  },
  {
    id: 'cmd_open_downloads',
    title: 'Open Downloads',
    description: 'View browser download manager',
    category: 'browser',
    actionLabel: 'Open',
    icon: 'download',
    keywords: ['downloads', 'files', 'browser'],
    execute: async () => {
      await chrome.tabs.create({ url: 'chrome://downloads' });
      return { success: true, message: 'Downloads opened' };
    }
  },
  {
    id: 'cmd_open_history',
    title: 'Open History',
    description: 'View browser browsing history',
    category: 'browser',
    actionLabel: 'Open',
    icon: 'history',
    keywords: ['history', 'recent', 'browser', 'visited'],
    execute: async () => {
      await chrome.tabs.create({ url: 'chrome://history' });
      return { success: true, message: 'History opened' };
    }
  },
  {
    id: 'cmd_open_extensions',
    title: 'Open Extensions',
    description: 'Manage installed Chrome extensions & shortcuts',
    category: 'browser',
    actionLabel: 'Open',
    icon: 'extension',
    keywords: ['extensions', 'addons', 'plugins', 'settings', 'shortcuts'],
    execute: async () => {
      await chrome.tabs.create({ url: 'chrome://extensions' });
      return { success: true, message: 'Extensions opened' };
    }
  },
  {
    id: 'cmd_open_settings',
    title: 'Open Pastiq Settings',
    description: 'Configure preferences, shortcuts, and privacy',
    category: 'clipboard',
    actionLabel: 'Open',
    icon: 'settings',
    keywords: ['settings', 'options', 'preferences', 'config', 'pastiq', 'privacy'],
    execute: async () => {
      chrome.runtime.openOptionsPage();
      return { success: true, message: 'Settings opened' };
    }
  }
];

export function getMatchingCommands(query: string, activeTab?: chrome.tabs.Tab): CommandItem[] {
  const q = query.trim().toLowerCase();
  const results: CommandItem[] = [];

  // Syntax filter check
  if (q.startsWith('/page')) {
    const subQuery = q.replace('/page', '').trim();
    return STATIC_COMMANDS.filter(c => {
      if (c.category !== 'page' && !['cmd_new_tab', 'cmd_reload_page', 'cmd_close_tab'].includes(c.id)) return false;
      if (!subQuery) return true;
      return c.title.toLowerCase().includes(subQuery) || c.keywords.some(k => k.includes(subQuery));
    });
  }

  if (q.startsWith('/tab') || q.startsWith('/browser')) {
    const subQuery = q.replace(/^\/(tab|browser)/, '').trim();
    return STATIC_COMMANDS.filter(c => {
      if (c.category !== 'browser') return false;
      if (!subQuery) return true;
      return c.title.toLowerCase().includes(subQuery) || c.keywords.some(k => k.includes(subQuery));
    });
  }

  // General query matching against static commands
  if (q) {
    for (const cmd of STATIC_COMMANDS) {
      const titleMatch = cmd.title.toLowerCase().includes(q);
      const kwMatch = cmd.keywords.some(k => k.includes(q));
      if (titleMatch || kwMatch) {
        results.push(cmd);
      }
    }

    // Dynamic Search Google Command
    results.push({
      id: `cmd_web_search_${Date.now()}`,
      title: `Search Google for "${query.trim()}"`,
      description: 'Search the web in a new tab',
      category: 'web',
      actionLabel: 'Search',
      icon: 'search',
      keywords: ['google', 'search', 'web'],
      execute: async () => {
        const url = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
        await chrome.tabs.create({ url });
        return { success: true, message: 'Opened Google search' };
      }
    });

    // Dynamic Open URL Command if query looks like domain or site
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(q) || ['github', 'youtube', 'reddit', 'twitter', 'x', 'google', 'amazon'].includes(q)) {
      let targetUrl = q;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = targetUrl.includes('.') ? `https://${targetUrl}` : `https://${targetUrl}.com`;
      }
      results.push({
        id: `cmd_open_url_${Date.now()}`,
        title: `Open ${q.charAt(0).toUpperCase() + q.slice(1)}`,
        description: targetUrl,
        category: 'web',
        actionLabel: 'Open',
        icon: 'link',
        keywords: ['open', 'url', 'site', 'web'],
        execute: async () => {
          await chrome.tabs.create({ url: targetUrl });
          return { success: true, message: `Opened ${targetUrl}` };
        }
      });
    }
  } else {
    // When no query is typed, return popular top commands
    return STATIC_COMMANDS.slice(0, 5);
  }

  return results;
}

function isInternalUrl(url?: string): boolean {
  if (!url) return true;
  return /^(chrome|chrome-extension|edge|about|devtools):/i.test(url) || url.includes('chromewebstore.google.com');
}
