// pages/api/mailtm.js

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { action, email, password, token } = req.body;

    // Simulasikan delay API agar terlihat seperti ada proses jaringan
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1 detik

    try {
      switch (action) {
        case 'get_domains':
          // Simulasikan domain yang tersedia
          const simulatedDomains = [
            { id: 'dom1', domain: 'example.com', isActive: true },
            { id: 'dom2', domain: 'tempmail.net', isActive: true },
            { id: 'dom3', domain: 'mail.org', isActive: true },
          ];
          return res.status(200).json({ 'hydra:member': simulatedDomains });

        case 'create_account':
          // Simulasikan pembuatan akun
          const simulatedId = `acc_${Math.random().toString(36).substring(2, 10)}`;
          return res.status(200).json({ id: simulatedId, address: email, password: password });

        case 'get_token':
          // Simulasikan pemberian token
          const simulatedToken = `sim_jwt_${Math.random().toString(36).substring(2, 20)}`;
          return res.status(200).json({ token: simulatedToken });

        case 'get_messages':
          // Simulasikan email di inbox
          // Anda bisa membuat logika yang lebih kompleks di sini
          const simulatedMessages = [
            { id: 'msg1', subject: 'Welcome! Your Simulated Email', from: { address: 'support@simulated.com' }, intro: 'Thank you for using our service!', createdAt: new Date().toISOString(), text: 'This is a simulated welcome message.', html: ['<p>This is a <b>simulated</b> welcome message.</p>'] },
            { id: 'msg2', subject: 'Your Order #12345 (Simulated)', from: { address: 'shop@simulated.com' }, intro: 'Your order has been placed!', createdAt: new Date(Date.now() - 60000).toISOString(), text: 'Order details: Item A, Item B.', html: ['<p>Order details: <b>Item A</b>, <i>Item B</i>.</p>'] },
          ];
          return res.status(200).json({ 'hydra:member': simulatedMessages });

        case 'read_message':
          // Simulasikan membaca detail pesan
          // Untuk demo, kembalikan salah satu pesan simulasi
          const msgToRead = simulatedMessages.find(msg => msg.id === req.body.messageId) || {
            id: req.body.messageId,
            subject: 'Simulated Message Detail',
            from: { address: 'system@simulated.com' },
            intro: 'This is a detailed view of a simulated message.',
            text: 'This is the full text body of the simulated message.',
            html: ['<p>This is the <b>full HTML body</b> of the simulated message.</p>'],
            createdAt: new Date().toISOString(),
          };
          return res.status(200).json(msgToRead);

        default:
          return res.status(400).json({ error: 'Invalid API action for TempMail simulation.' });
      }
    } catch (error) {
      console.error('[API Proxy Fatal Error] Error in TempMail simulation API Route:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error in TempMail simulation.', detail: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
