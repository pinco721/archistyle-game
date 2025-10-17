// --- СТАТИЧЕСКИЕ ФУНКЦИИ И КОНСТАНТЫ (ВНЕ КОМПОНЕНТА) ---

import stylesData from "../data/styles.json"; 

export const allStyles = stylesData;

export const stylesMap = allStyles.reduce((acc, style) => {
  const allNames = [style.name.toLowerCase(), ...(style.aliases || [])];
  allNames.forEach((name) => {
    if (!acc[name]) acc[name] = style;
  });
  return acc;
}, {});

export const HINT_KEYS_MAP = {
  period: "Период",
  region: "Регион",
  form: "Форма",
  materials: "Материалы",
  decor: "Декор",
  idea: "Идея",
};

export const HINT_KEYS = Object.keys(HINT_KEYS_MAP);