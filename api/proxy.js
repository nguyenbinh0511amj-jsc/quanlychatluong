export default async function handler(req, res) {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            return res.status(response.status).send('Upstream error');
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
