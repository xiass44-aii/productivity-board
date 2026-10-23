/**
 * 数据管理层 - 负责人员、项目、任务数据的存储与管理
 * 使用 localStorage 持久化数据
 */

const DataManager = {
    // localStorage keys
    KEYS: {
        USERS: 'pcb_users',
        PROJECTS: 'pcb_projects',
        GROUPS: 'pcb_groups',
        POSITIONS: 'pcb_positions',
        TASKS: 'pcb_tasks',
        CURRENT_USER: 'pcb_current_user',
        ADMIN_AUTH: 'pcb_admin_auth'
    },

    // 任务类型与单位映射
    TASK_TYPES: {
        '设定': '张',
        '单帧': '张',
        '视频': '秒',
        '剪辑': '秒',
        '包装': '秒'
    },

    // 默认人员数据（从图片中提取）
    DEFAULT_USERS: [
        // AI剪辑
        { id: 'u001', group: '1组', position: 'AI剪辑', name: '浩枫', role: 'employee' },
        { id: 'u002', group: '1组', position: 'AI剪辑', name: '波本', role: 'employee' },
        // AI美术
        { id: 'u003', group: '1组', position: 'AI美术', name: '朝临', role: 'employee' },
        { id: 'u004', group: '1组', position: 'AI美术', name: '瑞鑫', role: 'employee' },
        { id: 'u005', group: '1组', position: 'AI美术', name: '六胖', role: 'employee' },
        { id: 'u006', group: '1组', position: 'AI美术', name: '松鼠', role: 'employee' },
        { id: 'u007', group: '1组', position: 'AI美术', name: '见手青', role: 'employee' },
        { id: 'u008', group: '1组', position: 'AI美术', name: '维生素', role: 'employee' },
        // AI生成师
        { id: 'u009', group: '1组', position: 'AI生成师', name: '邦子', role: 'employee' },
        { id: 'u010', group: '1组', position: 'AI生成师', name: '木川', role: 'employee' },
        { id: 'u011', group: '1组', position: 'AI生成师', name: '柟清', role: 'employee' },
        { id: 'u012', group: '1组', position: 'AI生成师', name: '荔枝言', role: 'employee' },
        { id: 'u013', group: '1组', position: 'AI生成师', name: '凉果', role: 'employee' },
        { id: 'u014', group: '1组', position: 'AI生成师', name: '西江月', role: 'employee' },
        // AI学员
        { id: 'u015', group: '2组', position: 'AI学员', name: '汐辞', role: 'employee' },
        { id: 'u016', group: '2组', position: 'AI学员', name: '霖鹤', role: 'employee' },
        { id: 'u017', group: '2组', position: 'AI学员', name: '雾寻', role: 'employee' },
        { id: 'u018', group: '2组', position: 'AI学员', name: '阿汀', role: 'employee' },
        { id: 'u019', group: '2组', position: 'AI学员', name: '云绵', role: 'employee' },
        { id: 'u020', group: '2组', position: 'AI学员', name: '阮商枝', role: 'employee' },
        { id: 'u021', group: '2组', position: 'AI学员', name: '九朝', role: 'employee' },
        { id: 'u022', group: '2组', position: 'AI学员', name: '栗柚', role: 'employee' },
        { id: 'u023', group: '2组', position: 'AI学员', name: '沐芽', role: 'employee' },
        { id: 'u024', group: '2组', position: 'AI学员', name: '炸蛋', role: 'employee' },
        { id: 'u025', group: '2组', position: 'AI学员', name: '困困', role: 'employee' },
        { id: 'u026', group: '2组', position: 'AI学员', name: '花祈', role: 'employee' },
        { id: 'u027', group: '2组', position: 'AI学员', name: '柒久', role: 'employee' },
        { id: 'u028', group: '2组', position: 'AI学员', name: '尤米', role: 'employee' },
        { id: 'u029', group: '2组', position: 'AI学员', name: '木鱼', role: 'employee' },
        { id: 'u030', group: '2组', position: 'AI学员', name: '辣椒油', role: 'employee' },
        // 项目经理
        { id: 'u031', group: '管理组', position: '项目经理', name: '项目经理', role: 'manager' }
    ],

    // 默认项目
    DEFAULT_PROJECTS: ['项目A', '项目B', '项目C'],

    // 默认组别
    DEFAULT_GROUPS: ['1组', '2组', '3组', '管理组'],

    // 默认岗位
    DEFAULT_POSITIONS: ['AI剪辑', 'AI美术', 'AI生成师', 'AI学员', '项目经理'],

    // 管理员密码
    ADMIN_PASSWORD: 'admin123',

    /**
     * 初始化数据
     */
    init() {
        if (!localStorage.getItem(this.KEYS.USERS)) {
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(this.DEFAULT_USERS));
        } else {
            // 数据迁移：把含 "/" 的花名简化为只保留 "/" 后面的部分
            this.migrateUserNames();
        }
        if (!localStorage.getItem(this.KEYS.PROJECTS)) {
            localStorage.setItem(this.KEYS.PROJECTS, JSON.stringify(this.DEFAULT_PROJECTS));
        }
        if (!localStorage.getItem(this.KEYS.GROUPS)) {
            localStorage.setItem(this.KEYS.GROUPS, JSON.stringify(this.DEFAULT_GROUPS));
        }
        if (!localStorage.getItem(this.KEYS.POSITIONS)) {
            localStorage.setItem(this.KEYS.POSITIONS, JSON.stringify(this.DEFAULT_POSITIONS));
        }
        if (!localStorage.getItem(this.KEYS.TASKS)) {
            localStorage.setItem(this.KEYS.TASKS, JSON.stringify([]));
        } else {
            // 同步任务中的用户名（如果迁移了花名）
            this.migrateTaskUserNames();
        }
    },

    // 迁移：把花名中 "姓名/花名" 格式简化为只保留花名
    migrateUserNames() {
        const users = this.getUsers();
        let changed = false;
        users.forEach(u => {
            if (u.name && u.name.includes('/')) {
                const parts = u.name.split('/');
                u.name = parts[parts.length - 1];
                changed = true;
            }
        });
        if (changed) {
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
        }
    },

    // 迁移：同步任务中的用户名
    migrateTaskUserNames() {
        const users = this.getUsers();
        const tasks = this.getTasks();
        // 建立 id -> name 映射
        const nameMap = {};
        users.forEach(u => { nameMap[u.id] = u.name; });

        let changed = false;
        tasks.forEach(t => {
            if (nameMap[t.userId] && t.userName !== nameMap[t.userId]) {
                t.userName = nameMap[t.userId];
                changed = true;
            }
            // 同时检查是否有含 "/" 的旧名字
            if (t.userName && t.userName.includes('/')) {
                const parts = t.userName.split('/');
                t.userName = parts[parts.length - 1];
                changed = true;
            }
        });
        if (changed) {
            localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
        }
    },

    // ========== 用户管理 ==========
    getUsers() {
        return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]');
    },

    addUser(user) {
        const users = this.getUsers();
        user.id = 'u' + Date.now();
        users.push(user);
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
        return user;
    },

    deleteUser(userId) {
        let users = this.getUsers();
        users = users.filter(u => u.id !== userId);
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
    },

    updateUser(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index > -1) {
            const oldName = users[index].name;
            users[index] = { ...users[index], ...updates };
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
            // 同步更新任务中的用户信息
            const tasks = this.getTasks();
            tasks.forEach(t => {
                if (t.userId === userId) {
                    if (updates.name) t.userName = updates.name;
                    if (updates.group) t.userGroup = updates.group;
                    if (updates.position) t.userPosition = updates.position;
                }
            });
            localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
            return users[index];
        }
        return null;
    },

    findUserByName(name) {
        const users = this.getUsers();
        return users.find(u => u.name === name || u.name.includes(name));
    },

    getUserById(id) {
        const users = this.getUsers();
        return users.find(u => u.id === id);
    },

    // ========== 项目管理 ==========
    getProjects() {
        return JSON.parse(localStorage.getItem(this.KEYS.PROJECTS) || '[]');
    },

    addProject(projectName) {
        const projects = this.getProjects();
        if (!projects.includes(projectName)) {
            projects.push(projectName);
            localStorage.setItem(this.KEYS.PROJECTS, JSON.stringify(projects));
        }
        return projects;
    },

    deleteProject(projectName) {
        let projects = this.getProjects();
        projects = projects.filter(p => p !== projectName);
        localStorage.setItem(this.KEYS.PROJECTS, JSON.stringify(projects));
    },

    // ========== 组别管理 ==========
    getGroups() {
        return JSON.parse(localStorage.getItem(this.KEYS.GROUPS) || '[]');
    },

    addGroup(groupName) {
        const groups = this.getGroups();
        if (!groups.includes(groupName)) {
            groups.push(groupName);
            localStorage.setItem(this.KEYS.GROUPS, JSON.stringify(groups));
        }
        return groups;
    },

    updateGroup(oldName, newName) {
        let groups = this.getGroups();
        const index = groups.indexOf(oldName);
        if (index > -1 && !groups.includes(newName)) {
            groups[index] = newName;
            localStorage.setItem(this.KEYS.GROUPS, JSON.stringify(groups));
            // 同步更新所有用户的组别
            const users = this.getUsers();
            users.forEach(u => {
                if (u.group === oldName) u.group = newName;
            });
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
            // 同步更新任务中的组别
            const tasks = this.getTasks();
            tasks.forEach(t => {
                if (t.userGroup === oldName) t.userGroup = newName;
            });
            localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
        }
        return groups;
    },

    deleteGroup(groupName) {
        let groups = this.getGroups();
        groups = groups.filter(g => g !== groupName);
        localStorage.setItem(this.KEYS.GROUPS, JSON.stringify(groups));
    },

    // ========== 岗位管理 ==========
    getPositions() {
        return JSON.parse(localStorage.getItem(this.KEYS.POSITIONS) || '[]');
    },

    addPosition(positionName) {
        const positions = this.getPositions();
        if (!positions.includes(positionName)) {
            positions.push(positionName);
            localStorage.setItem(this.KEYS.POSITIONS, JSON.stringify(positions));
        }
        return positions;
    },

    updatePosition(oldName, newName) {
        let positions = this.getPositions();
        const index = positions.indexOf(oldName);
        if (index > -1 && !positions.includes(newName)) {
            positions[index] = newName;
            localStorage.setItem(this.KEYS.POSITIONS, JSON.stringify(positions));
            // 同步更新所有用户的岗位
            const users = this.getUsers();
            users.forEach(u => {
                if (u.position === oldName) u.position = newName;
            });
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
            // 同步更新任务中的岗位
            const tasks = this.getTasks();
            tasks.forEach(t => {
                if (t.userPosition === oldName) t.userPosition = newName;
            });
            localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
        }
        return positions;
    },

    deletePosition(positionName) {
        let positions = this.getPositions();
        positions = positions.filter(p => p !== positionName);
        localStorage.setItem(this.KEYS.POSITIONS, JSON.stringify(positions));
    },

    // ========== 任务管理 ==========
    getTasks() {
        return JSON.parse(localStorage.getItem(this.KEYS.TASKS) || '[]');
    },

    addTask(task) {
        const tasks = this.getTasks();
        task.id = 't' + Date.now();
        task.createdAt = new Date().toISOString();
        tasks.push(task);
        localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
        return task;
    },

    deleteTask(taskId) {
        let tasks = this.getTasks();
        tasks = tasks.filter(t => t.id !== taskId);
        localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));
    },

    getTasksByUserAndWeek(userId, weekKey) {
        const tasks = this.getTasks();
        return tasks.filter(t => t.userId === userId && t.weekKey === weekKey);
    },

    getTasksByWeek(weekKey) {
        const tasks = this.getTasks();
        return tasks.filter(t => t.weekKey === weekKey);
    },

    // ========== 月份工具 ==========
    getCurrentMonthKey() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        return `${year}-${month.toString().padStart(2, '0')}`;
    },

    getMonthKeyFromDate(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        return `${year}-${month.toString().padStart(2, '0')}`;
    },

    getMonthLabel(monthKey) {
        const match = monthKey.match(/(\d{4})-(\d{2})/);
        if (!match) return monthKey;
        return `${match[1]}年${parseInt(match[2])}月`;
    },

    // 获取最近 N 个月的列表
    getRecentMonths(count = 12) {
        const months = [];
        const now = new Date();
        for (let i = 0; i < count; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = this.getMonthKeyFromDate(date);
            months.push({
                key: monthKey,
                label: this.getMonthLabel(monthKey),
                isCurrent: i === 0
            });
        }
        return months;
    },

    // 判断 weekKey 属于哪个月（以周的周一所在月份为准）
    getMonthKeyFromWeekKey(weekKey) {
        const range = this.getWeekRange(weekKey);
        if (!range) return null;
        return this.getMonthKeyFromDate(range.start);
    },

    // 上一月/下一月
    getAdjacentMonth(monthKey, direction) {
        const match = monthKey.match(/(\d{4})-(\d{2})/);
        if (!match) return monthKey;
        const year = parseInt(match[1]);
        const month = parseInt(match[2]);
        const date = new Date(year, month - 1 + direction, 1);
        return this.getMonthKeyFromDate(date);
    },

    getTasksByMonth(monthKey) {
        const tasks = this.getTasks();
        return tasks.filter(t => {
            const taskMonth = this.getMonthKeyFromWeekKey(t.weekKey);
            return taskMonth === monthKey;
        });
    },

    getTasksByUserAndMonth(userId, monthKey) {
        const tasks = this.getTasks();
        return tasks.filter(t => {
            const taskMonth = this.getMonthKeyFromWeekKey(t.weekKey);
            return t.userId === userId && taskMonth === monthKey;
        });
    },

    // ========== 当前用户 ==========
    setCurrentUser(user) {
        localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(user));
    },

    getCurrentUser() {
        const data = localStorage.getItem(this.KEYS.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    },

    clearCurrentUser() {
        localStorage.removeItem(this.KEYS.CURRENT_USER);
    },

    // ========== 管理员验证 ==========
    verifyAdmin(password) {
        return password === this.ADMIN_PASSWORD;
    },

    setAdminAuth(authed) {
        if (authed) {
            localStorage.setItem(this.KEYS.ADMIN_AUTH, 'true');
        } else {
            localStorage.removeItem(this.KEYS.ADMIN_AUTH);
        }
    },

    isAdminAuthed() {
        return localStorage.getItem(this.KEYS.ADMIN_AUTH) === 'true';
    },

    // ========== 数据导出导入 ==========
    exportAllData() {
        return {
            users: this.getUsers(),
            projects: this.getProjects(),
            tasks: this.getTasks(),
            exportTime: new Date().toISOString()
        };
    },

    importAllData(data) {
        if (data.users) localStorage.setItem(this.KEYS.USERS, JSON.stringify(data.users));
        if (data.projects) localStorage.setItem(this.KEYS.PROJECTS, JSON.stringify(data.projects));
        if (data.tasks) localStorage.setItem(this.KEYS.TASKS, JSON.stringify(data.tasks));
    },

    resetAllData() {
        localStorage.removeItem(this.KEYS.USERS);
        localStorage.removeItem(this.KEYS.PROJECTS);
        localStorage.removeItem(this.KEYS.GROUPS);
        localStorage.removeItem(this.KEYS.POSITIONS);
        localStorage.removeItem(this.KEYS.TASKS);
        localStorage.removeItem(this.KEYS.CURRENT_USER);
        localStorage.removeItem(this.KEYS.ADMIN_AUTH);
        this.init();
    },

    // ========== 云端同步 ==========
    _cloudSyncing: false,
    _cloudDirty: false, // 是否有未同步的更改

    // 从云端拉取数据到本地
    async syncFromCloud() {
        if (!CloudData.isEnabled()) return;
        if (this._cloudSyncing) return;
        this._cloudSyncing = true;

        try {
            const tables = window.CLOUD_CONFIG.TABLES;
            const [users, projects, groups, positions, tasks] = await Promise.all([
                CloudData.selectAll(tables.USERS).catch(() => []),
                CloudData.selectAll(tables.PROJECTS).catch(() => []),
                CloudData.selectAll(tables.GROUPS).catch(() => []),
                CloudData.selectAll(tables.POSITIONS).catch(() => []),
                CloudData.selectAll(tables.TASKS).catch(() => [])
            ]);

            // 云端有数据才覆盖本地
            if (users.length > 0) localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
            if (projects.length > 0) localStorage.setItem(this.KEYS.PROJECTS, JSON.stringify(projects.map(p => p.name || p)));
            if (groups.length > 0) localStorage.setItem(this.KEYS.GROUPS, JSON.stringify(groups.map(g => g.name || g)));
            if (positions.length > 0) localStorage.setItem(this.KEYS.POSITIONS, JSON.stringify(positions.map(p => p.name || p)));
            if (tasks.length > 0) localStorage.setItem(this.KEYS.TASKS, JSON.stringify(tasks));

            console.log('✅ 已从云端同步数据');
        } catch (e) {
            console.error('云端同步失败:', e);
        } finally {
            this._cloudSyncing = false;
        }
    },

    // 将本地数据推送到云端
    async syncToCloud() {
        if (!CloudData.isEnabled()) return;
        if (this._cloudSyncing) return;
        this._cloudSyncing = true;

        try {
            const tables = window.CLOUD_CONFIG.TABLES;
            
            // 转换为云端需要的格式
            const users = this.getUsers();
            const projects = this.getProjects().map(name => ({ name }));
            const groups = this.getGroups().map(name => ({ name }));
            const positions = this.getPositions().map(name => ({ name }));
            const tasks = this.getTasks();

            await Promise.all([
                CloudData.batchUpdate(tables.USERS, users).catch(() => {}),
                CloudData.batchUpdate(tables.PROJECTS, projects).catch(() => {}),
                CloudData.batchUpdate(tables.GROUPS, groups).catch(() => {}),
                CloudData.batchUpdate(tables.POSITIONS, positions).catch(() => {}),
                CloudData.batchUpdate(tables.TASKS, tasks).catch(() => {})
            ]);

            this._cloudDirty = false;
            console.log('✅ 数据已同步到云端');
        } catch (e) {
            console.error('上传云端失败:', e);
        } finally {
            this._cloudSyncing = false;
        }
    },

    // 标记有变更，稍后自动同步（防抖）
    markCloudDirty() {
        const hasCloud = CloudData && CloudData.isEnabled();
        const hasGitHub = GitHubData && GitHubData.isEnabled();
        if (!hasCloud && !hasGitHub) return;
        
        this._cloudDirty = true;
        if (this._syncTimer) clearTimeout(this._syncTimer);
        this._syncTimer = setTimeout(() => {
            this.syncToCloud();
        }, 2000); // 2秒后自动同步
    },

    // ========== GitHub 同步 ==========
    _githubSyncing: false,
    _syncTimer: null,       // 防抖定时器
    _syncPending: false,    // 是否有待同步的变更

    // 标记数据有变更，防抖同步（避免连续操作导致冲突）
    markCloudDirty() {
        this._cloudDirty = true;
        this._syncPending = true;
        // 清除之前的定时器
        if (this._syncTimer) {
            clearTimeout(this._syncTimer);
        }
        // 2 秒后如果没有新的变更，就同步一次
        this._syncTimer = setTimeout(() => {
            if (this._syncPending && isCloudEnabled()) {
                syncToRemote();
            }
        }, 2000);
    },

    // 从 GitHub 拉取数据
    async syncFromGitHub() {
        if (!GitHubData || !GitHubData.isEnabled()) return;
        if (this._githubSyncing) return;
        this._githubSyncing = true;

        try {
            const result = await GitHubData.readData();
            if (result.data) {
                const d = result.data;
                // 只有远端有数据时才覆盖，避免空数据清空本地
                if (d.users && d.users.length > 0) {
                    localStorage.setItem(this.KEYS.USERS, JSON.stringify(d.users));
                }
                if (d.projects && d.projects.length > 0) {
                    localStorage.setItem(this.KEYS.PROJECTS, JSON.stringify(d.projects));
                }
                if (d.groups && d.groups.length > 0) {
                    localStorage.setItem(this.KEYS.GROUPS, JSON.stringify(d.groups));
                }
                if (d.positions && d.positions.length > 0) {
                    localStorage.setItem(this.KEYS.POSITIONS, JSON.stringify(d.positions));
                }
                if (d.tasks && d.tasks.length > 0) {
                    localStorage.setItem(this.KEYS.TASKS, JSON.stringify(d.tasks));
                }
                console.log('✅ 已从 GitHub 同步数据');
            } else {
                console.log('ℹ️ GitHub 上暂无数据，使用本地默认数据');
            }
        } catch (e) {
            console.error('GitHub 同步失败:', e);
        } finally {
            this._githubSyncing = false;
        }
    },

    // 将数据推送到 GitHub
    async syncToGitHub() {
        if (!GitHubData || !GitHubData.isEnabled()) return;
        if (this._githubSyncing) return;
        this._githubSyncing = true;

        try {
            const data = {
                users: this.getUsers(),
                projects: this.getProjects(),
                groups: this.getGroups(),
                positions: this.getPositions(),
                tasks: this.getTasks(),
                updatedAt: new Date().toISOString()
            };
            await GitHubData.writeData(data);
            this._cloudDirty = false;
            this._syncPending = false;
            console.log('✅ 数据已同步到 GitHub');
        } catch (e) {
            console.error('GitHub 上传失败:', e);
        } finally {
            this._githubSyncing = false;
        }
    },

    // ========== 周次工具 ==========
    getCurrentWeekKey() {
        const now = new Date();
        const year = now.getFullYear();
        const weekNum = this.getWeekNumber(now);
        return `${year}-W${weekNum.toString().padStart(2, '0')}`;
    },

    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },

    getWeekRange(weekKey) {
        const match = weekKey.match(/(\d{4})-W(\d{2})/);
        if (!match) return null;
        const year = parseInt(match[1]);
        const week = parseInt(match[2]);
        
        // 计算该年第一个周的周一
        const jan4 = new Date(Date.UTC(year, 0, 4));
        const jan4Day = jan4.getUTCDay() || 7;
        const week1Monday = new Date(jan4);
        week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
        
        // 计算目标周的周一
        const monday = new Date(week1Monday);
        monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
        
        const sunday = new Date(monday);
        sunday.setUTCDate(monday.getUTCDate() + 6);
        
        return {
            monday: `${monday.getMonth() + 1}/${monday.getDate()}`,
            sunday: `${sunday.getMonth() + 1}/${sunday.getDate()}`,
            start: monday,
            end: sunday
        };
    },

    getWeekLabel(weekKey) {
        const range = this.getWeekRange(weekKey);
        if (!range) return weekKey;
        return `${weekKey} (${range.monday} - ${range.sunday})`;
    },

    // 获取最近 N 周的列表
    getRecentWeeks(count = 10) {
        const weeks = [];
        const now = new Date();
        for (let i = 0; i < count; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i * 7);
            const weekKey = this.getWeekKeyFromDate(date);
            weeks.push({
                key: weekKey,
                label: this.getWeekLabel(weekKey),
                isCurrent: i === 0
            });
        }
        return weeks;
    },

    getWeekKeyFromDate(date) {
        const year = date.getFullYear();
        const weekNum = this.getWeekNumber(date);
        return `${year}-W${weekNum.toString().padStart(2, '0')}`;
    },

    // 上一周/下一周
    getAdjacentWeek(weekKey, direction) {
        const match = weekKey.match(/(\d{4})-W(\d{2})/);
        if (!match) return weekKey;
        const year = parseInt(match[1]);
        const week = parseInt(match[2]);
        
        const jan4 = new Date(Date.UTC(year, 0, 4));
        const jan4Day = jan4.getUTCDay() || 7;
        const week1Monday = new Date(jan4);
        week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
        
        const targetMonday = new Date(week1Monday);
        targetMonday.setUTCDate(week1Monday.getUTCDate() + (week - 1 + direction) * 7);
        
        return this.getWeekKeyFromDate(targetMonday);
    }
};

