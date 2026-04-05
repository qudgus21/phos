export const locales = [
  "en",
  "zh",
  "es",
  "ar",
  "pt",
  "fr",
  "ja",
  "ru",
  "de",
  "id",
  "ko",
] as const;

export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export interface Dictionary {
  metadata: {
    siteTitle: string;
    siteDescription: string;
    imageEditTitle: string;
    imageEditDescription: string;
    retouchingTitle: string;
    retouchingDescription: string;
    faceEditTitle: string;
    faceEditDescription: string;
    pricingTitle: string;
    pricingDescription: string;
    contactTitle: string;
    contactDescription: string;
  };
  nav: {
    imageEdit: string;
    skinRetouch: string;
    faceEdit: string;
    pricing: string;
    signIn: string;
    signOut: string;
    tagline: string;
    toggleMenu: string;
    switchLanguage: string;
  };
  hero: {
    tags: string[];
    headline: string;
    headlineAccent: string;
    subtitle: string;
    subtitleHighlight: string;
    cta: string;
    ctaHelper: string;
    trustBar: string;
    heroImageAlt: string;
  };
  features: {
    imageEdit: {
      title: string;
      titleAccent: string;
      subtitle: string;
      useCases: {
        tag: string;
        title: string;
        desc: string;
        prompt: string;
      }[];
      inputLabels: string[];
      resultLabel: string;
      aiGenerated: string;
      promptExample: string;
      cta: string;
    };
    skinRetouch: {
      title: string;
      titleAccent: string;
      subtitle: string;
      before: string;
      after: string;
      sliderHint: string;
      hoverHint: string;
      sampleAlt: string;
      cta: string;
    };
    faceSwap: {
      title: string;
      titleAccent: string;
      subtitle: string;
      maskBadge: string;
      aiGenerated: string;
      sampleAlt: string;
      originalAlt: string;
      maskAlt: string;
      resultAlt: string;
      cta: string;
    };
    skinRealism: {
      badge: string;
      title: string;
      titleAccent: string;
      description: string;
      features: { title: string; desc: string }[];
      hoverHint: string;
      imageAlt: string;
      cta: string;
    };
    upscale: {
      title: string;
      subtitlePrefix: string;
      subtitleHighlight: string;
      subtitleSuffix: string;
      badge: string;
      before: string;
      after: string;
      beforeAlt: string;
      afterAlt: string;
      cta: string;
    };
  };
  pricing: {
    title: string;
    tabs: { monthly: string; onetime: string };
    perMonth: string;
    recommended: string;
    plans: {
      free: { description: string; features: string[]; cta: string };
      basic: { description: string; features: string[]; cta: string };
      pro: { description: string; features: string[]; cta: string };
      premium: { description: string; features: string[]; cta: string };
    };
    packs: { cta: string };
    faq: {
      title: string;
      items: { question: string; answer: string }[];
    };
    paymentSuccess: string;
    discordLabel: string;
  };
  contact: {
    title: string;
    description: string;
    iconAlt: string;
    categories: { value: string; label: string }[];
    form: {
      categoryLabel: string;
      categoryPlaceholder: string;
      titleLabel: string;
      titlePlaceholder: string;
      contentLabel: string;
      contentPlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      imageLabel: string;
      imageDragText: string;
      imageFormats: string;
      attachmentAlt: string;
      submit: string;
      submitting: string;
    };
    validation: {
      maxImages: string;
      maxFileSize: string;
      imageOnly: string;
      categoryRequired: string;
      titleRequired: string;
      contentRequired: string;
      emailInvalid: string;
    };
    success: string;
    error: string;
    replyNotice: string;
  };
  auth: {
    signInTitle: string;
    signInSubtitle: string;
    signUpTitle: string;
    signUpSubtitle: string;
    continueWithGoogle: string;
    continueWithFacebook: string;
    or: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    passwordRules: { chars: string; letter: string; number: string };
    signInButton: string;
    signUpButton: string;
    noAccount: string;
    hasAccount: string;
    signUpLink: string;
    signInLink: string;
    termsNotice: string;
    termsLabel: string;
    privacyLabel: string;
    checkEmailTitle: string;
    checkEmailMessage: string;
    resendEmail: string;
    resending: string;
    backToSignIn: string;
    errors: {
      invalidCredentials: string;
      emailNotVerified: string;
      emailExists: string;
      tooManyAttempts: string;
      passwordTooShort: string;
      enterEmail: string;
      invalidEmail: string;
      enterPassword: string;
      passwordRequirements: string;
    };
  };
  common: {
    confirm: string;
    cancel: string;
    save: string;
    saving: string;
    delete: string;
    close: string;
    loading: string;
    credits: string;
    tabs: {
      samples: string;
      favorites: string;
      settings: string;
      input: string;
      result: string;
      history: string;
    };
    confirmModal: {
      defaultTitle: string;
      defaultDescription: string;
      confirmLabel: string;
      cancelLabel: string;
    };
    download: {
      failed: string;
    };
    toast: {
      closeLabel: string;
    };
    errors: {
      authRequired: string;
      insufficientCredits: string;
      generationFailed: string;
      imageProcessing: string;
      uploadRequired: string;
    };
    time: {
      justNow: string;
      minutesAgo: string;
      hoursAgo: string;
      daysAgo: string;
    };
  };
  tools: {
    imageEdit: {
      prompt: string;
      promptPlaceholder: string;
      promptHint: string;
      promptRequired: string;
      custom: string;
      input: string;
      modelSelect: string;
      favoriteLoaded: string;
      workflowSteps: string[];
      zoom: string;
      addToRef: string;
      refImages: string;
      addImage: string;
      extraSettings: string;
      resolution: string;
      ratio: string;
      scale: string;
      count: string;
      countUnit: string;
      resetButton: string;
      creditsPerImage: string;
      generateButton: string;
      generatingButton: string;
      guideTitle: string;
      guideItems: string[];
      guideConfirm: string;
      resetConfirmTitle: string;
      resetConfirmDesc: string;
      resetConfirmLabel: string;
      extraSettingsReset: string;
      refFileAriaLabel: string;
      refImageAlt: string;
      sampleAlts: Record<string, string>;
    };
    retouching: {
      filters: Record<string, string>;
      areas: Record<string, string>;
      genders: Record<string, string>;
      modes: Record<string, string>;
      excludeDefault: string;
      excludeCount: string;
      imageLoadError: string;
      favoriteLoaded: string;
      sampleImage: string;
      uploadImage: string;
      uploadedAlt: string;
      filterSection: string;
      retouchSettings: string;
      reshapeLabel: string;
      excludeSection: string;
      excludeAreaSuffix: string;
      generateButton: string;
      generatingButton: string;
      guideButton: string;
      guideTitle: string;
      guideItems: string[];
      guideConfirm: string;
      imageProcessError: string;
      addToInput: string;
      sampleLabels: Record<string, string>;
    };
    faceEdit: {
      sampleImage: string;
      selectArea: string;
      favoriteLoaded: string;
      header: string;
      uploadPrompt: string;
      selectAreaOverlay: string;
      selectAreaButton: string;
      replaceButton: string;
      deleteButton: string;
      editMaskButton: string;
      extraSettings: string;
      resetSettings: string;
      genderLabel: string;
      strengthLabel: string;
      upscaleLabel: string;
      generateButton: string;
      generatingButton: string;
      guideButton: string;
      guideTitle: string;
      guideItems: string[];
      guideConfirm: string;
      uploadedAlt: string;
      maskAlt: string;
      resultImageLabel: string;
      favoriteImageLabel: string;
      workflowSteps: string[];
      maskEditorTitle: string;
      downloadMask: string;
      brushTool: string;
      eraserTool: string;
      rectTool: string;
      undoTitle: string;
      redoTitle: string;
      brushSizeLabel: string;
      resetCanvas: string;
      saveConfirmMessage: string;
      discardButton: string;
      sampleLabels: Record<string, string>;
    };
    favorites: {
      save: string;
      saveTitle: string;
      namePlaceholder: string;
      usage: string;
      nameRequired: string;
      saved: string;
      deleted: string;
      deleteFailed: string;
      refImages: string;
      saveFailed: string;
      countBadge: string;
      deleteTitle: string;
      deleteDesc: string;
      saveFavTitle: string;
      maxFavTitle: string;
      emptyHint: string;
    };
    history: {
      title: string;
      empty: string;
      generating: string;
      generatingHint: string;
      deleteConfirm: string;
      deleteWarning: string;
      retouchingHistory: string;
      retouchingEmpty: string;
      retouchingEmptyHint: string;
      retouchingSteps: string[];
    };
    resultPanel: {
      resultHeader: string;
      aiResult: string;
      aiRetouchResult: string;
      emptyPromptHint: string;
      emptyUploadHint: string;
      emptyResultHint: string;
      saving: string;
      upscaling: string;
      generating: string;
      retouching: string;
      loadingResult: string;
      upscalingResult: string;
      waitHint: string;
      makingImageHint: string;
      zoomLabel: string;
      closeLabel: string;
      zoomAlt: string;
      downloadingLabel: string;
      before: string;
      after: string;
      singleMode: string;
      compareMode: string;
    };
    pricing: {
      credits: string;
      currentPlan: string;
      defaultPlan: string;
      recommendedBadge: string;
      currentPlanBadge: string;
      canceledBadge: string;
      scheduledBadge: string;
      upgradeButton: string;
      downgradeButton: string;
      manageButton: string;
      buyButton: string;
      upgradeTitle: string;
      upgradeDesc: { basic: string; pro: string; premium: string };
      currentBalance: string;
      additionalCreditsLabel: string;
      additionalCreditsSub: string;
      proportionalNote: string;
      upgradeConfirm: string;
      downgradeTitle: string;
      downgradeCreditsNote: string;
      downgradeScheduleNote: string;
      scheduleConfirm: string;
      upgradeComplete: string;
      planActivated: string;
      creditsAdded: string;
      enjoyFeatures: string;
      startButton: string;
      scheduleComplete: string;
      scheduleApplied: string;
      scheduleCreditsNote: string;
      errorTitle: string;
      networkError: string;
      networkErrorDesc: string;
      portalError: string;
    };
  };
  footer: {
    sections: {
      aiFeatures: string;
      quickLinks: string;
      policies: string;
    };
    links: {
      imageEdit: string;
      skinRetouch: string;
      faceEdit: string;
      home: string;
      pricing: string;
      contact: string;
      terms: string;
      privacy: string;
      dataDeletion: string;
    };
    brand: string;
    contactLink: string;
    copyright: string;
  };
  legal: {
    backToHome: string;
    lastUpdated: string;
    terms: {
      title: string;
      lastUpdated: string;
      sections: { title: string; html: string }[];
    };
    privacy: {
      title: string;
      lastUpdated: string;
      sections: { title: string; html: string }[];
    };
    dataDeletion: {
      title: string;
      lastUpdated: string;
      sections: { title: string; html: string }[];
    };
  };
}
