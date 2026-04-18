const ideaInput = document.getElementById("idea");
const languageSelect = document.getElementById("languageSelect");
const submitBtn = document.getElementById("submitBtn");
const validateBtn = document.getElementById("validateBtn");
const budgetBtn = document.getElementById("budgetBtn");
const businessTypeInput = document.getElementById("businessType");
const teamSizeInput = document.getElementById("teamSize");
const locationTypeInput = document.getElementById("locationType");
const resultCards = document.getElementById("resultCards");
const outputSection = document.getElementById("outputSection");
const chatWidgetRoot = document.getElementById("chatWidgetRoot");
const statusText = document.getElementById("status");
const spinner = document.getElementById("spinner");
const REQUEST_TIMEOUT_MS = 10000;

const conversationHistory = [];
let lastIdeaContext = "";
let activeChatMode = "legal";
let currentPlan = null;
let currentValidation = null;
let currentBudget = null;
let chatMessages = [];
let currentQuestionInput = "";
let isQuestionLoading = false;
let isChatOpen = false;
let roadmapToast = null;
let roadmapToastTimer = null;
let currentLanguage = resolveInitialLanguage();

const ROADMAP_GAME_KEY = "roadmap-gamification";

const translations = {
    en: {
        language: "Language",
        heroBadge: "AI Operating Partner",
        heroTitle: "Startup AI Co-Founder",
        heroCopy: "Turn a raw startup idea into a structured launch plan with legal, financial, market, and execution guidance in one flow.",
        ideaInput: "Idea Input",
        describeIdea: "Describe your startup concept",
        shortcut: "Press Ctrl/Cmd + Enter to submit.",
        startupIdea: "Startup idea",
        ideaPlaceholder: "Example: AI assistant for local retail stores to automate WhatsApp customer support",
        businessType: "Business Type",
        teamSize: "Team Size",
        location: "Location",
        generatePlan: "Generate Plan",
        validateIdea: "Validate Idea",
        getBudgetPlan: "Get Budget Plan",
        generatedOutput: "Generated Output",
        workspaceTitle: "AI Co-founder Workspace",
        workspaceNote: "Generate the playbook, then ask focused questions in the floating chat.",
        emptyTitle: "Start by selecting a question or asking your own",
        emptyCopy: "Validate the idea, get a budget plan, or generate the playbook first to unlock guided questions and structured answers.",
        executionPlan: "Execution Plan",
        executionCopy: "Follow the roadmap week by week. Each phase is broken into practical tasks you can execute directly.",
        keyOngoing: "Key ongoing actions",
        ideaValidator: "Idea Validator",
        validationCopy: "Use this as a fast decision filter before spending more time or capital.",
        overallRating: "Overall Rating",
        finalVerdict: "Final Verdict",
        improvementSuggestions: "Improvement Suggestions",
        budgetTool: "Budget Tool",
        budgetCopy: "Use this to estimate runway, funding path, and relevant Indian schemes before you commit capital.",
        legalGuide: "Legal Setup Guide",
        legalGuideCopy: "A simple India-first checklist based on your business type so you can handle registration, GST, and basic compliance without overload.",
        businessRegistration: "Business Registration Process",
        gstChecklist: "GST Checklist",
        licenseFinder: "License Finder",
        documentTemplates: "Document Templates",
        legalTools: "Tools / Websites",
        businessSnapshot: "Business Type",
        operatingIn: "Operating In",
        indiaDefault: "India",
        extraCompliance: "Extra Compliance Watch",
        gstWhenRequired: "When GST needs attention",
        gstDocuments: "Documents to keep ready",
        templateUseNow: "Use now",
        estimatedCost: "Estimated Startup Cost",
        monthlyBurn: "Monthly Burn",
        breakEven: "Break-even Time",
        development: "Development",
        team: "Team",
        ops: "Ops",
        fundingOptions: "Funding Options",
        governmentSchemes: "Government Schemes",
        costOptimized: "Cost-Optimized Strategy",
        highGrowth: "High-Growth Strategy",
        keyInsights: "Key Insights",
        questions: "Questions",
        askCofounder: "Ask the AI Co-founder",
        askCopy: "Click a suggested question or ask your own. Every answer is rendered as a structured action card.",
        smartSuggestion: "Smart Suggestion",
        askPlaceholder: "Ask your AI co-founder anything about your startup...",
        send: "Send",
        sending: "Sending...",
        thinking: "AI Co-founder is thinking...",
        answers: "Answers",
        interactiveQA: "Interactive Q&A",
        interactiveCopy: "User question on top, structured AI answer below. Previous Q&A blocks stay visible for quick reference.",
        yourQuestion: "Your Question",
        aiCofounder: "AI Co-founder",
        suggested: "Suggested",
        validationReady: "Validation report ready.",
        budgetReady: "Budget report ready.",
        playbookReady: "Playbook ready.",
        enterIdea: "Enter an idea first.",
        enterIdeaForChat: "Enter your startup idea before asking questions.",
        requestFailed: "Request failed.",
        validationFailed: "Validation failed.",
        budgetFailed: "Budget calculation failed.",
        answerReady: "Answer ready.",
        answerFailed: "Answer failed.",
        gettingAnswer: "Getting AI co-founder answer...",
        generatingStatus: "Generating startup plan...",
        validatingStatus: "Validating startup idea...",
        budgetingStatus: "Calculating budget and funding plan...",
        generatingTitle: "Generating",
        generatingCopy: "The AI co-founder is preparing your playbook and interactive Q&A workspace.",
        validatingTitle: "Validating",
        validatingCopy: "The AI co-founder is scoring demand, competition, risk, investment need, and success probability.",
        calculatingTitle: "Calculating",
        calculatingCopy: "The AI co-founder is estimating startup cost, monthly burn, break-even, funding options, and relevant Indian schemes.",
        errorTitle: "Error",
        startupExecutionRoadmap: "Startup Execution Roadmap",
        requestTimedOut: "Request timed out.",
        planGenerationFailed: "Plan generation failed.",
        noResponse: "No response generated. Try again.",
        validationGenerationFailed: "Idea validation failed.",
        noValidation: "No validation report generated. Try again.",
        budgetGenerationFailed: "Budget calculation failed.",
        noBudget: "No budget report generated. Try again.",
        chatRequestFailed: "Chat request failed.",
        somethingWentWrong: "Something went wrong",
        chatWelcome: "Hi! I’m your AI Co-founder",
        chatWelcomeCopy: "Ask anything about your startup, or start with one of these guided prompts.",
        chatLauncher: "Open AI Co-founder chat",
        closeChat: "Close chat",
        chatTyping: "AI is typing...",
        chatAskHeader: "Suggested questions",
        chatInputPlaceholder: "Ask your AI co-founder anything about your startup...",
        chatPanelHint: "Always available",
        newPrompt: "New"
        ,roadmapProgress: "Overall Progress"
        ,roadmapXp: "XP Earned"
        ,roadmapLevel: "Level"
        ,roadmapBadges: "Badges"
        ,roadmapStreak: "Execution Streak"
        ,roadmapNoBadges: "No badges yet"
        ,roadmapDoneText: "You are %s% done"
        ,roadmapWeekDone: "Week completed"
        ,badgeStarter: "Starter"
        ,badgeConsistent: "Consistent"
        ,badgeExecutor: "Executor"
        ,badgeFinisher: "Finisher"
    },
    hi: {
        language: "भाषा",
        heroBadge: "AI ऑपरेटिंग पार्टनर",
        heroTitle: "स्टार्टअप AI को-फाउंडर",
        heroCopy: "कच्चे स्टार्टअप आइडिया को लीगल, फाइनेंशियल, मार्केट और एग्जीक्यूशन गाइडेंस के साथ स्ट्रक्चर्ड प्लान में बदलें।",
        ideaInput: "आइडिया इनपुट",
        describeIdea: "अपने स्टार्टअप कॉन्सेप्ट का विवरण दें",
        shortcut: "सबमिट करने के लिए Ctrl/Cmd + Enter दबाएँ।",
        startupIdea: "स्टार्टअप आइडिया",
        ideaPlaceholder: "उदाहरण: लोकल रिटेल स्टोर्स के लिए WhatsApp कस्टमर सपोर्ट ऑटोमेट करने वाला AI असिस्टेंट",
        businessType: "बिजनेस टाइप",
        teamSize: "टीम साइज",
        location: "लोकेशन",
        generatePlan: "प्लान बनाएं",
        validateIdea: "आइडिया वैलिडेट करें",
        getBudgetPlan: "बजट प्लान लें",
        generatedOutput: "जेनरेटेड आउटपुट",
        workspaceTitle: "AI को-फाउंडर वर्कस्पेस",
        workspaceNote: "पहले प्लेबुक बनाएं, फिर floating chat में फोकस्ड सवाल पूछें।",
        emptyTitle: "किसी सवाल को चुनकर या अपना सवाल लिखकर शुरू करें",
        emptyCopy: "पहले आइडिया वैलिडेट करें, बजट प्लान लें या प्लेबुक बनाएं ताकि गाइडेड जवाब और टूल्स खुल सकें।",
        executionPlan: "एक्जीक्यूशन प्लान",
        executionCopy: "रोडमैप को हफ्ते-दर-हफ्ते फॉलो करें। हर फेज़ में ऐसे टास्क हैं जिन्हें आप सीधे कर सकते हैं।",
        keyOngoing: "मुख्य ongoing actions",
        ideaValidator: "आइडिया वैलिडेटर",
        validationCopy: "समय या पैसा लगाने से पहले इसे तेज निर्णय फ़िल्टर की तरह उपयोग करें।",
        overallRating: "ओवरऑल रेटिंग",
        finalVerdict: "अंतिम निर्णय",
        improvementSuggestions: "सुधार सुझाव",
        budgetTool: "बजट टूल",
        budgetCopy: "रनवे, फंडिंग पाथ और भारतीय सरकारी स्कीम्स का अनुमान लगाने के लिए इसका उपयोग करें।",
        legalGuide: "लीगल सेटअप गाइड",
        legalGuideCopy: "आपके बिजनेस टाइप के हिसाब से भारत-केंद्रित आसान checklist ताकि आप registration, GST और basic compliance को बिना overload के समझ सकें।",
        businessRegistration: "बिजनेस रजिस्ट्रेशन प्रोसेस",
        gstChecklist: "GST चेकलिस्ट",
        licenseFinder: "लाइसेंस फाइंडर",
        documentTemplates: "डॉक्यूमेंट टेम्पलेट्स",
        legalTools: "टूल्स / वेबसाइट्स",
        businessSnapshot: "बिजनेस टाइप",
        operatingIn: "ऑपरेटिंग इन",
        indiaDefault: "भारत",
        extraCompliance: "अतिरिक्त compliance watch",
        gstWhenRequired: "GST पर कब ध्यान दें",
        gstDocuments: "तैयार रखने वाले डॉक्यूमेंट्स",
        templateUseNow: "अभी उपयोग करें",
        estimatedCost: "अनुमानित स्टार्टअप कॉस्ट",
        monthlyBurn: "मासिक बर्न",
        breakEven: "ब्रेक-ईवन समय",
        development: "डेवलपमेंट",
        team: "टीम",
        ops: "ऑप्स",
        fundingOptions: "फंडिंग विकल्प",
        governmentSchemes: "सरकारी योजनाएँ",
        costOptimized: "कॉस्ट-ऑप्टिमाइज्ड रणनीति",
        highGrowth: "हाई-ग्रोथ रणनीति",
        keyInsights: "मुख्य इनसाइट्स",
        questions: "सवाल",
        askCofounder: "AI को-फाउंडर से पूछें",
        askCopy: "किसी सुझाए गए सवाल पर क्लिक करें या अपना सवाल पूछें। हर जवाब स्ट्रक्चर्ड कार्ड में दिखेगा।",
        smartSuggestion: "स्मार्ट सजेशन",
        askPlaceholder: "अपने स्टार्टअप के बारे में AI को-फाउंडर से कुछ भी पूछें...",
        send: "भेजें",
        sending: "भेजा जा रहा है...",
        thinking: "AI को-फाउंडर सोच रहा है...",
        answers: "जवाब",
        interactiveQA: "इंटरैक्टिव Q&A",
        interactiveCopy: "ऊपर यूज़र का सवाल, नीचे स्ट्रक्चर्ड AI जवाब। पिछले Q&A ब्लॉक्स भी दिखते रहेंगे।",
        yourQuestion: "आपका सवाल",
        aiCofounder: "AI को-फाउंडर",
        suggested: "सुझाव",
        validationReady: "वैलिडेशन रिपोर्ट तैयार है।",
        budgetReady: "बजट रिपोर्ट तैयार है।",
        playbookReady: "प्लेबुक तैयार है।",
        enterIdea: "पहले एक आइडिया लिखें।",
        enterIdeaForChat: "सवाल पूछने से पहले अपना स्टार्टअप आइडिया लिखें।",
        requestFailed: "रिक्वेस्ट फेल हुई।",
        validationFailed: "वैलिडेशन फेल हुआ।",
        budgetFailed: "बजट कैलकुलेशन फेल हुआ।",
        answerReady: "जवाब तैयार है।",
        answerFailed: "जवाब नहीं मिला।",
        gettingAnswer: "AI को-फाउंडर जवाब तैयार कर रहा है...",
        generatingStatus: "स्टार्टअप प्लान बनाया जा रहा है...",
        validatingStatus: "स्टार्टअप आइडिया वैलिडेट किया जा रहा है...",
        budgetingStatus: "बजट और फंडिंग प्लान निकाला जा रहा है...",
        generatingTitle: "बनाया जा रहा है",
        generatingCopy: "AI को-फाउंडर आपका प्लेबुक और इंटरैक्टिव Q&A वर्कस्पेस तैयार कर रहा है।",
        validatingTitle: "वैलिडेट किया जा रहा है",
        validatingCopy: "AI को-फाउंडर demand, competition, risk, investment need और success probability स्कोर कर रहा है।",
        calculatingTitle: "कैलकुलेट किया जा रहा है",
        calculatingCopy: "AI को-फाउंडर startup cost, monthly burn, break-even, funding options और relevant Indian schemes का estimate बना रहा है।",
        errorTitle: "त्रुटि",
        startupExecutionRoadmap: "स्टार्टअप एग्जीक्यूशन रोडमैप",
        requestTimedOut: "रिक्वेस्ट टाइम आउट हो गई।",
        planGenerationFailed: "प्लान जनरेट नहीं हुआ।",
        noResponse: "कोई जवाब नहीं मिला। फिर से कोशिश करें।",
        validationGenerationFailed: "आइडिया वैलिडेशन फेल हुआ।",
        noValidation: "कोई वैलिडेशन रिपोर्ट नहीं बनी। फिर से कोशिश करें।",
        budgetGenerationFailed: "बजट कैलकुलेशन फेल हुआ।",
        noBudget: "कोई बजट रिपोर्ट नहीं बनी। फिर से कोशिश करें।",
        chatRequestFailed: "चैट रिक्वेस्ट फेल हुई।",
        somethingWentWrong: "कुछ गलत हो गया।",
        chatWelcome: "Hi! मैं आपका AI Co-founder हूँ",
        chatWelcomeCopy: "अपने startup के बारे में कुछ भी पूछें, या इन guided prompts से शुरू करें।",
        chatLauncher: "AI Co-founder chat खोलें",
        closeChat: "चैट बंद करें",
        chatTyping: "AI जवाब लिख रहा है...",
        chatAskHeader: "Suggested questions",
        chatInputPlaceholder: "अपने AI co-founder से अपने startup के बारे में कुछ भी पूछें...",
        chatPanelHint: "हमेशा उपलब्ध",
        newPrompt: "New"
        ,roadmapProgress: "ओवरऑल प्रोग्रेस"
        ,roadmapXp: "XP कमाया"
        ,roadmapLevel: "लेवल"
        ,roadmapBadges: "बैज"
        ,roadmapStreak: "एग्जीक्यूशन स्ट्रीक"
        ,roadmapNoBadges: "अभी कोई बैज नहीं"
        ,roadmapDoneText: "आप %s% पूरे कर चुके हैं"
        ,roadmapWeekDone: "हफ्ता पूरा हुआ"
        ,badgeStarter: "Starter"
        ,badgeConsistent: "Consistent"
        ,badgeExecutor: "Executor"
        ,badgeFinisher: "Finisher"
    },
    hinglish: {
        language: "Language",
        heroBadge: "AI Operating Partner",
        heroTitle: "Startup AI Co-Founder",
        heroCopy: "Raw startup idea ko legal, financial, market aur execution guidance ke saath structured plan me badlo.",
        ideaInput: "Idea Input",
        describeIdea: "Apna startup concept describe karo",
        shortcut: "Submit karne ke liye Ctrl/Cmd + Enter dabao.",
        startupIdea: "Startup idea",
        ideaPlaceholder: "Example: Local retail stores ke liye WhatsApp customer support automate karne wala AI assistant",
        businessType: "Business Type",
        teamSize: "Team Size",
        location: "Location",
        generatePlan: "Plan Banao",
        validateIdea: "Idea Validate Karo",
        getBudgetPlan: "Budget Plan Lo",
        generatedOutput: "Generated Output",
        workspaceTitle: "AI Co-founder Workspace",
        workspaceNote: "Pehle playbook banao, phir floating chat me focused questions poochho.",
        emptyTitle: "Kisi question ko select karke ya apna question likhkar shuru karo",
        emptyCopy: "Pehle idea validate karo, budget plan lo, ya playbook generate karo taaki guided tools unlock ho sakein.",
        executionPlan: "Execution Plan",
        executionCopy: "Roadmap ko week by week follow karo. Har phase me practical tasks diye gaye hain.",
        keyOngoing: "Key ongoing actions",
        ideaValidator: "Idea Validator",
        validationCopy: "Time ya paisa lagane se pehle ise fast decision filter ki tarah use karo.",
        overallRating: "Overall Rating",
        finalVerdict: "Final Verdict",
        improvementSuggestions: "Improvement Suggestions",
        budgetTool: "Budget Tool",
        budgetCopy: "Runway, funding path aur Indian government schemes samajhne ke liye use karo.",
        legalGuide: "Legal Setup Guide",
        legalGuideCopy: "Tumhare business type ke hisaab se simple India-first checklist, taaki registration, GST aur basic compliance clear rahe.",
        businessRegistration: "Business Registration Process",
        gstChecklist: "GST Checklist",
        licenseFinder: "License Finder",
        documentTemplates: "Document Templates",
        legalTools: "Tools / Websites",
        businessSnapshot: "Business Type",
        operatingIn: "Operating In",
        indiaDefault: "India",
        extraCompliance: "Extra Compliance Watch",
        gstWhenRequired: "GST par kab dhyan dena hai",
        gstDocuments: "Ready rakhne wale documents",
        templateUseNow: "Use now",
        estimatedCost: "Estimated Startup Cost",
        monthlyBurn: "Monthly Burn",
        breakEven: "Break-even Time",
        development: "Development",
        team: "Team",
        ops: "Ops",
        fundingOptions: "Funding Options",
        governmentSchemes: "Government Schemes",
        costOptimized: "Cost-Optimized Strategy",
        highGrowth: "High-Growth Strategy",
        keyInsights: "Key Insights",
        questions: "Questions",
        askCofounder: "AI Co-founder se poochho",
        askCopy: "Suggested question pe click karo ya apna question poochho. Har answer structured card me aayega.",
        smartSuggestion: "Smart Suggestion",
        askPlaceholder: "Apne startup ke baare me AI co-founder se kuch bhi poochho...",
        send: "Send",
        sending: "Sending...",
        thinking: "AI Co-founder soch raha hai...",
        answers: "Answers",
        interactiveQA: "Interactive Q&A",
        interactiveCopy: "Upar user question, niche structured AI answer. Previous Q&A blocks visible rahenge.",
        yourQuestion: "Tumhara Question",
        aiCofounder: "AI Co-founder",
        suggested: "Suggested",
        validationReady: "Validation report ready hai.",
        budgetReady: "Budget report ready hai.",
        playbookReady: "Playbook ready hai.",
        enterIdea: "Pehle idea likho.",
        enterIdeaForChat: "Questions poochhne se pehle apna startup idea likho.",
        requestFailed: "Request fail ho gayi.",
        validationFailed: "Validation fail ho gaya.",
        budgetFailed: "Budget calculation fail ho gaya.",
        answerReady: "Answer ready hai.",
        answerFailed: "Answer fail ho gaya.",
        gettingAnswer: "AI co-founder answer prepare kar raha hai...",
        generatingStatus: "Startup plan generate ho raha hai...",
        validatingStatus: "Startup idea validate ho raha hai...",
        budgetingStatus: "Budget aur funding plan calculate ho raha hai...",
        generatingTitle: "Generating",
        generatingCopy: "AI co-founder tumhara playbook aur interactive Q&A workspace prepare kar raha hai.",
        validatingTitle: "Validating",
        validatingCopy: "AI co-founder demand, competition, risk, investment need aur success probability score kar raha hai.",
        calculatingTitle: "Calculating",
        calculatingCopy: "AI co-founder startup cost, monthly burn, break-even, funding options aur relevant Indian schemes estimate kar raha hai.",
        errorTitle: "Error",
        startupExecutionRoadmap: "Startup Execution Roadmap",
        requestTimedOut: "Request time out ho gayi.",
        planGenerationFailed: "Plan generate nahi hua.",
        noResponse: "Koi response nahi mila. Dobara try karo.",
        validationGenerationFailed: "Idea validation fail ho gaya.",
        noValidation: "Validation report generate nahi hui. Dobara try karo.",
        budgetGenerationFailed: "Budget calculation fail ho gaya.",
        noBudget: "Budget report generate nahi hui. Dobara try karo.",
        chatRequestFailed: "Chat request fail ho gayi.",
        somethingWentWrong: "Kuch galat ho gaya.",
        chatWelcome: "Hi! Main tumhara AI Co-founder hoon",
        chatWelcomeCopy: "Apne startup ke baare me kuch bhi poochho, ya in guided prompts se start karo.",
        chatLauncher: "AI Co-founder chat kholo",
        closeChat: "Chat band karo",
        chatTyping: "AI type kar raha hai...",
        chatAskHeader: "Suggested questions",
        chatInputPlaceholder: "Apne AI co-founder se apne startup ke baare me kuch bhi poochho...",
        chatPanelHint: "Hamesha available",
        newPrompt: "New"
        ,roadmapProgress: "Overall Progress"
        ,roadmapXp: "XP Earned"
        ,roadmapLevel: "Level"
        ,roadmapBadges: "Badges"
        ,roadmapStreak: "Execution Streak"
        ,roadmapNoBadges: "Abhi koi badge nahi"
        ,roadmapDoneText: "Tum %s% complete kar chuke ho"
        ,roadmapWeekDone: "Week complete ho gaya"
        ,badgeStarter: "Starter"
        ,badgeConsistent: "Consistent"
        ,badgeExecutor: "Executor"
        ,badgeFinisher: "Finisher"
    }
};

