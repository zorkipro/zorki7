// Конфигурация приложения

// Коэффициенты для расчета охвата и статистики
export const ENGAGEMENT_COEFFICIENTS = {
  INSTAGRAM_REACH: 0.35,
  INSTAGRAM_STORY_REACH: 0.28,
  YOUTUBE_VIEWS_MULTIPLIER: 1.8,
} as const;

// URL платформ
export const PLATFORM_URLS = {
  instagram: "https://instagram.com",
  youtube: "https://youtube.com",
  tiktok: "https://tiktok.com",
  telegram: "https://t.me",
} as const;

// Валюты и форматирование
export const CURRENCY = import.meta.env.VITE_CURRENCY || "BYN";

// URL для перенаправлений
export const REDIRECT_URL =
  import.meta.env.VITE_REDIRECT_URL || `${window.location.origin}/`;

// Backend API URL
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://zorki.pro/api";

// Проверка обязательных переменных окружения
export const validateEnvironmentVariables = () => {
  const requiredVars = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    // ⚠️ DEPRECATED: Admin credentials больше не нужны, используется backend API
    // 'VITE_ADMIN_EMAIL',
    // 'VITE_ADMIN_PASSWORD'
  ];

  const missingVars = requiredVars.filter(
    (varName) => !import.meta.env[varName],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}\n` +
        "Please check your .env file and ensure all required variables are set.",
    );
  }
};

// Кэш настройки
export const CACHE_SETTINGS = {
  STALE_TIME: 1000 * 60, // 1 min
  PROFILE_CACHE_DURATION: 5 * 60 * 1000, // 5 минут
  PRICING_CACHE_DURATION: 5 * 60 * 1000, // 5 минут
  SCREENSHOT_CACHE_DURATION: 10 * 60 * 1000, // 10 минут
} as const;

// Настройки аутентификации
export const AUTH_SETTINGS = {
  STORAGE_KEY_ANON: "sb-anon",
  STORAGE_KEY_ADMIN: "sb-admin",
  ADMIN_SESSION_KEY: "isAdmin",
} as const;
