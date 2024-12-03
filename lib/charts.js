
class InvestmentCharts {
    constructor() {
        this.charts = new Map();
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        };
    }

    createPortfolioValueChart(ctx, data) {
        const config = {
            type: 'line',
            data: {
                labels: data.dates,
                datasets: [
                    {
                        label: '投资组合价值',
                        data: data.portfolioValues,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: '成本基准',
                        data: data.costBasis,
                        borderColor: 'rgb(255, 99, 132)',
                        borderDash: [5, 5],
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '价值 ($)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '日期'
                        }
                    }
                }
            }
        };

        return this.createChart(ctx, 'portfolioValue', config);
    }

    createReturnComparisonChart(ctx, data) {
        const config = {
            type: 'line',
            data: {
                labels: data.dates,
                datasets: [
                    {
                        label: '实际收益',
                        data: data.actualReturns,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    },
                    {
                        label: '基准收益',
                        data: data.benchmarkReturns,
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: '收益率 (%)'
                        }
                    }
                }
            }
        };

        return this.createChart(ctx, 'returnComparison', config);
    }

    createAssetAllocationChart(ctx, data) {
        const config = {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        'rgb(255, 99, 132)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 206, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(153, 102, 255)'
                    ]
                }]
            },
            options: {
                ...this.defaultOptions,
                cutout: '50%',
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        };

        return this.createChart(ctx, 'assetAllocation', config);
    }

    createTechnicalIndicatorChart(ctx, data) {
        const config = {
            type: 'line',
            data: {
                labels: data.dates,
                datasets: [
                    {
                        label: '价格',
                        data: data.prices,
                        borderColor: 'rgb(75, 192, 192)',
                        yAxisID: 'y'
                    },
                    {
                        label: 'SMA 200',
                        data: data.sma200,
                        borderColor: 'rgb(255, 99, 132)',
                        yAxisID: 'y'
                    },
                    {
                        label: 'MACD',
                        data: data.macd,
                        borderColor: 'rgb(54, 162, 235)',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '价格'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'MACD'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        };

        return this.createChart(ctx, 'technicalIndicator', config);
    }

    createRebalanceHistoryChart(ctx, data) {
        const config = {
            type: 'bar',
            data: {
                labels: data.dates,
                datasets: [
                    {
                        label: '再平衡金额',
                        data: data.amounts,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgb(75, 192, 192)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '金额 ($)'
                        }
                    }
                }
            }
        };

        return this.createChart(ctx, 'rebalanceHistory', config);
    }

    createChart(ctx, id, config) {
        // 如果已存在，则销毁旧图表
        if (this.charts.has(id)) {
            this.charts.get(id).destroy();
        }

        const chart = new Chart(ctx, config);
        this.charts.set(id, chart);
        return chart;
    }

    updateChart(id, newData) {
        const chart = this.charts.get(id);
        if (!chart) return;

        chart.data = newData;
        chart.update();
    }

    destroyChart(id) {
        const chart = this.charts.get(id);
        if (chart) {
            chart.destroy();
            this.charts.delete(id);
        }
    }

    destroyAllCharts() {
        for (const [id, chart] of this.charts) {
            chart.destroy();
        }
        this.charts.clear();
    }
}

export default InvestmentCharts;