// ТЕСТ: Обработка путей к фото
// Запустить в консоли браузера после загрузки core.js

function testPhotoPath() {
    const testCases = [
        {
            filename: 'C:\\Users\\Никитин Иван\\Documents\\Пруткон 3\\extracted_xlsx\\1\\3\\Paltsy\\row_0002_img_01.png',
            path: 'C:\\Users\\Никитин Иван\\Documents\\Пруткон 3\\extracted_xlsx\\1\\3\\Paltsy\\',
            expected: 'extracted_xlsx/1/3/Paltsyi/row_0002_img_01.png'
        },
        {
            filename: 'row_0003_img_02.png',
            path: 'C:\\Users\\Test\\extracted_xlsx\\Paltsy',
            expected: 'extracted_xlsx/Paltsyi/row_0003_img_02.png'
        },
        {
            filename: 'photo.jpg',
            path: '',
            expected: 'extracted_xlsx/photo.jpg'
        },
        {
            filename: '',
            path: 'C:\\extracted_xlsx\\Folder1\\Folder2',
            expected: 'extracted_xlsx/Folder1/Folder2'
        }
    ];
    
    console.log('🧪 ТЕСТ: Обработка путей к фото\n');
    
    testCases.forEach((tc, i) => {
        let photoFilename = '';
        let photoRelDir = '';
        
        // Обработка filename
        if (tc.filename) {
            const raw = String(tc.filename).trim();
            if (raw && raw !== '---') {
                photoFilename = raw.split('\\').pop().split('/').pop().trim();
            }
        }
        
        // Обработка path
        if (tc.path) {
            const raw = String(tc.path).trim();
            if (raw && raw !== '---') {
                let normalized = raw.replace(/\\/g, '/').replace(/\/$/, '');
                const markerLow = normalized.toLowerCase();
                const marker = 'extracted_xlsx';
                const idx = markerLow.indexOf(marker);
                
                if (idx >= 0) {
                    photoRelDir = normalized.substring(idx);
                } else {
                    const idx2 = markerLow.indexOf('extracted');
                    if (idx2 >= 0) {
                        photoRelDir = normalized.substring(idx2);
                    } else {
                        const parts = normalized.split('/');
                        photoRelDir = parts.slice(-2).join('/');
                    }
                }
            }
        }
        
        // Сборка итогового пути
        let result = '';
        if (photoFilename && photoFilename !== '---' && photoFilename !== '') {
            if (photoRelDir && photoRelDir !== '---') {
                const dirClean = photoRelDir.replace(/\/$/, '');
                result = `${dirClean}/${photoFilename}`;
            } else {
                result = `extracted_xlsx/${photoFilename}`;
            }
        } else if (photoRelDir && photoRelDir !== '---') {
            result = photoRelDir;
        }
        
        const passed = result === tc.expected;
        console.log(`Тест ${i+1}: ${passed ? '✅' : '❌'}`);
        console.log(`  Input: filename="${tc.filename}", path="${tc.path}"`);
        console.log(`  Expected: ${tc.expected}`);
        console.log(`  Got:      ${result}`);
        console.log('');
    });
}

// Запустить тест
testPhotoPath();
