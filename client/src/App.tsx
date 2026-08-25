import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  GitBranch, Activity, CheckCircle, Save, 
  FlaskConical, RefreshCw, BarChart2 
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function App() {
  const [activeTab, setActiveTab] = useState<'registry' | 'experiments'>('registry');

  // Registry State
  const [promptId, setPromptId] = useState<string | null>(null);
  const [versionAId, setVersionAId] = useState<string | null>(null);
  const [versionBId, setVersionBId] = useState<string | null>(null);

  // Experiment State
  const [expName, setExpName] = useState('');
  const [trafficSplit, setTrafficSplit] = useState(50);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);



  const setupMockData = async () => {
    try {
      // 1. Create prompt & Version A
      const resA = await axios.post('http://localhost:4002/api/v1/prompts', {
        name: "Support Classifier", 
        systemPrompt: "You are a support bot. Classify the user query.", 
        model: "gpt-4o-mini", 
        temperature: 0.2
      });
      const pId = resA.data.promptId;
      setPromptId(pId);

      // We need to fetch the version ID of A. Our simple API didn't return it on creation.
      // Let's create Version A explicitly.
      const resV1 = await axios.post(`http://localhost:4002/api/v1/prompts/${pId}/versions`, {
        systemPrompt: "You are a support bot. Classify the user query into categories.", 
        model: "gpt-4o-mini", 
        temperature: 0.2,
        commitMessage: 'Baseline (A)'
      });
      const vA = resV1.data.versionId;
      setVersionAId(vA);

      // Create Version B
      const resV2 = await axios.post(`http://localhost:4002/api/v1/prompts/${pId}/versions`, {
        systemPrompt: "You are a support bot. Classify the user query into categories. You MUST output JSON.", 
        model: "gpt-4o-mini", 
        temperature: 0.2,
        commitMessage: 'Experimental (B)'
      });
      const vB = resV2.data.versionId;
      setVersionBId(vB);

      alert("Created Prompt and Variants A and B.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const launchExperiment = async () => {
    if (!promptId || !versionAId || !versionBId || !expName) return;
    try {
      await axios.post('http://localhost:4002/api/v1/experiments', {
        name: expName,
        promptId,
        variantA: versionAId,
        variantB: versionBId,
        trafficSplitA: trafficSplit
      });
      alert('Experiment launched!');
      fetchExperiments();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const fetchExperiments = async () => {
    try {
      const res = await axios.get('http://localhost:4002/api/v1/experiments');
      setExperiments(res.data.experiments);
      if (res.data.experiments.length > 0) {
        fetchStats(res.data.experiments[0].id);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const fetchStats = async (id: string) => {
    try {
      const res = await axios.get(`http://localhost:4002/api/v1/experiments/${id}/stats`);
      setStats(res.data);
    } catch (e: any) {
      console.error(e);
    }
  };

  const simulateTraffic = async () => {
    if (experiments.length === 0) return;
    const exp = experiments[0];
    
    // Fire 20 concurrent requests with random user IDs
    const requests = [];
    for (let i = 0; i < 20; i++) {
      const sessionId = 'user_' + Math.floor(Math.random() * 1000000);
      requests.push(axios.post('http://localhost:4002/api/v1/completions', {
        promptId: exp.prompt_id,
        sessionId,
        userMessage: "How do I reset my password?"
      }));
    }

    try {
      await Promise.all(requests);
      alert('Fired 20 synthetic requests. Evaluator is scoring them in the background (may take a moment).');
    } catch (e: any) {
      alert(e.message);
    }
  };

  useEffect(() => {
    fetchExperiments();
    const interval = setInterval(() => {
      if (experiments.length > 0) fetchStats(experiments[0].id);
    }, 5000); // Polling for live dashboard
    return () => clearInterval(interval);
  }, [experiments.length]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4 shadow-lg">
        <FlaskConical className="w-8 h-8 text-purple-400" />
        <h1 className="text-2xl font-bold tracking-tight">PromptLabs <span className="text-slate-400 text-lg">A/B Testing</span></h1>
      </nav>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Sidebar */}
        <div className="md:col-span-3 space-y-2">
          <button 
            onClick={() => setActiveTab('registry')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-colors ${activeTab === 'registry' ? 'bg-purple-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <GitBranch className="w-5 h-5" />
            Prompt Registry
          </button>
          <button 
            onClick={() => setActiveTab('experiments')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-colors ${activeTab === 'experiments' ? 'bg-purple-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Activity className="w-5 h-5" />
            Experiments
          </button>
        </div>

        {/* Main Content */}
        <div className="md:col-span-9 space-y-6">
          
          {activeTab === 'registry' && (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <GitBranch className="text-purple-400 w-6 h-6" />
                Prompt Versioning
              </h2>
              
              <div className="space-y-4 max-w-2xl">
                <div>
                  <button onClick={setupMockData} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 mb-8">
                    <Save className="w-4 h-4" /> 1-Click: Setup Mock Prompt + Variants A & B
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded p-4 border border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Variant A (Baseline)</h3>
                    <code className="text-xs text-emerald-400 break-all">{versionAId || 'Not created'}</code>
                  </div>
                  <div className="bg-slate-900 rounded p-4 border border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Variant B (Experimental)</h3>
                    <code className="text-xs text-purple-400 break-all">{versionBId || 'Not created'}</code>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-700">
                  <h3 className="text-lg font-semibold mb-4">Launch New Experiment</h3>
                  <div className="space-y-4">
                    <input 
                      type="text" placeholder="Experiment Name (e.g., JSON Formatting Test)" 
                      value={expName} onChange={e => setExpName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2"
                    />
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Traffic Split: {trafficSplit}% (A) / {100 - trafficSplit}% (B)</label>
                      <input 
                        type="range" min="0" max="100" 
                        value={trafficSplit} onChange={e => setTrafficSplit(Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>
                    <button 
                      onClick={launchExperiment}
                      disabled={!promptId || !versionAId || !versionBId}
                      className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2"
                    >
                      <FlaskConical className="w-5 h-5" /> Launch A/B Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'experiments' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <BarChart2 className="text-purple-400 w-6 h-6" />
                    Live Metrics Dashboard
                  </h2>
                  <p className="text-slate-400 mt-1">Real-time LLM-as-judge quality scoring and statistical significance</p>
                </div>
                <button 
                  onClick={simulateTraffic}
                  className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Blast Synthetic Traffic
                </button>
              </div>

              {stats && stats.significance && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Significance Card */}
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl lg:col-span-1 flex flex-col justify-center items-center text-center">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Statistical Significance</h3>
                    
                    {stats.significance.significant ? (
                      <div className="text-emerald-400 flex flex-col items-center">
                        <CheckCircle className="w-16 h-16 mb-2" />
                        <span className="text-2xl font-bold">Winner Found!</span>
                        <span className="text-sm mt-2 opacity-80">Variant {stats.significance.winner === experiments[0]?.variant_a_version_id ? 'A' : 'B'}</span>
                      </div>
                    ) : (
                      <div className="text-yellow-400 flex flex-col items-center">
                        <Activity className="w-16 h-16 mb-2" />
                        <span className="text-2xl font-bold">Inconclusive</span>
                        <span className="text-sm mt-2 opacity-80">Gathering more data...</span>
                      </div>
                    )}
                    
                    <div className="mt-6 text-sm text-slate-400">
                      p-value: <span className="font-mono text-slate-300">{(stats.significance.pValue || 1).toFixed(4)}</span>
                    </div>
                  </div>

                  {/* Chart Card */}
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl lg:col-span-2">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Mean Quality Score (1-5)</h3>
                    <div className="h-64">
                      {stats.basicStats && stats.basicStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.basicStats.map((s:any) => ({
                            name: s.assigned_variant_id === experiments[0]?.variant_a_version_id ? 'Variant A' : 'Variant B',
                            score: parseFloat(s.mean_quality.toFixed(2)),
                            samples: s.sample_size
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis domain={[0, 5]} stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                            <Legend />
                            <Bar dataKey="score" fill="#a855f7" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                          Waiting for traffic and evaluation scores...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats Table */}
                  <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl lg:col-span-3 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900 text-slate-400 text-sm uppercase">
                        <tr>
                          <th className="px-6 py-4 font-medium">Variant</th>
                          <th className="px-6 py-4 font-medium">Sample Size</th>
                          <th className="px-6 py-4 font-medium">Mean Quality</th>
                          <th className="px-6 py-4 font-medium">Mean Latency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {stats.basicStats?.map((s: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-700/50">
                            <td className="px-6 py-4 font-mono text-sm">
                              {s.assigned_variant_id === experiments[0]?.variant_a_version_id ? 
                                <span className="text-emerald-400">Variant A</span> : 
                                <span className="text-purple-400">Variant B</span>
                              }
                            </td>
                            <td className="px-6 py-4">{s.sample_size}</td>
                            <td className="px-6 py-4 font-bold">{s.mean_quality?.toFixed(2)}</td>
                            <td className="px-6 py-4 text-slate-400">{s.mean_latency?.toFixed(0)}ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
