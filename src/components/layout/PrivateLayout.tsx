import {Suspense} from "react";
import {ProtectedRoute} from "@/components/ProtectedRoute";
import {LoadingSpinner} from "@/ui-kit/components";
import {Outlet} from "react-router-dom";

export const PrivateLayout = () => (
    <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner text="Загрузка страницы..." />}>
            <Outlet />
        </Suspense>
    </ProtectedRoute>
);

