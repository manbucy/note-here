# note-here
## 简介
在本地启动一个 server 服务，可以当做一个静态文件服务器，更能方便在浏览器中浏览 Markdown 文档。

## 安装

```js
npm i note-here
```

## 调试
`node ./src/index.js` == `notehere`

## 命令
- `-d` 指定文件服务的根目录, 默认在当前目录启动服务. eg: `notehere -d C:\Users\ManBu\Desktop`
- `-p` 指定服务监听的端口, 默认端口 `1408`. eg: `notehere -p 8080`
- `-l` 打开调试模式 eg: `notehere -l`