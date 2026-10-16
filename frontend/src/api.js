export const API = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
export async function request(path, options = {}) {
 let response;
 try { response = await fetch(`${API}${path}`, options); }
 catch { throw new Error('Не удалось связаться с сервером. Проверьте подключение и запуск backend.'); }
 if (response.status === 204) return null;
 const data = await response.json().catch(() => ({}));
 if (!response.ok) throw new Error(data.error || `Ошибка запроса (${response.status})`);
 return data;
}
