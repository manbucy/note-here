let os = require('os');
let exec = require('child_process').exec;
let spawn = require('child_process').spawn;

function getIPAddress() {
    let ifaces = os.networkInterfaces();
    let ip = '';
    for (let dev in ifaces) {
        ifaces[dev].forEach(function (details) {
            if (ip === '' && details.family === 'IPv4' && !details.internal) {
                ip = details.address;
                return 0;
            }
        });
    }
    return ip || "127.0.0.1";
}

function openURL(url) {
    switch (process.platform) {
        case "darwin":
            exec('open ' + url);
            break;
        case "win32":
            exec('start ' + url);
            break;
        default:
            spawn('xdg-open', [url]);
    }
}

module.exports = {
    getIPAddress,
    openURL
}