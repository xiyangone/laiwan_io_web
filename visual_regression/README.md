# visual_regression

PR 视觉回归 CI，基于 Playwright 原生 `toHaveScreenshot()` 截图对比。CI 直接用检查结果反馈差异，不再维护 PR 评论或自研 diff 产物链路。

## CI 工作流

### 没有视觉变化

- `visual-pr / visual` 为 success

### 有视觉变化

- `visual-pr / visual` 为 failure
- GitHub Actions 日志和 Playwright 输出会显示失败用例
- CI 会上传 Playwright 原生 `playwright-report/` 和 `test-results/` artifact，artifact 名称为 `visual-playwright-report`，里面包含 actual / expected / diff 图片
- 安装 artifact.ci GitHub App 后，可以在失败的 `visual-pr / visual` check 中，通过 artifact.ci 的 artifact 浏览入口打开 `visual-playwright-report/playwright-report/index.html`
- 不再发布 `visual-review/`、自研 `diff-*.png` 或 PR 评论

### 查看视觉差异

优先在 `visual-playwright-report/playwright-report/index.html` 中查看 Playwright HTML report，使用报告里的 Diff / Actual / Expected / Slider 对比。

也可以直接查看 `test-results/` 中的截图文件：

- `*-actual.png`
- `*-expected.png`
- `*-diff.png`

`error-context.md` 是 Playwright 失败上下文，通常包含失败用例、错误信息、页面 snapshot 和源码片段；它不是视觉 diff 本体。视觉差异仍以 `*-actual.png`、`*-expected.png`、`*-diff.png` 或 HTML report 的 Diff / Actual / Expected / Slider 为准。

artifact.ci 不可用，或下载报告后需要本地打开时，可以使用：

```sh
cd react_laiwan_com
bun run test:visual:report
```

### 真正失败的情况

以下情况都会让 workflow failure：

- base 分支无法生成视觉 baseline
- 视觉测试命令异常退出
- Playwright 截图与 base baseline 存在差异

## baseline 生成方式

PR 视觉 CI 不依赖 PR 分支提交的 baseline。每次运行时，GitHub Actions 会：

- checkout `base.sha` 到临时目录
- 用 base 分支代码在 Ubuntu runner 上运行 `bun run test:visual:update` 生成 `baseline-*.png`
- 把这些 baseline 复制到 PR 工作区
- 再运行 PR head 的视觉对比

CI 不会把 baseline 提交回 PR 分支。这样即使 PR 分支没有 baseline，或者带了过期 baseline，也不会影响本轮判断。

如果 PR 新增了 base 分支不存在的视觉用例，Playwright 会按原生截图对比失败流处理；主要根据 HTML report 和 `test-results/` 中的截图判断是否需要补充或更新稳定用例。

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

- `visual_regression/specs/home.visual.spec.ts`
- `visual_regression/specs/glossary.visual.spec.ts`
- `visual_regression/specs/tutorial.visual.spec.ts`
- `visual_regression/specs/h5-tutorial.visual.spec.ts`

## 目录说明

```text
visual_regression/
├── README.md                                   # 本文档：视觉回归 CI 说明、流程约定与本地验证命令
├── playwright.visual.config.ts                 # Playwright 视觉回归配置入口
│
├── helpers/
│   └── visualHelpers.ts                        # 截图稳定化、语言 cookie、视觉断言辅助
│
├── specs/
│   ├── home.visual.spec.ts                     # 首页与导航相关视觉用例
│   ├── glossary.visual.spec.ts                 # glossary 列表与定义页视觉用例
│   ├── tutorial.visual.spec.ts                 # tutorial 页面视觉用例
│   └── h5-tutorial.visual.spec.ts              # H5 tutorial 页面视觉用例
```

补充：

- baseline 图片目录在 `visual_regression/test/` 下；PR 运行时会临时写入 base 分支生成的 `baseline-*.png`。
- 新增视觉 case 时，通常只需要调整 `specs/*.visual.spec.ts`；对应 baseline 仍由 base 分支生成。

## 关键入口

- workflow：`.github/workflows/visual-pr.yaml`
- Playwright 配置：`visual_regression/playwright.visual.config.ts`
- helper 公共 API：`匹配视觉截图`、`设置页面语言`、`等待页面路由稳定`、`稳定视觉页面`

## 验证命令

```sh
cd react_laiwan_com
bun run test:visual -- --list
bun run test:visual:report
```
