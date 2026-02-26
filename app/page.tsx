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
import { Calendar, Users, ShoppingCart, TrendingUp, Loader2, RefreshCw, PageIcon } from 'lucide-react';
import { DateRangePicker } from '@/components/date-range-picker';
import { Button } from '@/components/ui/button';

interface SummaryData {
  newUsers: number;
  newUsersChange: number;
  dau: number;
  visitors: number;
  visitorChange: number;
  purchases: {
    total: number;
    monthly: number;
    annual: number;
    lifetime: number;
    unknown: number;
  };
  conversionRate: string;
  pageviews: number;
  bounceRate: number;
  avgTime: number;
}

interface ChartData {
  newUsers: { date: string; count: number }[];
  activeUsers: { date: string; count: number }[];
  purchases: { date: string; count: number }[];
}

interface RangeData {
  startAt: number;
  endAt: number;
  days: number;
  label: string;
}

interface DataResponse {
  summary: SummaryData;
  charts: ChartData;
  range: RangeData;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState({ range: '7' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/umami?range=${timeRange.range}`;
      if (timeRange.startAt && timeRange.endAt) {
        url += `&startAt=${timeRange.startAt}&endAt=${timeRange.endAt}`;
      }
      
      const res = await fetch(url);
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

  const { summary, charts, range } = data;

  const purchaseData = [
    { name: '月度', value: summary.purchases.monthly },
    { name: '年度', value: summary.purchases.annual },
    { name: '终身', value: summary.purchases.lifetime },
    { name: '未分类', value: summary.purchases.unknown },
  ].filter((d) => d.value > 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">EchoPie 数据仪表盘</h1>
            <p className="text-gray-500 mt-1">
              {range.label} • {range.days} 天数据
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker
              value={timeRange}
              onChange={setTimeRange}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              className="bg-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
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

          {/* Active Users */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">活跃用户</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{summary.visitors}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp
                    className={`w-4 h-4 ${
                      summary.visitorChange >= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      summary.visitorChange >= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  >
                    {summary.visitorChange >= 0 ? '+' : ''}
                    {summary.visitorChange}%
                  </span>
                  <span className="text-gray-400 text-sm">较上期</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Pageviews */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">页面浏览量</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{summary.pageviews.toLocaleString()}</p>
                <p className="text-sm text-gray-400 mt-2">{range.label}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <PageIcon className="w-6 h-6 text-purple-600" />
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
                    tickFormatter={formatDate}
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
                    labelFormatter={(label) => formatDate(label as string)}
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
                    tickFormatter={formatDate}
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
                    labelFormatter={(label) => formatDate(label as string)}
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
                    tickFormatter={formatDate}
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
                    labelFormatter={(label) => formatDate(label as string)}
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
              <div className="flex justify-center gap-4 mt-2 flex-wrap">
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">访问质量指标</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">平均访问时长</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Math.floor(summary.avgTime / 60)}m {summary.avgTime % 60}s
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">跳出率</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.bounceRate}%
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">购买转化</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.conversionRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          数据来自 Umami Analytics • ubm.echopie.com • 自动刷新
        </div>
      </div>
    </div>
  );
}
