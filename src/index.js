#!/usr/bin/env node
let http = require('http');
let fs = require('fs');
let url = require('url');
let mime = require('mime');
let path = require('path');
let hljs = require('highlight.js');
let dateFormat = require('dateformat');
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
let template = require('art-template');
const rootDir = process.cwd();
console.log('rootDir: ' + rootDir);

http.createServer(function (req, res) {
    // 解析请求，包括文件名
    console.log('url: ', req.url);
    let relativePath = decodeURIComponent(url.parse(req.url).pathname);
    let filePath = path.resolve(rootDir, relativePath.substr(1));
    console.log('filePath: ' + filePath);
    // 从文件系统中读取请求的文件内容
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log(err.code)
            console.log(typeof err.code)
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
}).listen(8080);

function get404Page() {
    return '<!doctype html><title>404 Not Found</title><h1 style="text-align: center">404 Not Found</h1>';
}

function returnDir(res, stats, relativePath) {
    console.log('return dir');
    let filePath = path.resolve(rootDir, relativePath.substr(1));
    fs.readdir(filePath, (err, files) => {
        if (err) {
            return404(res);
        } else {
            let dirArr = [];
            let fileArr = [];
            files.forEach(file => {
                console.log(path.resolve(filePath, file));
                let stats = fs.statSync(path.resolve(filePath, file));
                if (stats.isDirectory()) {
                    dirArr.push({
                        src: path.resolve(filePath, file).replace(rootDir, ''),
                        fileName: file,
                        time: dateFormat(stats.mtime, 'yyyy-mm-dd HH:MM:ss')
                    })
                } else {
                    fileArr.push({
                        src: path.resolve(filePath, file).replace(rootDir, ''),
                        fileName: file,
                        time: dateFormat(stats.birthtime, 'yyyy-mm-dd HH:MM:ss')
                    })
                }
            });
            html = template(path.resolve(__dirname, './index.html'), {
                title: 'test',
                showTopDir: relativePath != '/',
                topDir: getTopDir(relativePath),
                dirs: dirArr,
                files: fileArr
            });
            console.log('relativePath', relativePath)
            console.log('topDir',getTopDir(relativePath));
            res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
            res.write(html);
            res.end();
        }
    })
}

function returnFile(res, data, filePath) {
    console.log('return file');
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
    console.log('return 404');
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
    pathArr[pathArr.length -1] = '';
    return pathArr.join('/')
}