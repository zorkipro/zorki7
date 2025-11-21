import {useCallback} from "react";
import {useToast} from "@/hooks/use-toast";
import {APIError} from "@/api/client";
import {logError} from "@/utils/logger";
import {useErrorHandler} from "@/utils/errorHandler";
import {adminCreateBlogger, adminToggleBloggerVisibility} from "@/api/endpoints/admin";
import {normalizeUsername} from "@/utils/username";
import {useMutation, useQueryClient} from "@tanstack/react-query";

export const useAdminBloggerActions = (onUpdate?: () => void) => {
    const {toast} = useToast();
    const {handleError} = useErrorHandler({showNotifications: true});
    const queryClient = useQueryClient();

    const validateUsername = (instagramUsername: string) => {
        if (!instagramUsername || !instagramUsername.trim()) {
            throw new Error("Username не может быть пустым");
        }

        const cleanUsername = normalizeUsername(instagramUsername);
        if (cleanUsername.length < 1 || cleanUsername.length > 30) {
            throw new Error("Username должен быть от 1 до 30 символов");
        }

        const usernameRegex = /^(?!.*\.\.)(?!\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/;
        if (!usernameRegex.test(cleanUsername)) {
            throw new Error("Username содержит недопустимые символы. Используйте только буквы, цифры, точки и подчеркивания");
        }
        return cleanUsername;
    };

    const addBloggerMutation = useMutation({
        mutationFn: async (instagramUsername: string) => {
            const clean = validateUsername(instagramUsername);
            await adminCreateBlogger(clean);
            return clean;
        },
        onSuccess: (cleanUsername) => {
            toast({
                title: "Успех",
                description: `Блогер @${cleanUsername} успешно создан`,
                variant: "default",
            });

            // Обновляем список блогеров и статистику
            queryClient.invalidateQueries({ queryKey: ["adminBloggers"] });
            // queryClient.invalidateQueries({ queryKey: ["adminBloggersStats"] });
            // Если нужно — инвалидировать и другие связанные квери:
            // queryClient.invalidateQueries({ queryKey: ["adminBloggersWithoutGender"] });
        },
        onError: (error: unknown, instagramUsername) => {
            // пользовательские сообщения как раньше
            const message = (error as any)?.message ?? "Не удалось добавить блогера";
            if (typeof message === "string" && message.includes("username not found")) {
                toast({
                    title: "Ошибка",
                    description: `Instagram аккаунт @${instagramUsername} не найден или недоступен.`,
                    variant: "destructive",
                });
            } else if (typeof message === "string" && message.includes("parsing ig error")) {
                toast({
                    title: "Ошибка парсинга",
                    description: "Не удалось загрузить данные из Instagram.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Ошибка",
                    description: message,
                    variant: "destructive",
                });
            }

            handleError(error, { showNotification: false });
            logError("addBlogger error:", error);
        },
    });

    const toggleVisibilityMutation = useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            await adminToggleBloggerVisibility(id);
            return id;
        },
        onMutate: async ({ id }) => {
            await queryClient.cancelQueries({ queryKey: ["adminBloggers"] });
            const prevBloggers = queryClient.getQueryData<AdminGetBloggerOutputDto[]>(["adminBloggers"]);
            if (prevBloggers) {
                queryClient.setQueryData<AdminGetBloggerOutputDto[]>(["adminBloggers"],
                    prevBloggers.map(b => b.id === id ? { ...b, isHidden: !b.isHidden } : b)
                );
            }
            return { prevBloggers };
        },
        onError: (err, variables, context) => {
            if (context?.prevBloggers) {
                queryClient.setQueryData(["adminBloggers"], context.prevBloggers);
            }
            toast({
                title: "Ошибка",
                description: "Не удалось изменить видимость блогера",
                variant: "destructive",
            });
        },
        onSettled: () => {
            // Перезапрашиваем данные с сервера на всякий случай
            queryClient.invalidateQueries({ queryKey: ["adminBloggers"] });
        },
        onSuccess: (id) => {
            toast({
                title: "Успех",
                description: `Видимость блогера обновлена (id=${id})`,
                variant: "default",
            });
        },
    });

    const updateBlogger = useCallback(
        async (id: string, updates: Record<string, unknown>) => {
            try {
                throw new Error(
                    "Обновление блогеров через API пока не реализовано. Обратитесь к backend разработчику для добавления PUT /admin/blogger/:id endpoint.",
                );
            } catch (error: unknown) {
                logError("Error updating blogger:", error);

                if (error instanceof APIError) {
                    toast({
                        title: "Ошибка API",
                        description: error.message,
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Ошибка",
                        description:
                            error instanceof Error
                                ? error.message
                                : "Не удалось обновить данные блогера",
                        variant: "destructive",
                    });
                }
                throw error;
            }
        },
        [onUpdate, toast],
    );

    const deleteBlogger = useCallback(
        async (id: string) => {
            try {
                throw new Error(
                    "Удаление блогеров через API пока не реализовано. Обратитесь к backend разработчику для добавления DELETE /admin/blogger/:id endpoint.",
                );
            } catch (error: unknown) {
                handleError(error, {showNotification: true});
                throw error;
            }
        },
        [onUpdate],
    );

    const toggleVisibility = useCallback(
        async (id: string, currentVisibility: boolean) => {
            try {
                throw new Error(
                    "Изменение видимости блогеров через API пока не реализовано. Обратитесь к backend разработчику для добавления PATCH /admin/blogger/:id/visibility endpoint.",
                );
            } catch (error: unknown) {
                handleError(error, {showNotification: true});
                throw error;
            }
        },
        [onUpdate],
    );

    return {
        // addBlogger,
        addBlogger: {
            mutate: addBloggerMutation.mutate,
            mutateAsync: addBloggerMutation.mutateAsync,
            isLoading: addBloggerMutation.isPending,
            isError: addBloggerMutation.isError,
            error: addBloggerMutation.error,
        },
        toggleVisibility: {
            mutate: toggleVisibilityMutation.mutate,
            mutateAsync: toggleVisibilityMutation.mutateAsync,
            isLoading: toggleVisibilityMutation.isPending,
            isError: toggleVisibilityMutation.isError,
            error: toggleVisibilityMutation.error,
        },
        updateBlogger,
        deleteBlogger,
        // toggleVisibility,
    };
};


//main
//import { useCallback } from "react";
// import { useToast } from "@/hooks/use-toast";
// import { adminCreateBlogger } from "@/api/endpoints/admin";
// import { normalizeUsername } from "@/utils/username";
//
// export const useAdminBloggerActions = (onUpdate: () => void) => {
//   const { toast } = useToast();
//
//   const addBlogger = useCallback(
//     async (instagramUsername: string) => {
//       const cleanUsername = normalizeUsername(instagramUsername.trim());
//       try {
//         await adminCreateBlogger(cleanUsername);
//         toast({
//           title: "Успех",
//           description: `Блогер @${cleanUsername} успешно создан`,
//         });
//         onUpdate();
//       } catch (error: unknown) {
//         const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка при создании блогера";
//         let description = errorMessage;
//
//         if (error instanceof Error) {
//           if (error.message.includes("username not found")) {
//             description = `Instagram аккаунт @${instagramUsername} не найден или недоступен`;
//           } else if (error.message.includes("parsing ig error")) {
//             description = "Не удалось загрузить данные из Instagram";
//           }
//         }
//
//         toast({
//           title: "Ошибка",
//           description,
//           variant: "destructive",
//         });
//         throw error;
//       }
//     },
//     [onUpdate, toast],
//   );
//
//   return { addBlogger };
// };