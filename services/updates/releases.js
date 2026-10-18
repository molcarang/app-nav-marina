export const RELEASES_API = 'https://api.github.com/repos/molcarang/app-nav-marina/releases?per_page=100';
const ASSETS = { web: 'navmarina-web.zip', raspberry: 'navmarina-raspberry.zip', android: 'navmarina-android.apk' };

/** Solo versiones publicadas, del mismo canal y con el paquete de esta plataforma. */
export function findAvailableUpdate(releases, current) {
    if (!Array.isArray(releases)) return null;
    const candidates = [];
    for (const release of releases) {
        if (!release || typeof release !== 'object') continue;
        if (release.draft || (current.channel === 'main' && release.prerelease)) continue;
        let info;
        try { info = JSON.parse(release.body); } catch { continue; }
        if (info?.schema !== 1 || info.app !== 'navmarina' || info.channel !== current.channel
            || !Number.isSafeInteger(info.buildNumber) || info.buildNumber <= current.buildNumber
            || typeof info.version !== 'string') continue;
        const asset = (Array.isArray(release.assets) ? release.assets : []).find(item => item.name === ASSETS[current.target] && item.state === 'uploaded');
        if (!asset) continue;
        const expected = 'https://github.com/molcarang/app-nav-marina/releases/';
        if (typeof asset.browser_download_url !== 'string' || !asset.browser_download_url.startsWith(expected + 'download/')) continue;
        candidates.push({ version: info.version, buildNumber: info.buildNumber, url: asset.browser_download_url, releaseId: release.id });
    }
    return candidates.sort((a, b) => b.buildNumber - a.buildNumber)[0] ?? null;
}

export async function checkForUpdate(current, { signal, fetcher = fetch } = {}) {
    const response = await fetcher(RELEASES_API, {
        headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store', signal,
    });
    if (!response.ok) throw new Error(`Update check HTTP ${response.status}`);
    return findAvailableUpdate(await response.json(), current);
}
