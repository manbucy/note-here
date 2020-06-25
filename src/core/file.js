let fs = require('fs');
let path = require('path');
let dateFormat = require('dateformat');
let template = require('art-template');
let mime = require('mime');

// markdown
let hljs = require('highlight.js');
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

function get404Page() {
    return '<!doctype html><title>404 Not Found</title><h1 style="text-align: center">404 Not Found</h1>';
}

function returnDir(res, stats, rootPath, relativePath) {
    let filePath = path.resolve(rootPath, relativePath.substr(1));
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
                        src: path.resolve(filePath, file).replace(rootPath, ''),
                        fileName: file,
                        time: dateFormat(stats.mtime, 'yyyy-mm-dd HH:MM:ss')
                    })
                } else {
                    fileArr.push({
                        src: path.resolve(filePath, file).replace(rootPath, ''),
                        fileName: file,
                        time: dateFormat(stats.birthtime, 'yyyy-mm-dd HH:MM:ss')
                    })
                }
            });
            html = template(path.resolve(__dirname, '../template/index.html'), {
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
        let html = template(path.resolve(__dirname, '../template/article.html'), {
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

module.exports = {
    returnDir,
    returnFile,
    return404,
}