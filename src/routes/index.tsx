import React from "react";
import {Routes, Route} from "react-router-dom";
import {publicRoutes, privateRoutes, adminRoutes} from "./createRoutes";
import {PrivateLayout} from "@/components/layout/PrivateLayout";
import {AdminLayout} from "@/components/layout/AdminLayout";
import {LoadingSpinner} from "@/ui-kit/components";
import NotFound from "@/pages/system/not-found/NotFound.tsx";

const PageLoader = () => <LoadingSpinner fullScreen text="Загрузка..."/>;
const openAdminRoutes = adminRoutes.filter(
    (r) => r.pathName === "/admin/login" || r.pathName === "/admin/2fa"
);
const protectedAdminRoutes = adminRoutes.filter(
    (r) => r.pathName !== "/admin/login" && r.pathName !== "/admin/2fa"
);

export const AppRoutes = () => (
    <Routes>
        {/* Защищённые админские страницы */}
        <Route element={<AdminLayout/>}>
            {protectedAdminRoutes.map(({pathName, Component}) => {
                const isIndex = pathName === "/admin";

                return (
                    <Route
                        key={pathName}
                        index={isIndex}
                        path={pathName}
                        element={
                            <React.Suspense fallback={<PageLoader/>}>
                                <Component/>
                            </React.Suspense>
                        }
                    />
                );
            })}
        </Route>
        {/* Приватные страницы */}
        <Route element={<PrivateLayout/>}>
            {privateRoutes.map(({pathName, Component}) => (
                <Route key={pathName} path={pathName} element={<Component/>}/>
            ))}
        </Route>
        {/* Открытые админские страницы (login, 2fa) */}
        {openAdminRoutes.map(({pathName, Component}) => (
            <Route key={pathName} path={pathName} element={<Component/>}/>
        ))}
        {/* Публичные страницы */}
        {publicRoutes.map(({pathName, Component}) => (
            <Route key={pathName} path={pathName} element={<Component/>}/>
        ))}
        <Route path="*" element={<NotFound/>}/>
    </Routes>
);
