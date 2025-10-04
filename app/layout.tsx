export const metadata = {
  title: "MG Chat (Blob)",
  description: "Realtime-ish chat on Vercel Blob (no DB)",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
};

import "./globals.css";
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
