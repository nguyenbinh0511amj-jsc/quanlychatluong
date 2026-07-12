import { MongoClient } from 'mongodb';

// Connection string từ Vercel Environment Variable
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'quanlychatluong';
const COLLECTION = 'print_status';

let cachedClient = null;

async function getDb() {
    if (!cachedClient) {
        cachedClient = new MongoClient(MONGODB_URI);
        await cachedClient.connect();
    }
    return cachedClient.db(DB_NAME);
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!MONGODB_URI) {
        return res.status(500).json({ error: 'MONGODB_URI not configured' });
    }

    try {
        const db = await getDb();
        const collection = db.collection(COLLECTION);

        if (req.method === 'GET') {
            // Lấy tất cả trạng thái in
            const docs = await collection.find({}).toArray();
            const statusMap = {};
            docs.forEach(doc => {
                statusMap[doc.order_kd] = true;
            });
            return res.status(200).json(statusMap);
        }

        if (req.method === 'POST') {
            const { orderIds } = req.body || {};
            if (!orderIds || !Array.isArray(orderIds)) {
                return res.status(400).json({ error: 'Missing orderIds array' });
            }

            // Upsert từng order (không tạo trùng)
            const ops = orderIds.map(id => ({
                updateOne: {
                    filter: { order_kd: id },
                    update: { 
                        $set: { 
                            order_kd: id, 
                            printed: true, 
                            printed_at: new Date().toISOString() 
                        } 
                    },
                    upsert: true
                }
            }));

            if (ops.length > 0) {
                await collection.bulkWrite(ops);
            }

            return res.status(200).json({ success: true, updated: orderIds.length });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('MongoDB error:', error);
        return res.status(500).json({ error: error.message });
    }
}
