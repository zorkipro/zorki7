/**
 * SessionContext - управление аутентификацией и сессией пользователя
 * Отвечает только за auth state (SRP - Single Responsibility Principle)
 */

import {createContext, useContext, useEffect, useState, useCallback, ReactNode,} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { saveAccessToken, removeAccessToken } from "@/utils/googleAuth";
import {clientMeQueryKey} from "@/hooks/profile/useClientMeQuery.ts";
import {useQueryClient} from "@tanstack/react-query";
import {ClientAuthMeOutputDto} from "@/api/types.ts";
import { getClientMe } from "@/api/endpoints/client";
import { API_BASE_URL } from "@/config/constants";

export interface SessionContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accessToken: string | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  determineRedirectPath: () => Promise<string>;
  isSessionReady:boolean
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const isSessionReady = !!user && !!accessToken && !loading;

  const queryClient = useQueryClient();

  const determineRedirectPath = useCallback(async (): Promise<string> => {
    const cachedData:ClientAuthMeOutputDto = queryClient.getQueryData(clientMeQueryKey);

    if (cachedData) {
      const username =
          cachedData.blogger?.username || cachedData.lastLinkRequest?.username;
      return username ? "/profile/edit" : "/profile-setup";
    }

  }, [queryClient]);

  const updateSession = useCallback((newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);

    const token = newSession?.access_token ?? null;
    setAccessToken(token);

    if (token) {
      saveAccessToken(token);
    } else {
      removeAccessToken();
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      updateSession(data.session);
    } catch (error) {
      logger.error("Failed to refresh session", error);
    }
  }, [updateSession]);

  const signOut = useCallback(async () => {
    try {
      removeAccessToken();
      setAccessToken(null);

      await supabase.auth.signOut();

      setUser(null);
      setSession(null);
    } catch (error) {
      logger.error("Sign out failed", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    // Проверка: если мы на Supabase домене с hash параметрами, перенаправляем на фронтенд
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const currentHost = window.location.hostname;
    const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : null;
    const hasHashParams = window.location.hash.includes('access_token');

    if (supabaseHost && currentHost === supabaseHost && hasHashParams) {
      // Определяем фронтенд домен из localStorage, sessionStorage, API_BASE_URL или используем значение по умолчанию
      let frontendOrigin = localStorage.getItem('oauth_redirect_origin') || sessionStorage.getItem('oauth_redirect_origin');

      if (frontendOrigin) {
        frontendOrigin = frontendOrigin.replace(/\/$/, ''); // Убираем trailing slash
      } else {
        // Пытаемся определить из API_BASE_URL
        try {
          const apiUrl = new URL(API_BASE_URL);
          // Если API на zorki.pro, то фронтенд тоже на zorki.pro
          if (apiUrl.hostname === 'zorki.pro' || apiUrl.hostname.includes('zorki.pro')) {
            frontendOrigin = 'https://zorki.pro';
          } else {
            // Иначе используем значение по умолчанию
            frontendOrigin = import.meta.env.DEV ? 'http://localhost:8085' : 'https://zorki.pro';
          }
        } catch {
          // Fallback на значения по умолчанию
          frontendOrigin = import.meta.env.DEV ? 'http://localhost:8085' : 'https://zorki.pro';
        }
      }

      const redirectUrl = `${frontendOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`;

      console.log("🔄 Перенаправление с Supabase домена на фронтенд", {
        from: window.location.href,
        to: redirectUrl,
        determinedFrom: localStorage.getItem('oauth_redirect_origin') || sessionStorage.getItem('oauth_redirect_origin') ? 'localStorage/sessionStorage' : 'API_BASE_URL/fallback',
      });

      // Перенаправляем на фронтенд с теми же параметрами
      window.location.replace(redirectUrl);
      return;
    }

    // Обработка hash параметров из URL (для email confirmation и OAuth)
    const handleHashParams = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      // Обрабатываем токены из hash (для OAuth и email confirmation)
      if (accessToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            logger.error("Failed to set session from hash", error);
          } else if (data.session) {
            // Очищаем hash из URL
            window.history.replaceState(null, '', window.location.pathname);
            updateSession(data.session);

            if (import.meta.env.DEV) {
              console.log("✅ Session установлена из hash параметров", {
                type: type || 'oauth',
                hasRefreshToken: !!refreshToken,
              });
            }
          }
        } catch (error) {
          logger.error("Error handling hash params", error);
        }
      }
    };

    handleHashParams();

    // Подписка на изменения auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      updateSession(newSession);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      updateSession(initialSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [updateSession]);

  const value: SessionContextType = {
    user,
    session,
    loading,
    accessToken,
    signOut,
    refreshSession,
    determineRedirectPath,
    isSessionReady
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
