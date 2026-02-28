// Landing Page Internationalization
const translations = {
  en: {
    // Nav
    nav_features: "Features",
    nav_how_it_works: "How it Works",
    nav_platform: "Platform",
    nav_ai: "AI Tools",
    nav_faq: "FAQ",
    nav_contact: "Contact",
    nav_signin: "Sign In",
    nav_trial: "Start Free Trial",

    // Hero
    hero_badge: "AI-Powered Learning Platform",
    hero_title_1: "The Smarter Way to",
    hero_title_2: "Teach & Learn",
    hero_desc:
      "A complete white-label LMS with AI-generated quizzes, DRM-protected video & PDF content, and multi-tenant architecture — built for educational centers ready to scale.",
    hero_cta_primary: "Get Started Free →",
    hero_cta_secondary: "See Platform",
    hero_stat_1_value: "500K+",
    hero_stat_1_label: "Lessons Delivered",
    hero_stat_2_value: "98%",
    hero_stat_2_label: "Client Satisfaction",
    hero_stat_3_value: "99.9%",
    hero_stat_3_label: "Uptime SLA",

    // Hero Card
    hero_card_name: "Sarah Ahmed",
    hero_card_role: "Grade 11 — Science Track",
    hero_card_progress: "78% Complete",
    hero_course_1: "Advanced Mathematics",
    hero_course_1_meta: "24 Lessons • 6 Quizzes",
    hero_course_2: "Physics — Mechanics",
    hero_course_2_meta: "18 Lessons • 4 Quizzes",
    hero_course_3: "Arabic Literature",
    hero_course_3_meta: "20 Lessons • 5 Quizzes",
    hero_float_ai: "AI Quiz Generated",
    hero_float_ai_sub: "15 questions ready",
    hero_float_score: "Last Quiz Score",

    // Trust Bar
    trust_header: "Trusted by Educational Leaders",
    trust_metric_1_value: "50+",
    trust_metric_1_label: "Educational Centers",
    trust_metric_2_value: "25,000+",
    trust_metric_2_label: "Active Students",
    trust_metric_3_value: "1,200+",
    trust_metric_3_label: "Courses Published",
    trust_metric_4_value: "2M+",
    trust_metric_4_label: "Quizzes Completed",
    trust_badge_1: "Widevine DRM Certified",
    trust_badge_2: "FairPlay Streaming",
    trust_badge_3: "AWS Infrastructure",
    trust_badge_4: "Arabic & English Support",

    // Features
    features_tag: "Platform Features",
    features_title: "Everything Your Center Needs to Succeed",
    features_desc:
      "A complete toolkit to manage courses, engage students, protect your content, and grow your educational business with confidence.",
    feature_1_title: "AI-Powered Quiz Generator",
    feature_1_desc:
      "Upload your content, past exams, or study materials — our AI analyzes everything and generates comprehensive quizzes with multiple question types, difficulty levels, and instant grading. Save 20+ hours per week on assessment creation.",
    feature_2_title: "DRM Video Protection",
    feature_2_desc:
      "Enterprise-grade Widevine & FairPlay encryption protects your video content from piracy, screen recording, and unauthorized sharing.",
    feature_3_title: "Protected PDF Delivery",
    feature_3_desc:
      "Secure document distribution with download restrictions, watermarking, and access controls to keep your study materials safe.",
    feature_4_title: "White-Label Multi-Tenancy",
    feature_4_desc:
      "Each center gets their own branded experience — custom subdomain, logo, colors, and complete isolation from other tenants.",
    feature_5_title: "Advanced Analytics",
    feature_5_desc:
      "Real-time dashboards track student progress, course completion rates, quiz performance, and engagement metrics.",
    feature_6_title: "Subscription Management",
    feature_6_desc:
      "Flexible pricing plans, payment processing, and subscription lifecycle management built right into the platform.",
    feature_7_title: "Teacher & Staff Management",
    feature_7_desc:
      "Role-based access control for instructors, admins, and support staff with granular permissions per course or center.",
    feature_8_title: "Mobile-First Experience",
    feature_8_desc:
      "Native-quality mobile apps built with Flutter. Students learn anywhere, anytime — with offline support for downloaded content.",
    feature_9_title: "Smart Notifications",
    feature_9_desc:
      "Automated push notifications, email reminders, and deadline alerts keep students engaged and on track with their learning.",

    // How it works
    how_tag: "How It Works",
    how_title: "Launch in Minutes, Not Months",
    how_desc:
      "Get your educational platform up and running with just four simple steps.",
    how_step_1_title: "Create Your Center",
    how_step_1_desc:
      "Sign up, customize your branding, colors, and logo to match your identity.",
    how_step_2_title: "Upload Content",
    how_step_2_desc:
      "Add your video courses, PDFs, and materials. DRM protection is applied automatically.",
    how_step_3_title: "Generate Quizzes",
    how_step_3_desc:
      "Let AI analyze your content and auto-generate comprehensive quizzes and assessments.",
    how_step_4_title: "Invite Students",
    how_step_4_desc:
      "Share your platform link. Students join, enroll in courses, and start learning immediately.",

    // Platform Showcase
    platform_tag: "Admin Dashboard",
    platform_title: "Powerful Management, Beautifully Simple",
    platform_desc:
      "Take control of your educational center with an intuitive admin panel designed for efficiency. Monitor everything from a single dashboard.",
    platform_feature_1_title: "Real-Time Analytics",
    platform_feature_1_desc:
      "Track enrollments, completion rates, and revenue at a glance",
    platform_feature_2_title: "Course Bundling",
    platform_feature_2_desc:
      "Package courses together with flexible pricing options",
    platform_feature_3_title: "Bulk Operations",
    platform_feature_3_desc: "Manage students, courses, and content at scale",
    platform_feature_4_title: "Multi-Language",
    platform_feature_4_desc:
      "Full Arabic RTL support and English interface options",

    // AI Section
    ai_tag: "AI-Powered",
    ai_title: "Quizzes That Write Themselves",
    ai_desc:
      "Our AI analyzes your educational content, past exams, and learning objectives to automatically generate high-quality assessments tailored to your curriculum. Teachers save 20+ hours weekly.",
    ai_feature_1: "Auto-generate from uploaded content & past exams",
    ai_feature_2: "Multiple question types with adjustable difficulty",
    ai_feature_3: "Instant grading with detailed explanations",
    ai_feature_4: "Performance analytics per student & question",
    ai_feature_5: "Arabic language support for MENA curricula",
    ai_cta: "Try AI Quiz Generator →",

    // DRM Section
    drm_tag: "Enterprise Security",
    drm_title: "Your Content, Fully Protected",
    drm_desc:
      "Enterprise-grade DRM powered by Bunny Stream ensures your video courses and PDF materials are protected against piracy, screen recording, and unauthorized sharing — so you can focus on teaching.",
    drm_feature_1: "Widevine L1 DRM",
    drm_feature_2: "FairPlay Streaming",
    drm_feature_3: "Screen Record Detection",
    drm_feature_4: "Anti-Mirroring",
    drm_feature_5: "Token Authentication",
    drm_feature_6: "Geo-Restrictions",
    drm_feature_7: "PDF Watermarking",
    drm_feature_8: "Expiring Access Links",

    // FAQ
    faq_tag: "FAQ",
    faq_title: "Frequently Asked Questions",
    faq_desc:
      "Got questions? We've got answers. Here are the most common things people ask us.",
    faq_q1: "How quickly can I launch my educational center?",
    faq_a1:
      "Most centers are fully operational within 24-48 hours. Our onboarding team helps you set up your branding, import existing content, and configure your courses. If you have content ready, you can be live the same day.",
    faq_q2: "Is my video content really protected from piracy?",
    faq_a2:
      "Yes. We use the same DRM technology as Netflix and Disney+ (Widevine & FairPlay). Your content is encrypted, screen recording is blocked on supported devices, and we detect attempts to capture or share content illegally.",
    faq_q3: "How does the AI quiz generator work?",
    faq_a3:
      "Upload your course materials, past exams, or study guides. Our AI reads and understands the content, then generates quiz questions with multiple formats (MCQ, true/false, short answer). You can adjust difficulty, add explanations, and edit any question before publishing.",
    faq_q4: "Can I use my own domain and branding?",
    faq_a4:
      "Absolutely. Each center gets a custom subdomain (yourschool.najaah.me) or you can connect your own domain. You control your logo, colors, and the entire visual experience. Students never see the Najaah brand — it's 100% your platform.",
    faq_q5: "Do you support Arabic language and RTL layouts?",
    faq_a5:
      "Yes, the platform is fully bilingual with native Arabic support. The interface, student apps, and admin panel all work seamlessly in right-to-left (RTL) mode. Many of our centers serve Arabic-speaking students across MENA.",
    faq_q6: "What kind of support do you provide?",
    faq_a6:
      "Every center gets dedicated onboarding support, documentation, and email/chat support. Premium plans include priority support with faster response times, phone support, and a dedicated success manager for larger centers.",

    // Testimonials
    testimonials_tag: "Testimonials",
    testimonials_title: "Trusted by Educators Across MENA",
    testimonials_desc:
      "Hear from educational centers already transforming how they teach and grow.",
    testimonial_1:
      "Najaah transformed our entire operation. The AI quiz generator alone saved our teachers over 25 hours per week. We went from struggling with piracy to having complete control over our content. Our student enrollment has doubled since we launched on the platform.",
    testimonial_1_name: "Ahmed Khalil",
    testimonial_1_role: "Director, Al-Noor Academy",
    testimonial_1_location: "Alexandria, Egypt",
    testimonial_2:
      "Finally, a platform that takes video protection seriously. We've had zero piracy issues since switching. The DRM is rock solid.",
    testimonial_2_name: "Fatima Mansour",
    testimonial_2_role: "CEO, LearnFirst Education",
    testimonial_2_location: "Riyadh, KSA",
    testimonial_3:
      "The white-label feature is incredible. Our students don't even know it's a third-party platform. It feels completely ours.",
    testimonial_3_name: "Omar Saeed",
    testimonial_3_role: "Founder, TechEd Institute",
    testimonial_3_location: "Dubai, UAE",
    testimonial_4:
      "The Arabic RTL support is flawless. Our students and teachers love how natural everything feels. Best LMS we've ever used.",
    testimonial_4_name: "Hana Al-Rashid",
    testimonial_4_role: "Academic Director",
    testimonial_4_location: "Amman, Jordan",

    // Contact
    contact_tag: "Get Started",
    contact_title: "Let's Build Something Great Together",
    contact_desc:
      "Ready to transform your educational center? Tell us about your needs and we'll craft the perfect solution for you.",
    contact_chat: "Chat With Us",
    contact_chat_sub: "We typically respond within a few hours",
    contact_email: "support@najaah.me",
    contact_email_sub: "Drop us an email anytime",
    contact_phone: "+20 123 456 7890",
    contact_phone_sub: "Sun–Thu, 9 AM – 6 PM (Cairo Time)",
    contact_location: "Alexandria, Egypt",
    contact_location_sub: "Serving educational centers worldwide",
    contact_form_title: "Send Us a Message",
    contact_form_subtitle:
      "Tell us about your center and we'll get back to you with a tailored solution.",
    contact_form_name: "Full Name",
    contact_form_name_placeholder: "Your name",
    contact_form_email: "Email",
    contact_form_email_placeholder: "you@example.com",
    contact_form_center: "Center Name",
    contact_form_center_placeholder: "Your educational center",
    contact_form_students: "Number of Students",
    contact_form_students_placeholder: "Select range",
    contact_form_students_1: "Less than 100",
    contact_form_students_2: "100 – 500",
    contact_form_students_3: "500 – 1,000",
    contact_form_students_4: "1,000 – 5,000",
    contact_form_students_5: "5,000+",
    contact_form_message: "Message",
    contact_form_message_placeholder: "Tell us about your needs...",
    contact_form_submit: "Send Message →",

    // CTA
    cta_title: "Ready to Transform Your Educational Center?",
    cta_desc:
      "Join educational leaders across MENA already using Najaah to deliver better learning experiences and protect their content.",
    cta_primary: "Start Your Free Trial →",
    cta_secondary: "Explore Platform",
    cta_note: "No credit card required • 14-day free trial • Cancel anytime",

    // Footer
    footer_desc:
      "The smart learning platform built for modern educational centers. AI-powered quizzes, enterprise DRM, and white-label multi-tenancy.",
    footer_product: "Product",
    footer_company: "Company",
    footer_support: "Support",
    footer_features: "Features",
    footer_ai_quiz: "AI Quiz Generator",
    footer_drm: "DRM Protection",
    footer_dashboard: "Admin Dashboard",
    footer_mobile: "Mobile Apps",
    footer_about: "About Us",
    footer_blog: "Blog",
    footer_careers: "Careers",
    footer_partners: "Partners",
    footer_help: "Help Center",
    footer_docs: "Documentation",
    footer_api: "API Reference",
    footer_status: "System Status",
    footer_copyright: "© 2026 Najaah. All rights reserved.",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms of Service",
    footer_cookies: "Cookie Policy",
  },

  ar: {
    // Nav
    nav_features: "المميزات",
    nav_how_it_works: "كيف يعمل",
    nav_platform: "المنصة",
    nav_ai: "أدوات الذكاء الاصطناعي",
    nav_faq: "الأسئلة الشائعة",
    nav_contact: "تواصل معنا",
    nav_signin: "تسجيل الدخول",
    nav_trial: "ابدأ تجربتك المجانية",

    // Hero
    hero_badge: "منصة تعليمية مدعومة بالذكاء الاصطناعي",
    hero_title_1: "الطريقة الأذكى",
    hero_title_2: "للتعليم والتعلم",
    hero_desc:
      "نظام إدارة تعلم متكامل مع اختبارات مولّدة بالذكاء الاصطناعي، ومحتوى فيديو وPDF محمي بتقنية DRM، وبنية متعددة المستأجرين — مصمم للمراكز التعليمية الجاهزة للتوسع.",
    hero_cta_primary: "ابدأ مجاناً ←",
    hero_cta_secondary: "استكشف المنصة",
    hero_stat_1_value: "+500 ألف",
    hero_stat_1_label: "درس تم تقديمه",
    hero_stat_2_value: "98%",
    hero_stat_2_label: "رضا العملاء",
    hero_stat_3_value: "99.9%",
    hero_stat_3_label: "وقت التشغيل",

    // Hero Card
    hero_card_name: "سارة أحمد",
    hero_card_role: "الصف الحادي عشر — المسار العلمي",
    hero_card_progress: "مكتمل 78%",
    hero_course_1: "الرياضيات المتقدمة",
    hero_course_1_meta: "24 درس • 6 اختبارات",
    hero_course_2: "الفيزياء — الميكانيكا",
    hero_course_2_meta: "18 درس • 4 اختبارات",
    hero_course_3: "الأدب العربي",
    hero_course_3_meta: "20 درس • 5 اختبارات",
    hero_float_ai: "اختبار مولّد بالذكاء الاصطناعي",
    hero_float_ai_sub: "15 سؤال جاهز",
    hero_float_score: "نتيجة آخر اختبار",

    // Trust Bar
    trust_header: "موثوق من قادة التعليم",
    trust_metric_1_value: "+50",
    trust_metric_1_label: "مركز تعليمي",
    trust_metric_2_value: "+25,000",
    trust_metric_2_label: "طالب نشط",
    trust_metric_3_value: "+1,200",
    trust_metric_3_label: "دورة منشورة",
    trust_metric_4_value: "+2 مليون",
    trust_metric_4_label: "اختبار مكتمل",
    trust_badge_1: "معتمد من Widevine DRM",
    trust_badge_2: "بث FairPlay",
    trust_badge_3: "بنية AWS التحتية",
    trust_badge_4: "دعم العربية والإنجليزية",

    // Features
    features_tag: "مميزات المنصة",
    features_title: "كل ما يحتاجه مركزك للنجاح",
    features_desc:
      "مجموعة أدوات متكاملة لإدارة الدورات، وإشراك الطلاب، وحماية المحتوى، وتنمية أعمالك التعليمية بثقة.",
    feature_1_title: "مولّد الاختبارات بالذكاء الاصطناعي",
    feature_1_desc:
      "ارفع المحتوى أو الامتحانات السابقة أو المواد الدراسية — يحلل الذكاء الاصطناعي كل شيء ويولّد اختبارات شاملة بأنواع أسئلة متعددة ومستويات صعوبة وتصحيح فوري. وفّر أكثر من 20 ساعة أسبوعياً.",
    feature_2_title: "حماية الفيديو بتقنية DRM",
    feature_2_desc:
      "تشفير Widevine و FairPlay على مستوى المؤسسات يحمي محتوى الفيديو من القرصنة وتسجيل الشاشة والمشاركة غير المصرح بها.",
    feature_3_title: "توزيع PDF محمي",
    feature_3_desc:
      "توزيع آمن للمستندات مع قيود التحميل والعلامات المائية وضوابط الوصول للحفاظ على أمان موادك الدراسية.",
    feature_4_title: "تعدد المستأجرين مع العلامة البيضاء",
    feature_4_desc:
      "يحصل كل مركز على تجربته الخاصة — نطاق فرعي مخصص، وشعار، وألوان، وعزل كامل عن المستأجرين الآخرين.",
    feature_5_title: "تحليلات متقدمة",
    feature_5_desc:
      "لوحات معلومات فورية تتبع تقدم الطلاب ومعدلات إكمال الدورات وأداء الاختبارات ومقاييس التفاعل.",
    feature_6_title: "إدارة الاشتراكات",
    feature_6_desc:
      "خطط تسعير مرنة ومعالجة المدفوعات وإدارة دورة حياة الاشتراك مدمجة مباشرة في المنصة.",
    feature_7_title: "إدارة المعلمين والموظفين",
    feature_7_desc:
      "التحكم في الوصول المستند إلى الأدوار للمدرسين والمسؤولين وموظفي الدعم مع صلاحيات دقيقة لكل دورة أو مركز.",
    feature_8_title: "تجربة الجوال أولاً",
    feature_8_desc:
      "تطبيقات جوال بجودة أصلية مبنية بـ Flutter. يتعلم الطلاب في أي مكان وأي وقت — مع دعم العمل دون اتصال للمحتوى المحمّل.",
    feature_9_title: "إشعارات ذكية",
    feature_9_desc:
      "إشعارات دفع تلقائية وتذكيرات بالبريد الإلكتروني وتنبيهات المواعيد النهائية تحافظ على تفاعل الطلاب ومتابعتهم لتعلمهم.",

    // How it works
    how_tag: "كيف يعمل",
    how_title: "انطلق في دقائق، لا أشهر",
    how_desc: "شغّل منصتك التعليمية بأربع خطوات بسيطة فقط.",
    how_step_1_title: "أنشئ مركزك",
    how_step_1_desc:
      "سجّل، وخصص علامتك التجارية وألوانك وشعارك ليتوافق مع هويتك.",
    how_step_2_title: "ارفع المحتوى",
    how_step_2_desc:
      "أضف دورات الفيديو وملفات PDF والمواد. تُطبق حماية DRM تلقائياً.",
    how_step_3_title: "ولّد الاختبارات",
    how_step_3_desc:
      "دع الذكاء الاصطناعي يحلل محتواك ويولّد اختبارات وتقييمات شاملة تلقائياً.",
    how_step_4_title: "ادعُ الطلاب",
    how_step_4_desc:
      "شارك رابط منصتك. ينضم الطلاب ويسجلون في الدورات ويبدؤون التعلم فوراً.",

    // Platform Showcase
    platform_tag: "لوحة التحكم",
    platform_title: "إدارة قوية، بسيطة وجميلة",
    platform_desc:
      "تحكم في مركزك التعليمي بلوحة إدارة بديهية مصممة للكفاءة. راقب كل شيء من لوحة واحدة.",
    platform_feature_1_title: "تحليلات فورية",
    platform_feature_1_desc:
      "تتبع التسجيلات ومعدلات الإكمال والإيرادات بنظرة واحدة",
    platform_feature_2_title: "تجميع الدورات",
    platform_feature_2_desc: "اجمع الدورات معاً بخيارات تسعير مرنة",
    platform_feature_3_title: "العمليات الجماعية",
    platform_feature_3_desc: "أدر الطلاب والدورات والمحتوى على نطاق واسع",
    platform_feature_4_title: "متعدد اللغات",
    platform_feature_4_desc: "دعم كامل للعربية RTL وخيارات واجهة إنجليزية",

    // AI Section
    ai_tag: "مدعوم بالذكاء الاصطناعي",
    ai_title: "اختبارات تكتب نفسها",
    ai_desc:
      "يحلل الذكاء الاصطناعي محتواك التعليمي والامتحانات السابقة وأهداف التعلم لتوليد تقييمات عالية الجودة مخصصة لمنهجك تلقائياً. يوفر المعلمون أكثر من 20 ساعة أسبوعياً.",
    ai_feature_1: "توليد تلقائي من المحتوى المرفوع والامتحانات السابقة",
    ai_feature_2: "أنواع أسئلة متعددة مع صعوبة قابلة للتعديل",
    ai_feature_3: "تصحيح فوري مع شروحات تفصيلية",
    ai_feature_4: "تحليلات الأداء لكل طالب وسؤال",
    ai_feature_5: "دعم اللغة العربية لمناهج الشرق الأوسط",
    ai_cta: "جرّب مولّد الاختبارات ←",

    // DRM Section
    drm_tag: "أمان المؤسسات",
    drm_title: "محتواك، محمي بالكامل",
    drm_desc:
      "تقنية DRM على مستوى المؤسسات مدعومة من Bunny Stream تضمن حماية دورات الفيديو ومواد PDF من القرصنة وتسجيل الشاشة والمشاركة غير المصرح بها — لتركز على التدريس.",
    drm_feature_1: "Widevine L1 DRM",
    drm_feature_2: "بث FairPlay",
    drm_feature_3: "كشف تسجيل الشاشة",
    drm_feature_4: "مكافحة الانعكاس",
    drm_feature_5: "مصادقة الرمز المميز",
    drm_feature_6: "القيود الجغرافية",
    drm_feature_7: "علامات مائية على PDF",
    drm_feature_8: "روابط وصول منتهية الصلاحية",

    // FAQ
    faq_tag: "الأسئلة الشائعة",
    faq_title: "الأسئلة المتكررة",
    faq_desc:
      "لديك أسئلة؟ لدينا إجابات. إليك أكثر الأشياء التي يسألنا عنها الناس.",
    faq_q1: "كم بسرعة يمكنني إطلاق مركزي التعليمي؟",
    faq_a1:
      "معظم المراكز تعمل بالكامل خلال 24-48 ساعة. يساعدك فريق الإعداد في تهيئة علامتك التجارية واستيراد المحتوى الحالي وتكوين دوراتك. إذا كان المحتوى جاهزاً، يمكنك العمل في نفس اليوم.",
    faq_q2: "هل محتوى الفيديو الخاص بي محمي فعلاً من القرصنة؟",
    faq_a2:
      "نعم. نستخدم نفس تقنية DRM المستخدمة في Netflix و Disney+ (Widevine و FairPlay). محتواك مشفر، وتسجيل الشاشة محظور على الأجهزة المدعومة، ونكتشف محاولات التقاط أو مشاركة المحتوى بشكل غير قانوني.",
    faq_q3: "كيف يعمل مولّد الاختبارات بالذكاء الاصطناعي؟",
    faq_a3:
      "ارفع مواد الدورة أو الامتحانات السابقة أو أدلة الدراسة. يقرأ الذكاء الاصطناعي ويفهم المحتوى، ثم يولّد أسئلة اختبار بصيغ متعددة (اختيار من متعدد، صح/خطأ، إجابة قصيرة). يمكنك تعديل الصعوبة وإضافة شروحات وتحرير أي سؤال قبل النشر.",
    faq_q4: "هل يمكنني استخدام نطاقي وعلامتي التجارية الخاصة؟",
    faq_a4:
      "بالتأكيد. يحصل كل مركز على نطاق فرعي مخصص (yourschool.najaah.me) أو يمكنك ربط نطاقك الخاص. أنت تتحكم في شعارك وألوانك والتجربة البصرية بالكامل. الطلاب لا يرون علامة نجاح — إنها منصتك 100%.",
    faq_q5: "هل تدعمون اللغة العربية وتخطيطات RTL؟",
    faq_a5:
      "نعم، المنصة ثنائية اللغة بالكامل مع دعم عربي أصلي. الواجهة وتطبيقات الطلاب ولوحة الإدارة كلها تعمل بسلاسة في وضع RTL (من اليمين لليسار). كثير من مراكزنا تخدم طلاباً ناطقين بالعربية في جميع أنحاء الشرق الأوسط.",
    faq_q6: "ما نوع الدعم الذي تقدمونه؟",
    faq_a6:
      "يحصل كل مركز على دعم إعداد مخصص وتوثيق ودعم بالبريد الإلكتروني/الدردشة. تتضمن الخطط المميزة دعماً ذا أولوية مع أوقات استجابة أسرع ودعم هاتفي ومدير نجاح مخصص للمراكز الأكبر.",

    // Testimonials
    testimonials_tag: "شهادات العملاء",
    testimonials_title: "موثوق من المعلمين في الشرق الأوسط",
    testimonials_desc:
      "اسمع من المراكز التعليمية التي تحوّل طريقة تدريسها ونموها بالفعل.",
    testimonial_1:
      "نجاح حوّل عملياتنا بالكامل. مولّد الاختبارات بالذكاء الاصطناعي وحده وفّر لمعلمينا أكثر من 25 ساعة أسبوعياً. انتقلنا من معاناة القرصنة إلى السيطرة الكاملة على محتوانا. تضاعف عدد طلابنا منذ إطلاقنا على المنصة.",
    testimonial_1_name: "أحمد خليل",
    testimonial_1_role: "مدير، أكاديمية النور",
    testimonial_1_location: "الإسكندرية، مصر",
    testimonial_2:
      "أخيراً، منصة تأخذ حماية الفيديو على محمل الجد. لم نواجه أي مشاكل قرصنة منذ التحويل. نظام DRM صلب كالصخر.",
    testimonial_2_name: "فاطمة منصور",
    testimonial_2_role: "الرئيس التنفيذي، LearnFirst Education",
    testimonial_2_location: "الرياض، المملكة العربية السعودية",
    testimonial_3:
      "ميزة العلامة البيضاء مذهلة. طلابنا لا يعرفون حتى أنها منصة طرف ثالث. تبدو كأنها منصتنا تماماً.",
    testimonial_3_name: "عمر سعيد",
    testimonial_3_role: "مؤسس، TechEd Institute",
    testimonial_3_location: "دبي، الإمارات",
    testimonial_4:
      "دعم RTL العربي لا تشوبه شائبة. طلابنا ومعلمونا يحبون مدى طبيعية كل شيء. أفضل نظام LMS استخدمناه على الإطلاق.",
    testimonial_4_name: "هنا الراشد",
    testimonial_4_role: "المدير الأكاديمي",
    testimonial_4_location: "عمّان، الأردن",

    // Contact
    contact_tag: "ابدأ الآن",
    contact_title: "لنبني شيئاً عظيماً معاً",
    contact_desc:
      "مستعد لتحويل مركزك التعليمي؟ أخبرنا عن احتياجاتك وسنصمم الحل المثالي لك.",
    contact_chat: "تحدث معنا",
    contact_chat_sub: "نستجيب عادة خلال ساعات قليلة",
    contact_email: "support@najaah.me",
    contact_email_sub: "راسلنا في أي وقت",
    contact_phone: "+20 123 456 7890",
    contact_phone_sub: "الأحد–الخميس، 9 ص – 6 م (توقيت القاهرة)",
    contact_location: "الإسكندرية، مصر",
    contact_location_sub: "نخدم المراكز التعليمية حول العالم",
    contact_form_title: "أرسل لنا رسالة",
    contact_form_subtitle: "أخبرنا عن مركزك وسنرد عليك بحل مخصص.",
    contact_form_name: "الاسم الكامل",
    contact_form_name_placeholder: "اسمك",
    contact_form_email: "البريد الإلكتروني",
    contact_form_email_placeholder: "you@example.com",
    contact_form_center: "اسم المركز",
    contact_form_center_placeholder: "مركزك التعليمي",
    contact_form_students: "عدد الطلاب",
    contact_form_students_placeholder: "اختر النطاق",
    contact_form_students_1: "أقل من 100",
    contact_form_students_2: "100 – 500",
    contact_form_students_3: "500 – 1,000",
    contact_form_students_4: "1,000 – 5,000",
    contact_form_students_5: "+5,000",
    contact_form_message: "الرسالة",
    contact_form_message_placeholder: "أخبرنا عن احتياجاتك...",
    contact_form_submit: "إرسال الرسالة ←",

    // CTA
    cta_title: "مستعد لتحويل مركزك التعليمي؟",
    cta_desc:
      "انضم إلى قادة التعليم في الشرق الأوسط الذين يستخدمون نجاح بالفعل لتقديم تجارب تعلم أفضل وحماية محتواهم.",
    cta_primary: "ابدأ تجربتك المجانية ←",
    cta_secondary: "استكشف المنصة",
    cta_note: "لا حاجة لبطاقة ائتمان • تجربة مجانية 14 يوماً • إلغاء في أي وقت",

    // Footer
    footer_desc:
      "منصة التعلم الذكية المبنية للمراكز التعليمية الحديثة. اختبارات مدعومة بالذكاء الاصطناعي، وDRM على مستوى المؤسسات، وتعدد مستأجرين بالعلامة البيضاء.",
    footer_product: "المنتج",
    footer_company: "الشركة",
    footer_support: "الدعم",
    footer_features: "المميزات",
    footer_ai_quiz: "مولّد الاختبارات",
    footer_drm: "حماية DRM",
    footer_dashboard: "لوحة التحكم",
    footer_mobile: "تطبيقات الجوال",
    footer_about: "من نحن",
    footer_blog: "المدونة",
    footer_careers: "الوظائف",
    footer_partners: "الشركاء",
    footer_help: "مركز المساعدة",
    footer_docs: "التوثيق",
    footer_api: "مرجع API",
    footer_status: "حالة النظام",
    footer_copyright: "© 2026 نجاح. جميع الحقوق محفوظة.",
    footer_privacy: "سياسة الخصوصية",
    footer_terms: "شروط الخدمة",
    footer_cookies: "سياسة ملفات تعريف الارتباط",
  },
};

