import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { REDIRECT_URL } from "@/config/constants";

interface UseAuthFormProps {
  mode: "login" | "register";
  onSuccess?: () => void;
}

export const useAuthForm = ({ mode, onSuccess }: UseAuthFormProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError("");

      try {
        // Определяем правильный redirect URL для email подтверждения
        // Для регистрации всегда используем https://zorki.pro в продакшене
        let redirectTo: string = 'https://zorki.pro/';
        // if (mode === "register") {
        //   // Проверяем, работаем ли мы в продакшене
        //   const isLocalhost = window.location.hostname === 'localhost' || 
        //                      window.location.hostname === '127.0.0.1' ||
        //                      window.location.hostname.includes('localhost') ||
        //                      window.location.hostname.includes('127.0.0.1');
          
        //   if (isLocalhost) {
        //     // В разработке используем текущий origin
        //     redirectTo = `${window.location.origin}/`;
        //   } else {
        //     // В продакшене всегда используем https://zorki.pro
        //     redirectTo = 'https://zorki.pro/';
        //   }
        // } else {
        //   redirectTo = REDIRECT_URL;
        // }
        
        const authFn = mode === "login" 
          ? () => supabase.auth.signInWithPassword({ email, password })
          : () => supabase.auth.signUp({ 
              email, 
              password, 
              options: { 
                emailRedirectTo: "https://zorki.pro"

              } 
            });
        
        // Логируем URL для отладки (всегда в dev, в prod только при регистрации)
        if (mode === "register") {
          console.log("📧 Email redirect URL для регистрации:", {
            redirectTo,
            currentOrigin: window.location.origin,
            hostname: window.location.hostname,
            isProduction: window.location.hostname === 'zorki.pro' || window.location.hostname === 'www.zorki.pro',
          });
        }
        
        const { data, error } = await authFn();
        
        if (error) {
          // Более подробная обработка ошибок
          console.error(`❌ Ошибка ${mode === "login" ? "входа" : "регистрации"}:`, {
            message: error.message,
            status: error.status,
            name: error.name,
          });
          
          // Специальная обработка для 401 ошибки
          if (error.status === 401) {
            setError(
              mode === "login" 
                ? "Неверный email или пароль" 
                : "Ошибка регистрации. Проверьте правильность данных или обратитесь в поддержку."
            );
          } else {
            setError(error.message || "Произошла ошибка при аутентификации");
          }
        } else {
          // Логирование успешной операции
          if (import.meta.env.DEV) {
            console.log(`✅ ${mode === "login" ? "Вход" : "Регистрация"} успешна:`, {
              user: data?.user?.email,
              session: !!data?.session,
            });
          }
          
          if (mode === "login") {
            onSuccess?.();
          } else {
            navigate("/email-confirmation");
          }
        }
      } catch (err) {
        // Обработка неожиданных ошибок
        console.error("❌ Неожиданная ошибка при аутентификации:", err);
        setError("Произошла неожиданная ошибка. Попробуйте еще раз.");
      } finally {
        setLoading(false);
      }
    },
    [mode, navigate, onSuccess],
  );

  const handleGoogleAuth = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Для Google OAuth redirect должен указывать на текущий домен с полным путем
      const redirectUrl = `https://zorki.pro`;
      
      // Сохраняем origin в localStorage (доступен между доменами через скрипт)
      // Также сохраняем в sessionStorage как fallback
      try {
        localStorage.setItem('oauth_redirect_origin', redirectUrl);
        sessionStorage.setItem('oauth_redirect_origin', redirectUrl);
      } catch (e) {
        console.warn("Не удалось сохранить origin:", e);
      }
      
      if (import.meta.env.DEV) {
        console.log("🔐 Google OAuth:", {
          redirectUrl,
          currentOrigin: window.location.origin,
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          savedOrigin: localStorage.getItem('oauth_redirect_origin'),
        });
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { 
          // redirectTo: 'http://localhost:8085/auth/v1/callback',
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error("❌ Ошибка Google OAuth:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        setError(error.message || "Ошибка при авторизации через Google");
      } else {
        // OAuth редирект произойдет автоматически
        if (import.meta.env.DEV) {
          console.log("✅ Google OAuth инициирован, ожидание редиректа...");
        }
      }
    } catch (err) {
      console.error("❌ Неожиданная ошибка при Google OAuth:", err);
      setError("Произошла неожиданная ошибка. Попробуйте еще раз.");
      setLoading(false);
    }
    // Не устанавливаем loading в false здесь, т.к. произойдет редирект
  }, []);

  return { loading, error, handleSubmit, handleGoogleAuth };
};