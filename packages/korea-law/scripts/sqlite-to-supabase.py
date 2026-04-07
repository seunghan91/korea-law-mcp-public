#!/usr/bin/env python3
"""
SQLite에서 Supabase로 데이터 마이그레이션
로컬 korea-law.db의 모든 데이터를 Supabase에 업로드
"""
import argparse
import base64
import sqlite3
import json
import http.client
import ssl
import os
import sys
from urllib.parse import urlparse

# .env 파일에서 환경변수 로드
def load_dotenv(env_path):
    """간단한 .env 파일 파서"""
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, _, value = line.partition('=')
                    # 따옴표 제거
                    value = value.strip().strip('"').strip("'")
                    env_vars[key.strip()] = value
    return env_vars

# .env 파일 로드
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '..', '.env')
env_vars = load_dotenv(env_path)

# Supabase 설정 (환경변수 또는 .env에서 읽기)
SUPABASE_URL = os.environ.get("SUPABASE_URL") or env_vars.get("SUPABASE_URL", "")
# SERVICE_KEY 우선, 없으면 ROLE_KEY, 없으면 ANON_KEY 사용
SUPABASE_SERVICE_KEY = (
    os.environ.get("SUPABASE_SERVICE_KEY") or 
    env_vars.get("SUPABASE_SERVICE_KEY") or
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or 
    env_vars.get("SUPABASE_SERVICE_ROLE_KEY") or
    os.environ.get("SUPABASE_ANON_KEY") or 
    env_vars.get("SUPABASE_ANON_KEY", "")
)

# 로컬 DB 경로
DB_PATH = os.path.join(os.path.dirname(__file__), "../data/korea-law.db")

BATCH_SIZE = 50  # 배치 크기

def _b64url_decode(data: str) -> bytes:
    padding = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)

def get_jwt_role(token: str) -> str | None:
    parts = (token or '').split('.')
    if len(parts) != 3:
        return None
    try:
        payload = json.loads(_b64url_decode(parts[1]).decode('utf-8'))
        role = payload.get('role')
        if isinstance(role, str):
            return role
        return None
    except Exception:
        return None