const CHAT_MODES = {
    legal: {
        label: "Legal",
        quickActions: [
            "Business Registration Process",
            "Legal Requirements",
            "Licenses and Compliance",
            "Privacy Policy and Terms"
        ]
    },
    product: {
        label: "Product",
        quickActions: [
            "MVP Features",
            "User Onboarding Flow",
            "Core Product Roadmap",
            "Technical Stack Decisions"
        ]
    },
    marketing: {
        label: "Marketing",
        quickActions: [
            "Go-To-Market Strategy",
            "First Customer Acquisition",
            "Positioning and Messaging",
            "Growth Experiments"
        ]
    },
    finance: {
        label: "Finance",
        quickActions: [
            "Funding Options",
            "Pricing Model",
            "Revenue Strategy",
            "Cost Planning"
        ]
    },
    mentor: {
        label: "Mentor",
        quickActions: [
            "Should I quit my job?",
            "How do I find my first customer?",
            "How should I price my product?",
            "Is my idea worth pursuing?"
        ]
    }
};

function resolveInitialLanguage() {
    const saved = window.localStorage.getItem("lang");
    if (saved) {
        return saved;
    }
    const browserLanguage = (navigator.language || "en").toLowerCase();
    if (browserLanguage.startsWith("hi")) {
        return "hi";
    }
    if (browserLanguage.startsWith("mr")) {
        return "mr";
    }
    if (browserLanguage.startsWith("gu")) {
        return "gu";
    }
    return "en";
}

