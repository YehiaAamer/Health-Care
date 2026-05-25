// src/pages/ResetPasswordConfirm.tsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Loader2, CheckCircle, Key } from "lucide-react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { toast } from "sonner";

export default function ResetPasswordConfirm() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    new_password: "",
    confirm_password: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // التحقق من تطابق كلمات المرور
    if (formData.new_password !== formData.confirm_password) {
      setError("كلمات المرور غير متطابقة");
      setIsLoading(false);
      return;
    }

    // التحقق من قوة كلمة المرور
    if (formData.new_password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      setIsLoading(false);
      return;
    }

    if (!/[A-Z]/.test(formData.new_password)) {
      setError("كلمة المرور يجب أن تحتوي على حرف كبير");
      setIsLoading(false);
      return;
    }

    if (!/[a-z]/.test(formData.new_password)) {
      setError("كلمة المرور يجب أن تحتوي على حرف صغير");
      setIsLoading(false);
      return;
    }

    if (!/[0-9]/.test(formData.new_password)) {
      setError("كلمة المرور يجب أن تحتوي على رقم");
      setIsLoading(false);
      return;
    }

    try {
      console.log("📤 Sending password reset confirm request...");

      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/auth/password-reset/confirm/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid,
          token,
          new_password: formData.new_password,
        }),
      });

      const data = await response.json();
      console.log("📥 Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "فشل تغيير كلمة المرور");
      }

      setIsSuccess(true);
      toast.success(data.message || "تم تغيير كلمة المرور بنجاح");
      
      // redirect after 2 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (err) {
      console.error("❌ Error:", err);
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header variant="dashboard" />
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md p-6">
          {!isSuccess ? (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">إعادة تعيين كلمة المرور</h1>
                <p className="text-muted-foreground">
                  أدخل كلمة المرور الجديدة لحسابك
                </p>
              </div>

              {/* Error */}
              {error && (
                <Alert className="bg-red-50 border-red-200 mb-4">
                  <p className="text-red-800">{error}</p>
                </Alert>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">كلمة المرور الجديدة</Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    value={formData.new_password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="text-left"
                    dir="ltr"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    8 أحرف على الأقل، حرف كبير، حرف صغير، ورقم
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="text-left"
                    dir="ltr"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      جاري التغيير...
                    </>
                  ) : (
                    "تغيير كلمة المرور"
                  )}
                </Button>
              </form>
            </>
          ) : (
            /* Success Message */
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">تم بنجاح!</h2>
              <p className="text-muted-foreground mb-6">
                تم تغيير كلمة المرور بنجاح. جاري تحويلك لتسجيل الدخول...
              </p>
            </div>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
}
