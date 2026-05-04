# visual_regression

PR 视觉回归 CI，基于 Playwright 原生 `toHaveScreenshot()` 截图对比。CI 直接用检查结果反馈差异，不再维护 PR 评论或自研 diff 产物链路。

## CI 工作流

### 没有视觉变化

- `visual-pr / visual` 为 success

### 有视觉变化

- `visual-pr / visual` 为 failure
- GitHub Actions 日志和 Playwright 输出会显示失败用例
- 不再发布 `visual-review/`、`diff-*.png` 或 PR 评论

### 真正失败的情况

以下情况都会让 workflow failure：

- base 分支无法生成视觉 baseline
- PR 新增了 base 分支不存在的视觉用例，导致缺少 baseline
- 视觉测试命令异常退出
- Playwright 截图与 base baseline 存在差异

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
- `visual_regression/specs/tutorial.visual.spec.js`
- `visual_regression/specs/h5-tutorial.visual.spec.js`

## 目录说明

```text
visual_regression/
├── README.md                                   # 本文档：视觉回归 CI 说明、流程约定与本地验证命令
├── playwright.visual.config.js                 # Playwright 视觉回归配置入口
├── jest.visual.config.js                       # Jest 配置，供 CI 辅助脚本单测使用
│
├── helpers/
│   ├── pageStabilize.js                        # 截图前页面稳定化：隐藏动画、字体波动和动态 class
│   ├── specHelpers.js                          # 用例级辅助：expectVisualSnapshot / 语言 cookie / 路由就绪等待
│   └── serverCommand.js                        # 视觉测试 dev server 启动命令
│
├── specs/
│   ├── home.visual.spec.js                     # 首页与导航相关视觉用例
│   ├── glossary.visual.spec.js                 # glossary 列表与定义页视觉用例
│   ├── tutorial.visual.spec.js                 # tutorial 页面视觉用例
│   └── h5-tutorial.visual.spec.js              # H5 tutorial 页面视觉用例
│
├── scripts/
│   └── baselines/
│       └── detect-missing-baselines.js         # 检测 base 分支缺失 baseline 的失败场景
│
└── __tests__/
    └── review-ci-scripts.test.js               # server command 与 baseline 检测单测
```

补充：

- baseline 图片目录在仓库根目录 `test/` 下；PR 运行时会临时写入 base 分支生成的 `baseline-*.png`。
- 新增视觉 case 时，通常只需要调整 `specs/*.visual.spec.js`；对应 baseline 仍由 base 分支生成。

## 关键入口

- workflow：`.github/workflows/visual-pr.yaml`
- Docker Compose：`deploy/docker-compose.visual.yml`
- Docker image：`docker/visual.Dockerfile`
- Playwright 配置：`visual_regression/playwright.visual.config.js`
- Jest 配置：`visual_regression/jest.visual.config.js`

## 本地验证命令

```sh
node --check visual_regression/helpers/serverCommand.js
node --check visual_regression/scripts/baselines/detect-missing-baselines.js
```

```sh
./react_laiwan_com/node_modules/.bin/jest --runTestsByPath visual_regression/__tests__/review-ci-scripts.test.js -c visual_regression/jest.visual.config.js --runInBand
```
