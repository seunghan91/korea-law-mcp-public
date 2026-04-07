import { detectFileType, findAnnexByNumber, downloadAndParseAnnex, searchAnnexes, AnnexItem } from '../utils/annex-downloader';

describe('annex-downloader', () => {
  describe('detectFileType', () => {
    it('returns hwpx for ZIP magic bytes (0x50 0x4B)', () => {
      const buf = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x00]);
      expect(detectFileType(buf, 'http://example.com/file')).toBe('hwpx');
    });

    it('returns hwp for OLE magic bytes (0xD0 0xCF)', () => {
      const buf = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1]);
      expect(detectFileType(buf, 'http://example.com/file')).toBe('hwp');
    });

    it('returns pdf for PDF magic bytes (0x25 0x50)', () => {
      const buf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D]);
      expect(detectFileType(buf, 'http://example.com/file')).toBe('pdf');
    });

    it('falls back to URL extension .hwpx for unknown magic bytes', () => {
      const buf = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(detectFileType(buf, 'http://example.com/file.hwpx')).toBe('hwpx');
    });

    it('returns unknown for unrecognized magic bytes and no known extension', () => {
      const buf = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(detectFileType(buf, 'http://example.com/file.xyz')).toBe('unknown');
    });
  });

  describe('findAnnexByNumber', () => {
    const items: AnnexItem[] = [
      { '별표번호': '000100', '별표명': '[별표 1] 수수료 기준표', '별표종류': '별표' },
      { '별표번호': '000200', '별표명': '[별표 2] 과태료 기준', '별표종류': '별표' },
      { '별표번호': '000300', '별표명': '[서식 3] 신청서', '별표종류': '서식' },
    ];

    it('finds annex by raw number string "1"', () => {
      const result = findAnnexByNumber(items, '1');
      expect(result).toBeDefined();
      expect(result!['별표명']).toContain('별표 1');
    });

    it('finds annex by zero-padded "000100"', () => {
      const result = findAnnexByNumber(items, '000100');
      expect(result).toBeDefined();
      expect(result!['별표번호']).toBe('000100');
    });

    it('finds annex by title containing "[별표 1]"', () => {
      const result = findAnnexByNumber(items, '1');
      expect(result).toBeDefined();
      expect(result!['별표명']).toContain('[별표 1]');
    });

    it('finds annex by title containing "[서식 3]"', () => {
      const result = findAnnexByNumber(items, '3');
      expect(result).toBeDefined();
      expect(result!['별표명']).toContain('[서식 3]');
    });

    it('returns undefined for non-existent number', () => {
      const result = findAnnexByNumber(items, '999');
      expect(result).toBeUndefined();
    });
  });

  describe('export existence checks', () => {
    it('downloadAndParseAnnex is exported as async function', () => {
      expect(typeof downloadAndParseAnnex).toBe('function');
    });

    it('searchAnnexes is exported as async function', () => {
      expect(typeof searchAnnexes).toBe('function');
    });

    it('detectFileType is exported as function', () => {
      expect(typeof detectFileType).toBe('function');
    });

    it('findAnnexByNumber is exported as function', () => {
      expect(typeof findAnnexByNumber).toBe('function');
    });
  });
});
