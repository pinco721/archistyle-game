const fs = require('fs');
const path = require('path');

// 1. Константы
const BASE_PHOTO_DIR = path.join(__dirname, 'public', 'archistyle_photos');
const OUTPUT_JSON_FILE = path.join(__dirname, 'src', 'data', 'styles.json'); // Путь к вашему исходному styles.json

// 2. Стили, которые нужно обновить (имена подпапок)
const STYLES_TO_UPDATE = {
    'baroque': 'Архитектура барокко',
    'gothic': 'Готическая архитектура',
    'neoclassicism': 'Архитектура греческого возрождения',
    'palladian': 'Палладианская архитектура',
    'romanesque': 'Романская архитектура'
};

function generatePhotoUrls() {
    console.log("🛠️ Запуск скрипта генерации photoUrls...");
    
    // 3. Загружаем существующий JSON-файл с подсказками
    let existingData;
    try {
        existingData = JSON.parse(fs.readFileSync(OUTPUT_JSON_FILE, 'utf8'));
    } catch (error) {
        console.error("❌ Ошибка загрузки styles.json:", error.message);
        return;
    }

    // 4. Проходим по каждому стилю, который мы хотим обновить
    for (const folderName in STYLES_TO_UPDATE) {
        const styleName = STYLES_TO_UPDATE[folderName];
        const styleDir = path.join(BASE_PHOTO_DIR, folderName);
        
        // Проверяем, существует ли папка
        if (!fs.existsSync(styleDir)) {
            console.warn(`⚠️ Папка не найдена: ${styleDir}. Пропуск стиля ${styleName}.`);
            continue;
        }

        // Читаем файлы в подпапке
        const files = fs.readdirSync(styleDir)
            .filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'))
            .sort(); // Сортируем, чтобы получить последовательность 01, 02...

        // 5. Генерируем URL-адреса
        const newPhotoUrls = files.map(file => `/archistyle_photos/${folderName}/${file}`);
        
        // 6. Находим и обновляем соответствующий стиль в существующем JSON
        const targetStyle = existingData.find(s => s.name === styleName);
        
        if (targetStyle) {
            targetStyle.photoUrls = newPhotoUrls;
            console.log(`✅ Обновлено ${newPhotoUrls.length} ссылок для: ${styleName}`);
        } else {
            console.warn(`⚠️ Стиль "${styleName}" не найден в styles.json. Пропуск.`);
        }
    }

    // 7. Записываем обновленный массив обратно в styles.json
    try {
        fs.writeFileSync(OUTPUT_JSON_FILE, JSON.stringify(existingData, null, 2), 'utf8');
        console.log("🎉 Генерация завершена. styles.json обновлен!");
    } catch (error) {
        console.error("❌ Ошибка записи styles.json:", error.message);
    }
}

generatePhotoUrls();