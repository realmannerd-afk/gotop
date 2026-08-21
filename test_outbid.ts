import { fetchMetadata } from "./src/lib/metadata";
async function run() {
  console.log("Fetching outbid.lol...");
  const res = await fetchMetadata("https://outbid.lol");
  console.log("Result:", res);
}
run();
