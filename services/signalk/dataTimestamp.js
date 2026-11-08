export const MOTION_TIME_KEYS = {
    'navigation.position': 'collisionPositionReceivedAt',
    'navigation.speedOverGround': 'speedReceivedAt',
    'navigation.courseOverGroundTrue': 'courseReceivedAt',
};

// Preserve source age when provided; never make old telemetry fresh on receipt.
export function dataTimestamp(update, receivedAt) {
    if (update.timestamp === undefined) return receivedAt;
    const timestamp = Date.parse(update.timestamp);
    return Number.isFinite(timestamp) && timestamp <= receivedAt + 5000
        ? Math.min(timestamp, receivedAt) : null;
}
