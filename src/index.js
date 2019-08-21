#!/usr/bin/env node
// 系统
let os = require('os');
let fs = require('fs');
let path = require('path');
let exec = require('child_process').exec;
let spawn = require('child_process').spawn;
// 网络
let http = require('http');
let url = require('url');
let mime = require('mime');
// markdown
let marked = require('marked');
marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function (code, lang) {
        return hljs.highlightAuto(code).value;
    },
    pedantic: false,
    gfm: true,
    tables: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false
});
let hljs = require('highlight.js');
let dateFormat = require('dateformat');
let template = require('art-template');
// 命令行
let argv = require("minimist")(process.argv.slice(2), {
    alias: {
        'port': 'p',
        'hostname': 'h',
        'dir': 'd',
        'log': 'l',
        'open': 'o',
        'silent': 's',
    },
    string: ['port', 'hostname', 'dir', 'open'],
    boolean: ['silent','log'],
    'default': {
        'port': 1408,
        'dir': process.cwd()
    }
});

// 开启关闭日志
argv.log ? console.log('----日志已开启----') : function(){console.log('----日志已关闭----');console.log = () => {}}();
console.log(`
===== default conf =====
--- argv.port ${argv.port}
--- argv.hostname ${argv.hostname}
--- argv.dir ${argv.dir}
--- argv.log ${argv.log}
--- rootDir ${argv.dir}
========================
`)
http.createServer(function (req, res) {
    // 解析请求，包括文件名
    console.log('url: ', req.url);
    let relativePath = decodeURIComponent(url.parse(req.url).pathname);
    let filePath = path.resolve(argv.dir, relativePath.substr(1));
    // 网址图标
    if (filePath.endsWith("favicon.ico")) {
        filePath = path.resolve(__dirname, './favicon.ico')
    }
    console.log('filePath: ' + filePath);
    // 从文件系统中读取请求的文件内容
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code == 'EISDIR') {
                // filePath 为目录或者不存在
                fs.stat(filePath, (err, stats) => {
                    if (err) {
                        console.log('get file: \'' + filePath + '\' stat wrong');
                        return404(res)
                    } else {
                        if (stats.isDirectory()) {
                            returnDir(res, stats, relativePath);
                        } else {
                            // 文件读取出错， 文件存在， 但不是目录， 不具有读权限
                            console.log('the file: \'' + filePath + '\' is not directory, but read file was wrong');
                            return404(res);
                        }
                    }
                })
            } else {
                // 文件不存在
                console.log('read file: \'' + filePath + '\' error, the file maybe not exist');
                return404(res);
            }
        } else {
            // 文件存在且读取成功
            returnFile(res, data, filePath);
        }
    });
}).listen(argv.port);
let indexUrl = "http://" + getIPAddress() + ":" + argv.port + "/" + (argv.open ? argv.open : '');
console.log("indexUrl: ", indexUrl);
if (!argv.silent) {
    openURL(indexUrl);
}

/**
 * Get ip(v4) address
 * @return {String} the ipv4 address or 'localhost'
 */
function getIPAddress() {
    let ifaces = os.networkInterfaces();
    let ip = '';
    for (let dev in ifaces) {
        ifaces[dev].forEach(function (details) {
            if (ip === '' && details.family === 'IPv4' && !details.internal) {
                ip = details.address;
                return;
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

function get404Page() {
    return '<!doctype html><title>404 Not Found</title><h1 style="text-align: center">404 Not Found</h1>';
}

function returnDir(res, stats, relativePath) {
    let filePath = path.resolve(argv.dir, relativePath.substr(1));
    fs.readdir(filePath, (err, files) => {
        if (err) {
            return404(res);
        } else {
            let dirArr = [];
            let fileArr = [];
            files.forEach(file => {
                let stats = fs.statSync(path.resolve(filePath, file));
                if (stats.isDirectory()) {
                    dirArr.push({
                        src: path.resolve(filePath, file).replace(argv.dir, ''),
                        fileName: file,
                        time: dateFormat(stats.mtime, 'yyyy-mm-dd HH:MM:ss')
                    })
                } else {
                    fileArr.push({
                        src: path.resolve(filePath, file).replace(argv.dir, ''),
                        fileName: file,
                        time: dateFormat(stats.birthtime, 'yyyy-mm-dd HH:MM:ss')
                    })
                }
            });
            html = template(path.resolve(__dirname, './index.html'), {
                title: 'ManBu',
                showTopDir: relativePath != '/',
                topDir: getTopDir(relativePath),
                dirs: dirArr,
                files: fileArr
            });
            res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
            res.write(html);
            res.end();
        }
    })
}

function returnFile(res, data, filePath) {
    if (mime.getType(filePath) === mime.getType('md')) {
        res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
        let html = template(path.resolve(__dirname, './article.html'), {
            article: {
                title: path.basename(filePath, ".md"),
                articleTitle: path.basename(filePath, ".md"),
                content: marked(data.toString())
            }
        });
        res.write(html)
    } else {
        res.writeHead(200, {'Content-Type': mime.getType(filePath) + ';' + 'charset=UTF-8'});
        res.write(data);
    }
    res.end();
}

function return404(res) {
    res.writeHead(404, {'Content-Type': 'text/html;charset=UTF-8'});
    res.write(get404Page());
    res.end();
}

function getTopDir(path) {
    if (path.endsWith('/')) {
        path = path.substring(0, path.length - 1);
    }
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    let pathArr = path.split('/');
    pathArr[pathArr.length - 1] = '';
    return pathArr.join('/')
}