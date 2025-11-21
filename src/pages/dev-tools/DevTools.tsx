import React from "react";

const DevTools: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Инструменты разработчика
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Информация о проекте
          </h2>
          <div className="space-y-2 text-gray-600">
            <p>
              <strong>Название:</strong> Zorki.pro - Blogger Platform
            </p>
            <p>
              <strong>Версия:</strong> 0.0.0
            </p>
            <p>
              <strong>Фреймворк:</strong> React + Vite + TypeScript
            </p>
            <p>
              <strong>UI библиотека:</strong> Radix UI + Tailwind CSS
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Доступные маршруты
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Основные</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• / - Главная страница</li>
                <li>• /login - Вход</li>
                <li>• /register - Регистрация</li>
                <li>• /:username - Профиль блогера</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Админ панель</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• /admin/login - Вход админа</li>
                <li>• /admin - Панель администратора</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Тестовые маршруты
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• /test-pricing - Тест отображения цен</p>
            <p>• /comprehensive-test - Комплексное тестирование</p>
            <p>• /admin-dashboard-test - Тест админ панели</p>
            <p>• /cache-monitor - Мониторинг кэша</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DevTools };
export default DevTools;
