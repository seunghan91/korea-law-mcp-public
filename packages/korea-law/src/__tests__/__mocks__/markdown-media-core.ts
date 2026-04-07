import type { NapiAnnexInfo } from '@markdown-media/core';

export const parseAnnexHwpx = jest.fn((_path: string): NapiAnnexInfo[] => [
  {
    annexType: 'table',
    number: 1,
    title: '테스트 별표',
    rawContent: '',
    markdown: '| 항목 | 내용 |\n|---|---|\n| 1 | 테스트 |',
  },
]);

export const parseAnnexHwp = jest.fn((_path: string): NapiAnnexInfo[] => [
  {
    annexType: 'table',
    number: 1,
    title: '테스트 별표',
    rawContent: '',
    markdown: '| 항목 | 내용 |',
  },
]);

export const parseAnnexText = jest.fn((_text: string): NapiAnnexInfo[] => []);
