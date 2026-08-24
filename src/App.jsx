import React, { useState, useEffect } from 'react';
import { useRisk } from './context/RiskContext';
import { 
  LayoutDashboard, 
  Building2, 
  Table, 
  AlertTriangle, 
  Activity, 
  LineChart, 
  MessageSquareCode, 
  Sparkles, 
  Target, 
  Award,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';

// Import Views
import LoginSetup from './components/LoginSetup';
import Dashboard from './components/Dashboard';
import AssetInventory from './components/AssetInventory';
import Findings from './components/Findings';
import RiskQuantification from './components/RiskQuantification';
import FinancialAnalysis from './components/FinancialAnalysis';
import AnalystChat from './components/AnalystChat';
import ScenarioSimulator from './components/ScenarioSimulator';
import InvestmentOptimizer from './components/InvestmentOptimizer';
import ComplianceReports from './components/ComplianceReports';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);

  // Apply dark mode styling class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const navItems = [
    { id: 'setup', label: '1. Org Setup', icon: Building2 },
    { id: 'dashboard', label: '2. Executive Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: '3. Asset Inventory', icon: Table },
    { id: 'findings', label: '4. Security Findings', icon: AlertTriangle },
    { id: 'quantification', label: '5. Risk Quantification', icon: Activity },
    { id: 'financial', label: '6. Financial Analysis', icon: LineChart },
    { id: 'chat', label: '7. AI Risk Analyst', icon: MessageSquareCode },
    { id: 'simulator', label: '8. Scenario Simulator', icon: Sparkles },
    { id: 'optimizer', label: '9. Investment Optimizer', icon: Target },
    { id: 'reports', label: '10. Compliance & Reports', icon: Award }
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'setup': return <LoginSetup />;
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'assets': return <AssetInventory />;
      case 'findings': return <Findings />;
      case 'quantification': return <RiskQuantification />;
      case 'financial': return <FinancialAnalysis />;
      case 'chat': return <AnalystChat />;
      case 'simulator': return <ScenarioSimulator />;
      case 'optimizer': return <InvestmentOptimizer />;
      case 'reports': return <ComplianceReports />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors flex">
      {/* Sidebar - hidden in print mode */}
      <aside className="w-64 bg-white dark:bg-[#0c0c0f] border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between flex-shrink-0 transition-theme print:hidden">
        <div className="p-5 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-zinc-950 dark:text-zinc-50 block">CyberRiskIQ</span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">SIH MVP V1.0</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-tight transition-all text-left cursor-pointer ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold border-l-4 border-blue-500 rounded-l-none' 
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900/30 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 font-medium space-y-1 font-mono">
          <div>Status: <span className="text-emerald-500 font-bold">ONLINE</span></div>
          <div>Telemetry: Continuous</div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - hidden in print mode */}
        <header className="h-16 bg-white dark:bg-[#0c0c0f] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 flex-shrink-0 transition-theme print:hidden">
          <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider font-mono">
            Node status: Active & Verified
          </div>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>
        </header>

        {/* Content View Container */}
        <main className="flex-1 p-8 overflow-y-auto print:p-0 print:overflow-visible">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
