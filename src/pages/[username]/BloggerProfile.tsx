import {useParams, useNavigate, useLocation} from "react-router-dom";
import { Button } from "@/ui-kit";
import { LoadingSpinner } from "@/ui-kit/components";
import { useBloggerProfile } from "@/hooks/useBloggerProfile.ts";
import { BloggerProfileHeader } from "@/components/blogger-profile/BloggerProfileHeader.tsx";
import { BloggerProfileTabs } from "@/components/blogger-profile/BloggerProfileTabs.tsx";
import { BloggerProfilePricing } from "@/components/blogger-profile/BloggerProfilePricing.tsx";

const BloggerProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const bloggerId = location.state?.bloggerId ?? undefined;
  const { blogger, loading, error } = useBloggerProfile({username, id: Number(bloggerId)});

  if (loading) {
    return <LoadingSpinner fullScreen text="Загрузка профиля..." />;
  }

  if (error || !blogger) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Блогер не найден</h1>
          <Button onClick={() => navigate("/")}>Вернуться к рейтингу</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <BloggerProfileHeader blogger={blogger} onBack={() => navigate("/")} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Stats - 3 columns */}
          <div className="lg:col-span-3">
            <BloggerProfileTabs blogger={blogger} />
          </div>

          {/* Sidebar - 1 column */}
          <div>
            <BloggerProfilePricing blogger={blogger} />
          </div>
        </div>
      </div>
    </div>
  );
};


export default BloggerProfile;