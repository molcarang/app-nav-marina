/** The engine summary only replaces anchor controls while motoring above the speed threshold. */
export function isEngineCompactPanelActive({ connected, rpm, sogKnots }) {
    const speed = typeof sogKnots === 'string' ? Number(sogKnots.replace(',', '.')) : sogKnots;
    return connected === true && Number.isFinite(rpm) && rpm > 0
        && Number.isFinite(speed) && speed > 1.5;
}
