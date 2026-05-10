"use client";

import { QRCodeSVG } from "qrcode.react";

interface CarnetQRProps {
  slug: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ckmendoza.com.ar";

export default function CarnetQR({ slug }: CarnetQRProps) {
  const url = `${BASE_URL}/profesionales/${slug}`;
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
