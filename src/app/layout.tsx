import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "すいみん日誌 | 日々の睡眠記録と改善アドバイス",
  description:
    "日々の就寝・起床・睡眠効率を自動計算し、グラフと具体的なアドバイスで睡眠の改善をサポートする睡眠日誌Webアプリです。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f8fc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased selection:bg-sky-200 selection:text-sky-950">
        {children}
      </body>
    </html>
  );
}
