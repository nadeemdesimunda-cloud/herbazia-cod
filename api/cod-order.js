export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { variantId, name, phone, email, address, city, productTitle, productUrl } = req.body || {};
    if (!variantId || !name || !phone || !address || !city) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const store = process.env.SHOPIFY_STORE_DOMAIN;    // e.g. herbazia.myshopify.com
    const token = process.env.SHOPIFY_ADMIN_API_TOKEN; // your shpat_ token
    const apiV  = process.env.SHOPIFY_API_VERSION || '2025-10';

    const orderPayload = {
      order: {
        line_items: [{ variant_id: Number(variantId), quantity: 1 }],
        financial_status: "pending", // COD
        tags: "COD, Herbazia COD Popup",
        note: `COD via popup\nPhone: ${phone}\nAddress: ${address}\nCity: ${city}\nProduct: ${productTitle}\nLink: ${productUrl || ''}`,
        email: email || undefined,
        send_receipt: true,
        send_fulfillment_receipt: false,
        shipping_address: { name, address1: address, city, country: "Pakistan" },
        billing_address:  { name, address1: address, city, country: "Pakistan" },
        transactions: [{ kind: "sale", status: "pending", gateway: "cash_on_delivery" }]
      }
    };

    const r = await fetch(`https://${store}/admin/api/${apiV}/orders.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await r.json();
    if (!r.ok || !data?.order) {
      console.error('Shopify error:', data);
      return res.status(500).json({ error: 'Shopify order create failed', details: data });
    }

    return res.status(200).json({
      ok: true,
      order_id: data.order.id,
      order_name: data.order.name,
      order_number: data.order.order_number
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
