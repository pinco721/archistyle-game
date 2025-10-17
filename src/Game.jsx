import { useState, useEffect, useCallback } from "react";

// Импорт констант и данных
import { 
    allStyles, 
    stylesMap, 
    HINT_KEYS 
} from "./utils/styles";

// Импорт вспомогательных функций
import { 
    getRandomElement, 
    getInitialTheme, 
    getInitialStat 
} from "./utils/helpers";

// Импорт логики игры
import { generateHints } from "./utils/gameLogic";

export default function Game() {
  // --- СОСТОЯНИЯ (STATE) ---
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [targetStyle, setTargetStyle] = useState(null);
  const [guess, setGuess] = useState("");
  const [guessesHistory, setGuessesHistory] = useState([]);
  const [gameState, setGameState] = useState("playing");
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const [stylesInCurrentCycle, setStylesInCurrentCycle] = useState(new Set());
  
  // 💡 ФЛАГ ИНИЦИАЛИЗАЦИИ: Управляет запуском игры при монтировании, предотвращая бесконечный цикл.
  const [isInitialized, setIsInitialized] = useState(false);
  // 💡 НОВЫЙ ФЛАГ: Отслеживает, была ли сделана первая попытка в текущей игре.
  const [hasMadeFirstGuess, setHasMadeFirstGuess] = useState(false); 
  
  // Состояния для увиденных фотографий
  const [seenPhotos, setSeenPhotos] = useState(() => {
    const saved = localStorage.getItem('seenPhotos');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  // Состояния для стриков
  const [currentStreak, setCurrentStreak] = useState(() => getInitialStat('currentStreak'));
  const [maxStreak, setMaxStreak] = useState(() => getInitialStat('maxStreak'));
  
  // 💡 НОВЫЕ СОСТОЯНИЯ ДЛЯ СТАТИСТИКИ ИГР
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(() => getInitialStat('totalGamesPlayed'));
  const [totalGamesWon, setTotalGamesWon] = useState(() => getInitialStat('totalGamesWon'));

  const colorMap = {
    correct: "bg-green-500 text-white",
    partial: "bg-yellow-400 text-white",
    wrong: "bg-gray-300 text-gray-700",
  };
  


  // 1. ✅ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ ИГРЫ
  const startNewGame = useCallback(() => {
    // --- ЛОГИКА ВЫБОРА СТИЛЯ И ФОТОГРАФИИ БЕЗ ПОВТОРОВ ---
    const allPhotoUrls = allStyles.flatMap((s) => s.photoUrls || []);
    const unseenGlobal = allPhotoUrls.filter((url) => !seenPhotos.has(url));

    if (unseenGlobal.length === 0) {
      // Все фото всех стилей просмотрены хотя бы один раз
      setTargetStyle(null);
      setGameState('finished');
      return;
    }

    // Выбираем только стили, где остались непоказанные фото
    const stylesWithUnseen = allStyles.filter((style) =>
      (style.photoUrls || []).some((url) => !seenPhotos.has(url))
    );

    const targetStyleObject = getRandomElement(stylesWithUnseen);

    if (!targetStyleObject) {
      console.error("ОШИБКА: Не удалось выбрать стиль.");
      setTargetStyle(null);
      return;
    }

    setStylesInCurrentCycle(prevSet => {
      const next = new Set(prevSet);
      next.add(targetStyleObject.name);
      return next;
    });

    const availablePhotos = (targetStyleObject.photoUrls || []).filter((url) => !seenPhotos.has(url));
    const randomPhotoUrl = getRandomElement(availablePhotos);
    
    if (!randomPhotoUrl) {
        console.error(`ОШИБКА: Стиль ${targetStyleObject.name} не имеет доступных фотографий (photoUrls пуст).`);
        setTargetStyle(null);
        return; 
    }
    
    setSeenPhotos(prevSet => {
        const newSet = new Set(prevSet);
        if (!newSet.has(randomPhotoUrl)) {
            newSet.add(randomPhotoUrl);
            localStorage.setItem('seenPhotos', JSON.stringify(Array.from(newSet)));
        }
        return newSet;
    });

    // --- УСТАНОВКА НОВЫХ СОСТОЯНИЙ ИГРЫ ---
    setTargetStyle({
      ...targetStyleObject,
      currentPhotoUrl: randomPhotoUrl,
    });
    setGuessesHistory([]);
    setGuess("");
    setGameState("playing");
    setHasMadeFirstGuess(false); // 🔑 Сброс флага для новой игры

    console.log("✅ Инициализация завершена. Должна быть картинка.");
  }, [
    seenPhotos
  ]); // Зависимости обновлены

  // 2. ✅ useEffect для запуска игры (Фикс бесконечного цикла)
  useEffect(() => {
    // 💡 ФИКС: Запускаем игру только один раз, когда компонент монтируется, 
    // используя флаг isInitialized.
    if (!isInitialized) {
        startNewGame();
        setIsInitialized(true);
    }
  }, [startNewGame, isInitialized]); 


  // 3. ✅ useEffect для переключения темы (Dark Mode)
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // 4. 💡 Полный сброс прогресса
  const resetProgress = () => {
    const isConfirmed = window.confirm("Вы уверены, что хотите сбросить весь игровой прогресс (стрики, статистику, просмотренные фото)? Это действие необратимо.");
    
    if (!isConfirmed) {
        return;
    }

    // Сброс localStorage
    localStorage.removeItem('currentStreak');
    localStorage.removeItem('maxStreak');
    localStorage.removeItem('seenPhotos');
    localStorage.removeItem('totalGamesPlayed');
    localStorage.removeItem('totalGamesWon');
    
    // Сброс состояний
    setCurrentStreak(0);
    setMaxStreak(0);
    setSeenPhotos(new Set());
    setTotalGamesPlayed(0);
    setTotalGamesWon(0);
    
    // Принудительный запуск новой игры с чистой статистикой
    setGameState('playing'); 
    startNewGame();
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

    // 🔑 ФИКС 1: Увеличиваем totalGamesPlayed только при первой попытке.
    if (!hasMadeFirstGuess) {
      setTotalGamesPlayed(prev => {
          const newTotal = prev + 1;
          localStorage.setItem('totalGamesPlayed', newTotal);
          return newTotal;
      });
      setHasMadeFirstGuess(true);
    }

    setIsAnimating(true);

    const acceptableNames = (targetStyle.aliases || [targetStyle.name])
      .filter(Boolean)
      .map((n) => n.toLowerCase().trim());
    const isWin = acceptableNames.includes(userGuess);

    // 🔑 ФИКС 2: Логика стрика
    if (isWin) {
      setCurrentStreak(prev => {
        const newStreak = prev + 1;
        localStorage.setItem('currentStreak', newStreak);
        setMaxStreak(maxPrev => {
            if (newStreak > maxPrev) {
                localStorage.setItem('maxStreak', newStreak);
                return newStreak; 
            }
            return maxPrev;
        });
        return newStreak;
      });
      
      // Обновление статистики побед
      setTotalGamesWon(prev => {
          const newTotal = prev + 1;
          localStorage.setItem('totalGamesWon', newTotal);
          return newTotal;
      });
    } else if (guessesHistory.length === 0) { // 🔑 ФИКС 3: Если промахнулись с первого раза
        setCurrentStreak(0);
        localStorage.setItem('currentStreak', 0);
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

    const totalAnimTime = (HINT_KEYS.length * 100) + 200;

    if (isWin) {
      setGameState("won");
    }

    setTimeout(() => {
      setGuessesHistory((prev) => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, animate: false }];
      });
      setGuess("");
      setIsAnimating(false);
      // gameState при победе уже установлен выше
    }, totalAnimTime);
  };
  
  return (
    <div
      className={`min-h-screen flex flex-col items-center transition-all duration-500 p-4 
        ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}
    >
      <div className="flex justify-between w-full max-w-md mb-4 space-x-2">
        <button
          onClick={() => {
            const next = !isDark;
            setIsDark(next);
            localStorage.setItem('theme', next ? 'dark' : 'light');
          }}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300 transition text-sm shadow-md"
        >
          {isDark ? '☀️ Светлая' : '🌙 Тёмная'}
        </button>
         <button
          onClick={resetProgress}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm shadow-md"
        >
          Сбросить прогресс
        </button>
      </div>

      <h1
        className={`text-3xl font-bold mb-4 
          ${isDark ? 'text-white' : 'text-gray-900'}`}
      >
        Угадай архитектурный стиль
      </h1>
      <div className={`w-full max-w-md rounded-xl p-4 space-y-4 transition-colors duration-300
          ${isDark 
              ? 'bg-gray-700 text-white shadow-xl border border-gray-600' 
              : 'bg-white text-gray-900 shadow-lg border border-gray-100'
          }`}
      >
      
        {/* 💡 БЛОК СТАТИСТИКИ (Изменено: Процент побед заменен на Лучший стрик) */}
        <div className={`grid grid-cols-3 gap-2 p-3 rounded-lg border 
            ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-gray-100 border-gray-300'}`}>
            <div className="text-center">
                <div className="text-xl font-bold text-green-500">{currentStreak}</div>
                <div className="text-xs opacity-75">Текущий стрик</div>
            </div>
            <div className="text-center">
                <div className="text-xl font-bold text-yellow-500">{totalGamesPlayed}</div>
                <div className="text-xs opacity-75">Всего игр</div>
            </div>
            <div className="text-center">
                <div className="text-xl font-bold text-blue-500">{maxStreak}</div> {/* ⬅️ Лучший стрик */}
                <div className="text-xs opacity-75">Лучший стрик</div> {/* ⬅️ Новый заголовок */}
            </div>
        </div>

        <div
          key={targetStyle?.currentPhotoUrl}
          className="bg-gray-200 rounded-lg overflow-hidden animate-fade-in"
        >
          <img
            src={targetStyle?.currentPhotoUrl}
            alt={`Фото здания в стиле: ${targetStyle?.name || 'неизвестно'}`}
            className="w-full rounded-lg object-contain h-64"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = "https://placehold.co/600x400/CCCCCC/333333?text=Фото+недоступно";
            }}
          />
        </div>

        {gameState === "playing" ? (
          <div className="flex space-x-2">
            <input
              id="guess-input"
              className={`border rounded-lg p-2 flex-1 transition-colors duration-300
                ${isDark 
                    ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-400' 
                    : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                }`}
              placeholder="Введите стиль..."
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGuess()}
              disabled={!targetStyle || isAnimating}
            />
            <button
              onClick={handleGuess}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
              disabled={!guess.trim() || isAnimating}
            >
              Проверить
            </button>
          </div>
        ) : gameState === "won" ? (
          <div className="text-center bg-green-50 border border-green-400 rounded-lg p-4 animate-fade-in">
            <p className="text-2xl font-extrabold text-green-700 mb-2">
              🎉 Верно! Это {targetStyle.name}
            </p>
            <p className="text-lg font-semibold text-green-600 mb-3">
              Стрик: {currentStreak} / Всего побед: {totalGamesWon}
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
        ) : (
          <div className="text-center bg-blue-50 border border-blue-400 rounded-lg p-4 animate-fade-in">
            <p className="text-2xl font-extrabold text-blue-700 mb-2">
              ✅ Все фотографии всех стилей просмотрены!
            </p>
            <p className="text-lg font-semibold text-blue-600 mb-3">
              Вы можете сбросить прогресс и начать заново.
            </p>
            <button
              onClick={resetProgress}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Сбросить прогресс
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
              className={`border p-3 rounded-xl shadow-sm ${
                isDark
                    ? 'bg-gray-600 border-gray-500'
                    : 'bg-gray-50 border-gray-200'
            }`}
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
        
        {/* Список стилей */}
        <div className={`w-full max-w-xl p-4 transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        <button
          onClick={() => setIsListOpen(!isListOpen)}
          className={`flex justify-between items-center w-full p-3 font-semibold rounded-xl text-lg 
            transition-all duration-300
            ${isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-white shadow-md' 
              : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 shadow-md'
            }`}
        >
          <span>
            {isListOpen ? 'Список архитектурных стилей' : 'Показать все архитектурные стили'}
          </span>
          <svg 
            className={`w-5 h-5 transition-transform duration-300 ${isListOpen ? 'rotate-180' : 'rotate-0'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out 
            ${isListOpen ? 'max-h-[500px] pt-4' : 'max-h-0'}` // Использован max-h-[500px] для плавного перехода
          }
        >
          <div 
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}
          >
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 list-none">
              {allStyles.map((style) => (
                <li key={style.name} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {style.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}