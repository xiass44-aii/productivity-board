#!/bin/bash
# 快速推送到 GitHub 脚本
# 使用方法：./push-to-github.sh <你的GitHub用户名> <仓库名>
# 例如：./push-to-github.sh xiass44-aii productivity-board

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "用法: ./push-to-github.sh <GitHub用户名> <仓库名>"
    echo "例如: ./push-to-github.sh xiass44-aii productivity-board"
    exit 1
fi

USERNAME=$1
REPO=$2

echo "🚀 准备推送到 GitHub..."
echo "用户名: $USERNAME"
echo "仓库名: $REPO"
echo ""

# 初始化 git（如果还没有）
if [ ! -d .git ]; then
    git init
    git add .
    git commit -m "初始提交 - 人员产能统计看板"
else
    git add .
    git commit -m "更新代码"
fi

# 添加远程仓库
git remote remove origin 2>/dev/null
git remote add origin https://github.com/$USERNAME/$REPO.git

# 推送到 main 分支
git branch -M main
git push -u origin main

echo ""
echo "✅ 推送完成！"
echo "👉 请访问 https://github.com/$USERNAME/$REPO 确认代码"
echo ""
echo "下一步："
echo "1. 进入仓库 Settings → Pages"
echo "2. Build and deployment 选择 GitHub Actions"
echo "3. 等待 Actions 自动部署完成"
echo "4. 访问地址：https://$USERNAME.github.io/$REPO/"
