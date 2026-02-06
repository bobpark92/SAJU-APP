// app/components/KakaoScript.tsx
"use client";

import Script from "next/script";

export default function KakaoScript() {
  const onLoad = () => {
    // 여기에 사용자님의 키를 직접 넣었습니다.
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init("35ce6b06959807394a004fd6fc0922b2"); 
      console.log("✅ Kakao SDK Initialized globally");
    }
  };

  return (
    <Script
      src="https://t.kakao.com/sdk/js/kakao.min.js"
      strategy="afterInteractive"
      onLoad={onLoad}
    />
  );
}