# Tongnan Website

冬语（Tongnan）的书写系统展示网站 —— 使用 Tongsquare 字体渲染冬语字符。

纯静态站点（HTML + CSS + 字体），无需构建步骤。

## 目录结构

```
browser demo/
├── index.html          # 首页
├── 404.html            # 未找到页面（Cloudflare Pages 自动使用）
├── style.css           # 样式
├── test.html / test.css  # 测试页
├── fonts/
│   └── TongSquare.woff2  # 冬语字体
├── .gitignore
└── README.md
```

## 本地预览

任选一种方式在本地查看：

```powershell
# 方式 1：Python 内置服务器
python -m http.server 8000

# 方式 2：VS Code "Live Server" 扩展
# 右键 index.html → Open with Live Server
```

然后访问 <http://localhost:8000>。

> 直接双击 `index.html` 也可以，但用本地服务器能更真实地模拟线上下载字体的行为。

## 部署到 Cloudflare Pages

本仓库与 GitHub 个人主页（`<用户名>.github.io`）相互独立，可单独部署到 Cloudflare Pages。

### 步骤

1. **推送到 GitHub**（新仓库，与个人主页仓库分开）：

   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<用户名>/tongnan-website.git
   git push -u origin main
   ```

2. **连接 Cloudflare**：[Cloudflare Dashboard](https://dash.cloudflare.com) → `Workers & Pages` → `Create` → `Pages` → `Connect to Git` → 选择该仓库。

3. **构建设置**（静态站，全部留空）：

   | 项 | 值 |
   | --- | --- |
   | Framework preset | `None` |
   | Build command | *(留空)* |
   | Build output directory | `/` |

   > 注意：本仓库的根目录就是网站根目录，所以输出目录填 `/`。
   > 如果以后把网站放进子文件夹，则填该子文件夹名（如 `public`）。

4. **Deploy**。获得 `https://<项目名>.pages.dev` 域名。

5. **（可选）绑定自定义域名**：Pages 项目 → `Custom domains` → 添加域名，Cloudflare 会自动配置 DNS 与免费 HTTPS。

### 自动部署

连接 GitHub 后，每次 `git push` 到 `main` 分支，Cloudflare Pages 会自动重新部署。其他分支的推送会生成预览（Preview）部署。

## 更新内容

修改 HTML/CSS 后：

```powershell
git add .
git commit -m "Update content"
git push
```

推送后等待约 1 分钟即可在线上看到更新。

## 字体说明

站点使用 `fonts/TongSquare.woff2`，通过 `@font-face` 加载（见 `style.css`）。
页面中的文字是普通拉丁字母，其视觉形式由冬语字体决定 —— 未加载字体时将退化为普通拉丁字母。
