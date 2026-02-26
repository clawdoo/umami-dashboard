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
  Funnel,
  FunnelChart,
  LabelList,
} from 'recharts';
import { 
  Calendar, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Loader2, 
  RefreshCw, 
  Bell,
  Crown,
  GraduationCap,
  Star,
  Cloud,
  Smartphone
} from 'lucide-react';
import { DateRangePicker } from '@/components/date-range-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataResponse {
  summary: {
    appLaunches: number;
    newUsers: number;
    newUsersChange: number;
    activeUsers: number;
    visitors: number;
    visitorChange: number;
    vipUsers: number;
    annualVip: number;
    lifetimeVip: number;
    alarmsAdded: number;
    alarmsEdited: number;
    alarmsDeleted: number;
    purchaseFunnel: {
      clicks: number;
      success: number;
      failed: number;
      cancel: number;
      conversionRate: string;
    };
    onboarding: {
      appear: number;
      skip: number;
      complete: number;
      completionRate: string;
    };
    ratingShown: number;
    iclickCloud: number;
    pageviews: number;
    bounceRate: number;
    avgTime: number;
  };
  charts: any;
  breakdown: {
    alarmTypes: { name: string; value: number }[];
    purchaseClicks: { annual: number; lifetime: number };
  };
  range: any;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Dashboard() {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState({ range: '7' });

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  async function fetchData() {
    setLoading(true);
    let url = `/api/umami?range=${timeRange.range}`;
    if (timeRange.startAt && timeRange.endAt) {
      url += `&startAt=${timeRange.startAt}&endAt=${timeRange.endAt}`;
    }
    
    const res = await fetch(url);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const { summary, charts, breakdown, range } = data;

  // 购买漏斗数据
  const funnelData = [
    { name: '点击购买', value: summary.purchaseFunnel.clicks, fill: '#3b82f6' },
    { name: '购买成功', value: summary.purchaseFunnel.success, fill: '#10b981' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">AlarmOne 数据仪表盘</h1>
            </div>
            <p className="text-gray-500 mt-1">
              {range.label} • {summary.visitors.toLocaleString()} 访客
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker value={timeRange} onChange={setTimeRange} />
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="App 启动"
            value={summary.appLaunches}
            icon={Smartphone}
            color="blue"
            trend={summary.visitorChange}
          />
          <MetricCard
            title="新用户"
            value={summary.newUsers}
            icon={Users}
            color="green"
            trend={summary.newUsersChange}
          />
          <MetricCard
            title="VIP 用户"
            value={summary.vipUsers}
            icon={Crown}
            color="amber"
            subtitle={`年度 ${summary.annualVip} / 终身 ${summary.lifetimeVip}`}
          />
          <MetricCard
            title="购买转化"
            value={`${summary.purchaseFunnel.conversionRate}%`}
            icon={ShoppingCart}
            color="purple"
            subtitle={`${summary.purchaseFunnel.success} 单成功`}
          />
        </div>

        {/* 核心功能：闹钟 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              核心功能：闹钟管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">新增闹钟</p>
                <p className="text-3xl font-bold text-blue-600">{summary.alarmsAdded}</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-gray-500">编辑闹钟</p>
                <p className="text-3xl font-bold text-amber-600">{summary.alarmsEdited}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-500">删除闹钟</p>
                <p className="text-3xl font-bold text-red-600">{summary.alarmsDeleted}</p>
              </div>
            </div>
            
            {/* 闹钟类型分布 */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown.alarmTypes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 转化漏斗 + Onboarding */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 购买漏斗 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /
                
                购买转化漏斗
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip />
                    <Funnel
                      dataKey="value"
                      data={funnelData}
                      isAnimationActive
                    >
                      <LabelList position="inside" fill="#fff" stroke="none" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500">失败</p>
                  <p className="text-lg font-semibold text-red-600">{summary.purchaseFunnel.failed}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500">取消</p>
                  <p className="text-lg font-semibold text-amber-600">{summary.purchaseFunnel.cancel}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-500">转化率</p>
                  <p className="text-lg font-semibold text-blue-600">{summary.purchaseFunnel.conversionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" /
                
                新用户引导
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>展示引导</span>
                  <span className="font-bold">{summary.onboarding.appear}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <span>跳过引导</span>
                  <span className="font-bold text-red-600">{summary.onboarding.skip}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span>完成引导</span>
                  <span className="font-bold text-green-600">{summary.onboarding.complete}</span>
                </div>
                <div className="p-4 bg-blue-50 rounded text-center">
                  <p className="text-sm text-gray-600">引导完成率</p>
                  <p className="text-4xl font-bold text-blue-600">{summary.onboarding.completionRate}%</p>
                </div>
              </div>            
            </CardContent>
          </Card>
        </div>

        {/* 趋势图表 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>数据趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.appLaunches}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(v) => new Date(v).toLocaleDateString('zh-CN', {month: 'short', day: 'numeric'})}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(v) => new Date(v).toLocaleDateString('zh-CN')}
                  />
                  <Line type="monotone" dataKey="count" name="App启动" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 其他指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat title="评分弹窗" value={summary.ratingShown} icon={Star} />
          <MiniStat title="iCloud点击" value={summary.iclickCloud} icon={Cloud} />
          <MiniStat title="年度点击" value={breakdown.purchaseClicks.annual} icon={Crown} />
          <MiniStat title="终身点击" value={breakdown.purchaseClicks.lifetime} icon={Crown} />
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          AlarmOne Analytics • https://echopie.com
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, trend, subtitle }: any) {
  const colors: any = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`w-4 h-4 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trend >= 0 ? '+' : ''}{trend}%
                </span>
              </div>
            )}
            {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ title, value, icon: Icon }: any) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
