#!/usr/bin/env node
// 系统
let fs = require('fs');
let path = require('path');

// 网络
let http = require('http');
let url = require('url');

let netUtil = require('./core/net.js')
let fileUtil = require('./core/file')

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

// 创建http服务
http.createServer(function (req, res) {
    // 解析请求，包括文件名
    console.log('url: ', req.url);
    let relativePath = decodeURIComponent(url.parse(req.url).pathname);
    let filePath = path.resolve(argv.dir, relativePath.substr(1));
    // 网址图标
    if (filePath.endsWith("favicon.ico")) {
        filePath = path.resolve(__dirname, './template/favicon.ico')
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
                        fileUtil.return404(res)
                    } else {
                        if (stats.isDirectory()) {
                            fileUtil.returnDir(res, stats, argv.dir, relativePath);
                        } else {
                            // 文件读取出错， 文件存在， 但不是目录， 不具有读权限
                            console.log('the file: \'' + filePath + '\' is not directory, but read file was wrong');
                            fileUtil.return404(res);
                        }
                    }
                })
            } else {
                // 文件不存在
                console.log('read file: \'' + filePath + '\' error, the file maybe not exist');
                fileUtil.return404(res);
            }
        } else {
            // 文件存在且读取成功
            fileUtil.returnFile(res, data, filePath);
        }
    });
}).listen(argv.port);
let indexUrl = "http://" + netUtil.getIPAddress() + ":" + argv.port + "/" + (argv.open ? argv.open : '');
console.log("indexUrl: ", indexUrl);
if (!argv.silent) {
    netUtil.openURL(indexUrl);
}