function t(key) {
    const current = translations[currentLanguage] || {};
    const english = translations.en || {};
    return current[key] || english[key] || key;
}

function safeStorageGet(key) {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function safeStorageSet(key, value) {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Keep the UI working even if storage is unavailable.
    }
}

function applyStaticTranslations() {
    document.querySelector(".hero-badge").textContent = t("heroBadge");
    document.querySelector(".hero h1").textContent = t("heroTitle");
    document.querySelector(".hero-copy").textContent = t("heroCopy");
    document.querySelector(".composer .panel-kicker").textContent = t("ideaInput");
    document.querySelector(".composer h2").textContent = t("describeIdea");
    document.querySelector(".composer .panel-note").innerHTML = `${t("shortcut").replace("Ctrl/Cmd + Enter", "<span>Ctrl/Cmd + Enter</span>")}`;
    document.querySelector('label[for="idea"]').textContent = t("startupIdea");
    ideaInput.placeholder = t("ideaPlaceholder");
    document.querySelector('label[for="businessType"]').textContent = t("businessType");
    document.querySelector('label[for="teamSize"]').textContent = t("teamSize");
    document.querySelector('label[for="locationType"]').textContent = t("location");
    updateSelectOptions();
    submitBtn.textContent = t("generatePlan");
    validateBtn.textContent = t("validateIdea");
    budgetBtn.textContent = t("getBudgetPlan");
    document.querySelector(".results .panel-kicker").textContent = t("generatedOutput");
    document.querySelector(".results h2").textContent = t("workspaceTitle");
    document.querySelector(".results .panel-note").textContent = t("workspaceNote");
    document.querySelector('label[for="languageSelect"]').textContent = t("language");
}

function updateSelectOptions() {
    const dictionaries = {
        en: {
            businessType: ["SaaS", "Marketplace", "E-commerce", "Service", "Other"],
            teamSize: ["1–3", "4–10", "10+"],
            location: ["India Tier 1", "India Tier 2", "Remote"]
        },
        hi: {
            businessType: ["SaaS", "मार्केटप्लेस", "ई-कॉमर्स", "सर्विस", "अन्य"],
            teamSize: ["1–3", "4–10", "10+"],
            location: ["भारत टियर 1", "भारत टियर 2", "रिमोट"]
        },
        hinglish: {
            businessType: ["SaaS", "Marketplace", "E-commerce", "Service", "Other"],
            teamSize: ["1–3", "4–10", "10+"],
            location: ["India Tier 1", "India Tier 2", "Remote"]
        }
    };
    const labels = dictionaries[currentLanguage] || dictionaries.en;
    Array.from(businessTypeInput.options).forEach((option, index) => {
        option.textContent = labels.businessType[index] || dictionaries.en.businessType[index];
    });
    Array.from(teamSizeInput.options).forEach((option, index) => {
        option.textContent = labels.teamSize[index] || dictionaries.en.teamSize[index];
    });
    Array.from(locationTypeInput.options).forEach((option, index) => {
        option.textContent = labels.location[index] || dictionaries.en.location[index];
    });
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (text !== undefined) {
        element.textContent = text;
    }
    return element;
}

function createMessageCard(title, content) {
    const article = createElement("article", "result-card");
    article.appendChild(createElement("h3", "", title));
    article.appendChild(createElement("p", "", content));
    return article;
}

function normalizeList(items) {
    return Array.isArray(items) ? items.filter((item) => typeof item === "string" && item.trim()) : [];
}

function uniqueFirst(items, limit) {
    return [...new Set(items.filter(Boolean))].slice(0, limit);
}

