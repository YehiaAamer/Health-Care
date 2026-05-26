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
  HeartPulse,
  FileText,
  ClipboardList,
  TrendingUp,
  Droplets,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useTranslation } from "react-i18next";

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
    const percentage = cardioProbability.toFixed(1);

    if (cardioProbability >= 80) {
      return isArabic
        ? `احتمالية الإصابة: ${percentage}% - مستوى المخاطر: عالي جدًا. قد تشمل عوامل الخطر ارتفاع ضغط الدم، ارتفاع الكوليسترول، زيادة الوزن، ارتفاع السكر، أو وجود مؤشرات قوية على إجهاد القلب والأوعية الدموية. يُنصح بمراجعة طبيب القلب أو الباطنة في أقرب وقت وإجراء فحوصات إضافية.`
        : `Risk probability: ${percentage}% - Risk level: Very High. Risk factors may include high blood pressure, high cholesterol, excess weight, elevated glucose, or strong indicators of cardiovascular strain. Medical review with a cardiologist or internal medicine specialist is recommended as soon as possible, along with further tests.`;
    }

    if (cardioProbability >= 60) {
      return isArabic
        ? `احتمالية الإصابة: ${percentage}% - مستوى المخاطر: مرتفع. قد تشمل عوامل الخطر ارتفاع ضغط الدم، زيادة الكوليسترول، زيادة الوزن، ارتفاع السكر، أو ضعف نمط الحياة الصحي. يُنصح بمراجعة طبيب وإجراء فحوصات إضافية لمتابعة عوامل الخطورة.`
        : `Risk probability: ${percentage}% - Risk level: High. Risk factors may include high blood pressure, elevated cholesterol, excess weight, elevated glucose, or unhealthy lifestyle patterns. Medical review and additional tests are recommended to monitor risk factors.`;
    }

    if (cardioProbability >= 30) {
      return isArabic
        ? `احتمالية الإصابة: ${percentage}% - مستوى المخاطر: متوسط. قد تشمل عوامل الخطر بداية ارتفاع ضغط الدم، زيادة بسيطة في الوزن، ارتفاع الكوليسترول، أو ارتفاع السكر بدرجة متوسطة. يُنصح بتحسين نمط الحياة ومتابعة المؤشرات الصحية بشكل دوري.`
        : `Risk probability: ${percentage}% - Risk level: Medium. Risk factors may include early blood pressure elevation, mild excess weight, elevated cholesterol, or moderate glucose elevation. Lifestyle improvement and periodic health monitoring are recommended.`;
    }

    return isArabic
      ? `احتمالية الإصابة: ${percentage}% - مستوى المخاطر: منخفض. لا تظهر المؤشرات المدخلة خطورة مرتفعة حاليًا على القلب والأوعية الدموية، لكن يُنصح بالحفاظ على نمط حياة صحي ومتابعة ضغط الدم والكوليسترول والسكر بشكل دوري.`
      : `Risk probability: ${percentage}% - Risk level: Low. The submitted indicators do not currently show high cardiovascular risk, but maintaining a healthy lifestyle and periodically monitoring blood pressure, cholesterol, and glucose is recommended.`;
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
      name: isArabic
        ? "خطر الإصابة بأمراض القلب والأوعية الدموية"
        : "Cardiovascular Disease Risk",
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

    if (
      key === "bloodPressure" ||
      key === "blood_pressure" ||
      key === "systolicBloodPressure" ||
      key === "systolic_blood_pressure" ||
      key === "diastolicBloodPressure" ||
      key === "diastolic_blood_pressure"
    ) {
      return `${value} mmHg`;
    }

    return String(value);
  };

  const getPdfFieldLabel = (key: string) => {
    switch (key) {
      case "gender":
        return "Gender";
      case "pregnancies":
        return "Pregnancies";
      case "glucose":
        return "Glucose";
      case "bloodPressure":
      case "blood_pressure":
        return "Blood Pressure";
      case "systolicBloodPressure":
      case "systolic_blood_pressure":
        return "Systolic Blood Pressure";
      case "diastolicBloodPressure":
      case "diastolic_blood_pressure":
        return "Diastolic Blood Pressure";
      case "skinThickness":
      case "skin_thickness":
        return "Skin Thickness";
      case "insulin":
        return "Insulin";
      case "weight":
        return "Weight";
      case "height":
        return "Height";
      case "cholesterol":
        return "Cholesterol";
      case "bmi":
        return "BMI";
      case "diabetesPedigreeFunction":
      case "diabetes_pedigree_function":
        return "Diabetes Pedigree Function";
      case "age":
        return "Age";
      default:
        return key;
    }
  };

  const getPdfDisplayValue = (key: string, value: unknown) => {
    if (key === "gender") {
      if (value === "male") return "Male";
      if (value === "female") return "Female";
    }

    if (key === "weight") return `${value} kg`;
    if (key === "height") return `${value} cm`;
    if (key === "glucose") return `${value} mg/dL`;
    if (key === "cholesterol") return `${value} mg/dL`;

    if (
      key === "bloodPressure" ||
      key === "blood_pressure" ||
      key === "systolicBloodPressure" ||
      key === "systolic_blood_pressure" ||
      key === "diastolicBloodPressure" ||
      key === "diastolic_blood_pressure"
    ) {
      return `${value} mmHg`;
    }

    return String(value);
  };

  const getPdfRiskLevel = (riskProbability: number) => {
    if (riskProbability > 70) return "High";
    if (riskProbability > 50) return "High";
    if (riskProbability > 20) return "Medium";
    return "Low";
  };

  const getPdfCardioRiskLevel = (cardioProbability: number) => {
    if (cardioProbability >= 80) return "Very High";
    if (cardioProbability >= 60) return "High";
    if (cardioProbability >= 30) return "Medium";
    return "Low";
  };

  const filteredFormEntries = Object.entries(formData).filter(([key]) => {
    const hiddenKeys = new Set([
      "bmi",
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

const downloadPDF = async () => {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const primary = [13, 177, 201] as [number, number, number]; // HealthCare cyan
    const dark = [15, 23, 42] as [number, number, number];
    const muted = [100, 116, 139] as [number, number, number];
    const border = [226, 232, 240] as [number, number, number];
    const softGray = [248, 250, 252] as [number, number, number];
    const lightPrimary = [236, 253, 255] as [number, number, number];

    const hexToRgb = (hex: string): [number, number, number] => {
      const cleanHex = hex.replace("#", "");
      const value = parseInt(cleanHex, 16);

      return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
    };

    const diabetesPdfLevel = getPdfRiskLevel(probability);
    const cardioPdfLevel = getPdfCardioRiskLevel(cardiovascularProbability);

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

    const reportId = `HC-${new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "")}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const drawBrandLogo = (x: number, y: number) => {
      // Small logo icon only - website name size kept clear
      doc.setDrawColor(...primary);
      doc.setLineWidth(0.9);
      doc.setLineCap("round");
      doc.setLineJoin("round");

      doc.line(x, y + 5.5, x + 3.5, y + 5.5);
      doc.line(x + 3.5, y + 5.5, x + 5.5, y + 0.5);
      doc.line(x + 5.5, y + 0.5, x + 9.2, y + 12.5);
      doc.line(x + 9.2, y + 12.5, x + 12.2, y + 5.5);
      doc.line(x + 12.2, y + 5.5, x + 16.8, y + 5.5);

      doc.setFillColor(...primary);
      doc.circle(x + 19, y + 5.5, 0.6, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...primary);
      doc.text("HealthCare", x + 22.5, y + 8.7);
    };

    const drawHeader = () => {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 34, "F");

      doc.setFillColor(...lightPrimary);
      doc.rect(0, 0, pageWidth, 3.5, "F");

      drawBrandLogo(14, 13);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...dark);
      doc.text("Medical Risk Report", pageWidth - 14, 12, {
        align: "right",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.3);
      doc.setTextColor(...muted);
      doc.text(`Report ID: ${reportId}`, pageWidth - 14, 18, {
        align: "right",
      });
      doc.text(`Date: ${currentDate}`, pageWidth - 14, 23.5, {
        align: "right",
      });

      doc.setDrawColor(...border);
      doc.setLineWidth(0.3);
      doc.line(14, 31.5, pageWidth - 14, 31.5);
    };

    const drawFooter = () => {
      doc.setDrawColor(...border);
      doc.setLineWidth(0.25);
      doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(...muted);
      doc.text("HealthCare Medical Risk Report", 14, pageHeight - 8.5);
    };

    const addSectionTitle = (title: string, y: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...dark);
      doc.text(title, 14, y);

      doc.setDrawColor(...primary);
      doc.setLineWidth(0.4);
      doc.line(14, y + 2.5, 45, y + 2.5);
    };

    const drawRiskBadge = (
      label: string,
      x: number,
      y: number,
      color: [number, number, number]
    ) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...color);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, 31, 7.2, 3.6, 3.6, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...color);
      doc.text(label, x + 15.5, y + 4.8, {
        align: "center",
      });
    };

    const addResultBox = ({
      title,
      percentage,
      level,
      color,
      x,
      y,
      width,
    }: {
      title: string;
      percentage: number;
      level: string;
      color: [number, number, number];
      x: number;
      y: number;
      width: number;
    }) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...border);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, width, 35, 2.5, 2.5, "FD");

      doc.setFillColor(...primary);
      doc.roundedRect(x, y, width, 1.7, 2.5, 2.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.2);
      doc.setTextColor(...dark);
      doc.text(title, x + 5, y + 8.8);

      drawRiskBadge(level, x + width - 36, y + 5.1, color);

      // Percentage without risk color for clean lab-style report
      doc.setFont("helvetica", "bold");
      doc.setFontSize(21);
      doc.setTextColor(...dark);
      doc.text(`${percentage.toFixed(2)}%`, x + 5, y + 23.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...muted);
      doc.text("Calculated Risk Value", x + 5, y + 30.5);
    };

    drawHeader();
    drawFooter();

    // Title area - compact to keep one page
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...dark);
    doc.text("Medical Risk Report", 14, 43);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(...muted);
    doc.text(
      "Diabetes and cardiovascular risk values based on submitted data.",
      14,
      49
    );

    let currentY = 61;

    addSectionTitle("Risk Values", currentY);
    currentY += 7;

    if (cardiovascularPrediction) {
      addResultBox({
        title: "Diabetes Risk",
        percentage: probability,
        level: diabetesPdfLevel,
        color: hexToRgb(riskTone.color),
        x: 14,
        y: currentY,
        width: 88,
      });

      addResultBox({
        title: "Cardiovascular Risk",
        percentage: cardiovascularProbability,
        level: cardioPdfLevel,
        color: hexToRgb(cardioTone.color),
        x: 108,
        y: currentY,
        width: 88,
      });
    } else {
      addResultBox({
        title: "Diabetes Risk",
        percentage: probability,
        level: diabetesPdfLevel,
        color: hexToRgb(riskTone.color),
        x: 14,
        y: currentY,
        width: 182,
      });
    }

    currentY += 47;

    addSectionTitle("Submitted Values", currentY);
    currentY += 6;

    const tableData = filteredFormEntries.map(([key, value]) => [
      getPdfFieldLabel(key),
      getPdfDisplayValue(key, value),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Parameter", "Value"]],
      body: tableData,
      theme: "grid",
      pageBreak: "avoid",
      rowPageBreak: "avoid",
      styles: {
        font: "helvetica",
        fontSize: 7.7,
        cellPadding: {
          top: 2,
          right: 2.4,
          bottom: 2,
          left: 2.4,
        },
        halign: "left",
        valign: "middle",
        lineColor: border,
        lineWidth: 0.12,
        textColor: dark,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: {
          top: 2.2,
          right: 2.4,
          bottom: 2.2,
          left: 2.4,
        },
      },
      alternateRowStyles: {
        fillColor: softGray,
      },
      columnStyles: {
        0: {
          cellWidth: 98,
          fontStyle: "bold",
        },
        1: {
          cellWidth: 84,
        },
      },
      margin: {
        left: 14,
        right: 14,
        top: 36,
        bottom: 18,
      },
      didDrawPage: () => {
        drawHeader();
        drawFooter();
      },
    });

    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i += 1) {
      doc.setPage(i);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(...muted);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 32, pageHeight - 8.5);
    }

    doc.save(
      `HealthCare_Medical_Risk_Report_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`
    );
  } catch (error) {
    console.error("PDF generation error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unknown PDF generation error";

    alert(`PDF Error: ${errorMessage}`);
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
                    <Droplets
                      className={`h-5 w-5 ${riskTone.textClass}`}
                      strokeWidth={2.4}
                    />
                  }
                />

                {cardiovascularPrediction && (
                  <PredictionCard
                    title={
                      isArabic
                        ? "احتمالية خطر الإصابة بأمراض القلب والأوعية الدموية"
                        : "Cardiovascular Disease Risk Probability"
                    }
                    subtitle={isArabic ? "نتيجة مبدئية" : "Preliminary Result"}
                    metricLabel={
                      isArabic
                        ? "خطر الإصابة بأمراض القلب والأوعية الدموية"
                        : "Cardiovascular Disease Risk"
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
                        <TrendingUp
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
                              ? "احتمالية خطر الإصابة بأمراض القلب والأوعية الدموية"
                              : "Cardiovascular Disease Risk Probability"}
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
                      cardiovascularPrediction
                        ? "lg:grid-cols-2"
                        : "lg:grid-cols-1"
                    }`}
                  >
                    <div className="rounded-[18px] border border-slate-100 bg-white p-3.5 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${riskTone.softBg}`}
                          >
                            <Droplets
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