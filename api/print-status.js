import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// File lưu trạng thái in (persistent trên Vercel với /tmp)
const STATUS_FILE = join('/tmp', 'print-status.json');

function readStatus() {
    try {
        if (existsSync(STATUS_FILE)) {
            return JSON.parse(readFileSync(STATUS_FILE, 'utf8'));
        }
    } catch (e) { }
    return {};
}

function writeStatus(data) {
    writeFileSync(STATUS_FILE, JSON.stringify(data), 'utf8');
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        const status = readStatus();
        return res.status(200).json(status);
    }

    if (req.method === 'POST') {
        const { orderIds } = req.body || {};
        if (!orderIds || !Array.isArray(orderIds)) {
            return res.status(400).json({ error: 'Missing orderIds array' });
        }

        const status = readStatus();
        orderIds.forEach(id => {
            status[id] = true;
        });
        writeStatus(status);

        return res.status(200).json({ success: true, updated: orderIds.length });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
