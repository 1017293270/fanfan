type ClipboardLike = {
  writeText: (text: string) => Promise<void>;
};

type TextareaLike = {
  value: string;
  style: Record<string, string>;
  setAttribute: (name: string, value: string) => void;
  select: () => void;
  remove: () => void;
};

type DocumentLike = {
  body: {
    appendChild: (node: TextareaLike) => unknown;
  };
  createElement: (tagName: 'textarea') => TextareaLike;
  execCommand?: (command: 'copy') => boolean;
};

type CopyTextOptions = {
  clipboard?: ClipboardLike;
  document?: DocumentLike;
};

function defaultClipboard(): ClipboardLike | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return navigator.clipboard;
}

function defaultDocument(): DocumentLike | undefined {
  if (typeof document === 'undefined') return undefined;
  return document as unknown as DocumentLike;
}

function fallbackCopy(text: string, doc: DocumentLike) {
  const textarea = doc.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  doc.body.appendChild(textarea);
  textarea.select();

  try {
    if (!doc.execCommand?.('copy')) {
      throw new Error('Copy command failed');
    }
  } finally {
    textarea.remove();
  }
}

export async function copyTextToClipboard(text: string, options: CopyTextOptions = {}) {
  const clipboard = options.clipboard ?? defaultClipboard();
  if (clipboard) {
    try {
      await clipboard.writeText(text);
      return;
    } catch {
      // Some mobile browsers expose the API but reject outside secure/allowed contexts.
    }
  }

  const doc = options.document ?? defaultDocument();
  if (!doc) throw new Error('Clipboard unavailable');
  fallbackCopy(text, doc);
}
