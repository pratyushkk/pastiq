import { repository } from '../storage/repository';
import type { ClipboardItem, CopyPageFilterOptions } from '../types';

// Setup Context Menus
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Open onboarding on first install
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/onboarding.html') });
  }

  // Create context menus cleanly
  chrome.contextMenus.removeAll(() => {
    // 1. Text Selection Context Menus
    chrome.contextMenus.create({
      id: 'pastiq_save_selection',
      title: 'Pastiq: Save to Pastiq',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'pastiq_force_copy',
      title: 'Pastiq: Copy with Pastiq',
      contexts: ['selection', 'editable']
    });

    chrome.contextMenus.create({
      id: 'pastiq_save_snippet',
      title: 'Pastiq: Create snippet',
      contexts: ['selection']
    });

    // 2. Page Context Menus
    chrome.contextMenus.create({
      id: 'pastiq_save_page',
      title: 'Pastiq: Save page',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'pastiq_copy_page_url',
      title: 'Pastiq: Copy page URL',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'pastiq_copy_page_title',
      title: 'Pastiq: Copy page title',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'pastiq_copy_page_text',
      title: 'Pastiq: Copy page text',
      contexts: ['page']
    });

    // 3. Image Context Menu
    chrome.contextMenus.create({
      id: 'pastiq_save_image',
      title: 'Pastiq: Save image to Pastiq',
      contexts: ['image']
    });
  });
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  // Protect Chrome internal pages
  if (tab.url && isInternalPage(tab.url)) {
    console.warn('Pastiq: Action disabled on browser internal page:', tab.url);
    return;
  }

  switch (info.menuItemId) {
    case 'pastiq_save_selection': {
      if (info.selectionText) {
        await repository.saveItem({
          content: info.selectionText,
          sourceUrl: tab.url,
          sourceDomain: getDomain(tab.url),
          pageTitle: tab.title,
          isManual: true
        });
        showNotification('Selection saved to Pastiq');
      }
      break;
    }

    case 'pastiq_save_snippet': {
      if (info.selectionText) {
        const text = info.selectionText.trim();
        const shortName = text.slice(0, 24).replace(/\n/g, ' ') + (text.length > 24 ? '...' : '');
        const shortcut = ';' + shortName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
        await repository.saveSnippet({
          name: shortName,
          shortcut: shortcut || ';snip',
          content: text
        });
        showNotification(`Snippet "${shortcut}" created!`);
      }
      break;
    }

    case 'pastiq_force_copy': {
      chrome.tabs.sendMessage(tab.id, { action: 'FORCE_COPY_SELECTED' }).catch(err => {
        console.warn('Could not contact tab for force copy:', err);
      });
      break;
    }

    case 'pastiq_save_page': {
      if (tab.url) {
        await repository.saveItem({
          content: `${tab.title || 'Page'}\n${tab.url}`,
          type: 'url',
          sourceUrl: tab.url,
          sourceDomain: getDomain(tab.url),
          pageTitle: tab.title,
          isManual: true
        });
        showNotification('Page saved to Pastiq');
      }
      break;
    }

    case 'pastiq_copy_page_url': {
      if (tab.url) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'COPY_TEXT_DIRECT',
          payload: { text: tab.url }
        }).catch(() => {
          // If tab message fails, fallback
        });
        showNotification('URL copied');
      }
      break;
    }

    case 'pastiq_copy_page_title': {
      if (tab.title) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'COPY_TEXT_DIRECT',
          payload: { text: tab.title }
        }).catch(() => {});
        showNotification('Title copied');
      }
      break;
    }

    case 'pastiq_copy_page_text': {
      const settings = await repository.getSettings();
      chrome.tabs.sendMessage(tab.id, {
        action: 'COPY_PAGE_TEXT',
        payload: { filterOptions: settings.copyPageFilter }
      }).catch(err => {
        console.warn('Could not contact tab for copy page text:', err);
      });
      break;
    }

    case 'pastiq_save_image': {
      if (info.srcUrl) {
        try {
          const settings = await repository.getSettings();
          if (!settings.imageCaptureEnabled) {
            showNotification('Image capture is disabled in Settings');
            return;
          }

          // Fetch image and convert to data URL if legitimate and accessible
          const response = await fetch(info.srcUrl);
          const blob = await response.blob();
          const sizeKB = blob.size / 1024;

          if (sizeKB > settings.maxImageSizeKB) {
            showNotification(`Image too large (${Math.round(sizeKB)} KB > max ${settings.maxImageSizeKB} KB)`);
            return;
          }

          const buffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64data = `data:${blob.type || 'image/png'};base64,${btoa(binary)}`;

          await repository.saveItem({
            content: base64data,
            type: 'image',
            sourceUrl: tab.url,
            sourceDomain: getDomain(tab.url),
            pageTitle: tab.title,
            metadata: {
              mimeType: blob.type,
              sizeBytes: blob.size
            }
          });
          showNotification('Image saved to Pastiq');
        } catch (err) {
          console.error('Failed to capture image:', err);
        }
      }
      break;
    }
  }
});