function summarize(text, fallback) {
    if (!text || !text.trim()) {
        return fallback;
    }

    const normalized = text.trim();
    return normalized.length <= 120 ? normalized : normalized.slice(0, 117).trimEnd() + "...";
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function extractIdeaKeywords(idea) {
    if (!idea) {
        return [];
    }

    return [...new Set(
        idea.toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((word) => word.length > 3)
    )].slice(0, 6);
}

function inferStartupLabel(idea) {
    if (!idea || !idea.trim()) {
        return "this startup";
    }

    const normalized = idea.trim().replace(/\s+/g, " ");
    return normalized.length <= 56 ? normalized : normalized.slice(0, 53).trimEnd() + "...";
}

function buildPromptFromQuickAction(mode, action, idea) {
    const label = inferStartupLabel(idea);
    const templates = {
        legal: {
            "Business Registration Process": `How do I register ${label} in India? Include the process, documents, official websites, and execution tips.`,
            "Legal Requirements": `What legal requirements should I handle before launching ${label}? Include documents, tools, and practical tips.`,
            "Licenses and Compliance": `What licenses, approvals, or compliance checks might ${label} need in India? Include official websites and requirements.`,
            "Privacy Policy and Terms": `What policies, contracts, and legal documents should I prepare first for ${label}?`
        },
        product: {
            "MVP Features": `What should the MVP for ${label} include first?`,
            "User Onboarding Flow": `How should I design the first user onboarding flow for ${label}?`,
            "Core Product Roadmap": `What should the first 90-day product roadmap look like for ${label}?`,
            "Technical Stack Decisions": `How should I choose the initial tech stack and architecture for ${label}?`
        },
        marketing: {
            "Go-To-Market Strategy": `What go-to-market strategy should I use first for ${label}?`,
            "First Customer Acquisition": `How can I get the first customers for ${label}?`,
            "Positioning and Messaging": `How should I position ${label} and shape the messaging?`,
            "Growth Experiments": `What growth experiments should I run first for ${label}?`
        },
        finance: {
            "Funding Options": `What funding options make sense for ${label} right now?`,
            "Pricing Model": `How should I design the first pricing model for ${label}?`,
            "Revenue Strategy": `What revenue strategy should I validate first for ${label}?`,
            "Cost Planning": `How should I plan startup costs and runway for ${label}?`
        },
        mentor: {
            "Should I quit my job?": `Should I quit my job to work on ${label} full time? Give a direct answer, realistic risks, mistakes to avoid, and a practical action plan.`,
            "How do I find my first customer?": `How should I get the first customer for ${label}? Give mentor-style advice with mistakes to avoid and a practical action plan.`,
            "How should I price my product?": `How should I price ${label} right now? Give a direct recommendation, common pricing mistakes, and a practical action plan.`,
            "Is my idea worth pursuing?": `Is ${label} worth pursuing right now? Give a direct recommendation using the current startup context, mistakes to avoid, and a practical action plan.`
        }
    };

    return (templates[mode] && templates[mode][action]) || `Help me with ${action.toLowerCase()} for ${label}.`;
}

function displayChatModeLabel(mode) {
    const labels = {
        en: { legal: "Legal", product: "Product", marketing: "Marketing", finance: "Finance", mentor: "Mentor" },
        hi: { legal: "लीगल", product: "प्रोडक्ट", marketing: "मार्केटिंग", finance: "फाइनेंस", mentor: "मेंटर" },
        hinglish: { legal: "Legal", product: "Product", marketing: "Marketing", finance: "Finance", mentor: "Mentor" }
    };
    return (labels[currentLanguage] || labels.en)[mode] || mode;
}

function displayQuickActionLabel(mode, action) {
    const labels = {
        hi: {
            "Business Registration Process": "बिजनेस रजिस्ट्रेशन प्रोसेस",
            "Legal Requirements": "लीगल रिक्वायरमेंट्स",
            "Licenses and Compliance": "लाइसेंस और कंप्लायंस",
            "Privacy Policy and Terms": "प्राइवेसी पॉलिसी और टर्म्स",
            "MVP Features": "MVP फीचर्स",
            "User Onboarding Flow": "यूज़र ऑनबोर्डिंग फ्लो",
            "Core Product Roadmap": "कोर प्रोडक्ट रोडमैप",
            "Technical Stack Decisions": "टेक्निकल स्टैक डिसीज़न्स",
            "Go-To-Market Strategy": "गो-टू-मार्केट स्ट्रैटेजी",
            "First Customer Acquisition": "पहले कस्टमर लाना",
            "Positioning and Messaging": "पोजिशनिंग और मैसेजिंग",
            "Growth Experiments": "ग्रोथ एक्सपेरिमेंट्स",
            "Funding Options": "फंडिंग विकल्प",
            "Pricing Model": "प्राइसिंग मॉडल",
            "Revenue Strategy": "रेवेन्यू स्ट्रैटेजी",
            "Cost Planning": "कॉस्ट प्लानिंग",
            "Should I quit my job?": "क्या मुझे नौकरी छोड़ देनी चाहिए?",
            "How do I find my first customer?": "पहला कस्टमर कैसे मिले?",
            "How should I price my product?": "प्रोडक्ट की प्राइसिंग कैसे करूँ?",
            "Is my idea worth pursuing?": "क्या यह आइडिया pursue करना चाहिए?"
        }
    };
    return (labels[currentLanguage] || {})[action] || action;
}

function buildIdeaSuggestions(idea, mode) {
    const label = inferStartupLabel(idea);
    const keywords = extractIdeaKeywords(idea);
    const keywordHint = keywords[0] || "startup";

    const prompts = {
        legal: [
            `How do I register ${label} in India?`,
            `What documents are needed before launch for ${label}?`,
            `What licenses could ${label} require?`
        ],
        product: [
            `What should the MVP for ${label} include first?`,
            `How do I prioritize features for a ${keywordHint} product MVP?`,
            `What should the onboarding flow look like for ${label}?`
        ],
        marketing: [
            `How can I get the first customers for ${label}?`,
            `What go-to-market strategy fits a ${keywordHint} startup?`,
            `How should I position ${label} against alternatives?`
        ],
        finance: [
            `How can I monetize ${label} early?`,
            `Which funding options fit ${label} best?`,
            `How should I price ${label} in the first phase?`
        ],
        mentor: [
            `Should I quit my job for ${label} right now?`,
            `Is ${label} worth pursuing based on my current progress?`,
            `What is the biggest mistake I should avoid next for ${label}?`
        ]
    };

    return prompts[mode] || [];
}

function parseStructuredResponse(text) {
    const normalized = (text || "").trim();
    const sections = [];
    let current = { key: "Title", lines: [] };
    const orderedKeys = ["Title", "Direct Answer", "Reasoning", "Common Mistakes to Avoid", "Action Plan", "Step-by-Step Process", "Requirements / Documents", "Tools / Websites", "Key Insights / Tips", "Next Step"];

    normalized.split(/\r?\n/).forEach((rawLine) => {
        const line = rawLine.trim();
        if (!line) {
            return;
        }

        const matchedKey = orderedKeys.find((key) => line.toLowerCase().startsWith(key.toLowerCase()));
        if (matchedKey) {
            if (current.lines.length) {
                sections.push(current);
            }
            current = { key: matchedKey, lines: [] };
            const remainder = line.includes(":") ? line.substring(line.indexOf(":") + 1).trim() : "";
            if (remainder) {
                current.lines.push(remainder.replace(/^[-•]\s*/, ""));
            }
            return;
        }

        if (/^(direct answer|reasoning|common mistakes to avoid|action plan|steps|requirements|tools|tips|next you can ask)\b/i.test(line)) {
            const map = {
                "direct answer": "Direct Answer",
                reasoning: "Reasoning",
                "common mistakes to avoid": "Common Mistakes to Avoid",
                "action plan": "Action Plan",
                steps: "Step-by-Step Process",
                requirements: "Requirements / Documents",
                tools: "Tools / Websites",
                tips: "Key Insights / Tips",
                "next you can ask": "Next Step"
            };
            const matched = Object.keys(map).find((key) => line.toLowerCase().startsWith(key));
            if (current.lines.length) {
                sections.push(current);
            }
            current = { key: map[matched], lines: [] };
            const remainder = line.includes(":") ? line.substring(line.indexOf(":") + 1).trim() : "";
            if (remainder) {
                current.lines.push(remainder.replace(/^[-•]\s*/, ""));
            }
            return;
        }

        current.lines.push(line.replace(/^[-•]\s*/, ""));
    });

    if (current.lines.length) {
        sections.push(current);
    }

    if (!sections.length) {
        return [{ key: "Key Insights / Tips", lines: [normalized] }];
    }

    return sections;
}

function renderSectionLines(section) {
    if (section.key === "Title") {
        return `<div class="answer-title">${escapeHtml(section.lines[0] || "AI Co-founder Answer")}</div>`;
    }

    const items = section.lines.map((line) => {
        if (section.key === "Tools / Websites") {
            return `<li>${formatToolLine(line)}</li>`;
        }
        return `<li>${escapeHtml(line)}</li>`;
    }).join("");

    return `<section class="answer-section"><h4>${escapeHtml(section.key)}</h4><ul>${items}</ul></section>`;
}

function formatToolLine(line) {
    const urlMatch = line.match(/https?:\/\/[^\s]+/);
    if (!urlMatch) {
        return escapeHtml(line);
    }

    const url = urlMatch[0];
    const label = escapeHtml(line.replace(url, "").replace(/\s*[-–]\s*$/, "").trim() || url);
    return `${label} <a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(url)}</a>`;
}

function formatText(key, value) {
    return t(key).replace("%s", String(value));
}

function getRoadmapGameStateKey(idea) {
    const normalized = (idea || "default")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
    return `${ROADMAP_GAME_KEY}:${normalized || "default"}`;
}

function collectRoadmapTasks(plan) {
    const tasks = [];
    const weeks = [];

    (Array.isArray(plan && plan.phases) ? plan.phases : []).forEach((phase, phaseIndex) => {
        (Array.isArray(phase.weeks) ? phase.weeks : []).forEach((week, weekIndex) => {
            const weekId = `p${phaseIndex}-w${weekIndex}`;
            const weekTasks = [];
            normalizeList(week.tasks).forEach((task, taskIndex) => {
                const taskId = `${weekId}-t${taskIndex}`;
                const item = {
                    id: taskId,
                    weekId,
                    phaseIndex,
                    weekIndex,
                    taskIndex,
                    label: task,
                    weekLabel: week.label || `Week ${weekIndex + 1}`
                };
                tasks.push(item);
                weekTasks.push(item);
            });
            weeks.push({
                id: weekId,
                label: week.label || `Week ${weekIndex + 1}`,
                taskIds: weekTasks.map((item) => item.id)
            });
        });
    });

    return { tasks, weeks };
}

function getLevelFromXp(xp) {
    if (xp <= 50) {
        return 1;
    }
    if (xp <= 150) {
        return 2;
    }
    if (xp <= 300) {
        return 3;
    }
    return 4 + Math.floor((xp - 301) / 200);
}

function buildRoadmapBadges(totalCompleted, completedWeeks, totalTasks) {
    const badges = [];
    if (totalCompleted >= 1) {
        badges.push(t("badgeStarter"));
    }
    if (completedWeeks >= 1) {
        badges.push(t("badgeConsistent"));
    }
    if (completedWeeks >= 3) {
        badges.push(t("badgeExecutor"));
    }
    if (totalTasks > 0 && totalCompleted === totalTasks) {
        badges.push(t("badgeFinisher"));
    }
    return badges;
}

function loadRoadmapGameState(idea, plan) {
    const key = getRoadmapGameStateKey(idea);
    const catalog = collectRoadmapTasks(plan);
    const validTaskIds = new Set(catalog.tasks.map((task) => task.id));
    let stored = {};

    try {
        stored = JSON.parse(safeStorageGet(key) || "{}") || {};
    } catch {
        stored = {};
    }

    const completedTasks = Array.isArray(stored.completedTasks)
        ? stored.completedTasks.filter((taskId) => validTaskIds.has(taskId))
        : [];
    const completedSet = new Set(completedTasks);
    const completedWeeks = catalog.weeks.filter((week) => week.taskIds.length && week.taskIds.every((taskId) => completedSet.has(taskId))).length;
    const totalTasks = catalog.tasks.length;
    const totalCompleted = completedTasks.length;
    const progress = totalTasks ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    const xp = (totalCompleted * 10) + (completedWeeks * 30);
    const level = getLevelFromXp(xp);
    const badges = buildRoadmapBadges(totalCompleted, completedWeeks, totalTasks);

    return {
        key,
        completedTasks,
        completedSet,
        completedWeeks,
        totalTasks,
        totalCompleted,
        progress,
        xp,
        level,
        badges,
        streak: Number.isFinite(stored.streak) ? stored.streak : 0,
        lastCompletedDate: typeof stored.lastCompletedDate === "string" ? stored.lastCompletedDate : "",
        catalog
    };
}

function saveRoadmapGameState(idea, state) {
    safeStorageSet(state.key || getRoadmapGameStateKey(idea), JSON.stringify({
        completedTasks: state.completedTasks,
        xp: state.xp,
        level: state.level,
        badges: state.badges,
        streak: state.streak,
        lastCompletedDate: state.lastCompletedDate
    }));
}

function showRoadmapToast(message) {
    roadmapToast = message;
    if (roadmapToastTimer) {
        window.clearTimeout(roadmapToastTimer);
    }
    renderWorkspace();
    roadmapToastTimer = window.setTimeout(() => {
        roadmapToast = null;
        renderWorkspace();
    }, 2400);
}

function toggleRoadmapTask(taskId) {
    if (!currentPlan) {
        return;
    }

    const idea = ideaInput.value.trim();
    const before = loadRoadmapGameState(idea, currentPlan);
    const completedSet = new Set(before.completedTasks);
    const wasCompleted = completedSet.has(taskId);

    if (wasCompleted) {
        completedSet.delete(taskId);
    } else {
        completedSet.add(taskId);
    }

    const recomputed = loadRoadmapGameStateFromTasks(idea, currentPlan, Array.from(completedSet), before);
    saveRoadmapGameState(idea, recomputed);

    if (!wasCompleted && recomputed.completedWeeks > before.completedWeeks) {
        const completedWeek = recomputed.catalog.weeks.find((week) => {
            const beforeDone = week.taskIds.length && week.taskIds.every((id) => before.completedSet.has(id));
            const afterDone = week.taskIds.length && week.taskIds.every((id) => recomputed.completedSet.has(id));
            return !beforeDone && afterDone;
        });
        if (completedWeek) {
            showRoadmapToast(`🎉 ${completedWeek.label} ${t("roadmapWeekDone")}!`);
        }
    }

    renderWorkspace();
}

function loadRoadmapGameStateFromTasks(idea, plan, completedTasks, previousState) {
    const base = loadRoadmapGameState(idea, plan);
    const completedSet = new Set(completedTasks.filter((taskId) => base.catalog.tasks.some((task) => task.id === taskId)));
    const completedWeeks = base.catalog.weeks.filter((week) => week.taskIds.length && week.taskIds.every((taskId) => completedSet.has(taskId))).length;
    const totalTasks = base.catalog.tasks.length;
    const totalCompleted = completedSet.size;
    const progress = totalTasks ? Math.round((totalCompleted / totalTasks) * 100) : 0;
    const xp = (totalCompleted * 10) + (completedWeeks * 30);
    const level = getLevelFromXp(xp);
    const badges = buildRoadmapBadges(totalCompleted, completedWeeks, totalTasks);
    let streak = previousState ? previousState.streak : base.streak;
    let lastCompletedDate = previousState ? previousState.lastCompletedDate : base.lastCompletedDate;

    if (previousState && completedSet.size > previousState.completedSet.size) {
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (lastCompletedDate === today) {
            streak = Math.max(1, streak || 1);
        } else if (lastCompletedDate === yesterday) {
            streak = Math.max(1, streak || 0) + 1;
        } else {
            streak = 1;
        }
        lastCompletedDate = today;
    }

    return {
        ...base,
        completedTasks: Array.from(completedSet),
        completedSet,
        completedWeeks,
        totalTasks,
        totalCompleted,
        progress,
        xp,
        level,
        badges,
        streak,
        lastCompletedDate
    };
}

function createRoadmapGamificationSummary(state) {
    const wrap = createElement("div", "roadmap-game-summary");

    const progressCard = createElement("article", "roadmap-game-card roadmap-game-progress");
    progressCard.appendChild(createElement("div", "budget-metric-label", t("roadmapProgress")));
    progressCard.appendChild(createElement("div", "roadmap-game-value", `${state.progress}%`));
    progressCard.appendChild(createElement("p", "roadmap-game-copy", formatText("roadmapDoneText", state.progress)));
    const bar = createElement("div", "roadmap-game-bar");
    const fill = createElement("div", "roadmap-game-bar-fill");
    fill.style.width = `${state.progress}%`;
    bar.appendChild(fill);
    progressCard.appendChild(bar);
    wrap.appendChild(progressCard);

    const stats = createElement("article", "roadmap-game-card roadmap-game-stats");
    const statGrid = createElement("div", "roadmap-game-stat-grid");
    [
        [t("roadmapXp"), `${state.xp} XP`],
        [t("roadmapLevel"), `Lv ${state.level}`],
        [t("roadmapStreak"), `🔥 ${state.streak || 0}`]
    ].forEach(([label, value]) => {
        const item = createElement("div", "roadmap-game-stat");
        item.appendChild(createElement("div", "budget-metric-label", label));
        item.appendChild(createElement("div", "roadmap-game-stat-value", value));
        statGrid.appendChild(item);
    });
    stats.appendChild(statGrid);
    wrap.appendChild(stats);

    const badgeCard = createElement("article", "roadmap-game-card");
    badgeCard.appendChild(createElement("div", "budget-metric-label", t("roadmapBadges")));
    const badges = createElement("div", "roadmap-game-badges");
    if (!state.badges.length) {
        badges.appendChild(createElement("span", "roadmap-game-badge roadmap-game-badge-empty", t("roadmapNoBadges")));
    } else {
        state.badges.forEach((badge) => badges.appendChild(createElement("span", "roadmap-game-badge", badge)));
    }
    badgeCard.appendChild(badges);
    wrap.appendChild(badgeCard);

    return wrap;
}

function getCurrentExecutionStage() {
    if (!currentPlan || !Array.isArray(currentPlan.phases) || !currentPlan.phases.length) {
        return "Idea";
    }
    const gameState = loadRoadmapGameState(ideaInput.value.trim(), currentPlan);
    const firstIncomplete = gameState.catalog.weeks.find((week) => !week.taskIds.every((taskId) => gameState.completedSet.has(taskId)));
    if (!firstIncomplete) {
        const lastPhase = currentPlan.phases[currentPlan.phases.length - 1];
        return lastPhase && lastPhase.name ? lastPhase.name : "Scale";
    }
    const phase = currentPlan.phases[firstIncomplete.phaseIndex];
    return phase && phase.name ? phase.name : firstIncomplete.label;
}

function buildValidationSummary() {
    if (!currentValidation) {
        return "";
    }
    return `Overall rating: ${currentValidation.overallRating}. Score: ${currentValidation.overallScore}/10. Demand: ${currentValidation.marketDemand ? currentValidation.marketDemand.numericScore : "n/a"}/10. Competition: ${currentValidation.competition ? currentValidation.competition.numericScore : "n/a"}/10. Risk: ${currentValidation.riskLevel ? currentValidation.riskLevel.numericScore : "n/a"}/10. Investment: ${currentValidation.investmentNeed ? currentValidation.investmentNeed.numericScore : "n/a"}/10. Success probability: ${currentValidation.successProbability ? currentValidation.successProbability.numericScore : "n/a"}/10.`;
}

function buildBudgetSummary() {
    if (!currentBudget) {
        return "";
    }
    return `Estimated cost: ${currentBudget.estimatedCostRange}. Monthly burn: ${currentBudget.monthlyBurn}. Break-even: ${currentBudget.breakEvenTime}.`;
}

function createOverviewSection() {
    const section = createElement("section", "qa-overview");
    const gameState = loadRoadmapGameState(ideaInput.value.trim(), currentPlan);
    const header = createElement("div", "qa-section-header");
    const titleWrap = createElement("div");
    titleWrap.appendChild(createElement("div", "section-chip", t("executionPlan")));
    titleWrap.appendChild(createElement("h3", "qa-section-title", currentPlan.title || t("startupExecutionRoadmap")));
    titleWrap.appendChild(createElement("p", "qa-section-copy", t("executionCopy")));
    header.appendChild(titleWrap);
    section.appendChild(header);
    section.appendChild(createRoadmapGamificationSummary(gameState));

    const grid = createElement("div", "roadmap-phase-grid");
    const phases = Array.isArray(currentPlan.phases) ? currentPlan.phases : [];
    phases.forEach((phase, phaseIndex) => {
        const article = createElement("article", "roadmap-phase-card");
        const phaseHeader = createElement("div", "roadmap-phase-header");
        phaseHeader.appendChild(createElement("h4", "", phase.name || "Phase"));
        phaseHeader.appendChild(createElement("div", "roadmap-phase-timeframe", phase.timeframe || ""));
        article.appendChild(phaseHeader);

        if (Array.isArray(phase.weeks) && phase.weeks.length) {
            const weeks = createElement("div", "roadmap-week-list");
            phase.weeks.forEach((week, weekIndex) => {
                const weekCard = createElement("div", "roadmap-week-card");
                weekCard.appendChild(createElement("h5", "", week.label || "Week"));
                const list = createElement("ul");
                normalizeList(week.tasks).forEach((task, taskIndex) => {
                    const taskId = `p${phaseIndex}-w${weekIndex}-t${taskIndex}`;
                    const li = createElement("li", "roadmap-task-item");
                    const label = createElement("label", `roadmap-task-toggle ${gameState.completedSet.has(taskId) ? "completed" : ""}`.trim());
                    const input = document.createElement("input");
                    input.type = "checkbox";
                    input.checked = gameState.completedSet.has(taskId);
                    input.addEventListener("change", () => toggleRoadmapTask(taskId));
                    label.appendChild(input);
                    label.appendChild(createElement("span", "roadmap-task-text", task));
                    li.appendChild(label);
                    list.appendChild(li);
                });
                weekCard.appendChild(list);
                weeks.appendChild(weekCard);
            });
            article.appendChild(weeks);
        }

        const ongoingActions = normalizeList(phase.ongoingActions);
        if (ongoingActions.length) {
            const ongoing = createElement("div", "roadmap-ongoing");
            ongoing.appendChild(createElement("h5", "", t("keyOngoing")));
            const list = createElement("ul");
            ongoingActions.forEach((task) => list.appendChild(createElement("li", "", task)));
            ongoing.appendChild(list);
            article.appendChild(ongoing);
        }

        grid.appendChild(article);
    });
    section.appendChild(grid);
    if (roadmapToast) {
        section.appendChild(createElement("div", "roadmap-toast", roadmapToast));
    }
    return section;
}

function createValidationSection() {
    if (!currentValidation) {
        return null;
    }

    const section = createElement("section", "validator-report");
    const header = createElement("div", "qa-section-header");
    const titleWrap = createElement("div");
    titleWrap.appendChild(createElement("div", "section-chip", t("ideaValidator")));
    titleWrap.appendChild(createElement("h3", "qa-section-title", currentValidation.title || t("ideaValidator")));
    titleWrap.appendChild(createElement("p", "qa-section-copy", t("validationCopy")));
    header.appendChild(titleWrap);

    const overall = createElement("div", `validator-overall rating-${(currentValidation.overallRating || "").toLowerCase()}`.trim());
    overall.appendChild(createElement("div", "validator-rating-label", t("overallRating")));
    overall.appendChild(createElement("div", "validator-rating-value", mapRatingBadge(currentValidation.overallRating)));
    overall.appendChild(createElement("div", "validator-rating-score", `${currentValidation.overallScore || 0}/10`));
    header.appendChild(overall);
    section.appendChild(header);

    const grid = createElement("div", "validator-grid");
    [
        currentValidation.marketDemand,
        currentValidation.competition,
        currentValidation.riskLevel,
        currentValidation.investmentNeed,
        currentValidation.successProbability
    ].forEach((item) => {
        if (!item) {
            return;
        }
        const card = createElement("article", "validator-card");
        card.appendChild(createElement("h4", "", item.label));
        const scoreRow = createElement("div", "validator-score-row");
        scoreRow.appendChild(createElement("span", "validator-score-label", item.scoreLabel));
        scoreRow.appendChild(createElement("span", "validator-score-number", `${item.numericScore}/10`));
        card.appendChild(scoreRow);
        card.appendChild(createElement("p", "", item.explanation));
        grid.appendChild(card);
    });
    section.appendChild(grid);

    const verdict = createElement("div", "validator-verdict");
    verdict.appendChild(createElement("h4", "", t("finalVerdict")));
    verdict.appendChild(createElement("p", "", currentValidation.finalVerdict || ""));
    section.appendChild(verdict);

    const suggestions = createElement("div", "validator-suggestions");
    suggestions.appendChild(createElement("h4", "", t("improvementSuggestions")));
    const list = createElement("ul");
    normalizeList(currentValidation.improvementSuggestions).forEach((item) => list.appendChild(createElement("li", "", item)));
    suggestions.appendChild(list);
    section.appendChild(suggestions);

    return section;
}

function createBudgetSection() {
    if (!currentBudget) {
        return null;
    }

    const section = createElement("section", "budget-report");
    const header = createElement("div", "qa-section-header");
    const titleWrap = createElement("div");
    titleWrap.appendChild(createElement("div", "section-chip", t("budgetTool")));
    titleWrap.appendChild(createElement("h3", "qa-section-title", currentBudget.title || t("budgetTool")));
    titleWrap.appendChild(createElement("p", "qa-section-copy", t("budgetCopy")));
    header.appendChild(titleWrap);
    section.appendChild(header);

    const topGrid = createElement("div", "budget-top-grid");
    topGrid.appendChild(createBudgetMetric(t("estimatedCost"), currentBudget.estimatedCostRange, [
        `${t("development")}: ${currentBudget.breakdown ? currentBudget.breakdown.development : ""}`,
        `${t("team")}: ${currentBudget.breakdown ? currentBudget.breakdown.team : ""}`,
        `${t("ops")}: ${currentBudget.breakdown ? currentBudget.breakdown.operations : ""}`
    ]));
    topGrid.appendChild(createBudgetMetric(t("monthlyBurn"), currentBudget.monthlyBurn, []));
    topGrid.appendChild(createBudgetMetric(t("breakEven"), currentBudget.breakEvenTime, [currentBudget.breakEvenExplanation || ""]));
    section.appendChild(topGrid);

    const funding = createElement("div", "budget-card");
    funding.appendChild(createElement("h4", "", t("fundingOptions")));
    const fundingList = createElement("ul");
    (currentBudget.fundingOptions || []).forEach((item) => {
        fundingList.appendChild(createElement("li", "", `${item.name} – ${item.reason}`));
    });
    funding.appendChild(fundingList);
    section.appendChild(funding);

    const schemes = createElement("div", "budget-card");
    schemes.appendChild(createElement("h4", "", t("governmentSchemes")));
    const schemeList = createElement("ul");
    (currentBudget.governmentSchemes || []).forEach((item) => {
        const li = createElement("li");
        li.innerHTML = `<strong>${escapeHtml(item.name)}</strong> – ${escapeHtml(item.benefit)} – <a href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">${escapeHtml(item.link)}</a>`;
        schemeList.appendChild(li);
    });
    schemes.appendChild(schemeList);
    section.appendChild(schemes);

    const strategyGrid = createElement("div", "budget-strategy-grid");
    strategyGrid.appendChild(createBudgetMetric(t("costOptimized"), currentBudget.costOptimizedStrategy, []));
    strategyGrid.appendChild(createBudgetMetric(t("highGrowth"), currentBudget.aggressiveGrowthStrategy, []));
    section.appendChild(strategyGrid);

    const insights = createElement("div", "budget-card");
    insights.appendChild(createElement("h4", "", t("keyInsights")));
    const insightsList = createElement("ul");
    normalizeList(currentBudget.keyInsights).forEach((item) => insightsList.appendChild(createElement("li", "", item)));
    insights.appendChild(insightsList);
    section.appendChild(insights);

    return section;
}

function createBudgetMetric(title, value, notes) {
    const card = createElement("article", "budget-metric");
    card.appendChild(createElement("div", "budget-metric-label", title));
    card.appendChild(createElement("div", "budget-metric-value", value || ""));
    const cleanNotes = normalizeList(notes);
    if (cleanNotes.length) {
        const list = createElement("ul");
        cleanNotes.forEach((note) => list.appendChild(createElement("li", "", note)));
        card.appendChild(list);
    }
    return card;
}

function getLegalOperatingRegion(locationValue) {
    if (!locationValue || locationValue === "Remote") {
        return `${t("indiaDefault")} (remote-first)`;
    }
    return locationValue;
}

function inferExtraLegalFlags(idea) {
    const text = (idea || "").toLowerCase();
    const flags = [];

    if (/(food|kitchen|restaurant|meal|grocery|beverage|cloud kitchen)/.test(text)) {
        flags.push({
            title: "FSSAI review",
            detail: "If you handle food, beverages, or food delivery, add FSSAI registration through FoSCoS before launch."
        });
    }

    if (/(finance|loan|lending|investment|trading|broker|insurance|payment|upi|wallet)/.test(text)) {
        flags.push({
            title: "Regulated finance review",
            detail: "If you touch lending, investing, insurance, or payments, get a lawyer to check RBI or SEBI rules before onboarding users."
        });
    }

    if (/(health|medical|clinic|doctor|pharma|diagnostic)/.test(text)) {
        flags.push({
            title: "Health-data review",
            detail: "If you collect medical or health records, tighten consent, data handling, and sector-specific approvals before go-live."
        });
    }

    return flags;
}

function getLegalAssistantConfig(businessType, idea) {
    const startupIdea = (idea || "").trim();
    const extraFlags = inferExtraLegalFlags(startupIdea);
    const needsFoodCompliance = extraFlags.some((flag) => flag.title === "FSSAI review") || businessType === "E-commerce";
    const commonDocuments = [
        "PAN card of founder or entity",
        "Aadhaar or ID proof",
        "Address proof for registered office",
        "Bank account details or cancelled cheque",
        "Incorporation papers if you choose LLP or Pvt Ltd"
    ];

    const configs = {
        "SaaS": {
            structure: "Pvt Ltd is the cleanest default if you plan to raise capital. LLP works if you are service-heavy and want lighter compliance.",
            registrationSteps: [
                "Choose your structure: Pvt Ltd for fundraising, LLP for lean operations, Sole Proprietorship only for early solo testing.",
                "Apply for PAN and TAN after entity formation starts.",
                "File incorporation on the MCA portal and collect your Certificate of Incorporation.",
                "Open a current account and keep basic bookkeeping in place from day one.",
                "Add Privacy Policy and Terms before you start taking user signups."
            ],
            gstWhen: "Review GST early if you bill clients across states, sell B2B, export software services, or clients ask for GST invoices.",
            licenses: [
                { name: "Entity registration", detail: "Pvt Ltd or LLP gives cleaner contracts, invoicing, and founder ownership." },
                { name: "Privacy Policy", detail: "Needed if you collect user data, emails, phone numbers, or usage analytics." },
                { name: "Terms & Conditions", detail: "Sets user rules, payment terms, and liability boundaries." }
            ]
        },
        "Marketplace": {
            structure: "Pvt Ltd is usually the safest default because vendor contracts, payments, and due diligence get heavier fast.",
            registrationSteps: [
                "Choose Pvt Ltd unless you are still testing as a very small solo operator.",
                "Apply for PAN, TAN, and complete MCA incorporation.",
                "Open a business bank account before routing marketplace payouts.",
                "Set up seller onboarding documents and marketplace terms.",
                "Apply for Startup India recognition after incorporation if you qualify."
            ],
            gstWhen: "Treat GST as an early priority. Online marketplace flows usually need GST review before you start collecting or routing payments.",
            licenses: [
                { name: "GST registration", detail: "Usually an early requirement for marketplace invoicing and tax compliance." },
                { name: "Seller or vendor agreement", detail: "Sets commission, returns, delivery liability, and dispute rules." },
                { name: "Privacy Policy and Terms", detail: "Important because you handle buyer, seller, and payment data together." }
            ]
        },
        "E-commerce": {
            structure: "LLP or Pvt Ltd is usually cleaner than a sole proprietorship once inventory, logistics, or team operations increase.",
            registrationSteps: [
                "Pick LLP or Pvt Ltd if you want cleaner vendor contracts and future fundraising flexibility.",
                "Apply for PAN and TAN, then complete MCA registration if you are forming LLP or Pvt Ltd.",
                "Open a business bank account before taking customer payments.",
                "Register GST early if you plan to sell online through your own store or marketplaces.",
                "Add return, refund, shipping, and privacy policies before launch."
            ],
            gstWhen: "For most e-commerce setups, GST should be handled early rather than later, especially if you sell online across states or through marketplaces.",
            licenses: [
                { name: "GST registration", detail: "Usually one of the first items to clear for online selling." },
                { name: "Shop and Establishment registration", detail: "Often required at state or local level if you run a physical office or store." },
                { name: "FSSAI", detail: "Add this if you sell food, beverages, supplements, or packaged consumables." }
            ]
        },
        "Service": {
            structure: "Sole Proprietorship can work for solo services. LLP is better for co-founders. Pvt Ltd is better if you plan to scale or raise money.",
            registrationSteps: [
                "Choose Sole Proprietorship for a simple solo start, LLP for partners, or Pvt Ltd if you want scale and investment readiness.",
                "Get PAN and TAN where applicable, then finish MCA filing if you choose LLP or Pvt Ltd.",
                "Open a current account so business income stays separate from personal income.",
                "Keep service contracts, invoices, and payment terms standard from the first client.",
                "Register under Startup India later if the business becomes innovation-led and eligible."
            ],
            gstWhen: "Review GST once you approach the applicable turnover threshold or when clients expect GST-compliant invoices.",
            licenses: [
                { name: "Basic entity registration", detail: "Pick the lightest structure that still fits your growth plan." },
                { name: "Service agreement", detail: "Defines scope, payment milestones, delays, and IP ownership." },
                { name: "Local registrations", detail: "Check professional tax or local shop registration if your state requires it." }
            ]
        },
        "Other": {
            structure: "If you have co-founders or want funding flexibility, start with LLP or Pvt Ltd. Use Sole Proprietorship only for very small solo experiments.",
            registrationSteps: [
                "Pick the simplest structure that still supports your next 12 months of growth.",
                "Apply for PAN and TAN, then use the MCA portal for LLP or Pvt Ltd registration.",
                "Open a business bank account and keep founder and business money separate.",
                "Check whether your sector needs any approval before taking payments or onboarding users.",
                "Add basic contracts and website policies before public launch."
            ],
            gstWhen: "Check GST before launch if you will invoice businesses, sell online, or operate across states.",
            licenses: [
                { name: "Entity registration", detail: "The right structure reduces cleanup later." },
                { name: "Sector-specific license check", detail: "Look for finance, food, health, education, or local trade approvals." },
                { name: "Privacy Policy and Terms", detail: "Needed once you collect user data or take online payments." }
            ]
        }
    };

    const selected = configs[businessType] || configs.Other;
    const dedupedLicenses = [...selected.licenses, ...extraFlags.map((flag) => ({ name: flag.title, detail: flag.detail }))]
        .filter((item, index, list) => list.findIndex((entry) => entry.name === item.name) === index);
    const tools = [
        { name: "MCA Portal", purpose: "Company or LLP registration", link: "https://www.mca.gov.in/" },
        { name: "GST Portal", purpose: "GST registration and compliance", link: "https://www.gst.gov.in/" },
        { name: "Startup India", purpose: "Recognition, benefits, and startup support", link: "https://www.startupindia.gov.in/" }
    ];
    if (needsFoodCompliance) {
        tools.push({ name: "FSSAI FoSCoS", purpose: "Food license and registration if applicable", link: "https://foscos.fssai.gov.in/" });
    }
    return {
        structure: selected.structure,
        registrationSteps: selected.registrationSteps,
        gstWhen: selected.gstWhen,
        gstDocuments: commonDocuments,
        licenses: dedupedLicenses,
        templates: [
            {
                name: "Privacy Policy",
                summary: "Explain what user data you collect, why you collect it, how long you keep it, and who users can contact."
            },
            {
                name: "Terms & Conditions",
                summary: "Cover usage rules, pricing, refunds, cancellations, liability limits, and account suspension rights."
            },
            {
                name: "Founder Agreement",
                summary: "Fix equity split, roles, vesting, decision rights, and what happens if one founder exits."
            }
        ],
        tools
    };
}

function createLegalCard(title, bodyBuilder) {
    const card = createElement("article", "legal-card");
    card.appendChild(createElement("h4", "", title));
    bodyBuilder(card);
    return card;
}

function appendList(card, items, className = "") {
    const list = createElement("ul", className);
    normalizeList(items).forEach((item) => list.appendChild(createElement("li", "", item)));
    card.appendChild(list);
}

function createLegalAssistantSection() {
    const businessType = businessTypeInput ? businessTypeInput.value : "Other";
    const location = locationTypeInput ? locationTypeInput.value : t("indiaDefault");
    const config = getLegalAssistantConfig(businessType, ideaInput.value);

    const section = createElement("section", "legal-assistant");
    const header = createElement("div", "qa-section-header");
    const titleWrap = createElement("div");
    titleWrap.appendChild(createElement("div", "section-chip", t("legalGuide")));
    titleWrap.appendChild(createElement("h3", "qa-section-title", t("legalGuide")));
    titleWrap.appendChild(createElement("p", "qa-section-copy", t("legalGuideCopy")));
    header.appendChild(titleWrap);

    const summary = createElement("div", "legal-meta-pills");
    summary.appendChild(createElement("div", "legal-pill", `${t("businessSnapshot")}: ${businessType}`));
    summary.appendChild(createElement("div", "legal-pill", `${t("operatingIn")}: ${getLegalOperatingRegion(location)}`));
    header.appendChild(summary);
    section.appendChild(header);

    const grid = createElement("div", "legal-grid");

    grid.appendChild(createLegalCard(t("businessRegistration"), (card) => {
        card.appendChild(createElement("p", "legal-card-copy", config.structure));
        appendList(card, config.registrationSteps);
    }));

    grid.appendChild(createLegalCard(t("gstChecklist"), (card) => {
        card.appendChild(createElement("div", "legal-inline-label", t("gstWhenRequired")));
        card.appendChild(createElement("p", "legal-card-copy", config.gstWhen));
        card.appendChild(createElement("div", "legal-inline-label", t("gstDocuments")));
        appendList(card, config.gstDocuments);
    }));

    grid.appendChild(createLegalCard(t("licenseFinder"), (card) => {
        const list = createElement("ul");
        config.licenses.forEach((item) => {
            const li = createElement("li");
            li.innerHTML = `<strong>${escapeHtml(item.name)}</strong> - ${escapeHtml(item.detail)}`;
            list.appendChild(li);
        });
        card.appendChild(list);
    }));

    grid.appendChild(createLegalCard(t("documentTemplates"), (card) => {
        const list = createElement("div", "legal-template-list");
        config.templates.forEach((item) => {
            const template = createElement("div", "legal-template-item");
            template.appendChild(createElement("div", "legal-inline-label", `${item.name} · ${t("templateUseNow")}`));
            template.appendChild(createElement("p", "legal-card-copy", item.summary));
            list.appendChild(template);
        });
        card.appendChild(list);
    }));

    grid.appendChild(createLegalCard(t("legalTools"), (card) => {
        const list = createElement("ul", "legal-link-list");
        config.tools.forEach((item) => {
            const li = createElement("li");
            li.innerHTML = `<strong>${escapeHtml(item.name)}</strong> - ${escapeHtml(item.purpose)} - <a href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">${escapeHtml(item.link)}</a>`;
            list.appendChild(li);
        });
        card.appendChild(list);
    }));

    section.appendChild(grid);
    return section;
}

function mapRatingBadge(rating) {
    if (rating === "Green") {
        return "🟢 Green";
    }
    if (rating === "Yellow") {
        return "🟡 Yellow";
    }
    return "🔴 Red";
}

function createPromptButton(label, question, directSend = false) {
    const button = createElement("button", "qa-prompt-card");
    button.type = "button";
    const title = createElement("span", "qa-prompt-title", label);
    const text = createElement("span", "qa-prompt-copy", summarize(question, question));
    button.appendChild(title);
    button.appendChild(text);
    button.addEventListener("click", () => {
        currentQuestionInput = question;
        isChatOpen = true;
        renderWorkspace();
        renderChatWidget();
        const input = document.getElementById("cofounderQuestionInput");
        if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
        if (directSend) {
            submitQuestion(question);
        }
    });
    return button;
}

function createAnswerCard(entry) {
    const article = createElement("article", "qa-entry");

    const questionCard = createElement("div", "qa-question-card");
    questionCard.appendChild(createElement("div", "qa-badge qa-badge-user", t("yourQuestion")));
    questionCard.appendChild(createElement("div", "qa-question-text", entry.question));
    article.appendChild(questionCard);

    const answerCard = createElement("div", "qa-answer-card");
    answerCard.appendChild(createElement("div", "qa-badge qa-badge-ai", t("aiCofounder")));

    const content = createElement("div", "qa-answer-content");
    parseStructuredResponse(entry.answer).forEach((section) => {
        const wrapper = createElement("div");
        wrapper.innerHTML = renderSectionLines(section);
        Array.from(wrapper.childNodes).forEach((node) => content.appendChild(node));
    });
    answerCard.appendChild(content);
    article.appendChild(answerCard);

    return article;
}

function createWorkspace() {
    const shell = createElement("div", "qa-workspace");
    shell.appendChild(createLegalAssistantSection());
    const validation = createValidationSection();
    if (validation) {
        shell.appendChild(validation);
    }
    const budget = createBudgetSection();
    if (budget) {
        shell.appendChild(budget);
    }
    const hasRoadmap = currentPlan && Array.isArray(currentPlan.phases) && currentPlan.phases.length;
    if (hasRoadmap) {
        shell.appendChild(createOverviewSection());
    }
    return shell;
}

function renderWorkspace() {
    resultCards.innerHTML = "";
    resultCards.appendChild(createWorkspace());
}

function scrollToOutput() {
    if (!outputSection) {
        return;
    }
    outputSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToLatestAnswer() {
    const messages = chatWidgetRoot.querySelector(".chat-messages");
    if (!messages) {
        return;
    }
    messages.scrollTop = messages.scrollHeight;
}

function resetConversationForIdea(nextIdea) {
    if (lastIdeaContext === nextIdea) {
        return;
    }

    lastIdeaContext = nextIdea;
    conversationHistory.length = 0;
    chatMessages = [];
    currentQuestionInput = "";
    currentValidation = null;
    currentBudget = null;
}

function createChatPromptGrid() {
    const promptGrid = createElement("div", "chat-prompt-grid");
    CHAT_MODES[activeChatMode].quickActions.forEach((action) => {
        const question = buildPromptFromQuickAction(activeChatMode, action, ideaInput.value.trim());
        const button = createPromptButton(displayQuickActionLabel(activeChatMode, action), question);
        button.classList.add("chat-prompt-button");
        promptGrid.appendChild(button);
    });
    buildIdeaSuggestions(ideaInput.value.trim(), activeChatMode).forEach((suggestion) => {
        const button = createPromptButton(t("smartSuggestion"), suggestion, true);
        button.classList.add("chat-prompt-button");
        promptGrid.appendChild(button);
    });
    return promptGrid;
}

function createChatEmptyState() {
    const empty = createElement("div", "chat-empty-state");
    empty.appendChild(createElement("div", "chat-welcome-title", t("chatWelcome")));
    empty.appendChild(createElement("p", "chat-welcome-copy", t("chatWelcomeCopy")));
    empty.appendChild(createChatPromptGrid());
    return empty;
}

function createChatMessages() {
    const messages = createElement("div", "chat-messages");

    if (!chatMessages.length && !isQuestionLoading) {
        messages.appendChild(createChatEmptyState());
        return messages;
    }

    chatMessages.forEach((entry) => {
        const isUser = entry.role === "user";
        const row = createElement("div", `chat-message-row ${isUser ? "chat-message-user" : "chat-message-ai"}`.trim());
        const bubble = createElement("div", `chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}`.trim());
        bubble.appendChild(createElement("div", "chat-bubble-label", isUser ? t("yourQuestion") : t("aiCofounder")));

        if (isUser) {
            bubble.appendChild(createElement("div", "chat-bubble-text", entry.content));
        } else {
            const content = createElement("div", "chat-bubble-structured");
            parseStructuredResponse(entry.content).forEach((section) => {
                const wrapper = createElement("div");
                wrapper.innerHTML = renderSectionLines(section);
                Array.from(wrapper.childNodes).forEach((node) => content.appendChild(node));
            });
            bubble.appendChild(content);
        }

        row.appendChild(bubble);
        messages.appendChild(row);
    });

    if (isQuestionLoading) {
        const typingRow = createElement("div", "chat-message-row chat-message-ai");
        const typingBubble = createElement("div", "chat-bubble chat-bubble-ai chat-typing-bubble");
        typingBubble.appendChild(createElement("div", "chat-bubble-label", t("aiCofounder")));
        const typing = createElement("div", "chat-typing");
        typing.appendChild(createElement("span", "spinner spinner-inline"));
        typing.appendChild(createElement("span", "", t("chatTyping")));
        typingBubble.appendChild(typing);
        typingRow.appendChild(typingBubble);
        messages.appendChild(typingRow);
    }

    return messages;
}

function createChatWidget() {
    const shell = createElement("div", `chat-widget-shell ${isChatOpen ? "open" : ""}`.trim());

    const panel = createElement("section", `chat-panel ${isChatOpen ? "open" : ""}`.trim());
    const header = createElement("div", "chat-panel-header");
    const titleWrap = createElement("div", "chat-panel-titlewrap");
    titleWrap.appendChild(createElement("div", "chat-panel-title", t("aiCofounder")));
    titleWrap.appendChild(createElement("div", "chat-panel-subtitle", t("chatPanelHint")));
    header.appendChild(titleWrap);
    const closeButton = createElement("button", "chat-close-btn", "×");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", t("closeChat"));
    closeButton.addEventListener("click", () => {
        isChatOpen = false;
        renderChatWidget();
    });
    header.appendChild(closeButton);
    panel.appendChild(header);

    const modeTabs = createElement("div", "chat-mode-tabs");
    Object.keys(CHAT_MODES).forEach((mode) => {
        const tab = createElement("button", `chat-mode-tab ${mode === activeChatMode ? "active" : ""}`.trim(), displayChatModeLabel(mode));
        tab.type = "button";
        tab.addEventListener("click", () => {
            activeChatMode = mode;
            renderChatWidget();
        });
        modeTabs.appendChild(tab);
    });
    panel.appendChild(modeTabs);

    const suggestions = createElement("div", "chat-suggestion-strip");
    suggestions.appendChild(createElement("div", "chat-strip-title", t("chatAskHeader")));
    suggestions.appendChild(createChatPromptGrid());
    panel.appendChild(suggestions);

    panel.appendChild(createChatMessages());

    const footer = createElement("div", "chat-panel-footer");
    const input = createElement("textarea", "chat-input");
    input.id = "cofounderQuestionInput";
    input.placeholder = t("chatInputPlaceholder");
    input.value = currentQuestionInput;
    input.addEventListener("input", (event) => {
        currentQuestionInput = event.target.value;
    });
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submitQuestion();
        }
    });
    footer.appendChild(input);

    const send = createElement("button", "chat-send-btn", isQuestionLoading ? t("sending") : t("send"));
    send.type = "button";
    send.disabled = isQuestionLoading;
    send.addEventListener("click", () => submitQuestion());
    footer.appendChild(send);

    panel.appendChild(footer);
    shell.appendChild(panel);

    const fab = createElement("button", "chat-fab");
    fab.type = "button";
    fab.setAttribute("aria-label", t("chatLauncher"));
    fab.innerHTML = `<span class="chat-fab-icon" aria-hidden="true">💬</span>`;
    fab.addEventListener("click", () => {
        isChatOpen = !isChatOpen;
        renderChatWidget();
    });
    if (!isChatOpen && (currentPlan || currentValidation || currentBudget || chatMessages.length)) {
        fab.appendChild(createElement("span", "chat-fab-dot", t("newPrompt")));
    }
    shell.appendChild(fab);

    return shell;
}

