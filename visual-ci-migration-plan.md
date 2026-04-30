# 视觉回归测试迁移计划：从 Drone/本地迁到 GitHub Actions PR 门禁

## 目标
将视觉回归测试从“本地 / Drone 侧辅助验证”迁移到“GitHub Actions PR 门禁”，实现以下目标：
- PR 合并前拦截关键 UI 回归
- 失败时在 PR 侧留痕（artifact）
- Drone 只保留 build / deploy / 通知，不再承担主质量门禁

## 迁移范围（当前仓库结构）
- 保留现有视觉测试框架：`visual_regression/`
- 保留现有 runner 构建：`deploy/docker-compose.visual.yml`、`docker/visual.Dockerfile`
- 保留现有关键测试用例：
  - `visual_regression/specs/home.visual.spec.js`
  - `visual_regression/specs/glossary.visual.spec.js`
- PR CI 复用现有根命令：
  - `bun run visual:docker:build`
  - `bun run test:visual:docker`

## 不做什么
- 不重写视觉测试框架
- 不废弃本地 watch 模式（`visual_regression/watch.js`）
- 不在 PR CI 开启“自动更新 baseline”

## 文件改动计划
### 1) 新建 `Z:\laiwan_io_web\.github\workflows\visual-pr.yaml`
作用：在 PR 到 `master` 时执行视觉回归，并在失败时上传 `playwright-report/`、`test-results/`。

建议内容：
```yaml
name: visual-pr
on:
  pull_request:
    branches:
      - master
concurrency:
  group: visual-${{ github.event.pull_request.number }}
  cancel-in-progress: true
jobs:
  visual:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build visual runner
        run: bun run visual:docker:build

      - name: Run visual regression
        run: bun run test:visual:docker

      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          if-no-files-found: ignore

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
          if-no-files-found: ignore
```

### 2) 更新 `Z:\laiwan_io_web\.gitignore`
追加以下条目，避免误提交本地产物：
```ignore
playwright-report/
test-results/
visual_regression/test/
```

### 3) 保留现有 PR 测试 workflow
保留：`Z:\laiwan_io_web\.github\workflows\test-before-merge-pr.yaml`
职责继续是功能测试主门禁之一，不做视觉测试承担。

## 验证计划
- PR 阶段：故意修改首页/术语页样式后提交 PR，确认 `visual-pr` 会失败并产出 artifact
- 稳定阶段：未改动 UI 时提交 PR，确认该 workflow 通过
- 回滚策略：若 CI 误报过高，降级为“仅 manual 触发视觉 workflow”，但不删除门禁结构

## 风险
- GitHub runner 与本地渲染环境差异可能导致误报
  - 缓解：继续走自定义 `visual.Dockerfile`
- baseline 管理不规范会导致噪声
  - 缓解：baseline 更新只走本地命令，不自动覆写

## 执行顺序
1. 新建 `visual-pr.yaml`
2. 更新 `.gitignore`
3. 同步仓库 README/视觉说明（可选）
4. 提交 PR 并做一次真实验证