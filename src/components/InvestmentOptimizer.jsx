import React, { useState, useMemo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { useRisk } from '../context/RiskContext';
import { Target, Lock, Unlock, TrendingUp } from 'lucide-react';

export default function InvestmentOptimizer() {
  const { org, controlsLibrary, solveOptimization, getActiveStats, darkMode } = useRisk();
  const [budgetInput, setBudgetInput] = useState(org.budget);
  const [lockedIn, setLockedIn] = useState([]);
  const [lockedOut, setLockedOut] = useState([]);

  useEffect(() => {
    setBudgetInput(org.budget);
  }, [org.budget]);

  // Calculate results on the fly based on budget input & overrides
  const result = useMemo(() => {
    return solveOptimization(budgetInput, lockedIn, lockedOut);
  }, [solveOptimization, budgetInput, lockedIn, lockedOut]);

  // Baseline stats to compare remaining EAL
  const baselineStats = useMemo(() => {
    return getActiveStats();
  }, [getActiveStats]);

  // Calculate dynamic data points for the Curve (FR-15)
  const chartOptions = useMemo(() => {
    const isDark = darkMode;
    const points = [];
    const totalCostOfAllControls = controlsLibrary.reduce((sum, c) => sum + c.cost, 0);
    
    // Generate 12 budget steps from 0 to totalCostOfAllControls
    const steps = [];
    const numSteps = 12;
    for (let i = 0; i <= numSteps; i++) {
      steps.push(Math.round((totalCostOfAllControls / numSteps) * i));
    }
    
    steps.forEach(b => {
      const res = solveOptimization(b, lockedIn, lockedOut);
      const remainingEal = Math.max(0, baselineStats.eal - res.totalReduction);
      points.push({
        budget: b / 100000, // Lakhs
        eal: remainingEal / 100000 // Lakhs
      });
    });

    // Determine the optimal zone based on the current budget input
    const currentBudgetLakh = budgetInput / 100000;
    const optimalZoneStart = Math.max(0, currentBudgetLakh - 10);
    const optimalZoneEnd = currentBudgetLakh + 10;

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const p = params[0].data;
          return `Investment: <b>₹${p[0].toFixed(1)} Lakh</b><br/>Remaining EAL: <b>₹${p[1].toFixed(1)} Lakh</b>`;
        },
        backgroundColor: isDark ? '#0c0c0f' : '#ffffff',
        borderColor: isDark ? '#1e1e24' : '#e4e4e7',
        textStyle: {
          color: isDark ? '#fafafa' : '#09090b',
          fontSize: 11,
          fontFamily: 'Inter, sans-serif'
        }
      },
      grid: {
        top: 20,
        bottom: 40,
        left: 55,
        right: 20
      },
      xAxis: {
        type: 'value',
        name: 'Investment (Lakh)',
        nameLocation: 'middle',
        nameGap: 25,
        splitLine: {
          lineStyle: {
            color: isDark ? '#1e1e24' : '#e4e4e7'
          }
        },
        axisLabel: {
          color: isDark ? '#71717a' : '#52525b',
          fontSize: 10,
          fontFamily: 'JetBrains Mono, monospace'
        },
        nameTextStyle: {
          color: isDark ? '#a1a1aa' : '#71717a',
          fontSize: 10,
          fontWeight: 'bold'
        }
      },
      yAxis: {
        type: 'value',
        name: 'Remaining EAL (Lakh)',
        nameLocation: 'middle',
        nameGap: 35,
        splitLine: {
          lineStyle: {
            color: isDark ? '#1e1e24' : '#e4e4e7'
          }
        },
        axisLabel: {
          color: isDark ? '#71717a' : '#52525b',
          fontSize: 10,
          fontFamily: 'JetBrains Mono, monospace'
        },
        nameTextStyle: {
          color: isDark ? '#a1a1aa' : '#71717a',
          fontSize: 10,
          fontWeight: 'bold'
        }
      },
      series: [
        {
          data: points.map(p => [p.budget, p.eal]),
          type: 'line',
          smooth: true,
          symbolSize: 6,
          lineStyle: {
            color: '#2563eb',
            width: 2.5
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
                { offset: 0, color: 'rgba(37, 99, 235, 0.25)' },
                { offset: 1, color: 'rgba(37, 99, 235, 0.0)' }
              ]
            }
          },
          markLine: {
            symbol: ['none', 'none'],
            label: {
              show: true,
              position: 'end',
              formatter: 'Current Budget',
              fontSize: 9,
              fontWeight: 'bold',
              color: '#d97706'
            },
            lineStyle: {
              color: '#d97706',
              type: 'dashed',
              width: 1.5
            },
            data: [
              { xAxis: budgetInput / 100000 }
            ]
          },
          markArea: {
            itemStyle: {
              color: isDark ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.06)'
            },
            label: {
              position: 'insideTopLeft',
              color: '#10b981',
              fontStyle: 'italic',
              fontSize: 9,
              fontWeight: 'bold',
              offset: [5, 5]
            },
            data: [
              [
                {
                  name: 'Optimal Spend Zone',
                  xAxis: Math.max(0, optimalZoneStart)
                },
                {
                  xAxis: optimalZoneEnd
                }
              ]
            ]
          }
        }
      ]
    };
  }, [solveOptimization, baselineStats, budgetInput, lockedIn, lockedOut, controlsLibrary, darkMode]);

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const toggleLockIn = (id) => {
    if (lockedIn.includes(id)) {
      setLockedIn(prev => prev.filter(x => x !== id));
    } else {
      setLockedIn(prev => [...prev, id]);
      setLockedOut(prev => prev.filter(x => x !== id)); // remove from lock-out
    }
  };

  const toggleLockOut = (id) => {
    if (lockedOut.includes(id)) {
      setLockedOut(prev => prev.filter(x => x !== id));
    } else {
      setLockedOut(prev => [...prev, id]);
      setLockedIn(prev => prev.filter(x => x !== id)); // remove from lock-in
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">Security Investment Optimizer</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Solve budget-constrained selection problems (Knapsack) to compute the combination of controls producing the greatest reduction in financial exposure.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Controls Overrides & Budget Input */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 transition-theme">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" /> Optimization Inputs
            </h2>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Available Budget (₹)</label>
              <input
                type="number"
                min="0"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-950 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={budgetInput}
                onChange={e => setBudgetInput(Number(e.target.value))}
              />
              <span className="text-[10px] text-zinc-400 font-medium">Active organization budget is set to: {formatCurrency(org.budget)}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0c0f] p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 transition-theme">
            <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Manual Overrides</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Force control selection in or out of the optimization loop. The dynamic programming solver will recompute around these restrictions.</p>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {controlsLibrary.map(ctrl => {
                const isLockedIn = lockedIn.includes(ctrl.id);
                const isLockedOut = lockedOut.includes(ctrl.id);
                return (
                  <div key={ctrl.id} className="border border-zinc-100 dark:border-zinc-800/80 p-3 rounded-lg text-xs flex flex-col gap-2 bg-zinc-50/50 dark:bg-zinc-900/30">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">{ctrl.name}</div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-400">
                      <span>Cost: {formatCurrency(ctrl.cost)}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => toggleLockIn(ctrl.id)}
                          className={`px-2 py-0.5 rounded flex items-center gap-0.5 font-bold cursor-pointer border ${
                            isLockedIn 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800' 
                              : 'bg-white dark:bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600'
                          }`}
                        >
                          <Lock className="w-2.5 h-2.5" /> Force In
                        </button>
                        <button
                          onClick={() => toggleLockOut(ctrl.id)}
                          className={`px-2 py-0.5 rounded flex items-center gap-0.5 font-bold cursor-pointer border ${
                            isLockedOut 
                              ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-800' 
                              : 'bg-white dark:bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-rose-500'
                          }`}
                        >
                          <Unlock className="w-2.5 h-2.5" /> Force Out
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right columns: Optimization Outputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#0c0c0f] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Recommended Cost</span>
                <div className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50 font-mono">{formatCurrency(result.totalCost)}</div>
                <span className={`text-[10px] font-bold ${result.totalCost <= budgetInput ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {result.totalCost <= budgetInput ? 'Within Budget Limit' : 'Budget Exceeded'}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0c0c0f] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">EAL Risk Reduction</span>
                <div className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50 font-mono">{formatCurrency(result.totalReduction)}</div>
                <span className="text-[10px] text-zinc-400 font-semibold">Annualized liability avoided</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0c0c0f] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Return on Investment (ROSI)</span>
                <div className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50 font-mono">{result.rosi}%</div>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5"><TrendingUp className="w-3.5 h-3.5" /> High Efficiency Portfolio</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden transition-theme">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Recommended Control Portfolio</h3>
            </div>

            {result.selection.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                      <th className="p-4">Control Metric</th>
                      <th className="p-4">Cost</th>
                      <th className="p-4 text-right">EAL Reduction Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                    {result.selection.map(ctrl => (
                      <tr key={ctrl.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="p-4">
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">{ctrl.name}</div>
                            <div className="text-[10px] text-zinc-400">{ctrl.description}</div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs">{formatCurrency(ctrl.cost)}</td>
                        <td className="p-4 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(ctrl.ealReduction)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-400 text-xs font-medium">
                No controls are recommended. Try increasing the available budget or adjusting overrides.
              </div>
            )}
          </div>

          {/* Investment vs Risk Reduction Curve Card */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 transition-theme">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Spend Optimization Curve (Live)
            </h3>
            <div className="h-72 w-full">
              <ReactECharts option={chartOptions} style={{ height: '100%', width: '100%' }} />
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
              This curve is generated dynamically by solving the knapsack budget optimization across different budget levels, incorporating your manual overrides (forced controls).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