function renderChatWidget() {
    chatWidgetRoot.innerHTML = "";
    chatWidgetRoot.appendChild(createChatWidget());
    if (isChatOpen) {
        window.requestAnimationFrame(() => {
            scrollToLatestAnswer();
            const input = document.getElementById("cofounderQuestionInput");
            if (input && !isQuestionLoading) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        });
    }
}

async function readErrorMessage(response, fallbackMessage) {
    try {
        const data = await response.json();
        return data.message || data.error || fallbackMessage;
    } catch {
        const text = await response.text();
        return text || fallbackMessage;
    }
}

async function postJsonWithTimeout(url, payload, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        let data = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        return { response, data };
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(t("requestTimedOut"));
        }
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

async function generatePlan() {
    const idea = ideaInput.value.trim();

    if (!idea) {
        statusText.textContent = t("enterIdea");
        ideaInput.focus();
        return;
    }

    submitBtn.disabled = true;
    validateBtn.disabled = true;
    budgetBtn.disabled = true;
    spinner.classList.remove("hidden");
    statusText.textContent = t("generatingStatus");
    resetConversationForIdea(idea);
    resultCards.innerHTML = "";
    resultCards.appendChild(createMessageCard(t("generatingTitle"), t("generatingCopy")));

    try {
        const { response, data } = await postJsonWithTimeout("/generate", { idea, language: currentLanguage }, REQUEST_TIMEOUT_MS);

        if (!response.ok) {
            throw new Error((data && (data.message || data.error)) || t("planGenerationFailed"));
        }

        if (!data || !data.success || !data.data) {
            throw new Error((data && data.message) || t("noResponse"));
        }

        currentPlan = data.data;
        renderWorkspace();
        scrollToOutput();
        statusText.textContent = t("playbookReady");
    } catch (error) {
        currentPlan = null;
        resultCards.innerHTML = "";
        resultCards.appendChild(createMessageCard(t("errorTitle"), error.message));
        statusText.textContent = t("requestFailed");
    } finally {
        submitBtn.disabled = false;
        validateBtn.disabled = false;
        budgetBtn.disabled = false;
        spinner.classList.add("hidden");
        renderChatWidget();
    }
}

