// components/ResultDisplay.js
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext'; // Import ThemeContext

const ResultDisplay = ({ result }) => {
  if (!result) {
    return null; // Tidak menampilkan apa-apa jika belum ada hasil
  }

  const { theme, themeMode } = useContext(ThemeContext); // Ambil theme DAN themeMode

  // Fungsi untuk mendapatkan style dan ikon status yang adaptif tema
  const getStatusDisplay = (status) => {
    // Definisi warna status khusus untuk LIGHT mode
    const lightStatusColors = {
      'Berhasil': { color: '#28a745', fontWeight: 'bold' },
      'Gagal': { color: '#dc3545', fontWeight: 'bold' },
      'Proses': { color: '#007bff', fontWeight: 'bold' },
      'Maintenance': { color: '#e67e22', fontWeight: 'bold' },
    };

    // Definisi warna status khusus untuk DARK mode (gunakan warna yang lebih cocok)
    const darkStatusColors = {
      'Berhasil': { color: '#66bb6a', fontWeight: 'bold' }, // Hijau yang lebih terang
      'Gagal': { color: '#ef5350', fontWeight: 'bold' },   // Merah yang lebih terang
      'Proses': { color: '#64b5f6', fontWeight: 'bold' }, // Biru yang lebih terang
      'Maintenance': { color: '#ffb74d', fontWeight: 'bold' }, // Oranye yang lebih terang
    };

    const colors = themeMode === 'light' ? lightStatusColors : darkStatusColors;

    switch (status) {
      case 'Berhasil':
        return { style: colors['Berhasil'], icon: '✅' };
      case 'Gagal':
        return { style: colors['Gagal'], icon: '❌' };
      case 'Proses':
        return { style: colors['Proses'], icon: '⏳' };
      case 'Maintenance':
        return { style: colors['Maintenance'], icon: '🚧' };
      default:
        return { style: { color: theme.textColor }, icon: 'ℹ️' }; // Default pakai warna teks tema
    }
  };

  const statusDisplay = getStatusDisplay(result.status);

  // Tentukan warna background kontainer berdasarkan status dan mode
  // Warna-warna ini harus menjadi latar belakang yang cocok untuk teks di atasnya
  const getContainerColors = (status, mode) => {
    if (mode === 'light') {
      switch (status) {
        case 'Berhasil': return { bg: '#d4edda', border: '#c3e6cb' };
        case 'Gagal': return { bg: '#f8d7da', border: '#f5c6cb' };
        case 'Proses': return { bg: '#fff3cd', border: '#ffc107' };
        case 'Maintenance': return { bg: '#fffbe6', border: '#e67e22' };
        default: return { bg: theme.cardBackground, border: theme.resultBorderDefault };
      }
    } else { // dark mode
      switch (status) {
        case 'Berhasil': return { bg: '#2e7d32', border: '#388e3c' }; // Hijau gelap
        case 'Gagal': return { bg: '#c62828', border: '#d32f2f' };   // Merah gelap
        case 'Proses': return { bg: '#1565c0', border: '#1976d2' }; // Biru gelap
        case 'Maintenance': return { bg: '#fb8c00', border: '#ff9800' }; // Oranye gelap
        default: return { bg: theme.cardBackground, border: theme.resultBorderDefault };
      }
    }
  };

  const currentContainerColors = getContainerColors(result.status, themeMode);

  return (
    <div style={{
      padding: '30px',
      border: `1px solid ${currentContainerColors.border}`, // Border dari logika tema
      borderRadius: '12px',
      width: '450px',
      backgroundColor: currentContainerColors.bg, // Background dari logika tema
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      textAlign: 'left',
      color: theme.textColor, // Teks umum dari tema
    }}>
      <h3 style={{
        marginBottom: '15px',
        color: theme.textColor, // Judul H3 dari tema
        textAlign: 'center',
        fontSize: '1.8em',
        fontWeight: '600',
        width: '100%',
      }}>Hasil Cek:</h3>
      
      {/* Garis pemisah dari tema */}
      <hr style={{ width: '100%', borderColor: theme.resultBorderDefault, marginBottom: '20px' }} />

      <div style={{ width: '100%' }}>
        <p style={{ marginBottom: '10px', fontSize: '1.1em' }}>
          <strong style={{ color: theme.textColor }}>Status:</strong> <span style={statusDisplay.style}>{statusDisplay.icon} {result.status}</span>
        </p>
        {result.jenis && (
          <p style={{ marginBottom: '10px', fontSize: '1.1em' }}>
            <strong style={{ color: theme.textColor }}>Jenis:</strong> {result.jenis}
          </p>
        )}
        {result.namaPemilik && (
          <p style={{ 
            marginBottom: '10px', 
            fontSize: '1.1em',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}>
            <strong style={{ color: theme.textColor }}>Nama Pemilik:</strong> {result.namaPemilik}
          </p>
        )}
        {result.nomorRekeningNp && (
          <p style={{ 
            marginBottom: '0', 
            fontSize: '1.1em',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}>
            <strong style={{ color: theme.textColor }}>Nomor Rekening/HP:</strong> {result.nomorRekeningNp}
          </p>
        )}
      </div> 

    </div>
  );
};

export default ResultDisplay;