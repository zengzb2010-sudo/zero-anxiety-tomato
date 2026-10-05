# 零焦虑番茄专注钟 · 打包与上架指南

纯前端 Vue3 + TailwindCSS 应用，无后端。数据全部在浏览器 LocalStorage，
打包到任意形态（PWA / 安卓 / 鸿蒙 / iOS）后数据同样保存在设备本地。

---

## 0. 构建生产版本

```bash
npm install
npm run build        # 产物在 dist/ 目录
```

项目已配置相对路径（`base: './'`），`dist` 可直接部署到任意静态托管 / 打包进壳。

---

## 1. PWA（网页直接安装到主屏）

项目已内置：`public/manifest.webmanifest`、`public/sw.js`、生产环境自动注册 SW，
以及 `public/icons/` 三张图标（192 / 512 / maskable，由 `scripts/gen-icons.mjs` 程序化生成，
想换配色可改脚本里的 `BG`/`FG` 色值后 `node scripts/gen-icons.mjs` 重新生成）。

1. 把 `dist/` 部署到任意 HTTPS 静态托管（GitHub Pages / Vercel / 自建 Nginx 等）；
2. 手机浏览器打开 → 菜单 → 「添加到主屏幕 / 安装应用」；
3. 之后以全屏 App 形态启动，支持离线打开（SW 缓存）。

验证：Chrome DevTools → Application → Manifest / Service Workers，或 Lighthouse PWA 审计。

---

## 2. 安卓 APK / AAB（上架国内应用商店）

推荐 Capacitor（官方主流方案，WebView 壳，无需重写任何代码）：

```bash
# 1) 安装 Capacitor
npm i -D @capacitor/cli
npm i @capacitor/core @capacitor/android

# 2) 初始化（appId 用你的包名，如 com.example.tomato）
npx cap init "零焦虑番茄" com.example.tomato --web-dir=dist

# 3) 添加安卓平台
npx cap add android

# 4) 构建前端并同步（每次改完代码都跑这两步）
npm run build
npx cap sync android

# 5) 用 Android Studio 打开 android/ 目录
#    Build → Generate Signed Bundle / APK（需先创建签名密钥）
#    产出 app-release.aab（上架用）/ app-release.apk（直接安装用）
```

上架要点（以华为 / 小米 / OPPO / vivo / 应用宝为例，逻辑相同）：
- 提前准备：软件著作权证书（个人开发者可用《计算机软件著作权登记》或承诺书）、
  隐私政策链接（本应用可声明「数据仅存于本机，不收集任何个人信息」）、应用截图。
- 各商店后台创建应用 → 上传 AAB → 填资料 → 提交审核（教育/效率类目）。
- 后续更新：`npm run build && npx cap sync android` 后重新打包上传即可。

---

## 3. 鸿蒙 HarmonyOS（HarmonyOS NEXT 及以下版本通用）

纯 Web 应用走 **Web 组件套壳** 路线（无需重写 ArkTS 业务逻辑）：

1. 安装 DevEco Studio，新建工程（Empty Ability，选 API 版本按真机定）；
2. 把 `dist/` 整个目录复制到工程 `entry/src/main/resources/rawfile/` 下；
3. 在页面（EntryAbility 默认 Index.ets）中改用 Web 组件加载本地资源：

```ets
import { webview } from '@kit.ArkWeb'

@Entry
@Component
struct Index {
  controller: webview.WebviewController = new webview.WebviewController()
  build() {
    Column() {
      Web({ src: $rawfile('index.html'), controller: this.controller })
        .width('100%').height('100%')
    }
  }
}
```

> 注意：`dist` 内资源为相对路径引用，直接用 `$rawfile` 加载整目录即可正常工作。
> 若 Web 组件加载报错，检查 `module.json5` 是否具备 `ohos.permission.INTERNET`（加载在线资源时才需要；纯本地 rawfile 不需要）。

4. 真机调试：File → Project Structure → Signing Configs 勾选自动签名；
5. 打包：Build → Build Hap(s)/App(s) → 产出 `.hap`；
6. 上架：注册 [华为开发者联盟](https://developer.huawei.com) 企业/个人开发者，
   AppGallery Connect 创建应用 → 上传 AGC 签名的 HAP → 提审（与应用商店要求类同，
   需隐私政策与著作权材料）。

---

## 4. iOS（需要 macOS + Xcode + Apple 开发者账号 ¥688/年，个人账号）

同样用 Capacitor：

```bash
# 1) 已安装 @capacitor/cli 的情况下
npm i @capacitor/ios

# 2) 添加 iOS 平台（必须在 macOS 上执行）
npx cap add ios

# 3) 同步前端产物
npm run build
npx cap sync ios

# 4) 打开 ios/App/App.xcworkspace（Xcode）
#    Signing & Capabilities 选你的开发者账号和 Bundle ID
#    Product → Archive → Distribute App → App Store Connect
```

- 首次发布：Xcode Archive 上传后在 [App Store Connect](https://appstoreconnect.apple.com)
  补图标、截图、隐私标签（本应用建议勾选「不收集数据」）后提交审核；
- 内测：App Store Connect → TestFlight，邀请测试员无需审核即可分发内测。

---

## 5. 通用注意事项

- **数据**：LocalStorage 在各形态（浏览器 / WebView）中独立存在，换设备不迁移；
  如需跨设备同步，属于后续改造（需要后端 + 账号体系，本 MVP 不含）。
- **图标**：所有平台都需要应用图标，建议先出一套 1024×1024 主图标，
  再用在线工具（如 appicon.co / icon.wuruihong.com）生成各平台所需尺寸。
- **隐私合规**：应用无任何网络上报（除用户自行配置的 AI 复盘接口），
  隐私政策可直白声明这一点，审核通过率更高。
- **更新策略**：`sw.js` 内 `CACHE` 版本号 `zt-v1`，发版时改为 `zt-v2` 可强制客户端刷新缓存。