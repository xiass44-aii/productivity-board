# 人员产能统计看板 - 部署指南

## 🎯 最简方案：GitHub Pages + GitHub 数据存储

**只用 GitHub 一个账号，全程免费，5 分钟搞定。**

---

## 第一步：建仓库（1 分钟）

1. 打开 👉 [github.com/new](https://github.com/new)
2. **Repository name** 填：`productivity-board`
3. 选 **Public**
4. 勾选 **Add a README file**
5. 点 **Create repository**

---

## 第二步：生成 Token（1 分钟）

1. 打开 👉 [github.com/settings/tokens](https://github.com/settings/tokens)
2. 点 **Generate new token** → 选 **Generate new token (classic)**
3. 可能要你输入密码确认
4. 填写：
   - **Note**：随便写，比如 `board`
   - **Expiration**：选 **No expiration**（永不过期）
   - **Select scopes**：勾选 **repo**（最上面那个大项，把它下面的都勾上）
5. 拉到最底下点 **Generate token**
6. **把生成的那一长串复制下来，存好**（只显示这一次！）

---

## 第三步：配置代码（1 分钟）

打开项目文件夹里的 `js/config.js`，找到这一段：

```javascript
window.GITHUB_CONFIG = {
    // 把这个改成 true
    ENABLE_GITHUB: true,

    // 你的 GitHub 用户名（已经填好了 xiass44-aii）
    OWNER: 'xiass44-aii',

    // 仓库名（和你建的一致）
    REPO: 'productivity-board',

    // 分支名
    BRANCH: 'main',

    // 数据文件路径（不用改）
    DATA_PATH: 'data/data.json',

    // 把你刚才复制的 token 粘贴到这里
    TOKEN: '你刚才复制的那一长串token'
};
```

改完保存。

---

## 第四步：上传代码到 GitHub（2 分钟）

### 方法 A：网页上传（最简单）

1. 打开你刚建的仓库：`https://github.com/xiass44-aii/productivity-board`
2. 点 **Add file** → **Upload files**
3. 把项目文件夹里的**所有文件和文件夹**都拖进去：
   - `index.html`
   - `css/` 文件夹
   - `js/` 文件夹
   - `.github/` 文件夹
   - `DEPLOY.md`
   - `push-to-github.sh`
4. 拉到底下点 **Commit changes**

### 方法 B：命令行上传（如果你会用 git）

```bash
cd /你的项目路径
git init
git add .
git commit -m "初始提交"
git branch -M main
git remote add origin https://github.com/xiass44-aii/productivity-board.git
git push -u origin main
```

---

## 第五步：开启 GitHub Pages（30 秒）

1. 仓库页面顶部点 **Settings**
2. 左边菜单找到 **Pages**
3. **Build and deployment** → **Source** 选 **Deploy from a branch**
4. **Branch** 选 **main** 和 **/ (root)**
5. 点 **Save**
6. 等 1 分钟，刷新页面，顶部会出现你的访问链接：
   `https://xiass44-aii.github.io/productivity-board/`

---

## 第六步：初始化数据

1. 打开你的访问链接
2. 点底部「后台管理入口」，密码 `admin123`
3. 确认人员列表正确
4. 添加好你们的项目
5. 提交第一条数据后，数据会自动同步到 GitHub 仓库

完成！🎉 所有人都可以通过这个链接访问并提交数据。

---

## 🔧 工作原理

- 所有人的数据存在 GitHub 仓库的 `data/data.json` 文件里
- 提交任务后 2 秒自动上传到 GitHub
- 每 30 秒自动从 GitHub 拉取最新数据
- 所以 A 提交了任务，B 刷新页面或等 30 秒就能看到

---

## ⚠️ 注意事项

1. **Token 不要泄露给别人**，有了 token 就能操作你的仓库
2. 如果仓库是公开的，别人能看到数据文件，但不能修改（因为没有 token）
3. 如果想要更安全，可以把仓库设为 Private，但 GitHub Pages 私有仓库需要付费
4. 管理员默认密码是 `admin123`，建议修改（在 `js/app.js` 里搜 `ADMIN_PASSWORD`）

---

## 常见问题

**Q: 提交的数据别人看不到？**
A: 等 30 秒自动同步，或者刷新页面。

**Q: 提示同步失败？**
A: 检查 token 是否正确、是否过期、是否勾选了 repo 权限。

**Q: 想换个仓库名？**
A: 修改 `js/config.js` 里的 REPO，然后重新上传。
