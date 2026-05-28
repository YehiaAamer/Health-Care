// src/pages/DiagnosisWizard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Activity,
  ArrowLeft,
  ArrowRight,
  UserRound,
  HeartPulse,
  FlaskConical,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { apiCall, API_ENDPOINTS } from "@/lib/api";
import { useTranslation } from "react-i18next";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

const formSchema = z.object({
  gender: z.enum(["male", "female"]),

  pregnancies: z.coerce
    .number()
    .min(0, "يجب أن يكون 0 أو أكثر")
    .max(20, "الحد الأقصى 20"),

  glucose: z.coerce
    .number()
    .min(0, "يجب أن يكون 0 أو أكثر")
    .max(300, "الحد الأقصى 300 mg/dL"),

  systolicBloodPressure: z.coerce
    .number()
    .min(0, "يجب أن يكون 0 أو أكثر")
    .max(260, "الحد الأقصى 260 mmHg"),

  diastolicBloodPressure: z.coerce
    .number()
    .min(0, "يجب أن يكون 0 أو أكثر")
    .max(180, "الحد الأقصى 180 mmHg"),

  skinThickness: z.coerce
    .number()
    .min(0, "يجب أن يكون 0 أو أكثر")
    .max(99, "الحد الأقصى 99 mm"),

  insulin: z.coerce
    .number()
    .min(0, "يجب أن يكون 0 أو أكثر")
    .max(846, "الحد الأقصى 846 mu U/ml"),

  weight: z.coerce
    .number()
    .min(1, "يجب إدخال الوزن")
    .max(300, "الحد الأقصى 300 kg"),

  height: z.coerce
    .number()
    .min(80, "يجب إدخال الطول بالسنتيمتر")
    .max(250, "الحد الأقصى 250 cm"),

  cholesterol: z.coerce
    .number()
    .min(0, "يجب أن يكون 0 أو أكثر")
    .max(500, "الحد الأقصى 500 mg/dL"),

  diabetesPedigreeFunction: z.coerce
    .number()
    .min(0.078, "يجب أن يكون 0.078 أو أكثر")
    .max(2.42, "الحد الأقصى 2.42"),

  age: z.coerce
    .number()
    .min(21, "يجب أن يكون 21 أو أكثر")
    .max(81, "الحد الأقصى 81 سنة"),
});

type FormValues = z.infer<typeof formSchema>;
type StepKey = "basic" | "vitals" | "risk";

type CardiovascularRiskLevel = "low" | "medium" | "high" | "very_high";

type CardiovascularPrediction = {
  probability: number;
  percentage: number;
  risk_level: CardiovascularRiskLevel;
  message: string;
  z_score: number;
};

const DESKTOP_HEADER_HEIGHT = 72;

const CARDIO_COEFFICIENTS = {
  intercept: -11.2,
  age: 0.055,
  gender: 0.42,
  height: -0.012,
  weight: 0.035,
  ap_hi: 0.052,
  ap_lo: 0.028,
  cholesterol: 0.48,
  gluc: 0.32,
};

const sigmoid = (z: number) => {
  return 1 / (1 + Math.exp(-z));
};

const getCardioRiskLevel = (percentage: number): CardiovascularRiskLevel => {
  if (percentage >= 80) return "very_high";
  if (percentage >= 60) return "high";
  if (percentage >= 30) return "medium";
  return "low";
};

const getCardioRiskMessage = (
  riskLevel: CardiovascularRiskLevel,
  isArabic: boolean
) => {
  if (isArabic) {
    switch (riskLevel) {
      case "very_high":
        return "يشير النموذج إلى وجود خطورة عالية جدًا للإصابة بأمراض القلب والأوعية الدموية بناءً على المؤشرات السريرية المدخلة.";
      case "high":
        return "يشير النموذج إلى وجود خطورة عالية للإصابة بأمراض القلب والأوعية الدموية بناءً على المؤشرات السريرية المدخلة.";
      case "medium":
        return "يشير النموذج إلى وجود خطورة متوسطة للإصابة بأمراض القلب والأوعية الدموية بناءً على المؤشرات السريرية المدخلة.";
      case "low":
        return "يشير النموذج إلى وجود خطورة منخفضة للإصابة بأمراض القلب والأوعية الدموية بناءً على المؤشرات السريرية المدخلة.";
      default:
        return "تم إنشاء توقع خطورة القلب والأوعية الدموية بناءً على المؤشرات السريرية المدخلة.";
    }
  }

  switch (riskLevel) {
    case "very_high":
      return "The model indicates a very high cardiovascular risk based on the provided clinical indicators.";
    case "high":
      return "The model indicates a high cardiovascular risk based on the provided clinical indicators.";
    case "medium":
      return "The model indicates a moderate cardiovascular risk based on the provided clinical indicators.";
    case "low":
      return "The model indicates a low cardiovascular risk based on the provided clinical indicators.";
    default:
      return "The model generated a cardiovascular risk prediction based on the provided clinical indicators.";
  }
};

