/* 
 * ПРУТКОН ОС: Конфигурация облачного сервера (Supabase)
 * ВНИМАНИЕ: Используется прямой ключ управления (Service Role). 
 */

const SUPABASE_URL = 'https://ezazhutkkntbfqpsweyu.supabase.co'; // Ваш URL из панели
const SUPABASE_KEY = 'sb_publishable_Y-wTcUG5CF_oi93BcQsisQ_aOJipc3M'; // Ваш публичный ANON ключ

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.supabase = supabaseClient;

console.log('🚀 ПРУТКОН Cloud: Прямое управление базой активировано');

// Функция автоматической проверки связи
async function checkCloudSync() {
    try {
        const { data, error } = await window.supabase.from('employees').select('count');
        if (error) throw error;
        console.log('✅ Облако: Связь подтверждена. Данные доступны.');
    } catch (e) {
        console.error('❌ Облако: Ошибка подключения!', e.message);
    }
}

checkCloudSync();
