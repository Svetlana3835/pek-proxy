const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  if (req.method === 'POST' && req.url === '/pek') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { queryString } = JSON.parse(body);
        const options = {
          hostname: 'calc.pecom.ru',
          path: '/bitrix/components/pecom/calc/ajax.php?' + queryString,
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0' }
        };
        const proxyReq = https.request(options, proxyRes => {
          let data = '';
          proxyRes.on('data', chunk => data += chunk);
          proxyRes.on('end', () => {
            console.log('PEK status:', proxyRes.statusCode, 'body:', data.substring(0, 300));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data || JSON.stringify({ error: 'Empty response' }));
          });
        });
        proxyReq.on('error', e => {
          res.writeHead(500);
          res.end(JSON.stringify({ error: e.message }));
        });
        proxyReq.end();
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  } else {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
  }
});

server.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
