// Service worker: performs the actual translation requests.
// Doing fetches here (with host_permissions) avoids CORS issues in the content script.

const CACHE_LIMIT = 2000;
const cache = new Map(); // text -> { translated, detected }

async function translate(text) {
  if (cache.has(text)) return cache.get(text);

  const url =
    'https://translate.googleapis.com/translate_a/single' +
    '?client=gtx&sl=auto&tl=en&dt=t&q=' +
    encodeURIComponent(text);

  const res = await fetch(url);
  if (!res.ok) throw new Error('Translate request failed: HTTP ' + res.status);

  const data = await res.json();
  // Response shape: [ [ [translatedChunk, originalChunk, ...], ... ], null, detectedLang, ... ]
  const translated = (data[0] || []).map((part) => part[0]).join('');
  const detected = data[2] || '';

  const result = { translated, detected };
  cache.set(text, result);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
  return result;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'translate') {
    translate(msg.text)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // keep the message channel open for the async response
  }
});

// --- Enable/disable toggle via the extension icon ---

async function getEnabled() {
  const { enabled = true } = await chrome.storage.local.get('enabled');
  return enabled;
}

async function updateBadge() {
  const on = await getEnabled();
  chrome.action.setBadgeText({ text: on ? 'ON' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: on ? '#43b581' : '#747f8d' });
}

chrome.action.onClicked.addListener(async () => {
  const on = await getEnabled();
  await chrome.storage.local.set({ enabled: !on });
  updateBadge();
});

chrome.runtime.onInstalled.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);
