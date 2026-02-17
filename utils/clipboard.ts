export const copyTextToClipboard = async (text: string): Promise<{ ok: boolean; error?: string }> => {
  const value = String(text || '');
  if (!value) return { ok: false, error: 'Nothing to copy' };

  // Preferred modern API (requires secure context).
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return { ok: true };
    }
  } catch {
    // fall through to legacy method
  }

  // Legacy fallback: temporary textarea + execCommand.
  try {
    if (typeof document === 'undefined') return { ok: false, error: 'Clipboard not available' };
    const el = document.createElement('textarea');
    el.value = value;
    el.setAttribute('readonly', 'true');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    el.style.top = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok ? { ok: true } : { ok: false, error: 'Copy failed' };
  } catch {
    return { ok: false, error: 'Copy failed' };
  }
};

