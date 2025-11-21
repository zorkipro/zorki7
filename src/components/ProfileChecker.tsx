import {ReactNode, useEffect, useRef} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import {useAuth} from "@/contexts/AuthContext";
import {checkProfileRedirect} from "@/utils/profile-navigation";
import {AUTH_PAGES} from "@/config/routes";

// Страницы, которые требуют наличия блогера с username
const BLOGGER_REQUIRED_PAGES = ['/profile', '/profile/edit'];

interface ProfileCheckerProps {
    children: ReactNode;
}

export const ProfileChecker = ({children}: ProfileCheckerProps) => {
    const {user, loading, bloggerInfo, bloggerInfoLoading} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const hasCheckedRef = useRef(false);

    // Сбрасываем состояние при смене пользователя
    useEffect(() => {
        hasCheckedRef.current = false;
    }, [user?.id]);

    useEffect(() => {
        const performProfileCheck = async () => {
            // Пропускаем проверку на auth страницах
            if (
                location.pathname === '/' ||
                AUTH_PAGES.some(page => location.pathname === page)
            ) {
                return;
            }

            // Если нет пользователя - ничего не делаем
            if (!user) {
                return;
            }

            // ВАЖНО: Ждем пока загрузятся данные
            if (loading || bloggerInfoLoading) {
                return; // НЕ запускаем проверку
            }

            // НОВАЯ ЛОГИКА: Проверяем bloggerInfo только для страниц, которые требуют наличия блогера
            const isBloggerPage = BLOGGER_REQUIRED_PAGES.some(page => location.pathname.startsWith(page));

            if (isBloggerPage) {
                // Для страниц блогера проверяем наличие данных блогера
                // НЕ загружаем данные здесь - это делает SessionContext

                // Если данные все еще не загружены - ждем
                if (!bloggerInfo) {
                    return;
                }

                // Проверяем наличие username у блогера
                if (!bloggerInfo.username) {
                    navigate('/profile-setup');
                    hasCheckedRef.current = true;
                    return;
                }

                // Если есть username - все в порядке
            } else {
                // Для остальных страниц (главная, публичные страницы) bloggerInfo не обязателен
            }

            // Если уже проверяли - не проверяем повторно
            if (hasCheckedRef.current) {
                return;
            }


            // Данные загружены, выполняем проверку
            try {
                // Проверяем, требуется ли редирект
                const redirectPath = checkProfileRedirect(
                    location.pathname,
                    user,
                    loading,
                    bloggerInfo,
                    bloggerInfoLoading,
                );

                if (redirectPath) {
                    navigate(redirectPath);
                    hasCheckedRef.current = true;
                    return;
                }

                // Данные проверены успешно
                hasCheckedRef.current = true;
            } catch (error) {
                // В случае ошибки тоже помечаем что проверку сделали
                hasCheckedRef.current = true;
            }
        };

        performProfileCheck();
    }, [
        user,
        loading,
        bloggerInfoLoading,
        bloggerInfo,
        navigate,
        location.pathname,
    ]);

    return <>{children}</>;
};
