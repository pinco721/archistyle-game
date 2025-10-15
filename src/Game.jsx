import { useState } from "react";

export default function Game() {
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const photo = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Notre-Dame_de_Paris_2013-07-24.jpg/500px-Notre-Dame_de_Paris_2013-07-24.jpg";

  const hints = [
    { label: "Период", value: "XII–XVI вв.", status: "partial" },
    { label: "Регион", value: "Европа", status: "correct" },
    { label: "Форма", value: "арки и шпили", status: "partial" },
    { label: "Материалы", value: "камень", status: "correct" },
    { label: "Декор", value: "богатый орнамент", status: "wrong" },
    { label: "Идея", value: "вертикальность и свет", status: "correct" },
  ];

  const colorMap = {
    correct: "bg-green-500 text-white",
    partial: "bg-yellow-400 text-white",
    wrong: "bg-gray-300 text-gray-700",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Угадай архитектурный стиль</h1>
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-4 space-y-4">
        <img src={photo} alt="building" className="w-full rounded-lg object-cover" />
        <div className="flex space-x-2">
          <input
            className="border border-gray-300 rounded-lg p-2 flex-1"
            placeholder="Введите стиль..."
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
          />
          <button
            onClick={() => setSubmitted(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Проверить
          </button>
        </div>

        {submitted && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {hints.map((hint, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 text-center font-medium ${colorMap[hint.status]}`}
              >
                <div className="text-sm opacity-80">{hint.label}</div>
                <div className="text-base">{hint.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
