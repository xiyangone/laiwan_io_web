# visual_regression

这里是项目的视觉回归目录，主要做两件事：

- 跑 Playwright 视觉对比
- 用 Docker watcher 盯页面改动并自动出图

现在这套流程统一走 Docker，不再以本地 Node 环境作为主要使用方式。

## 平时会产出什么

watcher 默认会生成 3 张图，文件都放在 `visual_regression/test`：

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

`diff-*.png` 不是只看最后一步，它会一直以最开始那张 `修改前` 为基准。  
也就是说，如果你在同一轮监听里连续改了两次同一个页面，最终这张 diff 会把两次变化都带上。

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
- 打开首页并先保存一张 `修改前`
- 监听页面变化
- 捕获到有效变化后生成 `修改后` 和 `diff`

## 这套逻辑现在怎么理解

- watcher 的截图目录固定是 `visual_regression/test`
- `修改前` 只保留本轮开始时的初始状态
- `修改后` 始终表示当前最新状态
- `diff` 始终表示“初始状态”和“当前最新状态”的差异
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
