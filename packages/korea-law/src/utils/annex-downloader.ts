/**
 * annex-downloader.ts: URL download + temp file + napi-rs parse pipeline
 *
 * 법제처 별표/서식 API 검색, 파일 다운로드, @markdown-media/core 파싱을 위한 유틸리티
 */

import { parseAnnexHwpx, parseAnnexHwp, NapiAnnexInfo } from '@markdown-media/core';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import axios from 'axios';

const LAW_BASE_URL = 'https://www.law.go.kr';
const API_KEY = process.env.KOREA_LAW_API_KEY || 'theqwe2000';

// ============================================
// Interfaces
// ============================================

export interface AnnexItem {
  '별표번호'?: string;
  '별표명'?: string;
  '별표종류'?: string;
  '별표서식파일링크'?: string;
  '별표서식PDF파일링크'?: string;
  '별표파일링크'?: string;
  '관련법령명'?: string;
  '공포일자'?: string;
  '소관부처'?: string;
}

// ============================================
// File type detection
// ============================================

/**
 * Detect file type from buffer magic bytes or URL extension
 */
export function detectFileType(buffer: Buffer, url: string): 'hwpx' | 'hwp' | 'pdf' | 'unknown' {
  // HWPX is a ZIP file (starts with PK)
  if (buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4B) return 'hwpx';
  // HWP5 OLE compound file (starts with D0 CF 11 E0)
  if (buffer.length >= 2 && buffer[0] === 0xD0 && buffer[1] === 0xCF) return 'hwp';
  // PDF (starts with %PDF)
  if (buffer.length >= 2 && buffer[0] === 0x25 && buffer[1] === 0x50) return 'pdf';

  // Fallback: check URL extension
  if (url.includes('.hwpx')) return 'hwpx';
  if (url.includes('.hwp')) return 'hwp';
  if (url.includes('.pdf')) return 'pdf';

  return 'unknown';
}

// ============================================
// Download + Parse pipeline
// ============================================

/**
 * Download a file from law.go.kr and parse it with napi-rs
 */
export async function downloadAndParseAnnex(fileLink: string): Promise<NapiAnnexInfo[]> {
  const downloadUrl = fileLink.startsWith('http') ? fileLink : `${LAW_BASE_URL}${fileLink}`;

  // Download file
  const response = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 30000 });
  const buffer = Buffer.from(response.data);

  // Detect file type
  const fileType = detectFileType(buffer, downloadUrl);

  // Handle PDF: return download link since napi-rs doesn't parse PDFs
  if (fileType === 'pdf') {
    return [{
      annexType: 'pdf',
      number: 0,
      title: 'PDF 파일',
      rawContent: '',
      markdown: `> PDF 파일은 직접 다운로드하세요: ${downloadUrl}`,
    }];
  }

  // Write to temp file (napi-rs requires file path)
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'annex-'));
  const ext = fileType === 'unknown' ? 'hwpx' : fileType;
  const tempFile = path.join(tempDir, `annex.${ext}`);
  await fs.writeFile(tempFile, buffer);

  try {
    if (fileType === 'hwpx') return parseAnnexHwpx(tempFile);
    if (fileType === 'hwp') return parseAnnexHwp(tempFile);
    // Unknown: try hwpx first, then hwp
    try {
      return parseAnnexHwpx(tempFile);
    } catch {
      return parseAnnexHwp(tempFile);
    }
  } finally {
    // ALWAYS cleanup temp files
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

// ============================================
// Annex search API
// ============================================

/**
 * Search for annexes by law name via law.go.kr DRF API (target=licbyl)
 */
export async function searchAnnexes(lawName: string, knd?: string): Promise<AnnexItem[]> {
  const params: Record<string, string> = {
    target: 'licbyl',
    OC: API_KEY,
    type: 'JSON',
    query: lawName,
    search: '2',
    display: '100',
  };

  if (knd) {
    params.knd = knd;
  }

  const response = await axios.get('https://www.law.go.kr/DRF/lawSearch.do', {
    params,
    timeout: 15000,
  });

  const data = response.data;
  let json: any;

  if (typeof data === 'string') {
    try {
      json = JSON.parse(data);
    } catch {
      return [];
    }
  } else {
    json = data;
  }

  // Root path: licBylSearch.licbyl
  const root = json?.licBylSearch?.licbyl;

  // Normalize single object to array
  return root ? (Array.isArray(root) ? root : [root]) : [];
}

// ============================================
// Find annex by number
// ============================================

/**
 * Find a specific annex by number from a list.
 * Handles multiple number formats: raw ("1"), padded ("000100"), multiplied ("000100").
 */
export function findAnnexByNumber(items: AnnexItem[], annexNo: string): AnnexItem | undefined {
  // Build candidate forms
  const candidates: string[] = [annexNo];

  // Zero-padded 6-digit
  const padded = annexNo.padStart(6, '0');
  candidates.push(padded);

  // Multiplied by 100 then padded (law.go.kr pattern: 1 -> 000100)
  const num = parseInt(annexNo, 10);
  if (!isNaN(num)) {
    const multiplied = (num * 100).toString().padStart(6, '0');
    candidates.push(multiplied);
  }

  for (const item of items) {
    // Match against 별표번호
    if (item['별표번호'] && candidates.includes(item['별표번호'])) {
      return item;
    }

    // Match against 별표명 title patterns
    const title = item['별표명'] || '';
    if (title.includes(`[별표 ${annexNo}]`) || title.includes(`[서식 ${annexNo}]`)) {
      return item;
    }
  }

  return undefined;
}
