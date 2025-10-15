// tailwind.config.js

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Указываем, где искать классы
  ],
  theme: {
    extend: {
      keyframes: {
        // Определяем анимацию переворота
        flip: {
          '0%, 100%': { transform: 'rotateX(0deg)' },
          '50%': { transform: 'rotateX(-90deg)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }, // <-- Закрывающая скобка и запятая для keyframes
      }, // <-- Эту скобку нужно удалить
      animation: {
        // Имя, которое мы будем использовать в классе
        flip: 'flip 0.7s ease-in-out',
        'fade-in': 'fade-in 0.8s ease-out forwards',
      },
    }, // <-- Закрывающая скобка для extend
  }, // <-- Закрывающая скобка для theme
  plugins: [],
  
}