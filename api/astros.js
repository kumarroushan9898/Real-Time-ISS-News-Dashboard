// Vercel serverless function — proxies astronauts endpoint from HTTP to HTTPS
export default async function handler(req, res) {
  try {
    const response = await fetch('http://api.open-notify.org/astros.json');
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
