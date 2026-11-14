import { Buffer } from 'node:buffer';
import { setTimeout as delay } from 'node:timers/promises';

export async function downloadAndroidApk(url, { fetchImpl = fetch, sleep = delay } = {}) {
  const attempts = 3;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    console.log(`Downloading Android APK (attempt ${attempt}/${attempts}, timeout 10 minutes).`);
    let retryable = true;
    try {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(600000) });
      if (!response.ok) {
        retryable = response.status === 408 || response.status === 429 || response.status >= 500;
        await response.body?.cancel();
        throw new Error(`APK download failed: HTTP ${response.status}`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
        retryable = false;
        throw new Error('APK is not a ZIP archive');
      }
      return bytes;
    } catch (error) {
      if (!retryable || attempt === attempts) {
        throw new Error(`Android APK download failed after ${attempt} attempt(s): ${error.message}`, { cause: error });
      }
      const waitMs = attempt * 10000;
      console.warn(`APK download attempt ${attempt} failed (${error.name}: ${error.message}); retrying in ${waitMs / 1000}s.`);
      await sleep(waitMs);
    }
  }
}
