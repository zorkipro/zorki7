import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client.ts";
import { Button } from "@/ui-kit";
import { Label } from "@/ui-kit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui-kit";
import { Mail, ArrowLeft } from "lucide-react";
import {
  CenteredAuthLayout,
  InputWithIcon,
  ErrorAlert,
} from "@/ui-kit/components";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Произошла ошибка при отправке письма");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <CenteredAuthLayout>
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Письмо отправлено</CardTitle>
            <CardDescription>
              Проверьте вашу почту и следуйте инструкциям для сброса пароля
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Не получили письмо? Проверьте папку "Спам" или попробуйте еще раз
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
                className="w-full"
              >
                Попробовать еще раз
              </Button>

              <Link to="/login">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Вернуться к входу
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </CenteredAuthLayout>
    );
  }

  return (
    <CenteredAuthLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Восстановление пароля</CardTitle>
          <CardDescription>
            Введите ваш email для получения инструкций по сбросу пароля
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Message */}
          <ErrorAlert error={error} />

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <InputWithIcon
                id="email"
                type="email"
                icon={Mail}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:bg-primary-hover"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Отправка...
                </>
              ) : (
                "Отправить инструкции"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Вспомнили пароль? </span>
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Войти
            </Link>
          </div>
        </CardContent>
      </Card>
    </CenteredAuthLayout>
  );
};

export default ForgotPassword;
