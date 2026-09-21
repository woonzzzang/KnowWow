import type {Metadata} from "next";

import {AppShell} from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "KnowFlow · 제조 경험지식 플랫폼",
  description: "업무 로그의 패턴 차이를 사람에게 확인하고, 검증된 경험지식을 재사용하는 LangChain MVP",
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="ko">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}

