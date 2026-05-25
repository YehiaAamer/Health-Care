// src/pages/History.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { apiCall, API_ENDPOINTS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Users, FileText, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface User {
  id: number;
  username: string;
  email: string | null;
}

interface Prediction {
  id: number;
  user: User;
  pregnancies: number;
  glucose: number;
  blood_pressure: number;
  skin_thickness: number;
  insulin: number;
  bmi: number;
  diabetes_pedigree_function: number;
  age: number;
  probability: number;
  risk_level: string;
  message: string;
  created_at: string;
}

export default function History() {
  const { user, isAuthenticated } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiCall<{
          count: number;
          predictions: Prediction[];
        }>(API_ENDPOINTS.HISTORY, {
          method: "GET",
        });
        setPredictions(data.predictions || []);
        if (data.predictions && data.predictions.length === 0) {
          toast.info("لا توجد تحليلات في السجل");
        }
      } catch (err) {
        console.error("❌ خطأ في جلب السجل:", err);
        setError("لم نتمكن من جلب سجل التحاليل");
        toast.error("خطأ في جلب البيانات");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchHistory();
    }
  }, [isAuthenticated, user]);

  // دالة للحصول على لون Badge بناءً على مستوى المخاطر
  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "منخفض":
        return "bg-green-100 text-green-800";
      case "متوسط":
        return "bg-yellow-100 text-yellow-800";
      case "مرتفع":
        return "bg-orange-100 text-orange-800";
      case "مرتفع جدًا":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // التحقق من صلاحية المدير
  const isAdmin = user?.is_staff || user?.is_superuser;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header variant="dashboard" />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Alert className="w-full max-w-md bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              يجب عليك تسجيل الدخول أولاً لعرض سجل التحاليل
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header variant="dashboard" />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Alert className="w-full max-w-md bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              عذراً، هذه الصفحة متاحة للمديرين فقط
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header variant="dashboard" />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <FileText className="h-10 w-10 text-primary" />
                سجل التحاليل
              </h1>
              <p className="text-muted-foreground">
                عرض آخر 40 تحليل من جميع المستخدمين
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">جاري تحميل السجل...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && predictions.length === 0 && (
          <Card className="p-12 text-center">
            <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">لا توجد تحليلات في السجل</h2>
            <p className="text-muted-foreground mb-6">
              لم يتم إجراء أي تحليلات بعد
            </p>
          </Card>
        )}

        {/* Summary Cards */}
        {!isLoading && !error && predictions.length > 0 && (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <FileText className="h-10 w-10 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي التحاليل</p>
                    <p className="text-3xl font-bold text-primary">{predictions.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <Users className="h-10 w-10 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">المستخدمين الفريدين</p>
                    <p className="text-3xl font-bold">
                      {new Set(predictions.map(p => p.user.id).filter(Boolean)).size}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <TrendingUp className="h-10 w-10 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">المتوسط العام</p>
                    <p className="text-3xl font-bold">
                      {(
                        predictions.reduce((sum, p) => sum + p.probability, 0) /
                        predictions.length
                      ).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-10 w-10 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">حالات عالية الخطورة</p>
                    <p className="text-3xl font-bold text-red-600">
                      {predictions.filter(p => 
                        p.risk_level.toLowerCase().includes("مرتفع")
                      ).length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Table */}
            <Card className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الجلوكوز</TableHead>
                      <TableHead>BMI</TableHead>
                      <TableHead>العمر</TableHead>
                      <TableHead>النسبة</TableHead>
                      <TableHead>مستوى الخطر</TableHead>
                      <TableHead className="text-right">الإجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predictions.map((pred) => (
                      <TableRow key={pred.id}>
                        <TableCell className="font-medium">#{pred.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pred.user.username}</p>
                            {pred.user.email && (
                              <p className="text-xs text-muted-foreground">{pred.user.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(pred.created_at).toLocaleDateString("ar-SA", {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                          <p className="text-xs text-muted-foreground">
                            {new Date(pred.created_at).toLocaleTimeString("ar-SA", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </TableCell>
                        <TableCell>{pred.glucose} mg/dL</TableCell>
                        <TableCell>{pred.bmi}</TableCell>
                        <TableCell>{pred.age}</TableCell>
                        <TableCell>
                          <span className={`font-bold ${
                            pred.probability >= 75 ? "text-red-600" :
                            pred.probability >= 50 ? "text-orange-600" :
                            pred.probability >= 25 ? "text-yellow-600" :
                            "text-green-600"
                          }`}>
                            {pred.probability.toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRiskBadgeColor(pred.risk_level)}>
                            {pred.risk_level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            to="/report"
                            state={{
                              formData: {
                                pregnancies: pred.pregnancies,
                                glucose: pred.glucose,
                                bloodPressure: pred.blood_pressure,
                                skinThickness: pred.skin_thickness,
                                insulin: pred.insulin,
                                bmi: pred.bmi,
                                diabetesPedigreeFunction: pred.diabetes_pedigree_function,
                                age: pred.age,
                              },
                              probability: pred.probability,
                              riskLevel: pred.risk_level,
                              message: pred.message,
                              predictionId: pred.id,
                            }}
                          >
                            <Button variant="outline" size="sm">
                              عرض
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
