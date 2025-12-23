import displayTextsData from './displayTexts.json';

export type DisplayTexts = typeof displayTextsData;

export const dt: DisplayTexts = displayTextsData;

export type DisplayTextKey = keyof DisplayTexts;

export const getText = (key: DisplayTextKey): string => {
  const value = dt[key];
  return typeof value === 'string' ? value : '';
};
