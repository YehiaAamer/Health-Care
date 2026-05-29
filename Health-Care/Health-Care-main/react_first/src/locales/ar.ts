const ar = {
  home: "الرئيسية",

  doctorDashboard: {
    welcome: "مرحباً",
    subtitle: "نظرة عامة على مرضاك وتحليلاتهم",
    status: {
      operational: "الأنظمة تعمل بشكل طبيعي",
      
    },
    searchPlaceholder: "ابحث عن مريض...",
    sidebar: {
      title: "بوابة الطبيب",
      overview: "الرئيسية",
      dashboard: "لوحة التحكم",
      patients: "المرضى",
      doctor: "طبيب",
home: "الرئيسية",
profile: "الملف الشخصي",
logout: "تسجيل الخروج",
specialistDoctor: "طبيب متخصص",
recentActivity: "النشاط الأخير",
openSidebar: "فتح القائمة الجانبية",
collapseSidebar: "تصغير القائمة الجانبية",
      appointments: "المواعيد",
      reports: "التقارير",
      messages: {
        title: "المراسلات",
        searchPlaceholder: "ابحث عن المحادثات...",
        filters: {
          all: "الكل",
          unread: "غير مقروءة",
          highRisk: "عالية الخطورة",
          followUp: "متابعة",
        },
        chat: {
          viewReport: "عرض التقرير",
          startConsultation: "بدء استشارة",
          emergencyAlert: "تم اكتشاف مؤشرات حرجة في التوقع الأخير",
          typing: "{{name}} يكتب الآن...",
          aiSuggested: "ردود مقترحة من الذكاء الاصطناعي",
        },
        summary: {
          title: "ملخص المريض",
          currentRisk: "حالة الخطورة الحالية",
          latestIndicators: "أحدث المؤشرات",
          medications: "الأدوية الحالية",
          lastReview: "آخر مراجعة طبية",
          upcomingAppointments: "المواعيد القادمة",
          riskTrend: "اتجاه الخطورة",
          dosage: "الجرعة",
          frequency: "التكرار",
          mealTiming: "توقيت الوجبة",
        },
        loading: "جاري تحميل المحادثات...",
        noConversations: "لم يتم العثور على محادثات",
        id: "رقم",
        activeConsultation: "استشارة نشطة",
        videoCall: "مكالمة فيديو",
        viewIndicators: "عرض المؤشرات",
        startConversation: "ابدأ محادثة مع {{name}}",
        typeMessage: "اكتب رسالة طبية...",
        send: "إرسال",
        selectThread: "اختر محادثة مريض",
        fullRecord: "السجل الكامل",
        recentAssessments: "التقييمات الأخيرة",
        openRecord: "فتح السجل الطبي",
        loadingContext: "جاري تحميل سياق المريض..."
      },
      settings: "الإعدادات",
      help: "المساعدة",
      doctorPortal: "بوابة الطبيب",
    },
    stats: {
      totalPatients: "إجمالي المرضى",
      pendingReviews: "مراجعات معلقة",
      todayAppointments: "مواعيد اليوم",
      totalPredictions: "التحليلات الكلية",
      thisMonth: "هذا الشهر",
      fromYesterday: "منذ الأمس",
    },
    pendingReviews: {
      title: "التحليلات بانتظار المراجعة",
      viewAll: "عرض الكل",
      empty: "لا توجد تحليلات معلقة حالياً.",
      patient: "المريض",
      riskLevel: "مستوى الخطورة",
      date: "التاريخ",
      action: "إجراء",
      reviewBtn: "مراجعة",
    },
    notifications: {
  title: "الإشعارات",
  viewAll: "عرض الكل",
  empty: "لا توجد إشعارات حالياً",
},
    riskChart: {
      title: "توزيع مستويات الخطورة",
      empty: "لا توجد بيانات كافية للرسم البياني",
      patients: "مرضى",
    },
    appointments: {
      title: "جدول المواعيد",
      viewAll: "عرض الكل",
      empty: "لا توجد مواعيد متبقية لليوم.",
      newAppointment: "+ موعد جديد",
      blockTime: "حجز وقت",
      filterToday: "اليوم",
      filterUpcoming: "القادمة",
      filterAll: "الكل",
      patientID: "رقم المريض",
      joinCall: "انضم للمكالمة",
      viewProfile: "عرض الملف",
      reschedule: "إعادة جدولة",
      cancel: "إلغاء",
      statusUpcoming: "قادم",
      statusInProgress: "قيد التنفيذ",
      statusCompleted: "مكتمل",
      searchPlaceholder: "ابحث عن المرضى أو المواعيد...",
    },
    reports: {
      title: "التقارير",
      subtitle: "عرض وإدارة تحليلات الذكاء الاصطناعي وتقارير المرضى",
      stats: {
        total: "إجمالي التقارير",
        pending: "مراجعات معلقة",
        highRisk: "حالات عالية الخطورة",
        followUp: "حالات المتابعة",
        approved: "تقارير معتمدة",
      },
      table: {
        patient: "المريض",
        probability: "احتمالية التوقع",
        riskLevel: "مستوى الخطورة",
        indicators: "المؤشرات الرئيسية",
        status: "حالة مراجعة الذكاء الاصطناعي",
        decision: "قرار الطبيب",
        date: "التاريخ",
        actions: "الإجراءات",
      },
      status: {
        pending: "قيد الانتظار",
        reviewed: "تمت المراجعة",
        needsFollowUp: "بحاجة لمتابعة",
        approved: "معتمد",
        rejected: "مرفوض",
      },
      drawer: {
        reportId: "تقرير رقم {{id}}",
        tabs: {
          prediction: "توقع الذكاء الاصطناعي",
          review: "المراجعة والملاحظات",
          medications: "الأدوية",
          chat: "سجل المحادثات",
        },
        aiExplanation: "شرح توقع الذكاء الاصطناعي",
        doctorNotes: "ملاحظات الطبيب",
        saveReview: "حفظ المراجعة",
        actions: {
          approve: "اعتماد",
          reject: "رفض",
          followUp: "بحاجة لمتابعة",
        }
      },
      empty: "لم يتم العثور على تقارير تطابق فلاترك.",
      searchPlaceholder: "ابحث باسم المريض أو رقمه...",
      monthlySummary: "الملخص الشهري",
      riskAnalysis: "تحليل المخاطر",
      patientDemographics: "البيانات الديموغرافية للمرضى",
      viewAll: "عرض جميع التقارير",
      generateNew: "إنشاء تقرير جديد",
    },
    activity: {
      title: "النشاط الأخير",
      empty: "لا توجد نشاطات حديثة.",
    },
    patients: {
      title: "المرضى",
      addNew: "إضافة مريض جديد",
      viewDetails: "عرض التفاصيل",
      lastVisit: "آخر زيارة",
      condition: "الحالة",
      patientID: "رقم المريض",
      ageGender: "{{age}} • {{gender}}",
      age: "العمر",
      gender: "الجنس",
      male: "ذكر",
      female: "أنثى",
      noPatientsFound: "لم يتم العثور على مرضى يطابقون بحثك.",
      searchPlaceholder: "ابحث بالاسم، الرقم أو البريد...",
    },
    noPatientsFound: "لم يتم العثور على مرضى",
    settings: {
      profileTitle: "إعدادات الملف الشخصي",
      profileDesc: "إدارة ملفك الشخصي المهني ومعلوماتك العامة",
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني",
      bio: "السيرة الذاتية المهنية",
      phone: "رقم الهاتف",
      saveChanges: "حفظ التغييرات",
      notificationTitle: "تفضيلات التنبيهات",
      notificationDesc: "اختر كيف تريد أن يتم إخطارك بنشاط المرضى",
      emailNotifications: "تنبيهات البريد الإلكتروني",
      smsNotifications: "تنبيهات SMS",
      pushNotifications: "التنبيهات الفورية",
      accountTitle: "معلومات الحساب",
      securityTitle: "إعدادات الأمان",
      passwordChange: "تغيير كلمة المرور",
      themeTitle: "المظهر",
      languageTitle: "إعدادات اللغة",
      twoFactor: "المصادقة الثنائية",
      sessions: "الجلسات النشطة"
    },
    help: {
      faqs: "الأسئلة الشائعة",
      faqsDesc: "إجابات سريعة على الأسئلة الشائعة حول المنصة",
      guides: "أدلة النظام",
      guidesDesc: "توثيق مفصل حول كيفية استخدام لوحة التحكم وميزات الذكاء الاصطناعي",
      contact: "الاتصال بالدعم",
      aiExplanation: "شرح توقعات الذكاء الاصطناعي",
      aiExplanationDesc: "تعرف على كيفية حساب نماذج الذكاء الاصطناعي لمستويات مخاطر السكري",
      emergencySupport: "دعم الطوارئ",
      usageTips: "نصائح استخدام لوحة التحكم",
      systemStatus: "حالة النظام"
    }
    
  },
dashboard: {
  title: "لوحة التحكم",
  welcome: "أهلاً بعودتك",
  hello: "يا",
  subtitle: "صحتك، بقوة الذكاء الاصطناعي.",
  mainMenu: "القائمة الرئيسية",
  search: "بحث",
  clearSearch: "مسح البحث",
  newTest: "عمل فحص جديد",
  newCheckup: "فحص جديد",
  recentAnalyses: "التحاليل الحديثة",
  previousReports: "التقارير السابقة",
  bookConsultation: "احجز استشارة",
  settings: "الإعدادات",

  riskIndicators: "مؤشرات الخطورة",
  riskLow: "منخفض",
  riskMedium: "متوسط",
  riskHigh: "مرتفع",
  loading: "جاري تحميل البيانات...",
  fetchError: "لم نتمكن من جلب التحاليل السابقة",
  dataError: "خطأ في جلب البيانات",
  unableToLoadAnalyses: "تعذر تحميل التحليلات",
  noPreviousAnalyses: "لا توجد تحاليل سابقة",
  firstTestNow: "عمل تحليل أول الآن",
  noReportsYet: "لا توجد تقارير سابقة بعد",
  reportCount: "تقرير",

  averageRisk: "متوسط نسبة الخطورة",
  latestStatus: "آخر حالة",
  savedReports: "التقارير المحفوظة",
  lastCheckup: "آخر تحليل",

  analysisOverview: "نظرة عامة على تحاليل السكري و القلب و الأوعية الدموية لديك",
  allReports: "كل التقارير",
  weekly: "أسبوعي",
  monthly: "شهري",
  latestAnalysisScore: "نتيجة آخر تحليل",
  noData: "لا توجد بيانات",
  progress: "التقدم",
  outOf: "من",

  pregnancies: "عدد مرات الحمل",
  glucose: "الجلوكوز",
  bloodPressure: "ضغط الدم",
  skinThickness: "سماكة الجلد",
  insulin: "الإنسولين",
  bmi: "مؤشر كتلة الجسم",
  age: "العمر",
  diabetesPedigree: "العامل الوراثي",

  infectionProbability: "احتمالية الإصابة",
  viewReport: "عرض التقرير",
  date: "التاريخ",
  action: "الإجراءات",

  healthTipText:
    "حافظ على رطوبة جسدك، مارس الرياضة بانتظام، واحصل على قسط كافٍ من النوم لصحة أفضل.",

  lastDoctorContact: "آخر تواصل مع الطبيب",
  lastDoctorContactDesc: "آخر موعد استشارة تم تسجيله",
  doctorCardTitle: "الطبيب المعالج",
  doctorCardText:
    "سيظهر آخر طبيب تم التواصل معه هنا عند توفر بيانات الاستشارة.",
  openConsultations: "افتح الاستشارات",

  logout: "تسجيل الخروج",
  help: "المساعدة",
  logoutError: "فشل تسجيل الخروج",

  last7Days: "آخر 7 أيام",
  last30Days: "آخر 30 يوم",

  riskTooltip: "نسبة الخطورة",
  valueLabel: "القيمة",

  weeklyAverage: "متوسط الأسبوع",
  monthlyAverage: "متوسط الشهر",

  reportsThisWeek: "تقارير هذا الأسبوع",
  reportsThisMonth: "تقارير هذا الشهر",

  highestWeeklyRisk: "أعلى خطورة هذا الأسبوع",
  highestMonthlyRisk: "أعلى خطورة هذا الشهر",

  noWeeklyReportsTitle: "لا توجد تقارير أسبوعية",
  noMonthlyReportsTitle: "لا توجد تقارير شهرية",

  noWeeklyReportsDesc: "لا توجد تحليلات محفوظة خلال آخر 7 أيام.",
  noMonthlyReportsDesc: "لا توجد تحليلات محفوظة خلال آخر 30 يوم.",

  chartShortPregnancies: "الحمل",
  chartShortGlucose: "الجلوكوز",
  chartShortBloodPressure: "الضغط",
  chartShortSkinThickness: "الجلد",
  chartShortInsulin: "الإنسولين",
  chartShortBmi: "BMI",
  chartShortDiabetesPedigree: "الوراثة",
  chartShortAge: "العمر",

  extra: {
      averageRisk: "متوسط نسبة الخطورة",
  latestStatus: "آخر حالة",
    diabetes: "السكري",
    cardiovascular: "القلب والأوعية الدموية",
    cardioShort: "القلب",
weeklyAverage: "المتوسط الأسبوعي",
monthlyAverage: "متوسط التحاليل المعروضة",
highestWeeklyRisk: "أعلى خطورة أسبوعية",
reportsThisWeek: "تقارير هذا الأسبوع",
reportsDisplayedMonths: "التحاليل المعروضة",
highestDisplayedRisk: "أعلى خطورة معروضة",
    diabetesRisk: "خطر السكري",
    cardioRisk: "خطر القلب والأوعية الدموية",
    cardioRiskShort: "خطر القلب",

    latestDiabetesScore: "آخر نتيجة للسكري",
    latestCardioScore: "آخر نتيجة تقديرية للقلب والأوعية الدموية",

    weeklyRiskTrend: "تحليل المخاطر الأسبوعي",
    monthlyRiskTrend: "تحليل المخاطر الشهري",
    weeklyRiskTrendDesc: "يعرض آخر 7 أيام وتحت كل يوم متوسط نسبة التحليل",
    monthlyRiskTrendDesc: "يعرض الشهر الحالي والشهور القادمة",

    reportsDisplayedMonths: "التقارير خلال الشهور المعروضة",
    highestDisplayedRisk: "أعلى خطورة في الشهور المعروضة",

    analysisInputs: "مدخلات التحليل",
    analysisInputsDesc:
      "القيم المستخدمة في تحليل السكري والقلب والأوعية الدموية",

    riskDistribution: "حالات الخطورة",
    riskDistributionDesc: "تشمل السكري والقلب والأوعية الدموية",

    analysisAverage: "متوسط التحليل",
    reports: "التقارير",

    riskLevels: {
      low: "منخفض",
      medium: "متوسط",
      high: "عالي",
      veryHigh: "عالي جدًا",
    },

    inputs: {
      pregnancies: "الحمل",
      glucose: "الجلوكوز",
      systolic: "انقباضي",
      diastolic: "انبساطي",
      skinThickness: "سُمك الجلد",
      insulin: "الأنسولين",
      pedigree: "الوراثة",
      age: "العمر",
      weight: "الوزن",
      height: "الطول",
      cholesterol: "كوليسترول",
    },

    aria: {
      toggleLanguage: "تغيير اللغة",
      notifications: "الإشعارات",
    },
  },

  cardioMessages: {
    very_high:
      "يشير الحساب التقديري إلى وجود خطورة عالية جدًا للإصابة بأمراض القلب والأوعية الدموية بناءً على المؤشرات السريرية المتاحة.",
    high:
      "يشير الحساب التقديري إلى وجود خطورة عالية للإصابة بأمراض القلب والأوعية الدموية بناءً على المؤشرات السريرية المتاحة.",
    medium:
      "يشير الحساب التقديري إلى وجود خطورة متوسطة للإصابة بأمراض القلب والأوعية الدموية بناءً على المؤشرات السريرية المتاحة.",
    low:
      "يشير الحساب التقديري إلى وجود خطورة منخفضة للإصابة بأمراض القلب والأوعية الدموية بناءً على المؤشرات السريرية المتاحة.",
  },
},
report: {
  title: "تقرير التحليل المبدئي",

  diabetesRisk: "خطر السكري",
  remaining: "المتبقي",
  diabetesRiskProbability: "احتمالية خطر الإصابة بالسكري",
  riskLevelLabel: "مستوى الخطورة",

  preliminaryResult: "نتيجة مبدئية",
  personalizedRecommendations: "توصيات مخصصة",
  newAnalysis: "تحليل جديد",
  downloadPdf: "تنزيل التقرير PDF",

  noResultTitle: "لا توجد نتيجة تحليل",
  noResultDescription: "يرجى إجراء التحليل من صفحة التشخيص أولاً...",
  backToDiagnosis: "العودة إلى التشخيص",

  pdfError: "فشل إنشاء ملف PDF. راجع وحدة التحكم لمعرفة التفاصيل.",

  pdf: {
    title: "تقرير تحليل خطر السكري",
    analysisDate: "تاريخ التحليل",
    parameter: "المؤشر",
    value: "القيمة",
  },

  fields: {
    pregnancies: "عدد مرات الحمل",
    glucose: "الجلوكوز (mg/dL)",
    bloodPressure: "ضغط الدم (mmHg)",
    skinThickness: "سماكة الجلد (mm)",
    insulin: "الإنسولين (mu U/ml)",
    bmi: "مؤشر كتلة الجسم",
    diabetesPedigreeFunction: "العامل الوراثي للسكري",
    age: "العمر (بالسنوات)",
  },

  resultMessages: {
    high:
      "احتمالية الإصابة: {{probability}}% - مستوى المخاطر: مرتفع. قد تشمل عوامل الخطر ارتفاع الجلوكوز، السمنة، العامل الوراثي، أو مقاومة الإنسولين. يُنصح بمراجعة طبيب وإجراء فحوصات إضافية.",
    mediumHigh:
      "احتمالية الإصابة: {{probability}}% - مستوى المخاطر: مرتفع. قد تشمل عوامل الخطر مقدمات السكري، السمنة، العامل الوراثي، أو مقاومة الإنسولين. يُنصح بمراجعة طبيب وإجراء فحوصات إضافية.",
    moderate:
      "احتمالية الإصابة: {{probability}}% - مستوى المخاطر: متوسط. توجد بعض مؤشرات الخطورة، ويُنصح بمتابعة العادات الصحية ومراجعة الطبيب عند الحاجة.",
    low:
      "احتمالية الإصابة: {{probability}}% - مستوى المخاطر: منخفض. يُنصح بالاستمرار في نمط حياة صحي والمتابعة الدورية.",
  },

  recommendations: {
    high: {
      1: "استشر طبيب غدد صماء في أقرب وقت لإجراء فحوصات إضافية.",
      2: "قلل السكريات والكربوهيدرات المكررة قدر الإمكان.",
      3: "ابدأ نشاطًا بدنيًا يوميًا بدرجة خفيفة إلى متوسطة.",
      4: "تابع مستوى السكر في الدم بانتظام.",
    },
    mediumHigh: {
      1: "يفضل مراجعة الطبيب في أقرب وقت ممكن.",
      2: "اتبع نظامًا غذائيًا منخفض الكربوهيدرات.",
      3: "مارس الرياضة لمدة لا تقل عن 150 دقيقة أسبوعيًا.",
      4: "حافظ على وزن صحي ومستقر.",
    },
    moderate: {
      1: "حافظ على نمط حياة متوازن وصحي.",
      2: "تجنب الإفراط في تناول السكريات.",
      3: "مارس الرياضة بانتظام.",
      4: "قم بمتابعة دورية كل 6 إلى 12 شهرًا.",
    },
    low: {
      1: "استمر في نمط حياتك الصحي الحالي.",
      2: "احرص على تناول الخضروات والفواكه ومصادر البروتين الجيدة.",
      3: "مارس نشاطًا بدنيًا يوميًا.",
      4: "قم بإجراء فحص دوري كل سنة إلى سنتين.",
    },
  },
},
  editProfile: {
    title: "تعديل الملف الشخصي",
    defaultName: "المستخدم",
    profileImageAlt: "الصورة الشخصية",
    changePhoto: "تغيير الصورة",
    removePhoto: "إزالة الصورة",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    email: "البريد الإلكتروني",
    editPassword: "تعديل كلمة المرور",
    phone: "رقم الهاتف",
    saveChanges: "حفظ التغييرات",
    saving: "جاري الحفظ...",
    forgotPassword: "هل نسيت كلمة المرور؟",
    placeholders: {
      firstName: "أدخل الاسم الأول",
      lastName: "أدخل اسم العائلة",
      email: "أدخل البريد الإلكتروني",
      phone: "أدخل رقم الهاتف"
    },
    toasts: {
      invalidImage: "يرجى اختيار ملف صورة صالح",
      imageTooLarge: "حجم الصورة يجب ألا يتجاوز 5 ميجابايت",
      pictureDeleted: "تم حذف الصورة الشخصية بنجاح",
      deleteFailed: "فشل حذف الصورة الشخصية",
      updateFailed: "فشل تحديث الملف الشخصي",
      updateSuccess: "تم تحديث الملف الشخصي بنجاح",
      unexpectedError: "حدث خطأ غير متوقع"
    }
  },

  forgotPassword: {
    title: "نسيت كلمة المرور؟",
    subtitle:
      "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.",
    backToLogin: "العودة إلى تسجيل الدخول",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "example@email.com",
    submit: "إرسال رابط إعادة التعيين",
    sending: "جارٍ الإرسال...",
    sentTitle: "تم الإرسال بنجاح!",
    sentSubtitle:
      "تحقق من بريدك الإلكتروني واضغط على الرابط لإعادة تعيين كلمة المرور.",
    successToast:
      "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
    errors: {
      sendFailed: "فشل إرسال البريد الإلكتروني.",
      unexpected: "حدث خطأ أثناء إرسال البريد. يرجى المحاولة مرة أخرى."
    }
  },

  reports: "التقارير",
  consultations: "الاستشارات",
  helpNav: "المساعدة",

  help: {
    title: "مركز المساعدة",
    subtitle:
      "اعثر على إجابات سريعة للأسئلة الشائعة أو تواصل مع فريق الدعم.",
    searchPlaceholder: "ابحث عن سؤالك هنا...",
    faqs: {
      aiDiagnosis: {
        question: "هل تشخيص الذكاء الاصطناعي بديل عن الطبيب؟",
        answer:
          "لا، HealthCare أداة ذكية تساعد في تقديم مؤشرات أولية ومعلومات مبدئية بناءً على الأعراض، لكنه لا يغني عن استشارة الطبيب."
      },
      dataSecurity: {
        question: "ما مدى أمان بياناتي الطبية؟",
        answer:
          "خصوصيتك وأمان بياناتك من أولوياتنا، ويتم التعامل مع معلوماتك بأعلى معايير الحماية."
      },
      resetPassword: {
        question: "كيف يمكنني إعادة تعيين كلمة المرور؟",
        answer:
          "يمكنك إعادة تعيين كلمة المرور من خلال الضغط على خيار نسيت كلمة المرور واتباع التعليمات."
      },
      downloadReports: {
        question: "هل يمكنني تحميل التقارير؟",
        answer: "نعم، يمكنك تحميل تقاريرك الصحية بصيغة PDF بسهولة."
      }
    },
    contact: {
      title: "ما زالت لديك أسئلة؟",
      subtitle: "فريقنا هنا لمساعدتك.",
      emailTitle: "الدعم عبر البريد الإلكتروني",
      emailDescription: "احصل على رد مفصل خلال 24 ساعة."
    },
    importantPages: "صفحات مهمة",
    links: {
      privacy: "سياسة الخصوصية",
      terms: "شروط الخدمة",
      contact: "اتصل بنا"
    }
  },

  chatBot: {
    title: "المساعد الطبي الذكي",
    connectedToLastPrediction: "متصل بتحليلك الأخير",
    generalMode: "وضع عام",

    welcomeInitial: "أهلاً بك، أنا مساعدك الطبي الذكي.",
    welcomeFollowUp:
      "يمكنني مساعدتك في الإجابة عن استفساراتك المتعلقة بصحتك العامة والسكري.",

    floatingMessage1: "أهلاً بك، أنا مساعدك الطبي الذكي.",
    floatingMessage2:
      "يمكنني مساعدتك في الإجابة عن استفساراتك المتعلقة بصحتك العامة والسكري.",

    typing: "جاري الكتابة...",
    inputPlaceholder: "اكتب سؤالك هنا...",
    disclaimer: "هذا مساعد ذكي ولا يغني عن استشارة طبيب متخصص",
    fallbackError:
      "عذراً، هناك مشكلة تقنية حالياً. يرجى المحاولة لاحقاً أو استشارة طبيب.",
    temporarilyDisabled: "(Chatbot معطل مؤقتاً)",
    unavailableToast: "Chatbot غير متاح حالياً",
    openAriaLabel: "فتح المساعد",
    minimizeAriaLabel: "تصغير الشات",
    closeAriaLabel: "إغلاق الشات",
    closeHintAriaLabel: "إغلاق الرسالة",
    fallbackResponses: {
      why: "النسبة بتتعتمد على عوامل كتير زي الجلوكوز، BMI، العمر، والعامل الوراثي.",
      how: "من خلال تحليل البيانات الطبية بتاعتك ومقارنتها بآلاف الحالات المشابهة.",
      serious:
        "مستوى الخطر بيتحدد بناءً على النسبة. لو النسبة فوق 50% ينصح بمراجعة طبيب.",
      treatment: "الخطوات الأساسية: نظام غذائي صحي، رياضة منتظمة، ومتابعة مع طبيب."
    },
    sendAriaLabel: "إرسال الرسالة"
  },

  faqs: "الأسئلة الشائعة",
  contact: "تواصل معنا",
  login: "تسجيل الدخول",
  getStarted: "ابدأ الآن",
  settings: "الإعدادات",
  logout: "تسجيل الخروج",
  myAccount: "حسابي",
  contactUs: "تواصل معنا",
  sendMessage: "إرسال رسالة",
  name: "الاسم",
  email: "البريد الإلكتروني",
  subject: "الموضوع",
  message: "الرسالة",

  footer: {
    privacy: "سياسة الخصوصية",
    terms: "شروط الخدمة",
    contact: "دعم العملاء",
    copyright: "© 2026 HealthCare. جميع الحقوق محفوظة."
  },

  landing: {
    heroTitle: "تشخيص طبي مدعوم بالذكاء الاصطناعي بين يديك",
    heroSubtitle:
      "احصل على رؤى صحية سريعة ودقيقة وسرية من خلال أداة التشخيص الذكية الخاصة بنا.",
    startCheckup: "ابدأ الفحص الآن",
    scrollNext: "انتقل إلى القسم التالي",
doctorHeroTitle: "بوابة طبية متكاملة لمتابعة المرضى ومراجعة التحليلات",
doctorHeroSubtitle:
  "راجع تحليلات المرضى، تابع مستويات الخطورة، ونظّم المواعيد والتقارير من خلال لوحة طبيب واضحة وآمنة تساعدك على إدارة المتابعة الطبية بكفاءة.",
goToDoctorDashboard: "الذهاب إلى لوحة الطبيب",

    howItWorksTitle: "كيف يعمل",
    howItWorksSubtitle:
      "عملية بسيطة من ثلاث خطوات للحصول على تقريرك الصحي المخصص.",
    step1Title: "1. أدخل الأعراض",
    step1Desc:
      "قم بوصف الأعراض بالتفصيل باستخدام واجهتنا السهلة والبديهية.",
    step2Title: "2. تحليل الذكاء الاصطناعي",
    step2Desc:
      "يقوم الذكاء الاصطناعي بتحليل مدخلاتك باستخدام خوارزميات متقدمة وبيانات طبية.",
    step3Title: "3. تقرير مخصص",
    step3Desc:
      "استلم تقريرًا شاملًا يتضمن الرؤى والتوصيات المناسبة.",

    benefitsTitle: "المميزات الرئيسية",
    benefitsSubtitle:
      "اختبر قوة الذكاء الاصطناعي في الرعاية الصحية من خلال ميزاتنا المتقدمة.",
    benefit1Title: "نتائج سريعة ودقيقة",
    benefit1Desc: "احصل على النتائج خلال دقائق بدقة عالية.",
    benefit2Title: "بيانات آمنة وسرية",
    benefit2Desc: "بياناتك مشفرة وتبقى خاصة وآمنة.",
    benefit3Title: "واجهة سهلة الاستخدام",
    benefit3Desc: "تصميم بسيط وسهل لجميع المستخدمين.",
    benefit4Title: "يدعم حالات متعددة",
    benefit4Desc: "تشخيص مجموعة واسعة من المشكلات الصحية.",
    benefit5Title: "متاح 24/7",
    benefit5Desc: "استخدم الخدمة في أي وقت ومن أي مكان.",
    benefit6Title: "مراجع من الأطباء",
    benefit6Desc: "المعلومات تتم مراجعتها من قبل مختصين.",

    testimonialsTitle: "ماذا يقول مستخدمونا",
    testimonialsSubtitle: "قصص حقيقية من مرضى وأطباء يثقون في HealthCare.",
    testimonial1Text:
      '"لقد أحدث HealthCare ثورة في ممارستي الطبية. فهو يقدم رؤى سريعة وموثوقة، مما يجعل التشخيص أسرع لمرضاي."',
    testimonial1Name: "د. سام كارتر",
    testimonial1Role: "طبيب عام",
    testimonial2Text:
      '"أذهلتني دقة التشخيص وسرعته. لقد منحني راحة نفسية وساعدني على فهم حالتي الصحية بشكل أفضل."',
    testimonial2Name: "مارك طومسون",
    testimonial2Role: "مريض",

    ctaTitle: "تحكم في صحتك من اليوم.",
    ctaSubtitle:
      "انضم إلى آلاف المستخدمين الذين يتخذون قرارات صحية أذكى بمساعدة الذكاء الاصطناعي.",
    ctaButton: "ابدأ التشخيص الآن"
  },

  contactPage: {
    pageTitle: "تواصل معنا",
    pageSubtitle: "نحن هنا لمساعدتك. لا تتردد في التواصل معنا.",
    formTitle: "أرسل لنا رسالة",
    formDescription: "املأ النموذج وسنتواصل معك في أقرب وقت.",
    name: "الاسم",
    email: "البريد الإلكتروني",
    subject: "الموضوع",
    message: "الرسالة",
    namePlaceholder: "أحمد محمد",
    emailPlaceholder: "example@email.com",
    subjectPlaceholder: "استفسار عام",
    messagePlaceholder: "اكتب رسالتك هنا...",
    requiredFields: "يرجى ملء جميع الحقول المطلوبة",
    invalidEmail: "يرجى إدخال بريد إلكتروني صحيح.",
    successMessage: "تم إرسال رسالتك بنجاح! سنتواصل معك قريباً",
    failedMessage: "فشل إرسال الرسالة، حاول مرة أخرى",
    sending: "جاري الإرسال...",
    sendMessage: "إرسال الرسالة",
    replyTime: "نرد عادةً خلال 24 ساعة عمل",
    emailTitle: "البريد الإلكتروني",
    phoneTitle: "الهاتف",
    addressTitle: "العنوان",
    addressValue: "القاهرة، مصر",
    faqTitle: "هل تبحث عن إجابة سريعة؟",
    faqDescription: "تصفح مركز المساعدة، قد تجد إجابتك هناك.",
    faqLink: "الذهاب لمركز المساعدة",
    support247: "الدعم عبر البريد الإلكتروني متاح 24/7",
    emergencyTitle: "حالة طوارئ طبية؟",
    emergencyText:
      "إذا كانت لديك حالة طوارئ طبية، لا تنتظر واتصل بالإسعاف فوراً",
    emergencyCall: "123 (الإسعاف في مصر)",
    locationTitle: "موقعنا",
    locationDescription: "زُرنا في مكتبنا",
    openMap: "فتح الخريطة",
    mapText: "افتح الموقع على خرائط جوجل",
    egypt: "مصر"
  },
  authPage: {
    secureAccess: "الدخول الآمن",
    loginSubtitle: "سجل الدخول إلى حسابك",
    signupSubtitle: "أنشئ حساب جديد",
    loginTab: "تسجيل الدخول",
    signupTab: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
     orContinueWith: "أو تسجيل الدخول باستخدام",
  forgotPassword: "هل نسيت كلمة المرور؟",
    processing: "جاري المعالجة...",
    loginButton: "تسجيل الدخول",
    signupButton: "إنشاء الحساب",
    noAccount: "لا تملك حساباً؟",
    createNow: "أنشئ واحداً الآن",
    haveAccount: "لديك فعلاً حساب؟",
    loginNow: "سجل دخول الآن",
    firstName: "الاسم الأول",
    firstNamePlaceholder: "أحمد",
    lastName: "الاسم الأخير",
    lastNamePlaceholder: "محمد",
    confirmPassword: "تأكيد كلمة المرور",
    passwordHint: "حرف كبير، حرف صغير، رقم، 8+ أحرف",
    loginSuccess: "تم تسجيل الدخول بنجاح!",
    loginFailed: "فشل تسجيل الدخول",
    signupSuccess: "تم إنشاء الحساب بنجاح!",
    signupFailed: "فشل إنشاء الحساب",
    securityNotice:
      "بيانات آمنة: نستخدم التشفير لحماية بيانات تسجيل الدخول الخاصة بك",
    footerNote:
      "هذا الموقع يستخدم الذكاء الاصطناعي للكشف المبكر عن مرض السكري",
    validation: {
      invalidEmail: "البريد الإلكتروني غير صحيح",
      emailRequired: "البريد الإلكتروني مطلوب",
      passwordRequired: "كلمة المرور مطلوبة",
      firstNameMin: "الاسم الأول يجب أن يكون حرفين على الأقل",
      lastNameMin: "الاسم الأخير يجب أن يكون حرفين على الأقل",
      passwordMin: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
      passwordUpper: "يجب أن تحتوي على حرف كبير",
      passwordLower: "يجب أن تحتوي على حرف صغير",
      passwordNumber: "يجب أن تحتوي على رقم",
      confirmPasswordRequired: "تأكيد كلمة المرور مطلوب",
      passwordsMismatch: "كلمات المرور غير متطابقة"
    }
  },

  pastReportsPage: {
    noReportsToast: "لا توجد تقارير سابقة",
    fetchError: "لم نتمكن من جلب التقارير السابقة",
    dataError: "خطأ في جلب البيانات",
    mustLogin: "يجب عليك تسجيل الدخول أولاً لعرض التقارير السابقة",
    title: "التقارير السابقة",
    subtitle: "عرض جميع تحاليل السكري السابقة التي أجريتها",
    newTest: "عمل فحص جديد",
    loading: "جاري تحميل التقارير...",
    emptyTitle: "لا توجد تقارير سابقة",
    emptySubtitle: "قم بإجراء أول تحليل السكري لديك الآن",
    startAnalysis: "ابدأ التحليل",
    totalReports: "إجمالي التقارير",
    latestTest: "أحدث فحص",
    riskLevel: "مستوى الخطورة",
    average: "المتوسط",
    infectionProbability: "احتمالية الإصابة",
    date: "التاريخ",
    viewReport: "عرض التقرير",
    pregnancies: "عدد الحمل",
    glucose: "الجلوكوز",
    bloodPressure: "ضغط الدم",
    bmi: "مؤشر كتلة الجسم",
    riskLow: "منخفض",
    riskMedium: "متوسط",
    riskHigh: "مرتفع",
    riskVeryHigh: "مرتفع جدًا",
    unknownRisk: "غير معروف",
    reportId: "رقم التقرير"
  },

  consultationsPage: {
  title: "احجز استشارة أونلاين",
  subtitle:
    "تواصل مع أطباء معتمدين للحصول على إرشاد متخصص بعد تقريرك الصحي بالذكاء الاصطناعي.",
  illustrationText: "رسم توضيحي لاستشارة طبيب",
  bookingSection: "قسم الحجز",
  specialization: "تخصص الطبيب",
  timeSlots: "الأوقات المتاحة",
  confirm: "تأكيد الحجز",
  upcoming: "المواعيد القادمة",
  joinCall: "انضم للمكالمة",
  upcomingStatus: "قادم",
  cancelledStatus: "ملغي",
  reschedule: "إعادة جدولة",
  cancel: "إلغاء",
  rescheduleTitle: "إعادة جدولة الموعد",
  newDate: "تاريخ جديد",
  newTime: "وقت جديد",
  selectNewTime: "اختر الوقت الجديد",
  save: "حفظ التغييرات",
  selectRequired: "يرجى اختيار جميع الحقول المطلوبة",
  selectValidSpecialization: "يرجى اختيار تخصص صحيح",
  slotBooked: "هذا الموعد محجوز بالفعل",
  confirmed: "تم تأكيد الحجز!",
  selectNewDateTime: "يرجى اختيار التاريخ والوقت الجديدين",
  newSlotBooked: "الموعد الجديد محجوز بالفعل",

  joinToast: "جارٍ الانضمام إلى استشارة {{doctor}}...",
  rescheduleSuccess: "تمت إعادة جدولة موعد {{doctor}} بنجاح",
  cancelToast: "تم إلغاء موعد {{doctor}}",

  generalPractitioner: "طبيب عام",
  cardiologist: "طبيب قلب",
  dermatologist: "طبيب جلدية",
  neurologist: "طبيب أعصاب",

  time1000: "10:00 ص",
  time1100: "11:00 ص",
  time1400: "2:00 م",
  time1500: "3:00 م",
  time1600: "4:00 م",

  doctors: {
    general: {
      name: "د. إميلي كارتر",
      specialty: "طبيب عام"
    },
    cardio: {
      name: "د. ديفيد لي",
      specialty: "طبيب قلب"
    },
    derma: {
      name: "د. صوفيا رودريغيز",
      specialty: "طبيب جلدية"
    },
    neuro: {
      name: "د. مايكل آدامز",
      specialty: "طبيب أعصاب"
    }
  }
},
  diagnosisWizard: {
    backHome: "العودة إلى الرئيسية",
    pageTitle: "الكشف المبكر عن مخاطر الإصابة بالسكري وأمراض القلب والأوعية الدموية",
    pageSubtitle:
      "أدخل بياناتك الطبية الأساسية للحصول على تقييم أولي خلال ثوانٍ.",

    section1: "البيانات الأساسية",
    section2: "المؤشرات الحيوية",
    section3: "عوامل الخطورة",

    section1Desc: "معلومات شخصية أساسية تدخل في حساب النتيجة.",
    section2Desc: "القياسات الطبية المرتبطة بخطر الإصابة.",
    section3Desc: "العوامل الوراثية التي تؤثر على دقة التقييم.",

    howItWorks: "كيف يعمل التحليل؟",
    howItWorksDesc:
      "املأ البيانات في 3 خطوات، ثم احصل على النتيجة والتقرير فورًا.",

    tip1: "أدخل القيم بدقة",
    tip2: "يمكن ترك الإنسولين = 0 إذا لم يُقاس",
    tip3: "التقرير يظهر مباشرة بعد الحساب",

    pregnancies: "عدد مرات الحمل",
    pregnanciesDesc: "أدخل 0 إذا لم يكن هناك حمل",
    pregnanciesPlaceholder: "مثال: 0",

    glucose: "مستوى الجلوكوز (mg/dL)",
    glucoseDesc: "عادةً 70-140 بعد الصيام",
    glucosePlaceholder: "مثال: 85",

    bloodPressure: "ضغط الدم (mmHg)",
    bloodPressureDesc: "الضغط الانقباضي",
    bloodPressurePlaceholder: "مثال: 70",

    skinThickness: "سماكة الجلد (mm)",
    skinThicknessDesc: "سمك الدهون تحت الجلد",
    skinThicknessPlaceholder: "مثال: 20",

    insulin: "مستوى الإنسولين (mu U/ml)",
    insulinDesc: "0 إذا لم يُقاس",
    insulinPlaceholder: "مثال: 0",

    bmi: "مؤشر كتلة الجسم (BMI)",
    bmiDesc: "الوزن بالكيلو ÷ (الطول بالمتر)²",
    bmiPlaceholder: "مثال: 25.0",

    pedigree: "وظيفة نسبة السكري (Pedigree)",
    pedigreeDesc: "عامل وراثي (0.078–2.42)",
    pedigreePlaceholder: "مثال: 0.5",

    age: "العمر (سنوات)",
    ageDesc: "من 21 إلى 81 سنة",
    agePlaceholder: "مثال: 35",

    next: "التالي",
    previous: "السابق",
    submit: "احسب احتمالية الإصابة",
    loading: "جاري الحساب...",

    footer: "هذا تقييم أولي فقط، لا يُغني عن استشارة طبيب متخصص.",
    success: " تم التحليل بنجاح!",
    error: "حدث خطأ: ",

    validation: {
      pregnanciesMin: "يجب أن يكون 0 أو أكثر",
      pregnanciesMax: "الحد الأقصى 20",

      glucoseMin: "يجب أن يكون 0 أو أكثر",
      glucoseMax: "الحد الأقصى 200 mg/dL",

      bloodPressureMin: "يجب أن يكون 0 أو أكثر",
      bloodPressureMax: "الحد الأقصى 155 mmHg",

      skinThicknessMin: "يجب أن يكون 0 أو أكثر",
      skinThicknessMax: "الحد الأقصى 99 mm",

      insulinMin: "يجب أن يكون 0 أو أكثر",
      insulinMax: "الحد الأقصى 846 mu U/ml",

      bmiMin: "يجب أن يكون 0 أو أكثر",
      bmiMax: "الحد الأقصى 67.1",

      pedigreeMin: "يجب أن يكون 0.078 أو أكثر",
      pedigreeMax: "الحد الأقصى 2.42",

      ageMin: "يجب أن يكون 21 أو أكثر",
      ageMax: "الحد الأقصى 81 سنة"
    }
  },

 terms: {
  badge: "الشروط والأحكام",
  title: "شروط الخدمة",
  subtitle:
    "يرجى قراءة هذه الشروط بعناية قبل استخدام منصة HealthCare. استمرارك في استخدام المنصة يعني موافقتك على هذه الشروط والأحكام.",
  lastUpdatedLabel: "آخر تحديث:",
  contents: "محتويات الصفحة",
  sectionLabel: "القسم",
  notice: {
    title: "تنبيه هام",
    description:
      "باستخدامك لـ HealthCare، فإنك توافق على هذه الشروط. إذا لم توافق، يرجى عدم استخدام المنصة."
  },
  sections: {
    acceptance: {
      title: "قبول الشروط",
      intro: "باستخدامك لمنصة HealthCare، فإنك:",
      items: [
        "توافق على الالتزام بهذه الشروط والأحكام",
        "تقر بأنك قرأت وفهمت سياسة الخصوصية",
        "تلتزم باستخدام المنصة للأغراض المخصصة لها فقط",
        "تقر بأنك مسؤول عن دقة المعلومات التي تقدمها"
      ]
    },
    serviceDescription: {
      title: "وصف الخدمة",
      intro: "HealthCare تقدم الخدمات التالية:",
      items: [
        "تحليل خطر الإصابة بالسكري بناءً على بياناتك الصحية",
        "مساعد طبي ذكي للإجابة على أسئلتك الصحية",
        "حفظ سجل تحاليلك السابقة للرجوع إليه",
        "توصيات صحية عامة"
      ],
      note:
        "ملاحظة: هذه الخدمات لأغراض إعلامية وتعليمية فقط وليست بديلاً عن الاستشارة الطبية."
    },
    medicalDisclaimer: {
      title: "إخلاء المسؤولية الطبية",
      warning: "HealthCare لا يقدم تشخيصاً طبياً أو علاجاً!",
      items: [
        "التحليلات المقدمة هي تقديرات إحصائية فقط",
        "لا تعتمد على النتائج لاتخاذ قرارات علاجية دون استشارة طبيب",
        "المنصة لا تتحمل مسؤولية أي ضرر ناتج عن استخدام المعلومات",
        "يجب استشارة طبيب متخصص لأي مشكلة صحية",
        "في حالة الطوارئ الطبية، اتصل بالإسعاف فوراً (123 في مصر)"
      ]
    },
    userObligations: {
      title: "واجباتك كمستخدم",
      intro: "عند استخدامك للمنصة، تلتزم بـ:",
      items: [
        "تقديم معلومات دقيقة وصحيحة",
        "عدم استخدام المنصة لأغراض غير قانونية",
        "عدم محاولة اختراق أو العبث بالمنصة",
        "عدم انتحال شخصية أخرى",
        "عدم استخدام المنصة لنشر معلومات مضللة",
        "الحفاظ على سرية بيانات حسابك"
      ]
    },
    intellectualProperty: {
      title: "الملكية الفكرية",
      intro: "جميع محتويات المنصة محمية بحقوق الملكية الفكرية:",
      items: [
        "الشعارات والأسماء التجارية مملوكة لـ HealthCare",
        "المحتوى الطبي محمي بحقوق النشر",
        "الخوارزميات والنماذج مملوكة للمنصة",
        "لا يجوز نسخ أو توزيع المحتوى دون إذن"
      ]
    },
    serviceModification: {
      title: "تعديل الخدمة",
      intro: "نحتفظ بالحق في:",
      items: [
        "تعديل أو إيقاف الخدمة جزئياً أو كلياً",
        "تغيير الميزات المتاحة",
        "تحديث النماذج الطبية المستخدمة",
        "تعديل هذه الشروط في أي وقت"
      ],
      footnote:
        "سنحاول إخطارك بالتغييرات المهمة مسبقاً عندما يكون ذلك ممكناً."
    },
    accountTermination: {
      title: "إنهاء الحساب",
      intro: "قد نعلق أو ننهي حسابك في الحالات التالية:",
      items: [
        "انتهاك هذه الشروط والأحكام",
        "استخدام غير قانوني للمنصة",
        "طلبك حذف حسابك",
        "توقف الخدمة نهائياً"
      ]
    },
    governingLaw: {
      title: "القانون الواجب التطبيق",
      intro: "تخضع هذه الشروط لـ:",
      items: [
        "قوانين جمهورية مصر العربية",
        "أي نزاع يُحل في المحاكم المختصة",
        "في حالة تعارض أي بند مع القانون، يُعتبر البند باطلاً والباقي ساري"
      ]
    }
  },
  contact: {
    title: "لديك أسئلة؟",
    description:
      "إذا كان لديك أي أسئلة حول شروط الخدمة، يرجى التواصل معنا."
  }
},
privacy: {
  title: "سياسة الخصوصية",
  subtitle:
    "يرجى مراجعة كيفية جمع HealthCare لبياناتك واستخدامها وتخزينها وحمايتها عند استخدام المنصة.",
  lastUpdatedLabel: "آخر تحديث:",
  sectionLabel: "القسم",
  sections: {
    collectedInformation: {
      title: "المعلومات التي نجمعها",
      intro: "نجمع المعلومات التالية لتقديم خدماتنا لك:",
      items: [
        "المعلومات الشخصية: الاسم، البريد الإلكتروني، العمر",
        "البيانات الطبية: نتائج التحاليل والقياسات الصحية مثل الجلوكوز وضغط الدم وBMI",
        "بيانات الاستخدام: كيفية استخدامك للمنصة",
        "سجل المحادثات: الأسئلة التي تطرحها على المساعد الطبي الذكي"
      ]
    },
    howWeUseInformation: {
      title: "كيف نستخدم معلوماتك",
      intro: "نستخدم معلوماتك للأغراض التالية:",
      items: [
        "تقديم تحليلات صحية دقيقة ومخصصة",
        "تحسين جودة الخدمة وأدائها",
        "تمكين المساعد الطبي الذكي من الرد على أسئلتك",
        "حفظ سجل تحاليلك السابقة للرجوع إليه",
        "إرسال تنبيهات صحية مهمة إذا اخترت استلامها"
      ]
    },
    dataProtection: {
      title: "حماية بياناتك",
      intro: "نتخذ إجراءات أمنية صارمة لحماية بياناتك:",
      items: [
        "تشفير البيانات الطبية الحساسة",
        "تخزين البيانات على خوادم آمنة",
        "قصر الوصول على الأشخاص المصرح لهم فقط",
        "إجراء نسخ احتياطي دوري للبيانات",
        "مراجعة مستمرة لإجراءات الأمان"
      ]
    },
    informationSharing: {
      title: "مشاركة المعلومات",
      strong: "نحن لا نبيع أو نؤجر معلوماتك الشخصية لأي طرف ثالث.",
      intro: "قد نشارك معلوماتك فقط في الحالات التالية:",
      items: [
        "بموافقتك الصريحة",
        "مع مقدمي الخدمات الذين يعملون نيابة عنا مع التزامهم بالسرية",
        "إذا تطلب القانون أو أمر قضائي ذلك",
        "لحماية سلامتك أو سلامة الآخرين"
      ]
    },
    yourRights: {
      title: "حقوقك",
      intro: "لديك الحقوق التالية فيما يتعلق ببياناتك:",
      items: [
        "الوصول إلى بياناتك الشخصية",
        "تصحيح المعلومات غير الدقيقة",
        "حذف حسابك وبياناتك مع ملاحظة أن ذلك قد يؤثر على الخدمة",
        "تصدير بياناتك في صيغة قابلة للقراءة",
        "سحب الموافقة على معالجة البيانات"
      ]
    },
    medicalDisclaimer: {
      title: "إخلاء المسؤولية الطبية",
      strong:
        "هام: HealthCare أداة مساعدة ولا يغني عن الاستشارة الطبية المهنية.",
      items: [
        "المعلومات المقدمة لأغراض إعلامية فقط",
        "ولا تُعد تشخيصًا طبيًا نهائيًا",
        "يجب استشارة طبيب متخصص للتشخيص والعلاج",
        "لا تتجاهل نصيحة الطبيب بسبب معلومات حصلت عليها من المنصة"
      ]
    },
    policyChanges: {
      title: "التغييرات على سياسة الخصوصية",
      intro:
        "قد نحدّث سياسة الخصوصية من وقت لآخر، وقد نخطرك بالتغييرات المهمة عبر:",
      items: [
        "نشر النسخة المحدثة على المنصة",
        "إرسال بريد إلكتروني إذا كانت التغييرات جوهرية",
        "تحديث تاريخ «آخر تحديث» أعلى الصفحة"
      ]
    }
  },
  contact: {
    title: "لديك أسئلة؟",
    description:
      "إذا كان لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا."
  }
}
};

export default ar;