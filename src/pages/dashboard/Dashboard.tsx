import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
// Star icon removed - using logo image instead
import { LoadingSpinner } from "@/ui-kit/components";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardProfileCard } from "@/components/dashboard/DashboardProfileCard";
import { DashboardPlatformCard } from "@/components/dashboard/DashboardPlatformCard";
import { useDashboardNavigation } from "@/hooks/dashboard/useDashboardNavigation";

const DashboardComponent = () => {
  const {
    user,
    signOut,
    loading,
    bloggerInfo,
    lastLinkRequest,
    bloggerInfoLoading,
  } = useAuth();
  const [error, setError] = useState("");

  // Используем данные из AuthContext вместо отдельного запроса
  const userBlogger = bloggerInfo;

  // Используем хук для навигации
  useDashboardNavigation({
    user,
    userBlogger,
    bloggerInfoLoading,
  });

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  // Memoized computed values
  const displayName = useMemo(() => {
    return userBlogger
      ? `${userBlogger.name || ""} ${userBlogger.lastName || ""}`.trim() ||
          user?.email
      : user?.email;
  }, [userBlogger?.name, userBlogger?.lastName, user?.email]);

  const profileStatusInfo = useMemo(() => {
    if (!userBlogger) return null;

    const statusConfig = {
      verified: { color: "bg-green-500", text: "Верифицирован" },
      pending: { color: "bg-yellow-500", text: "На модерации" },
      new: { color: "bg-gray-500", text: "Новый" },
      rejected: { color: "bg-red-500", text: "Отклонён" },
    };

    return statusConfig[userBlogger.verificationStatus] || statusConfig["new"];
  }, [userBlogger?.verificationStatus]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Загрузка..." />;
  }

  // If we have a blogger profile, we'll redirect immediately
  // If not, we'll show a simplified dashboard to set up the profile
  if (userBlogger) {
    // Redirect happens in the useEffect, but we show a loading state while redirecting
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <img
            src="/logo.svg"
            alt="Zorki"
            className="w-8 h-8 mx-auto mb-4"
          />
          <p className="text-muted-foreground">
            Перенаправление в редактор профиля...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <DashboardHeader
        displayName={displayName || ""}
        onSignOut={handleSignOut}
      />

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Личный кабинет блогера</h1>

          <div className="grid gap-6">
            {/* Profile Info */}
            <DashboardProfileCard
              userBlogger={userBlogger}
              userEmail={user?.email}
              lastLinkRequest={lastLinkRequest}
            />

            {/* Platform Management */}
            <DashboardPlatformCard
              userBlogger={userBlogger}
              displayName={displayName || ""}
              profileStatusInfo={profileStatusInfo}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the memoized component
export const Dashboard = memo(DashboardComponent);
export default Dashboard;
