// firebase_config.js
// Хранилище настроек конфигурации Firebase. Не удалять и не перезаписывать.

if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
    const firebaseConfig = {
        apiKey: "AIzaSyACIILOMEO7rgpekE7O9br7jeDE9PrtB5I",
        authDomain: "prutkon.firebaseapp.com",
        databaseURL: "https://prutkon-default-rtdb.firebaseio.com",
        projectId: "prutkon",
        storageBucket: "prutkon.firebasestorage.app",
        messagingSenderId: "16461297514",
        appId: "1:16461297514:web:2524bf2d709bac15371713",
        measurementId: "G-2VSR5W47DN"
    };
    console.log("🛠️ Диагностика: Инициализация Firebase для проекта:", firebaseConfig.projectId);
    firebase.initializeApp(firebaseConfig);
    console.log("🔥 Firebase: Подключение к облаку установлено");
}
