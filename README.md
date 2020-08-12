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
- `-o` 默认打开的文件 eg: `notehere -o index.md`
## 待完成
- 支持音频、视频文件直接打开
- 支持sql文件直接打开浏览
- 支持其它普通文本文件打开

## 截图展示
- 首页  
![Image text](https://github.com/manbucy/note-here/blob/master/doc/image/index.png)  
- md文章  
![Image text](https://github.com/manbucy/note-here/blob/master/doc/image/mk.png)  
- 图片  
![Image text](https://github.com/manbucy/note-here/blob/master/doc/image/dd.png)  