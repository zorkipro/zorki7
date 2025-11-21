import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/ui-kit";
import { Input } from "@/ui-kit";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { linkClientToBlogger } from "@/api/endpoints/client.ts";
import { APIError } from "@/api/client.ts";
import { getAccessToken } from "@/utils/googleAuth.ts";
import { LogOut } from "lucide-react";
import { logger } from "@/utils/logger.ts";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user, signOut, refreshBloggerInfo } = useAuth();
  const [instagramUsername, setInstagramUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      logger.error("Ошибка при выходе", error, { component: "ProfileSetup" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instagramUsername.trim()) {
      setError("Введите ваш Instagram username");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // ============================================
      // ✅ РЕШЕНО: API для связывания блогера работает
      // ============================================
      // Endpoint: POST /client/blogger/link
      // Method: POST
      // Auth: Required (user-auth-jwt-schema)
      // Base URL: ${API_BASE_URL}
      //
      // Request Body: ClientLinkToBloggerInputDto
      //   - username: string (required) - Instagram username
      //
      // Response: void (204 No Content)
      //
      // Implementation:
      //   import { linkClientToBlogger } from '@/api/endpoints/client';
      //   await linkClientToBlogger(instagramUsername.trim());
      //
      // Notes:
      //   - Backend endpoint РЕАЛИЗОВАН
      //   - Создает запрос на модерацию (BloggerLinkRequest со статусом MODERATION)
      //   - Админ должен одобрить запрос через /admin/link/blogger-client/approve/{requestId}
      //   - После одобрения связь устанавливается и пользователь перестает перенаправляться на /profile-setup
      //   - Обрабатывает ошибки: blogger_already_linked_to_another_user, client_already_linked_to_blogger
      //
      // Backend: ClientBloggerController.linkClientToBlogger()
      // Prisma: BloggerLinkRequest model
      // ============================================

      // Отладочная информация о токенах

      // Вызываем API для связывания пользователя с блогером
      await linkClientToBlogger(instagramUsername.trim());

      // Обновляем данные блогера в контексте перед навигацией
      // Это необходимо, чтобы ProfileEditor мог загрузить профиль сразу
      await refreshBloggerInfo();

      // Перенаправляем на страницу редактирования профиля
      navigate("/profile/edit");
    } catch (err: unknown) {
      logger.error("Error linking to blogger", err, {
        component: "ProfileSetup",
      });

      if (err instanceof APIError) {
        if (err.statusCode === 403) {
          // Обрабатываем специфичные ошибки из backend
          if (err.message.includes("blogger_already_linked_to_another_user")) {
            setError(
              "Этот блогер уже привязан к другому пользователю. Вы не можете использовать этот username.",
            );
          } else if (err.message.includes("client_already_linked_to_blogger")) {
            setError(
              "Вы уже привязаны к блогеру. Обратитесь к администратору для изменения.",
            );
          } else {
            setError(err.message);
          }
        } else if (err.errorField) {
          // Validation errors
          const messages = err.errorField.map((e) => e.message).join(", ");
          setError(messages);
        } else {
          setError(err.message);
        }
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Произошла ошибка при создании профиля",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      {/* Кнопка выхода в правом верхнем углу */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="absolute top-4 right-4 flex items-center gap-2"
        aria-label="Выйти из аккаунта"
      >
        <LogOut className="w-4 h-4" />
        Выйти
      </Button>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Введите свой Instagram Username
          </h1>
          <p className="text-muted-foreground text-sm">
            Вводите без @ и ссылок
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="ваш_username"
            value={instagramUsername}
            onChange={(e) => setInstagramUsername(e.target.value)}
            disabled={isSubmitting}
            className="text-center"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !instagramUsername.trim()}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Сохранение...
              </>
            ) : (
              "Сохранить"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
