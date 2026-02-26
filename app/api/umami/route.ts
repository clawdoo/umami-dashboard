import { NextResponse } from 'next/server';

const UMAMI_URL = 'https://ubm.echopie.com';
const USERNAME = 'admin';
const PASSWORD = 'umami';

let cachedToken: string | null = null;
let cachedWebsiteId: string | null = null;

async function login() {
  const res = await fetch(`${UMAMI_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const data = await res.json();
  cachedToken = data.token;
  return cachedToken;
}

async function getToken() {
  if (cachedToken) return cachedToken;
  return login();
}

async function getWebsiteId() {
  if (cachedWebsiteId) return cachedWebsiteId;
  const token = await getToken();
  const res = await fetch(`${UMAMI_URL}/api/websites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  cachedWebsiteId = data.data[0].id;
  return cachedWebsiteId;
}

async function getEvents(startAt: number, endAt: number, eventName?: string) {
  const token = await getToken();
  const websiteId = await getWebsiteId();
  const params = new URLSearchParams({
    startAt: startAt.toString(),
    endAt: endAt.toString(),
    pageSize: '1000',
  });
  if (eventName) params.append('event', eventName);
  
  const res = await fetch(
    `${UMAMI_URL}/api/websites/${websiteId}/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.json();
}

async function getStats(startAt: number, endAt: number) {
  const token = await getToken();
  const websiteId = await getWebsiteId();
  const params = new URLSearchParams({
    startAt: startAt.toString(),
    endAt: endAt.toString(),
  });
  
  const res = await fetch(
    `${UMAMI_URL}/api/websites/${websiteId}/stats?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.json();
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toISOString().split('T')[0];
}

function getDailyData(events: any[], startAt: number, endAt: number) {
  const daily: Record<string, number> = {};
  const start = new Date(startAt);
  const end = new Date(endAt);
  
  // Initialize all days with 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    daily[formatDate(d.getTime())] = 0;
  }
  
  // Count events by day
  events.forEach((event) => {
    const date = formatDate(event.createdAt);
    if (daily[date] !== undefined) {
      daily[date]++;
    }
  });
  
  return Object.entries(daily).map(([date, count]) => ({
    date,
    count,
  }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7'; // 7, 30, 90, today, week, month, 24h
    const customStart = searchParams.get('startAt');
    const customEnd = searchParams.get('endAt');
    
    let startAt: number, endAt: number;
    const now = Date.now();
    
    if (customStart && customEnd) {
      // Custom range
      startAt = parseInt(customStart);
      endAt = parseInt(customEnd);
    } else {
      switch (range) {
        case '24h':
          startAt = now - 24 * 60 * 60 * 1000;
          endAt = now;
          break;
        case 'today':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          startAt = today.getTime();
          endAt = now;
          break;
        case 'week':
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);
          startAt = weekStart.getTime();
          endAt = now;
          break;
        case 'month':
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          startAt = monthStart.getTime();
          endAt = now;
          break;
        default:
          const days = parseInt(range) || 7;
          startAt = now - days * 24 * 60 * 60 * 1000;
          endAt = now;
      }
    }
    
    // Calculate comparison period (same duration before startAt)
    const duration = endAt - startAt;
    const prevStartAt = startAt - duration;
    const prevEndAt = startAt;
    
    // Fetch all data in parallel
    const [
      newUsersEvents,
      newUsersPrev,
      activeUsersEvents,
      purchaseSuccess,
      purchaseAnnualClick,
      purchaseLifetimeClick,
      purchaseMonthlyClick,
      stats,
      prevStats,
    ] = await Promise.all([
      getEvents(startAt, endAt, 'new.user'),
      getEvents(prevStartAt, prevEndAt, 'new.user'),
      getEvents(startAt, endAt, 'user.daily.active'),
      getEvents(startAt, endAt, 'setting.purchase.success'),
      getEvents(startAt, endAt, 'setting.purchase.annual.click'),
      getEvents(startAt, endAt, 'setting.purchase.lifetime.click'),
      getEvents(startAt, endAt, 'setting.purchase.monthly.click'),
      getStats(startAt, endAt),
      getStats(prevStartAt, prevEndAt),
    ]);
    
    const newUsers = newUsersEvents.data?.length || 0;
    const newUsersPrevCount = newUsersPrev.data?.length || 0;
    const dau = activeUsersEvents.data?.length || 0;
    
    // Get visitors from stats as fallback for DAU
    const visitors = stats.visitors?.value || stats.visitors || 0;
    const activeUsers = dau > 0 ? dau : visitors;
    
    // Analyze purchases
    const successEvents = purchaseSuccess.data || [];
    const annualClicks = new Set(purchaseAnnualClick.data?.map((e: any) => e.visitId));
    const lifetimeClicks = new Set(purchaseLifetimeClick.data?.map((e: any) => e.visitId));
    const monthlyClicks = new Set(purchaseMonthlyClick.data?.map((e: any) => e.visitId));
    
    let annual = 0, lifetime = 0, monthly = 0, unknown = 0;
    successEvents.forEach((success: any) => {
      const visitId = success.visitId;
      if (annualClicks.has(visitId)) annual++;
      else if (lifetimeClicks.has(visitId)) lifetime++;
      else if (monthlyClicks.has(visitId)) monthly++;
      else unknown++;
    });
    
    // Get daily breakdown for charts
    const days = Math.ceil((endAt - startAt) / (24 * 60 * 60 * 1000));
    const newUsersDaily = getDailyData(newUsersEvents.data || [], startAt, endAt);
    const activeUsersDaily = getDailyData(activeUsersEvents.data || [], startAt, endAt);
    const purchasesDaily = getDailyData(successEvents, startAt, endAt);
    
    // Calculate changes
    const prevVisitors = prevStats.visitors?.value || prevStats.visitors || 0;
    const visitorChange = prevVisitors > 0 
      ? Math.round(((visitors - prevVisitors) / prevVisitors) * 100)
      : visitors > 0 ? 100 : 0;
    
    const newUserChange = newUsersPrevCount > 0
      ? Math.round(((newUsers - newUsersPrevCount) / newUsersPrevCount) * 100)
      : newUsers > 0 ? 100 : 0;
    
    return NextResponse.json({
      summary: {
        newUsers,
        newUsersChange,
        dau: activeUsers,
        visitors,
        visitorChange,
        purchases: {
          total: successEvents.length,
          monthly,
          annual,
          lifetime,
          unknown,
        },
        conversionRate: visitors > 0 ? ((successEvents.length / visitors) * 100).toFixed(2) : '0.00',
        pageviews: stats.pageviews?.value || stats.pageviews || 0,
        bounceRate: stats.bounces?.value || stats.bounces || 0,
        avgTime: stats.time?.value || stats.time || 0,
      },
      charts: {
        newUsers: newUsersDaily,
        activeUsers: activeUsersDaily,
        purchases: purchasesDaily,
      },
      range: {
        startAt,
        endAt,
        days,
        label: getRangeLabel(range, startAt, endAt),
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Umami data' },
      { status: 500 }
    );
  }
}

function getRangeLabel(range: string, startAt: number, endAt: number): string {
  switch (range) {
    case '24h': return '过去 24 小时';
    case 'today': return '今天';
    case 'week': return '本周';
    case 'month': return '本月';
    default: 
      const days = Math.ceil((endAt - startAt) / (24 * 60 * 60 * 1000));
      return `过去 ${days} 天`;
  }
}