async function validateIdea() {
    const idea = ideaInput.value.trim();

    if (!idea) {
        statusText.textContent = t("enterIdea");
        ideaInput.focus();
        return;
    }

    submitBtn.disabled = true;
    validateBtn.disabled = true;
    budgetBtn.disabled = true;
    spinner.classList.remove("hidden");
    statusText.textContent = t("validatingStatus");
    resetConversationForIdea(idea);
    resultCards.innerHTML = "";
    resultCards.appendChild(createMessageCard(t("validatingTitle"), t("validatingCopy")));

    try {
        const { response, data } = await postJsonWithTimeout("/validate", { idea, language: currentLanguage }, REQUEST_TIMEOUT_MS);

        if (!response.ok) {
            throw new Error((data && (data.message || data.error)) || t("validationGenerationFailed"));
        }

        if (!data || !data.success || !data.data) {
            throw new Error((data && data.message) || t("noValidation"));
        }

        currentValidation = data.data;
        renderWorkspace();
        scrollToOutput();
        statusText.textContent = t("validationReady");
    } catch (error) {
        currentValidation = null;
        resultCards.innerHTML = "";
        resultCards.appendChild(createMessageCard(t("errorTitle"), error.message));
        statusText.textContent = t("validationFailed");
    } finally {
        submitBtn.disabled = false;
        validateBtn.disabled = false;
        budgetBtn.disabled = false;
        spinner.classList.add("hidden");
        renderChatWidget();
    }
}

