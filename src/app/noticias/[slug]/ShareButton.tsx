"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface Props {
  titulo: string;
  slug: string;
}

export default function ShareButton({ titulo, slug }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/noticias/${slug}`;
    if (navigator.share) {
      await navigator.share({ title: titulo, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      title="Compartir"
      className="shrink-0 p-2 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
    </button>
  );
}
