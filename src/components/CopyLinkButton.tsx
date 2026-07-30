"use client";

import { useState } from "react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS); select-the-URL-bar fallback not worth code.
    }
  }

  return (
    <button
      onClick={copy}
      title="Copy link to this view"
      className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-emerald-400 hover:bg-gray-700 transition-colors"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
