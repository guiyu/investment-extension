class ConfigManager {
    constructor() {
        this.defaultConfig = {
            tickers: ['SPY', 'QQQ', 'IWM', 'DIA', 'VTI'],
            baseInvestment: 1000,
            smaWindow: 200,
            stdWindow: 30,
            minWeight: 0.5,
            maxWeight: 2,
            rebalanceEnabled: false,
            rebalancePeriod: 'QUARTERLY',
            rebalanceThreshold: 5,
            minTradeAmount: 1000,
            notifications: {
                enabled: true,
                marketOpen: true,
                investmentDue: true,
                rebalanceNeeded: true,
                priceAlerts: true
            },
            theme: 'light',
            language: 'zh'
        };
    }

    /**
     * 加载配置
     * @returns {Promise<Object>} 配置对象
     */
    async loadConfig() {
        try {
            const result = await chrome.storage.sync.get('config');
            return result.config || this.defaultConfig;
        } catch (error) {
            console.error('Error loading config:', error);
            return this.defaultConfig;
        }
    }

    /**
     * 保存配置
     * @param {Object} config 新配置
     * @returns {Promise<void>}
     */
    async saveConfig(config) {
        try {
            // 合并新配置和默认配置，确保所有必要字段都存在
            const newConfig = {
                ...this.defaultConfig,
                ...config
            };
            await chrome.storage.sync.set({ config: newConfig });
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            throw error;
        }
    }

    /**
     * 更新部分配置
     * @param {Object} updates 要更新的配置项
     * @returns {Promise<void>}
     */
    async updateConfig(updates) {
        try {
            const currentConfig = await this.loadConfig();
            const newConfig = {
                ...currentConfig,
                ...updates
            };
            await this.saveConfig(newConfig);
            return true;
        } catch (error) {
            console.error('Error updating config:', error);
            throw error;
        }
    }

    /**
     * 重置配置到默认值
     * @returns {Promise<void>}
     */
    async resetConfig() {
        try {
            await this.saveConfig(this.defaultConfig);
            return true;
        } catch (error) {
            console.error('Error resetting config:', error);
            throw error;
        }
    }

    /**
     * 验证配置有效性
     * @param {Object} config 配置对象
     * @returns {boolean} 是否有效
     */
    validateConfig(config) {
        // 确保基础字段存在且类型正确
        if (!Array.isArray(config.tickers) || config.tickers.length === 0) {
            throw new Error('Tickers must be a non-empty array');
        }

        if (typeof config.baseInvestment !== 'number' || config.baseInvestment <= 0) {
            throw new Error('Base investment must be a positive number');
        }

        if (config.minWeight >= config.maxWeight) {
            throw new Error('Min weight must be less than max weight');
        }

        return true;
    }

    /**
     * 导出配置
     * @returns {Promise<Object>} 配置对象
     */
    async exportConfig() {
        const config = await this.loadConfig();
        const exported = {
            ...config,
            exportDate: new Date().toISOString()
        };
        
        // 创建配置文件下载
        const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        return {
            url,
            filename: `investment-config-${new Date().toISOString().split('T')[0]}.json`
        };
    }

    /**
     * 导入配置
     * @param {Object} importedConfig 导入的配置对象
     * @returns {Promise<void>}
     */
    async importConfig(importedConfig) {
        try {
            // 验证导入的配置
            if (this.validateConfig(importedConfig)) {
                // 移除exportDate字段
                const { exportDate, ...configToSave } = importedConfig;
                await this.saveConfig(configToSave);
                return true;
            }
        } catch (error) {
            console.error('Error importing config:', error);
            throw error;
        }
    }

    /**
     * 获取特定配置项
     * @param {string} key 配置项键名
     * @returns {Promise<any>} 配置项值
     */
    async getConfigItem(key) {
        const config = await this.loadConfig();
        return config[key];
    }

    /**
     * 设置特定配置项
     * @param {string} key 配置项键名
     * @param {any} value 配置项值
     * @returns {Promise<void>}
     */
    async setConfigItem(key, value) {
        const updates = { [key]: value };
        await this.updateConfig(updates);
    }
}

export default new ConfigManager();