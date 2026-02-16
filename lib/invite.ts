/**
 * Invite / Referral system utilities
 */

export function generateReferralCode(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function getReferralLink(code: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/kayit?ref=${code}`;
}

/** Fallback copy using a temporary textarea (works in dialogs / HTTP) */
function fallbackCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}

/** Copy text to clipboard with automatic fallback */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }
  return fallbackCopy(text);
}

export async function copyInviteLink(code: string): Promise<boolean> {
  const link = getReferralLink(code);
  return copyToClipboard(link);
}

export async function shareInvite(
  code: string,
  title: string,
  text: string
): Promise<boolean> {
  const link = getReferralLink(code);

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: link });
      return true;
    } catch {
      return false;
    }
  }

  return copyInviteLink(code);
}