def make_request(method, path, data=None):
    """HTTPS 요청 수행"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("SUPABASE_URL과 SUPABASE_SERVICE_KEY 환경변수를 설정하세요")
    
    parsed = urlparse(SUPABASE_URL)
    # SSL 인증서 검증 (macOS certifi 문제 우회)
    context = ssl.create_default_context()
    try:
        import certifi
        context.load_verify_locations(certifi.where())
    except ImportError:
        # certifi 없으면 시스템 인증서 사용 시도, 실패 시 검증 비활성화
        try:
            context.load_default_certs()
        except Exception:
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
    conn = http.client.HTTPSConnection(parsed.netloc, context=context)
    
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    body = json.dumps(data) if data else None
    conn.request(method, path, body, headers)
    response = conn.getresponse()
    result = response.read().decode('utf-8')
    conn.close()
    return response.status, result


def get_sqlite_data(cursor, table, columns):
    """SQLite에서 데이터 읽기"""
    cursor.execute(f"SELECT {', '.join(columns)} FROM {table}")
    rows = cursor.fetchall()
    return [dict(zip(columns, row)) for row in rows]


def upload_laws(cursor):
    """Laws 테이블 업로드"""
    print("\n📋 Laws 데이터 업로드 중...")
    
    columns = ['id', 'law_mst_id', 'law_name', 'law_name_eng', 'law_name_normalized', 
               'promulgation_date', 'enforcement_date', 'law_type', 'ministry', 
               'source_url', 'checksum']
    
    laws = get_sqlite_data(cursor, 'Laws', columns)
    print(f"   총 {len(laws)}개 법령")
    
    success = 0
    for i in range(0, len(laws), BATCH_SIZE):
        batch = laws[i:i + BATCH_SIZE]
        
        # None 값 처리
        for law in batch:
            for key in law:
                if law[key] == '':
                    law[key] = None
        
        status, result = make_request("POST", "/rest/v1/laws?on_conflict=id", batch)
        
        if status in (200, 201):
            success += len(batch)
            print(f"   ✅ {success}/{len(laws)} 업로드 완료")
        else:
            print(f"   ❌ 배치 실패 (status {status}): {result[:200]}")
    
    return success


def upload_articles(cursor, start_from_id: int = 0):
    """Articles 테이블 업로드"""
    print("\n📄 Articles 데이터 업로드 중...")
    
    columns = ['id', 'law_id', 'article_no', 'article_no_normalized', 
               'article_title', 'content', 'paragraph_count', 'is_definition']
    
    if start_from_id > 0:
        cursor.execute(
            """
            SELECT id, law_id, article_no, article_no_normalized,
                   article_title, content, paragraph_count, is_definition
            FROM Articles
            WHERE id >= ? AND law_id IN (SELECT id FROM Laws)
            ORDER BY id
            """,
            (start_from_id,),
        )
    else:
        cursor.execute(
            """
            SELECT id, law_id, article_no, article_no_normalized,
                   article_title, content, paragraph_count, is_definition
            FROM Articles
            WHERE law_id IN (SELECT id FROM Laws)
            ORDER BY id
            """
        )
    
    total = 0
    success = 0
    batch = []
    
    # 스트리밍으로 처리 (메모리 효율)
    while True:
        rows = cursor.fetchmany(BATCH_SIZE)
        if not rows:
            break
        
        batch = []
        for row in rows:
            article = dict(zip(columns, row))
            # 콘텐츠 길이 제한 (Supabase 제한 대비)
            if article['content'] and len(article['content']) > 50000:
                article['content'] = article['content'][:50000]
            # None 처리 (article_no는 NOT NULL이므로 제외)
            for key in article:
                if key == 'article_no':
                    if article[key] is None:
                        article[key] = ''
                    continue
                if article[key] == '':
                    article[key] = None
            batch.append(article)
        
        total += len(batch)
        status, result = make_request("POST", "/rest/v1/articles?on_conflict=id", batch)
        
        if status in (200, 201):
            success += len(batch)
            if success % 500 == 0 or success == total:
                print(f"   ✅ {success} 조문 업로드 완료...")
        else:
            print(f"   ❌ 배치 실패 (status {status}): {result[:300]}")
    
    print(f"   📊 총 {success}/{total} 조문 업로드 완료")
    return success


def upload_precedents(cursor):
    """Precedents 테이블 업로드 (있는 경우)"""
    print("\n⚖️ Precedents 데이터 확인 중...")
    
    try:
        cursor.execute("SELECT COUNT(*) FROM Precedents")
        count = cursor.fetchone()[0]
        
        if count == 0:
            print("   ℹ️ 판례 데이터 없음 (건너뜀)")
            return 0
        
        columns = ['id', 'case_id', 'case_id_normalized', 'court', 
                   'case_type', 'case_name', 'decision_date', 'exists_verified']
        
        precedents = get_sqlite_data(cursor, 'Precedents', columns)
        print(f"   총 {len(precedents)}개 판례")
        
        success = 0
        for i in range(0, len(precedents), BATCH_SIZE):
            batch = precedents[i:i + BATCH_SIZE]
            
            for prec in batch:
                for key in prec:
                    if prec[key] == '':
                        prec[key] = None
            
            status, result = make_request("POST", "/rest/v1/precedents", batch)
            
            if status in (200, 201):
                success += len(batch)
            else:
                print(f"   ❌ 배치 실패: {result[:200]}")
        
        print(f"   ✅ {success}/{len(precedents)} 판례 업로드 완료")
        return success
    except Exception as e:
        print(f"   ⚠️ 판례 테이블 없음 또는 에러: {e}")
        return 0


def main():
    global BATCH_SIZE
    print("=" * 60)
    print("🚀 SQLite → Supabase 데이터 마이그레이션")
    print("=" * 60)

    parser = argparse.ArgumentParser(add_help=True)
    parser.add_argument('--skip-laws', action='store_true')
    parser.add_argument('--skip-articles', action='store_true')
    parser.add_argument('--start-article-id', type=int, default=0)
    parser.add_argument('--batch-size', type=int, default=BATCH_SIZE)
    args = parser.parse_args()
    BATCH_SIZE = args.batch_size

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("\n❌ 환경변수를 설정하세요:")
        print("   export SUPABASE_URL=https://xxx.supabase.co")
        print("   export SUPABASE_SERVICE_KEY=eyJ...")
        return

    role = get_jwt_role(SUPABASE_SERVICE_KEY)
    # if role is not None and role != 'service_role':
    #     print(f"\n❌ SUPABASE_SERVICE_KEY의 JWT role이 service_role이 아닙니다: {role}")
    #     print("   articles 업로드는 RLS에 의해 실패합니다. service_role 키를 사용하세요.")
    #     return
    if role is None:
        print("\n⚠️ SUPABASE_SERVICE_KEY가 JWT 형태가 아니어서 role 검증을 생략합니다.")
        print("   articles 업로드가 401(RLS)로 실패하면 service_role 키를 설정하세요.")

    print(f"\n📂 SQLite DB: {DB_PATH}")
    print(f"☁️  Supabase: {SUPABASE_URL}")
    
    # SQLite 연결
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 현재 데이터 확인
    cursor.execute("SELECT COUNT(*) FROM Laws")
    law_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM Articles")
    article_count = cursor.fetchone()[0]
    
    print(f"\n📊 로컬 데이터:")
    print(f"   - Laws: {law_count}개")
    print(f"   - Articles: {article_count}개")
    
    # 업로드 실행
    laws_uploaded = 0
    articles_uploaded = 0

    if not args.skip_laws:
        laws_uploaded = upload_laws(cursor)
    
    if not args.skip_articles:
        articles_uploaded = upload_articles(cursor, start_from_id=args.start_article_id)
    precedents_uploaded = upload_precedents(cursor)
    
    conn.close()
    
    # 결과 요약
    print("\n" + "=" * 60)
    print("📊 마이그레이션 완료!")
    print("=" * 60)
    print(f"   Laws: {laws_uploaded}개 업로드")
    print(f"   Articles: {articles_uploaded}개 업로드")
    print(f"   Precedents: {precedents_uploaded}개 업로드")
    
    # 시퀀스 업데이트 안내
    print("\n⚠️ Supabase에서 시퀀스 업데이트 필요:")
    print("   SELECT setval('laws_id_seq', (SELECT MAX(id) FROM laws));")
    print("   SELECT setval('articles_id_seq', (SELECT MAX(id) FROM articles));")


if __name__ == "__main__":
    main()
