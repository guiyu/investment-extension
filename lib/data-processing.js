class InvestmentCalculator {
    constructor(config) {
        this.config = {
            baseInvestment: config.baseInvestment || 1000,
            smaWindow: config.smaWindow || 200,
            stdWindow: config.stdWindow || 30,
            minWeight: config.minWeight || 0.5,
            maxWeight: config.maxWeight || 2
        };
    }

    /**
     * 获取投资日期列表
     * @param {Date} startDate - 开始日期
     * @param {Date} endDate - 结束日期
     * @returns {Array<Date>} - 投资日期列表
     */
    getInvestmentDates(startDate, endDate) {
        const dates = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            // 获取当月第二个周三
            const secondWednesday = this.getSecondWednesday(currentDate);
            if (secondWednesday >= startDate && secondWednesday <= endDate) {
                dates.push(secondWednesday);
            }
            // 移动到下个月
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return dates;
    }

    /**
     * 获取给定月份的第二个周三
     * @param {Date} date - 日期
     * @returns {Date} - 第二个周三的日期
     */
    getSecondWednesday(date) {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const firstWednesday = new Date(firstDay);
        firstWednesday.setDate(firstDay.getDate() + ((3 + 7 - firstDay.getDay()) % 7));
        const secondWednesday = new Date(firstWednesday);
        secondWednesday.setDate(firstWednesday.getDate() + 7);
        return secondWednesday;
    }

    /**
     * 计算投资权重
     * @param {number} price - 当前价格
     * @param {number} sma - 移动平均价格
     * @param {number} std - 标准差
     * @param {number} avgStd - 平均标准差
     * @returns {number} - 投资权重
     */
    calculateWeight(price, sma, std, avgStd) {
        const n = 1 + (std / avgStd);
        const weight = Math.pow(sma / price, n);
        return Math.max(
            Math.min(weight, this.config.maxWeight),
            this.config.minWeight
        );
    }

    /**
     * 计算投资金额和份额
     * @param {number} price - 当前价格
     * @param {number} weight - 权重
     * @returns {Object} - 投资金额和份额
     */
    calculateInvestment(price, weight) {
        const investmentAmount = this.config.baseInvestment * weight;
        const shares = Math.floor(investmentAmount / price);
        const actualInvestment = shares * price;
        
        return {
            amount: actualInvestment,
            shares: shares
        };
    }

    /**
     * 计算累计收益
     * @param {Array} trades - 交易记录
     * @param {number} currentPrice - 当前价格
     * @returns {Object} - 收益统计
     */
    calculateReturns(trades, currentPrice) {
        const totalInvestment = trades.reduce((sum, trade) => sum + trade.amount, 0);
        const totalShares = trades.reduce((sum, trade) => sum + trade.shares, 0);
        const currentValue = totalShares * currentPrice;
        const totalReturn = currentValue - totalInvestment;
        const returnRate = (totalReturn / totalInvestment) * 100;

        return {
            totalInvestment,
            totalShares,
            currentValue,
            totalReturn,
            returnRate
        };
    }

    /**
     * 计算年化收益率
     * @param {number} totalReturn - 总收益
     * @param {number} totalInvestment - 总投资
     * @param {number} days - 投资天数
     * @returns {number} - 年化收益率
     */
    calculateAnnualizedReturn(totalReturn, totalInvestment, days) {
        const returnRate = totalReturn / totalInvestment;
        return (Math.pow(1 + returnRate, 365.25 / days) - 1) * 100;
    }
}

export default InvestmentCalculator;