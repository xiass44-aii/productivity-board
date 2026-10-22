#!/bin/bash
# 用 GitHub API 上传文件到仓库

TOKEN="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"
OWNER="xiass44-aii"
REPO="productivity-board"
BRANCH="main"
API="https://api.github.com/repos/$OWNER/$REPO/contents"

upload_file() {
    local local_path="$1"
    local remote_path="$2"
    
    echo "上传: $remote_path"
    
    local content=$(base64 -i "$local_path")
    local message="upload $remote_path"
    
    # 先检查文件是否存在（获取 sha）
    local sha=$(curl -s -H "Authorization: token $TOKEN" "$API/$remote_path?ref=$BRANCH" | grep -o '"sha":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    local body="{\"message\":\"$message\",\"content\":\"$content\",\"branch\":\"$BRANCH\""
    if [ -n "$sha" ]; then
        body="$body,\"sha\":\"$sha\""
    fi
    body="$body}"
    
    local result=$(curl -s -X PUT -H "Authorization: token $TOKEN" -H "Content-Type: application/json" "$API/$remote_path" -d "$body")
    
    if echo "$result" | grep -q '"commit"'; then
        echo "  ✅ 成功"
    else
        echo "  ❌ 失败: $(echo "$result" | grep -o '"message":"[^"]*"' | head -1)"
    fi
}

# 上传所有文件
upload_file "index.html" "index.html"
upload_file "css/style.css" "css/style.css"
upload_file "js/config.js" "js/config.js"
upload_file "js/app.js" "js/app.js"
upload_file "js/data.js" "js/data.js"
upload_file "js/cloud.js" "js/cloud.js"
upload_file "js/github.js" "js/github.js"
upload_file "data/data.json" "data/data.json"
upload_file "DEPLOY.md" "DEPLOY.md"
upload_file "push-to-github.sh" "push-to-github.sh"

echo ""
echo "🎉 上传完成！"
echo "访问地址: https://$OWNER.github.io/$REPO/"
echo "（记得在仓库 Settings → Pages 里开启 Pages）"
