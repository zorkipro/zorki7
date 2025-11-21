import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui-kit";
import { LoadingSpinner } from "@/ui-kit/components";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useParserAccounts } from "@/hooks/admin/useParserAccounts";
import { ParserAccountsTable } from "@/components/admin/parser/ParserAccountsTable";
import { AddInstagramAccountDialog } from "@/components/admin/parser/AddInstagramAccountDialog";
import { AddTelegramAccountDialog } from "@/components/admin/parser/AddTelegramAccountDialog";
import { AddYouTubeAccountDialog } from "@/components/admin/parser/AddYouTubeAccountDialog";
import { PlatformNotAvailableMessage } from "@/components/admin/parser/PlatformNotAvailableMessage";
import type { ParserPlatform } from "@/api/types";

const ErrorMessage: React.FC<{ error: string }> = ({ error }) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-4">
    <div className="text-sm text-red-600"><strong>Ошибка:</strong> {error}</div>
  </div>
);

interface AuthTabsConfig {
  platform: "INSTAGRAM" | "TELEGRAM";
  accounts: any[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  authStatus: "active" | "inactive";
  onAuthStatusChange: (status: "active" | "inactive") => void;
  onLoadMore: (isAuthorized: boolean) => void;
  onDelete: (id: number) => void;
  onLogout: (id: number) => void;
  onReauth?: (id: number, ...args: any[]) => Promise<void>;
}

const AuthTabs: React.FC<AuthTabsConfig> = ({
  platform,
  accounts,
  loading,
  error,
  hasMore,
  totalCount,
  authStatus,
  onAuthStatusChange,
  onLoadMore,
  onDelete,
  onLogout,
  onReauth,
}) => {
  return (
    <Tabs value={authStatus} onValueChange={(v) => onAuthStatusChange(v as "active" | "inactive")} className="space-y-4">
      <TabsList className="grid w-full grid-cols-2 gap-1 h-auto">
        <TabsTrigger value="active" className="flex items-center space-x-2 py-2">
          <span className="text-sm font-medium">Активные</span>
        </TabsTrigger>
        <TabsTrigger value="inactive" className="flex items-center space-x-2 py-2">
          <span className="text-sm font-medium">Неактивные</span>
        </TabsTrigger>
      </TabsList>
      {error && <ErrorMessage error={error} />}
      <TabsContent value="active" className="space-y-4">
        <ParserAccountsTable
          accounts={accounts}
          platform={platform}
          loading={loading}
          hasMore={hasMore}
          totalCount={totalCount}
          onLoadMore={() => onLoadMore(true)}
          onDelete={onDelete}
          onLogout={onLogout}
        />
      </TabsContent>
      <TabsContent value="inactive" className="space-y-4">
        <ParserAccountsTable
          accounts={accounts}
          platform={platform}
          loading={loading}
          hasMore={hasMore}
          totalCount={totalCount}
          onLoadMore={() => onLoadMore(false)}
          onDelete={onDelete}
          onLogout={onLogout}
          onReauth={onReauth}
        />
      </TabsContent>
    </Tabs>
  );
};

const ParserAccountsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ParserPlatform>("INSTAGRAM");
  const [igAuthStatus, setIgAuthStatus] = useState<"active" | "inactive">("active");
  const [tgAuthStatus, setTgAuthStatus] = useState<"active" | "inactive">("active");
  
  const {
    igAccounts, igLoading, igError, igHasMore, igTotalCount, fetchIgAccounts, loadMoreIgAccounts,
    addIgAccount, deleteIgAccount, logoutIgAccount, reauthIgAccount,
    tgAccounts, tgLoading, tgError, tgHasMore, tgTotalCount, fetchTgAccounts, loadMoreTgAccounts,
    addTgAccount, confirmTgAccount, deleteTgAccount, logoutTgAccount, reauthTgAccount,
    ytAccounts, ytLoading, ytError, ytHasMore, ytTotalCount, fetchYtAccounts, loadMoreYtAccounts,
    addYtAccount, deleteYtAccount,
    isProcessing,
  } = useParserAccounts();

  useEffect(() => {
    if (activeTab === "INSTAGRAM") fetchIgAccounts({ isAuthorized: igAuthStatus === "active" });
    else if (activeTab === "TELEGRAM") fetchTgAccounts({ isAuthorized: tgAuthStatus === "active" });
    else if (activeTab === "YOUTUBE") fetchYtAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, igAuthStatus, tgAuthStatus]);

  const confirmAction = (message: string, handler: (id: number) => Promise<void>) =>
    async (id: number) => {
      if (window.confirm(message)) await handler(id);
    };

