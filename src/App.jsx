// src/App.jsx
import React, { useState, useEffect } from 'react';
import { useRisk } from './context/RiskContext';
import { 
  LayoutDashboard, 
  Settings, 
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
  ShieldCheck,
  Building2,
  Key
} from 'lucide-react';
import SecurityAssessmentControl from './components/SecurityAssessmentControl';

// Import Views
import Dashboard from './components/Dashboard';
import AssetInventory from './components/AssetInventory';
import Findings from './components/Findings';
import RiskQuantification from './components/RiskQuantification';
import FinancialAnalysis from './components/FinancialAnalysis';
import AnalystChat from './components/AnalystChat';
import ScenarioSimulator from './components/ScenarioSimulator';
import InvestmentOptimizer from './components/InvestmentOptimizer';
import ComplianceReports from './components/ComplianceReports';
import LandingPage from './components/LandingPage';
import CoverPage from './components/CoverPage';
import OnboardingWizard from './components/OnboardingWizard';
import SettingsView from './components/SettingsView';
import AuthModal from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewState, setViewState] = useState('cover'); // 'cover' | 'landing' | 'app'
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { darkMode, setDarkMode, org, tenantId } = useRisk();

  const isOnboarded = org?.onboarding_completed || org?.onboardingCompleted;

  // Apply dark mode styling class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const navItems = [
    { id: 'dashboard', label: '1. Executive Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: '2. Asset Inventory', icon: Table },
    { id: 'findings', label: '3. Security Findings', icon: AlertTriangle },
    { id: 'quantification', label: '4. Risk Quantification', icon: Activity },
    { id: 'financial', label: '5. Financial Analysis', icon: LineChart },
    { id: 'chat', label: '6. AI Risk Analyst', icon: MessageSquareCode },
    { id: 'simulator', label: '7. Scenario Simulator', icon: Sparkles },
    { id: 'optimizer', label: '8. Investment Optimizer', icon: Target },
    { id: 'reports', label: '9. Compliance & Reports', icon: Award },
    { id: 'settings', label: '10. Workspace Settings', icon: Settings }
  ];

  const renderActiveView = () => {
    // If organization has not completed onboarding, show wizard
    if (!isOnboarded && activeTab !== 'settings') {
      return <OnboardingWizard onComplete={() => setActiveTab('dashboard')} />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'assets': return <AssetInventory />;
      case 'findings': return <Findings />;
      case 'quantification': return <RiskQuantification />;
      case 'financial': return <FinancialAnalysis />;
      case 'chat': return <AnalystChat />;
      case 'simulator': return <ScenarioSimulator />;
      case 'optimizer': return <InvestmentOptimizer />;
      case 'reports': return <ComplianceReports />;
      case 'settings': return <SettingsView />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  if (viewState === 'cover') {
    return <CoverPage onEnter={() => setViewState('landing')} />;
  }

  if (viewState === 'landing') {
    return <LandingPage onEnter={() => setViewState('app')} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#08090D] text-zinc-900 dark:text-zinc-100 transition-colors flex">
      {/* Auth / Tenant Switcher Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Sidebar - hidden in print mode */}
      <aside className="w-64 bg-white dark:bg-[#0D1117] border-r border-zinc-200/80 dark:border-[#1C2333] flex flex-col justify-between flex-shrink-0 transition-theme print:hidden">
        <div className="p-4 space-y-5">
          {/* Logo & Tenant Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold font-display text-sm tracking-tight text-zinc-950 dark:text-zinc-50 block">CyberRiskIQ</span>
                <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-wider block">Risk & Investment</span>
              </div>
            </div>

            {/* Active Workspace / Tenant Badge */}
            <div 
              onClick={() => setIsAuthModalOpen(true)}
              className="p-2.5 bg-zinc-50 dark:bg-[#121620] hover:bg-zinc-100 dark:hover:bg-[#161B26] border border-zinc-200 dark:border-[#1E2638] rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all"
            >
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-zinc-400 font-mono uppercase tracking-wider block">Tenant Workspace</span>
                <span className="text-xs font-bold font-display text-zinc-900 dark:text-zinc-100 truncate block">{org?.name || 'My Organization'}</span>
              </div>
              <Key className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all text-left cursor-pointer ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 dark:bg-[#161B26] dark:text-[#00F0FF] font-bold border-l-4 border-cyan-400 rounded-l-none' 
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[#121620] hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-[#00F0FF]' : 'text-zinc-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <SecurityAssessmentControl />
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-zinc-200 dark:border-[#1C2333] text-[10px] text-zinc-400 font-medium space-y-0.5 font-mono">
          <div>Tenant: <span className="text-cyan-400 font-bold truncate">{tenantId}</span></div>
          <div>Status: <span className="text-emerald-500 font-bold">ONLINE</span></div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - hidden in print mode */}
        <header className="h-16 bg-white dark:bg-[#0D1117] border-b border-zinc-200/80 dark:border-[#1C2333] flex items-center justify-between px-8 flex-shrink-0 transition-theme print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider font-mono">
              Workspace: <span className="text-zinc-900 dark:text-zinc-100 font-display">{org?.name}</span>
            </span>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-2.5 py-1 bg-cyan-500/10 text-cyan-600 dark:text-[#00F0FF] border border-cyan-500/20 text-[10px] font-bold font-mono rounded-md hover:bg-cyan-500/20 cursor-pointer"
            >
              Switch Tenant
            </button>
          </div>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 bg-zinc-100 dark:bg-[#161B26] hover:bg-zinc-200 dark:hover:bg-[#1E2536] border border-zinc-200 dark:border-[#26324B] rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-cyan-500" />}
          </button>
        </header>

        {/* Content View Container */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto print:p-0 print:overflow-visible">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
