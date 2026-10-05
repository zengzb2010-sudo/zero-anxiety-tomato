# 零焦虑番茄专注钟

无广告、无惩罚、极简学生友好的番茄专注计时 Web 应用，面向国内初高中学生。

在线使用：https://zengzb2010-sudo.github.io/zero-anxiety-tomato/

## 特性

- **专注计时**：自定义任意时长、开始/暂停/放弃（放弃绝不扣分，可选保存半专注记录）、连续专注模式、轻柔提示音、白噪音（4 种环境音，Web Audio 合成）
- **任务 & 科目**：10 个科目绑定，任务增删/勾选完成/累计专注时长
- **正向统计**：今日/本周总时长、科目环形图、日历热力图、时段分布、连续专注天数、CSV 导出（无任何负面统计）
- **趣味收集**：20 张学生梗卡牌随机掉落 + 零焦虑小花园（按科目联动，永不枯萎）
- **AI 每日复盘**：接入任意 OpenAI 格式接口，鼓励式复盘（配置留空，密钥只存本机）
- **纯本地**：所有数据存本地 LocalStorage，无后端、无账号、无广告
- **PWA**：可安装到主屏，离线可用；深色护眼模式

## 技术栈

Vue3 + Vite + TailwindCSS v4，零第三方运行时依赖（图表/音效/图标全部手写实现）。

## 本地开发

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # 产出 dist（自动生成 PWA 图标）
```

## 发布

推送到 `main` 分支即自动构建部署到 GitHub Pages（见 `.github/workflows/pages.yml`）。
多端打包（安卓/鸿蒙/iOS）步骤见 [PACKAGING.md](PACKAGING.md)。
