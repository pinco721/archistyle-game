import { useState, useEffect } from "react";
import stylesData from "./data/styles.json";

const allStyles = stylesData;

const stylesMap = allStyles.reduce((acc, style) => {
  const allNames = [style.name.toLowerCase(), ...(style.aliases || [])];
  allNames.forEach((name) => {
    if (!acc[name]) acc[name] = style;
  });
  return acc;
}, {});

const HINT_KEYS_MAP = {
  period: "Период",
  region: "Регион",
  form: "Форма",
  materials: "Материалы",
  decor: "Декор",
  idea: "Идея",
};
const HINT_KEYS = Object.keys(HINT_KEYS_MAP);

const getRandomElement = (array) => {
  if (!array || array.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

const formatLabel = (key) => HINT_KEYS_MAP[key] || key;

export default function Game() {
  const [targetStyle, setTargetStyle] = useState(null);
  const [guess, setGuess] = useState("");
  const [guessesHistory, setGuessesHistory] = useState([]);
  const [gameState, setGameState] = useState("playing");
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState(null);
  const [isDark, setIsDark] = useState(false);


  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const colorMap = {
    correct: "bg-green-500 text-white",
    partial: "bg-yellow-400 text-white",
    wrong: "bg-gray-300 text-gray-700",
  };

  const startNewGame = () => {
    const newTargetStyleObject = getRandomElement(allStyles);
    if (!newTargetStyleObject) return;
    const randomPhotoUrl = getRandomElement(newTargetStyleObject.photoUrls);

    setTargetStyle({
      ...newTargetStyleObject,
      currentPhotoUrl: randomPhotoUrl,
    });
    setGuessesHistory([]);
    setGuess("");
    setGameState("playing");
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const generateHints = (target, guessedStyle) => {
    if (guessedStyle.isUnrecognized) {
      return HINT_KEYS.map((key) => ({
        key,
        label: formatLabel(key),
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
      return { key, label: formatLabel(key), status };
    });
  };

  const handleGuess = () => {
    if (isAnimating || !guess.trim() || gameState !== "playing" || !targetStyle)
      return;

    setError(null);
    const userGuess = guess.trim().toLowerCase();
    const guessedStyle = stylesMap[userGuess];

    if (!guessedStyle) {
      setError(`Стиль "${guess}" не найден. Попробуйте точнее.`);
      setGuess("");
      return;
    }

    setIsAnimating(true);

    const acceptableNames = targetStyle.aliases || [
      targetStyle.name.toLowerCase(),
    ];
    const isWin = acceptableNames.includes(userGuess);

        if (isWin) {
      setGameState('won');
    }
    const newHints = generateHints(
      targetStyle,
      isWin ? targetStyle : guessedStyle
    );
    const hintsToSave = newHints.map((hint) => ({
      ...hint,
      value: guessedStyle[hint.key],
    }));

    const newAttempt = {
      guessText: guess,
      hints: hintsToSave,
      animate: true,
    };

    setGuessesHistory((prev) => [...prev, newAttempt]);

    // ⏳ Ускоренная анимация
    const totalAnimTime = (HINT_KEYS.length * 100) + 200;

    setTimeout(() => {
      setGuessesHistory((prev) => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, animate: false }];
      });
      setGuess("");
      setIsAnimating(false);
      if (isWin) setGameState("won");
    }, totalAnimTime);
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center transition-all duration-500
        ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}
    >
      {/* 🌙 Кнопка переключения темы */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 rounded-lg shadow hover:scale-105 transition"
      >
        {isDark ? '☀️ Светлая' : '🌙 Тёмная'}
      </button>
      <h1
        className={`text-3xl font-bold mb-4 transition-colors duration-300 
          ${isDark ? 'text-white' : 'text-gray-900'}`}
      >
        Угадай архитектурный стиль
      </h1>
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-4 space-y-4">
        {/* Фото с плавным появлением */}
        <div
          key={targetStyle?.currentPhotoUrl}
          className="bg-gray-200 rounded-lg overflow-hidden animate-fade-in"
        >
          <img
            src={targetStyle?.currentPhotoUrl}
            alt="building"
            className="w-full rounded-lg object-contain h-64"
          />
        </div>

        {/* Блок с вводом или победой */}
        {gameState === "playing" ? (
          <div className="flex space-x-2">
            <input
              className="border border-gray-300 rounded-lg p-2 flex-1"
              placeholder="Введите стиль..."
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGuess()}
              disabled={!targetStyle || isAnimating}
            />
            <button
              onClick={handleGuess}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={!guess.trim() || isAnimating}
            >
              Проверить
            </button>
          </div>
        ) : (
          <div className="text-center bg-green-50 border border-green-400 rounded-lg p-4 animate-fade-in">
            <p className="text-2xl font-extrabold text-green-700 mb-2">
              🎉 Победа! Это {targetStyle.name}
            </p>
            <button
              onClick={() => {
                startNewGame();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Сыграть снова
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 pt-4">
          {[...guessesHistory].reverse().map((attempt, attemptIdx) => (
            <div
              key={attemptIdx}
              className="border p-3 rounded-xl bg-gray-50 shadow-sm"
            >
              <p className="font-semibold mb-2">
                Попытка #{guessesHistory.length - attemptIdx}:{" "}
                {attempt.guessText}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {attempt.hints.map((hint, hintIdx) => (
                  <div
                    key={hintIdx}
                    className={`rounded-lg p-2 text-center text-xs font-medium ${colorMap[hint.status]}
                      transform transition-all duration-500 ease-in-out
                      [transform-style:preserve-3d] [backface-visibility:hidden]
                      ${attempt.animate ? "animate-flip" : ""}`}
                    style={{ animationDelay: `${hintIdx * 100}ms` }}
                  >
                    <div className="text-xs opacity-80">{hint.label}</div>
                    <div className="text-sm">{hint.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
