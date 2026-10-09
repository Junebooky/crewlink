import { describe, it, expect } from 'vitest';
import { colors } from '../../lib/tokens';

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [r, g, b];
}

function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const sRGB = v / 255;
    return sRGB <= 0.04045 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = getRelativeLuminance(foregroundHex);
  const l2 = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('WCAG 2.2 AA Contrast Compliance (접근성 명도 대비 검증)', () => {
  it('Info 상태 배지 명도비가 WCAG AA 기준(4.5:1 이상)을 충족해야 한다', () => {
    const ratio = getContrastRatio(colors.state.info.text, colors.state.info.bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('Success 상태 배지 명도비가 WCAG AA 기준(4.5:1 이상)을 충족해야 한다', () => {
    const ratio = getContrastRatio(colors.state.success.text, colors.state.success.bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('Attention 상태 배지 명도비가 WCAG AA 기준(4.5:1 이상)을 충족해야 한다', () => {
    const ratio = getContrastRatio(colors.state.attention.text, colors.state.attention.bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('Critical 상태 배지 명도비가 WCAG AA 기준(4.5:1 이상)을 충족해야 한다', () => {
    const ratio = getContrastRatio(colors.state.critical.text, colors.state.critical.bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('Neutral 상태 배지 명도비가 WCAG AA 기준(4.5:1 이상)을 충족해야 한다', () => {
    const ratio = getContrastRatio(colors.state.neutral.text, colors.state.neutral.bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
