const { fetchMetadata } = require('./src/lib/metadata.js');
async function run() {
  console.log(await fetchMetadata('https://mindphor.com'));
}
run();