  const isLoading = 
    (activeTab === "INSTAGRAM" && igLoading && igAccounts.length === 0) ||
    (activeTab === "TELEGRAM" && tgLoading && tgAccounts.length === 0) ||
    (activeTab === "YOUTUBE" && ytLoading && ytAccounts.length === 0);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка аккаунтов парсера..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <AdminHeader />

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Управление аккаунтами парсера</h1>
          <p className="text-gray-600">Добавление и управление аккаунтами для парсинга данных по каждой платформе</p>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ParserPlatform)} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto">
            <TabsTrigger value="INSTAGRAM" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1">
              <span className="text-lg sm:text-base">📸</span>
              <span className="text-xs sm:text-sm font-medium">Instagram</span>
            </TabsTrigger>
            <TabsTrigger value="TELEGRAM" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1">
              <span className="text-lg sm:text-base">✈️</span>
              <span className="text-xs sm:text-sm font-medium">Telegram</span>
            </TabsTrigger>
            <TabsTrigger value="YOUTUBE" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1">
              <span className="text-lg sm:text-base">📺</span>
              <span className="text-xs sm:text-sm font-medium">YouTube</span>
            </TabsTrigger>
            <TabsTrigger value="TIKTOK" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1">
              <span className="text-lg sm:text-base">🎵</span>
              <span className="text-xs sm:text-sm font-medium">TikTok</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="INSTAGRAM" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-muted-foreground flex-1 min-w-0">
                <span className="hidden sm:inline">Управление Instagram аккаунтами для парсинга данных.</span>
                <span className="sm:hidden">Управление Instagram аккаунтами.</span>
              </p>
              <AddInstagramAccountDialog onAddAccount={addIgAccount} disabled={isProcessing} />
            </div>
            <AuthTabs
              platform="INSTAGRAM"
              accounts={igAccounts}
              loading={igLoading}
              error={igError}
              hasMore={igHasMore}
              totalCount={igTotalCount}
              authStatus={igAuthStatus}
              onAuthStatusChange={setIgAuthStatus}
              onLoadMore={(isAuthorized) => loadMoreIgAccounts({ isAuthorized })}
              onDelete={confirmAction("Вы уверены, что хотите удалить этот Instagram аккаунт?", deleteIgAccount)}
              onLogout={confirmAction("Вы уверены, что хотите отключить этот Instagram аккаунт?", logoutIgAccount)}
              onReauth={reauthIgAccount}
            />
          </TabsContent>

          <TabsContent value="TELEGRAM" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-muted-foreground flex-1 min-w-0">
                <span className="hidden sm:inline">Управление Telegram аккаунтами для парсинга данных.</span>
                <span className="sm:hidden">Управление Telegram аккаунтами.</span>
              </p>
              <AddTelegramAccountDialog onAddAccount={addTgAccount} onConfirmAccount={confirmTgAccount} disabled={isProcessing} />
            </div>
            <AuthTabs
              platform="TELEGRAM"
              accounts={tgAccounts}
              loading={tgLoading}
              error={tgError}
              hasMore={tgHasMore}
              totalCount={tgTotalCount}
              authStatus={tgAuthStatus}
              onAuthStatusChange={setTgAuthStatus}
              onLoadMore={(isAuthorized) => loadMoreTgAccounts({ isAuthorized })}
              onDelete={confirmAction("Вы уверены, что хотите удалить этот Telegram аккаунт?", deleteTgAccount)}
              onLogout={confirmAction("Вы уверены, что хотите отключить этот Telegram аккаунт?", logoutTgAccount)}
              onReauth={reauthTgAccount}
            />
          </TabsContent>

          <TabsContent value="YOUTUBE" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-muted-foreground flex-1 min-w-0">
                <span className="hidden sm:inline">Управление YouTube API сессиями для парсинга данных.</span>
                <span className="sm:hidden">Управление YouTube сессиями.</span>
              </p>
              <AddYouTubeAccountDialog onAddAccount={addYtAccount} disabled={isProcessing} />
            </div>
            {ytError && <ErrorMessage error={ytError} />}
            <ParserAccountsTable
              accounts={ytAccounts}
              platform="YOUTUBE"
              loading={ytLoading}
              hasMore={ytHasMore}
              onLoadMore={loadMoreYtAccounts}
              onDelete={confirmAction("Вы уверены, что хотите удалить эту YouTube сессию?", deleteYtAccount)}
              totalCount={ytTotalCount}
            />
          </TabsContent>

          <TabsContent value="TIKTOK">
            <PlatformNotAvailableMessage platform="TIKTOK" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ParserAccountsManagement;
