// src/pages/Auth.tsx
import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { useTranslation } from "react-i18next";

export default function Auth() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginSchema = z.object({
    email: z
      .string()
      .min(1, t("authPage.validation.emailRequired"))
      .email(t("authPage.validation.invalidEmail")),
    password: z.string().min(1, t("authPage.validation.passwordRequired")),
  });

  const signupSchema = z
    .object({
      firstName: z.string().min(2, t("authPage.validation.firstNameMin")),
      lastName: z.string().min(2, t("authPage.validation.lastNameMin")),
      email: z
        .string()
        .min(1, t("authPage.validation.emailRequired"))
        .email(t("authPage.validation.invalidEmail")),
      password: z
        .string()
        .min(8, t("authPage.validation.passwordMin"))
        .regex(/[A-Z]/, t("authPage.validation.passwordUpper"))
        .regex(/[a-z]/, t("authPage.validation.passwordLower"))
        .regex(/[0-9]/, t("authPage.validation.passwordNumber")),
      confirmPassword: z
        .string()
        .min(1, t("authPage.validation.confirmPasswordRequired")),
      role: z.enum(["patient", "doctor"]).default("patient"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("authPage.validation.passwordsMismatch"),
      path: ["confirmPassword"],
    });

  type LoginFormValues = z.infer<typeof loginSchema>;
  type SignupFormValues = z.infer<typeof signupSchema>;

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get("tab") || "login";

  const { login, register, isLoading, error, clearError } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "patient",
    },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    setLocalError(null);
    clearError();

    try {
      const user = await login(values.email, values.password);

      toast.success(t("authPage.loginSuccess"));

      if (user?.role === "doctor") {
        navigate("/");
        return;
      }

      if (user?.role === "patient") {
        navigate("/dashboard");
        return;
      }

      navigate("/");
    } catch (error: any) {
      const message = error.message || t("authPage.loginFailed");
      setLocalError(message);
      toast.error(message);
    }
  };

  const onSignupSubmit = async (values: SignupFormValues) => {
    setLocalError(null);
    clearError();

    try {
      const user = await register(
        values.email,
        values.password,
        values.firstName,
        values.lastName,
        values.role
      );

      toast.success(t("authPage.signupSuccess"));

      if (user?.role === "doctor") {
        navigate("/");
        return;
      }

      if (user?.role === "patient") {
        navigate("/dashboard");
        return;
      }

      navigate("/");
    } catch (error: any) {
      const message = error.message || t("authPage.signupFailed");
      setLocalError(message);
      toast.error(message);
    }
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
    setLocalError(null);
    clearError();
    loginForm.clearErrors();
    signupForm.clearErrors();
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="default" />

      <main className="flex-1 container mx-auto px-4 pt-24 md:pt-28 pb-12">
        <div className="max-w-md mx-auto">
          <Card className="overflow-hidden rounded-[32px] border border-border/60 bg-card shadow-md">
            <CardHeader className="text-center pb-3 pt-8">
              <div className="flex justify-center mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-9 w-9 text-primary" />
                </div>
              </div>

              <CardTitle className="text-3xl font-bold">
                {t("authPage.secureAccess")}
              </CardTitle>

              <CardDescription className="text-base mt-1">
                {activeTab === "login"
                  ? t("authPage.loginSubtitle")
                  : t("authPage.signupSubtitle")}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 px-6 md:px-8 pb-8">
              {(localError || error) && (
                <div className="mb-6">
                  <ErrorDisplay
                    error={localError || error}
                    onDismiss={() => {
                      setLocalError(null);
                      clearError();
                    }}
                  />
                </div>
              )}

              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted p-1 h-12 mb-6">
                  <TabsTrigger
                    value="login"
                    className="rounded-full data-[state=active]:shadow-sm"
                  >
                    {t("authPage.loginTab")}
                  </TabsTrigger>

                  <TabsTrigger
                    value="signup"
                    className="rounded-full data-[state=active]:shadow-sm"
                  >
                    {t("authPage.signupTab")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 mt-0">
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("authPage.email")}</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="your@email.com"
                                className="h-14 rounded-full border-0 bg-muted/60 px-4 shadow-none text-left focus-visible:ring-1 focus-visible:ring-primary"
                                dir="ltr"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("authPage.password")}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showLoginPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className="h-14 rounded-full border-0 bg-muted/60 pl-4 pr-14 shadow-none text-left focus-visible:ring-1 focus-visible:ring-primary"
                                  dir="ltr"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowLoginPassword((prev) => !prev)
                                  }
                                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >
                                  {showLoginPassword ? (
                                    <FiEyeOff size={20} />
                                  ) : (
                                    <FiEye size={20} />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className={isArabic ? "text-left" : "text-right"}>
                        <Link
                          to="/forgot-password"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {t("authPage.forgotPassword")}
                        </Link>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-14 rounded-full text-base font-medium"
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader2
                              className={`h-4 w-4 animate-spin ${
                                isArabic ? "ml-2" : "mr-2"
                              }`}
                            />
                            {t("authPage.processing")}
                          </>
                        ) : (
                          t("authPage.loginButton")
                        )}
                      </Button>
                    </form>
                  </Form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-3 text-muted-foreground">
                        {t("authPage.orContinueWith")}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    type="button"
                    className="w-full h-14 rounded-full"
                  >
                    <FaGoogle
                      className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                    />
                    Gmail
                  </Button>

                  <div className="text-center text-sm text-muted-foreground pt-1">
                    <p>
                      {t("authPage.noAccount")}{" "}
                      <button
                        type="button"
                        onClick={() => handleTabChange("signup")}
                        className="text-primary hover:underline font-semibold"
                      >
                        {t("authPage.createNow")}
                      </button>
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-0">
                  <Form {...signupForm}>
                    <form
                      onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={signupForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem className="space-y-3 mb-4">
                            <FormLabel>
                              {isArabic ? "نوع الحساب" : "Account Type"}
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
                                dir={isArabic ? "rtl" : "ltr"}
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="patient" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer text-sm">
                                    {isArabic ? "مريض" : "Patient"}
                                  </FormLabel>
                                </FormItem>

                                <FormItem
                                  className={`flex items-center space-y-0 ${
                                    isArabic
                                      ? "space-x-3 space-x-reverse"
                                      : "space-x-3"
                                  }`}
                                >
                                  <FormControl>
                                    <RadioGroupItem value="doctor" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer text-sm">
                                    {isArabic ? "طبيب" : "Doctor"}
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("authPage.firstName")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("authPage.firstNamePlaceholder")}
                                className={`h-14 rounded-full border-0 bg-muted/60 px-4 shadow-none focus-visible:ring-1 focus-visible:ring-primary ${
                                  isArabic ? "text-right" : "text-left"
                                }`}
                                dir={isArabic ? "rtl" : "ltr"}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("authPage.lastName")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("authPage.lastNamePlaceholder")}
                                className={`h-14 rounded-full border-0 bg-muted/60 px-4 shadow-none focus-visible:ring-1 focus-visible:ring-primary ${
                                  isArabic ? "text-right" : "text-left"
                                }`}
                                dir={isArabic ? "rtl" : "ltr"}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("authPage.email")}</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="your@email.com"
                                className="h-14 rounded-full border-0 bg-muted/60 px-4 shadow-none text-left focus-visible:ring-1 focus-visible:ring-primary"
                                dir="ltr"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("authPage.password")}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={
                                    showSignupPassword ? "text" : "password"
                                  }
                                  placeholder="••••••••"
                                  className="h-14 rounded-full border-0 bg-muted/60 pl-4 pr-14 shadow-none text-left focus-visible:ring-1 focus-visible:ring-primary"
                                  dir="ltr"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowSignupPassword((prev) => !prev)
                                  }
                                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >
                                  {showSignupPassword ? (
                                    <FiEyeOff size={20} />
                                  ) : (
                                    <FiEye size={20} />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs">
                              {t("authPage.passwordHint")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("authPage.confirmPassword")}
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={
                                    showConfirmPassword ? "text" : "password"
                                  }
                                  placeholder="••••••••"
                                  className="h-14 rounded-full border-0 bg-muted/60 pl-4 pr-14 shadow-none text-left focus-visible:ring-1 focus-visible:ring-primary"
                                  dir="ltr"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowConfirmPassword((prev) => !prev)
                                  }
                                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground"
                                >
                                  {showConfirmPassword ? (
                                    <FiEyeOff size={20} />
                                  ) : (
                                    <FiEye size={20} />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full h-14 rounded-full text-base font-medium"
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader2
                              className={`h-4 w-4 animate-spin ${
                                isArabic ? "ml-2" : "mr-2"
                              }`}
                            />
                            {t("authPage.processing")}
                          </>
                        ) : (
                          t("authPage.signupButton")
                        )}
                      </Button>
                    </form>
                  </Form>

                  <div className="text-center text-sm text-muted-foreground pt-1">
                    <p>
                      {t("authPage.haveAccount")}{" "}
                      <button
                        type="button"
                        onClick={() => handleTabChange("login")}
                        className="text-primary hover:underline font-semibold"
                      >
                        {t("authPage.loginNow")}
                      </button>
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}