import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import {QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

// Проверка: если мы на Supabase домене, перенаправляем на фронтенд
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const currentHost = window.location.hostname;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : null;

if (supabaseHost && currentHost === supabaseHost) {
  // Определяем фронтенд домен
  let frontendOrigin: string;

  // Пытаемся получить из localStorage или sessionStorage (если был сохранен при инициации OAuth)
  const savedOrigin = localStorage.getItem('oauth_redirect_origin') || sessionStorage.getItem('oauth_redirect_origin');

  if (savedOrigin) {
    frontendOrigin = savedOrigin.replace(/\/$/, ''); // Убираем trailing slash
  } else {
    // Определяем из API_BASE_URL или используем значение по умолчанию
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://zorki.pro/api";
      const apiUrl = new URL(API_BASE_URL);
      if (apiUrl.hostname === 'zorki.pro' || apiUrl.hostname.includes('zorki.pro')) {
        frontendOrigin = 'https://zorki.pro';
      } else {
        frontendOrigin = import.meta.env.DEV ? 'http://localhost:8085' : 'https://zorki.pro';
      }
    } catch {
      frontendOrigin = import.meta.env.DEV ? 'http://localhost:8085' : 'https://zorki.pro';
    }
  }

  // Сохраняем hash параметры если есть
  const hash = window.location.hash || '';
  const search = window.location.search || '';

  const redirectUrl = `${frontendOrigin}${window.location.pathname}${search}${hash}`;

  console.log("🔄 Перенаправление с Supabase домена на фронтенд", {
    from: window.location.href,
    to: redirectUrl,
    determinedFrom: savedOrigin ? 'localStorage/sessionStorage' : 'API_BASE_URL/fallback',
    hasHash: !!hash,
  });

  // Перенаправляем на фронтенд с теми же параметрами
  window.location.replace(redirectUrl);
} else {
  // Нормальная загрузка приложения
    createRoot(document.getElementById("root")!).render(
        <HelmetProvider>
            <QueryClientProvider client={queryClient}>
                <App />
                <ReactQueryDevtools initialIsOpen={false} buttonPosition={'bottom-right'} />
            </QueryClientProvider>
        </HelmetProvider>,
    );
}
