import dns from 'dns/promises';

export async function isSafeUrl(urlString: string): Promise<boolean> {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname;
    
    // Quick regex checks for known internal IPs
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    const ipsToCheck: string[] = [];

    if (isIp) {
      ipsToCheck.push(hostname);
    } else {
      // Reject localhost / local domains explicitly
      if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
        return false;
      }
      
      try {
        const lookup = await dns.lookup(hostname);
        ipsToCheck.push(lookup.address);
      } catch (_e) {
        // DNS lookup failed, unsafe to fetch
        return false;
      }
    }

    for (const ip of ipsToCheck) {
      if (
        ip.startsWith('127.') || 
        ip.startsWith('10.') || 
        ip.startsWith('192.168.') || 
        ip.startsWith('169.254.') ||
        ip.startsWith('0.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
      ) {
        return false; // Blocks private/loopback/link-local IPv4
      }
      // IPv6 localblocks
      if (ip === '::1' || ip.toLowerCase().startsWith('fc00:') || ip.toLowerCase().startsWith('fd00:') || ip.toLowerCase().startsWith('fe80:')) {
        return false;
      }
    }

    return true;
  } catch (_e) {
    return false;
  }
}

export function normalizeUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    // Remove unnecessary UTM tracking params if present
    const params = new URLSearchParams(url.search);
    const toDelete = Array.from(params.keys()).filter(k => k.startsWith('utm_'));
    toDelete.forEach(k => params.delete(k));
    url.search = params.toString();
    // Keep trailing slash standard
    return url.toString();
  } catch (_e) {
    return urlString;
  }
}