// 自动包装所有写操作方法，数据变更后自动标记云端 dirty
(function () {
    const writeMethods = [
        'addUser', 'deleteUser', 'updateUser',
        'addProject', 'deleteProject',
        'addGroup', 'deleteGroup', 'updateGroup',
        'addPosition', 'deletePosition', 'updatePosition',
        'addTask', 'deleteTask',
        'importAllData', 'resetAllData'
    ];

    writeMethods.forEach(methodName => {
        const original = DataManager[methodName];
        if (typeof original === 'function') {
            DataManager[methodName] = function () {
                const result = original.apply(this, arguments);
                // 使用防抖同步，避免连续操作导致冲突
                DataManager.markCloudDirty();
                return result;
            };
        }
    });
})();

// 初始化数据
DataManager.init();

// 判断启用了哪种云端模式
function isCloudEnabled() {
    return (CloudData && CloudData.isEnabled()) || 
           (GitHubData && GitHubData.isEnabled());
}

// 统一的同步函数
async function syncFromRemote() {
    if (GitHubData && GitHubData.isEnabled()) {
        await DataManager.syncFromGitHub();
    } else if (CloudData && CloudData.isEnabled()) {
        await DataManager.syncFromCloud();
    }
}

async function syncToRemote() {
    if (GitHubData && GitHubData.isEnabled()) {
        await DataManager.syncToGitHub();
    } else if (CloudData && CloudData.isEnabled()) {
        await DataManager.syncToCloud();
    }
}

// 如果启用了云端模式，自动同步
if (isCloudEnabled()) {
    // 启动时从云端拉取
    syncFromRemote().catch(err => {
        console.warn('云端同步失败，使用本地数据:', err.message);
    });
    
    // 每 30 秒从云端拉取一次，获取其他人的更新
    setInterval(() => {
        syncFromRemote();
    }, 30000);
}

// 监听页面关闭前同步一次
window.addEventListener('beforeunload', () => {
    if (isCloudEnabled() && DataManager._cloudDirty) {
        syncToRemote();
    }
});
