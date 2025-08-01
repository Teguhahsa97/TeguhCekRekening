// pages/tempmail.js
import { useState, useEffect, useRef, useContext } from 'react';
import Link from 'next/link';
import { ThemeContext } from '../context/ThemeContext';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const LS_EMAIL_KEY = 'mailtm_temp_email';
const LS_TOKEN_KEY = 'mailtm_temp_token';
const LS_ACCOUNT_ID_KEY = 'mailtm_temp_account_id';
const LS_PASSWORD_KEY = 'mailtm_temp_password';

// Definisi Keyframes (tetap di sini, atau idealnya di globals.css)
const keyframes = `
  @keyframes pulse {
    0% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
    100% { opacity: 0.3; transform: scale(1); }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function TempMailPage() {
  // State data email, inisialisasi ke null agar jelas state awal belum dimuat
  const [tempEmail, setTempEmail] = useState(null); 
  const [inbox, setInbox] = useState([]);
  const [accountToken, setAccountToken] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const emailPasswordRef = useRef(null); // Password akan digenerate saat di klien

  // State UI/UX
  const [isLoadingEmail, setIsLoadingEmail] = useState(true); // Loading aktif saat init
  const [isRefreshingInbox, setIsRefreshingInbox] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEmailDetail, setSelectedEmailDetail] = useState(null);
  
  // State untuk menandakan sudah di sisi klien
  const [isClient, setIsClient] = useState(false); 

  // Theme Context
  const { theme, toggleTheme, themeMode } = useContext(ThemeContext);

  // --- EFFECT: Inisialisasi Klien & Inject Keyframes ---
  useEffect(() => {
    // Inject keyframes ke DOM
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = keyframes;
    document.head.appendChild(styleSheet);
    
    // Set isClient true setelah komponen di-mount di klien
    setIsClient(true); 

    // Cleanup function: hapus stylesheet dan reset isClient jika komponen di-unmount
    return () => { 
        document.head.removeChild(styleSheet); 
        setIsClient(false); // Penting untuk Fast Refresh jika komponen di-unmount
    };
  }, []);

  // --- EFFECT: Menginisialisasi Sesi Email (Hanya di Sisi Klien setelah isClient true) ---
  useEffect(() => {
    async function initTempMailSession() {
      if (!isClient) { // Pastikan hanya berjalan di sisi klien setelah mount
        console.log("initTempMailSession: Not yet client-side.");
        return;
      }
      
      console.log("initTempMailSession: Starting client-side initialization.");
      setIsLoadingEmail(true);
      setMessage('Memuat sesi email atau membuat yang baru...');
      
      try {
        const storedEmail = localStorage.getItem(LS_EMAIL_KEY);
        const storedToken = localStorage.getItem(LS_TOKEN_KEY);
        const storedAccountId = localStorage.getItem(LS_ACCOUNT_ID_KEY);
        const storedPassword = localStorage.getItem(LS_PASSWORD_KEY);

        if (storedEmail && storedToken && storedAccountId && storedPassword) {
          console.log("initTempMailSession: Found stored session, attempting to resume.");
          setTempEmail(storedEmail);
          setAccountToken(storedToken);
          setAccountId(storedAccountId);
          emailPasswordRef.current = storedPassword; // Set password dari LS
          
          setMessage('Melanjutkan sesi email yang sudah ada...');
          // Coba refresh inbox untuk memvalidasi token. Jika gagal, paksa generate baru.
          const refreshSuccess = await refreshInbox(storedToken); 
          if (!refreshSuccess) { 
            console.log("initTempMailSession: Stored session invalid, generating new email.");
            await generateNewEmail(); // Jika refresh gagal, generate email baru
          }
          
        } else {
          console.log("initTempMailSession: No stored session, generating new email.");
          await generateNewEmail(); // Buat email baru jika tidak ada sesi tersimpan
        }
      } catch (error) {
        console.error('Initial TempMail Setup Error (frontend):', error);
        setMessage(`Error saat setup email: ${error.message}. Silakan coba 'Ganti Email'.`);
        setTempEmail('error@email.com'); // Tampilkan error di input email
        // Bersihkan localStorage jika ada masalah saat melanjutkan sesi
        if (isClient) { // Pastikan di klien sebelum akses LS
            localStorage.removeItem(LS_EMAIL_KEY);
            localStorage.removeItem(LS_TOKEN_KEY);
            localStorage.removeItem(LS_ACCOUNT_ID_KEY);
            localStorage.removeItem(LS_PASSWORD_KEY);
        }
        setAccountToken(null);
      } finally {
        setIsLoadingEmail(false);
      }
    }

    initTempMailSession(); // Panggil fungsi inisialisasi
  }, [isClient]); // Hanya jalankan effect ini saat isClient berubah menjadi true

  // --- EFFECT: Auto-Refresh Inbox Setiap 10 Detik ---
  useEffect(() => {
    let intervalId;
    if (isClient && accountToken && tempEmail && !isLoadingEmail && !isRefreshingInbox && !tempEmail.includes('error@')) {
      intervalId = setInterval(() => refreshInbox(accountToken), 10000); 
    }
    return () => clearInterval(intervalId);
  }, [isClient, accountToken, tempEmail, isLoadingEmail, isRefreshingInbox]);


  // --- FUNGSI: Menghasilkan Email Baru (dan Login) ---
  const generateNewEmail = async () => { 
    if (!isClient) { console.warn("generateNewEmail: Called on server side, returning."); return; } // Pastikan hanya di klien

    console.log("generateNewEmail: Starting new email generation.");
    setIsLoadingEmail(true);
    setInbox([]); // Bersihkan inbox
    setMessage('Mencari domain dan membuat email baru...');
    setAccountToken(null);
    setAccountId(null);
    setTempEmail(null); // Set null sementara di input email

    // Bersihkan sesi lama dari localStorage saat membuat email baru
    if (isClient) { // Pastikan di klien sebelum akses LS
        localStorage.removeItem(LS_EMAIL_KEY);
        localStorage.removeItem(LS_TOKEN_KEY);
        localStorage.removeItem(LS_ACCOUNT_ID_KEY);
        localStorage.removeItem(LS_PASSWORD_KEY);
    }
    
    // Generate password baru setiap kali membuat email baru
    emailPasswordRef.current = Math.random().toString(36).substring(2, 15);

    try {
      // 1. Panggil API Route untuk mendapatkan domain (Simulasi)
      const domainRes = await fetch('/api/mailtm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_domains' }),
      });
      const domainData = await domainRes.json();

      if (!domainRes.ok || !domainData['hydra:member'] || domainData['hydra:member'].length === 0) {
        throw new Error(domainData.detail || `Gagal memuat domain: ${domainRes.status}`);
      }
      
      const activeDomains = domainData['hydra:member'].filter(d => d.isActive).map(d => d.domain);
      if (activeDomains.length === 0) {
          throw new Error("Tidak ada domain aktif yang tersedia dari Mail.tm.");
      }
      const domainToUse = activeDomains[Math.floor(Math.random() * activeDomains.length)];

      const user = Math.random().toString(36).substring(2, 12);
      const newEmailAddress = `${user}@${domainToUse}`;
      const password = emailPasswordRef.current; 

      // 2. Panggil API Route untuk membuat akun (Simulasi)
      setMessage(`Mencoba membuat akun (${newEmailAddress})...`);
      const createRes = await fetch('/api/mailtm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_account',
          email: newEmailAddress,
          password: password, 
        }),
      });
      const createData = await createRes.json();

      if (!createRes.ok || (createData && createData.code)) {
        throw new Error(createData?.detail || `Gagal membuat akun: ${createRes.status} ${createData?.code ? `(${createData.code})` : ''}`);
      }
      setAccountId(createData.id);

      await delay(2000); 

      // 3. Panggil API Route untuk mendapatkan token (Simulasi)
      setMessage('Mendapatkan token otentikasi...');
      const tokenRes = await fetch('/api/mailtm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_token',
          email: newEmailAddress,
          password: password, 
        }),
      });
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || (tokenData && tokenData.code)) {
        throw new Error(tokenData?.detail || `Gagal mendapatkan token: ${tokenData.status} ${tokenData?.code ? `(${tokenData.code})` : ''}`);
      }
      setAccountToken(tokenData.token);

      setTempEmail(newEmailAddress);
      setMessage('Email baru berhasil dibuat dan siap digunakan!');

      // Simpan ke Local Storage
      if (isClient) { // Pastikan di klien sebelum akses LS
          localStorage.setItem(LS_EMAIL_KEY, newEmailAddress);
          localStorage.setItem(LS_TOKEN_KEY, tokenData.token);
          localStorage.setItem(LS_ACCOUNT_ID_KEY, createData.id);
          localStorage.setItem(LS_PASSWORD_KEY, password);
      }

    } catch (error) {
      console.error('Error in generateNewEmail (frontend):', error);
      let errorMessage = error.message;
      if (errorMessage.includes('429')) {
          errorMessage = "Terlalu banyak permintaan (rate limit). Coba lagi setelah beberapa saat.";
      } else if (errorMessage.includes('timeout')) { 
          errorMessage = "Permintaan terlalu lama, coba lagi.";
      } else if (errorMessage.includes('Mail.tm') || errorMessage.includes('JSON')) { // Menangkap error dari API Route simulasi
          errorMessage = "Kesalahan dalam simulasi API, hubungi pengembang."; // Pesan yang lebih sesuai untuk simulasi
      }
      setMessage(`Gagal membuat email baru: ${errorMessage}.`);
      setTempEmail('error@email.com'); // Tampilkan error di input
      // Bersihkan Local Storage jika ada kegagalan
      if (isClient) { // Pastikan di klien sebelum akses LS
          localStorage.removeItem(LS_EMAIL_KEY);
          localStorage.removeItem(LS_TOKEN_KEY);
          localStorage.removeItem(LS_ACCOUNT_ID_KEY);
          localStorage.removeItem(LS_PASSWORD_KEY);
      }
      setAccountToken(null);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  // --- FUNGSI: Me-refresh Inbox ---
  const refreshInbox = async (tokenToUse) => { 
    if (!isClient || !tokenToUse || isLoadingEmail || isRefreshingInbox || (tempEmail && tempEmail.includes('error@'))) { 
      return false; 
    }

    console.log("refreshInbox: Starting refresh with token:", tokenToUse);
    setIsRefreshingInbox(true);
    const originalMessage = message; 

    try {
      const res = await fetch('/api/mailtm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_messages', token: tokenToUse }), 
      });
      const data = await res.json();

      if (res.ok && data['hydra:member']) {
        const fetchedMessages = data['hydra:member'];
        const newEmails = fetchedMessages.filter(
          (newMessage) => !inbox.some((existingMessage) => existingMessage.id === newMessage.id)
        );
        setInbox((prevInbox) => [...prevInbox, ...newEmails.reverse()]);
        
        if (newEmails.length > 0) {
            setMessage(`Berhasil memuat ${newEmails.length} email baru.`);
        } else if (originalMessage === '' || originalMessage.includes('Tidak ada email baru')) {
            setMessage('Tidak ada email baru.');
        }
        return true; 
      } else if (res.status === 401) { 
          throw new Error("Sesi tidak valid. Akun mungkin kedaluwarsa. Silakan 'Ganti Email'.");
      } else {
        console.error('Mail.tm Get Messages Error (frontend):', data);
        throw new Error(data?.detail || `Gagal memuat inbox: ${res.status}`);
      }
    } catch (error) {
      console.error('Error refreshing inbox (frontend):', error);
      setMessage(`Gagal me-refresh inbox: ${error.message}`); 
      if (error.message.includes('Sesi tidak valid')) {
          if (isClient) { 
            localStorage.removeItem(LS_EMAIL_KEY);
            localStorage.removeItem(LS_TOKEN_KEY);
            localStorage.removeItem(LS_ACCOUNT_ID_KEY);
            localStorage.removeItem(LS_PASSWORD_KEY);
          }
          setAccountToken(null); 
      }
      return false; 
    } finally {
      setIsRefreshingInbox(false);
      if (!message.includes('berhasil disalin')) {
          setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  // --- FUNGSI: Membaca Detail Pesan ---
  const readMessage = async (messageId) => {
    if (!isClient || !accountToken || isLoadingEmail || isRefreshingInbox) return; 

    setMessage('Memuat detail pesan...');
    try {
        const res = await fetch('/api/mailtm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'read_message', token: accountToken, messageId: messageId }),
        });
        const data = await res.json();
        if (res.ok) {
            setSelectedEmailDetail(data); 
            setShowModal(true); 
            setMessage(`Pesan dari ${data.from?.address || 'Unknown'} dengan subjek "${data.subject || 'Tidak Ada Subjek'}" dimuat.`);
        } else if (res.status === 401) {
            throw new Error("Sesi tidak valid untuk membaca pesan. Akun mungkin kedaluwarsa. Silakan 'Ganti Email'.");
        } else {
            console.error('Mail.tm Read Message Error (frontend):', data);
            throw new Error(data?.detail || 'Gagal membaca detail pesan.');
        }
    } catch (error) {
        console.error('Error reading message (frontend):', error);
        setMessage(`Gagal membaca pesan: ${error.message}`);
    } finally {
        setTimeout(() => setMessage(''), 3000);
    }
  };

  // --- FUNGSI: Menyalin Email ke Clipboard ---
  const copyEmailToClipboard = async () => {
    if (!isClient) return; 

    setIsCopying(true);
    setMessage(''); 
    try {
      await navigator.clipboard.writeText(tempEmail);
      setMessage('Email berhasil disalin!');
    } catch (err) {
      console.error('Gagal menyalin:', err);
      setMessage('Gagal menyalin email.');
    } finally {
      setTimeout(() => {
        setIsCopying(false);
        setMessage('');
      }, 2000);
    }
  };

  const FOOTER_HEIGHT = '40px'; 

  // --- Tampilan Render ---
  // Tampilkan placeholder loading jika belum di klien atau masih memuat email (tempEmail === null)
  // Ini adalah rendering awal di server dan saat loading pertama kali di klien.
  if (!isClient || tempEmail === null) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh',
        backgroundColor: theme.backgroundColor, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica Neue, sans-serif',
        paddingBottom: `calc(40px + ${FOOTER_HEIGHT})`, paddingTop: '65px', color: theme.textColor,
      }}>
        {/* Navbar (dirender selalu) */}
        <nav style={{ /* ...gaya navbar */ }}>
          <div style={{ /* ...konten navbar */ }}>
            <Link href="/" passHref legacyBehavior><a style={{ /* ... */ }}>Cek Rekening</a></Link>
            <Link href="/tempmail" passHref legacyBehavior><a style={{ /* ... */ }}>TempMail</a></Link>
            <button onClick={toggleTheme} style={{ /* ... */ }}>{themeMode === 'light' ? '🌙' : '☀️'}</button>
          </div>
        </nav>

        {/* Placeholder Loading (Tampilan saat isClient belum true atau tempEmail masih null) */}
        <div style={{
          marginTop: '50px', textAlign: 'center', fontSize: '1.2em',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '400px', 
          backgroundColor: theme.cardBackground, borderRadius: '12px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
          width: '500px', // Lebar placeholder
          maxWidth: '90%',
          padding: '30px',
          color: theme.textColor, // Teks placeholder dari tema
        }}>
          <span style={{ fontSize: '3em', marginBottom: '15px', color: theme.buttonPrimaryBg, animation: 'spin 1s linear infinite' }}>&#x231B;</span>
          <p style={{ fontSize: '1.1em' }}>Memuat sesi email...</p>
        </div>

        {/* Footer (dirender selalu) */}
        <div style={{ /* ...gaya footer */ }}></div>
      </div>
    );
  }

  // Render konten utama hanya setelah isClient true dan tempEmail tidak null
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: theme.backgroundColor,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica Neue, sans-serif',
      paddingBottom: `calc(40px + ${FOOTER_HEIGHT})`, // Tambah padding untuk footer
      paddingTop: '65px',
      color: theme.textColor,
    }}>
      {/* Header (Navbar) - Dipercantik */}
      <nav style={{ /* ... (gaya navbar) ... */ }}>
        <div style={{ /* ... (konten navbar) ... */ }}>
          <Link href="/" passHref legacyBehavior><a style={{ /* ... */ }}>Cek Rekening</a></Link>
          <Link href="/tempmail" passHref legacyBehavior><a style={{ /* ... */ }}>TempMail</a></Link>
          <button onClick={toggleTheme} style={{ /* ... */ }}>{themeMode === 'light' ? '🌙' : '☀️'}</button>
        </div>
      </nav>

      {/* Kontainer Pembungkus Dua Kontainer Utama (Form & Inbox) */}
      <div style={{
        display: 'flex',
        justifyContent: 'center', 
        alignItems: 'stretch', // Ini penting untuk menyamakan tinggi
        marginTop: '50px',
        gap: '25px', 
        flexWrap: 'wrap', 
        maxWidth: '1050px', 
        padding: '0 20px', 
        '@media (max-width: 768px)': {
            flexDirection: 'column', 
            alignItems: 'center', 
            width: '100%', 
            padding: '0 10px', 
        }
      }}>

        {/* Kontainer Kiri: Form Email dan Tombol Aksi */}
        <div style={{
            flex: '1 1 500px', 
            padding: '30px', 
            borderRadius: '12px',
            backgroundColor: theme.cardBackground, 
            boxShadow: '0 6px 20px rgba(0,0,0,0.1)', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '500px', 
            color: theme.textColor, 
            transition: `background-color ${theme.transitionDuration} ${theme.transitionEase}, border-color ${theme.transitionDuration} ${theme.transitionEase}, box-shadow ${theme.transitionDuration} ${theme.transitionEase}, transform ${theme.transitionDuration} ${theme.transitionEase}`, // Transisi untuk kontainer
            '@media (max-width: 768px)': {
                flex: '1 1 auto', 
                width: '100%',
                padding: '20px',
                marginBottom: '20px', 
            }
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.15)`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.1)`; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            <h1 style={{
                color: theme.textColor, 
                fontSize: '2.5em',
                marginBottom: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                '@media (max-width: 768px)': {
                    fontSize: '1.8em',
                    textAlign: 'center',
                }
            }}>
                <span style={{ marginRight: '10px', fontSize: '1.2em' }}>&#9993;</span> TempMail
            </h1>
            <p style={{
                color: theme.textColor, 
                fontSize: '1.05em',
                marginBottom: '30px',
                textAlign: 'center',
                '@media (max-width: 768px)': {
                    fontSize: '0.9em',
                    marginBottom: '20px',
                }
            }}>
                Alamat Email Sementara Anda
            </p>

            {/* Kotak Tampilan Alamat Email */}
            <div style={{
              position: 'relative',
              width: '100%',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: `1px solid ${theme.inputBorder}`, 
              borderRadius: '8px',
              backgroundColor: theme.inputBackground, 
              padding: '10px 15px',
              fontSize: '1.1em',
              color: theme.textColor, 
              '@media (max-width: 768px)': {
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  padding: '15px',
                  fontSize: '1em',
                  gap: '0',
              }
            }}>
              <input
                type="text"
                readOnly
                value={tempEmail || ''} // Tampilkan '' atau email jika sudah ada
                style={{
                  flexGrow: 1,
                  border: 'none',
                  backgroundColor: 'transparent',
                  outline: 'none',
                  fontSize: 'inherit',
                  color: theme.textColor, 
                  cursor: 'default',
                  padding: '0',
                  '@media (max-width: 768px)': {
                      textAlign: 'center',
                      marginBottom: '10px',
                  }
                }}
              />
              <button
                onClick={copyEmailToClipboard}
                disabled={!isClient || isLoadingEmail || isCopying || !tempEmail || tempEmail.includes('error@')} 
                style={{
                  background: theme.buttonPrimaryBg, 
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '6px',
                  fontSize: '1em',
                  fontWeight: '600',
                  color: 'white',
                  cursor: (!isClient || isLoadingEmail || isCopying || !tempEmail || tempEmail.includes('error@')) ? 'not-allowed' : 'pointer',
                  opacity: (!isClient || isLoadingEmail || isCopying || !tempEmail || tempEmail.includes('error@')) ? 0.6 : 1,
                  transition: 'opacity 0.2s ease-in-out, background-color 0.2s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  '@media (max-width: 768px)': {
                      width: '100%',
                      marginLeft: '0',
                  }
                }}
                title="Salin Email"
              >
                &#x2398; Salin Email
              </button>
            </div>
            <p style={{
                color: theme.textColor, 
                fontSize: '0.9em',
                marginBottom: '30px',
                textAlign: 'center',
                '@media (max-width: 768px)': {
                    fontSize: '0.8em',
                    marginBottom: '20px',
                }
            }}>
              Email ini hanya berlaku sementara dan akan terhapus otomatis setelah beberapa jam.
            </p>

            {/* Notifikasi */}
            {message && (
                <div style={{
                    backgroundColor: message.includes('berhasil') ? '#d4edda' : message.includes('gagal') || message.includes('Error') ? '#f8d7da' : '#ffeeba',
                    color: message.includes('berhasil') ? '#155724' : message.includes('gagal') || message.includes('Error') ? '#721c24' : '#856404',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    width: '100%',
                    textAlign: 'center',
                    border: `1px solid ${message.includes('berhasil') ? '#c3e6cb' : message.includes('gagal') || message.includes('Error') ? '#f5c6cb' : '#ffc107'}`
                }}>
                    {message}
                </div>
            )}

            {/* Tombol Aksi */}
            <div style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '0',
                flexWrap: 'wrap',
                justifyContent: 'center',
                width: '100%',
                '@media (max-width: 768px)': {
                    flexDirection: 'column',
                    gap: '10px',
                }
            }}>
              <button
                onClick={refreshInbox}
                disabled={!isClient || isRefreshingInbox || isLoadingEmail || !accountToken || !tempEmail || tempEmail.includes('error@')} 
                style={{
                  padding: '12px 25px',
                  backgroundColor: (!isClient || isRefreshingInbox || !accountToken || !tempEmail || tempEmail.includes('error@')) ? theme.buttonPrimaryHoverBg : theme.buttonPrimaryBg,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!isClient || isRefreshingInbox || !accountToken || !tempEmail || tempEmail.includes('error@')) ? 'not-allowed' : 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'background-color 0.2s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  flexGrow: 1, 
                }}
              >
                <span style={{ marginRight: '8px' }}>&#x21BB;</span> {isRefreshingInbox ? 'Memuat...' : 'Refresh Inbox'}
              </button>
              <button
                onClick={generateNewEmail} 
                disabled={!isClient || isLoadingEmail || isRefreshingInbox} 
                style={{
                  padding: '12px 25px',
                  backgroundColor: (!isClient || isLoadingEmail) ? theme.buttonWarningHoverBg : theme.buttonWarningBg,
                  color: theme.textColor, 
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!isClient || isLoadingEmail) ? 'not-allowed' : 'pointer',
                  fontSize: '1em',
                  fontWeight: '600',
                  transition: 'background-color 0.2s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  flexGrow: 1, 
                }}
              >
                <span style={{ marginRight: '8px' }}>&#x2709;</span> {isLoadingEmail ? 'Membuat...' : 'Ganti Email'}
              </button>
            </div>
        </div> {/* End Kontainer Kiri */}

        {/* Kontainer Kanan: Bagian Inbox */}
        <div style={{
            flex: '1 1 500px', 
            padding: '25px',
            borderRadius: '12px',
            backgroundColor: theme.cardBackground, 
            boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
            minHeight: '500px', 
            display: 'flex',
            flexDirection: 'column',
            color: theme.textColor, 
            transition: `background-color ${theme.transitionDuration} ${theme.transitionEase}, border-color ${theme.transitionDuration} ${theme.transitionEase}, box-shadow ${theme.transitionDuration} ${theme.transitionEase}, transform ${theme.transitionDuration} ${theme.transitionEase}`,
            '@media (max-width: 768px)': {
                flex: '1 1 auto',
                width: '100%',
                padding: '15px',
                minHeight: '200px',
            }
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.15)`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.1)`; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            <h3 style={{
              color: theme.textColor, 
              fontSize: '1.6em',
              marginBottom: '20px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              '@media (max-width: 768px)': {
                  fontSize: '1.3em',
                  justifyContent: 'center',
              }
            }}>
              <span style={{ marginRight: '10px', fontSize: '1.2em' }}>&#128236;</span> Inbox
            </h3>

            {/* Kondisi ketika sedang memuat (email atau inbox) */}
            {(isLoadingEmail || isRefreshingInbox) && (
              <div style={{
                textAlign: 'center',
                color: theme.textColor, 
                marginTop: '30px',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <span style={{
                    fontSize: '3em',
                    marginBottom: '15px',
                    color: theme.buttonPrimaryBg, 
                    animation: 'spin 1s linear infinite'
                }}>&#x231B;</span>
                <p style={{ fontSize: '1.1em' }}>Memuat email...</p>
              </div>
            )}

            {/* Kondisi ketika inbox kosong dan tidak sedang loading */}
            {inbox.length === 0 && !isRefreshingInbox && !isLoadingEmail && (
              <div style={{
                textAlign: 'center',
                color: theme.textColor, 
                marginTop: '30px',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <span style={{
                    fontSize: '3em',
                    marginBottom: '15px',
                    color: theme.textColor, 
                    animation: 'pulse 1.5s infinite ease-in-out'
                }}>&#128233;</span>
                <p style={{ fontSize: '1.1em' }}>Menunggu email masuk...</p>
              </div>
            )}

            {/* Kondisi ketika ada email di inbox */}
            {inbox.length > 0 && (
              <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '400px' }}>
                {inbox.map((email) => (
                  <div key={email.id} style={{
                    border: `1px solid ${theme.inputBorder}`, 
                    padding: '15px',
                    marginBottom: '10px',
                    borderRadius: '8px',
                    backgroundColor: theme.inputBackground, 
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out, background-color 0.2s ease-in-out', 
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.backgroundColor = theme.buttonPrimaryHoverBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.backgroundColor = theme.inputBackground; }}
                  onClick={() => readMessage(email.id)}
                  >
                    <p style={{ margin: '0 0 5px 0', fontWeight: '600', color: theme.buttonPrimaryBg }}>Dari: {email.from?.address || 'Unknown'}</p>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: theme.textColor }}>Subjek: {email.subject || '(Tanpa Subjek)'}</p>
                    <p style={{ margin: '0', fontSize: '0.9em', color: theme.textColor, maxHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {email.intro || email.body || 'Tidak ada pratinjau.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
        </div> {/* End Kontainer Kanan */}

      </div> {/* End Kontainer Pembungkus Dua Kontainer Utama */}

      {/* Modal untuk menampilkan detail email */}
      {showModal && selectedEmailDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px', 
        }} onClick={() => setShowModal(false)}>
          <div style={{
            backgroundColor: theme.cardBackground, 
            padding: '30px',
            borderRadius: '12px',
            width: '80%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
            position: 'relative',
            color: theme.textColor, 
            '@media (max-width: 768px)': {
                width: '100%', 
                padding: '20px',
                margin: '0 10px', 
            }
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '1.5em',
                cursor: 'pointer',
                color: theme.textColor, 
              }}
            >
              &times;
            </button>
            <h5 style={{ fontSize: '1.8em', marginBottom: '15px', color: theme.textColor, 
                '@media (max-width: 768px)': {
                    fontSize: '1.4em',
                }
            }}>
              {selectedEmailDetail.subject || 'Tanpa Subjek'}
            </h5>
            <p style={{ fontSize: '0.9em', color: theme.textColor, marginBottom: '5px' }}> 
              <strong>Dari:</strong> {selectedEmailDetail.from?.address || 'Unknown'}
            </p>
            <p style={{ fontSize: '0.9em', color: theme.textColor, marginBottom: '20px' }}> 
              <strong>Tanggal:</strong> {selectedEmailDetail.createdAt ? new Date(selectedEmailDetail.createdAt).toLocaleString() : 'N/A'}
            </p>
            <hr style={{ borderColor: theme.resultBorderDefault, marginBottom: '20px' }} /> 
            <div style={{
              fontSize: '1em',
              lineHeight: '1.6',
              color: theme.textColor, 
            }}
            dangerouslySetInnerHTML={{ __html: selectedEmailDetail.html?.[0] || selectedEmailDetail.text || '[Konten kosong]' }}
            />
          </div>
        </div>
      )}

      {/* Fixed Footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: FOOTER_HEIGHT, // Tinggi footer
        backgroundColor: theme.headerBackground, // Gunakan background header dari tema
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '0.9em',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', // Bayangan ke atas
        zIndex: 9, // Di bawah navbar
      }}>
        <p style={{ margin: 0, padding: '0 10px' }}>
          © 2024 AchmadTeguh. All rights reserved.
        </p>
      </div>
    </div>
  );
}
