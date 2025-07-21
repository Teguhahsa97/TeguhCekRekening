// pages/api/cek-rekening.js

const fetchWithTimeout = async (url, options, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Permintaan ke API eksternal melebihi batas waktu (timeout).');
    }
    throw error;
  }
};


export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { kategori, jenis_e_wallet, nomor } = req.body;

    const KEDAIMUTASI_API_URL = 'https://kedaimutasi.com/cekrekening/home/validate_account';
    const REFERER_URL = 'https://wisnucekrekening.xyz/';

    const EWALLET_CODES = {
      "DANA": "kPTh+rsIRDKKTeYWkaPh10QxQ2tiTFFLTml5eFRBME1NbmxqVjFFSWRkL0crVEhxSERWK3V0YTdNbzA9",
      "OVO": "sS/AWaTnhjm66U9P/vbjyUNhY2g3d3NxeXdLVk5ObVhTRElLRDdPUTNLYzB5ZTQycW13WFFxb2xNeUk9",
      "GOPAY": "KgtVgI/JN0VrPz+qhwyU3UlIa1hsWHhMM0RGbHY5dkQyb3NvT0pGdUFudVFUcnltdzJlSE1iQW1XY2FqY2F2Z2dleVBuU2JZdVgyaGNoODA=",
      "SHOPEEPAY": "RRRj9w9nFnIvDwYu8vAcyHoxc2dMNnVaNkpLSGR3bE5pdkY2dytLQWJCZHlUdk90cUdiOUlKTGVNU2M9",
      "LINK AJA": "e/FsJuSdqID+MkmS4zCSNkU1dHJVc3hDQkgrVndnR3NNU1VVakJvVVk2TE9lbmZ4YS95WXZyWXZ4LzQ9"
    };

    if (kategori === 'bank') {
      return res.status(200).json({
        status: 'error',
        message: 'Pengecekan bank masih dalam proses pengembangan (Maintenance).',
        data: {
          status: 'Maintenance',
          jenis: 'Bank',
          namaPemilik: 'Sedang dalam pengembangan',
          nomorRekeningNp: nomor,
        },
      });
    } else if (kategori === 'e-wallet') {
      const encodedAccountType = EWALLET_CODES[jenis_e_wallet];

      if (!encodedAccountType) {
        console.error(`[API Proxy Error] E-wallet code not found for: ${jenis_e_wallet}`);
        return res.status(400).json({ status: 'error', message: 'Jenis E-wallet tidak valid atau kode tidak ditemukan.' });
      }

      const requestBody = new URLSearchParams();
      requestBody.append('account_type', encodedAccountType);
      requestBody.append('account_number', nomor);

      try {
        const response = await fetchWithTimeout(KEDAIMUTASI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': REFERER_URL,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          body: requestBody.toString(),
        });

        const rawResponseText = await response.text();
        console.log(`[API Proxy Debug] Raw Response from KedaiMutasi for ${jenis_e_wallet} ${nomor}:`, rawResponseText);

        let parsedData;
        try {
            parsedData = JSON.parse(rawResponseText);
        } catch (e) {
            console.error('[API Proxy Error] Failed to parse JSON from KedaiMutasi. Response was not valid JSON:', rawResponseText);
            return res.status(500).json({
              status: 'error',
              message: 'Respon dari API eksternal bukan JSON. Kemungkinan diblokir atau ada error HTML.',
              rawResponse: rawResponseText
            });
        }
        
        console.log('[API Proxy Debug] Parsed JSON from KedaiMutasi:', parsedData);

        const kedaiStatus = parsedData.status;
        const isValid = parsedData.valid ?? false;
        const accountName = parsedData.account_name; // Ini yang penting dari PHP Anda
        const messageFromAPI = parsedData.msg || 'Pesan tidak tersedia.'; 
        const bankName = parsedData.bank || jenis_e_wallet;

        // --- Perbaikan Logika Penentuan Sukses/Gagal ---
        // Asumsi Sukses: account_name ada DAN tidak kosong/default
        if (accountName && accountName.toLowerCase() !== 'nama tidak ditemukan' && accountName.toLowerCase() !== 'nomor tidak terdaftar') {
          res.status(200).json({
            status: 'success',
            data: {
              status: 'Berhasil',
              jenis: bankName,
              namaPemilik: accountName,
              nomorRekeningNp: nomor,
            },
          });
        }
        // Asumsi Gagal Validasi (Nomor tidak terdaftar, dll):
        // Jika status "Gagal" dari kedaiMutasi, atau "valid" false,
        // atau jika accountName kosong/default "Nama tidak ditemukan" / "Nomor tidak terdaftar"
        else if (kedaiStatus === 'Gagal' || isValid === false || accountName === null || accountName.toLowerCase() === 'nama tidak ditemukan' || accountName.toLowerCase() === 'nomor tidak terdaftar') {
          // KONDISI KHUSUS UNTUK "EWALLET TIDAK TERSEDIA"
          let finalMessage = "Ewallet tidak tersedia"; // Default pesan yang Anda inginkan
          if (accountName && accountName.toLowerCase().includes('tidak terdaftar')) {
              finalMessage = "Ewallet tidak terdaftar."; // Lebih spesifik jika API bilang tidak terdaftar
          } else if (accountName && accountName.toLowerCase().includes('tidak ditemukan')) {
              finalMessage = "Ewallet tidak ditemukan.";
          }
          // Anda bisa menambahkan kondisi lain jika ada pesan khusus dari API untuk "tidak tersedia"
          
          res.status(200).json({
            status: 'error',
            message: finalMessage, // Gunakan pesan yang telah diatur
            data: {
                status: 'Gagal',
                jenis: bankName,
                namaPemilik: finalMessage, // Nama pemilik juga bisa jadi pesan gagal
                nomorRekeningNp: nomor,
            }
          });
        }
        // Kondisi Error dari API Eksternal (misal rate limit, invalid request)
        else if (kedaiStatus === 'Error') {
             res.status(200).json({
                status: 'error',
                message: parsedData.message || 'Terjadi kesalahan pada API eksternal (rate limit/internal error).',
                rawResponse: parsedData,
                data: {
                    status: 'Gagal',
                    jenis: jenis_e_wallet,
                    namaPemilik: parsedData.message || 'Error API (tidak dikenal)',
                    nomorRekeningNp: nomor,
                }
            });
        }
        // Kondisi Lainnya / Tidak Terduga
        else {
            console.error('[API Proxy Error] Unexpected response format or unknown status:', parsedData);
            res.status(500).json({
                status: 'error',
                message: 'Format respons API eksternal tidak terduga atau API berubah.',
                rawResponse: parsedData,
                data: {
                    status: 'Gagal',
                    jenis: jenis_e_wallet,
                    namaPemilik: 'Respons tidak valid/berubah',
                    nomorRekeningNp: nomor,
                }
            });
        }

      } catch (error) {
        console.error('[API Proxy Fatal Error] Kesalahan saat mem-proxy permintaan ke KedaiMutasi:', error);
        res.status(500).json({ status: 'error', message: `Kesalahan server internal: ${error.message}`, detail: error.message });
      }
    } else {
      res.status(405).end('Method Not Allowed');
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}