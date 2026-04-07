// Mock annex-downloader before importing annex-tools
jest.mock('../utils/annex-downloader', () => ({
  searchAnnexes: jest.fn(),
  findAnnexByNumber: jest.fn(),
  downloadAndParseAnnex: jest.fn(),
}));

import { ANNEX_TOOLS, ANNEX_TOOL_HANDLERS, ANNEX_TOOL_NAMES } from '../mcp/annex-tools';
import { searchAnnexes, findAnnexByNumber, downloadAndParseAnnex } from '../utils/annex-downloader';

const mockSearchAnnexes = searchAnnexes as jest.MockedFunction<typeof searchAnnexes>;
const mockFindAnnexByNumber = findAnnexByNumber as jest.MockedFunction<typeof findAnnexByNumber>;
const mockDownloadAndParseAnnex = downloadAndParseAnnex as jest.MockedFunction<typeof downloadAndParseAnnex>;

describe('annex-tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tool definition', () => {
    it('ANNEX_TOOLS array has exactly 1 tool', () => {
      expect(ANNEX_TOOLS).toHaveLength(1);
    });

    it('tool name is get_annexes', () => {
      expect(ANNEX_TOOLS[0].name).toBe('get_annexes');
    });

    it('tool inputSchema has required law_name property', () => {
      const schema = ANNEX_TOOLS[0].inputSchema;
      expect(schema.properties).toHaveProperty('law_name');
      expect(schema.required).toContain('law_name');
    });

    it('tool inputSchema has optional annex_no and knd properties', () => {
      const schema = ANNEX_TOOLS[0].inputSchema;
      expect(schema.properties).toHaveProperty('annex_no');
      expect(schema.properties).toHaveProperty('knd');
      // Not in required
      expect(schema.required).not.toContain('annex_no');
      expect(schema.required).not.toContain('knd');
    });

    it('knd enum contains expected values', () => {
      const schema = ANNEX_TOOLS[0].inputSchema as any;
      expect(schema.properties.knd.enum).toEqual(
        expect.arrayContaining(['1', '2', '3', '4', '5'])
      );
    });
  });

  describe('Handler routing', () => {
    it('without annex_no calls searchAnnexes and returns JSON list', async () => {
      const mockItems = [
        { '별표명': '[별표 1] 수수료', '별표종류': '별표', '별표번호': '000100', '소관부처': '법무부' },
      ];
      mockSearchAnnexes.mockResolvedValue(mockItems);

      const result = await ANNEX_TOOL_HANDLERS['get_annexes']({ law_name: 'test' });
      expect(mockSearchAnnexes).toHaveBeenCalledWith('test', undefined);
      expect(result).toContain('별표 1');
    });

    it('with annex_no calls findAnnexByNumber + downloadAndParseAnnex', async () => {
      const mockItem = { '별표번호': '000100', '별표명': '[별표 1] 수수료', '별표서식파일링크': '/link.hwpx' };
      mockSearchAnnexes.mockResolvedValue([mockItem]);
      mockFindAnnexByNumber.mockReturnValue(mockItem);
      mockDownloadAndParseAnnex.mockResolvedValue([
        { annexType: 'table', number: 1, title: '수수료', rawContent: '', markdown: '| col |' },
      ]);

      const result = await ANNEX_TOOL_HANDLERS['get_annexes']({ law_name: 'test', annex_no: '1' });
      expect(mockFindAnnexByNumber).toHaveBeenCalled();
      expect(mockDownloadAndParseAnnex).toHaveBeenCalledWith('/link.hwpx');
      expect(result).toContain('| col |');
    });

    it('with annex_no 999 returns error when not found', async () => {
      mockSearchAnnexes.mockResolvedValue([]);
      mockFindAnnexByNumber.mockReturnValue(undefined);

      const result = await ANNEX_TOOL_HANDLERS['get_annexes']({ law_name: 'test', annex_no: '999' });
      expect(result).toContain('찾을 수 없습니다');
    });

    it('with knd=2 passes knd to searchAnnexes', async () => {
      mockSearchAnnexes.mockResolvedValue([]);

      await ANNEX_TOOL_HANDLERS['get_annexes']({ law_name: 'test', knd: '2' });
      expect(mockSearchAnnexes).toHaveBeenCalledWith('test', '2');
    });
  });

  describe('ANNEX-02: annexType differentiation', () => {
    it('includes annexType=form in response for 서식 items', async () => {
      const mockItem = { '별표번호': '000100', '별표명': '[서식 1] 신청서', '별표서식파일링크': '/link.hwpx' };
      mockSearchAnnexes.mockResolvedValue([mockItem]);
      mockFindAnnexByNumber.mockReturnValue(mockItem);
      mockDownloadAndParseAnnex.mockResolvedValue([
        { annexType: 'form', number: 1, title: '신청서', rawContent: '', markdown: '| 항목 |' },
      ]);

      const result = await ANNEX_TOOL_HANDLERS['get_annexes']({ law_name: 'test', annex_no: '1' });
      expect(result).toContain('서식 (Form)');
    });

    it('includes annexType=table in response for 별표 items', async () => {
      const mockItem = { '별표번호': '000100', '별표명': '[별표 1] 기준표', '별표서식파일링크': '/link.hwpx' };
      mockSearchAnnexes.mockResolvedValue([mockItem]);
      mockFindAnnexByNumber.mockReturnValue(mockItem);
      mockDownloadAndParseAnnex.mockResolvedValue([
        { annexType: 'table', number: 1, title: '기준표', rawContent: '', markdown: '| 항목 |' },
      ]);

      const result = await ANNEX_TOOL_HANDLERS['get_annexes']({ law_name: 'test', annex_no: '1' });
      expect(result).toContain('별표 (Table)');
    });
  });

  describe('Export existence checks', () => {
    it('ANNEX_TOOLS is exported as array', () => {
      expect(Array.isArray(ANNEX_TOOLS)).toBe(true);
    });

    it('ANNEX_TOOL_HANDLERS is exported as object with get_annexes key', () => {
      expect(typeof ANNEX_TOOL_HANDLERS).toBe('object');
      expect(ANNEX_TOOL_HANDLERS).toHaveProperty('get_annexes');
    });

    it('ANNEX_TOOL_NAMES is exported as array containing get_annexes', () => {
      expect(Array.isArray(ANNEX_TOOL_NAMES)).toBe(true);
      expect(ANNEX_TOOL_NAMES).toContain('get_annexes');
    });
  });
});
