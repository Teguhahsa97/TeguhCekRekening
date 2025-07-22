// pages/api/mailtm.js

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { action, email, password, token, messageId } = req.body;

    // Simulasikan delay API (penting untuk UX)
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1 detik

    try {
      switch (action) {
        case 'get_domains':
          // Simulasi daftar domain
          const simulatedDomains = [
            { id: 'dom1', domain: 'example.com', isActive: true },
            { id: 'dom2', domain: 'mymail.net', isActive: true }, // Tambah domain
            { id: 'dom3', domain: 'temp-inbox.org', isActive: true }, // Tambah domain
          ];
          console.log('[API Simulation] Serving simulated domains.');
          return res.status(200).json({ 'hydra:member': simulatedDomains });

        case 'create_account':
          // Simulasi pembuatan akun (selalu sukses dalam simulasi)
          const simulatedId = `acc_${Math.random().toString(36).substring(2, 10)}`;
          console.log(`[API Simulation] Created simulated account: ${email}`);
          return res.status(200).json({ id: simulatedId, address: email, password: password });

        case 'get_token':
          // Simulasi pemberian token (selalu sukses)
          const simulatedToken = `sim_jwt_${Math.random().toString(36).substring(2, 20)}`;
          console.log(`[API Simulation] Generated simulated token for: ${email}`);
          return res.status(200).json({ token: simulatedToken });

        case 'get_messages':
          // Simulasikan email di inbox.
          // Untuk demo, selalu kembalikan dua pesan ini.
          const simulatedMessages = [
            { id: 'msg1', subject: 'Welcome! Your Simulated Email', from: { address: 'support@simulated.com' }, intro: 'Thank you for using our service!', createdAt: new Date().toISOString(), text: 'This is a simulated welcome message.', html: ['<p>This is a <b>simulated</b> welcome message.</p>'] },
            { id: 'msg2', subject: 'Your Order #12345 (Simulated)', from: { address: 'shop@simulated.com' }, intro: 'Your order has been placed!', createdAt: new Date(Date.now() - 60000).toISOString(), text: 'Order details: Item A, Item B.', html: ['<p>Order details: <b>Item A</b>, <i>Item B</i>.</p>'] },
          ];
          console.log('[API Simulation] Serving simulated messages.');
          return res.status(200).json({ 'hydra:member': simulatedMessages });

        case 'read_message':
          // Simulasikan membaca detail pesan
          const msgToRead = {
            id: messageId,
            subject: 'Simulated Message Detail for ' + messageId,
            from: { address: 'system@simulated.com' },
            intro: 'This is a detailed view of a simulated message.',
            text: 'This is the full text body of the simulated message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            html: ['<p>This is the <b>full HTML body</b> of the simulated message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>'],
            createdAt: new Date().toISOString(),
          };
          console.log(`[API Simulation] Reading simulated message: ${messageId}`);
          return res.status(200).json(msgToRead);

        default:
          console.log(`[API Simulation] Invalid action: ${action}`);
          return res.status(400).json({ status: 'error', message: 'Invalid API action for TempMail simulation.' });
      }
    } catch (error) {
      console.error('[API Simulation Fatal Error] Error in API Route:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error in TempMail simulation.', detail: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
