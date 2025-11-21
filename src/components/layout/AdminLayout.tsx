import {ProtectedRoute} from "@/components/ProtectedRoute";
import {AdminAuthProvider} from "@/contexts/AdminAuthContext";
import {Outlet} from "react-router-dom";
import {Suspense} from "react";
import {LoadingSpinner} from "@/ui-kit";

export const AdminLayout = () => (
    <AdminAuthProvider>
        <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner text="Загрузка страницы..." />}>
            <Outlet />
            </Suspense>
        </ProtectedRoute>
    </AdminAuthProvider>
);
