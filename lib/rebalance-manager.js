// 再平衡周期枚举
export const RebalancePeriod = {
    MONTHLY: 'MONTHLY',
    QUARTERLY: 'QUARTERLY',
    SEMIANNUAL: 'SEMIANNUAL',
    ANNUAL: 'ANNUAL'
};

class RebalanceManager {
    constructor(config = {}) {
        this.threshold = config.threshold || 0.05; // 5%
        this.minTradeAmount = config.minTradeAmount || 1000;
        this.period = config.period || RebalancePeriod.QUARTERLY;
        this.targetAllocations = {};
        this.currentHoldings = {};
        this.rebalanceHistory = [];
        this.lastRebalanceDate = null;
    }

    /**
     * 设置目标资产配置
     * @param {Object} allocations - 目标配置
     */
    setTargetAllocations(allocations) {
        this.targetAllocations = {...allocations};
    }

    /**
     * 更新当前持仓
     * @param {Object} holdings - 当前持仓
     */
    updateCurrentHoldings(holdings) {
        this.currentHoldings = {...holdings};
    }

    /**
     * 设置再平衡周期
     * @param {string} period - 再平衡周期
     */
    setRebalancePeriod(period) {
        if (!Object.values(RebalancePeriod).includes(period)) {
            throw new Error('Invalid rebalance period');
        }
        this.period = period;
    }

    /**
     * 检查是否需要再平衡
     * @param {Date} currentDate - 当前日期
     * @returns {boolean} - 是否需要再平衡
     */
    needsRebalance(currentDate) {
        // 检查是否达到再平衡周期
        if (!this.isRebalanceDue(currentDate)) {
            return false;
        }

        // 计算当前配置偏差
        const currentAllocations = this.calculateCurrentAllocations();
        const maxDeviation = this.calculateMaxDeviation(currentAllocations);

        return maxDeviation > this.threshold;
    }

    /**
     * 执行再平衡
     * @param {Date} date - 执行日期
     * @param {Object} prices - 当前价格
     * @returns {Object} - 再平衡结果
     */
    executeRebalance(date, prices) {
        try {
            if (!this.needsRebalance(date)) {
                return {
                    status: 'skipped',
                    date: date,
                    reason: 'Rebalance not needed'
                };
            }

            // 计算目标持仓和交易
            const currentValue = this.calculatePortfolioValue(prices);
            const trades = this.calculateRequiredTrades(currentValue, prices);

            // 验证最小交易金额
            if (!this.validateMinimumTrades(trades, prices)) {
                return {
                    status: 'skipped',
                    date: date,
                    reason: 'Trade amounts below minimum'
                };
            }

            // 执行交易
            this.updateHoldings(trades);
            this.lastRebalanceDate = date;

            // 记录再平衡历史
            const result = {
                status: 'success',
                date: date,
                trades: {
                    shares: trades,
                    amounts: this.calculateTradeAmounts(trades, prices)
                }
            };
            this.rebalanceHistory.push(result);

            return result;
        } catch (error) {
            console.error('Error during rebalance:', error);
            return {
                status: 'error',
                date: date,
                error: error.message
            };
        }
    }

    /**
     * 计算当前资产配置比例
     * @returns {Object} - 当前配置比例
     */
    calculateCurrentAllocations() {
        const allocations = {};
        const total = Object.values(this.currentHoldings).reduce((sum, val) => sum + val, 0);

        if (total === 0) return this.targetAllocations;

        for (const [asset, amount] of Object.entries(this.currentHoldings)) {
            allocations[asset] = amount / total;
        }

        return allocations;
    }

    /**
     * 计算最大配置偏差
     * @param {Object} currentAllocations - 当前配置
     * @returns {number} - 最大偏差
     */
    calculateMaxDeviation(currentAllocations) {
        let maxDeviation = 0;

        for (const [asset, targetWeight] of Object.entries(this.targetAllocations)) {
            const currentWeight = currentAllocations[asset] || 0;
            const deviation = Math.abs(currentWeight - targetWeight);
            maxDeviation = Math.max(maxDeviation, deviation);
        }

        return maxDeviation;
    }

    /**
     * 计算所需交易
     * @param {number} totalValue - 组合总值
     * @param {Object} prices - 当前价格
     * @returns {Object} - 交易清单
     */
    calculateRequiredTrades(totalValue, prices) {
        const trades = {};
        const targetValues = {};

        // 计算目标市值
        for (const [asset, weight] of Object.entries(this.targetAllocations)) {
            targetValues[asset] = totalValue * weight;
        }

        // 计算需要的交易
        for (const [asset, targetValue] of Object.entries(targetValues)) {
            const currentValue = (this.currentHoldings[asset] || 0) * prices[asset];
            const valueDiff = targetValue - currentValue;
            trades[asset] = Math.round(valueDiff / prices[asset]);
        }

        return trades;
    }

