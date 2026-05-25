import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Loader2, Camera, User, X } from "lucide-react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useIsVisible } from "@/hooks/useIsVisible";

const DESKTOP_HEADER_HEIGHT = 72;

export default function EditProfile() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith("ar");

  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileRef = useRef(null);
  const formRef = useRef(null);
  const actionsRef = useRef(null);

  const profileVisible = useIsVisible(profileRef);
  const formVisible = useIsVisible(formRef);
  const actionsVisible = useIsVisible(actionsRef);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(
    user?.profile_picture || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: "",
      });

      if (user.profile_picture) {
        setProfilePicturePreview(user.profile_picture);
      }
    }
  }, [user]);

  if (!isAuthenticated) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error(t("editProfile.toasts.invalidImage"));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("editProfile.toasts.imageTooLarge"));
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = async () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (user?.profile_picture) {
      try {
        const storedTokens = localStorage.getItem("auth_tokens");
        const accessToken = storedTokens ? JSON.parse(storedTokens).access : "";

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/profile/picture/`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (response.ok) {
          updateUser({ ...user, profile_picture: null });
          toast.success(t("editProfile.toasts.pictureDeleted"));
        }
      } catch {
        toast.error(t("editProfile.toasts.deleteFailed"));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const storedTokens = localStorage.getItem("auth_tokens");
      let accessToken = "";

      if (storedTokens) {
        const tokens = JSON.parse(storedTokens);
        accessToken = tokens.access;
      }

      let response: Response;

      if (profilePicture) {
        const formDataPayload = new FormData();
        formDataPayload.append("first_name", formData.first_name);
        formDataPayload.append("last_name", formData.last_name);
        formDataPayload.append("email", formData.email);
        if (formData.phone) formDataPayload.append("phone", formData.phone);
        formDataPayload.append("profile_picture", profilePicture);

        response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formDataPayload,
        });
      } else {
        response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone || "",
          }),
        });
      }

      const responseText = await response.text();

      if (!response.ok) {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.error || t("editProfile.toasts.updateFailed"));
      }

      const result = JSON.parse(responseText);

      if (result.user) {
        updateUser(result.user);
      }

      toast.success(result.message || t("editProfile.toasts.updateSuccess"));
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Error:", err);
      const errorMessage =
        err instanceof Error ? err.message : t("editProfile.toasts.unexpectedError");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fullName =
    `${formData.first_name || ""} ${formData.last_name || ""}`.trim() ||
    t("editProfile.defaultName");

  return (
    <div
      className="min-h-screen flex flex-col bg-background overflow-x-hidden"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="dashboard" />

      <main
        className="flex-1 w-full"
        style={{
          paddingTop: `${DESKTOP_HEADER_HEIGHT + 24}px`,
        }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="mx-auto w-full max-w-4xl">
            <div
              ref={profileRef}
              className={`mb-10 flex flex-col items-center text-center transition-all duration-700 ease-out ${
                profileVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <div className="relative mb-5">
                <div className="h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center">
                  {profilePicturePreview ? (
                    <img
                      src={profilePicturePreview}
                      alt={t("editProfile.profileImageAlt")}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-white" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:opacity-90"
                  aria-label={t("editProfile.changePhoto")}
                >
                  <Camera className="h-4 w-4" />
                </button>

                {profilePicturePreview && (
                  <button
                    type="button"
                    onClick={handleRemovePicture}
                    className="absolute top-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                    aria-label={t("editProfile.removePhoto")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <h1 className="text-3xl font-semibold tracking-tight">
                {fullName}
              </h1>

              <p className="mt-2 break-all text-sm text-muted-foreground">
                {formData.email || user?.email}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="md:px-8">
              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
                  <p>{error}</p>
                </Alert>
              )}

              <div className="space-y-10">
                <div
                  ref={formRef}
                  className={`transition-all duration-700 ease-out delay-100 ${
                    formVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {t("editProfile.title")}
                    </h2>
                  </div>

                  <div className="divide-y rounded-2xl border bg-card shadow-sm">
                    <div className="grid gap-3 px-4 py-5 md:grid-cols-[220px_minmax(0,1fr)] md:px-6">
                      <div>
                        <Label
                          htmlFor="first_name"
                          className="text-sm font-medium text-foreground"
                        >
                          {t("editProfile.firstName")}
                        </Label>
                      </div>
                      <div>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          placeholder={t("editProfile.placeholders.firstName")}
                          className={`h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 ${
                            isArabic ? "text-right" : "text-left"
                          }`}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 px-4 py-5 md:grid-cols-[220px_minmax(0,1fr)] md:px-6">
                      <div>
                        <Label
                          htmlFor="last_name"
                          className="text-sm font-medium text-foreground"
                        >
                          {t("editProfile.lastName")}
                        </Label>
                      </div>
                      <div>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          placeholder={t("editProfile.placeholders.lastName")}
                          className={`h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 ${
                            isArabic ? "text-right" : "text-left"
                          }`}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 px-4 py-5 md:grid-cols-[220px_minmax(0,1fr)] md:px-6">
                      <div>
                        <Label
                          htmlFor="email"
                          className="text-sm font-medium text-foreground"
                        >
                          {t("editProfile.email")}
                        </Label>
                      </div>
                      <div>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder={t("editProfile.placeholders.email")}
                          className="h-11 border-0 bg-transparent px-0 text-left shadow-none focus-visible:ring-0"
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 px-4 py-5 md:grid-cols-[220px_minmax(0,1fr)] md:px-6">
                      <div>
                        <Label
                          htmlFor="phone"
                          className="text-sm font-medium text-foreground"
                        >
                          {t("editProfile.phone")}
                        </Label>
                      </div>
                      <div>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder={t("editProfile.placeholders.phone")}
                          className="h-11 border-0 bg-transparent px-0 text-left shadow-none focus-visible:ring-0"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  ref={actionsRef}
                  className={`flex flex-col items-center justify-center space-y-3 transition-all duration-700 ease-out delay-200 ${
                    actionsVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                >
                  <Button
                    type="submit"
                    className="h-11 min-w-[180px] rounded-full px-6"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        {t("editProfile.saving")}
                      </>
                    ) : (
                      t("editProfile.saveChanges")
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-center text-muted-foreground"
                    onClick={() => navigate("/change-password")}
                  >
                    {t("editProfile.editPassword")}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
