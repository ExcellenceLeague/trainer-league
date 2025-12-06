import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Award, Download, Lock, Eye, Edit, MessageSquare, Copy, Check, Loader } from 'lucide-react';

const TrainerLeagueTracker = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const ADMIN_PASSWORD = 'tabby2025';

  // SUPABASE CONFIG - REPLACE WITH YOUR VALUES
  const SUPABASE_URL = 'https://jihzfrjzkgzyicuczcgu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppaHpmcmp6a2d6eWljdWN6Y2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5OTk0NDMsImV4cCI6MjA4MDU3NTQ0M30.T3m0zJ4A0ouuYFm0oUw0N6WgfgPn0bZ1vYSmkv16Vf0';

  const [trainers, setTrainers] = useState([]);
  const [supabase, setSupabase] = useState(null);

  const [newTrainer, setNewTrainer] = useState({
    name: '', batch: '', mcqAvg: '', mcqFailures: '', assessAvg: '',
    assessFailures: '', reassessFailures: '', throughput: '', csatFinal: '',
    csatImprovement: '', surveyCount: '', violationsRank: '', auditScore: ''
  });

  const [editingId, setEditingId] = useState(null);

  // Initialize Supabase
  useEffect(() => {
    const initSupabase = async () => {
      try {
        if (window.supabase && !supabase) {
          const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          setSupabase(client);
          await loadTrainers(client);
        }
      } catch (error) {
        console.error('Supabase initialization error:', error);
        setLoading(false);
      }
    };

    if (!window.supabase) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.onload = () => initSupabase();
      document.body.appendChild(script);
    } else {
      initSupabase();
    }
  }, []);

  const loadTrainers = async (client) => {
    try {
      const { data, error } = await client
        .from('trainers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTrainers(data || []);
    } catch (error) {
      console.error('Error loading trainers:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = (trainer) => {
    let score = 0;

    if (trainer.mcq_avg >= 95) score += 120;
    else if (trainer.mcq_avg >= 90) score += 100;
    else if (trainer.mcq_avg >= 85) score += 80;
    else if (trainer.mcq_avg >= 80) score += 60;
    else if (trainer.mcq_avg >= 75) score += 40;
    else if (trainer.mcq_avg >= 70) score += 20;
    score -= trainer.mcq_failures * 10;

    if (trainer.assess_avg >= 95) score += 120;
    else if (trainer.assess_avg >= 90) score += 100;
    else if (trainer.assess_avg >= 85) score += 80;
    else if (trainer.assess_avg >= 80) score += 60;
    else if (trainer.assess_avg >= 75) score += 40;
    else if (trainer.assess_avg >= 70) score += 20;
    score -= trainer.assess_failures * 15;

    score += Math.max(0, 80 - (trainer.reassess_failures * 20));

    if (trainer.mcq_avg > 85 && trainer.assess_avg > 85) score += 80;
    else if (trainer.mcq_avg > 85 || trainer.assess_avg > 85) score += 40;

    if (trainer.throughput >= 95) score += 250;
    else if (trainer.throughput >= 90) score += 220;
    else if (trainer.throughput >= 85) score += 190;
    else if (trainer.throughput >= 80) score += 160;
    else if (trainer.throughput >= 75) score += 130;
    else if (trainer.throughput >= 70) score += 100;
    else if (trainer.throughput >= 65) score += 70;
    else score += 40;

    if (trainer.csat_final >= 95) score += 120;
    else if (trainer.csat_final >= 90) score += 110;
    else if (trainer.csat_final >= 87) score += 100;
    else if (trainer.csat_final >= 84) score += 85;
    else if (trainer.csat_final >= 80) score += 70;
    else if (trainer.csat_final >= 75) score += 50;
    else if (trainer.csat_final >= 70) score += 30;
    else score += 10;

    if (trainer.csat_improvement >= 3) score += 80;
    else if (trainer.csat_improvement >= 2) score += 70;
    else if (trainer.csat_improvement >= 1.5) score += 60;
    else if (trainer.csat_improvement >= 1) score += 50;
    else if (trainer.csat_improvement >= 0.5) score += 40;
    else if (trainer.csat_improvement >= 0.1) score += 30;

    const surveyRankPoints = [50, 45, 40, 35, 30, 25, 25, 25, 25, 25];
    score += surveyRankPoints[Math.min(trainer.violations_rank - 1, 9)] || 15;

    const violationPoints = [70, 60, 50, 40, 30, 20, 20, 20, 20, 20];
    score += violationPoints[Math.min(trainer.violations_rank - 1, 9)] || 10;

    if (trainer.audit_score >= 95) score += 30;
    else if (trainer.audit_score >= 90) score += 25;
    else if (trainer.audit_score >= 85) score += 20;
    else if (trainer.audit_score >= 80) score += 15;
    else if (trainer.audit_score >= 75) score += 10;
    else score += 5;

    return Math.round(score);
  };

  const sortedTrainers = [...trainers]
    .map(t => ({ ...t, totalScore: calculateScore(t) }))
    .sort((a, b) => b.totalScore - a.totalScore);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPasswordPrompt(false);
      setPassword('');
    } else {
      alert('Incorrect password');
    }
  };

  const addTrainer = async () => {
    if (newTrainer.name && newTrainer.batch && supabase) {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('trainers')
          .insert([{
            name: newTrainer.name,
            batch: newTrainer.batch,
            mcq_avg: parseFloat(newTrainer.mcqAvg) || 0,
            mcq_failures: parseInt(newTrainer.mcqFailures) || 0,
            assess_avg: parseFloat(newTrainer.assessAvg) || 0,
            assess_failures: parseInt(newTrainer.assessFailures) || 0,
            reassess_failures: parseInt(newTrainer.reassessFailures) || 0,
            throughput: parseFloat(newTrainer.throughput) || 0,
            csat_final: parseFloat(newTrainer.csatFinal) || 0,
            csat_improvement: parseFloat(newTrainer.csatImprovement) || 0,
            survey_count: parseInt(newTrainer.surveyCount) || 0,
            violations_rank: parseInt(newTrainer.violationsRank) || 0,
            audit_score: parseFloat(newTrainer.auditScore) || 0
          }]);
        
        if (error) throw error;
        
        await loadTrainers(supabase);
        setNewTrainer({
          name: '', batch: '', mcqAvg: '', mcqFailures: '', assessAvg: '',
          assessFailures: '', reassessFailures: '', throughput: '', csatFinal: '',
          csatImprovement: '', surveyCount: '', violationsRank: '', auditScore: ''
        });
      } catch (error) {
        console.error('Error adding trainer:', error);
        alert('Error adding trainer: ' + error.message);
      }
      setSaving(false);
    }
  };

  const deleteTrainer = async (id) => {
    if (window.confirm('Are you sure you want to delete this trainer?') && supabase) {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('trainers')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        await loadTrainers(supabase);
      } catch (error) {
        console.error('Error deleting trainer:', error);
        alert('Error deleting trainer: ' + error.message);
      }
      setSaving(false);
    }
  };

  const startEdit = (trainer) => {
    setEditingId(trainer.id);
    setNewTrainer({
      name: trainer.name,
      batch: trainer.batch,
      mcqAvg: trainer.mcq_avg.toString(),
      mcqFailures: trainer.mcq_failures.toString(),
      assessAvg: trainer.assess_avg.toString(),
      assessFailures: trainer.assess_failures.toString(),
      reassessFailures: trainer.reassess_failures.toString(),
      throughput: trainer.throughput.toString(),
      csatFinal: trainer.csat_final.toString(),
      csatImprovement: trainer.csat_improvement.toString(),
      surveyCount: trainer.survey_count.toString(),
      violationsRank: trainer.violations_rank.toString(),
      auditScore: trainer.audit_score.toString()
    });
  };

  const saveEdit = async () => {
    if (supabase && editingId) {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('trainers')
          .update({
            name: newTrainer.name,
            batch: newTrainer.batch,
            mcq_avg: parseFloat(newTrainer.mcqAvg) || 0,
            mcq_failures: parseInt(newTrainer.mcqFailures) || 0,
            assess_avg: parseFloat(newTrainer.assessAvg) || 0,
            assess_failures: parseInt(newTrainer.assessFailures) || 0,
            reassess_failures: parseInt(newTrainer.reassessFailures) || 0,
            throughput: parseFloat(newTrainer.throughput) || 0,
            csat_final: parseFloat(newTrainer.csatFinal) || 0,
            csat_improvement: parseFloat(newTrainer.csatImprovement) || 0,
            survey_count: parseInt(newTrainer.surveyCount) || 0,
            violations_rank: parseInt(newTrainer.violationsRank) || 0,
            audit_score: parseFloat(newTrainer.auditScore) || 0
          })
          .eq('id', editingId);
        
        if (error) throw error;
        await loadTrainers(supabase);
        cancelEdit();
      } catch (error) {
        console.error('Error updating trainer:', error);
        alert('Error updating trainer: ' + error.message);
      }
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewTrainer({
      name: '', batch: '', mcqAvg: '', mcqFailures: '', assessAvg: '',
      assessFailures: '', reassessFailures: '', throughput: '', csatFinal: '',
      csatImprovement: '', surveyCount: '', violationsRank: '', auditScore: ''
    });
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '#' + rank;
  };

  const getTierBadge = (rank) => {
    if (rank === 1) return { label: 'CHAMPION', color: 'bg-yellow-500' };
    if (rank <= 3) return { label: 'EXCELLENCE', color: 'bg-gray-400' };
    if (rank <= 5) return { label: 'ACHIEVEMENT', color: 'bg-amber-600' };
    return { label: 'PARTICIPANT', color: 'bg-blue-500' };
  };

  const generateSlackMessage = () => {
    const avgScore = trainers.length > 0 ? Math.round(sortedTrainers.reduce((sum, t) => sum + t.totalScore, 0) / trainers.length) : 0;
    const topTrainer = sortedTrainers[0];
    const avgCSAT = trainers.length > 0 ? Math.round(trainers.reduce((sum, t) => sum + t.csat_final, 0) / trainers.length) : 0;
    const avgThroughput = trainers.length > 0 ? Math.round(trainers.reduce((sum, t) => sum + t.throughput, 0) / trainers.length) : 0;
    const above87CSAT = trainers.filter(t => t.csat_final >= 87).length;
    
    const top3List = sortedTrainers.slice(0, 3).map((t, i) => (i + 1) + '. ' + t.name + ' - ' + t.totalScore + ' pts (Batch: ' + t.batch + ')').join('\n');
    
    return '🏆 *Tabby Trainer Excellence League - Q1 Update*\n\n📊 *Key Highlights:*\n• Total Participating Trainers: *' + trainers.length + '*\n• Average Competition Score: *' + avgScore + '/1000*\n• Current Leader: *' + (topTrainer?.name || 'N/A') + '* with *' + (topTrainer?.totalScore || 0) + ' points*\n\n🎯 *Performance Metrics:*\n• Average CSAT Score: *' + avgCSAT + '%* (Target: 87%)\n• Trainers Meeting CSAT Target: *' + above87CSAT + '/' + trainers.length + '*\n• Average Throughput Rate: *' + avgThroughput + '%*\n\n🥇 *Top 3 Rankings:*\n' + top3List + '\n\n📈 *Program Details:*\n• Duration: Q1 2025\n• Scoring Categories: Quality (40%), Throughput (25%), CSAT (25%), Compliance (10%)\n• Recognition: Champion, Excellence, and Achievement tiers\n• Next Update: Bi-weekly\n\n_This competitive initiative is driving training excellence and elevating our trainer performance across all key metrics._';
  };

  const copySlackMessage = () => {
    const message = generateSlackMessage();
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToCSV = () => {
    const headers = ['Rank', 'Trainer', 'Batch', 'Total Score', 'MCQ Avg', 'MCQ Fails', 'Assess Avg', 
      'Assess Fails', 'Reassess Fails', 'Throughput %', 'CSAT %', 'CSAT Improve %', 
      'Survey Count', 'Violation Rank', 'Audit Score'];
    
    const rows = sortedTrainers.map((t, idx) => [
      idx + 1, t.name, t.batch, t.totalScore, t.mcq_avg, t.mcq_failures, t.assess_avg,
      t.assess_failures, t.reassess_failures, t.throughput, t.csat_final, t.csat_improvement,
      t.survey_count, t.violations_rank, t.audit_score
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trainer-league-q1-results.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading trainer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Tabby Trainer Excellence League</h1>
                <p className="text-gray-600">Q1 Edition - Live Leaderboard</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsAdmin(false);
                    setShowPasswordPrompt(false);
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  <Eye className="w-4 h-4" />
                  Public View
                </button>
              )}
              <button
                onClick={() => setShowPasswordPrompt(!showPasswordPrompt)}
                className={'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ' + (isAdmin ? 'bg-green-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-700')}
              >
                {isAdmin ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isAdmin ? 'Admin Mode' : 'Admin Login'}
              </button>
            </div>
          </div>

          {showPasswordPrompt && !isAdmin && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="flex-1 border border-gray-300 rounded px-3 py-2"
                />
                <button
                  onClick={handleLogin}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-semibold"
                >
                  Login
                </button>
              </div>
            </div>
          )}
        </div>

        {saving && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 rounded">
            <div className="flex items-center">
              <Loader className="w-5 h-5 text-yellow-700 animate-spin mr-2" />
              <p className="text-yellow-700 font-semibold">Saving changes...</p>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Summary Status Update
              </h2>
              <button
                onClick={copySlackMessage}
                className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-gray-100 font-semibold"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Message'}
              </button>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm">{generateSlackMessage()}</pre>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-600" />
              Current Rankings
            </h2>
            {isAdmin && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trainer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Batch</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Score</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Tier</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Details</th>
                  {isAdmin && <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedTrainers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No trainers added yet. {isAdmin && 'Use the form below to add your first trainer!'}
                    </td>
                  </tr>
                ) : (
                  sortedTrainers.map((trainer, idx) => {
                    const tier = getTierBadge(idx + 1);
                    return (
                      <tr key={trainer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-2xl">{getMedalEmoji(idx + 1)}</td>
                        <td className="px-4 py-4 font-semibold text-gray-800">{trainer.name}</td>
                        <td className="px-4 py-4 text-gray-600 text-sm">{trainer.batch}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-2xl font-bold text-indigo-600">{trainer.totalScore}</span>
                          <span className="text-gray-500 text-sm">/1000</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={tier.color + ' text-white px-3 py-1 rounded-full text-xs font-bold'}>
                            {tier.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-gray-600">
                          <div className="space-y-1">
                            <div>MCQ: {trainer.mcq_avg}% | Assess: {trainer.assess_avg}%</div>
                            <div>Throughput: {trainer.throughput}% | CSAT: {trainer.csat_final}%</div>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => startEdit(trainer)}
                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteTrainer(trainer.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Edit className="w-6 h-6 text-indigo-600" />
              {editingId ? 'Edit Trainer Data' : 'Add New Trainer'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input type="text" placeholder="Trainer Name" value={newTrainer.name} onChange={(e) => setNewTrainer({...newTrainer, name: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
              <input type="text" placeholder="Batch Name" value={newTrainer.batch} onChange={(e) => setNewTrainer({...newTrainer, batch: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
              <input type="number" placeholder="MCQ Average %" value={newTrainer.mcqAvg} onChange={(e) => setNewTrainer({...newTrainer, mcqAvg: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
              <input type="number" placeholder="MCQ Failures" value={newTrainer.mcqFailures} onChange={(e) => setNewTrainer({...newTrainer, mcqFailures: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
              <input type="number" placeholder="Assessment Avg %" value={newTrainer.assessAvg} onChange={(e) => setNewTrainer({...newTrainer, assessAvg: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
              <input type="number" placeholder="Assessment Failures" value={newTrainer.assessFailures} onChange={(e) => setNewTrainer({...newTrainer, assessFailures: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
              <input type="number" placeholder="Reassessment Failures" value={newTrainer.reassessFailures} onChange={(e) => setNewTrainer({...newTrainer, reassessFailures: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
              <input type="number" placeholder="Throughput %" value={newTrainer.throughput} onChange={(e) => setNewTrainer({...newTrainer, throughput: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
              <input type="number" placeholder="Final CSAT %" value={newTrainer.csatFinal} onChange={(e) => setNewTrainer({...newTrainer, csatFinal: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
              <input type="number" step="0.1" placeholder="CSAT Improvement %" value={newTrainer.csatImprovement} onChange={(e) => setNewTrainer({...newTrainer, csatImprovement: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
              <input type="number" placeholder="Survey Count" value={newTrainer.surveyCount} onChange={(e) => setNewTrainer({...newTrainer, surveyCount: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
              <input type="number" placeholder="Violations Rank" value={newTrainer.violationsRank} onChange={(e) => setNewTrainer({...newTrainer, violationsRank: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
              <input type="number" placeholder="Audit Score %" value={newTrainer.auditScore} onChange={(e) => setNewTrainer({...newTrainer, auditScore: e.target.value})} className="border border-gray-300 rounded px-3 py-2" />
            </div>
            
            <div className="flex gap-2 mt-4">
              {editingId ? (
                <>
                  <button onClick={saveEdit} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold">
                    Save Changes
                  </button>
                  <button onClick={cancelEdit} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 font-semibold">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={addTrainer} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-semibold">
                  Add Trainer
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-semibold">Total Trainers</span>
            </div>
            <div className="text-3xl font-bold text-indigo-600">{trainers.length}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-semibold">Avg Score</span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {trainers.length > 0 ? Math.round(sortedTrainers.reduce((sum, t) => sum + t.totalScore, 0) / trainers.length) : 0}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-semibold">Top Score</span>
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {sortedTrainers.length > 0 ? sortedTrainers[0].totalScore : 0}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Award className="w-5 h-5" />
              <span className="text-sm font-semibold">Current Leader</span>
            </div>
            <div className="text-lg font-bold text-indigo-600 truncate">
              {sortedTrainers.length > 0 ? sortedTrainers[0].name : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerLeagueTracker;
