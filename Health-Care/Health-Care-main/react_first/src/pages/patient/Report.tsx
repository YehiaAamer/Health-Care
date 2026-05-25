import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowLeft, Download } from "lucide-react";
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

const DESKTOP_HEADER_HEIGHT = 72;

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const result = location.state || {};

  useEffect(() => {
    if (result.probability === undefined || result.probability === null) {
      const timer = setTimeout(() => {
        navigate("/diagnosis", { replace: true });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [result.probability, navigate]);

  const probability = Number(result.probability ?? 0);
  const formData = result.formData || {};

  const riskTone = useMemo(() => {
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

  const pieData = [
    { name: t("report.diabetesRisk"), value: probability },
    { name: t("report.remaining"), value: 100 - probability },
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

  const getFieldLabel = (key: string) => {
    switch (key) {
      case "pregnancies":
        return t("report.fields.pregnancies");
      case "glucose":
        return t("report.fields.glucose");
      case "bloodPressure":
      case "blood_pressure":
        return t("report.fields.bloodPressure");
      case "skinThickness":
      case "skin_thickness":
        return t("report.fields.skinThickness");
      case "insulin":
        return t("report.fields.insulin");
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

      doc.setFontSize(40);
      doc.setTextColor(riskTone.color);
      doc.text(`${probability.toFixed(2)}%`, 105, 60, { align: "center" });

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(t("report.diabetesRiskProbability"), 105, 75, {
        align: "center",
      });

      doc.setFontSize(16);
      doc.setTextColor(riskTone.color);
      doc.text(`${t("report.riskLevelLabel")}: ${riskTone.level}`, 105, 90, {
        align: "center",
      });

      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text(riskTone.message, 20, 108, {
        maxWidth: 170,
        align: isArabic ? "right" : "left",
      });

      const tableData = Object.entries(formData).map(([key, value]) => [
        getFieldLabel(key),
        String(value),
      ]);

      autoTable(doc, {
        startY: 128,
        head: [[t("report.pdf.parameter"), t("report.pdf.value")]],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 11,
          cellPadding: 4,
          halign: isArabic ? "right" : "left",
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
        },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });

      const finalY = (doc as ExtendedjsPDF).lastAutoTable?.finalY || 128;

      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text(t("report.personalizedRecommendations"), 20, finalY + 14);

      recommendations.forEach((rec, i) => {
        doc.setFontSize(11);
        doc.text(`• ${rec}`, 25, finalY + 23 + i * 7, {
          maxWidth: 160,
        });
      });

      doc.save(
        `Diabetes_Risk_Report_${new Date().toISOString().slice(0, 10)}.pdf`
      );
    } catch (error) {
      console.error("PDF generation error:", error);
      alert(t("report.pdfError"));
    }
  };

  if (result.probability === undefined || result.probability === null) {
    return (
      <div
        className="min-h-screen flex flex-col bg-background"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <Header variant="dashboard" />

        <main
          className="flex-1 container mx-auto px-4 flex items-center justify-center"
          style={{
            paddingTop: `${DESKTOP_HEADER_HEIGHT + 24}px`,
            paddingBottom: "24px",
          }}
        >
          <Card className="w-full max-w-sm rounded-2xl border border-border/60 shadow-md">
            <CardContent className="pt-7 pb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10">
                <AlertTriangle className="h-7 w-7 text-yellow-500" />
              </div>

              <h2 className="text-lg font-bold tracking-tight mb-2">
                {t("report.noResultTitle")}
              </h2>

              <p className="text-sm text-muted-foreground mb-5 leading-7">
                {t("report.noResultDescription")}
              </p>

              <Link to="/diagnosis">
                <Button className="w-full rounded-full h-10 text-sm">
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
      className="min-h-screen flex flex-col bg-background"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Header variant="dashboard" />

      <main
        className="flex-1 container max-w-4xl px-4 mx-auto"
        style={{
          paddingTop: `${DESKTOP_HEADER_HEIGHT + 20}px`,
          paddingBottom: "32px",
        }}
      >
        <Card className="overflow-hidden rounded-[24px] border border-border/60 shadow-lg bg-background/95">
          <CardHeader className="text-center pb-4 pt-6 px-5 md:px-6 border-b bg-muted/10">
            <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight">
              {t("report.title")}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 md:p-6 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1fr] gap-5">
              <Card className="rounded-[22px] border border-border/60 shadow-sm overflow-hidden">
                <CardContent className="p-5 md:p-6 h-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-background to-muted/20">
                  <div
                    className={`mb-2 text-sm font-semibold ${riskTone.textClass}`}
                  >
                    {t("report.diabetesRiskProbability")}
                  </div>

                  <div
                    className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3"
                    style={{ color: riskTone.color }}
                  >
                    {probability.toFixed(2)}%
                  </div>

                  <div className="w-44 h-44 md:w-52 md:h-52 relative mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={82}
                          paddingAngle={2}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                          stroke="none"
                        >
                          <Cell fill={riskTone.color} />
                          <Cell fill="#e5e7eb" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t("report.riskLevelLabel")}
                        </div>
                        <div
                          className={`text-sm font-semibold ${riskTone.textClass}`}
                        >
                          {riskTone.level}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Badge
                    className={`pointer-events-none text-sm px-5 py-2 font-semibold rounded-full border shadow-sm transition-none ${riskTone.badgeClass}`}
                  >
                    {riskTone.level}
                  </Badge>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-5">
                <Card
                  className={`rounded-[22px] border border-border/60 shadow-sm ${riskTone.softBg}`}
                >
                  <CardContent className="p-5 md:p-6">
                    <h3
                      className={`text-base md:text-lg font-semibold mb-3 ${riskTone.textClass}`}
                    >
                      {t("report.preliminaryResult")}
                    </h3>

                    <p
                      className={`text-sm md:text-[15px] leading-7 font-medium ${riskTone.textClass}`}
                    >
                      {riskTone.message}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-[22px] border border-border/60 shadow-sm bg-muted/20">
                  <CardContent className="p-5 md:p-6">
                    <h3 className="text-base md:text-lg font-semibold mb-3">
                      {t("report.personalizedRecommendations")}
                    </h3>

                    <ul className="space-y-2.5 text-sm leading-7">
                      {recommendations.map((rec, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 rounded-2xl bg-background border border-border/50 px-3.5 py-2.5"
                        >
                          <span
                            className="mt-2 h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: riskTone.color }}
                          />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="rounded-[22px] border border-border/60 shadow-sm">
              <CardContent className="p-5 md:p-6">
                <h3 className="text-base md:text-lg font-semibold mb-3">
                  {t("report.pdf.parameter")}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {Object.entries(formData).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-2xl border border-border/60 bg-background px-3.5 py-3"
                    >
                      <div className="text-xs text-muted-foreground leading-6">
                        {getFieldLabel(key)}
                      </div>
                      <div className="text-base font-semibold mt-1 tracking-tight">
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
              <Button
                variant="outline"
                asChild
                className="w-full sm:w-auto rounded-full h-10 px-5 text-sm"
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
                className="w-full sm:w-auto rounded-full h-10 px-5 text-sm"
              >
                <Download
                  className={isArabic ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
                />
                {t("report.downloadPdf")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}