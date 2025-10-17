import { HINT_KEYS, HINT_KEYS_MAP } from "./styles";
import { formatLabel } from "./helpers";

// Разбивает строковые характеристики на набор нормализованных токенов
// Учитывает разделители: запятая, точка с запятой, слэш, союз "и".
const tokenize = (value) => {
  if (!value) return [];
  return value
    .toLowerCase()
    .split(/[,;/]|\s+и\s+/g)
    .map((s) => s.trim())
    .filter(Boolean);
};

export const generateHints = (target, guessedStyle) => {
    if (guessedStyle.isUnrecognized) {
      return HINT_KEYS.map((key) => ({
        key,
        label: formatLabel(key, HINT_KEYS_MAP),
        status: "wrong",
      }));
    }

    return HINT_KEYS.map((key) => {
      const targetValue = (target[key] || "").toLowerCase().trim();
      const guessValue = (guessedStyle[key] || "").toLowerCase().trim();

      let status = "wrong";
      if (guessValue === targetValue) {
        status = "correct";
      } else if (key === "period") {
        // Улучшенная проверка на частичное совпадение
        const targetCenturies = targetValue.match(/(\d{1,2})|(\d{4})/g) || [];
        const guessCenturies = guessValue.match(/(\d{1,2})|(\d{4})/g) || [];
        const hasOverlap = targetCenturies.some((c) =>
          guessCenturies.includes(c)
        );
        if (hasOverlap) status = "partial";
      } else {
        // Частичное совпадение для множественных значений (materials, decor, form, region, idea)
        const targetTokens = tokenize(targetValue);
        const guessTokens = tokenize(guessValue);
        if (targetTokens.length > 0 && guessTokens.length > 0) {
          const overlap = targetTokens.some((t) => guessTokens.includes(t));
          if (overlap) {
            status = "partial";
          }
        } else if (
          targetValue && guessValue &&
          (targetValue.includes(guessValue) || guessValue.includes(targetValue))
        ) {
          status = "partial";
        }
      }
      return { key, label: formatLabel(key, HINT_KEYS_MAP), status };
    });
};