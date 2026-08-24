import React, { useState, useRef, useEffect } from 'react';
import { useRisk } from '../context/RiskContext';
import { Bot, User, Send, Sparkles, ShieldAlert, Target, Landmark, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function AnalystChat() {
  const { 
    org, 
    assets, 
    findings, 
    calculateAssetEAL, 
    calculateAssetRiskScore, 
    calculateAssetFinancialImpact, 
    solveOptimization, 
    getEnterpriseStats 
  } = useRisk();

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your <b>CyberRiskIQ AI Risk Analyst</b>. I am grounded strictly in your live organization inventory, control assessments, and security telemetry. How can I assist you with cyber risk quantification or investment optimization today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const starterQuestions = [
    "What is our highest financial cyber risk?",
    "Which business unit has the highest EAL?",
    "Which security controls should we prioritize with our budget?",
    "How are AI Security Assessment findings factored into our risk score?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Format currency helper
  const formatCurrency = (val) => {
    if (!val && val !== 0) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Grounded Query Resolution
    setTimeout(() => {
      let botResponse = "";
      const normalized = query.toLowerCase().trim();

      // 1. Highest Financial Cyber Risk / EAL
      if (normalized.includes('biggest') || normalized.includes('highest risk') || normalized.includes('maximum risk') || normalized.includes('highest eal') || normalized.includes('critical asset')) {
        let maxEal = -1;
        let maxAsset = null;

        assets.forEach(a => {
          const eal = calculateAssetEAL(a);
          if (eal > maxEal) {
            maxEal = eal;
            maxAsset = a;
          }
        });
        
        if (maxAsset) {
          const fnds = findings.filter(f => (f.assetId === maxAsset.id || f.asset_id === maxAsset.id) && f.status === 'Open');
          const score = calculateAssetRiskScore(maxAsset);
          const prob = 0.01 + (score - 10) * (0.34 / 90);
          const impact = calculateAssetFinancialImpact(maxAsset);
          const topFnd = fnds[0];

          botResponse = `
            Based on deterministic risk quantification, your highest financial cyber risk is <b>${maxAsset.name}</b> (<code>${maxAsset.id}</code>) in the <b>${maxAsset.businessUnit}</b> unit.<br/><br/>
            <b>Key Metrics:</b>
            <ul style="margin-left: 14px; list-style-type: disc; margin-top: 4px;">
              <li>Expected Annual Loss (EAL): <b>${formatCurrency(maxEal)}</b></li>
              <li>Annual Incident Probability: <b>${(prob * 100).toFixed(1)}%</b></li>
              <li>Potential Loss (Single Incident): <b>${formatCurrency(impact)}</b></li>
              <li>Asset Risk Score: <b>${score}/100</b></li>
            </ul>
            <br/>
            <b>Primary Drivers:</b> Internet exposure (${maxAsset.internetExposure === 'Yes' ? 'Exposed' : 'Internal'}), ${fnds.length} open vulnerabilities (including '<i>${topFnd ? topFnd.vulnerability : 'None'}</i>'), and ${maxAsset.dataSensitivity} data sensitivity.
          `;
        } else {
          botResponse = "No assets were found in the active registry database to evaluate.";
        }
      } 
      // 2. Business Unit Exposure
      else if (normalized.includes('business unit') || normalized.includes('bu') || normalized.includes('division') || normalized.includes('department')) {
        const buMap = {};
        assets.forEach(a => {
          const eal = calculateAssetEAL(a);
          buMap[a.businessUnit] = (buMap[a.businessUnit] || 0) + eal;
        });
        const sorted = Object.entries(buMap).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          const rows = sorted.map(([name, val], idx) => `<li>${idx + 1}. <b>${name}</b>: ${formatCurrency(val)}</li>`).join('');
          botResponse = `
            The business unit with the highest quantified cyber risk exposure is <b>${sorted[0][0]}</b>, contributing <b>${formatCurrency(sorted[0][1])}</b> to the total Expected Annual Loss (EAL).<br/><br/>
            <b>Full Business Unit EAL Breakdown:</b>
            <ul style="margin-left: 14px; list-style-type: disc; margin-top: 4px;">
              ${rows}
            </ul>
            <br/>
            Remediating vulnerabilities and tightening access controls in <b>${sorted[0][0]}</b> will produce the highest reduction in organizational risk liability.
          `;
        } else {
          botResponse = "No business units could be evaluated from the current organization setup.";
        }
      } 
      // 3. Investment Optimization & Budget Prioritization
      else if (normalized.includes('prioritize') || normalized.includes('budget') || normalized.includes('optimizer') || normalized.includes('spend') || normalized.includes('rosi') || normalized.includes('investment')) {
        const opt = solveOptimization();
        const names = opt.selection.map(c => `<li>• <b>${c.name}</b> (Cost: ${formatCurrency(c.cost)} | EAL Reduction: ${formatCurrency(c.ealReduction)})</li>`).join('');
        botResponse = `
          Using 0/1 Knapsack Dynamic Programming optimization against your allocated cybersecurity budget of <b>${formatCurrency(org.budget)}</b>, the recommended control portfolio is:<br/><br/>
          <ul style="margin-left: 14px; list-style-type: disc; margin-top: 4px;">
            ${names || '<li>No controls selected within the specified budget.</li>'}
          </ul>
          <br/>
          <b>Portfolio Outcome:</b>
          <ul style="margin-left: 14px; list-style-type: disc; margin-top: 4px;">
            <li>Total Investment Cost: <b>${formatCurrency(opt.totalCost)}</b></li>
            <li>Projected EAL Reduction: <b>${formatCurrency(opt.totalReduction)}</b></li>
            <li>Return on Security Investment (ROSI): <b>${opt.rosi}%</b></li>
            <li>Remaining Unallocated Budget: <b>${formatCurrency(Math.max(0, org.budget - opt.totalCost))}</b></li>
          </ul>
        `;
      } 
      // 4. Security Assessment Engine Findings
      else if (normalized.includes('assessment') || normalized.includes('pentest') || normalized.includes('probe') || normalized.includes('poc') || normalized.includes('telemetry')) {
        const secFindings = findings.filter(f => f.source.includes('Security Assessment') || f.source.includes('Pentest'));
        const pocCount = secFindings.filter(f => f.pocAttached || f.poc_attached).length;
        botResponse = `
          CyberRiskIQ integrates the <b>AI Security Assessment Engine</b> for autonomous vulnerability probing and proof-of-concept validation.<br/><br/>
          <b>Current Telemetry Status:</b>
          <ul style="margin-left: 14px; list-style-type: disc; margin-top: 4px;">
            <li>Validated Findings: <b>${secFindings.length} findings</b></li>
            <li>Active Proof-of-Concept (PoC) Traces: <b>${pocCount} confirmed exploits</b></li>
            <li>Threat Weighting: Validated findings with public exploits receive a <b>+1.2 CVSS boost</b> in our Correlated Risk Indicator.</li>
          </ul>
          <br/>
          These validated findings feed directly into our deterministic risk engine, driving the EAL and budget allocation on your Executive Dashboard.
        `;
      } 
      // 5. Fallback Prompting
      else {
        botResponse = `
          I am grounded directly in your active database of <b>${assets.length} assets</b>, <b>${findings.length} findings</b>, and deterministic risk engines. You can ask me specific questions like:
          <ul style="margin-left: 14px; list-style-type: disc; margin-top: 6px;">
            <li>• <i>"What is our highest financial cyber risk?"</i></li>
            <li>• <i>"Which business unit has the highest EAL?"</i></li>
            <li>• <i>"Which security controls should we prioritize with our budget?"</i></li>
            <li>• <i>"How are AI Security Assessment findings factored into our risk score?"</i></li>
          </ul>
        `;
      }

      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 600);
  };

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col h-[640px] overflow-hidden transition-theme max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
              AI Cyber Risk Analyst <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            </h2>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase">Grounded Intelligence • Zero Hallucination</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Grounded in {assets.length} assets</span>
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 text-xs leading-relaxed max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`p-2 rounded-lg flex-shrink-0 h-fit ${
              msg.sender === 'user' 
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300' 
                : 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/20'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`p-3.5 rounded-xl border ${
              msg.sender === 'user'
                ? 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                : 'bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 shadow-sm'
            }`}>
              <div dangerouslySetInnerHTML={{ __html: msg.text }} />
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 text-xs max-w-[85%]">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 border border-blue-100 dark:border-blue-900/20">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs italic flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
              <span>Querying live deterministic risk engines...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset prompts */}
      {messages.length === 1 && (
        <div className="px-6 pb-2 space-y-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Suggested Questions</span>
          <div className="flex flex-wrap gap-2">
            {starterQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-[11px] bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-600 dark:text-zinc-300 transition-colors text-left cursor-pointer font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input panel */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/20">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Ask a question about your cyber risk, EAL, or budget optimization..."
            className="flex-1 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer font-semibold text-xs gap-1.5 shadow-sm"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
