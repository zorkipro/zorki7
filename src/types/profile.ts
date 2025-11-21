import type { Blogger } from "./blogger";

// Main influencer type - используем Blogger как временное решение
export type Influencer = Blogger;
export type InfluencerInsert = Partial<Blogger>;
export type InfluencerUpdate = Partial<Blogger>;

// Platform stats type - alias к PlatformData для совместимости
export type PlatformStats = PlatformData;
export type PlatformStatsInsert = Partial<PlatformStats>;
export type PlatformStatsUpdate = Partial<PlatformStats>;

// Platform type - временное решение
export type Platform = {
  id: number;
  name: string;
  display_name: string;
  created_at: string;
};

// Topic types - временное решение
export type Topic = {
  id: number;
  name: string;
  is_topic_restricted: boolean;
  created_at: string;
};
export type BannedTopic = Topic;

// Profile edit types - временное решение
export type ProfileEdit = {
  id: number;
  influencer_id: number;
  field_name: string;
  old_value: string;
  new_value: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
};
export type ProfileEditInsert = Partial<ProfileEdit>;
export type ProfileEditUpdate = Partial<ProfileEdit>;

// Screenshot draft types - временное решение
export type ScreenshotDraft = {
  id: number;
  influencer_id: number;
  platform: string;
  file_name: string;
  file_url: string;
  file_size: number;
  created_at: string;
};
export type ScreenshotDraftInsert = Partial<ScreenshotDraft>;
export type ScreenshotDraftUpdate = Partial<ScreenshotDraft>;

// Screenshot data - временное решение
export type Screenshot = {
  id: number;
  influencer_id: number;
  platform: string;
  file_name: string;
  file_url: string;
  file_size: number;
  width: number;
  height: number;
  created_at: string;
  is_draft?: boolean;
};

// Influencer profile type - временное решение
export type InfluencerProfile = {
  id: number;
  influencer_id: number;
  full_name: string;
  description: string;
  avatar_url: string;
  barter_available: boolean;
  mart_registry: boolean;
  contact_link: string;
  work_format: string;
  gender_type: string;
  cooperation_conditions: string;
  created_at: string;
  updated_at: string;
};
export type InfluencerProfileInsert = Partial<InfluencerProfile>;
export type InfluencerProfileUpdate = Partial<InfluencerProfile>;


export type Work_format_Type = "ИП" | "профдоход" | "договор подряда" | "ООО" | "";
type Gender_Type = "мужчина" | "женщина" | "пара" | "паблик" | "";

// Extended edit data interface for ProfileEditor
export interface EditData {
  // Basic profile fields (соответствуют таблице influencers)
  full_name: string;
  description: string;
  avatar_url: string;
  barter_available: boolean;
  mart_registry: boolean;
  contact_link: string;
  work_format: Work_format_Type;
  gender_type: Gender_Type;
  cooperation_conditions: string;

  // Instagram platform fields (соответствуют таблице influencer_platform_stats)
  instagram_username: string;
  instagram_profile_url: string;
  instagram_followers: string;
  instagram_engagement_rate: string;
  instagram_post_reach: string;
  instagram_story_reach: string;
  instagram_post_price: string;
  instagram_story_price: string;
  instagram_integration_price: string;

  // TikTok platform fields
  tiktok_username: string;
  tiktok_profile_url: string;
  tiktok_followers: string;
  tiktok_engagement_rate: string;
  tiktok_post_reach: string;
  tiktok_story_reach: string;
  tiktok_post_price: string;
  tiktok_story_price: string;
  tiktok_integration_price: string;

  // YouTube platform fields
  youtube_username: string;
  youtube_profile_url: string;
  youtube_followers: string;
  youtube_engagement_rate: string;
  youtube_post_reach: string;
  youtube_story_reach: string;
  youtube_post_price: string;
  youtube_story_price: string;
  youtube_integration_price: string;

  // Telegram platform fields
  telegram_username: string;
  telegram_profile_url: string;
  telegram_followers: string;
  telegram_engagement_rate: string;
  telegram_post_reach: string;
  telegram_story_reach: string;
  telegram_post_price: string;
  telegram_story_price: string;
  telegram_integration_price: string;

  // Topics and banned topics (через связующие таблицы)
  // Поддержка как названий (string), так и ID (number) для универсальности
  topics: (string | number)[];
  banned_topics: (string | number)[];
}

// Platform data structure for statistics display
export interface PlatformData {
  username?: string;
  profile_url?: string;
  subscribers: number;
  er: number;
  reach: number;
  price: number;
  storyReach: number;
  storyPrice: number;
  integrationPrice?: number; // Цена за интеграцию
  views?: number;
  screenshots?: Screenshot[]; // Добавляем скриншоты
  isPending?: boolean; // Флаг "на модерации" для новых платформ
  isLoading?: boolean; // НОВОЕ: индикатор загрузки при перепривязке
}

// Form validation errors
export type ProfileFormErrors = Partial<Record<keyof EditData, string>>;

// Platform types
export type PlatformType = "instagram" | "tiktok" | "youtube" | "telegram";

// Verification status types
export type VerificationStatus =
  | "новый"
  | "на проверке"
  | "одобрен"
  | "отклонён";

// Visibility status types
export type VisibilityStatus = "виден" | "скрыт" | "удалён";

// Edit status types
export type EditStatus = "new" | "pending" | "approved" | "rejected";

// Work format types
export type WorkFormat = "ИП" | "профдоход" | "договор подряда" | "ООО";

// Gender type
export type GenderType = "мужчина" | "женщина" | "пара" | "паблик";

// Profile editor state interface
export interface ProfileEditorState {
  profile: Influencer | null;
  loading: boolean;
  saving: boolean;
  error: string;
  successMessage: string;
  formData: EditData;
  availablePlatforms: Record<PlatformType, PlatformData>;
  activeTab: PlatformType | "settings";
  editingSection: string | null;
}

// Hook return types
export interface UseProfileEditorReturn extends ProfileEditorState {
  updateFormData: (updates: Partial<EditData>) => void;
  saveProfile: (sectionData: Partial<EditData>) => Promise<void>;
  setActiveTab: (tab: PlatformType) => void;
  setEditingSection: (section: string | null) => void;
  setError: (error: string) => void;
  setSuccessMessage: (message: string) => void;
  addOrUpdatePlatform?: (
    platformId: PlatformType,
    platformData: PlatformData,
  ) => Promise<void>;
  deletePlatform?: (platformId: PlatformType) => Promise<void>;
}

export interface UseScreenshotManagerReturn {
  screenshots: Screenshot[];
  uploading: boolean;
  loading: boolean;
  error: string;
  uploadScreenshot: (file: File, userId: string) => Promise<void>;
  uploadMultipleScreenshots: (files: File[], userId: string) => Promise<void>;
  deleteScreenshot: (screenshot: Screenshot) => Promise<void>;
  fetchScreenshots: () => Promise<void>;
}
