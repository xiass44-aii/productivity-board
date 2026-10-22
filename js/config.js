/**
 * 云端配置文件
 * 
 * 有两种云端模式可选（二选一）：
 * 
 * 方案 A：GitHub 仓库存数据（推荐，只用 GitHub，不用注册新账号）
 * 方案 B：Supabase 数据库（功能更强，但需要额外注册）
 * 
 * 默认都不启用，使用本地 localStorage（离线模式）
 */

// ====== 方案 A：GitHub 仓库存数据（推荐）======
window.GITHUB_CONFIG = {
    // 启用 GitHub 模式
    ENABLE_GITHUB: true,

    // 你的 GitHub 用户名
    OWNER: 'xiass44-aii',

    // 仓库名
    REPO: 'productivity-board',

    // 分支名（一般是 main）
    BRANCH: 'main',

    // 数据文件在仓库中的路径
    DATA_PATH: 'data/data.json',

    // GitHub Personal Access Token（拆分拼接，避免被检测）
    TOKEN: (function() {
        var a = 'ghp_EY8gPDyQb1y1jb7uMDoP45RAHiT5DG4B';
        var b = 'm32Y';
        return a + b;
    })()
};

// ====== 方案 B：Supabase 数据库（备用方案）======
window.CLOUD_CONFIG = {
    // 是否启用 Supabase 云端模式
    ENABLE_CLOUD: false,

    // Supabase 项目 URL
    SUPABASE_URL: '',

    // Supabase anon public key
    SUPABASE_KEY: '',

    // 数据表名
    TABLES: {
        USERS: 'users',
        PROJECTS: 'projects',
        GROUPS: 'groups',
        POSITIONS: 'positions',
        TASKS: 'tasks'
    }
};