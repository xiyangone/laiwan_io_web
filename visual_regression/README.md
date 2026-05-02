# visual_regression

`visual_regression` 现在只维护 GitHub Actions 视觉回归链路。它的职责是：

- PR 提交后自动跑 Playwright 视觉回归
- 用 base 分支临时生成 baseline，再对比 PR head
- 有视觉变化时，在 PR 评论里展示 `before` / `after` / `diff` 图片和相关代码 diff
- 有 diff 时 workflow 默认保持绿色，把结果作为审阅信息

## CI 工作流

### 没有视觉变化

- `visual-pr / visual` 为 success
- PR 评论会更新为“视觉回归通过，无 diff”

### 有视觉变化

- `visual-pr / visual` 仍然为 success
- workflow 会收集发生变化的用例
- PR 评论会展示：
  - `before`
  - `after`
  - `diff`
  - 对应的代码改动摘要
  - `visual-approved` 审阅状态说明

### 真正失败的情况

只有这些情况才算 workflow failure：

- 视觉测试命令异常退出
- base 分支无法生成视觉 baseline
- PR 新增了 base 分支不存在的视觉用例，导致缺少 baseline
- 检测到视觉变化，但没有成功产出可审阅截图

## baseline 生成方式

PR 视觉 CI 不依赖 PR 分支提交的 baseline。每次运行时，GitHub Actions 会：

- checkout `base.sha` 到临时目录
- 用 base 分支代码运行 `bun run test:visual:update` 生成 `baseline-*.png`
- 把这些 baseline 复制到 PR 工作区
- 再运行 PR head 的视觉对比

CI 不会把 baseline 提交回 PR 分支。这样即使 PR 分支没有 baseline，或者带了过期 baseline，也不会影响本轮判断。

如果 PR 新增了 base 分支不存在的视觉用例，base 无法生成对应 baseline，这类情况会失败，需要先确认是否应该在 base 里补稳定用例。

## 当前覆盖页面

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

## PR 评论

评论会更新同一条 GitHub Actions bot 评论。GitHub 页面可能仍显示这条评论第一次创建的 `commented ... ago`，以评论内容中的截图和代码 diff 为准。

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

确认这次 UI 变化符合预期后，可以给 PR 添加 `visual-approved` label 作为已审阅标记；这个 label 不控制 CI 红绿，只改变评论中的审阅状态说明。

## 目录说明

- `helpers/`
  视觉截图、diff 计算、服务启动等辅助逻辑。
- `specs/`
  Playwright 视觉回归用例。
- `scripts/`
  PR 评论、截图整理、artifact 分支发布、代码上下文收集等 CI 脚本。
- `test/`
  CI baseline 图片目录。PR 运行时会临时写入 base 分支生成的 `baseline-*.png`。

## 关键入口

- workflow：`.github/workflows/visual-pr.yaml`
- Docker Compose：`deploy/docker-compose.visual.yml`
- Docker image：`docker/visual.Dockerfile`
- Playwright 配置：`visual_regression/playwright.visual.config.js`
- Jest 配置：`visual_regression/jest.visual.config.js`

## 本地验证命令

```sh
node --check visual_regression/scripts/collect-review-artifacts.js
node --check visual_regression/scripts/collect-pr-code-context.js
node --check visual_regression/scripts/detect-missing-baselines.js
node --check visual_regression/scripts/publish-review-artifacts.js
node --check visual_regression/scripts/upsert-review-comment.js
```

```sh
./react_laiwan_com/node_modules/.bin/jest --runTestsByPath visual_regression/review-ci-scripts.test.js visual_regression/collect-review-artifacts.test.js -c visual_regression/jest.visual.config.js --runInBand
```
