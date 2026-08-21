import { fetchMetadata } from "./src/lib/metadata";
async function run() {
  try {
    const meta = await fetchMetadata("https://mindphor.com");
    console.log("META:", meta);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run();
