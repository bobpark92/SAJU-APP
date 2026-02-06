// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // (기존 CSS 임포트가 있다면 유지)
import KakaoScript from "./components/KakaoScript"; // 👈 방금 만든 파일 임포트

export const metadata: Metadata = {
  title: "당분간무료사주",
  description: "사주 분석 서비스",
};

declare global {
  interface Window {
    Kakao: any;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <KakaoScript /> {/* 👈 여기에 스크립트 컴포넌트 추가! */}
      </body>
    </html>
  );
}