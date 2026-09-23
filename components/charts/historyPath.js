/** Curva compartida por el gráfico de la tarjeta y su vista ampliada. */
import { historyWindowMs, HISTORY_GAP_MS } from '../../features/console/model/twsHistory.js';

function curvePath(points) {
    return points.reduce((path, point, index) => {
        if (index === 0) return `M ${point.x},${point.y}`;
        const previous = points[index - 1];
        const middle = (previous.x + point.x) / 2;
        return `${path} C ${middle},${previous.y} ${middle},${point.y} ${point.x},${point.y}`;
    }, '');
}

export function getHistoryChart(data, width, height, range, now = Date.now(), hours = 2) {
    const windowMs = historyWindowMs(hours);
    const timed = data.length > 0 && typeof data[0] === 'object';
    const groups = [];
    let points = [];
    let previousTime;
    data.forEach((sample, index) => {
        if (timed && (sample.time < now - windowMs || sample.time > now)) return;
        if (timed && previousTime !== undefined && sample.time - previousTime > HISTORY_GAP_MS) {
            groups.push(points); points = [];
        }
        points.push({
            x: timed ? (sample.time - (now - windowMs)) / windowMs * width
                : index / Math.max(1, data.length - 1) * width,
            y: height - Math.min((timed ? sample.value : sample) / (range || 1), 1) * (height - 5),
        });
        previousTime = timed ? sample.time : undefined;
    });
    groups.push(points);
    const segments = groups.filter(group => group.length > 1);
    return {
        line: segments.map(curvePath).join(' '),
        area: segments.map(group => `${curvePath(group)} L ${group[group.length - 1].x},${height} L ${group[0].x},${height} Z`).join(' '),
    };
}

export function getSmoothPath(data, width, height, range) {
    return getHistoryChart(data, width, height, range).line;
}
