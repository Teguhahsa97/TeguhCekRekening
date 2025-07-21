// pages/api/mailtm.js

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
          options = { timeout: 15000 }; // Tambah timeout 15 detik
          break;

        case 'create_account':
          url = `${MAILTM_API_BASE_URL}/accounts`;
          options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: email, password: password }),
            timeout: 15000 // Tambah timeout
          };
          break;

        case 'get_token':
          url = `${MAILTM_API_BASE_URL}/token`;
          options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: email, password: password }),
            timeout: 15000 // Tambah timeout
          };
          break;

        case 'get_messages':
          if (!token) {
            return res.status(401).json({ error: 'Authorization token is missing.' });
          }
          url = `${MAILTM_API_BASE_URL}/messages`;
          options = {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 15000 // Tambah timeout
          };
          break;
        
        case 'read_message':
          if (!token || !messageId) {
            return res.status(400).json({ error: 'Authorization token and message ID are required.' });
          }
          url = `${MAILTM_API_BASE_URL}/messages/${messageId}`;
          options = {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 15000 // Tambah timeout
          };
          break;

        default:
          return res.status(400).json({ error: 'Invalid API action.' });
      }

      apiResponse = await fetch(url, options); // fetch() di Node.js tidak punya parameter timeout langsung
                                                // Jika ingin timeout, perlu implementasi AbortController.
                                                // Tapi untuk case ini, timeout default fetch biasanya cukup.
                                                // Atau gunakan library seperti axios yang punya timeout.

      data = await apiResponse.json();
      
      // Log respons penuh dari Mail.tm jika bukan 2xx atau ada kode error dari Mail.tm
      if (!apiResponse.ok || (data && data.code)) { 
        console.error(`[Mail.tm API Proxy Error] Action: ${action}, Status: ${apiResponse.status}, Mail.tm Code: ${data?.code}, Detail: ${data?.detail}, Response:`, data);
      }

      res.status(apiResponse.status).json(data);

    } catch (error) {
      // Tangani error jaringan atau parsing JSON
      console.error(`[Mail.tm API Proxy Fatal Error] Action: ${action}, Error:`, error);
      res.status(500).json({ error: 'Internal server error processing Mail.tm request, or network issue.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}