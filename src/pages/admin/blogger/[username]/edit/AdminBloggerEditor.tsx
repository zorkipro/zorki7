import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/ui-kit";
import { Card, CardContent, Label, Textarea } from "@/ui-kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui-kit";
import { ArrowLeft, AlertCircle, Edit } from "lucide-react";
import { Alert, AlertDescription } from "@/ui-kit";
import { LoadingSpinner } from "@/ui-kit/components";
import { BloggerInfo } from "@/components/profile/BloggerInfo";
import { VerificationNotice } from "@/components/profile/VerificationNotice";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PlatformProfileForm } from "@/components/profile/organisms/PlatformProfileForm";
import { PricingSection } from "@/components/profile/organisms/PricingSection";
import { useAdminBloggerEditor } from "@/hooks/admin/useAdminBloggerEditor";
import { useAdminStatsFileManagement } from "@/hooks/admin/useAdminStatsFileManagement";
import { formatNumber } from "@/utils/formatters";
import type { ApiSocialType } from "@/api/types";

export const AdminBloggerEditor = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const {
    profile,
    formData,
    loading,
    saving,
    error,
    activeTab,
    editingSection,
    availablePlatforms,
    updateFormData,
    handleSave,
    setActiveTab,
    setEditingSection,
    setAvailablePlatforms,
    refetch: fetchBloggerData,
  } = useAdminBloggerEditor(username);

  const platformType = activeTab === "settings" ? "INSTAGRAM" : activeTab.toUpperCase();
  const platformSocial = profile?.social?.find(s => s.type === platformType);
  const currentPlatformScreenshots = platformSocial?.statsFiles?.map(file => ({
    id: file.id,
    influencer_id: profile.id,
    platform: platformSocial.type.toLowerCase(),
    file_name: file.name,
    file_url: file.publicUrl,
    file_size: file.size * 1024,
    width: file.width,
    height: file.height,
    created_at: file.createdAt,
    is_draft: false,
  })) || [];

  const {
    files: statsFiles,
    uploading: uploadingStats,
    uploadFiles: uploadStatsFiles,
    deleteFile: deleteStatsFile,
  } = useAdminStatsFileManagement(
    profile?.id?.toString(),
    platformType as ApiSocialType,
    currentPlatformScreenshots,
    fetchBloggerData
  );

  const handleStatsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !profile?.id) return;

    try {
      await uploadStatsFiles(Array.from(files));
    } catch {
      // Ошибка обработана в хуке
    } finally {
      event.target.value = "";
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Загрузка профиля..." />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Профиль не найден</h3>
            <p className="text-muted-foreground mb-4">
              Запрашиваемый профиль не существует или у вас нет доступа к нему.
            </p>
            <Button onClick={() => navigate("/admin")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к админке
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Находим основную платформу (Instagram приоритет, иначе первая)
  const mainSocial = profile?.social?.find(s => s.type === "INSTAGRAM") || profile?.social?.[0];
  
  // Получаем данные из профиля или черновика
  const profileData = profile?.profileDraft || profile;
  const fullName = profileData?.name && profileData?.lastName 
    ? `${profileData.name} ${profileData.lastName}`.trim()
    : profileData?.name || mainSocial?.title || mainSocial?.username || "Неизвестный блогер";
  
  // Получаем цены (приоритет черновикам)
  const priceData = profile?.priceDraft || profile?.price || [];
  const instagramPrice = priceData.find(p => p.type === "INSTAGRAM");
  
  // Формируем объект platforms
  const platforms: Blogger["platforms"] = {};
  profile?.social?.forEach((social) => {
    const platformPrice = priceData.find(p => p.type === social.type);
    const platformKey = social.type.toLowerCase() as keyof Blogger["platforms"];
    platforms[platformKey] = {
      username: social.username,
      subscribers: parseInt(social.subscribers || "0"),
      er: social.er || 0,
      reach: parseInt(social.postCoverage || "0"),
      price: parseFloat(platformPrice?.postPrice || "0"),
      storyReach: parseInt(social.coverage || "0"),
      storyPrice: parseFloat(platformPrice?.storiesPrice || "0"),
      integrationPrice: parseFloat(platformPrice?.integrationPrice || "0"),
    };
  });

  const profileForHeader = profile ? {
    id: profile.id.toString(),
    name: fullName,
    handle: mainSocial?.username || "",
    avatar: mainSocial?.avatar || "",
    promoText: mainSocial?.description || profileData?.description || "",
    platforms,
    followers: parseInt(mainSocial?.subscribers || "0"),
    postPrice: parseFloat(instagramPrice?.postPrice || "0"),
    storyPrice: parseFloat(instagramPrice?.storiesPrice || "0"),
    postReach: parseInt(mainSocial?.postCoverage || "0"),
    storyReach: parseInt(mainSocial?.coverage || "0"),
    engagementRate: mainSocial?.er || 0,
    gender: profileData?.genderType?.toLowerCase() as "мужчина" | "женщина" | "пара" | "паблик" | undefined,
    category: "",
    topics: profileData?.topics?.map(t => t.id) || [],
    allowsBarter: profileData?.isBarterAvailable || false,
    inMartRegistry: profileData?.isMartRegistry || false,
    restrictedTopics: profileData?.restrictedTopics?.map(t => t.id) || [],
    cooperationConditions: profileData?.cooperation || "",
    workFormat: profileData?.workFormat || "",
    paymentTerms: "",
    contact_url: profileData?.contactLink || "",
    verificationStatus: profile.verificationStatus,
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {profileForHeader && (
        <ProfileHeader
          profile={profileForHeader}
          formData={formData}
          hasUnsavedChanges={false}
          onBack={() => navigate("/admin")}
          onFormDataChange={updateFormData}
          editingSection={editingSection}
          onEditingSectionChange={setEditingSection}
          handleSave={handleSave}
          saving={saving}
          setEditingSection={setEditingSection}
        />
      )}

      {error && (
        <div className="container mx-auto px-4 pt-4">
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
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
              screenshots={statsFiles}
              uploadingScreenshot={uploadingStats}
              loadingScreenshots={false}
              screenshotError={null}
              onScreenshotUpload={handleStatsUpload}
              onDeleteScreenshot={deleteStatsFile}
            />
          </div>

          <div className="space-y-6">
            <PricingSection
              availablePlatforms={availablePlatforms}
              formData={formData}
              editingSection={editingSection}
              onEditingSectionChange={setEditingSection}
              onSave={handleSave}
              saving={saving}
            />

            <BloggerInfo
              formData={formData}
              editingSection={editingSection}
              onEditingChange={setEditingSection}
              onSave={handleSave}
              saving={saving}
            />

            <Card className="relative">
              <CardContent className="p-4">
                <div className="absolute top-2 right-2">
                  <Dialog
                    open={editingSection === "cooperation_conditions"}
                    onOpenChange={(open) => setEditingSection(open ? "cooperation_conditions" : null)}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Редактировать условия сотрудничества</DialogTitle>
                        <DialogDescription>Обновите условия сотрудничества для профиля</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cooperation_conditions">Условия сотрудничества</Label>
                          <Textarea
                            id="cooperation_conditions"
                            defaultValue={formData.cooperation_conditions}
                            placeholder="Опишите условия сотрудничества..."
                            rows={4}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setEditingSection(null)}>
                            Отмена
                          </Button>
                          <Button
                            onClick={async () => {
                              const textarea = document.getElementById("cooperation_conditions") as HTMLTextAreaElement;
                              try {
                                await handleSave({ cooperation_conditions: textarea.value });
                                setEditingSection(null);
                              } catch {
                                // Ошибка обработана в handleSave
                              }
                            }}
                            disabled={saving}
                          >
                            Сохранить
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <h3 className="font-semibold mb-4">Условия сотрудничества</h3>
                <p className="text-muted-foreground">
                  {formData.cooperation_conditions || "Нажмите на иконку редактирования, чтобы добавить условия сотрудничества..."}
                </p>
              </CardContent>
            </Card>

            <VerificationNotice
              profileStatus={profile?.verificationStatus === "APPROVED" ? "verified" : "unverified"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBloggerEditor;
