const en = {
  home: "Home",

  doctorDashboard: {
    welcome: "Welcome",
    subtitle: "Overview of your patients and their analyses",
    status: {
      operational: "Systems Operational",
    },
    searchPlaceholder: "Search for a patient...",
    sidebar: {
      title: "Doctor Portal",
      overview: "Overview",
      patients: "Patients",
      doctor: "Doctor",
home: "Home",
profile: "Profile",
logout: "Logout",
specialistDoctor: "Specialist Doctor",
recentActivity: "Recent Activity",
openSidebar: "Open Sidebar",
collapseSidebar: "Collapse Sidebar",
      dashboard: "Dashboard",
      appointments: "Appointments",
      reports: "Reports",
      messages: {
        title: "Messaging",
        searchPlaceholder: "Search conversations...",
        filters: {
          all: "All",
          unread: "Unread",
          highRisk: "High Risk",
          followUp: "Follow-up",
        },
        chat: {
          viewReport: "View Report",
          startConsultation: "Start Consultation",
          emergencyAlert: "Critical indicators detected in latest prediction",
          typing: "{{name}} is typing...",
          aiSuggested: "AI Suggested Replies",
        },
        summary: {
          title: "Patient Summary",
          currentRisk: "Current Risk Status",
          latestIndicators: "Latest Indicators",
          medications: "Current Medications",
          lastReview: "Last Doctor Review",
          upcomingAppointments: "Upcoming Appointments",
          riskTrend: "Risk Trend",
          dosage: "Dosage",
          frequency: "Frequency",
          mealTiming: "Meal Timing",
        },
        loading: "Loading your conversations...",
        noConversations: "No conversations found",
        id: "ID",
        activeConsultation: "Active Consultation",
        videoCall: "Video Call",
        viewIndicators: "View Indicators",
        startConversation: "Start a conversation with {{name}}",
        typeMessage: "Type a clinical message...",
        send: "Send",
        selectThread: "Select a patient thread",
        fullRecord: "Full Record",
        recentAssessments: "Recent Assessments",
        openRecord: "Open Medical Record",
        loadingContext: "Loading Patient Context..."
      },
      settings: "Settings",
      help: "Help",
      doctorPortal: "Doctor Portal",
    },
    stats: {
      totalPatients: "Total Patients",
      pendingReviews: "Pending Reviews",
      todayAppointments: "Today's Appointments",
      totalPredictions: "Total Predictions",
      thisMonth: "This Month",
      fromYesterday: "From Yesterday",
    },
    pendingReviews: {
      title: "Pending Reviews",
      viewAll: "View All",
      empty: "No pending reviews at the moment.",
      patient: "Patient",
      riskLevel: "Risk Level",
      date: "Date",
      action: "Action",
      reviewBtn: "Review",
    },
notifications: {
  title: "Notifications",
  viewAll: "View All",
  empty: "No notifications yet"
},
    riskChart: {
      title: "Risk Distribution",
      empty: "Not enough data for chart",
      patients: "patients",
    },
    appointments: {
      title: "My Schedule",
      viewAll: "View All",
      empty: "No remaining appointments for today.",
      newAppointment: "+ New Appointment",
      blockTime: "Block Time",
      filterToday: "Today",
      filterUpcoming: "Upcoming",
      filterAll: "All",
      patientID: "Patient ID",
      joinCall: "Join Call",
      viewProfile: "View Profile",
      reschedule: "Reschedule",
      cancel: "Cancel",
      statusUpcoming: "Upcoming",
      statusInProgress: "In Progress",
      statusCompleted: "Completed",
      searchPlaceholder: "Search patients or appointments...",
    },
    reports: {
      title: "Reports",
      subtitle: "View and manage AI predictions and patients’ reports",
      stats: {
        total: "Total Reports",
        pending: "Pending Reviews",
        highRisk: "High Risk Cases",
        followUp: "Follow-up Cases",
        approved: "Approved Reports",
      },
      table: {
        patient: "Patient",
        probability: "Prediction Probability",
        riskLevel: "Risk Level",
        indicators: "Key Indicators",
        status: "AI Review Status",
        decision: "Doctor Decision",
        date: "Date",
        actions: "Actions",
      },
      status: {
        pending: "Pending",
        reviewed: "Reviewed",
        needsFollowUp: "Needs Follow-up",
        approved: "Approved",
        rejected: "Rejected",
      },
      drawer: {
        reportId: "Report #{{id}}",
        tabs: {
          prediction: "AI Prediction",
          review: "Review & Notes",
          medications: "Medications",
          chat: "Chat History",
        },
        aiExplanation: "AI Prediction Explanation",
        doctorNotes: "Doctor Notes",
        saveReview: "Save Review",
        actions: {
          approve: "Approve",
          reject: "Reject",
          followUp: "Needs Follow-up",
        }
      },
      empty: "No reports found matching your filters.",
      searchPlaceholder: "Search by patient name or ID...",
      monthlySummary: "Monthly Summary",
      riskAnalysis: "Risk Analysis",
      patientDemographics: "Patient Demographics",
      viewAll: "View All Reports",
      generateNew: "Generate New Report",
      filter: "Filter",
      clearFilters: "Clear Filters",
      loading: "Loading reports...",
      noReports: "No reports found",
      clinicalIndicators: "Clinical Indicators",
      aiInsight: "AI Clinical Insight",
      clinicalDecision: "Clinical Decision",
      notesTitle: "Medical Notes & Instructions",
      optional: "Optional",
      notesPlaceholder: "Document your clinical findings, next steps, or specific instructions for the patient...",
      notified: "Patient will be notified immediately upon submission",
      saveError: "Error saving review",
      saveSuccess: "Review saved successfully",
      fetchError: "Failed to load reports"
    },
    activity: {
      title: "Recent Activity",
      empty: "No recent activities.",
    },
    patients: {
      title: "Patients",
      addNew: "Add New Patient",
      viewDetails: "View Details",
      lastVisit: "Last Visit",
      condition: "Condition",
      patientID: "Patient ID",
      ageGender: "{{age}} • {{gender}}",
      age: "Age",
      gender: "Gender",
      male: "Male",
      female: "Female",
      noPatientsFound: "No patients found matching your search.",
      searchPlaceholder: "Search by name, ID or email...",
    },
    noPatientsFound: "No patients found",
    settings: {
      profileTitle: "Profile Settings",
      profileDesc: "Manage your professional profile and public information",
      fullName: "Full Name",
      email: "Email Address",
      bio: "Professional Bio",
      phone: "Phone Number",
      saveChanges: "Save Changes",
      notificationTitle: "Notification Preferences",
      notificationDesc: "Choose how you want to be notified about patient activity",
      emailNotifications: "Email Notifications",
      smsNotifications: "SMS Notifications",
      pushNotifications: "Push Notifications",
      accountTitle: "Account Information",
      securityTitle: "Security Settings",
      passwordChange: "Change Password",
      themeTitle: "Appearance",
      languageTitle: "Language Settings",
      twoFactor: "Two-Factor Authentication",
      sessions: "Active Sessions"
    },
    
    help: {
      faqs: "Frequently Asked Questions",
      faqsDesc: "Quick answers to common questions about the platform",
      guides: "System Guides",
      guidesDesc: "Detailed documentation on how to use the dashboard and AI features",
      contact: "Contact Support",
      aiExplanation: "AI Prediction Explanation",
      aiExplanationDesc: "Learn how our AI models calculate diabetes risk levels",
      emergencySupport: "Emergency Support",
      usageTips: "Dashboard Usage Tips",
      systemStatus: "System Status"
    }
  },

dashboard: {
  title: "Dashboard",
  welcome: "Welcome back",
  hello: "Hi",
  subtitle: "Your health, powered by AI.",

  mainMenu: "Main Menu",
  search: "Search",
  clearSearch: "Clear search",
  newTest: "Start New Test",
  newCheckup: "New Checkup",
  recentAnalyses: "Recent Analyses",
  previousReports: "Previous Reports",
  bookConsultation: "Book Consultation",
  settings: "Settings",
riskIndicators: "Risk Indicators",
  riskLow: "Low",
  riskMedium: "Medium",
  riskHigh: "High",
  loading: "Loading data...",
  fetchError: "We couldn't load your previous analyses.",
  dataError: "Error loading data",
  unableToLoadAnalyses: "Unable to load analyses",

  noPreviousAnalyses: "No previous analyses found",
  firstTestNow: "Take your first test now",
  noReportsYet: "No previous reports yet",
  reportCount: "reports",

  averageRisk: "Average Risk",
  latestStatus: "Latest Status",
  savedReports: "Saved Reports",
  lastCheckup: "Last Checkup",

  analysisOverview: "Overview of your diabetes analyses",
allReports: "All Reports",
  weekly: "Weekly",
  monthly: "Monthly",
  latestAnalysisScore: "Latest Analysis Score",
  noData: "No Data",
  progress: "Progress",
  outOf: "of",

  pregnancies: "Pregnancies",
  glucose: "Glucose",
  bloodPressure: "Blood Pressure",
  skinThickness: "Skin Thickness",
  insulin: "Insulin",
  bmi: "BMI",
  age: "Age",
  diabetesPedigree: "Diabetes Pedigree",

  infectionProbability: "Infection probability",
  viewReport: "View Report",
  date: "Date",
  action: "Actions",

  healthTipText:
    "Stay hydrated, exercise regularly, and get enough sleep for better health.",

  lastDoctorContact: "Last Doctor Contact",
  lastDoctorContactDesc: "Your most recent consultation appointment",
  doctorCardTitle: "Your Doctor",
  doctorCardText:
    "The last connected doctor will appear here once consultation data becomes available.",
  openConsultations: "Open Consultations",

  help: "Help",
  logout: "Log out",
  logoutError: "Failed to log out",

  last7Days: "Last 7 days",
  last30Days: "Last 30 days",

  riskTooltip: "Risk",
  valueLabel: "Value",

  weeklyAverage: "Weekly Average",
  monthlyAverage: "Monthly Average",

  reportsThisWeek: "Reports This Week",
  reportsThisMonth: "Reports This Month",

  highestWeeklyRisk: "Highest Weekly Risk",
  highestMonthlyRisk: "Highest Monthly Risk",

  noWeeklyReportsTitle: "No weekly reports",
  noMonthlyReportsTitle: "No monthly reports",

  noWeeklyReportsDesc: "There are no saved analyses in the last 7 days.",
  noMonthlyReportsDesc: "There are no saved analyses in the last 30 days.",

  chartShortPregnancies: "Preg",
  chartShortGlucose: "Glucose",
  chartShortBloodPressure: "BP",
  chartShortSkinThickness: "Skin",
  chartShortInsulin: "Insulin",
  chartShortBmi: "BMI",
  chartShortDiabetesPedigree: "DPF",
  chartShortAge: "Age"
},

report: {
  title: "Preliminary Analysis Report",

  diabetesRisk: "Diabetes Risk",
  remaining: "Remaining",
  diabetesRiskProbability: "Diabetes Risk Probability",
  riskLevelLabel: "Risk Level",

  preliminaryResult: "Preliminary Result",
  personalizedRecommendations: "Personalized Recommendations",
  newAnalysis: "New Analysis",
  downloadPdf: "Download PDF Report",

  noResultTitle: "No Analysis Result",
  noResultDescription: "Please complete the analysis from the diagnosis page first...",
  backToDiagnosis: "Back to Diagnosis",

  pdfError: "Failed to generate PDF. Check the console for details.",

  pdf: {
    title: "Diabetes Risk Analysis Report",
    analysisDate: "Analysis Date",
    parameter: "Parameter",
    value: "Value",
  },

  fields: {
    pregnancies: "Pregnancies",
    glucose: "Glucose (mg/dL)",
    bloodPressure: "Blood Pressure (mmHg)",
    skinThickness: "Skin Thickness (mm)",
    insulin: "Insulin (mu U/ml)",
    bmi: "BMI",
    diabetesPedigreeFunction: "Diabetes Pedigree Function",
    age: "Age (years)",
  },

  resultMessages: {
    high:
      "Risk probability: {{probability}}% - Risk level: High. Risk factors may include high glucose, obesity, family history, or insulin resistance. Please consult a doctor for further evaluation.",
    mediumHigh:
      "Risk probability: {{probability}}% - Risk level: High. Risk factors may include prediabetes indicators, obesity, family history, or insulin resistance. Please consult a doctor for further evaluation.",
    moderate:
      "Risk probability: {{probability}}% - Risk level: Medium. Some risk indicators are present. Maintain healthy habits and consult a doctor when needed.",
    low:
      "Risk probability: {{probability}}% - Risk level: Low. Continue maintaining a healthy lifestyle and regular check-ups.",
  },

  recommendations: {
    high: {
      1: "Consult an endocrinologist as soon as possible for further tests.",
      2: "Reduce sugar and refined carbohydrates as much as possible.",
      3: "Start light to moderate daily physical activity.",
      4: "Monitor your blood sugar level regularly.",
    },
    mediumHigh: {
      1: "It is recommended to consult a doctor as soon as possible.",
      2: "Follow a low-carbohydrate diet.",
      3: "Exercise for at least 150 minutes per week.",
      4: "Maintain a healthy and stable weight.",
    },
    moderate: {
      1: "Maintain a balanced and healthy lifestyle.",
      2: "Avoid excessive sugar intake.",
      3: "Exercise regularly.",
      4: "Schedule a check-up every 6 to 12 months.",
    },
    low: {
      1: "Continue your current healthy lifestyle.",
      2: "Eat vegetables, fruits, and good protein sources regularly.",
      3: "Stay physically active every day.",
      4: "Have a routine check-up every 1 to 2 years.",
    },
  },
},

  forgotPassword: {
    title: "Forgot your password?",
    subtitle:
      "Enter your email address and we’ll send you a password reset link.",
    backToLogin: "Back to Login",
    emailLabel: "Email Address",
    emailPlaceholder: "example@email.com",
    submit: "Send Reset Link",
    sending: "Sending...",
    sentTitle: "Sent Successfully!",
    sentSubtitle:
      "Check your email and click the link to reset your password.",
    successToast:
      "A password reset link has been sent to your email address.",
    errors: {
      sendFailed: "Failed to send the reset email.",
      unexpected: "An error occurred while sending the email. Please try again."
    }
  },

  editProfile: {
    title: "Edit Profile",
    subtitle: "Update your basic personal information.",
    backToDashboard: "Back to Dashboard",

    profileImageAlt: "Profile picture",
    changePhoto: "Change photo",
    removePhoto: "Remove photo",
    editPassword: "Edit Password",

    firstName: "First Name",
    lastName: "Last Name",
    email: "Email Address",
    phone: "Phone Number (Optional)",

    saveChanges: "Save Changes",
    saving: "Saving...",
    forgotPassword: "Forgot your password?",

    defaultName: "User Name",
    personalInfoSubtitle: "Make sure your details are correct before saving.",

    placeholders: {
      firstName: "Ahmed",
      lastName: "Mohamed",
      email: "ahmed@example.com",
      phone: "+20 123 456 7890"
    },

    toasts: {
      invalidImage: "Please select a valid image file",
      imageTooLarge: "Image size must be less than 5 MB",
      pictureDeleted: "Profile picture deleted successfully",
      deleteFailed: "Failed to delete the profile picture from the server",
      updateSuccess: "Profile updated successfully",
      updateFailed: "Failed to update profile",
      unexpectedError: "An unexpected error occurred"
    }
  },

  reports: "Reports",
  consultations: "Consultations",
  helpNav: "Help",

  help: {
    title: "Help Center",
    subtitle:
      "Find quick answers to common questions or reach out to our support team.",
    searchPlaceholder: "Search your question here...",
    faqs: {
      aiDiagnosis: {
        question: "Is the AI diagnosis a replacement for a doctor?",
        answer:
          "No, HealthCare is a smart tool designed to provide preliminary insights and information based on symptoms, but it does not replace professional medical advice."
      },
      dataSecurity: {
        question: "How secure is my medical data?",
        answer:
          "Your privacy and data security are our top priorities, and your information is handled with strong protection measures."
      },
      resetPassword: {
        question: "How do I reset my password?",
        answer:
          "You can reset your password by clicking on the Forgot Password option and following the instructions."
      },
      downloadReports: {
        question: "Can I download my reports?",
        answer:
          "Yes, you can easily download your health reports in PDF format."
      }
    },
    contact: {
      title: "Still have questions?",
      subtitle: "Our team is here to help you.",
      emailTitle: "Email Support",
      emailDescription: "Get a detailed response within 24 hours."
    },
    importantPages: "Important Pages",
    links: {
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      contact: "Contact Us"
    }
  },

  chatBot: {
    title: "AI Medical Assistant",
    connectedToLastPrediction: "Connected to your latest analysis",
    generalMode: "General mode",

    welcomeInitial: "Welcome, I’m your smart medical assistant.",
    welcomeFollowUp:
      "I can help answer your questions about your general health and diabetes.",

    floatingMessage1: "Welcome, I’m your smart medical assistant.",
    floatingMessage2:
      "I can help answer your questions about your general health and diabetes.",

    typing: "Typing...",
    inputPlaceholder: "Type your question here...",
    disclaimer:
      "This is an AI assistant and does not replace consultation with a medical specialist.",
    fallbackError:
      "Sorry, there is currently a technical issue. Please try again later or consult a doctor.",
    temporarilyDisabled: "(Chatbot is temporarily disabled)",
    unavailableToast: "Chatbot is currently unavailable",
    openAriaLabel: "Open chat assistant",
    minimizeAriaLabel: "Minimize chat",
    closeAriaLabel: "Close chat",
    closeHintAriaLabel: "Close hint",
    fallbackResponses: {
      why: "The percentage depends on several factors such as glucose, BMI, age, and family history.",
      how: "It works by analyzing your medical data and comparing it with thousands of similar cases.",
      serious:
        "Risk level is determined based on the percentage. If it is above 50%, it is recommended to consult a doctor.",
      treatment:
        "The main steps are a healthy diet, regular exercise, and follow-up with a doctor."
    },
    sendAriaLabel: "Send message"
  },

  faqs: "FAQs",
  contact: "Contact",
  login: "Login",
  getStarted: "Get Started",
  settings: "Settings",
  logout: "Logout",
  myAccount: "My Account",
  contactUs: "Contact Us",
  sendMessage: "Send Message",
  name: "Name",
  email: "Email",
  subject: "Subject",
  message: "Message",

  footer: {
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    contact: "Contact Support",
    copyright: "© 2026 HealthCare. All rights reserved."
  },

  landing: {
    heroTitle: "AI-Powered Medical Diagnosis at Your Fingertips",
    heroSubtitle:
      "Get fast, accurate, and confidential health insights with our AI-driven diagnostic tool.",
    startCheckup: "Start Your Checkup",
    scrollNext: "Scroll to Next Section",
doctorHeroTitle: "An Integrated Medical Portal for Patient Follow-up and Analysis Review",
doctorHeroSubtitle:
  "Review patient analyses, monitor risk levels, and organize appointments and reports through a clear and secure doctor dashboard designed for efficient medical follow-up.",
goToDoctorDashboard: "Go to Doctor Dashboard",
    howItWorksTitle: "How It Works",
    howItWorksSubtitle:
      "A simple, three-step process to get your personalized health report.",
    step1Title: "1. Input Symptoms",
    step1Desc:
      "Describe your symptoms in detail using our intuitive interface.",
    step2Title: "2. AI Analysis",
    step2Desc:
      "Our AI analyzes your input using advanced algorithms and medical data.",
    step3Title: "3. Personalized Report",
    step3Desc:
      "Receive a comprehensive report with insights and recommendations.",

    benefitsTitle: "Key Benefits",
    benefitsSubtitle:
      "Experience the power of AI in healthcare with our advanced features.",
    benefit1Title: "Fast & Accurate Results",
    benefit1Desc: "Get results in minutes with high accuracy.",
    benefit2Title: "Secure & Confidential Data",
    benefit2Desc: "Your data is encrypted and kept private.",
    benefit3Title: "Easy-to-Use Interface",
    benefit3Desc: "Simple and intuitive design for all users.",
    benefit4Title: "Supports Multiple Conditions",
    benefit4Desc: "Diagnose a wide range of health issues.",
    benefit5Title: "24/7 Availability",
    benefit5Desc: "Access our service anytime, anywhere.",
    benefit6Title: "Doctor Verified",
    benefit6Desc: "Information is reviewed by professionals.",

    testimonialsTitle: "What Our Users Say",
    testimonialsSubtitle:
      "Real stories from patients and doctors who trust HealthCare.",
    testimonial1Text:
      '"HealthCare revolutionized my practice. It provides quick and reliable insights, making diagnosis faster for my patients."',
    testimonial1Name: "Dr. Sam Carter",
    testimonial1Role: "General Practitioner",
    testimonial2Text:
      '"I was amazed by the accuracy and speed of the diagnosis. It gave me peace of mind and helped me understand my health better."',
    testimonial2Name: "Mark Thompson",
    testimonial2Role: "Patient",

    ctaTitle: "Take control of your health today.",
    ctaSubtitle:
      "Join thousands of users who are making smarter health decisions with AI-powered insights.",
    ctaButton: "Start Diagnosis Now"
  },

  contactPage: {
    pageTitle: "Contact Us",
    pageSubtitle: "We’re here to help. Feel free to get in touch with us.",
    formTitle: "Send Us a Message",
    formDescription:
      "Fill out the form and we’ll get back to you as soon as possible.",
    name: "Name",
    email: "Email",
    subject: "Subject",
    message: "Message",
    namePlaceholder: "John Smith",
    emailPlaceholder: "example@email.com",
    subjectPlaceholder: "General inquiry",
    messagePlaceholder: "Write your message here...",
    requiredFields: "Please fill in all required fields.",
    invalidEmail: "Please enter a valid email address.",
    successMessage:
      "Your message has been sent successfully! We’ll contact you soon.",
    failedMessage: "Failed to send message. Please try again.",
    sending: "Sending...",
    sendMessage: "Send Message",
    replyTime: "We usually reply within 24 business hours",
    emailTitle: "Email",
    phoneTitle: "Phone",
    addressTitle: "Address",
    addressValue: "Cairo, Egypt",
    faqTitle: "Looking for a quick answer?",
    faqDescription:
      "Browse the help center. You might find your answer there.",
    faqLink: "Go to Help Center",
    support247: "Email support is available 24/7",
    emergencyTitle: "Medical Emergency?",
    emergencyText:
      "If you have a medical emergency, do not wait — call emergency services immediately.",
    emergencyCall: "123 (Ambulance in Egypt)",
    locationTitle: "Our Location",
    locationDescription: "Visit us at our office",
    openMap: "Open Map",
    mapText: "Open the location on Google Maps",
    egypt: "Egypt"
  },

  authPage: {
    secureAccess: "Secure Access",
    loginSubtitle: "Log in to your account",
    signupSubtitle: "Create a new account",
    loginTab: "Login",
    signupTab: "Sign Up",
    email: "Email",
    password: "Password",
      orContinueWith: "Or login with",
  forgotPassword: "Forgot your password?",
    processing: "Processing...",
    loginButton: "Login",
    signupButton: "Create Account",
    noAccount: "Don't have an account?",
    createNow: "Create one now",
    haveAccount: "Already have an account?",
    loginNow: "Log in now",
    firstName: "First Name",
    firstNamePlaceholder: "John",
    lastName: "Last Name",
    lastNamePlaceholder: "Smith",
    confirmPassword: "Confirm Password",
    passwordHint: "Uppercase, lowercase, number, 8+ characters",
    loginSuccess: "Logged in successfully!",
    loginFailed: "Login failed",
    signupSuccess: "Account created successfully!",
    signupFailed: "Account creation failed",
    securityNotice:
      "Secure data: We use encryption to protect your login information",
    footerNote: "This website uses AI for early diabetes detection",
    validation: {
      invalidEmail: "Invalid email address",
      emailRequired: "Email is required",
      passwordRequired: "Password is required",
      firstNameMin: "First name must be at least 2 characters",
      lastNameMin: "Last name must be at least 2 characters",
      passwordMin: "Password must be at least 8 characters",
      passwordUpper: "Must contain an uppercase letter",
      passwordLower: "Must contain a lowercase letter",
      passwordNumber: "Must contain a number",
      confirmPasswordRequired: "Confirm password is required",
      passwordsMismatch: "Passwords do not match"
    }
  },

  pastReportsPage: {
    noReportsToast: "No previous reports found",
    fetchError: "We couldn't load previous reports",
    dataError: "Error loading data",
    mustLogin: "You must log in first to view previous reports",
    title: "Past Reports",
    subtitle: "View all previous diabetes analyses you have completed",
    newTest: "Start New Test",
    loading: "Loading reports...",
    emptyTitle: "No previous reports",
    riskLevel: "Risk Level",
    emptySubtitle: "Start your first diabetes analysis now",
    startAnalysis: "Start Analysis",
    totalReports: "Total Reports",
    latestTest: "Latest Test",
    average: "Average",
    infectionProbability: "Infection Probability",
    date: "Date",
    viewReport: "View Report",
    pregnancies: "Pregnancies",
    glucose: "Glucose",
    bloodPressure: "Blood Pressure",
    bmi: "Body Mass Index",
    riskLow: "Low",
    riskMedium: "Medium",
    riskHigh: "High",
    riskVeryHigh: "Very High",
    unknownRisk: "Unknown",
    reportId: "Report ID"
  },

  consultationsPage: {
  title: "Book an Online Consultation",
  subtitle:
    "Connect with certified doctors for expert guidance after your AI health report.",
  illustrationText: "Doctor consultation illustration",
  bookingSection: "Booking Section",
  specialization: "Doctor Specialization",
  timeSlots: "Available Time Slots",
  confirm: "Confirm Appointment",
  upcoming: "Upcoming Appointments",
  joinCall: "Join Call",
  upcomingStatus: "Upcoming",
  cancelledStatus: "Cancelled",
  reschedule: "Reschedule",
  cancel: "Cancel",
  rescheduleTitle: "Reschedule Appointment",
  newDate: "New Date",
  newTime: "New Time",
  selectNewTime: "Select new time",
  save: "Save Changes",
  selectRequired: "Please select all required fields",
  selectValidSpecialization: "Please select a valid specialization",
  slotBooked: "This appointment slot is already booked",
  confirmed: "Appointment confirmed!",
  selectNewDateTime: "Please select the new date and time",
  newSlotBooked: "This new slot is already booked",

  joinToast: "Joining {{doctor}}'s consultation...",
  rescheduleSuccess: "Appointment with {{doctor}} rescheduled successfully",
  cancelToast: "{{doctor}}'s appointment cancelled",

  generalPractitioner: "General Practitioner",
  cardiologist: "Cardiologist",
  dermatologist: "Dermatologist",
  neurologist: "Neurologist",

  time1000: "10:00 AM",
  time1100: "11:00 AM",
  time1400: "2:00 PM",
  time1500: "3:00 PM",
  time1600: "4:00 PM",

  doctors: {
    general: {
      name: "Dr. Emily Carter",
      specialty: "General Practitioner"
    },
    cardio: {
      name: "Dr. David Lee",
      specialty: "Cardiologist"
    },
    derma: {
      name: "Dr. Sophia Rodriguez",
      specialty: "Dermatologist"
    },
    neuro: {
      name: "Dr. Michael Adams",
      specialty: "Neurologist"
    }
  }
},

  diagnosisWizard: {
    backHome: "Back to Home",
    pageTitle: "Early Detection of Diabetes and Cardiovascular Disease Risk",
    pageSubtitle:
      "Enter your core medical data to get an initial risk assessment in seconds.",

    section1: "Basic Information",
    section2: "Vital Indicators",
    section3: "Risk Factors",

    section1Desc: "Core personal information used in the assessment.",
    section2Desc: "Medical measurements related to diabetes risk.",
    section3Desc: "Genetic factors that improve assessment accuracy.",

    howItWorks: "How it works",
    howItWorksDesc:
      "Complete 3 simple steps, then get your result and report instantly.",

    tip1: "Enter accurate values",
    tip2: "Insulin can stay 0 if unavailable",
    tip3: "The report appears right after calculation",

    pregnancies: "Number of Pregnancies",
    pregnanciesDesc: "Enter 0 if there was no pregnancy",
    pregnanciesPlaceholder: "e.g. 0",

    glucose: "Glucose Level (mg/dL)",
    glucoseDesc: "Usually 70-140 after fasting",
    glucosePlaceholder: "e.g. 85",

    bloodPressure: "Blood Pressure (mmHg)",
    bloodPressureDesc: "Systolic pressure",
    bloodPressurePlaceholder: "e.g. 70",

    skinThickness: "Skin Thickness (mm)",
    skinThicknessDesc: "Subcutaneous fat thickness",
    skinThicknessPlaceholder: "e.g. 20",

    insulin: "Insulin Level (mu U/ml)",
    insulinDesc: "0 if not measured",
    insulinPlaceholder: "e.g. 0",

    bmi: "Body Mass Index (BMI)",
    bmiDesc: "Weight in kg ÷ (height in meters)²",
    bmiPlaceholder: "e.g. 25.0",

    pedigree: "Diabetes Pedigree Function",
    pedigreeDesc: "Genetic factor (0.078–2.42)",
    pedigreePlaceholder: "e.g. 0.5",

    age: "Age (Years)",
    ageDesc: "From 21 to 81 years",
    agePlaceholder: "e.g. 35",

    next: "Next",
    previous: "Previous",
    submit: "Calculate Risk Probability",
    loading: "Calculating...",

    footer:
      "This is only an initial assessment and does not replace consulting a specialist doctor.",
    success: " Analysis completed successfully!",
    error: "An error occurred: ",

    validation: {
      pregnanciesMin: "Must be 0 or more",
      pregnanciesMax: "Maximum is 20",

      glucoseMin: "Must be 0 or more",
      glucoseMax: "Maximum is 200 mg/dL",

      bloodPressureMin: "Must be 0 or more",
      bloodPressureMax: "Maximum is 155 mmHg",

      skinThicknessMin: "Must be 0 or more",
      skinThicknessMax: "Maximum is 99 mm",

      insulinMin: "Must be 0 or more",
      insulinMax: "Maximum is 846 mu U/ml",

      bmiMin: "Must be 0 or more",
      bmiMax: "Maximum is 67.1",

      pedigreeMin: "Must be 0.078 or more",
      pedigreeMax: "Maximum is 2.42",

      ageMin: "Must be 21 or more",
      ageMax: "Maximum is 81 years"
    }
  },

terms: {
  badge: "Terms & Conditions",
  title: "Terms of Service",
  subtitle:
    "Please read these terms carefully before using HealthCare. Your continued use of the platform indicates your acceptance of these terms and conditions.",
  lastUpdatedLabel: "Last updated:",
  contents: "Contents",
  sectionLabel: "Section",
  notice: {
    title: "Important Notice",
    description:
      "By using HealthCare, you agree to these terms. If you do not agree, please do not use the platform."
  },
  sections: {
    acceptance: {
      title: "Acceptance of Terms",
      intro: "By using HealthCare, you:",
      items: [
        "Agree to comply with these terms and conditions",
        "Acknowledge that you have read and understood the Privacy Policy",
        "Commit to using the platform only for its intended purposes",
        "Acknowledge that you are responsible for the accuracy of the information you provide"
      ]
    },
    serviceDescription: {
      title: "Service Description",
      intro: "HealthCare provides the following services:",
      items: [
        "Diabetes risk analysis based on your health data",
        "An AI medical assistant to answer your health-related questions",
        "Storage of your previous analysis history",
        "General health recommendations"
      ],
      note:
        "Note: These services are for informational and educational purposes only and are not a substitute for professional medical advice."
    },
    medicalDisclaimer: {
      title: "Medical Disclaimer",
      warning: "HealthCare does not provide medical diagnosis or treatment!",
      items: [
        "The analyses provided are statistical estimates only",
        "Do not rely on the results for treatment decisions without consulting a doctor",
        "The platform is not liable for any harm resulting from the use of the information",
        "You should consult a qualified physician for any health concern",
        "In medical emergencies, call emergency services immediately (123 in Egypt)"
      ]
    },
    userObligations: {
      title: "Your Responsibilities as a User",
      intro: "When using the platform, you agree to:",
      items: [
        "Provide accurate and truthful information",
        "Not use the platform for unlawful purposes",
        "Not attempt to hack or tamper with the platform",
        "Not impersonate another person",
        "Not use the platform to spread misleading information",
        "Maintain the confidentiality of your account data"
      ]
    },
    intellectualProperty: {
      title: "Intellectual Property",
      intro:
        "All platform content is protected by intellectual property rights:",
      items: [
        "Logos and trade names are owned by HealthCare",
        "Medical content is protected by copyright",
        "Algorithms and models are owned by the platform",
        "Content may not be copied or distributed without permission"
      ]
    },
    serviceModification: {
      title: "Service Modification",
      intro: "We reserve the right to:",
      items: [
        "Modify or discontinue the service in whole or in part",
        "Change available features",
        "Update the medical models in use",
        "Amend these terms at any time"
      ],
      footnote:
        "We will try to notify you in advance of important changes whenever possible."
    },
    accountTermination: {
      title: "Account Termination",
      intro:
        "We may suspend or terminate your account in the following cases:",
      items: [
        "Violation of these terms and conditions",
        "Unlawful use of the platform",
        "Your request to delete your account",
        "Permanent discontinuation of the service"
      ]
    },
    governingLaw: {
      title: "Governing Law",
      intro: "These terms are governed by:",
      items: [
        "The laws of the Arab Republic of Egypt",
        "Any dispute shall be resolved in the competent courts",
        "If any provision conflicts with the law, that provision shall be deemed invalid while the remaining provisions remain in effect"
      ]
    }
  },
  contact: {
    title: "Have Questions?",
    description:
      "If you have any questions about the Terms of Service, please contact us."
  }
},
privacy: {
  title: "Privacy Policy",
  subtitle:
    "Please review how HealthCare collects, uses, stores, and protects your information when you use the platform.",
  lastUpdatedLabel: "Last updated:",
  sectionLabel: "Section",
  sections: {
    collectedInformation: {
      title: "Information We Collect",
      intro: "We collect the following information to provide our services:",
      items: [
        "Personal information: name, email address, age",
        "Medical data: analysis results and health measurements such as glucose, blood pressure, and BMI",
        "Usage data: how you interact with the platform",
        "Chat history: questions submitted to the AI medical assistant"
      ]
    },
    howWeUseInformation: {
      title: "How We Use Your Information",
      intro: "We use your information for the following purposes:",
      items: [
        "Provide accurate and personalized health analysis",
        "Improve service quality and performance",
        "Enable the AI medical assistant to respond to your questions",
        "Store previous analysis history for future reference",
        "Send important health-related alerts if you choose to receive them"
      ]
    },
    dataProtection: {
      title: "Data Protection",
      intro: "We apply strict security measures to protect your data:",
      items: [
        "Encryption of sensitive medical data",
        "Storage on secure servers",
        "Restricted access for authorized personnel only",
        "Regular data backups",
        "Ongoing review of security procedures"
      ]
    },
    informationSharing: {
      title: "Information Sharing",
      strong:
        "We do not sell or rent your personal information to third parties.",
      intro: "Your information may only be shared in the following cases:",
      items: [
        "With your explicit consent",
        "With service providers acting on our behalf under confidentiality obligations",
        "When required by law or court order",
        "To protect your safety or the safety of others"
      ]
    },
    yourRights: {
      title: "Your Rights",
      intro: "You have the following rights regarding your data:",
      items: [
        "Access your personal data",
        "Correct inaccurate information",
        "Delete your account and data, noting this may affect service availability",
        "Export your data in a readable format",
        "Withdraw consent to data processing"
      ]
    },
    medicalDisclaimer: {
      title: "Medical Disclaimer",
      strong:
        "Important: HealthCare is a support tool and does not replace professional medical advice.",
      items: [
        "The information provided is for informational purposes only",
        "It does not constitute a final medical diagnosis",
        "A qualified physician should be consulted for diagnosis and treatment",
        "Do not disregard professional medical advice based on platform information"
      ]
    },
    
    policyChanges: {
      title: "Changes to This Policy",
      intro:
        "We may update this Privacy Policy from time to time. Important changes may be communicated through:",
      items: [
        "Publishing the updated policy on the platform",
        "Sending an email if the changes are material",
        "Updating the “Last updated” date at the top of the page"
      ]
    }
  },
  contact: {
    title: "Have questions?",
    description:
      "If you have any questions about this Privacy Policy, please contact us."
  }
}
};

export default en;