import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui-kit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui-kit";
import { Button } from "@/ui-kit";
import { Label } from "@/ui-kit";
import { Mail } from "lucide-react";
import {
  GoogleAuthButton,
  InputWithIcon,
  PasswordInput,
  DividerWithText,
  ErrorAlert,
  CenteredAuthLayout,
} from "@/ui-kit/components";
import { useAuthForm } from "@/hooks/useAuthForm.ts";
import { Link } from "react-router-dom";

export const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Определяем начальный таб на основе URL
  const initialTab = location.pathname === "/register" ? "register" : "login";
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);

  // Синхронизируем таб с URL
  useEffect(() => {
    if (location.pathname === "/register") {
      setActiveTab("register");
    } else if (location.pathname === "/login") {
      setActiveTab("login");
    }
  }, [location.pathname]);

  // Обработчики для входа
  const {
    loading: loginLoading,
    error: loginError,
    handleSubmit: handleLoginSubmit,
    handleGoogleAuth: handleLoginGoogleAuth,
  } = useAuthForm({
    mode: "login",
    onSuccess: () => {
      navigate("/dashboard");
    },
  });

  // Обработчики для регистрации
  const {
    loading: registerLoading,
    error: registerError,
    handleSubmit: handleRegisterSubmit,
    handleGoogleAuth: handleRegisterGoogleAuth,
  } = useAuthForm({
    mode: "register",
  });

  // Состояния для формы входа
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Состояния для формы регистрации
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const handleLoginFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLoginSubmit(loginEmail, loginPassword);
  };

  const handleRegisterFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleRegisterSubmit(registerEmail, registerPassword);
  };

  const handleTabChange = (value: string) => {
    const newTab = value as "login" | "register";
    setActiveTab(newTab);
    // Обновляем URL при смене таба
    navigate(newTab === "login" ? "/login" : "/register", { replace: true });
  };

  return (
    <CenteredAuthLayout>
      <Card className="w-full">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <CardHeader className="text-center pb-4">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="text-base">
                Вход
              </TabsTrigger>
              <TabsTrigger value="register" className="text-base">
                Регистрация
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Таб входа */}
            <TabsContent value="login" className="mt-0 space-y-6">
              <div className="text-center mb-4">
                <CardTitle className="text-2xl mb-2">Добро пожаловать</CardTitle>
                <CardDescription>
                  Войдите в свой аккаунт для продолжения
                </CardDescription>
              </div>
              <GoogleAuthButton
                text="Войти через Google"
                onClick={handleLoginGoogleAuth}
                loading={loginLoading}
              />

              <DividerWithText text="или" />
              <ErrorAlert error={loginError} />

              <form onSubmit={handleLoginFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <InputWithIcon
                    id="login-email"
                    type="email"
                    icon={Mail}
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <PasswordInput
                    id="login-password"
                    value={loginPassword}
                    onChange={setLoginPassword}
                    placeholder="Введите пароль"
                    required
                  />
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="text-primary hover:text-primary/80"
                  >
                    Забыли пароль?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:bg-primary-hover"
                  disabled={loginLoading}
                >
                  {loginLoading ? "Вход..." : "Войти"}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                <p className="mb-2">
                  Рады видеть вас снова! Входя в систему, вы подтверждаете
                  согласие с{" "}
                  <Link
                    to="/terms"
                    className="text-primary hover:text-primary/80 underline font-medium"
                  >
                    условиями использования
                  </Link>{" "}
                  и{" "}
                  <Link
                    to="/privacy"
                    className="text-primary hover:text-primary/80 underline font-medium"
                  >
                    политикой конфиденциальности
                  </Link>
                </p>
              </div>
            </TabsContent>

            {/* Таб регистрации */}
            <TabsContent value="register" className="mt-0 space-y-6">
              <div className="text-center mb-4">
                <CardTitle className="text-2xl mb-2">Создать аккаунт</CardTitle>
                <CardDescription>
                  Зарегистрируйтесь для доступа к платформе
                </CardDescription>
              </div>

              <GoogleAuthButton
                text="Зарегистрироваться через Google"
                onClick={handleRegisterGoogleAuth}
                loading={registerLoading}
              />

              <DividerWithText text="или" />
              <ErrorAlert error={registerError} />

              <form onSubmit={handleRegisterFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <InputWithIcon
                    id="register-email"
                    type="email"
                    icon={Mail}
                    placeholder="your@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Мы отправим письмо для подтверждения на этот адрес
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Пароль</Label>
                  <PasswordInput
                    id="register-password"
                    value={registerPassword}
                    onChange={setRegisterPassword}
                    placeholder="Создайте надежный пароль"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Минимум 6 символов. Используйте буквы, цифры и символы
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:bg-primary-hover"
                  disabled={registerLoading}
                >
                  {registerLoading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                <p className="mb-2">
                  Добро пожаловать! Регистрируясь на нашей платформе, вы
                  принимаете{" "}
                  <Link
                    to="/terms"
                    className="text-primary hover:text-primary/80 underline font-medium"
                  >
                    условия использования
                  </Link>{" "}
                  и{" "}
                  <Link
                    to="/privacy"
                    className="text-primary hover:text-primary/80 underline font-medium"
                  >
                    политику конфиденциальности
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Мы заботимся о вашей безопасности и прозрачности наших
                  отношений
                </p>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </CenteredAuthLayout>
  );
};

