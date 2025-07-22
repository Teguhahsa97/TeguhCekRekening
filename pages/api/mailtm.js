// pages/api/mailtm.js

// Fungsi bantu untuk timeout pada fetch (penting untuk API eksternal)
const fetchWithTimeout = async (url, options, timeout = 15000) => { // Timeout 15 detik
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


const MAILTM_API_BASE_URL = 'https://api.mail.tm';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { action, email, password, token, messageId } = req.body;

    try {
      let apiResponse;
      let data;
      let url;
      let options;

      switch (action) {
        case 'get_domains':
          url = `${MAILTM_API_BASE_URL}/domains`;
          options = {};
          break;

        case 'create_account':
          url = `${MAILTM_API_BASE_URL}/accounts`;
          options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: email, password: password }),
          };
          break;

        case 'get_token':
          url = `${MAILTM_API_BASE_URL}/token`;
          options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: email, password: password }),
          };
          break;

        case 'get_messages':
          if (!token) {
            return res.status(401).json({ error: 'Authorization token is missing.' });
          }
          url = `${MAILTM_API_BASE_URL}/messages`;
          options = {
            headers: { 'Authorization': `Bearer ${token}` },
          };
          break;
        
        case 'read_message':
          if (!token || !messageId) {
            return res.status(400).json({ error: 'Authorization token and message ID are required.' });
          }
          url = `${MAILTM_API_BASE_URL}/messages/${messageId}`;
          options = {
            headers: { 'Authorization': `Bearer ${token}` },
          };
          break;

        default:
          return res.status(400).json({ error: 'Invalid API action.' });
      }

      // Gunakan fetchWithTimeout untuk semua panggilan ke Mail.tm
      apiResponse = await fetchWithTimeout(url, options); 
      const rawResponseText = await apiResponse.text(); // Ambil raw text dulu

      // Log respons mentah untuk debugging
      console.log(`[Mail.tm API Proxy Debug] Raw Response for action '${action}':`, rawResponseText);

      try {
          data = JSON.parse(rawResponseText);
      } catch (e) {
          // Jika respons bukan JSON, kemungkinan ada blocking atau error HTML dari Mail.tm
          console.error(`[Mail.tm API Proxy Error] Failed to parse JSON for action '${action}'. Raw response:`, rawResponseText);
          return res.status(500).json({ 
              status: 'error', 
              message: `Respon dari Mail.tm bukan JSON. Kemungkinan diblokir atau ada error HTML.`, 
              rawResponse: rawResponseText 
          });
      }
      
      // Log respons yang sudah diparse
      console.log(`[Mail.tm API Proxy Debug] Parsed Response for action '${action}':`, data);

      // Periksa status HTTP dan kode error dari Mail.tm
      if (!apiResponse.ok || (data && data.code)) {
        console.error(`[Mail.tm API Error - Action: ${action}] Status: ${apiResponse.status}, Mail.tm Code: ${data?.code}, Detail: ${data?.detail}`);
        // Kirim error yang lebih informatif ke frontend
        return res.status(apiResponse.status).json({
          status: 'error',
          message: data?.detail || data?.message || `Mail.tm API error: ${apiResponse.status} (Code: ${data?.code || 'N/A'})`,
          rawResponse: data
        });
      }

      res.status(apiResponse.status).json(data);

    } catch (error) {
      console.error(`[API Proxy Fatal Error - Action: ${action}] Kesalahan saat menghubungi Mail.tm:`, error);
      let errorMessage = 'Kesalahan server internal saat menghubungi Mail.tm.';
      if (error.message.includes('timeout')) {
          errorMessage = 'Permintaan ke Mail.tm melebihi batas waktu. Server mungkin sibuk.';
      } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Kesalahan jaringan atau Mail.tm tidak dapat dijangkau.';
      }
      res.status(500).json({ status: 'error', message: errorMessage, detail: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
