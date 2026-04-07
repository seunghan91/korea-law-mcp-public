// Mock dependencies before importing treaties-tools
jest.mock('../api/precedent-api', () => ({
  searchTreaties: jest.fn(),
  getTreatyDetail: jest.fn(),
}));

jest.mock('../generated/client', () => ({
  KoreaLawApiClient: jest.fn().mockImplementation(() => ({
    searchOrdin: jest.fn(),
    getOrdinDetail: jest.fn(),
    searchMoelCgmExpc: jest.fn(),
    getMoelCgmExpcDetail: jest.fn(),
  })),
}));

jest.mock('../sync/local-governments', () => ({
  METROPOLITAN_GOVERNMENTS: [
    { code: '6110000', name: '서울특별시', type: '특별시' },
    { code: '6410000', name: '경기도', type: '도' },
  ],
}));

import { TREATY_TOOLS, TREATY_TOOL_HANDLERS, TREATY_TOOL_NAMES } from '../mcp/treaties-tools';

describe('treaties-tools', () => {
  describe('Tool definitions', () => {
    it('TREATY_TOOLS array has exactly 6 tools', () => {
      expect(TREATY_TOOLS).toHaveLength(6);
    });

    it('tool names match expected set', () => {
      const names = TREATY_TOOLS.map((t) => t.name);
      expect(names).toEqual([
        'search_treaties',
        'get_treaty_text',
        'search_ordinances',
        'get_ordinance_text',
        'search_labor_interpretations',
        'get_labor_interpretation_text',
      ]);
    });

    it('each tool has name, description, and inputSchema', () => {
      for (const tool of TREATY_TOOLS) {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      }
    });

    it('search_treaties inputSchema has required query', () => {
      const tool = TREATY_TOOLS.find((t) => t.name === 'search_treaties');
      expect(tool!.inputSchema.required).toContain('query');
      expect(tool!.inputSchema.properties).toHaveProperty('query');
      expect(tool!.inputSchema.properties).toHaveProperty('display');
    });

    it('get_treaty_text inputSchema has required treaty_id', () => {
      const tool = TREATY_TOOLS.find((t) => t.name === 'get_treaty_text');
      expect(tool!.inputSchema.required).toContain('treaty_id');
      expect(tool!.inputSchema.properties).toHaveProperty('treaty_id');
    });

    it('search_ordinances inputSchema has required query and optional region', () => {
      const tool = TREATY_TOOLS.find((t) => t.name === 'search_ordinances');
      expect(tool!.inputSchema.required).toContain('query');
      expect(tool!.inputSchema.properties).toHaveProperty('query');
      expect(tool!.inputSchema.properties).toHaveProperty('region');
      expect(tool!.inputSchema.properties).toHaveProperty('display');
      expect(tool!.inputSchema.required).not.toContain('region');
    });

    it('get_ordinance_text inputSchema has required ordinance_id', () => {
      const tool = TREATY_TOOLS.find((t) => t.name === 'get_ordinance_text');
      expect(tool!.inputSchema.required).toContain('ordinance_id');
    });

    it('search_labor_interpretations inputSchema has required query', () => {
      const tool = TREATY_TOOLS.find((t) => t.name === 'search_labor_interpretations');
      expect(tool!.inputSchema.required).toContain('query');
      expect(tool!.inputSchema.properties).toHaveProperty('query');
      expect(tool!.inputSchema.properties).toHaveProperty('display');
    });

    it('get_labor_interpretation_text inputSchema has required interpretation_id', () => {
      const tool = TREATY_TOOLS.find((t) => t.name === 'get_labor_interpretation_text');
      expect(tool!.inputSchema.required).toContain('interpretation_id');
    });
  });

  describe('Export structure', () => {
    it('TREATY_TOOLS is an array', () => {
      expect(Array.isArray(TREATY_TOOLS)).toBe(true);
    });

    it('TREATY_TOOL_HANDLERS has 6 entries, all functions', () => {
      const keys = Object.keys(TREATY_TOOL_HANDLERS);
      expect(keys).toHaveLength(6);
      for (const key of keys) {
        expect(typeof TREATY_TOOL_HANDLERS[key]).toBe('function');
      }
    });

    it('TREATY_TOOL_NAMES has 6 entries matching tool names', () => {
      expect(TREATY_TOOL_NAMES).toHaveLength(6);
      const toolNames = TREATY_TOOLS.map((t) => t.name);
      for (const name of TREATY_TOOL_NAMES) {
        expect(toolNames).toContain(name);
      }
    });

    it('handler keys match tool names exactly', () => {
      const handlerKeys = Object.keys(TREATY_TOOL_HANDLERS).sort();
      const toolNames = TREATY_TOOLS.map((t) => t.name).sort();
      expect(handlerKeys).toEqual(toolNames);
    });
  });
});
