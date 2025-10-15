import { useState, useEffect } from "react";
// 1. Убедитесь, что этот путь к вашему JSON-файлу верен
import stylesData from './data/styles.json'; 

// 2. Объявляем allStyles сразу после импорта, используя stylesData
const allStyles = stylesData; 

// 3. Используем allStyles для создания stylesMap
const stylesMap = allStyles.reduce((acc, style) => {
const allNames = [style.name.toLowerCase(), ...(style.aliases || [])]; // Включаем имя и все синонимы

  // Привязываем каждый синоним/имя к одному объекту стиля
  allNames.forEach(name => {
    // Проверка на дублирование, чтобы не перезаписать, хотя вряд ли стили будут одинаковыми
    if (!acc[name]) { 
      acc[name] = style;
    }
  });

  return acc;
}, {});

// Список всех характеристик для генерации подсказок
// Используем объект, чтобы сразу иметь и ключ, и отображаемое название
const HINT_KEYS_MAP = {
    period: "Период",
    region: "Регион",
    form: "Форма",
    materials: "Материалы",
    decor: "Декор",
    idea: "Идея",
};
const HINT_KEYS = Object.keys(HINT_KEYS_MAP); // ['period', 'region', ...]

const getRandomElement = (array) => {
  if (!array || array.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

// Вспомогательная функция для форматирования текста
const formatLabel = (key) => {
  const map = {
    period: "Период",
    region: "Регион",
    form: "Форма",
    materials: "Материалы",
    decor: "Декор",
    idea: "Идея",
  };
  return map[key] || key;
};

// Функция для выбора случайного элемента
const getRandomStyle = (styles) => {
  const randomIndex = Math.floor(Math.random() * styles.length);
  return styles[randomIndex];
};

export default function Game() {
  
  const [targetStyle, setTargetStyle] = useState(null); 
  const [guess, setGuess] = useState("");
  const [guessesHistory, setGuessesHistory] = useState([]); 
  const [gameState, setGameState] = useState('playing'); // 'playing' | 'won' | 'lost'
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState(null);

  const colorMap = {
    correct: "bg-green-500 text-white",
    partial: "bg-yellow-400 text-white",
    wrong: "bg-gray-300 text-gray-700",
  };

  // Инициализация и Сброс игры
  const startNewGame = () => {
      // 1. Выбираем случайный объект стиля (например, "Готика")
    const newTargetStyleObject = getRandomElement(allStyles); 
    if (!newTargetStyleObject) return; // Защита от пустой базы
      // 2. Выбираем случайный URL из массива этого стиля
    const randomPhotoUrl = getRandomElement(newTargetStyleObject.photoUrls);
    
    // 3. Создаем финальный целевой объект, объединяя стиль и выбранный URL
  // (Это нужно, чтобы в targetStyle всегда был photoUrl, а не массив)
    const finalTarget = {
      ...newTargetStyleObject,
      currentPhotoUrl: randomPhotoUrl // Добавляем выбранный URL под новым именем
    };

// 4. Устанавливаем начальное состояние
    setTargetStyle(finalTarget);
    setGuessesHistory([]);
    setGuess('');
    setGameState('playing');
  };

  useEffect(() => {
    startNewGame(); 
  }, []); 
// ... внутри Game.jsx
// ...

// 2. Логика сравнения и генерации подсказок
// 2. Логика сравнения и генерации подсказок
const generateHints = (target, guessedStyle) => {
  
  // Если введенный стиль не распознан (мы это пометили в handleGuess)
  if (guessedStyle.isUnrecognized) { 
    return HINT_KEYS.map(key => ({
      key: key, 
      label: formatLabel(key),
      status: 'wrong' // Стиль не найден, все серые
    }));
  }

    // Если стиль найден, сравниваем характеристики
    return HINT_KEYS.map(key => {
        const targetValue = target[key].toLowerCase().trim();
        const guessValue = guessedStyle[key].toLowerCase().trim();
        
        let status = 'wrong'; 

        if (guessValue === targetValue) {
            // 1. Полное совпадение
            status = 'correct'; 
        } else if (key === 'period') {
            // 2. СПЕЦИАЛЬНАЯ ЛОГИКА ДЛЯ ПЕРИОДА (Period)
            
            // Разбиваем периоды на отдельные века
            const targetCenturies = targetValue.match(/(\d{1,2})|(\d{4})/g) || [];
            const guessCenturies = guessValue.match(/(\d{1,2})|(\d{4})/g) || [];

            // Проверяем, есть ли общий век/год
            const hasCenturyOverlap = targetCenturies.some(century => 
                guessCenturies.includes(century)
            );

            if (hasCenturyOverlap) {
                status = 'partial';
            } else {
                // Если нет частичного совпадения веков, возвращаемся к 'wrong'
                status = 'wrong';
            }
            
        } else if (targetValue.includes(guessValue) || guessValue.includes(targetValue)) {
            // 3. ОБЩАЯ ЛОГИКА ДЛЯ ОСТАЛЬНЫХ КЛЮЧЕЙ (form, materials, etc.)
            status = 'partial';
        } else {
            // 4. Нет совпадения
            status = 'wrong';
        }
        
        // Возвращаем только статус и ключ
        return {
            key: key, 
            label: formatLabel(key), 
            status: status 
        };
    });
};

// 3. Обработка попытки (ИСПРАВЛЕННАЯ ВЕРСИЯ)
const handleGuess = () => {
    // 0. Защита и блокировка
    if (isAnimating || !guess.trim() || gameState !== 'playing' || !targetStyle) return;
    
    // Сбрасываем предыдущую ошибку
    setError(null);
    
    const userGuessText = guess.trim();
    const userGuessTextLower = userGuessText.toLowerCase();

    // 1. Поиск введенного стиля в базе (по имени или синониму)
    let guessedStyle = stylesMap[userGuessTextLower]; 
    
    // 🛑 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: ПРОВЕРКА НА СУЩЕСТВОВАНИЕ СТИЛЯ В БАЗЕ
    // Если стиль не найден в stylesMap, это опечатка или неизвестный стиль
    if (!guessedStyle) {
        setError(`Стиль "${userGuessText}" не найден в базе. Попробуйте ввести точнее.`);
        setGuess('');
        // Не добавляем в историю и не запускаем анимацию
        return; 
    }

    // Блокируем ввод, так как стиль найден и будет анимация
    setIsAnimating(true);

    // 2. Проверка победы (только если стиль распознан)
    const acceptableNames = targetStyle.aliases || [targetStyle.name.toLowerCase()]; 
    const isWin = acceptableNames.includes(userGuessTextLower);

    let newHints;
    if (isWin) {
      // ✅ ПОБЕДА
      newHints = generateHints(targetStyle, targetStyle); 
    } else {
      // ❌ НЕПРАВИЛЬНЫЙ ОТВЕТ
      newHints = generateHints(targetStyle, guessedStyle);
    }

    // 3. Формируем финальные значения подсказок для отображения
    const hintsToSave = newHints.map(hint => {
        const value = guessedStyle[hint.key]; 
        return {
            ...hint,
            value: value, // Значение, которое увидит игрок
            key: hint.key 
        };
    });


    // 4. Создаем объект попытки с флагом анимации
    const attemptToAnimate = { 
        guessText: userGuessText, 
        hints: hintsToSave, 
        isRecognized: true, // Всегда true, так как мы вышли бы раньше, если бы стиль не был найден
        animate: true 
    };

    // 5. Добавляем попытку в историю
    setGuessesHistory(prevHistory => [...prevHistory, attemptToAnimate]);

    // 6. Устанавливаем таймер для имитации анимации
    const animationDuration = (HINT_KEYS.length * 150) + 1200; 

    setTimeout(() => {
        // ... (логика снятия флага анимации, очистки и проверки победы) ...
        setGuessesHistory(prevHistory => {
            const lastAttempt = prevHistory[prevHistory.length - 1];
            return [
                ...prevHistory.slice(0, -1),
                { ...lastAttempt, animate: false }
            ];
        });
        
        setGuess('');
        setIsAnimating(false);
        
        if (isWin) {
            setGameState('won');
        }
        
    }, animationDuration);
};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Угадай архитектурный стиль</h1>
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-4 space-y-4">
        
        {/* 1. Порядок: Результат игры (ВВЕРХУ) */}
        {gameState !== 'playing' && (
          <div className="text-center p-4 border-b">
            {gameState === 'won' ? (
              <p className="text-2xl font-extrabold text-green-600 mb-4">
                🎉 ПОБЕДА! Стиль: {targetStyle.name}
              </p>
            ) : (
              <p className="text-xl font-bold text-red-600 mb-4">
                Игра окончена. Правильный стиль: {targetStyle.name}
              </p>
            )}
            <button 
              onClick={startNewGame} 
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Сыграть снова
            </button>
          </div>
        )}
        
        {/* 1. ДОБАВЬТЕ ЭТОТ ОБЕРТЫВАЮЩИЙ БЛОК ВОКРУГ IMG */}
        <div className="bg-gray-200 rounded-lg overflow-hidden">
        {/* Фотография здания */}
        <img 
          // ИСПРАВЛЕНИЕ: используем новый ключ currentPhotoUrl
          src={targetStyle?.currentPhotoUrl} 
          alt="building" 
          className="w-full rounded-lg object-contain h-64" 
        />
        </div>
        {/* Поле ввода и кнопка */}
        {gameState === 'playing' && (
          <div className="flex space-x-2">
            <input
              className="border border-gray-300 rounded-lg p-2 flex-1"
              placeholder="Введите стиль..."
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGuess();
              }}
              disabled={!targetStyle || isAnimating}
            />
            <button
              onClick={handleGuess}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              disabled={!guess.trim() || isAnimating}
            >
              Проверить
            </button>
          </div>
        )}
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-sm" role="alert">
                {error}
            </div>
        )}
        {/* 2. Порядок: История попыток (ОБРАТНЫЙ ПОРЯДОК) */}
        <div className="space-y-4 pt-4">
          {/* Создаем копию массива, чтобы отобразить его в обратном порядке */}
          {[...guessesHistory].reverse().map((attempt, attemptIdx) => (
            <div
              key={guessesHistory.length - 1 - attemptIdx} // Корректный ключ для обратного порядка
              className="border p-3 rounded-xl bg-gray-50 shadow-sm"
            >
              {/* Нумерация также инвертирована */}
              <p className="font-semibold mb-2">
                Попытка #{guessesHistory.length - attemptIdx}: {attempt.guessText}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {attempt.hints.map((hint, hintIdx) => (
                  <div
                  key={hintIdx}
                  // ВАЖНО: Добавляем [backface-visibility:hidden] - это ключевой класс
                  className={`rounded-lg p-2 text-center text-xs font-medium ${colorMap[hint.status]}
                      transform transition-all duration-700 ease-in-out [transform-style:preserve-3d] 
                      [backface-visibility:hidden] // <--- ДОБАВЬТЕ ЭТОТ КЛАСС
                      ${attempt.animate ? 'animate-flip' : 'rotate-x-0'}`}
                  // Устанавливаем задержку
                  style={{ animationDelay: `${hintIdx * 150}ms` }} 
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