async function calculateBudget() {
    const idea = ideaInput.value.trim();

    if (!idea) {
        statusText.textContent = t("enterIdea");
        ideaInput.focus();
        return;
    }

    submitBtn.disabled = true;
    validateBtn.disabled = true;
    budgetBtn.disabled = true;
    spinner.classList.remove("hidden");
    statusText.textContent = t("budgetingStatus");
    resetConversationForIdea(idea);
    resultCards.innerHTML = "";
    resultCards.appendChild(createMessageCard(t("calculatingTitle"), t("calculatingCopy")));

    try {
        const { response, data } = await postJsonWithTimeout("/budget", {
            idea,
            businessType: businessTypeInput.value,
            teamSize: teamSizeInput.value,
            location: locationTypeInput.value,
            language: currentLanguage
        }, REQUEST_TIMEOUT_MS);

        if (!response.ok) {
            throw new Error((data && (data.message || data.error)) || t("budgetGenerationFailed"));
        }

        if (!data || !data.success || !data.data) {
            throw new Error((data && data.message) || t("noBudget"));
        }

        currentBudget = data.data;
        renderWorkspace();
        scrollToOutput();
        statusText.textContent = t("budgetReady");
    } catch (error) {
        currentBudget = null;
        resultCards.innerHTML = "";
        resultCards.appendChild(createMessageCard(t("errorTitle"), error.message));
        statusText.textContent = t("budgetFailed");
    } finally {
        submitBtn.disabled = false;
        validateBtn.disabled = false;
        budgetBtn.disabled = false;
        spinner.classList.add("hidden");
        renderChatWidget();
    }
}

