// чистые вспомогательные функции, не зависящие от React

export const getRandomElement = (array) => {
  if (!array || array.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

// Принимает HINT_KEYS_MAP в качестве аргумента, чтобы быть чистой функцией
export const formatLabel = (key, map) => map[key] || key;

export const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme === 'dark';
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  return true; 
};

export const getInitialStat = (key) => {
  const saved = localStorage.getItem(key);
  return saved ? parseInt(saved, 10) : 0;
};