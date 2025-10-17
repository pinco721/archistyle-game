import { HINT_KEYS, HINT_KEYS_MAP } from "./styles";
import { formatLabel } from "./helpers";

export const generateHints = (target, guessedStyle) => {
    if (guessedStyle.isUnrecognized) {
      return HINT_KEYS.map((key) => ({
        key,
        label: formatLabel(key, HINT_KEYS_MAP),
        status: "wrong",
      }));
    }

    return HINT_KEYS.map((key) => {
      const targetValue = target[key].toLowerCase().trim();
      const guessValue = guessedStyle[key].toLowerCase().trim();

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
      } else if (
        targetValue.includes(guessValue) ||
        guessValue.includes(targetValue)
      ) {
        status = "partial";
      }
      return { key, label: formatLabel(key, HINT_KEYS_MAP), status };
    });
};