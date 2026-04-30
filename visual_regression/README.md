# visual_regression

这里是项目的视觉回归目录，主要做两件事：

- 跑 Playwright 视觉对比
- 用 Docker watcher 盯页面改动并自动出图

现在这套流程统一走 Docker，不再以本地 Node 环境作为主要使用方式。

## 平时会产出什么

watcher 每次只验证一个页面，默认会生成 3 张图，文件都放在 `visual_regression/test`：

- `修改内容-修改前.png`
- `修改内容-修改后.png`
- `diff-修改内容.png`

例如执行：

```sh
sh visual_regression/run-visual-watch.sh 文案-来玩
```

会得到：

```text
visual_regression/test/文案-来玩-修改前.png
visual_regression/test/文案-来玩-修改后.png
visual_regression/test/diff-文案-来玩.png
```

`diff-*.png` 表示“本轮启动时的修改前”和“当前最新状态”的最终差异。  
同一轮里可以连续改多次同一个页面，watcher 只覆盖更新最终的 `修改后` 和 `diff`，不额外保存每一步的 diff。

验证其他页面时，重新启动 watcher 并在第二个参数传入目标 URL：

```sh
sh visual_regression/run-visual-watch.sh 文案-术语页 http://127.0.0.1:8080/#/glossary
```

## 怎么用

### 1. 先构建视觉测试镜像

```sh
bun run visual:docker:build
```

### 2. 跑 Playwright 视觉回归

```sh
bun run test:visual:docker
```

### 3. 更新 Playwright baseline

```sh
bun run test:visual:update:docker
```

### 4. 启动 watcher 看页面改动

```sh
sh visual_regression/run-visual-watch.sh 文案-来玩
```

这个命令会做几件事：

- 通过 `deploy/docker-compose.visual.yml` 拉起 Docker 容器
- 容器里启动页面服务
- 打开目标页面并先保存一张 `修改前`
- 持续监听当前页面变化
- 捕获到有效变化后覆盖生成 `修改后` 和最终 `diff`

Docker watcher 默认会持续监听。完成本轮修改后，在宿主端用 `Ctrl-C` 关闭 compose 进程。

## 这套逻辑现在怎么理解

- watcher 的截图目录固定是 `visual_regression/test`
- 一次 watcher 只验证启动时打开的目标页面
- `修改前` 表示目标页面启动时的初始状态
- `修改后` 表示目标页面当前最新状态
- `diff` 表示目标页面初始状态和当前最新状态的最终差异
- 运行中切到其他 URL 时，watcher 会提示重新启动并忽略跨页面 capture，避免污染 diff
- diff 图使用整页截图，样式是旧版的粉色高亮
- watcher 启动时会清理同名旧图，避免和本轮结果混在一起
- 页面里的动态类会直接被禁用，日志里会输出 `已禁用动态类`

## 目录里每个东西是做什么的

### 目录

- `helpers/`
  放 watcher 和视觉对比用到的辅助逻辑，比如截图处理、服务启动命令、命名规则。
- `specs/`
  放 Playwright 视觉回归用例。
- `test/`
  放 watcher 生成的截图、diff、日志和锁文件。

### 文件

- `README.md`
  就是你现在看的这份说明。
- `run-visual-watch.sh`
  watcher 的启动脚本。平时手动盯页面改动，直接跑它。
- `watch.js`
  watcher 主程序。负责起页面、开浏览器、监听变化、生成截图和 diff。
- `watch.test.js`
  watcher 的单测，主要验证命名、清理逻辑和 diff 行为。
- `docker-watch.spec.js`
  和 Docker watcher 相关的测试入口文件。
- `playwright.visual.config.js`
  Playwright 视觉回归的配置文件。
- `jest.visual.config.js`
  watcher 单测用的 Jest 配置文件。

### helpers 里的文件

- `helpers/screenshot.js`
  处理截图、生成 diff、禁用动态类、等待字体稳定。
- `helpers/serverCommand.js`
  决定视觉回归页面服务该怎么启动。
- `helpers/watchNaming.js`
  统一管理截图和 diff 的命名规则。

### specs 里的文件

- `specs/home.visual.spec.js`
  首页视觉回归用例。
- `specs/glossary.visual.spec.js`
  术语页视觉回归用例。

## 相关入口

- Docker Compose：`deploy/docker-compose.visual.yml`
- 根脚本：`package.json`

如果只记一个命令，日常最常用的是：

```sh
sh visual_regression/run-visual-watch.sh 修改内容
```
