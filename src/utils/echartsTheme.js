// src/utils/echartsTheme.js
// CyberRiskIQ Enterprise Tactical ECharts Theme Configuration
import * as echarts from 'echarts/core';

export const CYBERRISKIQ_DARK_THEME = {
  color: [
    '#00F0FF', // Signal Cyan
    '#6366F1', // Indigo
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Rose / Critical
    '#8B5CF6', // Purple
    '#3B82F6'  // Blue
  ],
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, -apple-system, sans-serif',
    color: '#94A3B8'
  },
  title: {
    textStyle: {
      fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
      fontWeight: 700,
      color: '#F8FAFC'
    },
    subtextStyle: {
      color: '#64748B'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '12%',
    containLabel: true,
    borderColor: '#1C2333',
    show: false
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: { color: '#26324B' }
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      color: '#94A3B8',
      fontSize: 11,
      fontFamily: 'Inter, sans-serif'
    },
    splitLine: {
      show: false
    }
  },
  valueAxis: {
    axisLine: {
      show: false
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      color: '#64748B',
      fontSize: 11,
      fontFamily: '"JetBrains Mono", monospace'
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#161B26',
        type: 'dashed'
      }
    }
  },
  tooltip: {
    backgroundColor: '#0D1117',
    borderColor: '#26324B',
    borderWidth: 1,
    padding: [10, 14],
    textStyle: {
      color: '#F8FAFC',
      fontSize: 12,
      fontFamily: '"JetBrains Mono", monospace'
    },
    extraCssText: 'box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.7); border-radius: 8px;'
  },
  legend: {
    textStyle: {
      color: '#94A3B8',
      fontSize: 11
    }
  }
};

export const CYBERRISKIQ_LIGHT_THEME = {
  color: [
    '#0284C7', // Ocean Blue
    '#4F46E5', // Indigo
    '#059669', // Emerald
    '#D97706', // Amber
    '#DC2626', // Rose
    '#7C3AED', // Violet
    '#2563EB'  // Blue
  ],
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, -apple-system, sans-serif',
    color: '#64748B'
  },
  title: {
    textStyle: {
      fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
      fontWeight: 700,
      color: '#0F172A'
    },
    subtextStyle: {
      color: '#94A3B8'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '12%',
    containLabel: true,
    borderColor: '#E2E8F0',
    show: false
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: { color: '#CBD5E1' }
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      color: '#64748B',
      fontSize: 11,
      fontFamily: 'Inter, sans-serif'
    },
    splitLine: {
      show: false
    }
  },
  valueAxis: {
    axisLine: {
      show: false
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      color: '#94A3B8',
      fontSize: 11,
      fontFamily: '"JetBrains Mono", monospace'
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#F1F5F9',
        type: 'dashed'
      }
    }
  },
  tooltip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    padding: [10, 14],
    textStyle: {
      color: '#0F172A',
      fontSize: 12,
      fontFamily: '"JetBrains Mono", monospace'
    },
    extraCssText: 'box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.1); border-radius: 8px;'
  },
  legend: {
    textStyle: {
      color: '#64748B',
      fontSize: 11
    }
  }
};

// Auto-register themes with global echarts
if (typeof echarts !== 'undefined' && echarts.registerTheme) {
  echarts.registerTheme('cyberriskiq-dark', CYBERRISKIQ_DARK_THEME);
  echarts.registerTheme('cyberriskiq-light', CYBERRISKIQ_LIGHT_THEME);
}

export function getChartBaseOption(darkMode = true) {
  return darkMode ? CYBERRISKIQ_DARK_THEME : CYBERRISKIQ_LIGHT_THEME;
}
