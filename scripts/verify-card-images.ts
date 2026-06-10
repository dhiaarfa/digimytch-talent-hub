#!/usr/bin/env node
/**
 * Verify all pinned course/job card image URLs return HTTP 200.
 */
import {
  suggestCourseImageUrl,
  suggestJobImageUrl,
  listPinnedCourseImageUrls,
  listPinnedJobImageUrls,
} from "../src/lib/card-images";

const urls = new Map<string, string>();

for (const c of listPinnedCourseImageUrls()) {
  urls.set(`course:${c.title}`, c.image_url);
}
for (const j of listPinnedJobImageUrls()) {
  urls.set(`job:${j.company_name} — ${j.position_title}`, j.image_url);
}

// Sanity: unique URL count should be high (not everything sharing one default)
const unique = new Set(urls.values());
if (unique.size < 20) {
  console.error(`Expected diverse images, only ${unique.size} unique URLs`);
  process.exit(1);
}

async function main() {
  let failed = 0;
  for (const [label, url] of urls) {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.status !== 200) {
      console.error(`FAIL ${res.status} ${label}`);
      console.error(`  ${url}`);
      failed++;
    }
  }

  if (failed > 0) {
    console.error(`\n❌ ${failed}/${urls.size} image URLs failed`);
    process.exit(1);
  }

  console.log(`✅ All ${urls.size} card image URLs OK (${unique.size} unique)`);
}

void main();
