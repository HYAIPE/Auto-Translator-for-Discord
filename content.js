// Content script: watches Discord's chat DOM and replaces message text
// in place with its English translation. A MutationObserver picks up new
// incoming messages, edited messages, channel switches, and history loaded
// by scrolling back — so nothing needs to be re-toggled manually.
//
// Translation happens per text node (not per element), so inline emojis,
// mentions, and links inside a message survive untouched. Hovering a
// message shows the original text in a tooltip.

(() => {
  const MESSAGE_SELECTOR = 'div[id^="message-content-"]';
  const TRANSLATED_CLASS = 'dt-translated';
  const TARGET_LANG = 'en';
  const MAX_CONCURRENT = 3;
  const HAS_LETTERS = /\p{L}/u;

  let enabled = true;
  let observer = null;

  // Per text node: { original, translated }. Lets us tell our own writes
  // apart from Discord's (no retranslation loops), retranslate after React
  // re-renders reset the text, and restore originals when toggled off.
  const nodeState = new WeakMap();
  const queued = new Set();
  const queue = [];
  let active = 0;

  // Translated messages are shown in bold so they stand out from
  // untranslated (already-English) ones.
  const style = document.createElement('style');
  style.textContent = `.${TRANSLATED_CLASS}, .${TRANSLATED_CLASS} * { font-weight: 700; }`;
  document.documentElement.appendChild(style);

  function textNodesOf(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  // --- Translation queue (limits concurrent requests to avoid rate limits) ---

  function enqueue(node) {
    if (queued.has(node)) return;
    queued.add(node);
    queue.push(node);
    pump();
  }

  function pump() {
    while (active < MAX_CONCURRENT && queue.length > 0) {
      const node = queue.shift();
      queued.delete(node);
      active++;
      handle(node).finally(() => {
        active--;
        pump();
      });
    }
  }

  async function handle(node) {
    if (!enabled || !node.isConnected) return;

    const value = node.nodeValue;
    const state = nodeState.get(node);
    // This is text we wrote ourselves (or already confirmed English) — skip.
    if (state && value === state.translated) return;

    const trimmed = value.trim();
    if (!trimmed || !HAS_LETTERS.test(trimmed)) return;

    let resp;
    try {
      resp = await chrome.runtime.sendMessage({ type: 'translate', text: trimmed });
    } catch (e) {
      // Extension was reloaded/updated; this page's script is orphaned.
      return;
    }
    if (!resp || !resp.ok) return; // retried on the next mutation

    // Text changed while the request was in flight; the observer already
    // re-queued the new value.
    if (node.nodeValue !== value) return;

    // Already English (or translation is identical) — mark done, leave as is.
    if (
      resp.detected === TARGET_LANG ||
      resp.translated.trim().toLowerCase() === trimmed.toLowerCase()
    ) {
      nodeState.set(node, { original: value, translated: value });
      return;
    }

    // Preserve the node's leading/trailing whitespace around the translation.
    const leading = value.match(/^\s*/)[0];
    const trailing = value.match(/\s*$/)[0];
    const replaced = leading + resp.translated.trim() + trailing;

    nodeState.set(node, { original: value, translated: replaced });
    node.nodeValue = replaced;
    updateTooltip(node);
  }

  // Mark the message as translated (bold) and show the untranslated
  // message text when hovering it.
  function updateTooltip(node) {
    const el = node.parentElement && node.parentElement.closest(MESSAGE_SELECTOR);
    if (!el) return;
    el.classList.add(TRANSLATED_CLASS);
    const original = textNodesOf(el)
      .map((n) => {
        const s = nodeState.get(n);
        return s && n.nodeValue === s.translated ? s.original : n.nodeValue;
      })
      .join('');
    el.title = 'Original: ' + original.trim();
  }

  // --- DOM scanning ---

  function processElement(el) {
    for (const node of textNodesOf(el)) enqueue(node);
  }

  function scan(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      const el = root.parentElement && root.parentElement.closest(MESSAGE_SELECTOR);
      if (el) enqueue(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.matches(MESSAGE_SELECTOR)) processElement(root);
    for (const el of root.querySelectorAll(MESSAGE_SELECTOR)) processElement(el);
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'characterData') {
          // Text edited in place (message edit, or React resetting our text).
          const parent = m.target.parentElement;
          if (parent && parent.closest(MESSAGE_SELECTOR)) enqueue(m.target);
        } else {
          for (const node of m.addedNodes) scan(node);
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    scan(document.body);
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    queue.length = 0;
    queued.clear();
    // Restore original text for everything currently on screen. Off-screen
    // messages are recreated fresh by Discord when scrolled back into view.
    for (const el of document.querySelectorAll(MESSAGE_SELECTOR)) {
      for (const node of textNodesOf(el)) {
        const s = nodeState.get(node);
        if (s && node.nodeValue === s.translated) node.nodeValue = s.original;
      }
      el.removeAttribute('title');
      el.classList.remove(TRANSLATED_CLASS);
    }
  }

  // --- Enable/disable wiring ---

  chrome.storage.local.get('enabled').then(({ enabled: on = true }) => {
    enabled = on;
    if (enabled) startObserver();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !('enabled' in changes)) return;
    enabled = changes.enabled.newValue !== false;
    if (enabled) startObserver();
    else stopObserver();
  });
})();
