export interface AnswerValidationResult {
  isCorrect: boolean;
  normalizedInput: string;
  matchedVariant?: string;
  acceptedVariants: string[];
}

const MACRONS: Record<string, string> = { ā: 'aa', ī: 'ii', ū: 'uu', ē: 'ee', ō: 'ou' };

export function normalizeRomaji(value: string): string {
  const composed = value.trim().toLowerCase().normalize('NFC');
  return [...composed]
    .map((char) => MACRONS[char] ?? char)
    .join('')
    .replace(/[‐‑‒–—―-]/g, '')
    .replace(/\s+/g, '');
}

export function generateAcceptedVariants(primary: string, alternatives: string[] = []): string[] {
  const raw = [primary, ...alternatives].map((item) => item.trim()).filter(Boolean);
  return [...new Set(raw)];
}

export function validateRomaji(input: string, primary: string, alternatives: string[] = []): AnswerValidationResult {
  const acceptedVariants = generateAcceptedVariants(primary, alternatives);
  const normalizedInput = normalizeRomaji(input);
  const matchedVariant = acceptedVariants.find((variant) => normalizeRomaji(variant) === normalizedInput);
  return { isCorrect: Boolean(matchedVariant), normalizedInput, matchedVariant, acceptedVariants };
}
