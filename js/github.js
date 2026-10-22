/**
 * GitHub 仓库数据适配器
 * 使用 GitHub 仓库中的 JSON 文件作为云端数据库
 * 
 * 只需要：
 * 1. 一个 GitHub 仓库
 * 2. 一个 Personal Access Token
 * 数据存在仓库的 data/data.json 文件中
 */

const GitHubData = {
    // 检查是否启用 GitHub 模式
    isEnabled() {
        const cfg = window.GITHUB_CONFIG;
        return cfg && cfg.ENABLE_GITHUB === true &&
               cfg.OWNER && cfg.REPO && cfg.TOKEN;
    },

    // 获取 API 基础地址
    _getApiBase() {
        const cfg = window.GITHUB_CONFIG;
        return `https://api.github.com/repos/${cfg.OWNER}/${cfg.REPO}/contents`;
    },

    // 获取请求头
    _getHeaders() {
        return {
            'Authorization': `token ${window.GITHUB_CONFIG.TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    },

    // 读取数据文件
    async readData() {
        const path = `${this._getApiBase()}/${window.GITHUB_CONFIG.DATA_PATH}`;
        const branch = window.GITHUB_CONFIG.BRANCH || 'main';

        try {
            const res = await fetch(`${path}?ref=${branch}`, {
                headers: this._getHeaders()
            });

            if (res.status === 404) {
                // 文件不存在，返回空数据
                return { data: null, sha: null };
            }

            if (!res.ok) {
                throw new Error(`GitHub API 错误: ${res.status}`);
            }

            const file = await res.json();
            // GitHub 返回的内容是 base64 编码的
            const content = decodeURIComponent(escape(atob(file.content)));
            const data = JSON.parse(content);

            return { data, sha: file.sha };
        } catch (e) {
            console.error('读取 GitHub 数据失败:', e);
            throw e;
        }
    },

    // 写入数据文件
    async writeData(data) {
        const path = `${this._getApiBase()}/${window.GITHUB_CONFIG.DATA_PATH}`;
        const branch = window.GITHUB_CONFIG.BRANCH || 'main';

        try {
            // 先获取当前 sha（如果文件存在）
            let sha = null;
            try {
                const res = await fetch(`${path}?ref=${branch}`, {
                    headers: this._getHeaders()
                });
                if (res.ok) {
                    const file = await res.json();
                    sha = file.sha;
                }
            } catch (e) {
                // 文件不存在，忽略
            }

            const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

            const body = {
                message: `update data - ${new Date().toISOString()}`,
                content: content,
                branch: branch
            };

            if (sha) {
                body.sha = sha;
            }

            const res = await fetch(path, {
                method: 'PUT',
                headers: this._getHeaders(),
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(`写入失败: ${res.status} - ${err.message || ''}`);
            }

            return true;
        } catch (e) {
            console.error('写入 GitHub 数据失败:', e);
            throw e;
        }
    }
};
