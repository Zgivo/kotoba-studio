import { describe, expect, it } from 'vitest';
import { generateAcceptedVariants, normalizeRomaji, validateRomaji } from './romaji';

describe('romaji normalization', () => {
  it('handles case, spaces, hyphens and macrons', () => {
    expect(normalizeRomaji(' KYŌ-SHI ')).toBe('kyoushi');
    expect(normalizeRomaji('benkyō shimasu')).toBe('benkyoushimasu');
  });

  it('accepts explicit alternatives without over-normalizing spelling', () => {
    expect(validateRomaji('kyoushi', 'kyōshi')).toMatchObject({ isCorrect: true, matchedVariant: 'kyōshi' });
    expect(validateRomaji('kyoshi', 'kyōshi')).toMatchObject({ isCorrect: false });
    expect(validateRomaji('sensei', 'sensei', ['sensei'])).toMatchObject({ isCorrect: true });
  });

  it('deduplicates accepted variants', () => {
    expect(generateAcceptedVariants('nōto', ['nōto', 'nooto'])).toEqual(['nōto', 'nooto']);
  });
});
