#!/usr/bin/env python3
"""
판례 데이터 동기화 스크립트
Perplexity로 검증된 실제 판례를 SQLite DB에 동기화
"""
import sqlite3
import json
from datetime import datetime
from pathlib import Path

# 경로 설정
DB_PATH = Path("/Users/seunghan/law/korea-law/data/korea-law.db")

# ============================================================================
# Perplexity 검증된 실제 판례 데이터 (28개)
# ============================================================================

REAL_PRECEDENTS = [
    # ===== 노동법 관련 판례 =====
    {
        "precedent_serial_number": 1001,
        "case_id": "2021다225074",
        "court": "대법원",
        "decision_date": "2025-10-30",
        "case_type": "임금",
        "case_name": "소정근로시간 합의 효력과 최저임금 적용 기준",
        "summary": "격일제 근무형태에서 연장근로시간은 최저임금 지급 대상 시간에 포함되지 않으며, 최저임금 지급 대상 시간인 1일 소정근로시간은 8시간으로 본다",
        "key_points": "최저임금|소정근로시간|격일제|연장근로",
        "referenced_statutes": "근로기준법 제15조|근로기준법 제18조|최저임금법 제5조",
        "sync_priority": "high"
    },
    {
        "precedent_serial_number": 1002,
        "case_id": "2024두54683",
        "court": "대법원",
        "decision_date": "2025-03-13",
        "case_type": "부당해고구제재심판정취소",
        "case_name": "부당해고 구제 신청 후 원직복직과 금전보상명령",
        "summary": "사용자가 해고를 취소하여 원직복직을 명하고 임금 상당액을 지급한 경우, 근로자의 금전보상명령을 받을 구제이익이 소멸한다",
        "key_points": "부당해고|원직복직|금전보상명령|구제이익",
        "referenced_statutes": "근로기준법 제30조 제3항",
        "sync_priority": "high"
    },
    {
        "precedent_serial_number": 1003,
        "case_id": "2024다229794",
        "court": "대법원",
        "decision_date": "2025-11-06",
        "case_type": "임금",
        "case_name": "격일제 근무 형태에서 최저임금 적용",
        "summary": "격일제 근무 형태에서 최저임금액 이상의 임금을 지급해야 하는 소정근로시간이 1일 8시간에 제한된다",
        "key_points": "격일제|최저임금|소정근로시간|운전종사원",
        "referenced_statutes": "근로기준법 제2조|근로기준법 제15조|최저임금법 제5조",
        "sync_priority": "high"
    },
    {
        "precedent_serial_number": 1004,
        "case_id": "2024다293092",
        "court": "대법원",
        "decision_date": "2025-02-20",
        "case_type": "임금",
        "case_name": "대학교 기간제 교원 취업규칙 변경",
        "summary": "기본급을 인상하면서 상여수당을 삭감한 취업규칙의 변경이 근로자에게 불이익한 변경에 해당하는지 여부",
        "key_points": "취업규칙|불이익변경|기간제교원|상여수당",
        "referenced_statutes": "근로기준법 제94조",
        "sync_priority": "high"
    },
    {
        "precedent_serial_number": 1005,
        "case_id": "96다56306",
        "court": "대법원",
        "decision_date": "1997-09-12",
        "case_type": "퇴직금",
        "case_name": "근로조건 변경의 기본 법리",
        "summary": "근로조건은 근로자와 사용자가 동등한 지위에서 자유의사에 의하여 결정되어야 하며, 사용자가 일방적으로 불이익하게 변경하는 것은 허용될 수 없다",
        "key_points": "근로조건|불이익변경|자유의사|퇴직금",
        "referenced_statutes": "근로기준법 제3조",
        "sync_priority": "medium"
    },
    {
        "precedent_serial_number": 1006,
        "case_id": "92다24509",
        "court": "대법원",
        "decision_date": "1993-05-27",
        "case_type": "임금",
        "case_name": "근로시간의 정의와 대기시간 처리",
        "summary": "작업시간 중 실제 작업에 종사하지 않은 대기시간이라도 사용자의 지휘감독 아래 있는 시간은 근로시간에 포함된다",
        "key_points": "근로시간|대기시간|휴게시간|지휘감독",
        "referenced_statutes": "근로기준법 제2조|근로기준법 제46조",
        "sync_priority": "medium"
    },
    # ===== 민사 손해배상 판례 =====
    {
        "precedent_serial_number": 1007,
        "case_id": "2020다277306",
        "court": "대법원",
        "decision_date": "2021-10-14",
        "case_type": "손해배상(기)",
        "case_name": "손해배상책임 인정 후 손해액 산정",
        "summary": "손해배상책임이 인정되나 손해액 증명이 미흡한 경우, 법원은 간접사실들을 종합하여 적당한 금액을 손해액으로 정할 수 있다",
        "key_points": "손해배상|손해액산정|간접사실|증명책임",
        "referenced_statutes": "민법 제750조|민사소송법 제202조의2",
        "sync_priority": "high"
    },
    {
        "precedent_serial_number": 1008,
        "case_id": "98다43632",
        "court": "대법원",
        "decision_date": "1999-07-13",
        "case_type": "손해배상(기)",
        "case_name": "명예훼손의 의미와 사회적 평가",
        "summary": "명예훼손이란 단순히 주관적인 명예감정을 침해하는 것만으로는 부족하고 그 사회적 평가를 저하시키는 행위를 뜻한다",
        "key_points": "명예훼손|사회적평가|명예감정|손해배상",
        "referenced_statutes": "민법 제750조|민법 제751조",
        "sync_priority": "medium"
    },
    {
        "precedent_serial_number": 1009,
        "case_id": "2021다270555",
        "court": "대법원",
        "decision_date": "2022-08-11",
        "case_type": "손해배상",
        "case_name": "교통사고로 인한 정신건강 손상과 손해배상",
        "summary": "교통사고로 인한 외상 후 스트레스장애, 주요우울장애 등 정신건강 손상도 가해자의 배상 책임 범위에 포함된다",
        "key_points": "교통사고|외상후스트레스장애|정신건강|손해배상",
        "referenced_statutes": "민법 제750조",
        "sync_priority": "medium"
    },
    # ===== 형사 판례 =====
    {
        "precedent_serial_number": 1010,
        "case_id": "2024도18441",
        "court": "대법원",
        "decision_date": "2025-03-27",
        "case_type": "사기",
        "case_name": "사기죄의 기망행위 요건",
        "summary": "사기죄가 성립하기 위해서는 반드시 사람에 대한 기망행위가 있어야 하며, 카드회사 직원이 개입하지 않은 자동대출은 사기죄에 해당하지 않는다",
        "key_points": "사기죄|기망행위|카드론|자동대출",
        "referenced_statutes": "형법 제347조",
        "sync_priority": "high"
    },
    {
        "precedent_serial_number": 1011,
        "case_id": "70도704",
        "court": "대법원",
        "decision_date": "1970-05-26",
        "case_type": "명예훼손",
        "case_name": "명예훼손죄와 피해자 의사",
        "summary": "명예훼손죄는 피해자의 명시한 의사에 반하여 논할 수 없으며, 처벌을 요구하지 않는다는 명백한 의사표시가 있으면 처벌할 수 없다",
        "key_points": "명예훼손|반의사불벌죄|피해자의사|처벌",
        "referenced_statutes": "형법 제307조|형법 제312조 제2항",
        "sync_priority": "medium"
    },
    {
        "precedent_serial_number": 1012,
        "case_id": "2024도18320",
        "court": "대법원",
        "decision_date": "2025-02-13",
        "case_type": "명예훼손",
        "case_name": "위안부 관련 명예훼손 사건",
        "summary": "대학교 교수가 수업 중 위안부 여성들에 대한 허위사실을 말한 사건에서 일부 무죄, 일부 유죄 판단",
        "key_points": "명예훼손|위안부|허위사실|수업",
        "referenced_statutes": "형법 제307조",
        "sync_priority": "high"
    },
    {
        "precedent_serial_number": 1013,
        "case_id": "2018도2738",
        "court": "대법원",
        "decision_date": "2018-07-19",
        "case_type": "뇌물수수",
        "case_name": "공무원과 비공무원의 뇌물수수 공동정범",
        "summary": "비공무원이 공무원과 공동가공의 의사로 뇌물을 수수한 경우 뇌물수수죄의 공동정범이 성립한다",
        "key_points": "뇌물수수|공동정범|공무원|비공무원",
        "referenced_statutes": "형법 제129조 제1항|형법 제130조",
        "sync_priority": "medium"
    },
    {
        "precedent_serial_number": 1014,
        "case_id": "2025도4697",
        "court": "대법원",
        "decision_date": "2025-05-01",
        "case_type": "공직선거법위반",
        "case_name": "정치적 발언과 범죄 성립 관계",
        "summary": "전원합의체 판결로 특정 정책에 대한 비판적 발언이 형사 범죄에 해당하는지 여부 판단",
        "key_points": "공직선거법|정치발언|표현의자유|전원합의체",
        "referenced_statutes": "공직선거법",
        "sync_priority": "high"
    },
    # ===== 부동산/임대차 판례 =====
    {
        "precedent_serial_number": 1015,
        "case_id": "2024다326398",
        "court": "대법원",
        "decision_date": "2025-04-15",
        "case_type": "임대차보증금반환",
        "case_name": "주택임차권의 대항력 소멸",
        "summary": "주택 임차인이 점유를 상실한 후 임차권등기를 마쳐도 대항력이 소급하여 회복되지 않으며, 등기 시점부터 새로운 대항력이 발생한다",
        "key_points": "주택임대차|대항력|점유|임차권등기",
        "referenced_statutes": "주택임대차보호법 제3조 제1항",
        "sync_priority": "high"
    },
    {
        "precedent_serial_number": 1016,
        "case_id": "2024두47890",
        "court": "대법원",
        "decision_date": "2025-02-27",
        "case_type": "사용허가신청불허가처분취소",
        "case_name": "행정재산 사용수익 거부처분",
        "summary": "공법상 계약을 기초로 행정재산에 대한 무상 사용수익을 신청했다가 거부처분을 받은 경우의 처분 취소 청구",
        "key_points": "행정재산|사용허가|거부처분|무상사용",
        "referenced_statutes": "국유재산법|공유재산법",
        "sync_priority": "medium"
    },
    # ===== 상속/유류분 판례 =====
    {
        "precedent_serial_number": 1017,
        "case_id": "2019다222867",
        "court": "대법원",
        "decision_date": "2023-05-18",
        "case_type": "유류분반환",
        "case_name": "증여재산의 처분과 유류분 가액산정",
        "summary": "피상속인이 증여한 재산이 수용된 경우, 증여재산의 가액은 수용 시점부터 상속개시까지의 물가변동률을 반영하여 산정한다",
        "key_points": "유류분|증여재산|수용|물가변동률",
        "referenced_statutes": "민법 제1113조 제1항|민법 제1114조",
        "sync_priority": "medium"
    },
    # ===== 이혼/위자료 판례 =====
    {
        "precedent_serial_number": 1018,
        "case_id": "2024므13669",
        "court": "대법원",
        "decision_date": "2025-10-16",
        "case_type": "이혼등",
        "case_name": "이혼 위자료 및 재산분할",
        "summary": "법률혼주의 아래에서 유효한 혼인 관계에서 비롯된 위자료청구권과 재산분할청구권의 성립 기준",
        "key_points": "이혼|위자료|재산분할|법률혼주의",
        "referenced_statutes": "민법 제746조|민법 제806조|민법 제839조의2",
        "sync_priority": "high"
    },
    # ===== 의료사고 판례 =====
    {
        "precedent_serial_number": 1019,
        "case_id": "2022다219427",
        "court": "대법원",
        "decision_date": "2023-08-31",
        "case_type": "손해배상",
        "case_name": "마취 중 감시 업무 소홀로 인한 의료과실",
        "summary": "마취담당 의사가 감시 업무를 소홀히 하여 응급상황에서 즉시 대응하지 못한 경우 진료상 과실이 인정된다",
        "key_points": "의료과실|마취|감시의무|응급조치",
        "referenced_statutes": "민법 제750조|의료법 제37조",
        "sync_priority": "medium"
    },
    {
        "precedent_serial_number": 1020,
        "case_id": "2020다244511",
        "court": "대법원",
        "decision_date": "2020-11-26",
        "case_type": "손해배상",
        "case_name": "의료수준의 기준과 주의의무",
        "summary": "의료행위가 당시의 의료수준에 비추어 최선을 다한 것으로 인정되면 주의의무 위반이 없다",
        "key_points": "의료수준|주의의무|낙상사고|중환자실",
        "referenced_statutes": "민법 제750조|민법 제751조",
        "sync_priority": "medium"
    },
    # ===== 교통사고/음주운전 판례 =====
    {
        "precedent_serial_number": 1021,
        "case_id": "94누16168",
        "court": "대법원",
        "decision_date": "1996-01-26",
        "case_type": "운전면허취소처분취소",
        "case_name": "음주운전 면허취소의 재량",
        "summary": "음주운전으로 인한 운전면허 취소에서는 당사자의 불이익보다 일반예방적 측면이 강조되어야 한다",
        "key_points": "음주운전|면허취소|재량행위|일반예방",
        "referenced_statutes": "도로교통법 제44조|도로교통법 제93조",
        "sync_priority": "medium"
    },
    {
        "precedent_serial_number": 1022,
        "case_id": "2017도661",
        "court": "대법원",
        "decision_date": "2017-09-21",
        "case_type": "도로교통법위반",
        "case_name": "호흡측정과 채혈측정의 우선순위",
        "summary": "호흡측정이 이루어진 경우, 운전자의 불복이 없는 한 재측정은 원칙적으로 허용되지 않는다",
        "key_points": "음주측정|호흡측정|채혈측정|재측정",
        "referenced_statutes": "도로교통법 제44조 제2항|도로교통법 제44조 제3항",
        "sync_priority": "medium"
    },
    # ===== IT/게임 관련 판례 =====
    {
        "precedent_serial_number": 1023,
        "case_id": "2012도11505",
        "court": "대법원",
        "decision_date": "2012-12-13",
        "case_type": "게임산업진흥에관한법률위반",
        "case_name": "게임산업진흥법상 환전행위의 범위",
        "summary": "게임산업법의 '환전'은 게임결과물을 수령하고 돈을 교부하는 행위뿐만 아니라 게임결과물을 교부하고 돈을 수령하는 행위도 포함한다",
        "key_points": "게임산업법|환전|게임머니|게임결과물",
        "referenced_statutes": "게임산업진흥에 관한 법률 제32조 제1항 제7호",
        "sync_priority": "medium"
    },
    # ===== 지식재산권 판례 =====
    {
        "precedent_serial_number": 1024,
        "case_id": "2024도8174",
        "court": "대법원",
        "decision_date": "2025-11-20",
        "case_type": "상표법위반",
        "case_name": "상표의 유사 여부 판단",
        "summary": "립스틱 상품의 광고에 사용한 상표가 등록상표와 유사하여 상표권을 침해하였는지 여부",
        "key_points": "상표권|상표유사|립스틱|상표침해",
        "referenced_statutes": "상표법 제93조",
        "sync_priority": "medium"
    },
    {
        "precedent_serial_number": 1025,
        "case_id": "2024도14181",
        "court": "대법원",
        "decision_date": "2025-01-15",
        "case_type": "저작권법위반",
        "case_name": "교재 저작권 양도 후 배포행위",
        "summary": "교재 저작권 양도 후 동일 교재 배포행위를 저작권 침해로 본 유죄 확정 판결",
        "key_points": "저작권|교재|배포|양도",
        "referenced_statutes": "저작권법 제136조",
        "sync_priority": "medium"
    },
    {
        "precedent_serial_number": 1026,
        "case_id": "2025다209384",
        "court": "대법원",
        "decision_date": "2025-07-03",
        "case_type": "저작권침해금지",
        "case_name": "공동저작권자의 지분 승계",
        "summary": "공동저작권자의 지분 승계와 제3자에 대한 이용허락의 금지에 관한 법리",
        "key_points": "공동저작권|지분승계|이용허락|저작권분쟁",
        "referenced_statutes": "저작권법 제48조",
        "sync_priority": "medium"
    },
    # ===== 부당이득/금융 판례 =====
    {
        "precedent_serial_number": 1027,
        "case_id": "2023다281009",
        "court": "대법원",
        "decision_date": "2024-11-14",
        "case_type": "부당이득금",
        "case_name": "보이스피싱 피해자의 부당이득반환청구",
        "summary": "보이스피싱 피해자가 사기범에게 송금한 돈을 인출한 자에 대해 부당이득반환을 청구할 수 있는지 여부",
        "key_points": "보이스피싱|부당이득|사기|송금",
        "referenced_statutes": "민법 제741조|민법 제746조",
        "sync_priority": "high"
    },
    {
        "precedent_serial_number": 1028,
        "case_id": "2020다254846",
        "court": "대법원",
        "decision_date": "2021-01-28",
        "case_type": "부당이득금",
        "case_name": "착오송금에서 부당이득반환의무",
        "summary": "착오로 계좌이체된 금원에 대해 예금채권을 취득한 수취인은 송금인에게 부당이득반환의무가 있다",
        "key_points": "착오송금|부당이득|예금채권|계좌이체",
        "referenced_statutes": "민법 제741조",
        "sync_priority": "medium"
    }
]


