# visual_regression

这个目录用于存放当前视觉监听系统的截图产物和约定说明。

## 当前目录约定

- 截图输出目录：`visual_regression/test`
- watcher 稳定帧命名格式：`用例名.1.png`、`用例名.2.png`、`用例名.3.png`
- watcher 差异图命名格式：`diff-用例名-序号-时间戳.png`
- `用例名` 来自 `VISUAL_CASE_FILE` 的文件名部分，并自动去掉 `.test.ts`、`.test.js`、`.spec.ts`、`.spec.js`

示例：

```text
VISUAL_CASE_FILE=visual_regression/test/aa/bb/点击用户头像.test.ts
```

生成：

```text
visual_regression/test/点击用户头像.1.png
visual_regression/test/点击用户头像.2.png
visual_regression/test/diff-点击用户头像-2-20260429-054334-270.png
```

## 当前运行方式

### 方式 1：从仓库根目录启动 shell 脚本

```sh
./start_visual_watch.sh visual_regression/test/aa/bb/点击用户头像.test.ts
```

默认行为：

- 自动进入 `react_laiwan_com`
- 默认把截图写到 `visual_regression/test`
- 如果不传参数，默认用例名为 `visual-watch.test.ts`

### 方式 2：直接运行 npm 脚本

在 `react_laiwan_com` 目录下运行：

```sh
VISUAL_CASE_FILE=visual_regression/test/aa/bb/点击用户头像.test.ts npm run test:visual:watch
```

说明：

- `VISUAL_CASE_FILE` 是必填项
- `npm run test:visual:watch` 已默认把 `VISUAL_SCREENSHOT_DIR` 指向 `../visual_regression/test`

### 方式 3：通过 Docker 运行 watcher

在仓库根目录运行：

```sh
npm run test:visual:watch:docker
```

说明：

- Docker 会在容器内启动 webpack dev server 和 watcher
- 默认把截图写到挂载目录 `visual_regression/test`
- 默认用例名为 `docker-watch.spec.js`
- 默认开启单次捕获模式，首次有效变化后自动退出

## 当前系统行为

- 启动后先等待页面稳定，再保存第一张稳定帧
- 后续只在页面进入新的稳定状态后才继续保存下一张图
- Docker watcher 默认在首次有效变化后退出，因此单次验证只保留当前 case 的 3 个核心产物
- Playwright 正式回归会读取 `baseline-*.png`
- watcher 会为显著变化额外生成与稳定帧同尺寸的 `diff-*.png`
- watcher 不再生成 `before_*`、`after_*`、`.json`
- watcher 启动时会自动清理当前 case 的 `.1/.2/.3...` 稳定帧与 `diff-*.png`
- 同一时间只允许一个 watcher 实例运行
- 会忽略动态类 `_1zAX1KISmCqHJI2_KxdiQu`
- 对于低于阈值的微小变化，默认不保存新图

## 常用环境变量

- `VISUAL_CASE_FILE`
  - 必填，决定截图前缀
- `VISUAL_SCREENSHOT_DIR`
  - 可选，覆盖默认输出目录
- `TARGET_URL`
  - 可选，覆盖默认页面地址
- `VIEWPORT_WIDTH` / `VIEWPORT_HEIGHT`
  - 可选，覆盖浏览器视口
- `POLL_INTERVAL` / `WAIT_AFTER_CHANGE`
  - 可选，调整监听轮询与稳定等待时间
- `IGNORED_CLASS_NAMES`
  - 可选，逗号分隔的动态类忽略列表
- `VISUAL_MIN_DIFF_PIXELS`
  - 可选，控制最小差异像素阈值
- `VISUAL_WATCH_EXIT_ON_FIRST_CAPTURE`
  - 可选，控制首次有效变化后是否自动退出；Docker 默认开启，本地连续监听可显式设为 `0`

## 当前实际说明

- 本仓库当前视觉监听主脚本位于 `react_laiwan_com/test/visual/watch.js`
- 当前 shell 启动脚本位于 `start_visual_watch.sh`
- 当前 Docker watcher 启动脚本位于 `start_visual_watch_docker.sh`
- 当前系统默认产物目录不是 `react_laiwan_com/screenshots`，而是 `visual_regression/test`
