export type PreferencePromptSelections = {
  distanceLabel?: string;
  budgetLabel?: string;
  spicyLabel?: string;
  cravingLabel?: string;
  extraLabels?: string[];
  openNow?: boolean;
};

const preferenceLinePattern = /^偏好：.*$/gm;

function normalizeSentence(text: string) {
  const clean = text.trim();
  if (!clean) return '今天想让饭饭狸帮我拍板。';
  if (/[。！？.!?]$/.test(clean)) return clean;
  return `${clean}。`;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function stripPreferenceLine(text: string) {
  return text.replace(preferenceLinePattern, '').replace(/\n{2,}/g, '\n').trim();
}

export function buildPreferencePrompt(input: { text: string; selections: PreferencePromptSelections }) {
  const base = normalizeSentence(stripPreferenceLine(input.text));
  const labels = unique([
    input.selections.distanceLabel || '',
    input.selections.budgetLabel || '',
    input.selections.spicyLabel || '',
    input.selections.cravingLabel ? `想吃${input.selections.cravingLabel}` : '',
    ...(input.selections.extraLabels || []),
    input.selections.openNow ? '营业中优先' : ''
  ]);

  if (labels.length === 0) return base;
  return `${base}\n偏好：${labels.join('，')}。`;
}
