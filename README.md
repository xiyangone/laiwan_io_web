# laiwan_io_web
提供来玩 web 资源支持

## 功能介绍
+ 来玩首页
+ 用户协议: {{domain}}/aggrement.html
+ 隐私政策: {{domain}}/privacy.html

## 本地开发

搭建 React 开发环境, 安装 node, yarn

### 启动开发环境
```shell
$ cd react_laiwan_com
$ yarn
```

## 跑 Web
```shell
$ cd react_laiwan_com
$ yarn start
```

## Docker 视觉回归

当前视觉回归与视觉 watcher 以 Docker 方式运行，默认截图目录为 `visual_regression/test`。

### 构建视觉测试镜像
```shell
$ npm run visual:docker:build
```

### 运行 Playwright 视觉回归
```shell
$ npm run test:visual:docker
```

### 更新 Playwright baseline
```shell
$ npm run test:visual:update:docker
```

### 启动 Docker watcher
```shell
$ npm run test:visual:watch:docker
```

说明：
- watcher 启动后会先保存第一张稳定帧，文件名类似 `docker-watch.1.png`
- 当页面出现稳定的文字、样式或布局变化后，会继续生成 `docker-watch.2.png`
- 如果差异像素达到阈值，会额外生成一张与稳定帧同尺寸的 `diff-*.png`
- Docker watcher 默认开启单次捕获模式，首次有效变化后自动退出
- 单次验证默认只保留 3 个当前 case 产物：`docker-watch.1.png`、`docker-watch.2.png`、最新一张 `diff-*.png`
- 重启 Docker watcher 时会自动清理当前 case 的旧 `diff-*.png`
- 详细约定见 `visual_regression/README.md`

## 如何发布到 production
```shell
$ git checkout master
$ ./make_tag
```
