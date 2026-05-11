"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";

interface SafeLogoImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function SafeLogoImage({ src, alt, className, fallback }: SafeLogoImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return <>{fallback ?? <ShoppingBag className="h-6 w-6 text-slate-300" />}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className ?? "h-full w-full object-contain"}
      onError={() => setError(true)}
    />
  );
}
