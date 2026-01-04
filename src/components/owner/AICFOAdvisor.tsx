'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, User } from '@/types/database';
import { isOwner } from '@/lib/auth';
import { 
  Brain, 
  Sparkles, 
  Send, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  MessageCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AICFOAdvisorProps {
  transactions: Transaction[];
  user: User | null;
}

interface Insight {
  type: 'positive' | 'warning' | 'danger' | 'tip';
  title: string;
  detail: string;
}

interface InsightData {
  summary: string;
  healthScore: number;
  insights: Insight[];
  recommendations: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AICFOAdvisor({ transactions, user }: AICFOAdvisorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // All stored data from localStorage
  const [storedData, setStoredData] = useState<{
    currentBalance: number | null;
    monthlyGoal: { amount: number; month: string } | null;
    savingSettings: { percentage: number; goalAmount: number; currentSaved: number } | null;
    scheduledTransactions: any[] | null;
  }>({
    currentBalance: null,
    monthlyGoal: null,
    savingSettings: null,
    scheduledTransactions: null
  });
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load ALL data from localStorage
  useEffect(() => {
    // Initial Balance (for calculating current balance)
    const balanceSaved = localStorage.getItem('quarion_initial_balance');
    if (balanceSaved) {
      try {
        const data = JSON.parse(balanceSaved);
        // Calculate current balance based on transactions after set date
        const setDate = new Date(data.setDate);
        let incomeAfter = 0;
        let expenseAfter = 0;
        
        transactions.forEach((t) => {
          const txDate = new Date(t.created_at || t.date);
          if (txDate > setDate) {
            if (t.type === 'income') {
              incomeAfter += t.amount;
            } else {
              expenseAfter += t.amount;
            }
          }
        });
        
        const currentBalance = data.amount + incomeAfter - expenseAfter;
        setStoredData(prev => ({ ...prev, currentBalance }));
      } catch (e) {}
    }
    
    // Monthly Goal
    const goalSaved = localStorage.getItem('owner-monthly-goal');
    if (goalSaved) {
      try {
        const data = JSON.parse(goalSaved);
        setStoredData(prev => ({ ...prev, monthlyGoal: data }));
      } catch (e) {}
    }
    
    // Saving Settings
    const savingSaved = localStorage.getItem('owner-saving-settings');
    if (savingSaved) {
      try {
        const data = JSON.parse(savingSaved);
        setStoredData(prev => ({ ...prev, savingSettings: data }));
      } catch (e) {}
    }
    
    // Scheduled Transactions
    const scheduledSaved = localStorage.getItem('quarion_scheduled_transactions');
    if (scheduledSaved) {
      try {
        const data = JSON.parse(scheduledSaved);
        setStoredData(prev => ({ ...prev, scheduledTransactions: data }));
      } catch (e) {}
    }
  }, [transactions]);

  // Prepare financial summary with ALL data
  const financialSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const incomeByCategory: { [key: string]: number } = {};
    const expenseByCategory: { [key: string]: number } = {};
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};

    // ALL transactions - not just recent
    const allTransactionsList = transactions.map((t) => ({
      date: t.date,
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description
    }));

    transactions.forEach((t) => {
      if (t.type === 'income') {
        totalIncome += t.amount;
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      } else {
        totalExpense += t.amount;
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      }

      const monthKey = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
    });

    const monthlyTrend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        profit: data.income - data.expense
      }));

    return {
      totalIncome,
      totalExpense,
      profit: totalIncome - totalExpense,
      incomeByCategory,
      expenseByCategory,
      monthlyTrend,
      totalTransactions: transactions.length,
      allTransactions: allTransactionsList,
      // All stored data
      currentBalance: storedData.currentBalance,
      monthlyGoal: storedData.monthlyGoal,
      savingSettings: storedData.savingSettings,
      scheduledTransactions: storedData.scheduledTransactions
    };
  }, [transactions, storedData]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Owner guard
  if (!isOwner(user)) return null;

  const fetchInsight = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-cfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'insight',
          data: financialSummary
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        setInsightData(result.data);
      } else {
        setError(result.error || 'ไม่สามารถวิเคราะห์ได้');
      }
    } catch (e) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!inputMessage.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai-cfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          data: financialSummary,
          question: inputMessage
        })
      });

      const result = await response.json();

      if (result.success && result.data?.message) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: result.data.message,
          timestamp: new Date()
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: '❌ ' + (result.error || 'ไม่สามารถตอบได้ในขณะนี้'),
          timestamp: new Date()
        };
        setChatMessages((prev) => [...prev, errorMessage]);
      }
    } catch (e) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ เกิดข้อผิดพลาดในการเชื่อมต่อ',
        timestamp: new Date()
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'danger':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'tip':
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-500" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'danger':
        return 'bg-red-50 border-red-200';
      case 'tip':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 lg:p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI CFO</h3>
              <p className="text-sm text-white/80">ที่ปรึกษาการเงินอัจฉริยะ</p>
            </div>
          </div>
          <button
            onClick={fetchInsight}
            disabled={isLoading}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium
                       transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {insightData ? 'วิเคราะห์ใหม่' : 'เริ่มวิเคราะห์'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 lg:p-6">
        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="py-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-500 mb-3" />
            <p className="text-gray-500">กำลังวิเคราะห์ข้อมูลการเงิน...</p>
            <p className="text-sm text-gray-400 mt-1">รอสักครู่</p>
          </div>
        )}

        {/* No Data Yet */}
        {!isLoading && !insightData && !error && (
          <div className="py-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">กดปุ่ม "เริ่มวิเคราะห์" เพื่อให้ AI วิเคราะห์สถานะการเงิน</p>
            <p className="text-sm text-gray-400 mt-1">
              มีข้อมูล {transactions.length} รายการ พร้อมวิเคราะห์
            </p>
          </div>
        )}

        {/* Insight Data */}
        {insightData && !isLoading && (
          <div className="space-y-4">
            {/* Health Score */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={176}
                    strokeDashoffset={176 - (176 * insightData.healthScore) / 100}
                    className={getHealthBg(insightData.healthScore)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${getHealthColor(insightData.healthScore)}`}>
                    {insightData.healthScore}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">สุขภาพการเงิน</div>
                <div className="text-gray-800">{insightData.summary}</div>
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600 mb-2">📊 การวิเคราะห์</div>
              {insightData.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${getInsightBg(insight.type)}`}
                >
                  <div className="flex items-start gap-2">
                    {getInsightIcon(insight.type)}
                    <div>
                      <div className="font-medium text-gray-800">{insight.title}</div>
                      <div className="text-sm text-gray-600 mt-0.5">{insight.detail}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
              <div className="text-sm font-medium text-purple-700 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                คำแนะนำ
              </div>
              <ul className="space-y-2">
                {insightData.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-500 mt-0.5">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Chat Section Toggle */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-full mt-4 py-3 border-t flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium">ถาม AI CFO</span>
          {showChat ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Chat Section */}
        {showChat && (
          <div className="mt-4 border rounded-xl overflow-hidden">
            {/* Chat Messages */}
            <div className="h-64 overflow-y-auto p-3 bg-gray-50 space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  พิมพ์คำถามเกี่ยวกับการเงินของคุณ
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-white border text-gray-700'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border p-3 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-white border-t flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="ถามอะไรก็ได้เกี่ยวกับการเงิน..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
              <button
                onClick={sendChatMessage}
                disabled={isChatLoading || !inputMessage.trim()}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
