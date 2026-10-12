module.exports = ({ config }) => process.env.NAVMARINA_RASPBERRY === '1' || process.env.NAVMARINA_PWA === '1'
    ? { ...config, web: { ...config.web, output: 'single' } }
    : config;
