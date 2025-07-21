// context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';

const themes = {
  light: {
    backgroundColor: '#f0f2f5',
    textColor: '#333',
    cardBackground: 'white',
    inputBackground: '#f9f9f9',
    inputBorder: '#dcdcdc',
    headerBackground: 'linear-gradient(90deg, rgba(3,105,161,1) 0%, rgba(0,123,255,1) 100%)',
    buttonPrimaryBg: '#007bff',
    buttonPrimaryHoverBg: '#0056b3',
    buttonShadowPrimary: 'rgba(0, 123, 255, 0.3)',
    buttonWarningBg: '#ffc107',
    buttonWarningHoverBg: '#e0a800',
    buttonShadowWarning: 'rgba(255, 193, 7, 0.3)',
    resultBorderDefault: '#e0e0e0',
    transitionDuration: '0.3s',
    transitionEase: 'ease-in-out',
  },
  dark: {
    backgroundColor: '#1a1a2e',
    textColor: '#e0e0e0',
    cardBackground: '#262645',
    inputBackground: '#393963',
    inputBorder: '#5a5a8a',
    headerBackground: 'linear-gradient(90deg, #100f22 0%, #2a2a50 100%)',
    buttonPrimaryBg: '#5a5a8a',
    buttonPrimaryHoverBg: '#7a7a9a',
    buttonShadowPrimary: 'rgba(90, 90, 138, 0.3)',
    buttonWarningBg: '#b3882e',
    buttonWarningHoverBg: '#9a7026',
    buttonShadowWarning: 'rgba(179, 136, 46, 0.3)',
    resultBorderDefault: '#393963',
    transitionDuration: '0.3s',
    transitionEase: 'ease-in-out',
  }
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Inisialisasi state tema. Default ke 'light' atau bahkan null di server.
  // Kemudian useEffect akan mengambil nilai sebenarnya dari localStorage.
  const [themeMode, setThemeMode] = useState(null); // <-- Inisialisasi dengan null/default di server

  useEffect(() => {
    // Jalankan kode ini hanya di sisi klien
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('themeMode');
      setThemeMode(storedTheme || 'light'); // Set dari localStorage atau default 'light'
    }
  }, []); // [] agar hanya berjalan sekali saat mount

  useEffect(() => {
    // Simpan tema ke localStorage setiap kali themeMode berubah, juga hanya di klien
    if (typeof window !== 'undefined' && themeMode !== null) { // Hanya simpan jika sudah diinisialisasi
      localStorage.setItem('themeMode', themeMode);
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Gunakan tema default (light) jika themeMode masih null (saat SSR/belum dihydrasi)
  const currentTheme = themeMode === null ? themes.light : themes[themeMode];

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme, theme: currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};