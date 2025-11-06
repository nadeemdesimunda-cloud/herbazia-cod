export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, address, product } = req.body;

    if (!name || !phone || !address || !product) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ✅ Shopify Admin API (private app token)
    const response = await fetch(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION}/orders.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: {
            line_items: [{ title: product, quantity: 1 }],
            customer: { first_name: name, email },
            billing_address: { address1: address, phone },
            shipping_address: { address1: address, phone },
            financial_status: 'pending',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: 'Shopify error', details: errorText });
    }

    const data = await response.json();
    res.status(200).json({ success: true, order: data.order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

