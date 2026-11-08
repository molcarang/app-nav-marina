const validEntry = entry => entry !== null && typeof entry === 'object'
    && Number.isInteger(entry.rpm) && entry.rpm >= 0 && entry.rpm <= 20000
    && Number.isFinite(entry.litresPerHour) && entry.litresPerHour >= 0;

export function isValidEngineConsumptionTable(table) {
    return Array.isArray(table) && Array.from(table).every(validEntry)
        && new Set(table.map(entry => entry.rpm)).size === table.length;
}

/** Restore complete valid tables; do not silently keep a partial corrupt curve. */
export function normalizeEngineConsumptionTable(table) {
    return isValidEngineConsumptionTable(table)
        ? table.map(({ rpm, litresPerHour }) => ({ rpm, litresPerHour })).sort((a, b) => a.rpm - b.rpm)
        : [];
}

/** Apply the user-supplied upper limits once; subsequent edits and deletions win. */
export function restoreEngineConsumptionSettings(saved = {}) {
    let table = normalizeEngineConsumptionTable(saved.engineConsumptionTable);
    if (saved.engineConsumptionReferenceVersion !== ENGINE_CONSUMPTION_REFERENCE_VERSION) {
        const entries = new Map(table.map(entry => [entry.rpm, entry]));
        for (const entry of DEFAULT_ENGINE_CONSUMPTION_TABLE) entries.set(entry.rpm, { ...entry });
        table = normalizeEngineConsumptionTable([...entries.values()]);
    }
    return { engineConsumptionTable: table, engineConsumptionReferenceVersion: ENGINE_CONSUMPTION_REFERENCE_VERSION };
}

export function parseEngineConsumptionRows(rows) {
    const table = [], seen = new Set();
    for (const [index, entry] of rows.entries()) {
        const rpmText = entry.rpm.trim();
        const litresText = entry.litresPerHour.trim();
        const item = { rpm: Number(rpmText), litresPerHour: Number(litresText.replace(',', '.')) };
        if (!/^\d+$/.test(rpmText) || !/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(litresText) || !validEntry(item)) {
            return { table: null, error: 'consumptionTableInvalid', row: index + 1 };
        }
        if (seen.has(item.rpm)) return { table: null, error: 'consumptionTableDuplicate', row: index + 1 };
        seen.add(item.rpm);
        table.push(item);
    }
    return { table: normalizeEngineConsumptionTable(table), error: null };
}
export const ENGINE_CONSUMPTION_REFERENCE_VERSION = 1;
export const DEFAULT_ENGINE_CONSUMPTION_TABLE = [
    { rpm: 1600, litresPerHour: 1.2 },
    { rpm: 1800, litresPerHour: 1.5 },
    { rpm: 2000, litresPerHour: 1.9 },
    { rpm: 2200, litresPerHour: 2.4 },
    { rpm: 2400, litresPerHour: 3.0 },
    { rpm: 2600, litresPerHour: 3.7 },
    { rpm: 2800, litresPerHour: 4.5 },
    { rpm: 3000, litresPerHour: 5.4 },
    { rpm: 3200, litresPerHour: 6.5 },
];

