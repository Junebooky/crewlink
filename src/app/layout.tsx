import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { KakaoMapScript } from "@/components/common/KakaoMapScript";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "크루링크 | 행사와 크루를 잇다",
  description: "함께할 크루부터 현장 확인과 정산까지. 행사 운영을 한곳에서 이어가세요.",
  icons: {
    icon: [
      { url: "/crewlink_app_icon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/crewlink_app_icon.png",
    apple: "/crewlink_app_icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col w-full max-w-full overflow-x-hidden">
        {children}
        <KakaoMapScript />
      </body>
    </html>
  );
}

