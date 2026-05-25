import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  Activity,
  HeartPulse,
  FileText,
  Stethoscope,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useTranslation } from "react-i18next";

interface ExtendedjsPDF extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

type RiskTone = {
  level: string;
  message: string;
  color: string;
  textClass: string;
  badgeClass: string;
  softBg: string;
};

type ToneVisuals = {
  ringClass: string;
  borderClass: string;
  gradientClass: string;
};

type PredictionCardProps = {
  title: string;
  subtitle: string;
  probability: number;
  tone: RiskTone;
  visuals: ToneVisuals;
  pieData: { name: string; value: number }[];
  icon: ReactNode;
  metricLabel: string;
};

const DESKTOP_HEADER_HEIGHT = 72;

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const result = location.state || {};

  const diabetesPrediction = result.diabetesPrediction || {
    probability: result.probability,
    risk_level: result.riskLevel,
    message: result.message,
    prediction_id: result.predictionId,
  };

  const cardiovascularPrediction = result.cardiovascularPrediction || null;

  const probability = Number(
    diabetesPrediction?.probability ?? result.probability ?? 0
  );

  const cardiovascularProbability = Number(
    cardiovascularPrediction?.percentage ??
      (cardiovascularPrediction?.probability
        ? cardiovascularPrediction.probability * 100
        : 0)
  );

  const formData = result.formData || {};

  useEffect(() => {
    if (
      diabetesPrediction?.probability === undefined ||
      diabetesPrediction?.probability === null
    ) {
      const timer = setTimeout(() => {
        navigate("/diagnosis", { replace: true });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [diabetesPrediction?.probability, navigate]);

  const riskTone = useMemo((): RiskTone => {
    if (probability > 50) {
      return {
        level: isArabic ? "عالي" : "High",
        message:
          probability > 70
            ? t("report.resultMessages.high", {
                probability: probability.toFixed(1),
              })
            : t("report.resultMessages.mediumHigh", {
                probability: probability.toFixed(1),
              }),
        color: "#ef4444",
        textClass: "text-red-600",
        badgeClass:
          "border-red-200 bg-red-100 text-red-700 hover:border-red-200 hover:bg-red-100 hover:text-red-700",
        softBg: "bg-red-500/10",
      };
    }

    if (probability > 20) {
      return {
        level: isArabic ? "متوسط" : "Medium",
        message: t("report.resultMessages.moderate", {
          probability: probability.toFixed(1),
        }),
        color: "#eab308",
        textClass: "text-yellow-600",
        badgeClass:
          "border-yellow-200 bg-yellow-100 text-yellow-700 hover:border-yellow-200 hover:bg-yellow-100 hover:text-yellow-700",
        softBg: "bg-yellow-500/10",
      };
    }

    return {
      level: isArabic ? "منخفض" : "Low",
      message: t("report.resultMessages.low", {
        probability: probability.toFixed(1),
      }),
      color: "#22c55e",
      textClass: "text-green-600",
      badgeClass:
        "border-green-200 bg-green-100 text-green-700 hover:border-green-200 hover:bg-green-100 hover:text-green-700",
      softBg: "bg-green-500/10",
    };
  }, [probability, t, isArabic]);

  const getCardioResultMessage = (cardioProbability: number) => {
    if (cardioProbability >= 80) {
      return isArabic
        ? `تشير النتيجة إلى احتمالية عالية جدًا لخطر القلب والأوعية الدموية بنسبة ${cardioProbability.toFixed(
            1
          )}%. ينصح بالمتابعة الطبية في أقرب وقت لتقييم عوامل الخطورة ووضع خطة متابعة مناسبة.`
        : `The cardiovascular risk probability is ${cardioProbability.toFixed(
            1
          )}%, which indicates a very high risk level. Medical follow-up is recommended as soon as possible to assess risk factors and define an appropriate care plan.`;
    }

    if (cardioProbability >= 60) {
      return isArabic
        ? `تشير النتيجة إلى احتمالية عالية لخطر القلب والأوعية الدموية بنسبة ${cardioProbability.toFixed(
            1
          )}%. يفضل مراجعة الطبيب لمتابعة ضغط الدم والكوليسترول وباقي عوامل الخطورة.`
        : `The cardiovascular risk probability is ${cardioProbability.toFixed(
            1
          )}%, which indicates a high risk level. Medical review is recommended to monitor blood pressure, cholesterol, and other risk factors.`;
    }

    if (cardioProbability >= 30) {
      return isArabic
        ? `تشير النتيجة إلى احتمالية متوسطة لخطر القلب والأوعية الدموية بنسبة ${cardioProbability.toFixed(
            1
          )}%. ينصح بتحسين نمط الحياة ومتابعة المؤشرات الصحية بشكل دوري.`
        : `The cardiovascular risk probability is ${cardioProbability.toFixed(
            1
          )}%, which indicates a medium risk level. Lifestyle improvement and periodic health monitoring are recommended.`;
    }

    return isArabic
      ? `تشير النتيجة إلى احتمالية منخفضة لخطر القلب والأوعية الدموية بنسبة ${cardioProbability.toFixed(
          1
        )}%. ينصح بالحفاظ على العادات الصحية والمتابعة الدورية.`
      : `The cardiovascular risk probability is ${cardioProbability.toFixed(
          1
        )}%, which indicates a low risk level. Maintaining healthy habits and routine monitoring is recommended.`;
  };

  const cardioTone = useMemo((): RiskTone => {
    const normalizedRisk = String(cardiovascularPrediction?.risk_level || "")
      .toLowerCase()
      .replace(/\s|-/g, "_");

    const isVeryHigh =
      normalizedRisk === "very_high" ||
      normalizedRisk === "veryhigh" ||
      cardiovascularProbability >= 80;

    const isHigh =
      normalizedRisk === "high" || cardiovascularProbability >= 60;

    const isMedium =
      normalizedRisk === "medium" ||
      normalizedRisk === "moderate" ||
      cardiovascularProbability >= 30;

    if (isVeryHigh) {
      return {
        level: isArabic ? "عالي جدًا" : "Very High",
        message: getCardioResultMessage(cardiovascularProbability),
        color: "#dc2626",
        textClass: "text-red-700",
        badgeClass:
          "border-red-200 bg-red-100 text-red-700 hover:border-red-200 hover:bg-red-100 hover:text-red-700",
        softBg: "bg-red-500/10",
      };
    }

    if (isHigh) {
      return {
        level: isArabic ? "عالي" : "High",
        message: getCardioResultMessage(cardiovascularProbability),
        color: "#ef4444",
        textClass: "text-red-600",
        badgeClass:
          "border-red-200 bg-red-100 text-red-700 hover:border-red-200 hover:bg-red-100 hover:text-red-700",
        softBg: "bg-red-500/10",
      };
    }

    if (isMedium) {
      return {
        level: isArabic ? "متوسط" : "Medium",
        message: getCardioResultMessage(cardiovascularProbability),
        color: "#eab308",
        textClass: "text-yellow-600",
        badgeClass:
          "border-yellow-200 bg-yellow-100 text-yellow-700 hover:border-yellow-200 hover:bg-yellow-100 hover:text-yellow-700",
        softBg: "bg-yellow-500/10",
      };
    }

    return {
      level: isArabic ? "منخفض" : "Low",
      message: getCardioResultMessage(cardiovascularProbability),
      color: "#22c55e",
      textClass: "text-green-600",
      badgeClass:
        "border-green-200 bg-green-100 text-green-700 hover:border-green-200 hover:bg-green-100 hover:text-green-700",
      softBg: "bg-green-500/10",
    };
  }, [cardiovascularPrediction, cardiovascularProbability, isArabic]);

  const getToneVisuals = (tone: RiskTone): ToneVisuals => {
    if (tone.color === "#eab308") {
      return {
        ringClass: "ring-yellow-100",
        borderClass: "border-yellow-100",
        gradientClass: "from-yellow-50 via-white to-white",
      };
    }

    if (tone.color === "#22c55e") {
      return {
        ringClass: "ring-green-100",
        borderClass: "border-green-100",
        gradientClass: "from-green-50 via-white to-white",
      };
    }

    return {
      ringClass: "ring-red-100",
      borderClass: "border-red-100",
      gradientClass: "from-red-50 via-white to-white",
    };
  };

  const riskVisuals = getToneVisuals(riskTone);
  const cardioVisuals = getToneVisuals(cardioTone);

  const pieData = [
    { name: t("report.diabetesRisk"), value: probability },
    { name: t("report.remaining"), value: Math.max(0, 100 - probability) },
  ];

  const cardioPieData = [
    {
      name: isArabic ? "خطر القلب والأوعية الدموية" : "Cardiovascular Risk",
      value: cardiovascularProbability,
    },
    {
      name: t("report.remaining"),
      value: Math.max(0, 100 - cardiovascularProbability),
    },
  ];

  const recommendations = useMemo(() => {
    if (probability > 70) {
      return [
        t("report.recommendations.high.1"),
        t("report.recommendations.high.2"),
        t("report.recommendations.high.3"),
        t("report.recommendations.high.4"),
      ];
    }

    if (probability > 50) {
      return [
        t("report.recommendations.mediumHigh.1"),
        t("report.recommendations.mediumHigh.2"),
        t("report.recommendations.mediumHigh.3"),
        t("report.recommendations.mediumHigh.4"),
      ];
    }

    if (probability > 20) {
      return [
        t("report.recommendations.moderate.1"),
        t("report.recommendations.moderate.2"),
        t("report.recommendations.moderate.3"),
        t("report.recommendations.moderate.4"),
      ];
    }

    return [
      t("report.recommendations.low.1"),
      t("report.recommendations.low.2"),
      t("report.recommendations.low.3"),
      t("report.recommendations.low.4"),
    ];
  }, [probability, t]);

  const cardioRecommendations = useMemo(() => {
    if (!cardiovascularPrediction) return [];

    const normalizedRisk = String(cardiovascularPrediction?.risk_level || "")
      .toLowerCase()
      .replace(/\s|-/g, "_");

    const isVeryHigh =
      normalizedRisk === "very_high" ||
      normalizedRisk === "veryhigh" ||
      cardiovascularProbability >= 80;

    const isHigh =
      normalizedRisk === "high" || cardiovascularProbability >= 60;

    const isMedium =
      normalizedRisk === "medium" ||
      normalizedRisk === "moderate" ||
      cardiovascularProbability >= 30;

    if (isVeryHigh) {
      return isArabic
        ? [
            "ينصح بمراجعة طبيب القلب أو الباطنة في أقرب وقت لتقييم عوامل الخطورة.",
            "متابعة ضغط الدم والكوليسترول والسكر ضرورية لتقليل احتمالية المضاعفات.",
            "تقليل الملح والدهون المشبعة والوجبات عالية السعرات خطوة مهمة.",
            "أي أعراض مثل ألم الصدر أو ضيق النفس أو خفقان شديد تحتاج لتقييم طبي فوري.",
          ]
        : [
            "A cardiology or internal medicine review is strongly recommended to assess risk factors.",
            "Monitoring blood pressure, cholesterol, and glucose is important to reduce complications.",
            "Reducing salt, saturated fats, and high-calorie meals is recommended.",
            "Symptoms such as chest pain, shortness of breath, or severe palpitations require urgent medical assessment.",
          ];
    }

    if (isHigh) {
      return isArabic
        ? [
            "النتيجة تشير إلى خطورة عالية، ويفضل مراجعة الطبيب لوضع خطة متابعة واضحة.",
            "ينصح بقياس ضغط الدم بانتظام ومتابعة مستوى الكوليسترول.",
            "تحسين النظام الغذائي وتقليل الدهون المشبعة يساعدان في خفض الخطر.",
            "المشي أو النشاط البدني المنتظم قد يدعم صحة القلب إذا لم يكن هناك مانع طبي.",
          ]
        : [
            "The result indicates high risk; medical follow-up is recommended for a clear care plan.",
            "Regular blood pressure measurement and cholesterol monitoring are advised.",
            "Improving diet and reducing saturated fats can help lower risk.",
            "Walking or regular physical activity may support heart health if medically appropriate.",
          ];
    }

    if (isMedium) {
      return isArabic
        ? [
            "النتيجة متوسطة، وينصح بتحسين نمط الحياة ومتابعة المؤشرات بشكل دوري.",
            "الحفاظ على ضغط دم مناسب ووزن صحي يساعد في تقليل خطورة القلب.",
            "تقليل الملح والدهون والسكريات الزائدة خطوة وقائية مهمة.",
            "المتابعة الدورية مفيدة خصوصًا مع وجود تاريخ عائلي أو ارتفاع ضغط.",
          ]
        : [
            "The result is medium; lifestyle improvement and periodic monitoring are recommended.",
            "Maintaining healthy blood pressure and weight can reduce cardiovascular risk.",
            "Reducing salt, fats, and excess sugar is an important preventive step.",
            "Regular follow-up is useful, especially with family history or high blood pressure.",
          ];
    }

    return isArabic
      ? [
          "النتيجة منخفضة، وينصح بالحفاظ على نمط حياة صحي لدعم صحة القلب.",
          "الاستمرار في تناول غذاء متوازن وممارسة نشاط بدني منتظم مفيد وقائيًا.",
          "متابعة ضغط الدم والكوليسترول بشكل دوري تساعد في الاكتشاف المبكر لأي تغير.",
          "تجنب زيادة الوزن والعادات غير الصحية يحافظ على انخفاض الخطورة.",
        ]
      : [
          "The result is low; maintaining a healthy lifestyle supports heart health.",
          "A balanced diet and regular physical activity are useful preventive habits.",
          "Periodic blood pressure and cholesterol checks help detect early changes.",
          "Avoiding weight gain and unhealthy habits helps keep risk low.",
        ];
  }, [cardiovascularPrediction, cardiovascularProbability, isArabic]);

  const getFieldLabel = (key: string) => {
    switch (key) {
      case "gender":
        return isArabic ? "النوع" : "Gender";
      case "pregnancies":
        return t("report.fields.pregnancies");
      case "glucose":
        return t("report.fields.glucose");
      case "bloodPressure":
      case "blood_pressure":
        return t("report.fields.bloodPressure");
      case "systolicBloodPressure":
      case "systolic_blood_pressure":
        return isArabic ? "ضغط الدم الانقباضي" : "Systolic Blood Pressure";
      case "diastolicBloodPressure":
      case "diastolic_blood_pressure":
        return isArabic ? "ضغط الدم الانبساطي" : "Diastolic Blood Pressure";
      case "skinThickness":
      case "skin_thickness":
        return t("report.fields.skinThickness");
      case "insulin":
        return t("report.fields.insulin");
      case "weight":
        return isArabic ? "الوزن" : "Weight";
      case "height":
        return isArabic ? "الطول" : "Height";
      case "cholesterol":
        return isArabic ? "الكوليسترول" : "Cholesterol";
      case "bmi":
        return t("report.fields.bmi");
      case "diabetesPedigreeFunction":
      case "diabetes_pedigree_function":
        return t("report.fields.diabetesPedigreeFunction");
      case "age":
        return t("report.fields.age");
      default:
        return key;
    }
  };

  const getDisplayValue = (key: string, value: unknown) => {
    if (key === "gender") {
      if (value === "male") return isArabic ? "ذكر" : "Male";
      if (value === "female") return isArabic ? "أنثى" : "Female";
    }

    if (key === "weight") return `${value} kg`;
    if (key === "height") return `${value} cm`;
    if (key === "glucose") return `${value} mg/dL`;
    if (key === "cholesterol") return `${value} mg/dL`;

    if (key === "systolicBloodPressure" || key === "diastolicBloodPressure") {
      return `${value} mmHg`;
    }

    return String(value);
  };

  const filteredFormEntries = Object.entries(formData).filter(([key]) => {
    const hiddenKeys = new Set([
      "bmi",
      "bloodPressure",
      "blood_pressure",
      "smoke",
      "physicalActivity",
      "physical_activity",
    ]);

    return !hiddenKeys.has(key);
  });

  const reportDate = new Date().toLocaleDateString(
    isArabic ? "ar-EG" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const downloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const currentDate = new Date().toLocaleDateString(
        isArabic ? "ar-EG" : "en-US"
      );

      doc.setFontSize(20);
      doc.text(t("report.pdf.title"), 105, 20, { align: "center" });

      doc.setFontSize(12);
      doc.text(`${t("report.pdf.analysisDate")}: ${currentDate}`, 105, 30, {
        align: "center",
      });

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(t("report.diabetesRiskProbability"), 20, 48);

      doc.setFontSize(30);
      doc.setTextColor(riskTone.color);
      doc.text(`${probability.toFixed(2)}%`, 20, 63);

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`${t("report.riskLevelLabel")}: ${riskTone.level}`, 20, 73);

      doc.setFontSize(11);
      doc.text(riskTone.message, 20, 83, {
        maxWidth: 170,
        align: isArabic ? "right" : "left",
      });

      let currentY = 106;

      if (cardiovascularPrediction) {
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(
          isArabic
            ? "احتمالية خطر القلب والأوعية الدموية"
            : "Cardiovascular Risk Probability",
          20,
          currentY
        );

        doc.setFontSize(30);
        doc.setTextColor(cardioTone.color);
        doc.text(`${cardiovascularProbability.toFixed(2)}%`, 20, currentY + 15);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(
          `${t("report.riskLevelLabel")}: ${cardioTone.level}`,
          20,
          currentY + 25
        );

        doc.setFontSize(11);
        doc.text(cardioTone.message, 20, currentY + 35, {
          maxWidth: 170,
          align: isArabic ? "right" : "left",
        });

        currentY += 58;
      }

      const tableData = filteredFormEntries.map(([key, value]) => [
        getFieldLabel(key),
        getDisplayValue(key, value),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [[t("report.pdf.parameter"), t("report.pdf.value")]],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 10,
          cellPadding: 3.5,
          halign: isArabic ? "right" : "left",
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
        },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });

      const finalY = (doc as ExtendedjsPDF).lastAutoTable?.finalY || currentY;

      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text(t("report.personalizedRecommendations"), 20, finalY + 14);

      let adviceY = finalY + 24;

      recommendations.forEach((rec) => {
        doc.setFontSize(10);
        doc.text(`• ${rec}`, 25, adviceY, {
          maxWidth: 160,
        });
        adviceY += 7;
      });

      if (cardioRecommendations.length > 0) {
        adviceY += 5;

        doc.setFontSize(13);
        doc.text(t("report.personalizedRecommendations"), 20, adviceY);

        adviceY += 9;

        cardioRecommendations.forEach((rec) => {
          doc.setFontSize(10);
          doc.text(`• ${rec}`, 25, adviceY, {
            maxWidth: 160,
          });
          adviceY += 7;
        });
      }

      doc.save(
        `Medical_Risk_Report_${new Date().toISOString().slice(0, 10)}.pdf`
      );
    } catch (error) {
      console.error("PDF generation error:", error);
      alert(t("report.pdfError"));
    }
  };

  const PredictionCard = ({
    title,
    subtitle,
    probability,
    tone,
    visuals,
    pieData,
    icon,
    metricLabel,
  }: PredictionCardProps) => {
    return (
      <Card
        className={`relative overflow-hidden rounded-[22px] border ${visuals.borderClass} bg-gradient-to-br ${visuals.gradientClass} shadow-sm`}
      >
        <CardContent className="relative p-4 md:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 ring-4 ${visuals.ringClass}`}
              >
                {icon}
              </span>

              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold tracking-tight text-slate-900 md:text-base">
                  {title}
                </h3>

                <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                  {subtitle}
                </p>
              </div>
            </div>

            <Badge
              className={`pointer-events-none shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-none ${tone.badgeClass}`}
            >
              {tone.level}
            </Badge>
          </div>

          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_130px]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {metricLabel}
              </p>

              <div
                className="mt-1.5 text-3xl font-semibold tracking-tight md:text-4xl"
                style={{ color: tone.color }}
              >
                {probability.toFixed(2)}%
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/70">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.max(0, probability))}%`,
                    backgroundColor: tone.color,
                  }}
                />
              </div>

              <p className={`mt-2.5 text-xs font-medium ${tone.textClass}`}>
                {t("report.riskLevelLabel")}: {tone.level}
              </p>
            </div>

            <div className="mx-auto h-32 w-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    <Cell fill={tone.color} />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (
    diabetesPrediction?.probability === undefined ||
    diabetesPrediction?.probability === null
  ) {
    return (
      <div
        className="flex min-h-screen flex-col bg-background"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <Header variant="dashboard" />

        <main
          className="container mx-auto flex flex-1 items-center justify-center px-4"
          style={{
            paddingTop: `${DESKTOP_HEADER_HEIGHT + 24}px`,
            paddingBottom: "24px",
          }}
        >
          <Card className="w-full max-w-sm rounded-2xl border border-border/60 shadow-md">
            <CardContent className="pb-7 pt-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10">
                <AlertTriangle className="h-7 w-7 text-yellow-500" />
              </div>

              <h2 className="mb-2 text-lg font-bold tracking-tight">
                {t("report.noResultTitle")}
              </h2>

              <p className="mb-5 text-sm leading-7 text-muted-foreground">
                {t("report.noResultDescription")}
              </p>

              <Link to="/diagnosis">
                <Button className="h-10 w-full rounded-full text-sm">
                  <ArrowLeft
                    className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                  />
                  {t("report.backToDiagnosis")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-slate-50"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="dashboard" />

      <main
        className="container mx-auto max-w-6xl flex-1 px-4"
        style={{
          paddingTop: `${DESKTOP_HEADER_HEIGHT + 18}px`,
          paddingBottom: "28px",
        }}
      >
        <div className="space-y-4">
          <Card className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-primary/5 via-white to-primary/10 px-4 py-5 md:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-4.5 w-4.5" strokeWidth={2.3} />
                    </span>

                    
                  </div>

                  <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                    {t("report.title")}
                  </CardTitle>

                  <p className="mt-1.5 max-w-2xl text-xs font-medium leading-5 text-slate-500 md:text-sm">
                    {isArabic
                      ? "ملخص لنتائج توقع السكري وخطر القلب والأوعية الدموية بناءً على المؤشرات المدخلة."
                      : "A summary of diabetes and cardiovascular risk results based on the submitted indicators."}
                  </p>
                </div>

                <div className="w-fit rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-sm">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    {t("report.pdf.analysisDate")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-900">
                    {reportDate}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-4 md:p-5">
              <div
                className={`grid grid-cols-1 gap-4 ${
                  cardiovascularPrediction ? "xl:grid-cols-2" : "xl:grid-cols-1"
                }`}
              >
                <PredictionCard
                  title={t("report.diabetesRiskProbability")}
                  subtitle={t("report.preliminaryResult")}
                  metricLabel={t("report.diabetesRisk")}
                  probability={probability}
                  tone={riskTone}
                  visuals={riskVisuals}
                  pieData={pieData}
                  icon={
                    <Activity
                      className={`h-5 w-5 ${riskTone.textClass}`}
                      strokeWidth={2.4}
                    />
                  }
                />

                {cardiovascularPrediction && (
                  <PredictionCard
                    title={
                      isArabic
                        ? "احتمالية خطر القلب والأوعية الدموية"
                        : "Cardiovascular Risk Probability"
                    }
                    subtitle={isArabic ? "نتيجة مبدئية" : "Preliminary Result"}
                    metricLabel={
                      isArabic
                        ? "خطر القلب والأوعية الدموية"
                        : "Cardiovascular Risk"
                    }
                    probability={cardiovascularProbability}
                    tone={cardioTone}
                    visuals={cardioVisuals}
                    pieData={cardioPieData}
                    icon={
                      <HeartPulse
                        className={`h-5 w-5 ${cardioTone.textClass}`}
                        strokeWidth={2.4}
                      />
                    }
                  />
                )}
              </div>

              <div
                className={`grid grid-cols-1 gap-4 ${
                  cardiovascularPrediction ? "lg:grid-cols-2" : "lg:grid-cols-1"
                }`}
              >
                <Card
                  className={`rounded-[22px] border ${riskVisuals.borderClass} ${riskTone.softBg} shadow-sm`}
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80">
                        <Stethoscope
                          className={`h-4.5 w-4.5 ${riskTone.textClass}`}
                          strokeWidth={2.4}
                        />
                      </span>

                      <div>
                        <h3
                          className={`text-sm font-semibold md:text-base ${riskTone.textClass}`}
                        >
                          {t("report.preliminaryResult")}
                        </h3>
                        <p className="text-[11px] font-medium text-slate-500">
                          {t("report.diabetesRiskProbability")}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`text-sm font-medium leading-6 ${riskTone.textClass}`}
                    >
                      {riskTone.message}
                    </p>
                  </CardContent>
                </Card>

                {cardiovascularPrediction && (
                  <Card
                    className={`rounded-[22px] border ${cardioVisuals.borderClass} ${cardioTone.softBg} shadow-sm`}
                  >
                    <CardContent className="p-4 md:p-5">
                      <div className="mb-3 flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80">
                          <TrendingUp
                            className={`h-4.5 w-4.5 ${cardioTone.textClass}`}
                            strokeWidth={2.4}
                          />
                        </span>

                        <div>
                          <h3
                            className={`text-sm font-semibold md:text-base ${cardioTone.textClass}`}
                          >
                            {isArabic ? "نتيجة مبدئية" : "Preliminary Result"}
                          </h3>
                          <p className="text-[11px] font-medium text-slate-500">
                            {isArabic
                              ? "احتمالية خطر القلب والأوعية الدموية"
                              : "Cardiovascular Risk Probability"}
                          </p>
                        </div>
                      </div>

                      <p
                        className={`text-sm font-medium leading-6 ${cardioTone.textClass}`}
                      >
                        {cardioTone.message}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card className="rounded-[22px] border border-slate-100 bg-slate-50/70 shadow-sm">
                <CardContent className="p-4 md:p-5">
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ClipboardList className="h-4.5 w-4.5" strokeWidth={2.4} />
                    </span>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 md:text-base">
                        {t("report.personalizedRecommendations")}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-500">
                        {isArabic
                          ? "توصيات مبدئية حسب مستوى الخطورة"
                          : "Initial recommendations based on the risk level"}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`grid grid-cols-1 gap-4 ${
                      cardiovascularPrediction ? "lg:grid-cols-2" : "lg:grid-cols-1"
                    }`}
                  >
                    <div className="rounded-[18px] border border-slate-100 bg-white p-3.5 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${riskTone.softBg}`}
                          >
                            <Activity
                              className={`h-3.5 w-3.5 ${riskTone.textClass}`}
                            />
                          </span>

                          <h4 className="text-xs font-semibold text-slate-900">
                            {t("report.personalizedRecommendations")}
                          </h4>
                        </div>

                        <Badge
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${riskTone.badgeClass}`}
                        >
                          {riskTone.level}
                        </Badge>
                      </div>

                      <ul className="space-y-2.5">
                        {recommendations.map((rec, index) => (
                          <li
                            key={`diabetes-${index}`}
                            className="flex items-start gap-2.5 rounded-xl bg-slate-50/80 px-3 py-2.5 text-xs font-medium leading-5 text-slate-700 md:text-sm"
                          >
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: riskTone.color }}
                            />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {cardiovascularPrediction && (
                      <div className="rounded-[18px] border border-slate-100 bg-white p-3.5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-lg ${cardioTone.softBg}`}
                            >
                              <HeartPulse
                                className={`h-3.5 w-3.5 ${cardioTone.textClass}`}
                              />
                            </span>

                            <h4 className="text-xs font-semibold text-slate-900">
                              {t("report.personalizedRecommendations")}
                            </h4>
                            
                          </div>

                          <Badge
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cardioTone.badgeClass}`}
                          >
                            {cardioTone.level}
                          </Badge>
                        </div>

                        <ul className="space-y-2.5">
                          {cardioRecommendations.map((rec, index) => (
                            <li
                              key={`cardio-${index}`}
                              className="flex items-start gap-2.5 rounded-xl bg-slate-50/80 px-3 py-2.5 text-xs font-medium leading-5 text-slate-700 md:text-sm"
                            >
                              <span
                                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: cardioTone.color }}
                              />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[22px] border border-slate-100 bg-white shadow-sm">
                <CardContent className="p-4 md:p-5">
                  <div className="mb-3.5 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ClipboardList className="h-4.5 w-4.5" strokeWidth={2.4} />
                    </span>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 md:text-base">
                        {t("report.pdf.parameter")}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-500">
                        {isArabic
                          ? "البيانات المستخدمة في التحليل"
                          : "Submitted values used for analysis"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    {filteredFormEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 transition-all duration-300 hover:bg-white hover:shadow-sm"
                      >
                        <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">
                          {getFieldLabel(key)}
                        </div>

                        <div className="mt-1.5 text-sm font-semibold tracking-tight text-slate-900">
                          {getDisplayValue(key, value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col justify-center gap-2.5 pt-1 sm:flex-row">
                <Button
                  variant="outline"
                  asChild
                  className="h-10 w-full rounded-full border-primary/30 px-5 text-sm font-medium text-primary hover:bg-primary/10 hover:text-primary sm:w-auto"
                >
                  <Link to="/diagnosis">
                    <ArrowLeft
                      className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                    />
                    {t("report.newAnalysis")}
                  </Link>
                </Button>

                <Button
                  onClick={downloadPDF}
                  className="h-10 w-full rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto"
                >
                  <Download
                    className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                  />
                  {t("report.downloadPdf")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}