const normalizeCholesterolForCardio = (cholesterol: number) => {
  if (cholesterol >= 240) return 3;
  if (cholesterol >= 200) return 2;
  return 1;
};

const normalizeGlucoseForCardio = (glucose: number) => {
  if (glucose >= 126) return 3;
  if (glucose >= 100) return 2;
  return 1;
};

const calculateCardiovascularPrediction = ({
  age,
  gender,
  height,
  weight,
  systolicBloodPressure,
  diastolicBloodPressure,
  cholesterol,
  glucose,
  isArabic,
}: {
  age: number;
  gender: "male" | "female";
  height: number;
  weight: number;
  systolicBloodPressure: number;
  diastolicBloodPressure: number;
  cholesterol: number;
  glucose: number;
  isArabic: boolean;
}): CardiovascularPrediction => {
  const genderValue = gender === "male" ? 1 : 0;
  const cholesterolValue = normalizeCholesterolForCardio(cholesterol);
  const glucoseValue = normalizeGlucoseForCardio(glucose);

  const z =
    CARDIO_COEFFICIENTS.intercept +
    CARDIO_COEFFICIENTS.age * age +
    CARDIO_COEFFICIENTS.gender * genderValue +
    CARDIO_COEFFICIENTS.height * height +
    CARDIO_COEFFICIENTS.weight * weight +
    CARDIO_COEFFICIENTS.ap_hi * systolicBloodPressure +
    CARDIO_COEFFICIENTS.ap_lo * diastolicBloodPressure +
    CARDIO_COEFFICIENTS.cholesterol * cholesterolValue +
    CARDIO_COEFFICIENTS.gluc * glucoseValue;

  const probability = sigmoid(z);
  const percentage = Number((probability * 100).toFixed(2));
  const riskLevel = getCardioRiskLevel(percentage);

  return {
    probability: Number(probability.toFixed(4)),
    percentage,
    risk_level: riskLevel,
    message: getCardioRiskMessage(riskLevel, isArabic),
    z_score: Number(z.toFixed(4)),
  };
};