async function submitQuestion(prefilledQuestion) {
    const idea = ideaInput.value.trim();
    const question = (prefilledQuestion || currentQuestionInput).trim();

    if (isQuestionLoading) {
        return;
    }

    if (!idea) {
        statusText.textContent = t("enterIdeaForChat");
        isChatOpen = true;
        renderChatWidget();
        ideaInput.focus();
        return;
    }

    if (!question) {
        const input = document.getElementById("cofounderQuestionInput");
        if (input) {
            input.focus();
        }
        return;
    }

    if (!currentPlan) {
        await generatePlan();
        if (!currentPlan) {
            return;
        }
    }

    isQuestionLoading = true;
    isChatOpen = true;
    chatMessages = [...chatMessages, { role: "user", content: question }];
    currentQuestionInput = "";
    renderChatWidget();
    statusText.textContent = t("gettingAnswer");

    try {
        const { response, data } = await postJsonWithTimeout("/chat", {
            idea,
            message: question,
            history: conversationHistory,
            language: currentLanguage,
            mode: activeChatMode,
            currentStage: getCurrentExecutionStage(),
            validationSummary: buildValidationSummary(),
            budgetSummary: buildBudgetSummary()
        }, REQUEST_TIMEOUT_MS);

        if (!response.ok) {
            throw new Error((data && (data.message || data.error)) || t("chatRequestFailed"));
        }

        if (!data || !data.success) {
            throw new Error((data && data.message) || t("somethingWentWrong"));
        }

        const reply = data.data;
        if (!reply || !reply.trim()) {
            throw new Error(t("noResponse"));
        }

        conversationHistory.push({ role: "user", content: question });
        conversationHistory.push({ role: "assistant", content: reply });
        chatMessages = [...chatMessages, { role: "assistant", content: reply }];
        statusText.textContent = t("answerReady");
    } catch (error) {
        chatMessages = [...chatMessages, {
            role: "assistant",
            content: `Title: Request Error\nKey Insights / Tips:\n- ${error.message}\nNext Step:\n- Try the question again or make it more specific.`
        }];
        statusText.textContent = t("answerFailed");
    } finally {
        isQuestionLoading = false;
        renderChatWidget();
        scrollToLatestAnswer();
    }
}

submitBtn.addEventListener("click", generatePlan);
validateBtn.addEventListener("click", validateIdea);
budgetBtn.addEventListener("click", calculateBudget);

languageSelect.value = currentLanguage;
languageSelect.addEventListener("change", (event) => {
    currentLanguage = event.target.value;
    safeStorageSet("lang", currentLanguage);
    applyStaticTranslations();
    renderWorkspace();
    renderChatWidget();
});

applyStaticTranslations();
renderWorkspace();
renderChatWidget();

ideaInput.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        generatePlan();
    }
});

ideaInput.addEventListener("input", () => {
    renderWorkspace();
    renderChatWidget();
});

businessTypeInput.addEventListener("change", () => {
    renderWorkspace();
});

locationTypeInput.addEventListener("change", () => {
    renderWorkspace();
});
