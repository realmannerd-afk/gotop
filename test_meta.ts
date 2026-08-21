import { fetchMetadata } from "./src/lib/metadata";
async function run() {
  console.log("Fetching mindphor.com...");
  const res = await fetchMetadata("https://mindphor.com");
  console.log("Result:", res);
}
run();