def normalize_case_id(case_id: str) -> str:
    """사건번호 정규화"""
    return case_id.replace(" ", "").strip()


def sync_precedents():
    """판례 데이터 DB에 동기화"""
    print("=" * 60)
    print("판례 데이터 동기화 시작")
    print("=" * 60)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 기존 데이터 확인
    cursor.execute("SELECT COUNT(*) FROM Precedents")
    existing_count = cursor.fetchone()[0]
    print(f"\n기존 판례 수: {existing_count}")

    # 새 데이터 삽입
    inserted = 0
    updated = 0

    for p in REAL_PRECEDENTS:
        case_id = p["case_id"]
        case_id_normalized = normalize_case_id(case_id)

        # 기존 데이터 확인
        cursor.execute("SELECT id FROM Precedents WHERE case_id = ?", (case_id,))
        existing = cursor.fetchone()

        if existing:
            # 업데이트
            cursor.execute("""
                UPDATE Precedents SET
                    case_id_normalized = ?,
                    court = ?,
                    case_type = ?,
                    decision_date = ?,
                    case_name = ?,
                    summary = ?,
                    key_points = ?,
                    referenced_statutes = ?,
                    sync_priority = ?,
                    exists_verified = 1,
                    last_verified_at = ?,
                    updated_at = ?
                WHERE case_id = ?
            """, (
                case_id_normalized,
                p["court"],
                p["case_type"],
                p["decision_date"],
                p["case_name"],
                p["summary"],
                p["key_points"],
                p["referenced_statutes"],
                p["sync_priority"],
                datetime.now().isoformat(),
                datetime.now().isoformat(),
                case_id
            ))
            updated += 1
        else:
            # 새로 삽입
            cursor.execute("""
                INSERT INTO Precedents (
                    precedent_serial_number,
                    case_id,
                    case_id_normalized,
                    court,
                    case_type,
                    decision_date,
                    case_name,
                    summary,
                    key_points,
                    referenced_statutes,
                    sync_priority,
                    exists_verified,
                    last_verified_at,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
            """, (
                p["precedent_serial_number"],
                case_id,
                case_id_normalized,
                p["court"],
                p["case_type"],
                p["decision_date"],
                p["case_name"],
                p["summary"],
                p["key_points"],
                p["referenced_statutes"],
                p["sync_priority"],
                datetime.now().isoformat(),
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ))
            inserted += 1

    conn.commit()

    # 결과 확인
    cursor.execute("SELECT COUNT(*) FROM Precedents")
    final_count = cursor.fetchone()[0]

    print(f"\n✅ 동기화 완료!")
    print(f"   - 새로 삽입: {inserted}건")
    print(f"   - 업데이트: {updated}건")
    print(f"   - 최종 판례 수: {final_count}건")

    # 통계
    print("\n📊 판례 유형별 분포:")
    cursor.execute("""
        SELECT case_type, COUNT(*) as cnt
        FROM Precedents
        GROUP BY case_type
        ORDER BY cnt DESC
    """)
    for row in cursor.fetchall():
        print(f"   - {row[0]}: {row[1]}건")

    print("\n📊 법원별 분포:")
    cursor.execute("""
        SELECT court, COUNT(*) as cnt
        FROM Precedents
        GROUP BY court
        ORDER BY cnt DESC
    """)
    for row in cursor.fetchall():
        print(f"   - {row[0]}: {row[1]}건")

    conn.close()
    print("\n" + "=" * 60)


if __name__ == "__main__":
    sync_precedents()