// Language Manager
const LangManager = {
  currentLang: "en",

  init() {
    // Check localStorage or browser preference
    const saved = localStorage.getItem("najaah_lang");
    const browserLang = navigator.language.startsWith("ar") ? "ar" : "en";
    this.currentLang = saved || browserLang;
    this.apply();
  },

  toggle() {
    this.currentLang = this.currentLang === "en" ? "ar" : "en";
    localStorage.setItem("najaah_lang", this.currentLang);
    this.apply();
  },

  setLang(lang) {
    if (lang === "en" || lang === "ar") {
      this.currentLang = lang;
      localStorage.setItem("najaah_lang", lang);
      this.apply();
    }
  },

  apply() {
    const t = translations[this.currentLang];
    const isRTL = this.currentLang === "ar";

    // Set HTML direction and lang
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = this.currentLang;

    // Update all elements with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (t[key]) {
        el.textContent = t[key];
      }
    });

    // Update placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (t[key]) {
        el.placeholder = t[key];
      }
    });

    // Update language toggle button
    const langBtn = document.getElementById("lang-toggle");
    if (langBtn) {
      langBtn.textContent = isRTL ? "EN" : "عربي";
      langBtn.setAttribute(
        "aria-label",
        isRTL ? "تبديل اللغة" : "Switch language",
      );
    }

    // Add RTL-specific styles
    document.body.classList.toggle("rtl", isRTL);
  },
};

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => LangManager.init());
