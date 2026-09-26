import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: 'SWASTHYAQUEUE',
    tagline: 'Appointment se Consultation tak — Queue ko Simple Banayein.',
    taglineSub: 'Government Hospital OPD Appointments, Live Token Queues & Scheme Verification',
    login: 'Login / Sign In',
    logout: 'Sign Out',
    home: 'Home',
    patientPortal: 'Patient Portal',
    bookAppointment: 'Book Appointment',
    myAppointments: 'My Appointments',
    liveQueue: 'Check Live Queue',
    doctorAvailability: 'Doctor Availability',
    hospitalGuide: 'Hospital Guide & Pharmacy',
    benefitVerification: 'Check Scheme Benefits',
    staffPortal: 'Hospital Staff',
    doctorPortal: 'Doctor Portal',
    benefitDesk: 'Ayushman / Benefit Desk',
    demoModeNotice: 'Demo / Sandbox Verification Mode Active (Fictional Data for Evaluation)',
    ayushmanDisclaimer:
      'Entering Ayushman Bharat information does not confirm eligibility or guarantee free treatment. Benefits must be verified by the hospital or an authorized scheme system.',
    abhaVsPmjayNotice:
      'Important Distinction: ABHA is a 14-digit digital health ID. PM-JAY is the scheme benefit. An ABHA ID does not mean automatic PM-JAY eligibility or free treatment.',
    currentServing: 'Now Calling / Serving',
    tokenNumber: 'Token Number',
    estimatedWait: 'Estimated Waiting Time',
    waitingDisclaimer: 'Waiting time is an estimate and may change.',
    patientsAhead: 'Patients Ahead',
    room: 'Room',
    floor: 'Floor',
    doctor: 'Doctor',
    department: 'Department',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    checkInNow: 'Check-In to Get Token',
    checkedIn: 'Checked In',
    booked: 'Booked',
    inConsultation: 'In Consultation',
    completed: 'Completed',
    verified: 'Verified (Scheme Active)',
    notVerified: 'Not Verified',
    verificationPending: 'Verification Pending',
    needsHospitalVerification: 'Needs Hospital Verification',
    pharmacyTitle: 'Government Hospital Pharmacy Navigation',
    pharmacyDisclaimer: 'This is ONLY navigation assistance. Does not recommend medicines or prescriptions.',
    patientConditionHelper:
      'Briefly describe your main concern for appointment context. Do not enter unnecessary sensitive information.',
  },
  hi: {
    appName: 'स्वास्थ्यक्यू (SWASTHYAQUEUE)',
    tagline: 'अपॉइंटमेंट से परामर्श तक — कतार को सरल बनाएं।',
    taglineSub: 'सरकारी अस्पताल ओपीडी अपॉइंटमेंट, लाइव टोकन कतार और योजना सत्यापन',
    login: 'लॉग इन करें',
    logout: 'लॉग आउट',
    home: 'मुख्य पृष्ठ',
    patientPortal: 'मरीज़ पोर्टल',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    myAppointments: 'मेरे अपॉइंटमेंट',
    liveQueue: 'लाइव कतार देखें',
    doctorAvailability: 'डॉक्टर उपलब्धता',
    hospitalGuide: 'अस्पताल गाइड और दवा केंद्र',
    benefitVerification: 'स्वास्थ्य योजना लाभ जांचें',
    staffPortal: 'अस्पताल स्टाफ',
    doctorPortal: 'डॉक्टर पोर्टल',
    benefitDesk: 'आयुष्मान / योजना डेस्क',
    demoModeNotice: 'डेमो / सैंडबॉक्स सत्यापन मोड सक्रिय (मूल्यांकन हेतु काल्पनिक डेटा)',
    ayushmanDisclaimer:
      'आयुष्मान भारत की जानकारी दर्ज करने से पात्रता की पुष्टि नहीं होती है और न ही मुफ्त इलाज की गारंटी मिलती है। योजना के लाभ की पुष्टि अस्पताल या अधिकृत योजना प्रणाली द्वारा की जानी आवश्यक है।',
    abhaVsPmjayNotice:
      'महत्वपूर्ण अंतर: आभा (ABHA) एक डिजिटल स्वास्थ्य पहचान है। पीएम-जय (PM-JAY) योजना लाभ है। केवल आभा कार्ड होने का अर्थ मुफ्त इलाज नहीं है।',
    currentServing: 'वर्तमान में देखा जा रहा टोकन',
    tokenNumber: 'टोकन संख्या',
    estimatedWait: 'अनुमानित प्रतीक्षा समय',
    waitingDisclaimer: 'प्रतीक्षा समय केवल एक अनुमान है और परामर्श समय के अनुसार बदल सकता है।',
    patientsAhead: 'आपसे पहले मरीज़',
    room: 'कमरा संख्या',
    floor: 'मंज़िल (फ्लोर)',
    doctor: 'डॉक्टर',
    department: 'विभाग',
    date: 'तारीख',
    time: 'समय',
    status: 'स्थिति',
    checkInNow: 'चेक-इन करें व टोकन लें',
    checkedIn: 'चेक-इन पूर्ण',
    booked: 'बुक हुआ',
    inConsultation: 'परामर्श जारी',
    completed: 'परामर्श संपन्न',
    verified: 'सत्यापित (योजना सक्रिय)',
    notVerified: 'असत्यापित',
    verificationPending: 'सत्यापन प्रक्रियाधीन',
    needsHospitalVerification: 'अस्पताल डेस्क पर सत्यापन आवश्यक',
    pharmacyTitle: 'सरकारी अस्पताल औषधि केंद्र (फार्मेसी) मार्गदर्शिका',
    pharmacyDisclaimer: 'यह केवल अस्पताल में दवा वितरण काउंटर तक पहुंचने का मार्ग है। कोई चिकित्सकीय दवा परामर्श नहीं दिया जाता।',
    patientConditionHelper:
      'अपॉइंटमेंट के संदर्भ के लिए अपनी मुख्य स्वास्थ्य समस्या का संक्षिप्त विवरण दें। अनावश्यक संवेदनशील जानकारी न भरें।',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('swasthya_lang') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('swasthya_lang', lang);
  }, [lang]);

  const t = (key: string): string => {
    return translations[lang][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
