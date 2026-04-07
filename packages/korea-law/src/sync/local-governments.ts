/**
 * korea-law: 전국 지방자치단체 목록
 *
 * 국가법령정보센터 자치법규 조회용 지자체 코드
 */

export interface LocalGovernment {
  code: string;
  name: string;
  type: '특별시' | '광역시' | '도' | '특별자치시' | '특별자치도';
}

/**
 * 전국 광역 지방자치단체 목록 (17개)
 */
export const METROPOLITAN_GOVERNMENTS: LocalGovernment[] = [
  { code: '6110000', name: '서울특별시', type: '특별시' },
  { code: '6260000', name: '부산광역시', type: '광역시' },
  { code: '6270000', name: '대구광역시', type: '광역시' },
  { code: '6280000', name: '인천광역시', type: '광역시' },
  { code: '6290000', name: '광주광역시', type: '광역시' },
  { code: '6300000', name: '대전광역시', type: '광역시' },
  { code: '6310000', name: '울산광역시', type: '광역시' },
  { code: '5690000', name: '세종특별자치시', type: '특별자치시' },
  { code: '6410000', name: '경기도', type: '도' },
  { code: '6510000', name: '강원도', type: '도' },
  { code: '6430000', name: '충청북도', type: '도' },
  { code: '6440000', name: '충청남도', type: '도' },
  { code: '6450000', name: '전라북도', type: '도' },
  { code: '6460000', name: '전라남도', type: '도' },
  { code: '6470000', name: '경상북도', type: '도' },
  { code: '6480000', name: '경상남도', type: '도' },
  { code: '5690000', name: '제주특별자치도', type: '특별자치도' },
];

/**
 * 주요 기초 지방자치단체 목록 (시군구 - 샘플)
 * 실제로는 243개 전체를 포함해야 하지만, 샘플로 일부만 포함
 */
export const BASIC_GOVERNMENTS_SAMPLE = [
  // 서울특별시 (25개 구)
  { code: '3020000', name: '종로구', parent: '6110000' },
  { code: '3030000', name: '중구', parent: '6110000' },
  { code: '3050000', name: '용산구', parent: '6110000' },
  { code: '3060000', name: '성동구', parent: '6110000' },
  { code: '3070000', name: '광진구', parent: '6110000' },
  { code: '3080000', name: '동대문구', parent: '6110000' },
  { code: '3090000', name: '중랑구', parent: '6110000' },
  { code: '3100000', name: '성북구', parent: '6110000' },
  { code: '3110000', name: '강북구', parent: '6110000' },
  { code: '3120000', name: '도봉구', parent: '6110000' },
  { code: '3130000', name: '노원구', parent: '6110000' },
  { code: '3140000', name: '은평구', parent: '6110000' },
  { code: '3150000', name: '서대문구', parent: '6110000' },
  { code: '3160000', name: '마포구', parent: '6110000' },
  { code: '3170000', name: '양천구', parent: '6110000' },
  { code: '3180000', name: '강서구', parent: '6110000' },
  { code: '3190000', name: '구로구', parent: '6110000' },
  { code: '3200000', name: '금천구', parent: '6110000' },
  { code: '3210000', name: '영등포구', parent: '6110000' },
  { code: '3220000', name: '동작구', parent: '6110000' },
  { code: '3230000', name: '관악구', parent: '6110000' },
  { code: '3240000', name: '서초구', parent: '6110000' },
  { code: '3250000', name: '강남구', parent: '6110000' },
  { code: '3260000', name: '송파구', parent: '6110000' },
  { code: '3270000', name: '강동구', parent: '6110000' },
];

/**
 * 지자체 코드로 이름 조회
 */
export function getLocalGovernmentName(code: string): string | null {
  const metro = METROPOLITAN_GOVERNMENTS.find(g => g.code === code);
  if (metro) return metro.name;

  const basic = BASIC_GOVERNMENTS_SAMPLE.find(g => g.code === code);
  if (basic) return basic.name;

  return null;
}
