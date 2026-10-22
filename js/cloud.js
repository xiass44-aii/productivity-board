/**
 * Supabase 云端数据适配器
 * 当启用云端模式时，替代 localStorage 存储
 */

const CloudData = {
    // 检查是否启用云端模式
    isEnabled() {
        return window.CLOUD_CONFIG && 
               window.CLOUD_CONFIG.ENABLE_CLOUD === true &&
               window.CLOUD_CONFIG.SUPABASE_URL &&
               window.CLOUD_CONFIG.SUPABASE_KEY;
    },

    // 获取 Supabase 客户端实例（动态加载）
    async getClient() {
        if (this._client) return this._client;
        
        // 动态加载 Supabase JS SDK
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                const { createClient } = supabase;
                this._client = createClient(
                    window.CLOUD_CONFIG.SUPABASE_URL,
                    window.CLOUD_CONFIG.SUPABASE_KEY
                );
                resolve(this._client);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    // ========== 通用 CRUD ==========
    async selectAll(tableName) {
        const client = await this.getClient();
        const { data, error } = await client.from(tableName).select('*');
        if (error) throw error;
        return data || [];
    },

    async insert(tableName, record) {
        const client = await this.getClient();
        const { data, error } = await client.from(tableName).insert(record).select().single();
        if (error) throw error;
        return data;
    },

    async update(tableName, id, updates) {
        const client = await this.getClient();
        const { data, error } = await client.from(tableName).update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async delete(tableName, id) {
        const client = await this.getClient();
        const { error } = await client.from(tableName).delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    // ========== 批量更新（用于迁移数据） ==========
    async batchUpdate(tableName, records) {
        const client = await this.getClient();
        const { error } = await client.from(tableName).upsert(records);
        if (error) throw error;
        return true;
    }
};
