import { NextResponse } from 'next/server';

interface PlaceResult {
  id: string;
  place_name: string;
  road_address_name: string;
  address_name: string;
  x: string; // longitude
  y: string; // latitude
  category_name?: string;
}

// 대한민국 주요 행사·전시·컨벤션 및 팝업 거점 큐레이션 데이터
const CURATED_VENUES: PlaceResult[] = [
  {
    id: 'coex-main',
    place_name: '코엑스 (COEX)',
    road_address_name: '서울 강남구 영동대로 513',
    address_name: '서울 강남구 삼성동 159',
    x: '127.0591105',
    y: '37.5118733',
    category_name: '문화,예술 > 전시관 > 컨벤션센터',
  },
  {
    id: 'coex-d-hall',
    place_name: '코엑스 3층 D홀',
    road_address_name: '서울 강남구 영동대로 513',
    address_name: '서울 강남구 삼성동 159',
    x: '127.0592',
    y: '37.5122',
    category_name: '전시관 > 코엑스 D홀',
  },
  {
    id: 'coex-c-hall',
    place_name: '코엑스 3층 C홀',
    road_address_name: '서울 강남구 영동대로 513',
    address_name: '서울 강남구 삼성동 159',
    x: '127.0588',
    y: '37.5125',
    category_name: '전시관 > 코엑스 C홀',
  },
  {
    id: 'coex-b-hall',
    place_name: '코엑스 1층 B홀',
    road_address_name: '서울 강남구 영동대로 513',
    address_name: '서울 강남구 삼성동 159',
    x: '127.0595',
    y: '37.5115',
    category_name: '전시관 > 코엑스 B홀',
  },
  {
    id: 'coex-a-hall',
    place_name: '코엑스 1층 A홀',
    road_address_name: '서울 강남구 영동대로 513',
    address_name: '서울 강남구 삼성동 159',
    x: '127.0585',
    y: '37.5110',
    category_name: '전시관 > 코엑스 A홀',
  },
  {
    id: 'setec-main',
    place_name: '세텍 (SETEC)',
    road_address_name: '서울 강남구 남부순환로 3104',
    address_name: '서울 강남구 대치동 514',
    x: '127.0694',
    y: '37.4952',
    category_name: '문화,예술 > 전시관 > 세텍',
  },
  {
    id: 'kintex-1',
    place_name: '킨텍스 제1전시장 (KINTEX)',
    road_address_name: '경기 고양시 일산서구 킨텍스로 217-60',
    address_name: '경기 고양시 일산서구 대화동 2600',
    x: '126.7456',
    y: '37.6687',
    category_name: '문화,예술 > 전시관 > 컨벤션센터',
  },
  {
    id: 'kintex-2',
    place_name: '킨텍스 제2전시장',
    road_address_name: '경기 고양시 일산서구 킨텍스로 217-59',
    address_name: '경기 고양시 일산서구 대화동 2700',
    x: '126.7410',
    y: '37.6635',
    category_name: '문화,예술 > 전시관 > 컨벤션센터',
  },
  {
    id: 'ddp-main',
    place_name: '동대문디자인플라자 (DDP)',
    road_address_name: '서울 중구 을지로 281',
    address_name: '서울 중구 을지로7가 2-1',
    x: '127.0098',
    y: '37.5665',
    category_name: '문화,예술 > 복합문화공간',
  },
  {
    id: 's-factory',
    place_name: '성수 에스팩토리 (S-Factory)',
    road_address_name: '서울 성동구 연무장15길 11',
    address_name: '서울 성동구 성수동2가 273-13',
    x: '127.0573',
    y: '37.5422',
    category_name: '문화,예술 > 복합문화공간',
  },
  {
    id: 'the-hyundai-seoul',
    place_name: '더현대 서울 (The Hyundai Seoul)',
    road_address_name: '서울 영등포구 여의대로 108',
    address_name: '서울 영등포구 여의도동 22',
    x: '126.9284',
    y: '37.5258',
    category_name: '쇼핑,유통 > 백화점',
  },
  {
    id: 'at-center',
    place_name: 'aT센터 (양재)',
    road_address_name: '서울 서초구 강남대로 27',
    address_name: '서울 서초구 양재동 232',
    x: '127.0402',
    y: '37.4704',
    category_name: '문화,예술 > 전시관',
  },
  {
    id: 'suwon-messe',
    place_name: '수원메쎄 (SUWON MESSE)',
    road_address_name: '경기 수원시 권선구 세화로 134',
    address_name: '경기 수원시 권선구 서둔동 408',
    x: '126.9961',
    y: '37.2625',
    category_name: '문화,예술 > 전시관',
  },
  {
    id: 'bexco-main',
    place_name: '벡스코 (BEXCO)',
    road_address_name: '부산 해운대구 APEC로 55',
    address_name: '부산 해운대구 우동 1500',
    x: '129.1359',
    y: '35.1693',
    category_name: '문화,예술 > 전시관 > 컨벤션센터',
  },
  {
    id: 'exco-main',
    place_name: '엑스코 (EXCO)',
    road_address_name: '대구 북구 엑스코로 10',
    address_name: '대구 북구 산격동 1676',
    x: '128.6146',
    y: '35.9069',
    category_name: '문화,예술 > 전시관',
  },
  {
    id: 'songdo-convensia',
    place_name: '송도컨벤시아',
    road_address_name: '인천 연수구 센트럴로 123',
    address_name: '인천 연수구 송도동 6-1',
    x: '126.6548',
    y: '37.3892',
    category_name: '문화,예술 > 전시관',
  },
  {
    id: 'lotte-world-mall',
    place_name: '잠실 롯데월드몰',
    road_address_name: '서울 송파구 올림픽로 300',
    address_name: '서울 송파구 신천동 29',
    x: '127.1044',
    y: '37.5137',
    category_name: '쇼핑,유통 > 복합쇼핑몰',
  },
  {
    id: 'kspo-dome',
    place_name: '올림픽공원 KSPO DOME',
    road_address_name: '서울 송파구 올림픽로 424',
    address_name: '서울 송파구 방이동 88-2',
    x: '127.1275',
    y: '37.5189',
    category_name: '스포츠,레저 > 경기장',
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const normalized = q.toLowerCase().replace(/\s+/g, '');

  // 1. 큐레이션 데이터 필터링 (높은 우선순위)
  const curatedMatches = CURATED_VENUES.filter((v) => {
    const nameMatch = v.place_name.toLowerCase().replace(/\s+/g, '').includes(normalized);
    const addrMatch = v.road_address_name.toLowerCase().replace(/\s+/g, '').includes(normalized);
    return nameMatch || addrMatch;
  });

  // 2. 외부 지오코딩 API (OpenStreetMap Nominatim) 검색
  let externalResults: PlaceResult[] = [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q
    )}&format=json&countrycodes=kr&addressdetails=1&limit=7`;

    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CrewLink-PlaceSearch/1.0 (https://crewlink.kr)',
        'Accept-Language': 'ko,en',
      },
      next: { revalidate: 3600 },
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        externalResults = data.map((item: any) => {
          const addr = item.address || {};
          const road = addr.road || addr.pedestrian || addr.suburb || '';
          const city = addr.city || addr.county || addr.borough || addr.province || '';
          const roadAddress = [city, road, addr.house_number].filter(Boolean).join(' ') || item.display_name.split(',').slice(0, 3).join(' ');

          return {
            id: `osm-${item.place_id}`,
            place_name: item.name || item.display_name.split(',')[0],
            road_address_name: roadAddress,
            address_name: item.display_name,
            x: item.lon,
            y: item.lat,
            category_name: item.type ? `장소 > ${item.type}` : '일반 장소',
          };
        });
      }
    }
  } catch (err) {
    // Timeout or network fallback
    console.warn('[Places API] Nominatim lookup fallback:', err);
  }

  // 중복 제거 및 결합 (큐레이션 우선)
  const combined = [...curatedMatches];
  const seenNames = new Set(curatedMatches.map((c) => c.place_name.trim()));

  for (const ext of externalResults) {
    if (!seenNames.has(ext.place_name.trim())) {
      seenNames.add(ext.place_name.trim());
      combined.push(ext);
    }
  }

  return NextResponse.json({ results: combined.slice(0, 8) });
}
