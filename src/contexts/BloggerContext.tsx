import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSession } from './SessionContext';
import type { ClientBloggerInfo, ClientLinkRequestInfo } from '@/api/types';
import {clientMeQueryKey, useClientMe} from "@/hooks/profile/useClientMeQuery.ts";
import {useQueryClient} from "@tanstack/react-query";

export interface BloggerContextType {
  bloggerInfo: ClientBloggerInfo | null;
  lastLinkRequest: ClientLinkRequestInfo | null;
  bloggerInfoLoading: boolean;
  bloggerInfoError: string | null;
  refreshBloggerInfo: () => Promise<void>;
  tryLoadBloggerInfo: () => Promise<void>;
  updateBloggerFields: (fields: Partial<ClientBloggerInfo>) => void;
  clearBloggerInfo: () => void;
}

const BloggerContext = createContext<BloggerContextType | undefined>(undefined);

export const useBlogger = () => {
  const context = useContext(BloggerContext);
  if (!context) {
    throw new Error('useBlogger must be used within a BloggerProvider');
  }
  return context;
};

interface BloggerProviderProps {
  children: ReactNode;
}

export const BloggerProvider = ({ children }: BloggerProviderProps) => {
  const { session, accessToken } = useSession();

  // КРИТИЧНО: Если нет валидной сессии - не загружаем данные
  const hasValidSession = !!(session?.access_token && accessToken && session?.user?.id);
  const {data, isLoading:bloggerInfoLoading, error, refetch} = useClientMe(hasValidSession)
  const queryClient = useQueryClient();

  const bloggerInfo = data?.blogger ?? null;
  const lastLinkRequest = data?.lastLinkRequest ?? null;
  const bloggerInfoError = error ? (error as Error).message : null;

  const refreshBloggerInfo = useCallback(async () => {
    if (!hasValidSession) return;
    await queryClient.invalidateQueries({queryKey:clientMeQueryKey});
  }, [hasValidSession, queryClient]);

  const tryLoadBloggerInfo = useCallback(async () => {
    if (!hasValidSession) return;
    try {
      await refetch({ throwOnError: false });
    } catch {}
  }, [hasValidSession, refetch]);

  const clearBloggerInfo = useCallback(() => {
    queryClient.removeQueries({queryKey:clientMeQueryKey});
  }, [queryClient]);

  const updateBloggerFields = useCallback((fields: Partial<ClientBloggerInfo>) => {
    queryClient.setQueryData(clientMeQueryKey, (prev: any) => {
      if (!prev?.blogger) return prev;
      return { ...prev, blogger: { ...prev.blogger, ...fields } };
    });
  }, [queryClient]);

  const value: BloggerContextType = {
    bloggerInfo,
    lastLinkRequest,
    bloggerInfoLoading,
    bloggerInfoError,
    refreshBloggerInfo,
    tryLoadBloggerInfo,
    updateBloggerFields,
    clearBloggerInfo,
  };

  return <BloggerContext.Provider value={value}>{children}</BloggerContext.Provider>;
};