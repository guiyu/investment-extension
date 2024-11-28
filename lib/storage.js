class StorageManager {
    constructor() {
        this.cache = new Map();
        this.CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时的毫秒数
    }

    /**
     * 保存数据到Chrome存储
     * @param {string} key - 存储键
     * @param {any} data - 要存储的数据
     * @param {boolean} useSync - 是否使用同步存储
     * @returns {Promise<void>}
     */
    async saveData(key, data, useSync = false) {
        try {
            const storage = useSync ? chrome.storage.sync : chrome.storage.local;
            const storageData = {
                data,
                timestamp: Date.now()
            };
            
            await storage.set({ [key]: storageData });
            this.cache.set(key, storageData);
        } catch (error) {
            console.error('Error saving data:', error);
            throw error;
        }
    }

    /**
     * 从Chrome存储读取数据
     * @param {string} key - 存储键
     * @param {boolean} useSync - 是否使用同步存储
     * @returns {Promise<any>}
     */
    async getData(key, useSync = false) {
        try {
            // 首先检查缓存
            const cachedData = this.cache.get(key);
            if (cachedData && !this.isCacheExpired(cachedData.timestamp)) {
                return cachedData.data;
            }

            const storage = useSync ? chrome.storage.sync : chrome.storage.local;
            const result = await storage.get(key);
            
            if (result[key]) {
                this.cache.set(key, result[key]);
                return result[key].data;
            }
            
            return null;
        } catch (error) {
            console.error('Error getting data:', error);
            throw error;
        }
    }

    /**
     * 删除存储的数据
     * @param {string} key - 存储键
     * @param {boolean} useSync - 是否使用同步存储
     * @returns {Promise<void>}
     */
    async removeData(key, useSync = false) {
        try {
            const storage = useSync ? chrome.storage.sync : chrome.storage.local;
            await storage.remove(key);
            this.cache.delete(key);
        } catch (error) {
            console.error('Error removing data:', error);
            throw error;
        }
    }

    /**
     * 清除所有存储的数据
     * @param {boolean} useSync - 是否使用同步存储
     * @returns {Promise<void>}
     */
    async clearAll(useSync = false) {
        try {
            const storage = useSync ? chrome.storage.sync : chrome.storage.local;
            await storage.clear();
            this.cache.clear();
        } catch (error) {
            console.error('Error clearing storage:', error);
            throw error;
        }
    }

    /**
     * 保存历史数据
     * @param {string} symbol - 股票代码
     * @param {Object} data - 历史数据
     * @returns {Promise<void>}
     */
    async saveHistoricalData(symbol, data) {
        const key = `historical_${symbol}`;
        await this.saveData(key, data);
    }

    /**
     * 获取历史数据
     * @param {string} symbol - 股票代码
     * @returns {Promise<Object>}
     */
    async getHistoricalData(symbol) {
        const key = `historical_${symbol}`;
        return await this.getData(key);
    }

    /**
     * 保存投资记录
     * @param {Object} record - 投资记录
     * @returns {Promise<void>}
     */
    async saveInvestmentRecord(record) {
        const records = await this.getInvestmentRecords() || [];
        records.push({
            ...record,
            timestamp: Date.now()
        });
        await this.saveData('investment_records', records, true);
    }

    /**
     * 获取所有投资记录
     * @returns {Promise<Array>}
     */
    async getInvestmentRecords() {
        return await this.getData('investment_records', true) || [];
    }

    /**
     * 保存再平衡记录
     * @param {Object} record - 再平衡记录
     * @returns {Promise<void>}
     */
    async saveRebalanceRecord(record) {
        const records = await this.getRebalanceRecords() || [];
        records.push({
            ...record,
            timestamp: Date.now()
        });
        await this.saveData('rebalance_records', records, true);
    }

    /**
     * 获取所有再平衡记录
     * @returns {Promise<Array>}
     */
    async getRebalanceRecords() {
        return await this.getData('rebalance_records', true) || [];
    }

    /**
     * 检查缓存是否过期
     * @param {number} timestamp - 时间戳
     * @returns {boolean}
     */
    isCacheExpired(timestamp) {
        return Date.now() - timestamp > this.CACHE_EXPIRY;
    }

    /**
     * 获取存储使用情况
     * @returns {Promise<Object>}
     */
    async getStorageUsage() {
        try {
            const local = await chrome.storage.local.getBytesInUse();
            const sync = await chrome.storage.sync.getBytesInUse();
            
            return {
                local: {
                    used: local,
                    total: chrome.storage.local.QUOTA_BYTES,
                    percentage: (local / chrome.storage.local.QUOTA_BYTES) * 100
                },
                sync: {
                    used: sync,
                    total: chrome.storage.sync.QUOTA_BYTES,
                    percentage: (sync / chrome.storage.sync.QUOTA_BYTES) * 100
                }
            };
        } catch (error) {
            console.error('Error getting storage usage:', error);
            throw error;
        }
    }

    /**
     * 清理过期的缓存数据
     * @returns {Promise<void>}
     */
    async cleanupExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache) {
            if (this.isCacheExpired(value.timestamp)) {
                this.cache.delete(key);
            }
        }
    }
}

export default new StorageManager();