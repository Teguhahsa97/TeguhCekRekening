// pages/index.js
import { useState, useContext } from 'react';
import Link from 'next/link';
import CheckForm from '../components/CheckForm';
import ResultDisplay from '../components/ResultDisplay';
import { ThemeContext } from '../context/ThemeContext';

export default function Home() {
  const [checkResult, setCheckResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme, themeMode } = useContext(ThemeContext);

  const handleCheck = async (formData) => {
    setIsLoading(true);
    setCheckResult(null); 

    try {
      const response = await fetch('/api/cek-rekening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kategori: formData.kategori,
          jenis_e_wallet: formData.jenisEwallet,
          nomor: formData.nomorHp,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setCheckResult({
          status: data.data?.status || 'Berhasil', 
          jenis: data.data?.jenis || formData.jenisEwallet || formData.kategori,
          namaPemilik: data.data?.namaPemilik || 'Nama tidak ditemukan',
          nomorRekeningNp: data.data?.nomorRekeningNp || formData.nomorHp,
        });
      } else {
        setCheckResult({
          status: data.data?.status || 'Gagal', 
          jenis: data.data?.jenis || formData.jenisEwallet || formData.kategori, 
          namaPemilik: data.message || data.data?.namaPemilik || 'Pengecekan gagal.', 
          nomorRekeningNp: data.data?.nomorRekeningNp || formData.nomorHp || '', 
        });
      }
    } catch (error) {
      console.error('Error during bank/e-wallet check (frontend):', error);
      setCheckResult({
        status: 'Gagal',
        jenis: formData.jenisEwallet || formData.kategori,
        namaPemilik: `Terjadi kesalahan jaringan/server: ${error.message}`, 
        nomorRekeningNp: formData.nomorHp || '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const FOOTER_HEIGHT = '40px'; // Definisikan tinggi footer

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: theme.backgroundColor,
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, sans-serif',
      paddingBottom: `calc(40px + ${FOOTER_HEIGHT})`, // Tambah padding untuk footer
      paddingTop: '65px',
      color: theme.textColor,
    }}>
      {/* Header (Navbar) */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, width: '100%',
        background: theme.headerBackground,
        color: 'white', padding: '12px 30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 10,
        '@media (max-width: 768px)': {
            padding: '10px 20px', flexDirection: 'column', alignItems: 'flex-start',
        }
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '24px', marginRight: '15px', cursor: 'pointer' }}>&larr;</span>
          <span style={{ fontSize: '28px', fontWeight: 'bold' }}>AchmadTeguh</span>
        </div>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center',
            '@media (max-width: 768px)': {
                width: '100%',
                justifyContent: 'space-around', gap: '0',
            }
        }}>
          <Link href="/" passHref legacyBehavior>
            <a style={{
              color: 'white', textDecoration: 'none', fontSize: '17px', 
              fontWeight: '600', padding: '8px 12px', borderRadius: '5px',
              backgroundColor: 'rgba(255,255,255,0.2)', transition: 'background-color 0.2s ease-in-out, opacity 0.2s ease-in-out, transform 0.1s ease-in-out',
              '@media (max-width: 768px)': {
                  fontSize: '15px', padding: '8px 10px', flexGrow: 1, textAlign: 'center',
              }
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            >Cek Rekening</a>
          </Link>

          <Link href="/tempmail" passHref legacyBehavior>
            <a style={{
              color: 'white', textDecoration: 'none', fontSize: '17px',
              fontWeight: '600', padding: '8px 12px', borderRadius: '5px',
              opacity: 0.8, transition: 'background-color 0.2s ease-in-out, opacity 0.2s ease-in-out, transform 0.1s ease-in-out',
              '@media (max-width: 768px)': {
                  fontSize: '15px', padding: '8px 10px', flexGrow: 1, textAlign: 'center',
              }
            }}
            onMouseEnter={(e) => e.target.style.opacity = 1}
            onMouseLeave={(e) => e.target.style.opacity = 0.8}
            >TempMail</a>
          </Link>

          {/* Tombol Dark Mode / Light Mode */}
          <button onClick={toggleTheme} style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '50%',
              color: 'white', padding: '0', fontSize: '1.4em', cursor: 'pointer',
              marginLeft: '20px', transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px',
              boxShadow: '0 0 5px rgba(255,255,255,0.2)',
              '@media (max-width: 768px)': {
                  marginTop: '10px', marginLeft: '0', width: '40px', height: '40px',
              }
          }}>
            {themeMode === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>

      {/* Konten Utama */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '50px',
        width: 'fit-content',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <CheckForm onCheck={handleCheck} isLoading={isLoading} />

        {(isLoading || checkResult) && ( 
            isLoading ? (
                <div style={{ 
                    padding: '30px', 
                    border: `1px solid ${theme.resultBorderDefault}`,
                    borderRadius: '12px', 
                    width: '450px', 
                    backgroundColor: theme.cardBackground, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    minHeight: '300px', 
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <div style={{ 
                        textAlign: 'center',
                        color: theme.textColor, 
                        flexGrow: 1, 
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        animation: 'spin 1s linear infinite' 
                    }}>
                        <span style={{ fontSize: '3em', marginBottom: '15px', color: theme.buttonPrimaryBg }}>&#x231B;</span>
                        <p style={{ fontSize: '1.1em' }}>Memproses pengecekan...</p>
                    </div>
                </div>
            ) : (
                <ResultDisplay result={checkResult} />
            )
        )}
      </div>

      {/* Pesan Disclaimer Server (Baru Ditambahkan) */}
      <p style={{
          marginTop: '30px', // Jarak dari konten di atasnya
          color: theme.textColor, // Warna teks dari tema
          fontSize: '0.9em',
          textAlign: 'center',
          maxWidth: '800px', // Batasi lebar teks
          padding: '0 20px', // Padding samping
      }}>
          ⚠️ Kadang server bisa delay. Jika hasil belum muncul, coba ulangi lagi beberapa saat.
      </p>

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