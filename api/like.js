const axios = require("axios");

export default async function handler(req, res) {
  const { product_id } = req.query;
  const SHOP = process.env.SHOPIFY_STORE;
  const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

  if (!product_id) return res.status(400).json({ error: "Missing product_id" });

  try {
    const metafields = await axios.get(
      `https://${SHOP}/admin/api/2024-01/products/${product_id}/metafields.json`,
      {
        headers: { "X-Shopify-Access-Token": TOKEN },
      }
    );

    const field = metafields.data.metafields.find(
      (f) => f.namespace === "likes" && f.key === "count"
    );

    let newCount = 1;

    if (field) {
      newCount = parseInt(field.value || "0") + 1;

      await axios.put(
        `https://${SHOP}/admin/api/2024-01/metafields/${field.id}.json`,
        {
          metafield: {
            id: field.id,
            value: newCount,
            type: "number_integer",
          },
        },
        { headers: { "X-Shopify-Access-Token": TOKEN } }
      );
    } else {
      await axios.post(
        `https://${SHOP}/admin/api/2024-01/products/${product_id}/metafields.json`,
        {
          metafield: {
            namespace: "likes",
            key: "count",
            value: newCount,
            type: "number_integer",
          },
        },
        { headers: { "X-Shopify-Access-Token": TOKEN } }
      );
    }

    res.json({ likes: newCount });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: "Like update failed" });
  }
}
