import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      Settings: "Settings",
      Language: "Language",
      "Preferred Explorer": "Preferred Explorer",
      "Versioned Transaction": "Versioned Transaction",
      "RPC Endpoint": "RPC Endpoint",
      "Select Language": "Select Language",
      "Select Explorer": "Select Explorer",
    },
  },
  cn: {
    translation: {
      Settings: "设置",
      Language: "语言",
      "Preferred Explorer": "首选浏览器",
      "Versioned Transaction": "版本化交易",
      "RPC Endpoint": "RPC 端点",
      "Select Language": "选择语言",
      "Select Explorer": "选择浏览器",
    },
  },
  // Add more languages here
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en", // Default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
