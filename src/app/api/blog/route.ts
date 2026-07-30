import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    // Auto-seed default clinical skincare articles if empty
    const count = await prisma.blogPost.count();
    if (count === 0) {
      await prisma.blogPost.createMany({
        data: [
          {
            title: 'Understanding Barrier Repair: The Science of Ceramides',
            slug: 'understanding-barrier-repair',
            summary: 'Learn how ceramides protect your skin from moisture loss and external irritants.',
            content: 'Ceramides are lipids (fats) that are naturally found in high concentrations in the uppermost layers of the skin. They make up over 50% of the skins composition, so it’s no surprise they play an essential role in determining how your skin looks and how it responds to environmental threats. Think of ceramides as the mortar between bricks—if your skin cells are the bricks, ceramides hold them together to form a protective barrier that locks in moisture and shields against pollutants, bacteria, and irritants. When ceramide levels decrease (due to aging, weather, or harsh chemicals), the skin barrier becomes compromised, leading to dryness, redness, itching, and irritation. Incorporating clinical ceramide formulations helps replenish these lipids, restoring the barrier and improving hydration levels.',
            cover_image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600',
            author: 'Dr. Sarah Rahman (Derma Specialist)',
            tags: ['Ceramides', 'Barrier Repair', 'Sensitive Skin'],
            is_published: true,
            created_at: new Date('2026-07-20'),
          },
          {
            title: 'Niacinamide: The Multi-Tasking Vitamin Your Skin Needs',
            slug: 'niacinamide-multitasking-vitamin',
            summary: 'From reducing pore size to brightening skin tone, discover why Niacinamide is a dermatologist favorite.',
            content: 'Niacinamide, also known as Vitamin B3, is a water-soluble vitamin that works with the natural substances in your skin to help visibly minimize enlarged pores, tighten lax pores, improve uneven skin tone, soften fine lines and wrinkles, diminish dullness, and strengthen a weakened surface. Niacinamide also reduces the impact of environmental damage because of its ability to improve skin’s barrier, plus it also plays a role in helping skin repair signs of past damage. Left unchecked, this type of daily assault makes skin look older, duller, and less radiant. Niacinamide helps renew and restore the surface of skin against moisture loss and dehydration by helping skin improve its natural production of skin-strengthening ceramides. Clinical concentrations of 10% niacinamide show dramatic improvements in sebum regulation and hyperpigmentation reduction.',
            cover_image: 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=600',
            author: 'Dermatologist Ahmed Kamal',
            tags: ['Niacinamide', 'Pore Control', 'Brightening'],
            is_published: true,
            created_at: new Date('2026-07-25'),
          },
        ],
      });
    }

    const posts = await prisma.blogPost.findMany({
      where: { is_published: true },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(posts);
  } catch (error: any) {
    console.error('API Blog GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { title, slug, content, summary, cover_image, author, tags = [] } = data;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Title, slug, and content are required' }, { status: 400 });
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        summary,
        cover_image,
        author: author || 'Admin',
        tags,
        is_published: true,
        created_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error('API Blog POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
