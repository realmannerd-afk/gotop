/* eslint-disable @typescript-eslint/no-explicit-any */
import http from 'http';
import https from 'https';
import dns from 'dns';
import { isSafeUrl } from './url';

export interface MetadataResult {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
}

function fetchSafe(urlStr: string): Promise<{ ok: boolean; headers: any; body: NodeJS.ReadableStream | null }> {
  return new Promise((resolve, reject) => {
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
      // Prevents DNS rebinding by performing validation at the socket connection phase
      lookup: (hostname: string, dnsOptions: any, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
        dns.lookup(hostname, dnsOptions, (err, address, family) => {
          if (err) return callback(err, address, family);
          if (
            address.startsWith('127.') || 
            address.startsWith('10.') || 
            address.startsWith('192.168.') || 
            address.startsWith('169.254.') ||
            address.startsWith('0.') ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(address) ||
            address === '::1' || 
            address.toLowerCase().startsWith('fc00:') || 
            address.toLowerCase().startsWith('fd00:') || 
            address.toLowerCase().startsWith('fe80:')
          ) {
            return callback(new Error('DNS Rebinding prevented: Address resolved to forbidden IP'), address, family);
          }
          callback(null, address, family);
        });
      }
    };

    const req = client.request(url, options, (res) => {
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

export async function fetchMetadata(url: string): Promise<MetadataResult | null> {
  if (!(await isSafeUrl(url))) {
    return null;
  }

  try {
    const response = await fetchSafe(url);
    if (!response.ok) return null;

    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('text/html')) {
      return null;
    }

    const contentLength = response.headers['content-length'];
    if (contentLength && parseInt(contentLength as string) > 5 * 1024 * 1024) {
      return null;
    }

    if (!response.body) return null;

    let html = '';
    let bytesRead = 0;
    const MAX_BYTES = 500 * 1024; // 500KB

    return new Promise((resolve) => {
      const stream = response.body!;
      
      const finish = () => {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) || 
                          html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
        const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                             html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["'][^>]*>/i);
        const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
                             html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i);

        const baseUrl = new URL(url);
        const resolveUrl = (href?: string) => {
          if (!href) return undefined;
          try { return new URL(href, baseUrl).toString(); } catch (_e) { return href; }
        };

        resolve({
          title: titleMatch ? titleMatch[1].trim() : undefined,
          description: descMatch ? descMatch[1].trim() : undefined,
          image: resolveUrl(ogImageMatch ? ogImageMatch[1].trim() : undefined),
          favicon: resolveUrl(faviconMatch ? faviconMatch[1].trim() : '/favicon.ico'),
        });
      };

      stream.on('data', (chunk) => {
        bytesRead += chunk.length;
        html += chunk.toString();
        if (bytesRead > MAX_BYTES) {
          (stream as any).destroy();
          finish();
        }
      });
      stream.on('end', () => finish());
      stream.on('error', () => resolve(null));
    });
  } catch (_error) {
    return null;
  }
}
