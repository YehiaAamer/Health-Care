import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { User, Shield, Key, Smartphone, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isArabic = i18n.language === "ar";

  const inputClassName =
    "h-12 rounded-2xl border-border bg-background font-semibold text-foreground shadow-sm focus-visible:ring-4 focus-visible:ring-primary/10";

  const labelClassName = "text-xs font-bold text-muted-foreground";

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-full pb-8 pt-8 text-foreground animate-in fade-in duration-700 md:pt-0"
    >
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("doctorDashboard.sidebar.settings")}
          </h1>

          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {isArabic
              ? "إدارة حسابك المهني وإعدادات الأمان"
              : "Manage your professional account and security settings"}
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <div className="mb-6 w-full overflow-x-auto">
            <TabsList className="h-12 rounded-full border border-primary/20 bg-card p-1 shadow-sm">
              <TabsTrigger
                value="profile"
                className="rounded-full px-6 text-sm font-semibold text-primary transition-none hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <User className={cn("h-4 w-4", isArabic ? "ml-2" : "mr-2")} />
                {isArabic ? "الملف الشخصي" : "Profile"}
              </TabsTrigger>

              <TabsTrigger
                value="security"
                className="rounded-full px-6 text-sm font-semibold text-primary transition-none hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Shield className={cn("h-4 w-4", isArabic ? "ml-2" : "mr-2")} />
                {isArabic ? "الأمان" : "Security"}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="profile"
            className="mt-0 focus-visible:outline-none"
          >
            <div className="flex flex-col gap-6">
              <Card className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
                <CardHeader className="border-b border-border bg-muted/30 p-5">
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                    {t("doctorDashboard.settings.profileTitle")}
                  </CardTitle>

                  <CardDescription className="mt-1 text-xs font-semibold text-muted-foreground">
                    {t("doctorDashboard.settings.profileDesc")}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 p-5">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    <div className="relative w-fit">
                      <Avatar className="h-28 w-28 border-4 border-background shadow-sm ring-4 ring-primary/10">
                        <AvatarImage src={user?.profile?.profile_picture} />

                        <AvatarFallback className="bg-primary/10 text-2xl font-bold uppercase text-primary">
                          {user?.first_name?.charAt(0) ||
                            user?.username?.charAt(0) ||
                            "U"}
                          {user?.last_name?.charAt(0) || ""}
                        </AvatarFallback>
                      </Avatar>

                      <button
                        type="button"
                        className={cn(
                          "absolute bottom-0 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
                          isArabic ? "left-0" : "right-0"
                        )}
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className={labelClassName}>
                          {t("doctorDashboard.settings.fullName")}
                        </Label>

                        <Input
                          defaultValue={`${user?.first_name || ""} ${
                            user?.last_name || ""
                          }`}
                          className={inputClassName}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClassName}>
                          {t("doctorDashboard.settings.email")}
                        </Label>

                        <Input
                          defaultValue={user?.email}
                          disabled
                          className="h-12 rounded-2xl border-border bg-muted/40 font-semibold text-muted-foreground shadow-sm disabled:cursor-not-allowed disabled:opacity-80"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClassName}>
                          {t("doctorDashboard.settings.phone")}
                        </Label>

                        <Input
                          defaultValue={user?.profile?.phone || ""}
                          className={inputClassName}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClassName}>
                      {t("doctorDashboard.settings.bio")}
                    </Label>

                    <Textarea
                      defaultValue={user?.profile?.bio || ""}
                      placeholder={
                        isArabic
                          ? "اكتب نبذة مهنية عنك..."
                          : "Tell us about your professional background..."
                      }
                      className="min-h-[120px] rounded-3xl border-border bg-background p-4 font-semibold text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:ring-primary/10"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button className="h-11 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                      {t("doctorDashboard.settings.saveChanges")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent
            value="security"
            className="mt-0 focus-visible:outline-none"
          >
            <div className="flex flex-col gap-6">
              <Card className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
                <CardHeader className="border-b border-border bg-muted/30 p-5">
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                    {t("doctorDashboard.settings.passwordChange")}
                  </CardTitle>

                  <CardDescription className="mt-1 text-xs font-semibold text-muted-foreground">
                    {isArabic
                      ? "قم بتحديث كلمة المرور بانتظام"
                      : "Update your password regularly for better security"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 p-5">
                  <div className="space-y-2">
                    <Label className={labelClassName}>
                      {isArabic ? "كلمة المرور الحالية" : "Current Password"}
                    </Label>

                    <Input
                      type="password"
                      placeholder="••••••••"
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClassName}>
                      {isArabic ? "كلمة المرور الجديدة" : "New Password"}
                    </Label>

                    <Input
                      type="password"
                      placeholder="••••••••"
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClassName}>
                      {isArabic
                        ? "تأكيد كلمة المرور الجديدة"
                        : "Confirm New Password"}
                    </Label>

                    <Input
                      type="password"
                      placeholder="••••••••"
                      className={inputClassName}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button className="h-11 w-fit rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                      <Key
                        className={cn("h-4 w-4", isArabic ? "ml-2" : "mr-2")}
                      />
                      {t("doctorDashboard.settings.passwordChange")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
                <CardHeader className="border-b border-border bg-muted/30 p-5">
                  <CardTitle className="text-lg font-bold tracking-tight text-foreground">
                    {t("doctorDashboard.settings.twoFactor")}
                  </CardTitle>

                  <CardDescription className="mt-1 text-xs font-semibold text-muted-foreground">
                    {isArabic
                      ? "أضف طبقة أمان إضافية"
                      : "Add an extra layer of security to your account"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 p-5 text-center">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-primary/10 text-primary">
                    <Smartphone className="h-12 w-12" />
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      {isArabic
                        ? "المصادقة الثنائية غير مفعلة"
                        : "Two-factor Authentication is OFF"}
                    </h4>

                    <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-muted-foreground">
                      {isArabic
                        ? "نوصي بتفعيل المصادقة الثنائية لحماية بيانات المرضى."
                        : "We recommend enabling 2FA to protect sensitive patient clinical data."}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="h-11 rounded-full border-primary/30 bg-transparent px-6 text-sm font-bold text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    {isArabic ? "تفعيل الآن" : "Enable Now"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}