export default function DiagnosisWizard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith("ar");

  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<StepKey>("basic");

  const inputClassName = `h-11 w-full rounded-full border border-primary/30 bg-background px-5 text-sm font-medium text-foreground shadow-sm transition-all placeholder:text-muted-foreground hover:bg-primary/5 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0 sm:h-10 ${
    isArabic ? "text-right" : "text-left"
  }`;

  const selectTriggerClassName = `h-11 w-full rounded-full border border-primary/30 bg-background px-5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-primary/5 focus:bg-background focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 sm:h-10 ${
    isArabic ? "text-right" : "text-left"
  }`;

  const stepCardClassName =
    "animate-in fade-in-0 slide-in-from-bottom-3 rounded-xl border border-border bg-card/70 text-card-foreground shadow-sm duration-500";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      gender: "male",
      pregnancies: 0,
      glucose: 85,
      systolicBloodPressure: 120,
      diastolicBloodPressure: 80,
      skinThickness: 20,
      insulin: 0,
      weight: 70,
      height: 170,
      cholesterol: 180,
      diabetesPedigreeFunction: 0.5,
      age: 35,
    },
  });

  const {
    trigger,
    watch,
    setValue,
    formState: { isValid },
  } = form;

  const gender = watch("gender");

  useEffect(() => {
    if (gender === "male") {
      setValue("pregnancies", 0, { shouldValidate: true });
    }
  }, [gender, setValue]);

  const validateCurrentStep = async () => {
    if (activeStep === "basic") {
      const fields: Array<keyof FormValues> = ["gender", "age"];

      if (gender === "female") {
        fields.push("pregnancies");
      }

      return await trigger(fields);
    }

    if (activeStep === "vitals") {
      return await trigger([
        "glucose",
        "systolicBloodPressure",
        "diastolicBloodPressure",
        "skinThickness",
        "insulin",
        "weight",
        "height",
      ]);
    }

    if (activeStep === "risk") {
      return await trigger(["cholesterol", "diabetesPedigreeFunction"]);
    }

    return false;
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      const heightInMeters = values.height / 100;

      const calculatedBmi = Number(
        (values.weight / (heightInMeters * heightInMeters)).toFixed(1)
      );

      const cardiovascularPrediction = calculateCardiovascularPrediction({
        age: values.age,
        gender: values.gender,
        height: values.height,
        weight: values.weight,
        systolicBloodPressure: values.systolicBloodPressure,
        diastolicBloodPressure: values.diastolicBloodPressure,
        cholesterol: values.cholesterol,
        glucose: values.glucose,
        isArabic,
      });

      const backendData = {
        gender: values.gender,
        pregnancies: values.gender === "female" ? values.pregnancies : 0,
        glucose: values.glucose,
        blood_pressure: values.diastolicBloodPressure,
        skin_thickness: values.skinThickness,
        insulin: values.insulin,
        bmi: calculatedBmi,
        diabetes_pedigree_function: values.diabetesPedigreeFunction,
        age: values.age,
      };

      const result = await apiCall<{
        probability: number;
        risk_level: string;
        message: string;
        prediction_id?: number;
      }>(API_ENDPOINTS.PREDICT, {
        method: "POST",
        body: JSON.stringify(backendData),
      });

      toast.success(t("diagnosisWizard.success"));

      navigate("/report", {
        state: {
          formData: {
            gender: values.gender,
            pregnancies: values.gender === "female" ? values.pregnancies : 0,
            glucose: values.glucose,
            bloodPressure: values.diastolicBloodPressure,
            systolicBloodPressure: values.systolicBloodPressure,
            diastolicBloodPressure: values.diastolicBloodPressure,
            skinThickness: values.skinThickness,
            insulin: values.insulin,
            weight: values.weight,
            height: values.height,
            cholesterol: values.cholesterol,
            diabetesPedigreeFunction: values.diabetesPedigreeFunction,
            age: values.age,
            bmi: calculatedBmi,
          },

          probability: result.probability,
          riskLevel: result.risk_level,
          message: result.message,
          predictionId: result.prediction_id,

          diabetesPrediction: {
            probability: result.probability,
            risk_level: result.risk_level,
            message: result.message,
            prediction_id: result.prediction_id,
          },

          cardiovascularPrediction,
        },
      });
    } catch (error) {
      toast.error(
        `${t("diagnosisWizard.error")}${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const steps: { key: StepKey; label: string }[] = [
    { key: "basic", label: t("diagnosisWizard.section1") },
    { key: "vitals", label: t("diagnosisWizard.section2") },
    { key: "risk", label: t("diagnosisWizard.section3") },
  ];

  const currentStepIndex = steps.findIndex((step) => step.key === activeStep);

  const goNext = async () => {
    const isStepValid = await validateCurrentStep();
    if (!isStepValid) return;

    if (activeStep === "basic") {
      setActiveStep("vitals");
    } else if (activeStep === "vitals") {
      setActiveStep("risk");
    }
  };

  const goPrevious = () => {
    if (activeStep === "risk") {
      setActiveStep("vitals");
    } else if (activeStep === "vitals") {
      setActiveStep("basic");
    }
  };

  const handleStepClick = async (targetStep: StepKey) => {
    const stepOrder: StepKey[] = ["basic", "vitals", "risk"];
    const targetIndex = stepOrder.indexOf(targetStep);
    const currentIndex = stepOrder.indexOf(activeStep);

    if (targetIndex <= currentIndex) {
      setActiveStep(targetStep);
      return;
    }

    const isStepValid = await validateCurrentStep();
    if (!isStepValid) return;

    if (targetIndex === currentIndex + 1) {
      setActiveStep(targetStep);
    }
  };

  const sectionTitleClass = isArabic ? "text-right" : "text-left";
  const fieldTextClass = isArabic ? "text-right" : "text-left";

  return (
    <div
      className="flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-b from-background via-background to-accent/20 text-foreground"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="dashboard" />

      <main
        className="container mx-auto w-full max-w-5xl flex-1 px-3 sm:px-4 lg:px-6"
        style={{
          paddingTop: `${DESKTOP_HEADER_HEIGHT + 12}px`,
          paddingBottom: "24px",
        }}
      >
        <Card className="overflow-hidden rounded-2xl border border-border bg-card/95 text-card-foreground shadow-xl backdrop-blur sm:rounded-3xl">
          <CardHeader className="border-b border-border bg-gradient-to-br from-card via-primary/5 to-accent/30 px-4 pb-4 pt-5 text-center sm:px-6 sm:pb-5 sm:pt-6">
            <div className="mb-3 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shadow-sm sm:h-14 sm:w-14">
                <Activity className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
              </div>
            </div>

            <CardTitle className="text-xl font-bold tracking-tight text-card-foreground sm:text-2xl md:text-3xl">
              {t("diagnosisWizard.pageTitle")}
            </CardTitle>

            <CardDescription className="mx-auto mt-2 max-w-xl text-xs leading-6 text-muted-foreground sm:text-sm md:text-base">
              {t("diagnosisWizard.pageSubtitle")}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-3 pb-5 pt-5 sm:px-5 md:px-8 md:pb-7">
            <div className="mb-5 w-full sm:mb-6">
              <div
                className={`flex w-full items-start ${
                  isArabic ? "flex-row-reverse" : ""
                }`}
              >
                {steps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const isLast = index === steps.length - 1;
                  const isClickable = index <= currentStepIndex + 1;

                  return (
                    <div
                      key={step.key}
                      className={`flex min-w-0 items-start ${
                        isLast ? "flex-none" : "flex-1"
                      } ${isArabic ? "flex-row-reverse" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleStepClick(step.key)}
                        disabled={!isClickable}
                        className={`group flex min-w-0 flex-col items-center text-center transition-all ${
                          !isClickable
                            ? "cursor-not-allowed opacity-55"
                            : "cursor-pointer"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 sm:h-9 sm:w-9 ${
                            isCompleted
                              ? "border-primary bg-primary text-primary-foreground"
                              : isCurrent
                              ? "scale-105 border-primary bg-primary/10 text-primary shadow-sm"
                              : "border-border bg-background text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-bold">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 w-[72px] sm:w-[110px]">
                          <p
                            className={`truncate text-[10px] font-medium leading-4 transition-colors sm:whitespace-normal sm:text-xs ${
                              isCurrent || isCompleted
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      </button>

                      {!isLast && (
                        <div className="min-w-0 flex-1 px-1 pt-4 sm:px-2">
                          <div className="h-[2px] w-full overflow-hidden rounded-full bg-border">
                            <div
                              className={`h-full rounded-full bg-primary transition-all duration-700 ease-in-out ${
                                index < currentStepIndex ? "w-full" : "w-0"
                              }`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="relative min-h-[250px] sm:min-h-[270px] md:min-h-[300px]">
                  {activeStep === "basic" && (
                    <Card className={stepCardClassName}>
                      <CardHeader className="px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
                        <div
                          className={`flex items-start gap-2 sm:items-center ${
                            isArabic ? "flex-row-reverse" : ""
                          }`}
                        >
                          <UserRound className="mt-1 h-4 w-4 shrink-0 text-primary sm:mt-0" />

                          <div className={sectionTitleClass}>
                            <CardTitle className="text-base text-card-foreground sm:text-lg">
                              {t("diagnosisWizard.section1")}
                            </CardTitle>

                            <CardDescription className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                              {t("diagnosisWizard.section1Desc")}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                          <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem className={fieldTextClass}>
                                <FormLabel>
                                  {isArabic ? "النوع" : "Gender"}
                                </FormLabel>

                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger
                                      dir={isArabic ? "rtl" : "ltr"}
                                      className={selectTriggerClassName}
                                    >
                                      <SelectValue
                                        placeholder={
                                          isArabic
                                            ? "اختاري النوع"
                                            : "Select gender"
                                        }
                                      />
                                    </SelectTrigger>

                                    <SelectContent
                                      dir={isArabic ? "rtl" : "ltr"}
                                      className="rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl [&_[cmdk-item-indicator]]:hidden [&_svg]:hidden"
                                    >
                                      <SelectItem
                                        value="male"
                                        className="cursor-pointer rounded-xl px-4 py-2 text-sm text-foreground focus:bg-primary/10 focus:text-primary"
                                      >
                                        {isArabic ? "ذكر" : "Male"}
                                      </SelectItem>

                                      <SelectItem
                                        value="female"
                                        className="cursor-pointer rounded-xl px-4 py-2 text-sm text-foreground focus:bg-primary/10 focus:text-primary"
                                      >
                                        {isArabic ? "أنثى" : "Female"}
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>

                                <FormDescription className="text-xs">
                                  {isArabic
                                    ? "اختيار النوع يحدد ظهور خانة الحمل"
                                    : "Pregnancy field appears for females only"}
                                </FormDescription>

                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="age"
                            render={({ field }) => (
                              <FormItem className={fieldTextClass}>
                                <FormLabel>
                                  {t("diagnosisWizard.age")}
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    type="number"
                                    min={21}
                                    max={81}
                                    {...field}
                                    className={inputClassName}
                                  />
                                </FormControl>

                                <FormDescription className="text-xs">
                                  {t("diagnosisWizard.ageDesc")}
                                </FormDescription>

                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {gender === "female" && (
                            <FormField
                              control={form.control}
                              name="pregnancies"
                              render={({ field }) => (
                                <FormItem className={fieldTextClass}>
                                  <FormLabel>
                                    {t("diagnosisWizard.pregnancies")}
                                  </FormLabel>

                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={20}
                                      {...field}
                                      className={inputClassName}
                                    />
                                  </FormControl>

                                  <FormDescription className="text-xs">
                                    {t("diagnosisWizard.pregnanciesDesc")}
                                  </FormDescription>

                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {activeStep === "vitals" && (
                    <Card className={stepCardClassName}>
                      <CardHeader className="px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
                        <div
                          className={`flex items-start gap-2 sm:items-center ${
                            isArabic ? "flex-row-reverse" : ""
                          }`}
                        >
                          <HeartPulse className="mt-1 h-4 w-4 shrink-0 text-primary sm:mt-0" />

                          <div className={sectionTitleClass}>
                            <CardTitle className="text-base text-card-foreground sm:text-lg">
                              {t("diagnosisWizard.section2")}
                            </CardTitle>

                            <CardDescription className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                              {t("diagnosisWizard.section2Desc")}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                          <FormField
                            name="glucose"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className={fieldTextClass}>
                                <FormLabel>
                                  {t("diagnosisWizard.glucose")}
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={300}
                                    {...field}
                                    className={inputClassName}
                                  />
                                </FormControl>

                                <FormDescription className="text-xs">
                                  {t("diagnosisWizard.glucoseDesc")}
                                </FormDescription>

                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            name="systolicBloodPressure"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className={fieldTextClass}>
                                <FormLabel>
                                  {isArabic
                                    ? "ضغط الدم الانقباضي"
                                    : "Systolic Blood Pressure"}
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={260}
                                    {...field}
                                    className={inputClassName}
                                  />
                                </FormControl>

                                <FormDescription className="text-xs">
                                  {isArabic
                                    ? "خاص بحساب خطر القلب والأوعية الدموية، مثال: 120"
                                    : "Used for cardiovascular risk calculation, e.g. 120"}
                                </FormDescription>

                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            name="diastolicBloodPressure"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className={fieldTextClass}>
                                <FormLabel>
                                  {isArabic
                                    ? "ضغط الدم الانبساطي"
                                    : "Diastolic Blood Pressure"}
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={180}
                                    {...field}
                                    className={inputClassName}
                                  />
                                </FormControl>

                                <FormDescription className="text-xs">
                                  {isArabic
                                    ? "يستخدم للكارديو، ويتبعت لموديل السكر كضغط الدم، مثال: 80"
                                    : "Used for cardio and sent to diabetes model as blood pressure, e.g. 80"}
                                </FormDescription>

                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            name="skinThickness"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className={fieldTextClass}>
                                <FormLabel>
                                  {t("diagnosisWizard.skinThickness")}
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={99}
                                    {...field}
                                    className={inputClassName}
                                  />
                                </FormControl>

                                <FormDescription className="text-xs">
                                  {t("diagnosisWizard.skinThicknessDesc")}
                                </FormDescription>

                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            name="insulin"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className={fieldTextClass}>
                                <FormLabel>
                                  {t("diagnosisWizard.insulin")}
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={846}
                                    {...field}
                                    className={inputClassName}
                                  />
                                </FormControl>

                                <FormDescription className="text-xs">
                                  {t("diagnosisWizard.insulinDesc")}
                                </FormDescription>

                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            name="weight"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className={fieldTextClass}>
                                <FormLabel>
                                  {isArabic ? "الوزن (كجم)" : "Weight (kg)"}
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min={1}
                                    max={300}
                                    {...field}
                                    className={inputClassName}
                                  />
                                </FormControl>

                                <FormDescription className="text-xs">
                                  {isArabic
                                    ? "أدخل الوزن بالكيلوجرام"
                                    : "Enter weight in kilograms"}
                                </FormDescription>

                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            name="height"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className={fieldTextClass}>
                                <FormLabel>
                                  {isArabic ? "الطول (سم)" : "Height (cm)"}
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    type="number"
                                    step="1"
                                    min={80}
                                    max={250}
                                    {...field}
                                    className={inputClassName}
                                  />
                                </FormControl>

                                <FormDescription className="text-xs">
                                  {isArabic
                                    ? "أدخل الطول بالسنتيمتر مثل 170"
                                    : "Enter height in centimeters, e.g. 170"}
                                </FormDescription>

                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {activeStep === "risk" && (
                    <Card className={stepCardClassName}>
                      <CardHeader className="px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
                        <div
                          className={`flex items-start gap-2 sm:items-center ${
                            isArabic ? "flex-row-reverse" : ""
                          }`}
                        >
                          <FlaskConical className="mt-1 h-4 w-4 shrink-0 text-primary sm:mt-0" />

                          <div className={sectionTitleClass}>
                            <CardTitle className="text-base text-card-foreground sm:text-lg">
                              {t("diagnosisWizard.section3")}
                            </CardTitle>

                            <CardDescription className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
                              {t("diagnosisWizard.section3Desc")}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                          <FormField
                            name="cholesterol"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className={fieldTextClass}>
                                <FormLabel>
                                  {isArabic
                                    ? "الكوليسترول (mg/dL)"
                                    : "Cholesterol (mg/dL)"}
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={500}
                                    {...field}
                                    className={inputClassName}
                                  />
                                </FormControl>

                                <FormDescription className="text-xs">
                                  {isArabic
                                    ? "أدخل نسبة الكوليسترول الكلي"
                                    : "Enter total cholesterol value"}
                                </FormDescription>

                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            name="diabetesPedigreeFunction"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className={fieldTextClass}>
                                <FormLabel>
                                  {t("diagnosisWizard.pedigree")}
                                </FormLabel>

                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.001"
                                    min={0.078}
                                    max={2.42}
                                    {...field}
                                    className={inputClassName}
                                  />
                                </FormControl>

                                <FormDescription className="text-xs">
                                  {t("diagnosisWizard.pedigreeDesc")}
                                </FormDescription>

                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-1">
                  <div
                    className={`flex w-full flex-col gap-3 sm:flex-row sm:items-center ${
                      activeStep === "basic"
                        ? "sm:justify-end"
                        : "sm:justify-between"
                    }`}
                  >
                    {activeStep !== "basic" ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goPrevious}
                        className={`h-11 w-full rounded-full border-border bg-background px-5 text-sm font-medium text-foreground shadow-sm hover:bg-primary/10 hover:text-primary sm:h-10 sm:w-auto ${
                          isArabic ? "flex-row-reverse" : ""
                        }`}
                      >
                        {isArabic ? (
                          <ArrowRight className="ml-2 h-4 w-4" />
                        ) : (
                          <ArrowLeft className="mr-2 h-4 w-4" />
                        )}

                        {t("diagnosisWizard.previous")}
                      </Button>
                    ) : (
                      <span className="hidden sm:block" />
                    )}

                    {activeStep !== "risk" && (
                      <Button
                        type="button"
                        onClick={goNext}
                        className={`h-11 w-full rounded-full px-6 text-sm font-medium shadow-sm sm:h-10 sm:w-auto ${
                          isArabic ? "flex-row-reverse" : ""
                        }`}
                      >
                        {t("diagnosisWizard.next")}

                        {isArabic ? (
                          <ArrowLeft className="mr-2 h-4 w-4" />
                        ) : (
                          <ArrowRight className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {activeStep === "risk" && (
                      <Button
                        type="submit"
                        disabled={isLoading || !isValid}
                        className="h-11 w-full rounded-full px-6 text-sm font-medium shadow-sm sm:h-10 sm:max-w-[230px]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2
                              className={`${
                                isArabic ? "ml-2" : "mr-2"
                              } h-4 w-4 animate-spin`}
                            />

                            {t("diagnosisWizard.loading")}
                          </>
                        ) : (
                          t("diagnosisWizard.submit")
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}