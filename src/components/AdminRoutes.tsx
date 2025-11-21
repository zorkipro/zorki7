// import { Suspense, lazy } from "react";
// import { Routes, Route } from "react-router-dom";
// import { LoadingSpinner } from "@/ui-kit/components";
// import { Suspense, lazy } from "react";
// import { Routes, Route } from "react-router-dom";
// import { LoadingSpinner } from "@/ui-kit/components";
//
// const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
// const AdminBloggerEditor = lazy(() => import("@/pages/AdminBloggerEditor"));
// const ParserAccountsManagement = lazy(() => import("@/pages/ParserAccountsManagement"));
// const AdminTopicsManagement = lazy(() => import("@/pages/AdminTopicsManagement"));
//
// const PageLoader = () => <LoadingSpinner fullScreen text="Загрузка..." />;
//
// export const AdminRoutes = () => (
//     <Routes>
//         <Route
//             index
//             element={
//                 <Suspense fallback={<PageLoader />}>
//                     <AdminDashboard />
//                 </Suspense>
//             }
//         />
//         <Route
//             path="blogger/:username/edit"
//             element={
//                 <Suspense fallback={<PageLoader />}>
//                     <AdminBloggerEditor />
//                 </Suspense>
//             }
//         />
//         <Route
//             path="parser-accounts"
//             element={
//                 <Suspense fallback={<PageLoader />}>
//                     <ParserAccountsManagement />
//                 </Suspense>
//             }
//         />
//         <Route
//             path="topics"
//             element={
//                 <Suspense fallback={<PageLoader />}>
//                     <AdminTopicsManagement />
//                 </Suspense>
//             }
//         />
//     </Routes>
// );
