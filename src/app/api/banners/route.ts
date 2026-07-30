import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    // Auto-seed default hero banners if empty
    const count = await prisma.banner.count();
    if (count === 0) {
      await prisma.banner.createMany({
        data: [
          {
            title: 'Precision Clinical Skincare',
            image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=2000&auto=format&fit=crop',
            link: '/products',
            position: 'hero_slider',
            is_active: true,
          },
          {
            title: '100% Formulation Transparency',
            image: 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=2000&auto=format&fit=crop',
            link: '/products',
            position: 'hero_slider',
            is_active: true,
          },
        ],
      });
    }

    const banners = await prisma.banner.findMany({
      where: { is_active: true },
    });

    return NextResponse.json(banners);
  } catch (error: any) {
    console.error('API Banners GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
