import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui-kit";
import { Alert, AlertDescription } from "@/ui-kit";
import { LoadingSpinner } from "@/ui-kit/components";
import { BloggerInfo } from "@/components/profile/BloggerInfo";
import { VerificationNotice } from "@/components/profile/VerificationNotice";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PlatformProfileForm } from "@/components/profile/organisms/PlatformProfileForm";
import { PricingSection } from "@/components/profile/organisms/PricingSection";
import { CooperationTermsSection } from "@/components/profile/CooperationTermsSection";
import { useProfileEditor } from "@/hooks/profile/useProfileEditor";
import { useScreenshotManager } from "@/hooks/profile/useScreenshotManager";
import { formatNumber } from "@/utils/formatters";

const ProfileEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    profile,
    loading,
    saving,
    error,
    formData,
    availablePlatforms,
    activeTab,
    editingSection,
    updateFormData,
    handleSave,
    setActiveTab,
    setEditingSection,
    setAvailablePlatforms,
  } = useProfileEditor();

  const platform = activeTab === "settings" ? "instagram" : activeTab;

  const handleScreenshotsUpdate = useCallback(
    (platform: string, screenshots: any[]) => {
      setAvailablePlatforms((prev) => ({
        ...prev,
        [platform]: { ...prev[platform], screenshots },
      }));
    },
    [setAvailablePlatforms]
  );

  const {
    screenshots,
    uploading: uploadingScreenshot,
    loading: loadingScreenshots,
    error: screenshotError,
    uploadScreenshot,
    uploadMultipleScreenshots,
    deleteScreenshot,
  } = useScreenshotManager(profile?.id, platform, true, handleScreenshotsUpdate);

  const handleScreenshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length || !profile?.id || !user?.id) return;
    const files = Array.from(event.target.files);
    await (files.length === 1 ? uploadScreenshot(files[0], user.id) : uploadMultipleScreenshots(files, user.id));
    event.target.value = "";
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Загрузка профиля..." />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Профиль не найден</CardTitle>
            <CardDescription>
              Запрашиваемый профиль не существует или у вас нет доступа к нему.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                На главную
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader
        profile={profile}
        formData={formData}
        onBack={() => navigate("/")}
        onFormDataChange={updateFormData}
        editingSection={editingSection}
        onEditingSectionChange={setEditingSection}
        handleSave={handleSave}
        saving={saving}
      />

      {error && (
        <div className="container mx-auto px-4 pt-4">
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
          <div className="lg:col-span-3 space-y-6 sm:space-y-8">
            <PlatformProfileForm
              formData={formData}
              onFormDataChange={updateFormData}
              availablePlatforms={availablePlatforms}
              onAvailablePlatformsChange={setAvailablePlatforms}
              formatNumber={formatNumber}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              editingSection={editingSection}
              onEditingSectionChange={setEditingSection}
              onSave={handleSave}
              saving={saving}
              screenshots={screenshots}
              uploadingScreenshot={uploadingScreenshot}
              loadingScreenshots={loadingScreenshots}
              screenshotError={screenshotError}
              onScreenshotUpload={handleScreenshotUpload}
              onDeleteScreenshot={deleteScreenshot}
              bloggerId={parseInt(profile.id, 10)}
              isVerified={profile.verificationStatus === "APPROVED"}
            />
          </div>

          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <PricingSection
              availablePlatforms={availablePlatforms}
              formData={formData}
              editingSection={editingSection}
              onEditingSectionChange={setEditingSection}
              onSave={handleSave}
              saving={saving}
              setAvailablePlatforms={setAvailablePlatforms}
            />

            <BloggerInfo
              formData={formData}
              editingSection={editingSection}
              onEditingChange={setEditingSection}
              onSave={handleSave}
              saving={saving}
            />

            <CooperationTermsSection
              cooperationConditions={formData.cooperation_conditions || ""}
              editingSection={editingSection}
              saving={saving}
              onEditingSectionChange={setEditingSection}
              onSave={handleSave}
            />

            <VerificationNotice
              profileStatus={profile.verificationStatus === "APPROVED" ? "verified" : "unverified"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;