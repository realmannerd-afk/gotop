import { fetchMetadata } from "./src/lib/metadata";
const { isSafeUrl } = require('./src/lib/url');
import http from 'http';
import https from 'https';

async function testFetch(urlStr) {
  const url = new URL(urlStr);
  const client = url.protocol === 'https:' ? https : http;
  return new Promise((resolve) => {
    client.request(url, (res) => {
      resolve({ status: res.statusCode, headers: res.headers, location: res.headers.location });
    }).end();
  });
}

async function run() {
  console.log("Direct request mindphor.com:", await testFetch("https://mindphor.com"));
  console.log("Direct request www.mindphor.com:", await testFetch("https://www.mindphor.com"));
}
run();
