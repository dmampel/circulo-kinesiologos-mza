"use client";

import { QRCodeSVG } from "qrcode.react";
import { construirUrlAbsoluta } from "@/lib/site";

interface CarnetQRProps {
  slug: string;
}

export default function CarnetQR({ slug }: CarnetQRProps) {
  const url = construirUrlAbsoluta(`profesionales/${slug}`);
  return (
    <QRCodeSVG
      value={url}
      size={56}
      bgColor="transparent"
      fgColor="#ffffff"
      level="M"
    />
  );
}
