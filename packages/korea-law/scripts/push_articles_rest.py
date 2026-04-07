#!/usr/bin/env python3
"""
Supabase REST API를 통한 Articles 대량 업로드
표준 라이브러리만 사용 (requests 불필요)
"""
import json
import csv
import http.client
import ssl
from urllib.parse import urlparse

# Supabase 설정
SUPABASE_URL = "https://darrlxppnvdntdxtystb.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcnJseHBwbnZkbnRkeHR5c3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNjg1NzksImV4cCI6MjA0OTg0NDU3OX0.jYkin1Ds1i9s22rECBb8Dff6E3gVfnwt0X_4_iWTHvk"

CSV_PATH = "/tmp/articles.csv"
BATCH_SIZE = 100
START_FROM_ID = 219  # 이미 업로드된 218개 이후부터

def make_request(method, path, data=None):
    """HTTPS 요청 수행"""
    parsed = urlparse(SUPABASE_URL)
    context = ssl.create_default_context()
    conn = http.client.HTTPSConnection(parsed.netloc, context=context)
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    body = json.dumps(data) if data else None
    conn.request(method, path, body, headers)
    response = conn.getresponse()
    result = response.read().decode('utf-8')
    conn.close()
    return response.status, result

def read_articles_csv():
    """CSV에서 articles 읽기"""
    articles = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            article_id = int(row['id'])
            if article_id >= START_FROM_ID:
                articles.append({
                    "id": article_id,
                    "law_id": int(row['law_id']),
                    "article_no": row['article_number'],
                    "article_title": row['article_title'][:500] if row['article_title'] else '',
                    "content": row['article_content'][:10000] if row['article_content'] else ''
                })
    return articles

def upload_batch(articles):
    """배치 업로드"""
    status, result = make_request("POST", "/rest/v1/articles", articles)
    return status, result

def main():
    print(f"📂 CSV 읽기: {CSV_PATH}")
    articles = read_articles_csv()
    print(f"✅ 업로드할 Articles: {len(articles)}개 (ID >= {START_FROM_ID})")
    
    if not articles:
        print("⚠️ 업로드할 데이터가 없습니다.")
        return
    
    total_batches = (len(articles) + BATCH_SIZE - 1) // BATCH_SIZE
    success_count = 0
    error_count = 0
    
    for i in range(0, len(articles), BATCH_SIZE):
        batch = articles[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        
        status, result = upload_batch(batch)
        
        if status in (200, 201):
            success_count += len(batch)
            print(f"✅ 배치 {batch_num}/{total_batches}: {len(batch)}개 성공 (총 {success_count}개)")
        else:
            error_count += len(batch)
            print(f"❌ 배치 {batch_num}/{total_batches} 실패: {status}")
            print(f"   응답: {result[:200]}")

    print(f"\n📊 결과: 성공 {success_count}개, 실패 {error_count}개")
    print(f"🎯 총 Articles: {218 + success_count}개")

if __name__ == "__main__":
    main()
