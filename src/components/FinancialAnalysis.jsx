import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useRisk } from '../context/RiskContext';
import { Landmark, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function FinancialAnalysis() {
  const { assets, calculateAssetRiskScore, calculateAssetEAL, calculateAssetFinancialImpact, darkMode } = useRisk();

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Compute EAL by Business Unit
  const buChartData = useMemo(() => {
    const data = {};
    assets.forEach(asset => {
      const eal = calculateAssetEAL(asset);
      data[asset.businessUnit] = (data[asset.businessUnit] || 0) + eal;
    });

    return Object.entries(data).map(([name, value]) => ({
      name,
      value: Math.round(value / 100000) // in Lakhs
    }));
  }, [assets, calculateAssetEAL]);

  // Compute total EAL by Category
  const categoryChartData = useMemo(() => {
    let downtime = 0;
    let dataExposure = 0;
    let regulatory = 0;
    let recovery = 0;
    let reputation = 0;

    assets.forEach(a => {
      const riskScore = calculateAssetRiskScore(a);
      const probability = 0.01 + (riskScore - 10) * (0.34 / 90);

      downtime += (a.downtimeCostPerHour * 4) * probability;
      dataExposure += (a.recordsExposed * a.costPerRecord) * probability;
      regulatory += a.regulatoryPenalty * probability;
      recovery += a.recoveryCost * probability;
      reputation += a.reputationFactor * probability;
    });

    return [
      { name: 'Downtime (Availability)', value: Math.round(downtime / 100000) },
      { name: 'Data Exposure (Breach)', value: Math.round(dataExposure / 100000) },
      { name: 'Regulatory Penalties', value: Math.round(regulatory / 100000) },
      { name: 'Recovery / Response', value: Math.round(recovery / 100000) },
      { name: 'Reputation Loss', value: Math.round(reputation / 100000) }
    ];
  }, [assets, calculateAssetRiskScore]);

  // ECharts Configurations
  const buOption = useMemo(() => ({
    title: {
      text: 'Expected Annual Loss (EAL) by Business Unit',
      left: 'center',
      textStyle: {
        color: darkMode ? '#fafafa' : '#09090b',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: <b>₹{c} Lakh</b> ({d}%)'
    },
    series: [
      {
        name: 'Business Unit EAL',
        type: 'pie',
        radius: ['35%', '60%'],
        center: ['50%', '60%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: darkMode ? '#0c0c0f' : '#ffffff',
          borderWidth: 2
        },
        label: {
          show: true,
          color: darkMode ? '#fafafa' : '#09090b'
        },
        data: buChartData
      }
    ]
  }), [buChartData, darkMode]);

  const catOption = useMemo(() => ({
    title: {
      text: 'Expected Annual Loss (EAL) by Impact Category',
      left: 'center',
      textStyle: {
        color: darkMode ? '#fafafa' : '#09090b',
        fontSize: 14,
        fontFamily: 'Inter, sans-serif'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      top: 50,
      bottom: 30,
      left: 120,
      right: 20
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: darkMode ? '#71717a' : '#52525b',
        formatter: '₹{value}L'
      },
      splitLine: {
        lineStyle: {
          color: darkMode ? '#1e1e24' : '#e4e4e7'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: categoryChartData.map(c => c.name),
      axisLabel: {
        color: darkMode ? '#fafafa' : '#09090b'
      }
    },
    series: [
      {
        data: categoryChartData.map(c => c.value),
        type: 'bar',
        itemStyle: {
          color: '#10b981',
          borderRadius: [0, 4, 4, 0]
        }
      }
    ]
  }), [categoryChartData, darkMode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">Financial Risk Analysis</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Quantify financial liabilities and expected annual losses in currency terms (₹).
          </p>
        </div>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme h-[340px]">
          <ReactECharts option={buOption} style={{ height: '100%', width: '100%' }} />
        </div>
        <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme h-[340px]">
          <ReactECharts option={catOption} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>

      {/* Detail EAL Worksheet table */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden transition-theme">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-blue-500" /> Expected Annual Loss (EAL) Ledger
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                <th className="p-4">Asset</th>
                <th className="p-4">Risk score</th>
                <th className="p-4 text-center">Annual Probability</th>
                <th className="p-4 text-right">Potential Loss Impact</th>
                <th className="p-4 text-right">Expected Annual Loss (EAL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 font-medium">
              {assets.map(asset => {
                const risk = calculateAssetRiskScore(asset);
                const probability = 0.01 + (risk - 10) * (0.34 / 90);
                const impact = calculateAssetFinancialImpact(asset);
                const eal = calculateAssetEAL(asset);
                return (
                  <tr key={asset.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{asset.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{asset.id} • {asset.businessUnit}</div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">{risk}/100</td>
                    <td className="p-4 text-center font-mono text-xs">{(probability * 100).toFixed(1)}%</td>
                    <td className="p-4 text-right font-mono text-xs">{formatCurrency(impact)}</td>
                    <td className="p-4 text-right font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(eal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