// Handle Keyboard Shortcuts configured in manifest
chrome.commands.onCommand.addListener(async (command) => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id || (activeTab.url && isInternalPage(activeTab.url))) return;

  if (command === 'open-command-palette') {
    chrome.tabs.sendMessage(activeTab.id, { action: 'TOGGLE_QUICK_PALETTE' }).catch(() => {});
  } else if (command === 'copy-page-text') {
    const settings = await repository.getSettings();
    chrome.tabs.sendMessage(activeTab.id, {
      action: 'COPY_PAGE_TEXT',
      payload: { filterOptions: settings.copyPageFilter }
    }).catch(() => {});
  } else if (command === 'force-copy-selected') {
    chrome.tabs.sendMessage(activeTab.id, { action: 'FORCE_COPY_SELECTED' }).catch(() => {});
  }
});

// Central Message Broker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'CLIPBOARD_CAPTURED': {
          if (message.payload?.content) {
            await repository.saveItem(message.payload);
            updateBadge();
          }
          sendResponse({ success: true });
          break;
        }

        case 'GET_RECENT_ITEMS': {
          const result = await repository.getItems({
            limit: message.payload?.limit || 50,
            offset: message.payload?.offset || 0,
            pinnedOnly: message.payload?.pinnedOnly,
            snippetsOnly: message.payload?.snippetsOnly,
            type: message.payload?.type,
            folderId: message.payload?.folderId
          });
          sendResponse(result);
          break;
        }

        case 'SEARCH_ITEMS': {
          const result = await repository.getItems({
            query: message.payload?.query,
            limit: message.payload?.limit || 50,
            offset: message.payload?.offset || 0,
            type: message.payload?.type,
            folderId: message.payload?.folderId,
            pinnedOnly: message.payload?.pinnedOnly
          });
          sendResponse(result);
          break;
        }

        case 'GET_SNIPPETS': {
          const snippets = await repository.getSnippets();
          sendResponse({ snippets });
          break;
        }

        case 'SNIPPET_USED': {
          if (message.payload?.id) {
            await repository.incrementSnippetUsage(message.payload.id);
          }
          sendResponse({ success: true });
          break;
        }

        case 'GET_FOLDERS': {
          const folders = await repository.getFolders();
          sendResponse({ folders });
          break;
        }

        case 'GET_SETTINGS': {
          const settings = await repository.getSettings();
          sendResponse({ settings });
          break;
        }

        case 'SAVE_SETTINGS': {
          const updated = await repository.saveSettings(message.payload);
          // Broadcast to tabs
          chrome.tabs.query({}, (tabs) => {
            for (const t of tabs) {
              if (t.id && t.url && !isInternalPage(t.url)) {
                chrome.tabs.sendMessage(t.id, { action: 'SETTINGS_CHANGED', payload: updated }).catch(() => {});
              }
            }
          });
          sendResponse({ settings: updated });
          break;
        }

        case 'GET_STATS': {
          const stats = await repository.getStorageStats();
          sendResponse({ stats });
          break;
        }

        case 'TOGGLE_PIN': {
          const pinned = await repository.togglePin(message.payload.id);
          sendResponse({ success: true, pinned });
          break;
        }

        case 'DELETE_ITEM': {
          const success = await repository.deleteItem(message.payload.id);
          updateBadge();
          sendResponse({ success });
          break;
        }

        case 'CLEAR_HISTORY': {
          const count = await repository.clearHistory(message.payload);
          updateBadge();
          sendResponse({ success: true, count });
          break;
        }

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (err: any) {
      console.error('Service worker error handling action:', message.action, err);
      sendResponse({ error: err?.message || 'Internal error' });
    }
  })();

  return true; // Keep asynchronous sendResponse channel open
});

function isInternalPage(url: string): boolean {
  return /^(chrome|chrome-extension|edge|about|devtools):/i.test(url) ||
    url.includes('chromewebstore.google.com');
}

function getDomain(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

async function updateBadge(): Promise<void> {
  try {
    const stats = await repository.getStorageStats();
    const count = stats.totalItems;
    const text = count > 99 ? '99+' : count > 0 ? count.toString() : '';
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#0284C7' });
  } catch {}
}

function showNotification(message: string): void {
  // Use badge or non-intrusive notification
  chrome.action.setBadgeText({ text: '✓' });
  chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
  setTimeout(() => {
    updateBadge();
  }, 1500);
}
