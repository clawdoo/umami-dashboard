'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Calendar, Users, ShoppingCart, TrendingUp, Loader2 } from 'lucide-react';

interface SummaryData {
  newUsers: number;
  newUsersChange: number;
  dau: number;
  wau: number;
  mau: number;
  dauMauRatio: number;
  purchases: {
    total: number;
    monthly: number;
    annual: number;
    lifetime: number;
    unknown: number;
  };
  conversionRate: string;
}

interface ChartData {
  newUsers: { date: string; count: number }[];
  activeUsers: { date: string; count: number }[];
  purchases: { date: string; count: number }[];
}

interface DataResponse {
  summary: SummaryData;
  charts: ChartData;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [range]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/umami?range=${range}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">加载数据中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-lg">错误: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, charts } = data;

  const purchaseData = [
    { name: '月度', value: summary.purchases.monthly },
    { name: '年度', value: summary.purchases.annual },
    { name: '终身', value: summary.purchases.lifetime },
    { name: '未分类', value: summary.purchases.unknown },
  ].filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">EchoPie 数据仪表盘</h1>
            <p className="text-gray-500 mt-1">Umami 数据分析 • 实时更新</p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
            {[
              { value: '7', label: '7天' },
              { value: '30', label: '30天' },
              { value: '90', label: '90天' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  range === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* New Users */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">新用户</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {summary.newUsers}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp
                    className={`w-4 h-4 ${
                      summary.newUsersChange >= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      summary.newUsersChange >= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  >
                    {summary.newUsersChange >= 0 ? '+' : ''}
                    {summary.newUsersChange}%
                  </span>
                  <span className="text-gray-400 text-sm">较上期</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* DAU */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">日活跃用户 (DAU)</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{summary.dau}</p>
                <p className="text-sm text-gray-400 mt-2">今日活跃</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* WAU */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">周活跃用户 (WAU)</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{summary.wau}</p>
                <p className="text-sm text-gray-400 mt-2">近7天</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Purchases */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">购买订单</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {summary.purchases.total}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  转化率 {summary.conversionRate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* New Users Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">新用户趋势</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.newUsers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => value.slice(5)}
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Users Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">活跃用户趋势</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.activeUsers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => value.slice(5)}
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Purchases Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">购买趋势</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.purchases}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => value.slice(5)}
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Purchase Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">购买类型分布</h3>
            <div className="h-72">
              {purchaseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={purchaseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {purchaseData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  暂无购买数据
                </div>
              )}
            </div>
            {purchaseData.length > 0 && (
              <div className="flex justify-center gap-4 mt-2">
                {purchaseData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">关键指标</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">DAU/MAU 比率</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.dauMauRatio}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {summary.dauMauRatio > 30
                  ? '粘性良好'
                  : summary.dauMauRatio > 15
                  ? '需关注'
                  : '警告'}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">月活跃用户</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.mau}</p>
              <p className="text-xs text-gray-400 mt-1">近30天</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">购买转化</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.conversionRate}%
              </p>
              <p className="text-xs text-gray-400 mt-1">基于DAU</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          数据来自 Umami Analytics • ubm.echopie.com
        </div>
      </div>
    </div>
  );
}
