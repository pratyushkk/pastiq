import test from 'node:test';
import assert from 'node:assert';

// 1. Content Type Detection Tests
function detectContentType(content) {
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

test('detectContentType categorizes strings accurately', () => {
  assert.strictEqual(detectContentType('https://news.ycombinator.com'), 'url');
  assert.strictEqual(detectContentType('http://localhost:3000/api'), 'url');
  assert.strictEqual(detectContentType('#38BDF8'), 'color');
  assert.strictEqual(detectContentType('rgba(255, 255, 255, 0.8)'), 'color');
  assert.strictEqual(detectContentType('const add = (a, b) => a + b;'), 'code');
  assert.strictEqual(detectContentType('SELECT id, name FROM users;'), 'code');
  assert.strictEqual(detectContentType('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...'), 'image');
  assert.strictEqual(detectContentType('Just a normal clipboard message.'), 'text');
});

// 2. Search Ranking Algorithm Tests
function rankItems(items, query) {
  const q = query.trim().toLowerCase();
  const scoredItems = items.map(item => {
    const text = item.content.toLowerCase();
    const domain = (item.sourceDomain || '').toLowerCase();
    const title = (item.pageTitle || '').toLowerCase();
    const tags = (item.tags || []).join(' ').toLowerCase();

    let score = 0;
    // 1. Exact match
    if (text === q || domain === q) score += 100;
    // 2. Starts with
    else if (text.startsWith(q) || domain.startsWith(q)) score += 60;
    // 3. Contains
    else if (text.includes(q)) score += 40;
    else if (domain.includes(q) || title.includes(q) || tags.includes(q)) score += 20;
    else return null;

    // 4. Recently used boost
    const recencyHours = (Date.now() - item.lastUsedAt) / (1000 * 60 * 60);
    if (recencyHours < 24) score += 10;

    // 5. Pinned boost
    if (item.pinned) score += 15;

    return { item, score };
  }).filter(x => x !== null);

  scoredItems.sort((a, b) => b.score - a.score);
  return scoredItems.map(x => x.item);
}

test('rankItems prioritizes exact match, then startsWith, then contains, boosting pinned', () => {
  const items = [
    { id: '1', content: 'amazon prime shipping', sourceDomain: '', lastUsedAt: Date.now(), pinned: false },
    { id: '2', content: 'amazon', sourceDomain: 'amazon.com', lastUsedAt: Date.now(), pinned: false },
    { id: '3', content: 'buy stuff on amazon here', sourceDomain: '', lastUsedAt: Date.now(), pinned: true },
    { id: '4', content: 'unrelated item', sourceDomain: '', lastUsedAt: Date.now(), pinned: false }
  ];

  const results = rankItems(items, 'amazon');
  assert.strictEqual(results.length, 3);
  // 'amazon' exact match should be #1
  assert.strictEqual(results[0].id, '2');
  // 'amazon prime shipping' startsWith should be #2
  assert.strictEqual(results[1].id, '1');
  // 'buy stuff on amazon here' contains + pinned should be #3
  assert.strictEqual(results[2].id, '3');
});

// 3. Sensitive Field Detection Tests
function isSensitiveFieldMock({ type = 'text', autocomplete = '', name = '', id = '' }) {
  if (['password', 'hidden'].includes(type.toLowerCase())) return true;
  const ac = autocomplete.toLowerCase();
  if (
    ac.includes('password') ||
    ac.includes('cc-') ||
    ac.includes('cvv') ||
    ac.includes('csc') ||
    ac.includes('credit-card') ||
    ac.includes('one-time-code') ||
    ac.includes('pin')
  ) {
    return true;
  }
  const n = name.toLowerCase();
  const i = id.toLowerCase();
  const sensitiveKeywords = ['pass', 'pwd', 'cvv', 'cvc', 'cardnum', 'secret', 'token', 'auth'];
  if (sensitiveKeywords.some(kw => n.includes(kw) || i.includes(kw))) {
    return true;
  }
  return false;
}

test('isSensitiveField correctly flags sensitive elements and permits safe inputs', () => {
  // Sensitive
  assert.strictEqual(isSensitiveFieldMock({ type: 'password' }), true);
  assert.strictEqual(isSensitiveFieldMock({ type: 'text', autocomplete: 'current-password' }), true);
  assert.strictEqual(isSensitiveFieldMock({ type: 'text', autocomplete: 'cc-number' }), true);
  assert.strictEqual(isSensitiveFieldMock({ type: 'text', autocomplete: 'cc-csc' }), true);
  assert.strictEqual(isSensitiveFieldMock({ type: 'text', name: 'user_password' }), true);
  assert.strictEqual(isSensitiveFieldMock({ type: 'text', id: 'cvv-input' }), true);
  assert.strictEqual(isSensitiveFieldMock({ type: 'text', name: 'auth_token' }), true);

  // Safe
  assert.strictEqual(isSensitiveFieldMock({ type: 'text', name: 'search_query' }), false);
  assert.strictEqual(isSensitiveFieldMock({ type: 'text', name: 'first_name' }), false);
  assert.strictEqual(isSensitiveFieldMock({ type: 'email', name: 'email_address' }), false);
});

// 4. Text Cleanup and Normalization Tests
test('text extraction normalizes multi-newlines properly', () => {
  const raw = "Paragraph 1\n\n\n\n\n\nParagraph 2\n\n\n# Heading 1\n\n• Item 1";
  const normalized = raw.replace(/\n{3,}/g, '\n\n').trim();
  assert.strictEqual(normalized, "Paragraph 1\n\nParagraph 2\n\n# Heading 1\n\n• Item 1");
});

// 5. Command Center Command Filtering Tests
const mockStaticCommands = [
  { id: 'cmd_copy_selected', title: 'Copy selected text', category: 'page', keywords: ['selected', 'copy', 'page'] },
  { id: 'cmd_copy_page_text', title: 'Copy visible page text', category: 'page', keywords: ['page', 'clean', 'visible'] },
  { id: 'cmd_new_tab', title: 'Open new tab', category: 'browser', keywords: ['new', 'tab', 'open'] },
  { id: 'cmd_close_tab', title: 'Close current tab', category: 'browser', keywords: ['close', 'tab'] }
];

function getMockCommands(query) {
  const q = query.trim().toLowerCase();
  if (q.startsWith('/page')) {
    return mockStaticCommands.filter(c => c.category === 'page');
  }
  if (q.startsWith('/tab')) {
    return mockStaticCommands.filter(c => c.category === 'browser');
  }
  const results = mockStaticCommands.filter(c => c.title.toLowerCase().includes(q) || c.keywords.some(k => k.includes(q)));
  if (q) {
    results.push({ id: 'google_search', title: `Search Google for "${query.trim()}"` });
  }
  return results;
}

test('Command Center filters commands via syntax and natural search', () => {
  // Syntax /page
  const pageCmds = getMockCommands('/page');
  assert.strictEqual(pageCmds.length, 2);
  assert.strictEqual(pageCmds[0].category, 'page');

  // Syntax /tab
  const tabCmds = getMockCommands('/tab');
  assert.strictEqual(tabCmds.length, 2);
  assert.strictEqual(tabCmds[0].category, 'browser');

  // Natural query "tab"
  const searchCmds = getMockCommands('tab');
  assert.ok(searchCmds.some(c => c.id === 'cmd_new_tab'));
  assert.ok(searchCmds.some(c => c.id === 'google_search'));
});

