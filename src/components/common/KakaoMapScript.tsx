import Script from 'next/script';

export function KakaoMapScript() {
  const kakaoKey =
    process.env.NEXT_PUBLIC_KAKAO_MAP_CLIENT_KEY ||
    process.env.NEXT_PUBLIC_KAKAO_JS_KEY ||
    '';

  if (!kakaoKey) return null;

  return (
    <Script
      id="kakao-maps-sdk"
      src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services,clusterer&autoload=false`}
      strategy="afterInteractive"
    />
  );
}
