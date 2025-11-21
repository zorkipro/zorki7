import { lazy } from "react";

export const createPathFromFile = (filePath: string) => {
    let routePath = filePath.replace(/^\/src\/pages\//, '').replace(/\.tsx$/, '');
    const segments = routePath.split('/');

    if (segments[0] === 'home' && segments[1]?.toLowerCase() === 'index') segments.pop();

    const last = segments[segments.length - 1];
    if (last.toLowerCase() !== 'index') segments.pop();

    const pathSegments = segments.map(seg => seg.replace(/\[(.+?)\]/g, ':$1'));

    const finalPath = '/' + pathSegments.join('/');
    return finalPath === '' ? '/' : finalPath;
};

export const createDynamicRoutes = (
    pageFiles: Record<string, () => Promise<any>>,
    allowedFolders: string[] = []
) => {
    return Object.keys(pageFiles)
        .filter((filePath) => {
            const relativePath = filePath.replace(/^\/src\/pages\//, '');
            return allowedFolders.some(folder => folder === '' || relativePath.startsWith(folder));
        })
        .map((filePath) => {
            const Component = lazy(() =>
                pageFiles[filePath]().then(mod => ({ default: mod.default }))
            );
            return {
                pathName: createPathFromFile(filePath),
                Component,
            };
        });
};

const pageFiles = import.meta.glob('/src/pages/**/*.tsx');

export const publicRoutes = createDynamicRoutes(pageFiles, [
    '',
    'auth',
    'login',
    'register',
    'forgot-password',
    'email-confirmation',
    'privacy',
    'terms',
    'dev-tools',
    '[username]',
    'auth/v1/callback',
]);

export const privateRoutes = createDynamicRoutes(pageFiles, [
    'dashboard',
    'profile',
    'profile-setup'
]);

export const adminRoutes = createDynamicRoutes(pageFiles, [
    'admin',
]);
