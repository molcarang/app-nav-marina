const buildInfo = require('./config/buildInfo.json');

module.exports = ({ config }) => {
    const result = { ...config };
    if (process.env.NAVMARINA_RASPBERRY === '1' || process.env.NAVMARINA_PWA === '1') {
        result.web = { ...config.web, output: 'single' };
    }
    if (buildInfo.target === 'android' && buildInfo.buildNumber > 0) {
        result.android = { ...config.android, versionCode: config.android.versionCode + buildInfo.buildNumber };
    }
    return result;
};
