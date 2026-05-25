import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log("📤 Sending password reset request for:", email);

      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/auth/password-reset/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log("📥 Response:", data);

      if (!response.ok) {
        throw new Error(data.error || t("forgotPassword.errors.sendFailed"));
      }

      setIsSent(true);
      toast.success(data.message || t("forgotPassword.successToast"));
    } catch (err) {
      console.error("❌ Error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("forgotPassword.errors.unexpected");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="default" />

      <main className="flex-1 container mx-auto px-4 pt-24 md:pt-28 pb-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="w-full rounded-[32px] border border-border/60 bg-card px-6 py-8 md:px-8 shadow-md">
            
            {!isSent ? (
              <>
                {/* HEADER */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Mail className="h-9 w-9 text-primary" />
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight">
                    {t("forgotPassword.title")}
                  </h1>
                </div>

                {/* ERROR */}
                {error && (
                  <Alert className="bg-red-50 border-red-200 mb-5 rounded-2xl">
                    <p className="text-red-800">{error}</p>
                  </Alert>
                )}

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      {t("forgotPassword.emailLabel")}
                    </Label>

                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("forgotPassword.emailPlaceholder")}
                      className="h-14 rounded-full border-0 bg-zinc-100 px-4 shadow-none text-left focus-visible:ring-1 focus-visible:ring-gray-300"
                      dir="ltr"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 rounded-full text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2
                          className={`h-4 w-4 animate-spin ${
                            isArabic ? "ml-2" : "mr-2"
                          }`}
                        />
                        {t("forgotPassword.sending")}
                      </>
                    ) : (
                      t("forgotPassword.submit")
                    )}
                  </Button>
                </form>

                {/* BACK TO LOGIN */}
                <div className="mt-6 pt-2 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/auth")}
                    className="gap-2 rounded-full text-black text-sm font-semibold tracking-tight hover:text-primary transition-colors"
                  >
                    <ArrowLeft className={isArabic ? "h-4 w-4 ml-1" : "h-4 w-4 mr-1"} />
                    {t("forgotPassword.backToLogin")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>

                <h2 className="text-2xl font-bold mb-2">
                  {t("forgotPassword.sentTitle")}
                </h2>

                <p className="text-muted-foreground mb-6">
                  {t("forgotPassword.sentSubtitle")}
                </p>

                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full h-14 rounded-full text-base font-medium"
                >
                  {t("forgotPassword.backToLogin")}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
