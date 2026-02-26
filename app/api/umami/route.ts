import { NextResponse } from 'next/server';

const UMAMI_URL = process.env.UMAMI_URL || 'https://ubm.echopie.com';
const USERNAME = process.env.UMAMI_USERNAME || 'admin';
const PASSWORD = process.env.UMAMI_PASSWORD || 'umami';

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

function getTimestampRange(days: number) {
  const endAt = Date.now();
  const startAt = endAt - days * 24 * 60 * 60 * 1000;
  return { startAt, endAt };
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toISOString().split('T')[0];
}

function getDailyData(events: any[], days: number) {
  const daily: Record<string, number> = {};
  const today = new Date();
  
  // Initialize all days with 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
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
    const range = searchParams.get('range') || '7'; // 7, 30, 90 days
    const days = parseInt(range);
    
    const { startAt, endAt } = getTimestampRange(days);
    const yesterdayStart = startAt - 24 * 60 * 60 * 1000;
    const weekStart = endAt - 7 * 24 * 60 * 60 * 1000;
    const monthStart = endAt - 30 * 24 * 60 * 60 * 1000;
    
    // Fetch all data in parallel
    const [
      newUsersEvents,
      newUsersYesterday,
      activeUsersEvents,
      activeUsersWeek,
      activeUsersMonth,
      purchaseSuccess,
      purchaseAnnualClick,
      purchaseLifetimeClick,
      purchaseMonthlyClick,
    ] = await Promise.all([
      getEvents(startAt, endAt, 'new.user'),
      getEvents(yesterdayStart, startAt, 'new.user'),
      getEvents(startAt, endAt, 'user.daily.active'),
      getEvents(weekStart, endAt, 'user.daily.active'),
      getEvents(monthStart, endAt, 'user.daily.active'),
      getEvents(startAt, endAt, 'setting.purchase.success'),
      getEvents(startAt, endAt, 'setting.purchase.annual.click'),
      getEvents(startAt, endAt, 'setting.purchase.lifetime.click'),
      getEvents(startAt, endAt, 'setting.purchase.monthly.click'),
    ]);
    
    const newUsers = newUsersEvents.data?.length || 0;
    const newUsersPrev = newUsersYesterday.data?.length || 0;
    const dau = activeUsersEvents.data?.length || 0;
    const wau = activeUsersWeek.data?.length || 0;
    const mau = activeUsersMonth.data?.length || 0;
    
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
    const newUsersDaily = getDailyData(newUsersEvents.data || [], days);
    const activeUsersDaily = getDailyData(activeUsersEvents.data || [], days);
    const purchasesDaily = getDailyData(successEvents, days);
    
    return NextResponse.json({
      summary: {
        newUsers,
        newUsersChange: newUsersPrev === 0 ? (newUsers > 0 ? 100 : 0) : 
          Math.round(((newUsers - newUsersPrev) / newUsersPrev) * 100),
        dau,
        wau,
        mau,
        dauMauRatio: mau > 0 ? Math.round((dau / mau) * 100) : 0,
        purchases: {
          total: successEvents.length,
          monthly,
          annual,
          lifetime,
          unknown,
        },
        conversionRate: dau > 0 ? ((successEvents.length / dau) * 100).toFixed(2) : '0.00',
      },
      charts: {
        newUsers: newUsersDaily,
        activeUsers: activeUsersDaily,
        purchases: purchasesDaily,
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
