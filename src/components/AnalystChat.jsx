import React, { useState, useRef, useEffect } from 'react';
import { useRisk } from '../context/RiskContext';
import { Bot, User, Send, Sparkles, MessageSquare } from 'lucide-react';

export default function AnalystChat() {
  const { assets, findings, calculateAssetEAL, solveOptimization } = useRisk();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your CyberRiskIQ AI Analyst. I am grounded in your live organization inventory, control assessments, and security telemetry. How can I help you optimize your cyber risk posture today?"
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const starterQuestions = [
    "What is our biggest financial cyber risk?",
    "Which business unit has the highest EAL?",
    "Which controls should we prioritize with our budget?",
    "How are Strix AI pentest findings factored into our risk score?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Format currency
  const formatCurrency = (val) => {
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

    // Generate response based on live state data
    setTimeout(() => {
      let botResponse = "";

      const normalizedQuery = query.toLowerCase();

      if (normalizedQuery.includes('biggest') || normalizedQuery.includes('highest risk') || normalizedQuery.includes('maximum risk')) {
        // Find asset with highest EAL
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
          const fnds = findings.filter(f => f.assetId === maxAsset.id && f.status === 'Open');
          botResponse = `Based on our continuous risk calculations, your biggest financial cyber risk is <b>${maxAsset.name}</b> in the <b>${maxAsset.businessUnit}</b> unit. It has an Expected Annual Loss (EAL) of <b>${formatCurrency(maxEal)}</b>. The main drivers are its internet-exposed profile and ${fnds.length} open vulnerabilities, including '${fnds[0]?.vulnerability || 'N/A'}'.`;
        } else {
          botResponse = "No critical assets were found in the active registry database to evaluate.";
        }
      } else if (normalizedQuery.includes('business unit') || normalizedQuery.includes('bu')) {
        const buMap = {};
        assets.forEach(a => {
          const eal = calculateAssetEAL(a);
          buMap[a.businessUnit] = (buMap[a.businessUnit] || 0) + eal;
        });
        const sorted = Object.entries(buMap).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          botResponse = `The business unit with the highest cyber risk exposure is <b>${sorted[0][0]}</b>, contributing <b>${formatCurrency(sorted[0][1])}</b> to the total Expected Annual Loss (EAL). This is followed by ${sorted[1] ? `<b>${sorted[1][0]}</b> (${formatCurrency(sorted[1][1])})` : 'other units'}.`;
        } else {
          botResponse = "No business units could be evaluated from the current organization setup.";
        }
      } else if (normalizedQuery.includes('prioritize') || normalizedQuery.includes('budget') || normalizedQuery.includes('optimizer')) {
        const opt = solveOptimization();
        const names = opt.selection.map(c => `<b>${c.name}</b> (Cost: ${formatCurrency(c.cost)})`).join(', ');
        botResponse = `Using the deterministic Knapsack Solver against your budget of <b>${formatCurrency(opt.totalCost + (opt.totalCost * 0.1))}</b>, you should prioritize the following controls: ${names || 'None'}. This combination maximizes your risk reduction, yielding a projected Expected Annual Loss (EAL) reduction of <b>${formatCurrency(opt.totalReduction)}</b> and a Return on Security Investment (ROSI) of <b>${opt.rosi}%</b>.`;
      } else if (normalizedQuery.includes('strix') || normalizedQuery.includes('pentest') || normalizedQuery.includes('poc')) {
        const strixCount = findings.filter(f => f.source.includes('Strix')).length;
        botResponse = `CyberRiskIQ integrates <b>Strix AI Pentesting</b> as a high-fidelity evidence provider. Currently, you have <b>${strixCount} findings</b> ingested from Strix. Findings with verified proof-of-concept (PoC) validation bypass standard scanner calculations and are assigned a higher threat weight in the Correlated Risk Indicator, ensuring they bubble up to the Executive Dashboard for immediate remediation. Strix does not calculate EAL or financial loss directly; that is handled by the CyberRiskIQ engine.`;
      } else {
        botResponse = "I can analyze specific items like: 'What is our biggest financial cyber risk?', 'Which business unit carries the highest EAL?', or 'Which controls should we prioritize with our budget?'. Could you please rephrase your query to target one of these areas?";
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 800);
  };

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col h-[580px] overflow-hidden transition-theme max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
            AI Cyber Risk Analyst <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
          </h2>
          <p className="text-[10px] text-zinc-400 font-semibold uppercase">Continuous Risk Q&A Agent</p>
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 text-xs leading-relaxed max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              msg.sender === 'user' 
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300' 
                : 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/20'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`p-3.5 rounded-xl border ${
              msg.sender === 'user'
                ? 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                : 'bg-white dark:bg-[#09090b] border-zinc-200 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200'
            }`}>
              <div dangerouslySetInnerHTML={{ __html: msg.text }} />
            </div>
          </div>
        ))}
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
                className="text-[11px] bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-600 dark:text-zinc-300 transition-colors text-left cursor-pointer"
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
            placeholder="Type a cyber risk question..."
            className="flex-1 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-xs text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
