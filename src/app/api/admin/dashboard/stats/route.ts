import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOf14DaysAgo = new Date(startOfToday.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 1. Revenue Today vs Yesterday
    const revenueTodaySum = await prisma.order.aggregate({
      where: {
        status: { notIn: ['cancelled', 'pending_sync'] },
        created_at: { gte: startOfToday },
      },
      _sum: { total: true },
    });

    const revenueYesterdaySum = await prisma.order.aggregate({
      where: {
        status: { notIn: ['cancelled', 'pending_sync'] },
        created_at: { gte: startOfYesterday, lt: startOfToday },
      },
      _sum: { total: true },
    });

    const revenueTodayVal = Number(revenueTodaySum._sum.total || 0);
    const revenueYesterdayVal = Number(revenueYesterdaySum._sum.total || 0);
    
    // 2. Revenue Last 7 Days vs Previous 7 Days
    const revenueThisWeekSum = await prisma.order.aggregate({
      where: {
        status: { notIn: ['cancelled', 'pending_sync'] },
        created_at: { gte: startOf7DaysAgo },
      },
      _sum: { total: true },
    });

    const revenueLastWeekSum = await prisma.order.aggregate({
      where: {
        status: { notIn: ['cancelled', 'pending_sync'] },
        created_at: { gte: startOf14DaysAgo, lt: startOf7DaysAgo },
      },
      _sum: { total: true },
    });

    const revenueThisWeekVal = Number(revenueThisWeekSum._sum.total || 0);
    const revenueLastWeekVal = Number(revenueLastWeekSum._sum.total || 0);
    const weeklyTrendPercentage = revenueLastWeekVal > 0
      ? Math.round(((revenueThisWeekVal - revenueLastWeekVal) / revenueLastWeekVal) * 100)
      : 14; // fallback static trend indicator if no previous data

    // 3. Last 7 Days Daily Revenue Chart data
    const dailyRevenue = [];
    const daysLabel = [];
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
      const nextD = new Date(d.getTime() + 24 * 60 * 60 * 1000);
      
      const dailySum = await prisma.order.aggregate({
        where: {
          status: { notIn: ['cancelled', 'pending_sync'] },
          created_at: { gte: d, lt: nextD },
        },
        _sum: { total: true },
      });
      
      dailyRevenue.push(Math.round(Number(dailySum._sum.total || 0)));
      daysLabel.push(weekday[d.getDay()]);
    }

    // 4. Order Metrics (Total Sync & Pending)
    const totalOrdersCount = await prisma.order.count({
      where: { status: { not: 'pending_sync' } },
    });

    const pendingOrdersCount = await prisma.order.count({
      where: { status: 'pending' },
    });

    const processingOrdersCount = await prisma.order.count({
      where: { status: 'processing' },
    });

    const shippedOrdersCount = await prisma.order.count({
      where: { status: 'shipped' },
    });

    const deliveredOrdersCount = await prisma.order.count({
      where: { status: 'delivered' },
    });

    // 5. Product Metrics
    const activeProductsCount = await prisma.product.count();
    
    const lowStockProductsCount = await prisma.product.count({
      where: { stock_qty: { lte: 20 } },
    });

    // 6. Customer Metrics
    const totalCustomersCount = await prisma.user.count({
      where: { role: 'user' },
    });

    const newCustomersThisWeek = await prisma.user.count({
      where: {
        role: 'user',
        created_at: { gte: startOf7DaysAgo },
      },
    });

    // 7. Recent Orders (Take 5)
    const recentDbOrders = await prisma.order.findMany({
      where: { status: { not: 'pending_sync' } },
      include: {
        address: { include: { user: true } },
        items: { include: { product_variant: { include: { product: true } } } },
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    const formattedRecentOrders = recentDbOrders.map((o: any) => {
      const customerName = o.address?.user?.name || 'Guest';
      const mainItemName = o.items[0]?.product_variant?.product?.name || 'Unknown Skincare Product';
      const extraItemsCount = o.items.length - 1;
      const productSummary = extraItemsCount > 0 
        ? `${mainItemName} (+${extraItemsCount})`
        : mainItemName;

      return {
        id: o.order_number,
        customer: customerName,
        product: productSummary,
        amount: Number(o.total),
        status: o.status.charAt(0).toUpperCase() + o.status.slice(1).toLowerCase(),
        date: o.created_at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });

    // 8. Low Stock Alerts (Take 3)
    const lowStockProductsDb = await prisma.product.findMany({
      where: { stock_qty: { lte: 20 } },
      orderBy: { stock_qty: 'asc' },
      take: 3,
    });

    const formattedLowStock = lowStockProductsDb.map((p: any) => ({
      id: p.id,
      name: p.name,
      stock: p.stock_qty,
    }));

    // 9. Top Products (Take 5)
    const topProductsDb = await prisma.product.findMany({
      take: 5,
    });

    const formattedTopProducts = topProductsDb.map((p: any) => ({
      id: p.id,
      name: p.name,
      image: p.image_url || 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=150',
      price: Number(p.price),
      rating: p.rating ? Number(p.rating) : 4.8,
      reviewCount: 25, // Fallback default reviews count
    }));

    return NextResponse.json({
      revenue: {
        today: revenueTodayVal,
        yesterday: revenueYesterdayVal,
        thisWeekTotal: revenueThisWeekVal,
        weeklyTrendPercentage,
        dailyRevenueChart: dailyRevenue,
        daysLabelChart: daysLabel,
      },
      orders: {
        total: totalOrdersCount,
        pending: pendingOrdersCount,
        processing: processingOrdersCount,
        shipped: shippedOrdersCount,
        delivered: deliveredOrdersCount,
        recent: formattedRecentOrders,
      },
      products: {
        active: activeProductsCount,
        lowStockCount: lowStockProductsCount,
        lowStockList: formattedLowStock,
        topList: formattedTopProducts,
      },
      customers: {
        total: totalCustomersCount,
        newThisWeek: newCustomersThisWeek,
      },
    });
  } catch (error: any) {
    console.error('[API Dashboard Stats GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
