import { useParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/ui-kit/components";
import BloggerProfile from "@/pages/[username]/BloggerProfile.tsx";
import NotFound from "@/pages/system/not-found/NotFound.tsx";

// const NotFound = lazy(() => import("@/pages/NotFound"));

const RESERVED_PATHS = new Set([
  "a", "api", "admin", "login", "register", "dashboard", "profile",
  "terms", "privacy", "dev-tools", "forgot-password",
  "email-confirmation", "profile-setup",
]);

export const BloggerProfileRoute = () => {
  const { username } = useParams<{ username: string }>();

  if (!username || RESERVED_PATHS.has(username.toLowerCase())) {
    return (
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <NotFound />
      </Suspense>
    );
  }

  return <BloggerProfile />;
};

