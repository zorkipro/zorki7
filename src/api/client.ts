/**
 * API Client - основной клиент для работы с Backend API
 * Использует модульную архитектуру:
 * - TokenManager - управление токенами
 * - ResponseHandler - обработка ответов
 * - ApiErrorHandler - обработка ошибок
 */

import { tokenManager } from "./core/TokenManager";
import { responseHandler } from "./core/ResponseHandler";
import { apiErrorHandler, APIError } from "./core/ApiErrorHandler";
import type { ApiRequestOptions } from "./core/types";

// Re-export types and classes for backward compatibility
export type {
  BadRequestErrorFieldExceptionDto,
  BadRequestExceptionDto,
  ApiRequestOptions,
} from "./core/types";
export { APIError } from "./core/ApiErrorHandler";
export { tokenManager } from "./core/TokenManager";
//
// API Configuration
// Если указан VITE_API_BASE_URL, используем его (работает и в dev, и в production)
// Иначе в dev используем прокси /api, в production - https://zorki.pro/api

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : import.meta.env.DEV
  ? "/api" // Прокси в режиме разработки
  : "https://zorki.pro/api";
// const API_BASE_URL = "https://zorki.pro/api"
// Трекер запросов для отслеживания потенциального дублирования
interface RequestTracker {
  endpoint: string;
  method: string;
  timestamp: number;
  bodyHash?: string;
}

const requestTracker: RequestTracker[] = [];
const DUPLICATE_THRESHOLD_MS = 1000; // 1 секунда - если запрос повторяется быстрее, это дублирование

/**
 * Проверяет, является ли запрос потенциальным дублированием
 * Работает только в development режиме
 */
function checkDuplicateRequest(
  endpoint: string,
  method: string,
  body?: BodyInit,
): void {
  if (!import.meta.env.DEV) return;

  // Простой хэш для тела запроса (только для строковых тел)
  let bodyHash: string | undefined;
  if (body && typeof body === "string") {
    try {
      // Простой хэш: первые 50 символов JSON
      bodyHash = body.slice(0, 50);
    } catch {
      // Игнорируем ошибки парсинга
    }
  }

  const now = Date.now();
  
  // Проверяем последние запросы
  const recentDuplicate = requestTracker.find(
    (track) =>
      track.endpoint === endpoint &&
      track.method === method &&
      (track.bodyHash === bodyHash || (!track.bodyHash && !bodyHash)) &&
      now - track.timestamp < DUPLICATE_THRESHOLD_MS,
  );

  if (recentDuplicate) {
    const timeDiff = now - recentDuplicate.timestamp;
    console.warn(
      `⚠️ [API DUPLICATE] Обнаружен потенциально дублирующий запрос:`,
      {
        endpoint,
        method,
        timeDiff: `${timeDiff}ms`,
        stack: new Error().stack,
      },
    );
  }

  // Добавляем текущий запрос в трекер
  requestTracker.push({
    endpoint,
    method,
    timestamp: now,
    bodyHash,
  });

  // Очищаем старые записи (старше 10 секунд)
  const cutoff = now - 10000;
  const index = requestTracker.findIndex(
    (track) => track.timestamp > cutoff,
  );
  if (index > 0) {
    requestTracker.splice(0, index);
  }
}

/**
 * Базовая функция для выполнения API запросов
 * Автоматически добавляет токен аутентификации и обрабатывает ошибки
 *
 * @param endpoint - путь API endpoint (например, '/blogger/profile')
 * @param options - опции запроса (метод, body, headers и т.д.)
 * @returns Promise с данными типа T
 * @throws {APIError} при ошибках API или сети
 *
 * @example
 * const data = await apiRequest<UserProfile>('/user/profile', {
 *   method: 'GET'
 * });
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { skipAuth = false, skipAuthErrorHandling = false, baseUrl, ...fetchOptions } = options;

  // Проверяем дублирование запросов (только в dev режиме)
  checkDuplicateRequest(
    endpoint,
    fetchOptions.method || "GET",
    fetchOptions.body,
  );

  // Получаем токен если не пропущена аутентификация
  const token = skipAuth ? null : await tokenManager.getAuthToken();

  // Подготавливаем заголовки из существующих options
  const existingHeaders = (fetchOptions.headers as Record<string, string>) || {};
  const headers: Record<string, string> = {
    ...existingHeaders,
  };

  // Устанавливаем Content-Type только если это не FormData и не передан в headers
  if (!(fetchOptions.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Добавляем токен если есть
  // Важно: токен админа имеет приоритет для админских операций
  // Если Authorization уже передан в headers, используем его, иначе добавляем токен
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${baseUrl || API_BASE_URL}${endpoint}`;

  try {
    // Важно: передаем headers после ...fetchOptions, чтобы наши заголовки (включая Authorization)
    // имели приоритет и не перезаписывались
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Обрабатываем ответ через ResponseHandler
    const { data, hasError, errorData } =
      await responseHandler.parseResponse<T>(response, endpoint);

    // Если есть ошибка - обрабатываем
    if (hasError && errorData) {
      // Для 401 ошибок очищаем токены и перенаправляем
      // НО пропускаем, если skipAuthErrorHandling = true
      if (
        apiErrorHandler.shouldRedirect(errorData.statusCode) &&
        !skipAuthErrorHandling
      ) {
        console.log('redirect')
        apiErrorHandler.handleAuthError(errorData);
      }

      throw new APIError(errorData);
    }

    return data as T;
  } catch (error) {
    // Если уже APIError - пробрасываем дальше
    if (error instanceof APIError) {
      throw error;
    }

    // Обрабатываем прочие ошибки (сеть, парсинг и т.д.)
    throw apiErrorHandler.handleError(error, endpoint);
  }
}

// Export API_BASE_URL for other modules
export { API_BASE_URL };
