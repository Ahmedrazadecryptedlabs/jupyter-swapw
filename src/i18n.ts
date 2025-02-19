import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
    en: { translation: { welcome: "Welcome" } },
    cn: { translation: { welcome: "欢迎" } },
    jp: { translation: { welcome: "ようこそ" } },
    id: { translation: { welcome: "Selamat Datang" } },
    it: { translation: { welcome: "Benvenuto" } },
    tr: { translation: { welcome: "Hoş Geldiniz" } },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: localStorage.getItem("language") || "en",
        fallbackLng: "en",
        interpolation: { escapeValue: false },
        debug: true, // ✅ Helps you debug errors in the console
    });

export default i18n;
