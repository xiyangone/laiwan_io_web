# visual_regression

> 目的：给 `.github/workflows/visual-pr.yaml` 和 `visual_regression/specs/*.visual.spec.ts` 提供可执行的视觉回归维护说明，而不是只记录命令入口。

当前视觉套件基于 Playwright 原生 `toHaveScreenshot()` 截图对比，共覆盖 10 个页面级截图点。CI 直接用 GitHub check 反馈结果，并通过 Playwright report / artifact.ci 查看差异；不再维护 PR 评论或自研 diff 产物链路。

## 覆盖口径

- 已覆盖：已经进入 `specs/*.visual.spec.ts`，并能在 PR CI 中生成稳定截图的页面态
- 部分覆盖：有页面入口截图，但还缺弹层、语言态、深层详情或异常态
- 未覆盖：当前视觉套件还没有独立截图点

## CI 工作流

| 场景 | GitHub check | 查看方式 |
|---|---|---|
| 没有视觉变化 | `visual-pr / visual` 为 success | 不需要查看 artifact |
| 有视觉变化 | `visual-pr / visual` 为 failure | 在 `visual-playwright-report/playwright-report/index.html` 查看 Playwright report |
| CI 命令异常 | `visual-pr / visual` 为 failure | 先看 GitHub Actions 日志，再看 `error-context.md` |

CI 会上传 Playwright 原生 `playwright-report/` 和 `test-results/` artifact，artifact 名称为 `visual-playwright-report`。安装 artifact.ci GitHub App 后，可以在失败的 `visual-pr / visual` check 中，通过 artifact.ci 的 artifact 浏览入口打开报告。

## 查看视觉差异

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

## baseline 生成方式

PR 视觉 CI 不依赖 PR 分支提交的 baseline。每次运行时，GitHub Actions 会：

- checkout `base.sha` 到临时目录
- 用 base 分支代码在 Ubuntu runner 上运行 `bun run test:visual:update` 生成 `baseline-*.png`
- 把这些 baseline 复制到 PR 工作区
- 再运行 PR head 的视觉对比

CI 不会把 baseline 提交回 PR 分支。这样即使 PR 分支没有 baseline，或者带了过期 baseline，也不会影响本轮判断。

如果 PR 新增了 base 分支不存在的视觉用例，Playwright 会按原生截图对比失败流处理；主要根据 HTML report 和 `test-results/` 中的截图判断是否需要补充或更新稳定用例。

## 当前覆盖表

| 领域 | 当前截图点 | 覆盖状态 | 备注 |
|---|---:|---|---|
| 首页导航与语言态 | 2 | 已覆盖 | `home-nav-en`、`home-nav-zh` |
| 首页 iOS 下载弹窗 | 1 | 已覆盖 | `home-ios-modal-zh` |
| Glossary 列表页 | 2 | 已覆盖 | `glossary-page-zh`、`glossary-list-en` |
| Glossary 定义页 | 2 | 已覆盖 | `glossary-definition-zh`、`glossary-definition-en` |
| 教程页 | 1 | 已覆盖 | `tutorial-page` |
| H5 教程页 | 2 | 已覆盖 | `h5-tutorial-laiwan-life`、`h5-tutorial-laiwanpai-com` |

## 当前结论

### 1. 主要入口覆盖率

如果只看官网当前主要入口页、语言切换、教程页和 glossary 页面态，当前覆盖较完整。

### 2. 深层状态覆盖率

当前视觉套件还偏页面级截图。更深层的弹层、异常态、加载态和跨设备 viewport 还没有系统覆盖。

原因：

- 首页、glossary、tutorial 这些高频页面已经进入稳定截图
- 当前只跑桌面 viewport：`1440 x 900`
- 还没有移动端 viewport、失败态、空状态或下载链路异常态截图

## 下一批优先补的截图

| 优先级 | 建议截图点 | 为什么值得补 | 适合的时机策略 |
|---|---|---|---|
| 1 | 首页移动端布局 | 当前只有桌面 viewport，移动端更容易受样式影响 | 等主视觉和下载按钮渲染稳定 |
| 2 | Glossary 搜索结果态 | 搜索输入和列表过滤容易发生视觉漂移 | 输入稳定关键字后截图 |
| 3 | 下载弹窗更多语言态 | 弹层是高风险视觉区域，目前只覆盖中文 iOS 弹窗 | 切换语言后打开弹层 |
| 4 | H5 教程页移动端布局 | 教程图文长页面更容易出现响应式问题 | 等关键标题和首张教程图出现 |

## 增加新截图时的判断规则

1. 先问这个页面是“入口态”还是“内容态”。
2. 入口态优先截图稳定锚点，不堆固定等待。
3. 内容态优先等真实文本、按钮或图片，不依赖纯时间等待。
4. 如果同一页面已经有壳层截图，新增截图要补更深层状态，而不是只换一个截图名。
5. 同一流程里只保留能区分视觉信息的截图，避免近似图。

## 测试文件

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
