# visual_regression

这里是项目当前的视觉回归目录。现在的主流程已经切到 GitHub Actions，目标是：

- PR 提交后自动跑 Playwright 视觉回归
- 有视觉变化时，在 PR 评论里直接展示图片和相关代码 diff
- workflow 默认保持成功，方便把视觉结果当作审阅信息来使用

本地 Docker watcher 仍然保留，但现在属于辅助手段，不再是主入口。

## 当前工作流

### 1. 日常开发

开发时直接改页面、样式或文案，然后提交 PR。

GitHub Actions 会自动运行：

```sh
docker compose -f deploy/docker-compose.visual.yml build visual
docker compose -f deploy/docker-compose.visual.yml run --rm -e CI=1 visual bun run test:visual
```

### 2. 没有视觉变化

- `visual-pr / visual` 为 success
- PR 评论会更新为“视觉回归通过，无 diff”

### 3. 有视觉变化

- `visual-pr / visual` 仍然为 success
- workflow 会收集发生变化的用例
- PR 评论会直接展示：
  - `before`
  - `after`
  - `diff`
  - 对应的代码改动摘要

### 4. 真正失败的情况

现在只有这类情况才算 workflow 失败：

- 视觉测试命令异常退出
- 或者理论上检测到失败，但没有成功产出可审阅的截图结果

也就是说：

- 无 diff：success
- 有 diff 且成功生成 PR 评论：success
- 跑坏了且没有可审阅结果：failure

### 5. 没有 baseline 的首次运行

如果 PR 分支里没有 `visual_regression/test/baseline-*.png`，CI 会自动初始化 baseline：

- 先识别 Playwright 的 `A snapshot doesn't exist...` 错误
- 再运行 `bun run test:visual:update` 生成 baseline
- 然后把 `visual_regression/test/baseline-*.png` 提交回当前 PR 分支
- 最后在 PR 评论里提示 baseline 已初始化

这一步只是建立视觉基准，不会生成 `before / after / diff`。从下一次提交开始，CI 才会基于这些 baseline 做真正的视觉对比。

## 当前覆盖页面

现在视觉回归覆盖这些主要页面：

- 首页英文：`home-nav-en`
- 首页中文：`home-nav-zh`
- 首页 iOS 下载弹窗：`home-ios-modal-zh`
- Glossary 中文列表：`glossary-page-zh`
- Glossary 英文列表：`glossary-list-en`
- Glossary 中文定义页：`glossary-definition-zh`
- Glossary 英文定义页：`glossary-definition-en`
- 教程页：`tutorial-page`
- H5 教程页：`h5-tutorial-laiwan-life`
- H5 教程页：`h5-tutorial-laiwanpai-com`

对应测试文件：

- `visual_regression/specs/home.visual.spec.js`
- `visual_regression/specs/glossary.visual.spec.js`
- `visual_regression/specs/routes.visual.spec.js`

## PR 评论里会看到什么

当 PR 里有视觉变化时，评论会显示“视觉变更用例”，不是“失败用例”。

每个变更用例下会包含：

- 修改前截图
- 修改后截图
- diff 截图
- 相关代码改动

代码改动不是像素级定位，而是按页面维度做实用映射：

- `home-*` 关联首页、导航、语言包
- `glossary-*` 关联 glossary 页面和语言包
- `tutorial-*` 关联教程页和语言包
- `h5-tutorial-*` 关联 h5 tutorial 页面和语言包

## 目录说明

### 核心目录

- `helpers/`
  视觉截图、diff 计算、服务启动等辅助逻辑。
- `specs/`
  Playwright 视觉回归用例。
- `scripts/`
  PR 评论、截图整理、发布 artifact 分支、代码上下文收集等 CI 脚本。
- `test/`
  baseline 图片、本地 watcher 产物和临时截图目录。

### 关键文件

- `playwright.visual.config.js`
  Playwright 视觉回归配置。
- `jest.visual.config.js`
  视觉相关 Node 脚本测试配置。
- `scripts/collect-review-artifacts.js`
  从 `test-results/` 收集发生视觉变化的截图，生成 `visual-review/summary.md`。
- `scripts/collect-pr-code-context.js`
  给每个视觉变更用例补充相关代码 diff。
- `scripts/publish-review-artifacts.js`
  把 `visual-review/` 发布到 `visual-review-artifacts` 分支。
- `scripts/upsert-review-comment.js`
  在 PR 中创建或更新同一条视觉评论。
- `watch.js`
  本地 Docker watcher 主逻辑。
- `run-visual-watch.sh`
  watcher 启动脚本。

## 本地常用命令

### 构建视觉测试镜像

```sh
bun run visual:docker:build
```

### 跑完整视觉回归

```sh
bun run test:visual:docker
```

### 更新 baseline

```sh
bun run test:visual:update:docker
```

### 跑视觉脚本测试

```sh
./react_laiwan_com/node_modules/.bin/jest --runTestsByPath visual_regression/review-ci-scripts.test.js visual_regression/collect-review-artifacts.test.js -c visual_regression/jest.visual.config.js --runInBand
```

## 什么时候更新 baseline

只有在你确认“这次 UI 变化就是新的预期”时，才更新 baseline。

常见场景：

- 文案正式修改
- 页面结构调整
- 样式改版
- 新增稳定的视觉用例

更新后要重新提交 baseline 图片，否则 CI 会持续把它识别为视觉变化。

PR 视觉 CI 不再依赖 PR 分支提交的 baseline。每次 PR 运行时，GitHub Actions 会先 checkout `base.sha`，用 base 分支代码临时生成 `baseline-*.png`，再复制到 PR 工作区运行视觉对比。这样即使 PR 里没有更新 baseline，或带了过期 baseline，也不会影响判断。

如果产生视觉 diff，CI 默认阻止合并并在 PR 评论中发布对比图。确认这次 UI 变化符合预期后，给 PR 添加 `visual-approved` label；带 label 的重新运行会放行这次视觉 diff。

## watcher 现在怎么用

watcher 主要用于你本地快速盯某个页面，不用于替代 CI。

最常用命令：

```sh
sh visual_regression/run-visual-watch.sh 修改内容
```

如果要指定页面：

```sh
sh visual_regression/run-visual-watch.sh 文案-术语页 http://127.0.0.1:8080/#/glossary
```

watcher 仍然会在 `visual_regression/test/` 里生成：

- `修改内容-修改前.png`
- `修改内容-修改后.png`
- `diff-修改内容.png`

它更适合本地快速观察，不负责 PR 评论和 CI 审阅链路。

## 相关入口

- workflow：[`.github/workflows/visual-pr.yaml`](/Z:/laiwan_io_web/.github/workflows/visual-pr.yaml)
- Docker Compose：[deploy/docker-compose.visual.yml](/Z:/laiwan_io_web/deploy/docker-compose.visual.yml)
- 根命令入口：[package.json](/Z:/laiwan_io_web/package.json)
