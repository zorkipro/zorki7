import { Link } from "react-router-dom";
import { Button } from "@/ui-kit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui-kit";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";

const EmailConfirmation = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-center">
          <Link to="/" className="inline-flex items-center space-x-2">
            <img 
              src="/logo.svg" 
              alt="Zorki" 
              className="w-8 h-8"
            />
            <span className="text-xl font-bold text-foreground">Zorki</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl">Проверьте почту</CardTitle>
              <CardDescription className="text-base">
                На ваш email отправлено сообщение для подтверждения регистрации
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Сообщение отправлено</span>
                </div>

                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Мы отправили ссылку для подтверждения на указанный email
                    адрес.
                  </p>
                  <p>
                    Пожалуйста, проверьте свою почту и перейдите по ссылке для
                    завершения регистрации.
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="font-medium text-foreground mb-2">
                    Не получили письмо?
                  </p>
                  <div className="text-muted-foreground space-y-1">
                    <p>• Проверьте папку "Спам" или "Нежелательная почта"</p>
                    <p>• Убедитесь, что email адрес указан правильно</p>
                    <p>• Письмо может прийти в течение нескольких минут</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Здесь будет логика повторной отправки письма
                  }}
                >
                  Отправить письмо повторно
                </Button>

                <Link to="/login" className="block">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Вернуться к входу
                  </Button>
                </Link>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                После подтверждения email вы сможете войти в свой аккаунт
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;
