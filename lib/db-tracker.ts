import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export async function trackProductPrice(product: {
    title: string;
    url: string;
    current_price: number;
    source: string;
    image_url: string;
}) {
    // We use raw SQL with pg explicitly to handle the connection string provided by user directly
    const client = await pool.connect();

    try {
        // 1. Check/Insert Product
        // Upsert logic: If URL exists, update latest_price
        const productRes = await client.query(`
            INSERT INTO products (title, url, source, image_url, latest_price, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (url) 
            DO UPDATE SET 
                latest_price = EXCLUDED.latest_price,
                updated_at = NOW()
            RETURNING id;
        `, [product.title, product.url, product.source, product.image_url, product.current_price]);

        const productId = productRes.rows[0].id;

        // 2. Insert Price History
        // Only insert if price changed? Or always?
        // For accurate TS forecasting, regular intervals (daily) are better than just changes.
        // We'll insert always for now to build dataset.
        await client.query(`
            INSERT INTO price_history (product_id, price, created_at)
            VALUES ($1, $2, NOW())
        `, [productId, product.current_price]);

        console.log(`[DB] Tracked price for ${productId}`);
        return productId;

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        client.release();
    }
}

export async function getProductHistory(url: string) {
    const client = await pool.connect();
    try {
        // 1. Get Product ID
        const productRes = await client.query('SELECT id FROM products WHERE url = $1', [url]);

        if (productRes.rows.length === 0) return null;

        const productId = productRes.rows[0].id;

        // 2. Get History
        const historyRes = await client.query(`
            SELECT created_at, price 
            FROM price_history 
            WHERE product_id = $1 
            ORDER BY created_at ASC
        `, [productId]);

        return historyRes.rows;

    } catch (err) {
        console.error("DB History Error:", err);
        return null;
    } finally {
        client.release();
    }
}
