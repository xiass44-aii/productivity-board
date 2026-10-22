/**
 * 主应用逻辑 - 负责页面路由、交互和渲染
 */

const App = {
    currentPage: 'login',
    currentWeekKey: '',
    currentMonthKey: '',
    employeeViewMode: 'week', // week / month
    managerViewMode: 'week',  // week / month
    currentUser: null,
    uploadedImages: [], // 当前上传的截图临时存储

    init() {
        this.bindEvents();
        this.checkLoginStatus();
    },

    // ========== 页面切换 ==========
    showPage(pageName) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(pageName + '-page').classList.add('active');
        this.currentPage = pageName;
    },

    // ========== 事件绑定 ==========
    bindEvents() {
        // 登录
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('login-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // 登出
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        document.getElementById('manager-logout-btn').addEventListener('click', () => this.handleLogout());

        // 后台管理入口
        document.getElementById('go-admin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('admin');
            this.renderAdminPage();
        });

        document.getElementById('admin-back-btn').addEventListener('click', () => {
            DataManager.setAdminAuth(false);
            this.showPage('login');
        });

        // 管理员登录
        document.getElementById('admin-login-btn').addEventListener('click', () => this.handleAdminLogin());
        document.getElementById('admin-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAdminLogin();
        });

        // 员工页面 - 视图切换（周/月）
        document.querySelectorAll('#employee-page .view-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchEmployeeView(e.target.dataset.view);
            });
        });

        // 员工页面 - 周选择
        document.getElementById('week-select').addEventListener('change', (e) => {
            this.currentWeekKey = e.target.value;
            this.updateTimeLabel();
            this.renderPersonalSummary();
            this.renderEmployeeTasks();
        });
        document.getElementById('prev-week').addEventListener('click', () => {
            this.currentWeekKey = DataManager.getAdjacentWeek(this.currentWeekKey, -1);
            this.syncWeekSelect();
            this.renderPersonalSummary();
            this.renderEmployeeTasks();
        });
        document.getElementById('next-week').addEventListener('click', () => {
            this.currentWeekKey = DataManager.getAdjacentWeek(this.currentWeekKey, 1);
            this.syncWeekSelect();
            this.renderPersonalSummary();
            this.renderEmployeeTasks();
        });

        // 员工页面 - 月选择
        document.getElementById('month-select').addEventListener('change', (e) => {
            this.currentMonthKey = e.target.value;
            this.updateTimeLabel();
            this.renderPersonalSummary();
            this.renderEmployeeTasks();
        });
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentMonthKey = DataManager.getAdjacentMonth(this.currentMonthKey, -1);
            this.syncMonthSelect();
            this.renderPersonalSummary();
            this.renderEmployeeTasks();
        });
        document.getElementById('next-month').addEventListener('click', () => {
            this.currentMonthKey = DataManager.getAdjacentMonth(this.currentMonthKey, 1);
            this.syncMonthSelect();
            this.renderPersonalSummary();
            this.renderEmployeeTasks();
        });

        // 任务类型变化 - 自动填充单位
        document.getElementById('task-type').addEventListener('change', (e) => {
            const unit = DataManager.TASK_TYPES[e.target.value] || '';
            document.getElementById('task-unit').value = unit;
        });

        // 上传截图
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('task-screenshot');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // 添加任务
        document.getElementById('add-task-btn').addEventListener('click', () => this.handleAddTask());
        document.getElementById('reset-form-btn').addEventListener('click', () => this.resetTaskForm());

        // 项目经理页面 - 视图切换
        document.getElementById('manager-tab-week').addEventListener('click', () => {
            this.switchManagerView('week');
        });
        document.getElementById('manager-tab-month').addEventListener('click', () => {
            this.switchManagerView('month');
        });

        // 项目经理页面 - 筛选
        document.getElementById('manager-week-select').addEventListener('change', () => this.renderManagerData());
        document.getElementById('manager-month-select').addEventListener('change', () => this.renderManagerData());
        document.getElementById('manager-group-filter').addEventListener('change', () => this.renderManagerData());
        document.getElementById('manager-position-filter').addEventListener('change', () => this.renderManagerData());
        document.getElementById('manager-project-filter').addEventListener('change', () => this.renderManagerData());
        document.getElementById('manager-person-filter').addEventListener('change', () => this.renderManagerData());

        // 后台管理 - 项目
        document.getElementById('add-project-btn').addEventListener('click', () => this.handleAddProject());
        document.getElementById('new-project-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddProject();
        });

        // 后台管理 - 组别
        document.getElementById('add-group-btn').addEventListener('click', () => this.handleAddGroup());
        document.getElementById('new-group-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddGroup();
        });

        // 后台管理 - 岗位
        document.getElementById('add-position-btn').addEventListener('click', () => this.handleAddPosition());
        document.getElementById('new-position-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddPosition();
        });

        // 后台管理 - 人员
        document.getElementById('add-person-btn').addEventListener('click', () => this.handleAddPerson());

        // 编辑标签弹窗
        document.getElementById('edit-tag-overlay').addEventListener('click', () => this.closeEditTagModal());
        document.getElementById('edit-tag-close').addEventListener('click', () => this.closeEditTagModal());
        document.getElementById('cancel-tag-edit-btn').addEventListener('click', () => this.closeEditTagModal());
        document.getElementById('save-tag-edit-btn').addEventListener('click', () => this.saveTagEdit());
        document.getElementById('edit-tag-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveTagEdit();
        });

        // 编辑人员弹窗
        document.getElementById('edit-person-overlay').addEventListener('click', () => this.closeEditPersonModal());
        document.getElementById('edit-person-close').addEventListener('click', () => this.closeEditPersonModal());
        document.getElementById('cancel-person-edit-btn').addEventListener('click', () => this.closeEditPersonModal());
        document.getElementById('save-person-edit-btn').addEventListener('click', () => this.savePersonEdit());

        // 后台管理 - 数据操作
        document.getElementById('export-data-btn').addEventListener('click', () => this.handleExportData());
        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        document.getElementById('import-file').addEventListener('change', (e) => this.handleImportData(e));
        document.getElementById('reset-data-btn').addEventListener('click', () => this.handleResetData());
        
        // Excel 导入导出
        document.getElementById('import-excel-btn').addEventListener('click', () => {
            document.getElementById('import-excel-file').click();
        });
        document.getElementById('import-excel-file').addEventListener('change', (e) => this.handleImportExcel(e));
        document.getElementById('export-excel-btn').addEventListener('click', () => this.handleExportExcel());

        // 图片预览弹窗
        document.getElementById('modal-overlay').addEventListener('click', () => this.closeImageModal());
        document.getElementById('modal-close').addEventListener('click', () => this.closeImageModal());
    },

    // ========== 登录相关 ==========
    checkLoginStatus() {
        const user = DataManager.getCurrentUser();
        if (user) {
            this.currentUser = user;
            if (user.role === 'manager') {
                this.enterManagerPage(user);
            } else {
                this.enterEmployeePage(user);
            }
        } else {
            this.showPage('login');
        }
    },

    handleLogin() {
        const name = document.getElementById('login-name').value.trim();
        if (!name) {
            this.showToast('请输入花名', 'warning');
            return;
        }

        const user = DataManager.findUserByName(name);
        if (!user) {
            this.showToast('未找到该花名，请联系管理员', 'error');
            return;
        }

        DataManager.setCurrentUser(user);
        this.currentUser = user;

        if (user.role === 'manager') {
            this.enterManagerPage(user);
        } else {
            this.enterEmployeePage(user);
        }

        this.showToast(`欢迎，${user.name}！`, 'success');
    },

    handleLogout() {
        DataManager.clearCurrentUser();
        this.currentUser = null;
        document.getElementById('login-name').value = '';
        this.showPage('login');
    },

    // ========== 员工页面 ==========
    enterEmployeePage(user) {
        this.showPage('employee');
        document.getElementById('user-display-name').textContent = user.name;
        document.getElementById('user-role').textContent = user.position;
        
        // 设置当前周/月
        this.currentWeekKey = DataManager.getCurrentWeekKey();
        this.currentMonthKey = DataManager.getCurrentMonthKey();
        this.employeeViewMode = 'week';
        
        // 初始化选择器
        this.initWeekSelector();
        this.initMonthSelector();
        
        // 加载项目下拉框
        this.loadProjectOptions('task-project');
        
        // 渲染数据
        this.renderPersonalSummary();
        this.renderEmployeeTasks();
    },

    // 切换员工视图（周/月）
    switchEmployeeView(view) {
        this.employeeViewMode = view;
        
        // 更新 Tab 状态
        document.querySelectorAll('#employee-page .view-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });

        // 显示对应控件
        document.getElementById('week-controls').style.display = view === 'week' ? 'flex' : 'none';
        document.getElementById('month-controls').style.display = view === 'month' ? 'flex' : 'none';

        // 更新标题
        const isWeek = view === 'week';
        document.getElementById('task-section-title').textContent = isWeek ? '📝 本周任务提交' : '📝 本月任务提交';
        document.getElementById('task-list-title').textContent = isWeek ? '本周已提交任务' : '本月已提交任务';

        // 任务表单只在周视图显示（按周提交）
        document.querySelector('.add-task-form').style.display = isWeek ? 'block' : 'none';

        this.updateTimeLabel();
        this.renderPersonalSummary();
        this.renderEmployeeTasks();
    },

    initWeekSelector() {
        const select = document.getElementById('week-select');
        const weeks = DataManager.getRecentWeeks(12);
        select.innerHTML = weeks.map(w => 
            `<option value="${w.key}" ${w.isCurrent ? 'selected' : ''}>${w.label}</option>`
        ).join('');
        this.updateTimeLabel();
    },

    syncWeekSelect() {
        const select = document.getElementById('week-select');
        if (!Array.from(select.options).some(o => o.value === this.currentWeekKey)) {
            const option = document.createElement('option');
            option.value = this.currentWeekKey;
            option.textContent = DataManager.getWeekLabel(this.currentWeekKey);
            select.appendChild(option);
        }
        select.value = this.currentWeekKey;
        this.updateTimeLabel();
    },

    initMonthSelector() {
        const select = document.getElementById('month-select');
        const months = DataManager.getRecentMonths(12);
        select.innerHTML = months.map(m => 
            `<option value="${m.key}" ${m.isCurrent ? 'selected' : ''}>${m.label}</option>`
        ).join('');
    },

    syncMonthSelect() {
        const select = document.getElementById('month-select');
        if (!Array.from(select.options).some(o => o.value === this.currentMonthKey)) {
            const option = document.createElement('option');
            option.value = this.currentMonthKey;
            option.textContent = DataManager.getMonthLabel(this.currentMonthKey);
            select.appendChild(option);
        }
        select.value = this.currentMonthKey;
        this.updateTimeLabel();
    },

    updateTimeLabel() {
        let label = '';
        if (this.employeeViewMode === 'week') {
            label = '当前周：' + DataManager.getWeekLabel(this.currentWeekKey);
        } else {
            label = '当前月：' + DataManager.getMonthLabel(this.currentMonthKey);
        }
        document.getElementById('current-time-label').textContent = label;
    },

    loadProjectOptions(selectId) {
        const select = document.getElementById(selectId);
        const projects = DataManager.getProjects();
        const currentValue = select.value;
        
        const firstOption = select.querySelector('option');
        select.innerHTML = '';
        if (firstOption) select.appendChild(firstOption);
        
        projects.forEach(p => {
            const option = document.createElement('option');
            option.value = p;
            option.textContent = p;
            select.appendChild(option);
        });
        
        if (currentValue && projects.includes(currentValue)) {
            select.value = currentValue;
        }
    },

    renderPersonalSummary() {
        let tasks;
        let title;
        if (this.employeeViewMode === 'week') {
            tasks = DataManager.getTasksByUserAndWeek(this.currentUser.id, this.currentWeekKey);
            title = '📊 本周产量汇总';
        } else {
            tasks = DataManager.getTasksByUserAndMonth(this.currentUser.id, this.currentMonthKey);
            title = '📊 本月产量汇总';
        }
        const summary = this.calculateTaskSummary(tasks);

        document.getElementById('personal-summary-title').textContent = title;
        
        const container = document.getElementById('personal-summary');
        container.innerHTML = Object.keys(DataManager.TASK_TYPES).map(type => {
            const data = summary[type] || { passed: 0, inProgress: 0 };
            const unit = DataManager.TASK_TYPES[type];
            const cardClass = {
                '设定': 'card-setting',
                '单帧': 'card-frame',
                '视频': 'card-video',
                '剪辑': 'card-edit',
                '包装': 'card-package'
            }[type];
            
            return `
                <div class="summary-card ${cardClass}">
                    <div class="card-title">${type}（已通过）</div>
                    <div class="card-value">${data.passed}<span class="card-unit">${unit}</span></div>
                    <div style="font-size:12px; color:#999; margin-top:4px;">在制：${data.inProgress} ${unit}</div>
                </div>
            `;
        }).join('');
    },

    calculateTaskSummary(tasks) {
        const summary = {};
        tasks.forEach(task => {
            if (!summary[task.taskType]) {
                summary[task.taskType] = { passed: 0, inProgress: 0 };
            }
            summary[task.taskType].passed += Number(task.passedCount) || 0;
            summary[task.taskType].inProgress += Number(task.inProgressCount) || 0;
        });
        return summary;
    },

    renderEmployeeTasks() {
        let tasks;
        if (this.employeeViewMode === 'week') {
            tasks = DataManager.getTasksByUserAndWeek(this.currentUser.id, this.currentWeekKey);
        } else {
            tasks = DataManager.getTasksByUserAndMonth(this.currentUser.id, this.currentMonthKey);
        }
        
        const tbody = document.getElementById('task-list-body');
        const emptyState = document.getElementById('task-empty');

        if (tasks.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        if (this.employeeViewMode === 'month') {
            // 月视图：按周分组显示
            const weekGroups = {};
            tasks.forEach(task => {
                if (!weekGroups[task.weekKey]) {
                    weekGroups[task.weekKey] = [];
                }
                weekGroups[task.weekKey].push(task);
            });

            const sortedWeeks = Object.keys(weekGroups).sort();
            tbody.innerHTML = sortedWeeks.map(weekKey => {
                const weekTasks = weekGroups[weekKey];
                const weekLabel = DataManager.getWeekLabel(weekKey);
                return `
                    <tr class="week-group-header">
                        <td colspan="8"><strong>📅 ${weekLabel}</strong> <span style="color:#888;font-weight:normal;font-size:12px;">（${weekTasks.length} 条任务）</span></td>
                    </tr>
                    ${weekTasks.map(task => this.renderTaskRow(task, false)).join('')}
                `;
            }).join('');
        } else {
            // 周视图：直接显示
            tbody.innerHTML = tasks.map(task => this.renderTaskRow(task, true)).join('');
        }

        // 绑定删除事件
        tbody.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.dataset.id;
                if (confirm('确定要删除这条任务记录吗？')) {
                    DataManager.deleteTask(taskId);
                    this.renderEmployeeTasks();
                    this.renderPersonalSummary();
                    this.showToast('删除成功', 'success');
                }
            });
        });

        // 绑定图片预览
        this.bindImagePreview(tbody);
    },

    renderTaskRow(task, showDelete = true) {
        const screenshots = task.screenshots || [];
        const thumbHtml = screenshots.length > 0 
            ? `<div class="screenshot-thumb">
                ${screenshots.slice(0, 3).map(src => `<img src="${src}" alt="截图" class="preview-trigger">`).join('')}
                ${screenshots.length > 3 ? `<span class="screenshot-count">+${screenshots.length - 3}</span>` : ''}
               </div>`
            : '<span style="color:#ccc;">无</span>';

        const deleteCell = showDelete 
            ? `<td><button class="action-btn delete delete-task" data-id="${task.id}">删除</button></td>`
            : '';

        return `
            <tr>
                <td>${task.project}</td>
                <td>${task.taskType}</td>
                <td>${task.unit}</td>
                <td><strong>${task.passedCount}</strong></td>
                <td>${task.inProgressCount}</td>
                <td>${task.progress}%</td>
                <td>${thumbHtml}</td>
                ${showDelete ? deleteCell : ''}
            </tr>
        `;
    },

    // ========== 文件上传 ==========
    handleFileUpload(files) {
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.uploadedImages.push(e.target.result);
                this.renderUploadPreview();
            };
            reader.readAsDataURL(file);
        });
    },

    renderUploadPreview() {
        const preview = document.getElementById('upload-preview');
        if (this.uploadedImages.length === 0) {
            preview.innerHTML = '';
            return;
        }

        preview.innerHTML = this.uploadedImages.map((src, index) => `
            <div class="upload-preview-item">
                <img src="${src}" alt="预览">
                <button class="remove-btn" data-index="${index}">✕</button>
            </div>
        `).join('');

        preview.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.dataset.index);
                this.uploadedImages.splice(index, 1);
                this.renderUploadPreview();
            });
        });
    },

    // ========== 添加任务 ==========
    handleAddTask() {
        const project = document.getElementById('task-project').value;
        const taskType = document.getElementById('task-type').value;
        const unit = document.getElementById('task-unit').value;
        const passedCount = parseInt(document.getElementById('task-passed').value) || 0;
        const inProgressCount = parseInt(document.getElementById('task-inprogress').value) || 0;
        const progress = parseInt(document.getElementById('task-progress').value) || 0;

        if (!project) {
            this.showToast('请选择项目', 'warning');
            return;
        }
        if (!taskType) {
            this.showToast('请选择任务类型', 'warning');
            return;
        }
        if (passedCount === 0 && inProgressCount === 0) {
            this.showToast('请至少填写已通过或在制数量', 'warning');
            return;
        }

        const task = {
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            userGroup: this.currentUser.group,
            userPosition: this.currentUser.position,
            project,
            taskType,
            unit,
            passedCount,
            inProgressCount,
            progress,
            weekKey: this.currentWeekKey,
            screenshots: [...this.uploadedImages]
        };

        DataManager.addTask(task);
        this.resetTaskForm();
        this.renderEmployeeTasks();
        this.renderPersonalSummary();
        this.showToast('任务添加成功！', 'success');
    },

    resetTaskForm() {
        document.getElementById('task-project').value = '';
        document.getElementById('task-type').value = '';
        document.getElementById('task-unit').value = '';
        document.getElementById('task-passed').value = '0';
        document.getElementById('task-inprogress').value = '0';
        document.getElementById('task-progress').value = '0';
        this.uploadedImages = [];
        this.renderUploadPreview();
    },

    // ========== 项目经理页面 ==========
    enterManagerPage(user) {
        this.showPage('manager');
        document.getElementById('manager-display-name').textContent = user.name;
        this.managerViewMode = 'week';
        
        // 初始化周选择
        const weekSelect = document.getElementById('manager-week-select');
        const weeks = DataManager.getRecentWeeks(12);
        weekSelect.innerHTML = weeks.map(w => 
            `<option value="${w.key}" ${w.isCurrent ? 'selected' : ''}>${w.label}</option>`
        ).join('');

        // 初始化月选择
        const monthSelect = document.getElementById('manager-month-select');
        const months = DataManager.getRecentMonths(12);
        monthSelect.innerHTML = months.map(m => 
            `<option value="${m.key}" ${m.isCurrent ? 'selected' : ''}>${m.label}</option>`
        ).join('');

        // 加载筛选选项
        this.loadFilterOptions();
        
        // 加载项目筛选
        this.loadProjectFilter();

        // 渲染数据
        this.renderManagerData();
    },

    // 切换项目经理视图（周/月）
    switchManagerView(view) {
        this.managerViewMode = view;
        
        // 更新 Tab 状态
        document.getElementById('manager-tab-week').classList.toggle('active', view === 'week');
        document.getElementById('manager-tab-month').classList.toggle('active', view === 'month');

        // 显示对应控件
        document.getElementById('manager-week-group').style.display = view === 'week' ? 'flex' : 'none';
        document.getElementById('manager-month-group').style.display = view === 'month' ? 'flex' : 'none';

        // 显示/隐藏月度按周汇总
        document.getElementById('manager-weekly-breakdown-section').style.display = view === 'month' ? 'block' : 'none';

        this.renderManagerData();
    },

    loadFilterOptions() {
        const users = DataManager.getUsers();
        const groups = DataManager.getGroups();
        const positions = DataManager.getPositions();

        const groupSelect = document.getElementById('manager-group-filter');
        const posSelect = document.getElementById('manager-position-filter');
        const personSelect = document.getElementById('manager-person-filter');

        groupSelect.innerHTML = '<option value="">全部组</option>' + 
            groups.map(g => `<option value="${g}">${g}</option>`).join('');
        
        posSelect.innerHTML = '<option value="">全部岗位</option>' + 
            positions.map(p => `<option value="${p}">${p}</option>`).join('');

        // 人员列表（只显示普通员工）
        const employees = users.filter(u => u.role === 'employee');
        personSelect.innerHTML = '<option value="">全部人员</option>' + 
            employees.map(u => `<option value="${u.id}">${u.name}（${u.position}）</option>`).join('');
    },

    loadProjectFilter() {
        const select = document.getElementById('manager-project-filter');
        const projects = DataManager.getProjects();
        select.innerHTML = '<option value="">全部项目</option>' + 
            projects.map(p => `<option value="${p}">${p}</option>`).join('');
    },

    renderManagerData() {
        const groupFilter = document.getElementById('manager-group-filter').value;
        const posFilter = document.getElementById('manager-position-filter').value;
        const projectFilter = document.getElementById('manager-project-filter').value;
        const personFilter = document.getElementById('manager-person-filter').value;

        let tasks;
        if (this.managerViewMode === 'week') {
            const weekKey = document.getElementById('manager-week-select').value;
            tasks = DataManager.getTasksByWeek(weekKey);
        } else {
            const monthKey = document.getElementById('manager-month-select').value;
            tasks = DataManager.getTasksByMonth(monthKey);
        }

        // 筛选
        if (groupFilter) {
            tasks = tasks.filter(t => t.userGroup === groupFilter);
        }
        if (posFilter) {
            tasks = tasks.filter(t => t.userPosition === posFilter);
        }
        if (projectFilter) {
            tasks = tasks.filter(t => t.project === projectFilter);
        }
        if (personFilter) {
            tasks = tasks.filter(t => t.userId === personFilter);
        }

        // 更新团队汇总标题
        const teamTitle = this.managerViewMode === 'week' ? '📊 本周团队产量汇总' : '📊 本月团队产量汇总';
        document.getElementById('team-summary-title').textContent = teamTitle;

        // 渲染团队汇总
        this.renderTeamSummary(tasks);

        // 渲染明细表格
        this.renderManagerTaskTable(tasks);

        // 渲染按人员汇总
        this.renderPersonSummary(tasks);

        // 月视图额外渲染：按周汇总
        if (this.managerViewMode === 'month') {
            this.renderWeeklyBreakdown(tasks);
        }
    },

    renderTeamSummary(tasks) {
        const summary = this.calculateTaskSummary(tasks);
        const container = document.getElementById('team-summary');
        
        container.innerHTML = Object.keys(DataManager.TASK_TYPES).map(type => {
            const data = summary[type] || { passed: 0, inProgress: 0 };
            const unit = DataManager.TASK_TYPES[type];
            const cardClass = {
                '设定': 'card-setting',
                '单帧': 'card-frame',
                '视频': 'card-video',
                '剪辑': 'card-edit',
                '包装': 'card-package'
            }[type];
            
            return `
                <div class="summary-card ${cardClass}">
                    <div class="card-title">${type}（已通过）</div>
                    <div class="card-value">${data.passed}<span class="card-unit">${unit}</span></div>
                    <div style="font-size:12px; color:#999; margin-top:4px;">在制：${data.inProgress} ${unit}</div>
                </div>
            `;
        }).join('');
    },

    renderManagerTaskTable(tasks) {
        const tbody = document.getElementById('manager-task-body');
        const emptyState = document.getElementById('manager-empty');

        if (tasks.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        tbody.innerHTML = tasks.map(task => {
            const screenshots = task.screenshots || [];
            const thumbHtml = screenshots.length > 0 
                ? `<div class="screenshot-thumb">
                    ${screenshots.slice(0, 2).map(src => `<img src="${src}" alt="截图" class="preview-trigger">`).join('')}
                    ${screenshots.length > 2 ? `<span class="screenshot-count">+${screenshots.length - 2}</span>` : ''}
                   </div>`
                : '<span style="color:#ccc;">无</span>';

            return `
                <tr>
                    <td>${task.userGroup}</td>
                    <td>${task.userPosition}</td>
                    <td><strong>${task.userName}</strong></td>
                    <td>${task.project}</td>
                    <td>${task.taskType}</td>
                    <td>${task.unit}</td>
                    <td><strong>${task.passedCount}</strong></td>
                    <td>${task.inProgressCount}</td>
                    <td>${task.progress}%</td>
                    <td>${thumbHtml}</td>
                </tr>
            `;
        }).join('');

        this.bindImagePreview(tbody);
    },

    renderPersonSummary(tasks) {
        const allUsers = DataManager.getUsers().filter(u => u.role === 'employee');
        const tbody = document.getElementById('manager-person-summary-body');
        
        const taskTypes = Object.keys(DataManager.TASK_TYPES);
        
        // 只显示有任务数据的用户（响应筛选条件）
        const userIdsInTasks = new Set(tasks.map(t => t.userId));
        const users = allUsers.filter(u => userIdsInTasks.has(u.id));
        
        // 如果筛选后没有用户，显示所有用户（全部人员的默认状态）
        const displayUsers = userIdsInTasks.size > 0 ? users : allUsers;
        
        tbody.innerHTML = displayUsers.map(user => {
            const userTasks = tasks.filter(t => t.userId === user.id);
            const summary = this.calculateTaskSummary(userTasks);
            
            return `
                <tr>
                    <td>${user.group}</td>
                    <td>${user.position}</td>
                    <td><strong>${user.name}</strong></td>
                    ${taskTypes.map(type => {
                        const data = summary[type] || { passed: 0 };
                        const unit = DataManager.TASK_TYPES[type];
                        return `<td>${data.passed} <span style="color:#999;font-size:12px;">${unit}</span></td>`;
                    }).join('')}
                </tr>
            `;
        }).join('');
    },

    // 月度按周汇总
    renderWeeklyBreakdown(tasks) {
        const tbody = document.getElementById('manager-weekly-breakdown-body');
        const taskTypes = Object.keys(DataManager.TASK_TYPES);

        // 按周分组
        const weekGroups = {};
        tasks.forEach(task => {
            if (!weekGroups[task.weekKey]) {
                weekGroups[task.weekKey] = [];
            }
            weekGroups[task.weekKey].push(task);
        });

        const sortedWeeks = Object.keys(weekGroups).sort();
        
        if (sortedWeeks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#999; padding:30px;">暂无数据</td></tr>';
            return;
        }

        tbody.innerHTML = sortedWeeks.map(weekKey => {
            const weekTasks = weekGroups[weekKey];
            const summary = this.calculateTaskSummary(weekTasks);
            const uniqueUsers = new Set(weekTasks.map(t => t.userId)).size;
            const weekLabel = DataManager.getWeekLabel(weekKey);

            return `
                <tr>
                    <td><strong>${weekLabel}</strong></td>
                    ${taskTypes.map(type => {
                        const data = summary[type] || { passed: 0 };
                        const unit = DataManager.TASK_TYPES[type];
                        return `<td>${data.passed} <span style="color:#999;font-size:12px;">${unit}</span></td>`;
                    }).join('')}
                    <td>${uniqueUsers} 人</td>
                </tr>
            `;
        }).join('');
    },

    // ========== 后台管理 ==========
    renderAdminPage() {
        if (DataManager.isAdminAuthed()) {
            document.getElementById('admin-auth').style.display = 'none';
            document.getElementById('admin-content').style.display = 'block';
            this.renderProjectList();
            this.renderGroupList();
            this.renderPositionList();
            this.renderAdminPersonList();
            this.loadAdminFormSelects();
        } else {
            document.getElementById('admin-auth').style.display = 'block';
            document.getElementById('admin-content').style.display = 'none';
        }
    },

    // 加载后台人员表单中的组别和岗位下拉
    loadAdminFormSelects() {
        const groups = DataManager.getGroups();
        const positions = DataManager.getPositions();

        const groupSelect = document.getElementById('new-person-group');
        groupSelect.innerHTML = '<option value="">请选择组</option>' +
            groups.map(g => `<option value="${g}">${g}</option>`).join('');

        const posSelect = document.getElementById('new-person-position');
        posSelect.innerHTML = '<option value="">请选择岗位</option>' +
            positions.map(p => `<option value="${p}">${p}</option>`).join('');
    },

    handleAdminLogin() {
        const password = document.getElementById('admin-password').value;
        if (DataManager.verifyAdmin(password)) {
            DataManager.setAdminAuth(true);
            this.renderAdminPage();
            this.showToast('验证成功', 'success');
        } else {
            this.showToast('密码错误', 'error');
        }
    },

    renderProjectList() {
        const projects = DataManager.getProjects();
        const container = document.getElementById('project-list');
        container.innerHTML = projects.map(p => `
            <span class="item-tag">
                ${p}
                <span class="edit-tag" data-type="project" data-name="${p}">✏️</span>
                <span class="remove-tag" data-type="project" data-name="${p}">✕</span>
            </span>
        `).join('');

        this.bindTagActions(container, 'project');
    },

    renderGroupList() {
        const groups = DataManager.getGroups();
        const container = document.getElementById('group-list');
        container.innerHTML = groups.map(g => `
            <span class="item-tag">
                ${g}
                <span class="edit-tag" data-type="group" data-name="${g}">✏️</span>
                <span class="remove-tag" data-type="group" data-name="${g}">✕</span>
            </span>
        `).join('');

        this.bindTagActions(container, 'group');
    },

    renderPositionList() {
        const positions = DataManager.getPositions();
        const container = document.getElementById('position-list');
        container.innerHTML = positions.map(p => `
            <span class="item-tag">
                ${p}
                <span class="edit-tag" data-type="position" data-name="${p}">✏️</span>
                <span class="remove-tag" data-type="position" data-name="${p}">✕</span>
            </span>
        `).join('');

        this.bindTagActions(container, 'position');
    },

    // 统一绑定标签的编辑和删除事件
    bindTagActions(container, type) {
        // 删除
        container.querySelectorAll('.remove-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                const name = e.target.dataset.name;
                const typeLabels = { project: '项目', group: '组别', position: '岗位' };
                if (confirm(`确定删除${typeLabels[type]}「${name}」吗？`)) {
                    if (type === 'project') DataManager.deleteProject(name);
                    else if (type === 'group') DataManager.deleteGroup(name);
                    else if (type === 'position') DataManager.deletePosition(name);
                    this.refreshAdminLists();
                    this.showToast('删除成功', 'success');
                }
            });
        });

        // 编辑
        container.querySelectorAll('.edit-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                const name = e.target.dataset.name;
                const typeLabels = { project: '项目', group: '组别', position: '岗位' };
                this.openEditTagModal(type, name, typeLabels[type]);
            });
        });
    },

    // 刷新后台所有列表
    refreshAdminLists() {
        this.renderProjectList();
        this.renderGroupList();
        this.renderPositionList();
        this.renderAdminPersonList();
        this.loadAdminFormSelects();
    },

    // 打开标签编辑弹窗
    openEditTagModal(type, oldName, label) {
        this._editingTagType = type;
        this._editingTagOldName = oldName;
        document.getElementById('edit-tag-title').textContent = `编辑${label}`;
        document.getElementById('edit-tag-input').value = oldName;
        document.getElementById('edit-tag-modal').classList.add('active');
        setTimeout(() => document.getElementById('edit-tag-input').focus(), 100);
    },

    closeEditTagModal() {
        document.getElementById('edit-tag-modal').classList.remove('active');
    },

    saveTagEdit() {
        const type = this._editingTagType;
        const oldName = this._editingTagOldName;
        const newName = document.getElementById('edit-tag-input').value.trim();

        if (!newName) {
            this.showToast('名称不能为空', 'warning');
            return;
        }
        if (newName === oldName) {
            this.closeEditTagModal();
            return;
        }

        let success = false;
        if (type === 'project') {
            // 项目暂不支持改名（因为任务里存了项目名，需要同步）
            DataManager.deleteProject(oldName);
            DataManager.addProject(newName);
            success = true;
        } else if (type === 'group') {
            DataManager.updateGroup(oldName, newName);
            success = true;
        } else if (type === 'position') {
            DataManager.updatePosition(oldName, newName);
            success = true;
        }

        if (success) {
            this.refreshAdminLists();
            this.closeEditTagModal();
            this.showToast('修改成功', 'success');
        }
    },

    handleAddProject() {
        const input = document.getElementById('new-project-name');
        const name = input.value.trim();
        if (!name) {
            this.showToast('请输入项目名称', 'warning');
            return;
        }
        DataManager.addProject(name);
        input.value = '';
        this.renderProjectList();
        this.showToast('项目添加成功', 'success');
    },

    handleAddGroup() {
        const input = document.getElementById('new-group-name');
        const name = input.value.trim();
        if (!name) {
            this.showToast('请输入组别名称', 'warning');
            return;
        }
        const groups = DataManager.getGroups();
        if (groups.includes(name)) {
            this.showToast('该组别已存在', 'warning');
            return;
        }
        DataManager.addGroup(name);
        input.value = '';
        this.refreshAdminLists();
        this.showToast('组别添加成功', 'success');
    },

    handleAddPosition() {
        const input = document.getElementById('new-position-name');
        const name = input.value.trim();
        if (!name) {
            this.showToast('请输入岗位名称', 'warning');
            return;
        }
        const positions = DataManager.getPositions();
        if (positions.includes(name)) {
            this.showToast('该岗位已存在', 'warning');
            return;
        }
        DataManager.addPosition(name);
        input.value = '';
        this.refreshAdminLists();
        this.showToast('岗位添加成功', 'success');
    },

    renderAdminPersonList() {
        const users = DataManager.getUsers();
        const tbody = document.getElementById('admin-person-list');
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.group}</td>
                <td>${user.position}</td>
                <td><strong>${user.name}</strong></td>
                <td>${user.role === 'manager' ? '项目经理' : '普通员工'}</td>
                <td>
                    <button class="action-btn edit-person" data-id="${user.id}" style="background:#e8f0ff;color:#4f7cff;">编辑</button>
                    <button class="action-btn delete delete-person" data-id="${user.id}">删除</button>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.delete-person').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.id;
                const user = DataManager.getUserById(userId);
                if (confirm(`确定删除「${user.name}」吗？`)) {
                    DataManager.deleteUser(userId);
                    this.refreshAdminLists();
                    this.showToast('删除成功', 'success');
                }
            });
        });

        // 编辑按钮事件
        tbody.querySelectorAll('.edit-person').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.id;
                this.openEditPersonModal(userId);
            });
        });
    },

    // 打开人员编辑弹窗
    openEditPersonModal(userId) {
        const user = DataManager.getUserById(userId);
        if (!user) return;

        this._editingUserId = userId;

        // 填充下拉选项
        const groups = DataManager.getGroups();
        const positions = DataManager.getPositions();

        document.getElementById('edit-person-group').innerHTML =
            groups.map(g => `<option value="${g}" ${g === user.group ? 'selected' : ''}>${g}</option>`).join('');

        document.getElementById('edit-person-position').innerHTML =
            positions.map(p => `<option value="${p}" ${p === user.position ? 'selected' : ''}>${p}</option>`).join('');

        document.getElementById('edit-person-name').value = user.name;
        document.getElementById('edit-person-role').value = user.role;

        document.getElementById('edit-person-modal').classList.add('active');
    },

    closeEditPersonModal() {
        document.getElementById('edit-person-modal').classList.remove('active');
        this._editingUserId = null;
    },

    savePersonEdit() {
        const userId = this._editingUserId;
        if (!userId) return;

        const name = document.getElementById('edit-person-name').value.trim();
        const group = document.getElementById('edit-person-group').value;
        const position = document.getElementById('edit-person-position').value;
        const role = document.getElementById('edit-person-role').value;

        if (!name || !group || !position) {
            this.showToast('请填写完整信息', 'warning');
            return;
        }

        // 检查花名是否重复
        const existingUser = DataManager.findUserByName(name);
        if (existingUser && existingUser.id !== userId) {
            this.showToast('该花名已存在', 'warning');
            return;
        }

        DataManager.updateUser(userId, { name, group, position, role });
        this.refreshAdminLists();
        this.closeEditPersonModal();
        this.showToast('修改成功', 'success');
    },

    handleAddPerson() {
        const group = document.getElementById('new-person-group').value;
        const position = document.getElementById('new-person-position').value;
        const name = document.getElementById('new-person-name').value.trim();
        const role = document.getElementById('new-person-role').value;

        if (!group || !position || !name) {
            this.showToast('请填写完整信息', 'warning');
            return;
        }

        if (DataManager.findUserByName(name)) {
            this.showToast('该花名已存在', 'warning');
            return;
        }

        DataManager.addUser({ group, position, name, role });
        document.getElementById('new-person-name').value = '';
        this.refreshAdminLists();
        this.showToast('人员添加成功', 'success');
    },

    // ========== 数据导出导入 ==========
    handleExportData() {
        const data = DataManager.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `产能统计数据_${new Date().toLocaleDateString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('导出成功', 'success');
    },

    handleImportData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (confirm('导入将覆盖现有数据，确定继续吗？')) {
                    DataManager.importAllData(data);
                    this.renderProjectList();
                    this.renderAdminPersonList();
                    this.showToast('导入成功', 'success');
                }
            } catch (err) {
                this.showToast('文件格式错误', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    },

    handleResetData() {
        if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
            if (confirm('再次确认：所有人员、项目、任务数据将被重置为默认值！')) {
                DataManager.resetAllData();
                this.renderProjectList();
                this.renderAdminPersonList();
                this.showToast('数据已重置', 'success');
            }
        }
    },

    // ========== Excel 导入导出 ==========
    handleImportExcel(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                let users = [];
                let tasks = [];
                
                // 读取人员列表
                if (workbook.SheetNames.includes('人员列表')) {
                    const ws = workbook.Sheets['人员列表'];
                    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    // 从第5行开始（前4行是标题和说明）
                    for (let i = 4; i < rows.length; i++) {
                        const row = rows[i];
                        if (row[0]) { // 花名不为空
                            users.push({
                                id: 'user_' + Date.now() + '_' + i,
                                name: String(row[0]).trim(),
                                group: row[1] ? String(row[1]).trim() : '',
                                position: row[2] ? String(row[2]).trim() : '',
                                role: row[3] ? String(row[3]).trim() : 'employee'
                            });
                        }
                    }
                }
                
                // 读取任务提报
                if (workbook.SheetNames.includes('任务提报')) {
                    const ws = workbook.Sheets['任务提报'];
                    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    // 从第6行开始（前5行是标题和说明）
                    for (let i = 5; i < rows.length; i++) {
                        const row = rows[i];
                        if (row[0] && row[2]) { // 花名和项目不为空
                            const userName = String(row[0]).trim();
                            const weekKey = row[1] ? String(row[1]).trim() : DataManager.getCurrentWeekKey();
                            const project = String(row[2]).trim();
                            const taskType = row[3] ? String(row[3]).trim() : '设定';
                            const passedCount = parseInt(row[4]) || 0;
                            const inProgressCount = parseInt(row[5]) || 0;
                            const progress = parseInt(row[6]) || 0;
                            const unit = row[7] ? String(row[7]).trim() : '个';
                            
                            // 查找用户信息
                            const user = DataManager.getUserByName(userName);
                            tasks.push({
                                id: 'task_' + Date.now() + '_' + i,
                                userId: user ? user.id : 'unknown',
                                userName: userName,
                                userGroup: user ? user.group : '',
                                userPosition: user ? user.position : '',
                                project: project,
                                taskType: taskType,
                                unit: unit,
                                passedCount: passedCount,
                                inProgressCount: inProgressCount,
                                progress: progress,
                                weekKey: weekKey,
                                screenshots: [],
                                createdAt: new Date().toISOString()
                            });
                        }
                    }
                }
                
                if (users.length === 0 && tasks.length === 0) {
                    this.showToast('未读取到有效数据，请检查Excel格式', 'error');
                    return;
                }
                
                let msg = '';
                if (users.length > 0) msg += `人员：${users.length}人 `;
                if (tasks.length > 0) msg += `任务：${tasks.length}条`;
                
                if (confirm(`确认导入以下数据吗？\n${msg}\n\n导入将追加到现有数据中。`)) {
                    // 导入人员
                    users.forEach(u => {
                        // 检查是否已存在
                        const existing = DataManager.getUserByName(u.name);
                        if (!existing) {
                            DataManager.addUser(u);
                        }
                    });
                    // 导入任务
                    tasks.forEach(t => {
                        DataManager.addTask(t);
                    });
                    
                    this.renderAdminPersonList();
                    this.showToast(`导入成功！${msg}`, 'success');
                }
            } catch (err) {
                console.error('Excel导入失败:', err);
                this.showToast('导入失败：' + err.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = ''; // 重置input
    },

    handleExportExcel() {
        const wb = XLSX.utils.book_new();
        
        // 人员列表 sheet
        const users = DataManager.getUsers();
        const userData = [
            ['👥 人员列表', '', '', ''],
            ['花名', '组别', '岗位', '角色'],
            ...users.map(u => [u.name, u.group, u.position, u.role])
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(userData);
        ws1['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, ws1, '人员列表');
        
        // 任务提报 sheet
        const tasks = DataManager.getTasks();
        const taskData = [
            ['📋 任务提报', '', '', '', '', '', '', ''],
            ['花名', '周次', '项目', '任务类型', '已通过数量', '在制数量', '进度(%)', '单位'],
            ...tasks.map(t => [
                t.userName, t.weekKey, t.project, t.taskType,
                t.passedCount, t.inProgressCount, t.progress, t.unit
            ])
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(taskData);
        ws2['!cols'] = [
            { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
            { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 8 }
        ];
        XLSX.utils.book_append_sheet(wb, ws2, '任务提报');
        
        // 下载
        XLSX.writeFile(wb, `产能统计_${new Date().toLocaleDateString()}.xlsx`);
        this.showToast('导出成功', 'success');
    },

    // ========== 图片预览 ==========
    bindImagePreview(container) {
        container.querySelectorAll('.preview-trigger').forEach(img => {
            img.addEventListener('click', (e) => {
                this.openImageModal(e.target.src);
            });
        });
    },

    openImageModal(src) {
        document.getElementById('modal-image').src = src;
        document.getElementById('image-modal').classList.add('active');
    },

    closeImageModal() {
        document.getElementById('image-modal').classList.remove('active');
    },

    // ========== Toast 提示 ==========
    showToast(message, type = 'default') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        
        setTimeout(() => {
            toast.className = 'toast ' + type;
        }, 2500);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
