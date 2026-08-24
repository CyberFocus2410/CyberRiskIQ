import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useRisk } from '../context/RiskContext';
import { ShieldAlert, IndianRupee, Shield, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const { 
    org, 
    findings, 
    assets,
    getEnterpriseStats, 
    getActiveStats,
    solveOptimization,
    controlsLibrary,
    darkMode
  } = useRisk();

  // Fetch current (possibly simulated) stats and baseline active stats
  const simulatedStats = getEnterpriseStats();
  const baselineStats = getActiveStats();

  const formattedRevenue = (org.annualRevenue / 10000000).toFixed(1) + ' Cr';
  const formattedBudget = (org.budget / 100000).toFixed(1) + ' Lakh';

  // Format currency in Indian Rupees style
  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const topRisks = useMemo(() => {
    return [...findings]
      .filter(f => f.status === 'Open')
      .map(f => {
        const asset = assets.find(a => a.id === f.assetId);
        return {
          ...f,
          assetName: asset ? asset.name : 'Unknown Asset',
          assetCriticality: asset ? asset.criticality : 'Low'
        };
      })
      .sort((a, b) => b.cvss - a.cvss)
      .slice(0, 4);
  }, [findings, assets]);

  // Pre-calculate optimizer recommendations for quick dashboard access
  const optResult = useMemo(() => {
    return solveOptimization();
  }, [solveOptimization]);

  // ECharts: Investment vs Risk Reduction Curve
  const chartOptions = useMemo(() => {
    // Generate data points for the curve
    const points = [];
    const steps = [0, 500000, 1000000, 1500000, 2000000, 2500000, 3000000, 4000000, 5000000, 7500000];
    
    steps.forEach(b => {
      const res = solveOptimization(b);
      const remainingEal = Math.max(0, baselineStats.eal - res.totalReduction);
      points.push({
        budget: b / 100000, // in Lakhs
        eal: remainingEal / 100000 // in Lakhs
      });
    });

    return {
      title: {
        text: 'Expected Annual Loss (EAL) vs. Cumulative Security Investment',
        left: 'center',
        textStyle: {
          color: darkMode ? '#fafafa' : '#09090b',
          fontSize: 14,
          fontFamily: 'Inter, sans-serif'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const p = params[0].data;
          return `Investment: <b>₹${p[0].toFixed(1)} Lakh</b><br/>Remaining EAL: <b>₹${p[1].toFixed(1)} Lakh</b>`;
        },
        backgroundColor: darkMode ? '#0c0c0f' : '#ffffff',
        borderColor: darkMode ? '#1e1e24' : '#e4e4e7',
        textStyle: {
          color: darkMode ? '#fafafa' : '#09090b'
        }
      },
      grid: {
        top: 60,
        bottom: 50,
        left: 60,
        right: 40
      },
      xAxis: {
        type: 'value',
        name: 'Investment (Lakh)',
        nameLocation: 'middle',
        nameGap: 30,
        splitLine: {
          lineStyle: {
            color: darkMode ? '#1e1e24' : '#e4e4e7'
          }
        },
        axisLabel: {
          color: darkMode ? '#71717a' : '#52525b'
        }
      },
      yAxis: {
        type: 'value',
        name: 'Remaining EAL (Lakh)',
        nameLocation: 'middle',
        nameGap: 40,
        splitLine: {
          lineStyle: {
            color: darkMode ? '#1e1e24' : '#e4e4e7'
          }
        },
        axisLabel: {
          color: darkMode ? '#71717a' : '#52525b'
        }
      },
      series: [
        {
          data: points.map(p => [p.budget, p.eal]),
          type: 'line',
          smooth: true,
          symbolSize: 8,
          lineStyle: {
            color: '#2563eb',
            width: 3
          },
          itemStyle: {
            color: '#2563eb'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37, 99, 235, 0.3)' },
                { offset: 1, color: 'rgba(37, 99, 235, 0.0)' }
              ]
            }
          },
          markArea: {
            itemStyle: {
              color: 'rgba(16, 185, 129, 0.08)'
            },
            label: {
              position: 'inside',
              color: '#10b981',
              fontStyle: 'italic'
            },
            data: [
              [
                {
                  name: 'Optimal Zone (Diminishing Returns)',
                  xAxis: 15 // 15 Lakh
                },
                {
                  xAxis: 35 // 35 Lakh
                }
              ]
            ]
          }
        }
      ]
    };
  }, [baselineStats, darkMode, solveOptimization]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">Executive Risk Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time cyber risk exposure aggregated for organization: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{org.name}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5">
          <div>BU Count: <span className="text-blue-500">{org.businessUnits.length}</span></div>
          <div className="border-l border-zinc-200 dark:border-zinc-800 pl-2">Revenue: <span className="text-blue-500">{formattedRevenue}</span></div>
          <div className="border-l border-zinc-200 dark:border-zinc-800 pl-2">Budget: <span className="text-blue-500">{formattedBudget}</span></div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#0c0c0f] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Enterprise Exposure</span>
            <div className="text-2xl font-extrabold text-zinc-950 dark:text-zinc-50 font-mono">{formatCurrency(simulatedStats.exposure)}</div>
            <p className="text-xs text-zinc-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" /> Max impact if all systems breached
            </p>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0f] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Expected Annual Loss (EAL)</span>
            <div className="text-2xl font-extrabold text-zinc-950 dark:text-zinc-50 font-mono">{formatCurrency(simulatedStats.eal)}</div>
            <p className="text-xs text-zinc-400">
              {simulatedStats.eal < baselineStats.eal ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" /> -{((baselineStats.eal - simulatedStats.eal) / baselineStats.eal * 100).toFixed(1)}% simulated reduction
                </span>
              ) : (
                'Probabilistic annual liability'
              )}
            </p>
          </div>
          <div className="p-3 bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0f] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Enterprise Risk Score</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-zinc-950 dark:text-zinc-50 font-mono">{simulatedStats.riskScore}</span>
              <span className="text-xs text-zinc-400 font-mono">/100</span>
            </div>
            <p className="text-xs text-zinc-400">
              {simulatedStats.riskScore < baselineStats.riskScore ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" /> Improved from {baselineStats.riskScore}
                </span>
              ) : (
                'Continuous threat posture rating'
              )}
            </p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Charts & Details split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme flex flex-col justify-between">
          <div className="h-[300px] w-full">
            <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} />
          </div>
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4 flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
            <span>Optimal Zone recommendation suggests investment around <b>₹20L - ₹30L</b> for maximum efficacy.</span>
            <button 
              onClick={() => setActiveTab('optimizer')}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-semibold"
            >
              Analyze Options <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right col: Top risks */}
        <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-800 pb-2">Top Security Findings</h2>
            <div className="space-y-3.5">
              {topRisks.map((f, i) => (
                <div key={i} className="flex justify-between items-start gap-3 text-xs border-b border-zinc-100 dark:border-zinc-800 pb-2.5 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 hover:underline cursor-pointer" onClick={() => setActiveTab('findings')}>
                      {f.vulnerability}
                    </span>
                    <div className="flex gap-2 text-[10px] text-zinc-400">
                      <span>{f.assetName}</span>
                      <span>•</span>
                      <span className={f.source.includes('Strix') ? 'text-purple-500 font-semibold' : 'text-zinc-500'}>
                        {f.source}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold font-mono ${
                    f.cvss >= 9.0 ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                    f.cvss >= 7.0 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
                  }`}>
                    {f.cvss.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('findings')}
            className="w-full text-center py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg text-xs font-semibold mt-4 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            View All Findings
          </button>
        </div>
      </div>

      {/* Recommendations Banner */}
      <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-theme">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 mb-3.5">CISO Actionable Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Top Priority Mitigate</span>
            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Patch BOLA in Payment API</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Strix AI Pentest validated an active exploit chain on checkout services. Remediate inside 48 hours.</p>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Optimal Security ROI</span>
            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Enforce Multi-Factor Auth</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Optimizing budget yields a <b>{optResult.rosi}% ROSI</b>. Prevents administrative credential breaches.</p>
          </div>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Asset Criticality Gap</span>
            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Encrypt Transaction Database</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Database server holds high sensitivity customer records. Exposure penalty is estimated at <b>₹1.2 Crore</b>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
