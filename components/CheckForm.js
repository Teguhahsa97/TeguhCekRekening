// components/CheckForm.js
import { useState, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext'; // Import ThemeContext

const CheckForm = ({ onCheck, isLoading }) => {
  const [kategori, setKategori] = useState('');
  const [jenisEwallet, setJenisEwallet] = useState('');
  const [nomorHp, setNomorHp] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const { theme } = useContext(ThemeContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCheck({ kategori, jenisEwallet, nomorHp });
  };

  const handleKategoriChange = (e) => {
    const selectedKategori = e.target.value;
    setKategori(selectedKategori);
    setJenisEwallet('');
    setNomorHp('');
    setShowWarning(selectedKategori === 'bank');
  };

  return (
    <div style={{
      padding: '30px',
      border: `1px solid ${theme.resultBorderDefault}`, // Border dari tema
      borderRadius: '12px',
      width: '450px',
      backgroundColor: theme.cardBackground, // Background dari tema
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      minHeight: 'fit-content',
      color: theme.textColor, // Teks umum dari tema
      transition: `background-color ${theme.transitionDuration} ${theme.transitionEase}, border-color ${theme.transitionDuration} ${theme.transitionEase}, box-shadow ${theme.transitionDuration} ${theme.transitionEase}, transform ${theme.transitionDuration} ${theme.transitionEase}`, // Transisi untuk kontainer
    }}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.15)`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.08)`; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Ikon Baru di Atas Judul */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <span style={{ 
              fontSize: '8em', // Ukuran ikon lebih besar
              color: theme.buttonPrimaryBg, // Warna ikon dari tema
              display: 'inline-block', // Agar margin berfungsi
              marginBottom: '5px'
          }}>💳</span> {/* Ikon Kartu Kredit/ATM */}
      </div>

      <h2 style={{
        marginBottom: '25px',
        color: theme.textColor,
        textAlign: 'center',
        fontSize: '1.8em',
        fontWeight: '600'
      }}>Cek Nama Rekening/E-wallet</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="kategori" class="form-label" style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: theme.textColor,
          }}>Pilih Kategori:</label>
          <select
            id="kategori"
            value={kategori}
            onChange={handleKategoriChange}
            style={{
              width: '100%',
              padding: '12px 15px',
              borderRadius: '8px',
              border: `1px solid ${theme.inputBorder}`,
              backgroundColor: theme.inputBackground,
              color: theme.textColor,
              fontSize: '1em',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z' fill='%23${theme.textColor.substring(1)}'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 15px center',
              backgroundSize: '1em',
              transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            }}
            onFocus={(e) => { e.target.style.borderColor = theme.buttonPrimaryBg; e.target.style.boxShadow = `0 0 0 3px ${theme.buttonShadowPrimary.replace('0.3', '0.25')}`; }}
            onBlur={(e) => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = 'none'; }}
          >
            <option value="">-- Pilih --</option>
            <option value="e-wallet">E-wallet</option>
            <option value="bank">Bank</option>
          </select>
        </div>

        {showWarning && (
          <p style={{
            color: theme.buttonWarningBg,
            backgroundColor: theme.cardBackground,
            borderLeft: `4px solid ${theme.buttonWarningBg}`,
            padding: '10px 15px',
            marginBottom: '20px',
            borderRadius: '0 8px 8px 0',
            fontSize: '0.95em'
          }}>
            Warning: Pengecekan bank masih dalam proses pengembangan.
          </p>
        )}

        {kategori === 'e-wallet' && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="jenisEwallet" class="form-label" style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: theme.textColor,
              }}>Jenis E-wallet:</label>
              <select
                id="jenisEwallet"
                value={jenisEwallet}
                onChange={(e) => setJenisEwallet(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.inputBorder}`,
                  backgroundColor: theme.inputBackground,
                  color: theme.textColor,
                  fontSize: '1em',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z' fill='%23${theme.textColor.substring(1)}'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 15px center',
                  backgroundSize: '1em',
                  transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                }}
                onFocus={(e) => { e.target.style.borderColor = theme.buttonPrimaryBg; e.target.style.boxShadow = `0 0 0 3px ${theme.buttonShadowPrimary.replace('0.3', '0.25')}`; }}
                onBlur={(e) => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = 'none'; }}
              >
                <option value="">-- Pilih --</option>
                <option value="DANA">DANA</option>
                <option value="OVO">OVO</option>
                <option value="GOPAY">GOPAY</option>
                <option value="SHOPEEPAY">SHOPEEPAY</option>
                <option value="LINK AJA">LINK AJA</option>
              </select>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label htmlFor="nomorHp" class="form-label" style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: theme.textColor,
              }}>Nomor HP E-wallet:</label>
              <input
                type="text"
                id="nomorHp"
                value={nomorHp}
                onChange={(e) => e.target.value.length <= 16 ? setNomorHp(e.target.value) : null}
                placeholder="081xxxxxxxxx"
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.inputBorder}`,
                  backgroundColor: theme.inputBackground,
                  color: theme.textColor,
                  fontSize: '1em',
                  transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                }}
                onFocus={(e) => { e.target.style.borderColor = theme.buttonPrimaryBg; e.target.style.boxShadow = `0 0 0 3px ${theme.buttonShadowPrimary.replace('0.3', '0.25')}`; }}
                onBlur={(e) => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: isLoading ? theme.buttonPrimaryHoverBg : theme.buttonPrimaryBg,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '1.1em',
            fontWeight: '600',
            boxShadow: `0 4px 10px ${theme.buttonShadowPrimary}`,
            transition: 'background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out, transform 0.1s ease-in-out',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.target.style.backgroundColor = theme.buttonPrimaryHoverBg;
              e.target.style.boxShadow = `0 6px 15px ${theme.buttonShadowPrimary.replace('0.3', '0.4')}`;
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.target.style.backgroundColor = theme.buttonPrimaryBg;
              e.target.style.boxShadow = `0 4px 10px ${theme.buttonPrimaryShadow}`;
              e.target.style.transform = 'translateY(0)';
            }
          }}
          onMouseDown={(e) => {
            if (!isLoading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 2px 5px ${theme.buttonShadowPrimary.replace('0.3', '0.2')}`;
            }
          }}
          onMouseUp={(e) => {
            if (!isLoading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `0 6px 15px ${theme.buttonShadowPrimary.replace('0.3', '0.4')}`;
            }
          }}
          disabled={
            isLoading ||
            kategori === '' ||
            (kategori === 'e-wallet' && (jenisEwallet === '' || nomorHp === ''))
          }
        >
          Cek Sekarang
        </button>
      </form>
    </div>
  );
};

export default CheckForm;