    /**
     * 验证最小交易金额
     * @param {Object} trades - 交易清单
     * @param {Object} prices - 当前价格
     * @returns {boolean} - 是否满足最小交易金额
/**
     * 验证最小交易金额
     * @param {Object} trades - 交易清单
     * @param {Object} prices - 当前价格
     * @returns {boolean} - 是否满足最小交易金额
     */
validateMinimumTrades(trades, prices) {
    for (const [asset, shares] of Object.entries(trades)) {
        const tradeAmount = Math.abs(shares * prices[asset]);
        if (tradeAmount > 0 && tradeAmount < this.minTradeAmount) {
            return false;
        }
    }
    return true;
}

/**
 * 计算交易金额
 * @param {Object} trades - 交易清单
 * @param {Object} prices - 当前价格
 * @returns {Object} - 交易金额
 */
calculateTradeAmounts(trades, prices) {
    const amounts = {};
    for (const [asset, shares] of Object.entries(trades)) {
        amounts[asset] = shares * prices[asset];
    }
    return amounts;
}

/**
 * 更新持仓
 * @param {Object} trades - 交易清单
 */
updateHoldings(trades) {
    for (const [asset, shares] of Object.entries(trades)) {
        this.currentHoldings[asset] = (this.currentHoldings[asset] || 0) + shares;
    }
}

/**
 * 计算投资组合总值
 * @param {Object} prices - 当前价格
 * @returns {number} - 组合总值
 */
calculatePortfolioValue(prices) {
    let totalValue = 0;
    for (const [asset, shares] of Object.entries(this.currentHoldings)) {
        totalValue += shares * prices[asset];
    }
    return totalValue;
}

/**
 * 检查是否到达再平衡时间
 * @param {Date} currentDate - 当前日期
 * @returns {boolean} - 是否应该再平衡
 */
isRebalanceDue(currentDate) {
    if (!this.lastRebalanceDate) {
        return true;
    }

    const lastDate = new Date(this.lastRebalanceDate);
    const monthsDiff = (currentDate.getFullYear() - lastDate.getFullYear()) * 12 
        + currentDate.getMonth() - lastDate.getMonth();

    switch (this.period) {
        case RebalancePeriod.MONTHLY:
            return monthsDiff >= 1;
        case RebalancePeriod.QUARTERLY:
            return monthsDiff >= 3;
        case RebalancePeriod.SEMIANNUAL:
            return monthsDiff >= 6;
        case RebalancePeriod.ANNUAL:
            return monthsDiff >= 12;
        default:
            return false;
    }
}

/**
 * 生成再平衡报告
 * @param {Object} result - 再平衡结果
 * @returns {string} - 格式化的报告
 */
generateRebalanceReport(result) {
    if (result.status !== 'success') {
        return `再平衡状态: ${result.status}\n原因: ${result.reason || result.error}`;
    }

    let report = `再平衡执行日期: ${result.date.toLocaleDateString()}\n\n`;
    report += '交易详情:\n';
    
    for (const [asset, shares] of Object.entries(result.trades.shares)) {
        if (shares !== 0) {
            const amount = result.trades.amounts[asset];
            const action = shares > 0 ? '买入' : '卖出';
            report += `${asset}: ${action} ${Math.abs(shares)} 股，金额 $${Math.abs(amount).toFixed(2)}\n`;
        }
    }

    report += '\n当前持仓:\n';
    for (const [asset, shares] of Object.entries(this.currentHoldings)) {
        report += `${asset}: ${shares} 股\n`;
    }

    return report;
}

/**
 * 获取再平衡历史
 * @returns {Array} - 再平衡历史记录
 */
getRebalanceHistory() {
    return this.rebalanceHistory;
}

/**
 * 获取性能指标
 * @returns {Object} - 性能统计数据
 */
getPerformanceMetrics() {
    const successfulRebalances = this.rebalanceHistory.filter(r => r.status === 'success');
    const totalTrades = successfulRebalances.reduce((sum, r) => {
        return sum + Object.keys(r.trades.shares).filter(a => r.trades.shares[a] !== 0).length;
    }, 0);

    return {
        rebalanceCount: this.rebalanceHistory.length,
        successfulRebalances: successfulRebalances.length,
        totalTrades: totalTrades,
        averageTradesPerRebalance: totalTrades / (successfulRebalances.length || 1)
    };
}

/**
 * 获取下一次再平衡日期
 * @param {Date} currentDate - 当前日期
 * @returns {Date} - 下一次再平衡日期
 */
getNextRebalanceDate(currentDate) {
    if (!this.lastRebalanceDate) {
        return currentDate;
    }

    const nextDate = new Date(this.lastRebalanceDate);
    switch (this.period) {
        case RebalancePeriod.MONTHLY:
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case RebalancePeriod.QUARTERLY:
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
        case RebalancePeriod.SEMIANNUAL:
            nextDate.setMonth(nextDate.getMonth() + 6);
            break;
        case RebalancePeriod.ANNUAL:
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }
    return nextDate;
}
}

export default RebalanceManager;