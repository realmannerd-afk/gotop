import { fetchMetadata } from "./src/lib/metadata";
const { isSafeUrl } = require('./src/lib/url');
import http from 'http';
import https from 'https';
import dns from 'dns';

function fetchSafe(urlStr: string, redirects = 0): Promise<{ ok: boolean; headers: any; body: NodeJS.ReadableStream | null }> {
  return new Promise((resolve, reject) => {
    if (redirects > 3) return reject(new Error('Too many redirects'));
    let url: URL;
    try {
      url = new URL(urlStr);
    } catch (_e) {
      return reject(new Error('Invalid URL'));
    }

    const client = url.protocol === 'https:' ? https : http;
    const options: any = {
      method: 'GET',
      headers: {
        'User-Agent': 'gotop-bot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      lookup: (hostname: string, dnsOptions: any, callback: (err: NodeJS.ErrnoException | null, address: string | any[], family: number) => void) => {
        dns.lookup(hostname, dnsOptions, (err, address, family) => {
          if (err) return callback(err, address as any, family);
          
          let ips: string[] = [];
          if (typeof address === 'string') {
            ips.push(address);
          } else if (Array.isArray(address)) {
            ips = address.map(a => typeof a === 'string' ? a : a.address);
          }

          for (const ip of ips) {
            if (
              ip.startsWith('127.') || 
              ip.startsWith('10.') || 
              ip.startsWith('192.168.') || 
              ip.startsWith('169.254.') ||
              ip.startsWith('0.') ||
              /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
              ip === '::1' || 
              ip.toLowerCase().startsWith('fc00:') || 
              ip.toLowerCase().startsWith('fd00:') || 
              ip.toLowerCase().startsWith('fe80:')
            ) {
              return callback(new Error('DNS Rebinding prevented'), address as any, family);
            }
          }
          
          callback(null, address as any, family);
        });
      }
    };

    const req = client.request(url, options, (res) => {
      console.log("Response:", res.statusCode, res.headers.location);
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, url).toString();
        fetchSafe(nextUrl, redirects + 1).then(resolve).catch(reject);
        return;
      }
      resolve({
        ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
        headers: res.headers,
        body: res
      });
    });

    req.on('error', reject);
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

async function run() {
  const url = "https://mindphor.com";
  const response = await fetchSafe(url);
  console.log("OK:", response.ok);
  console.log("ContentType:", response.headers['content-type']);
}
run();
