import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { logAdminAction } from '../../../../lib/audit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const p = await prisma.product.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id },
        ],
      },
      include: {
        brand: true,
        category: true,
        variants: true,
        images: {
          orderBy: { position: 'asc' },
        },
        reviews: {
          include: {
            user: true,
          },
          orderBy: { created_at: 'desc' },
        },
        qnas: {
          include: {
            user: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!p) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const reviewsData = p.reviews || [];
    const reviewCount = reviewsData.length;
    const averageRating = reviewCount > 0
      ? Number((reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
      : 5.0;

    const formattedProduct = {
      id: isNaN(Number(p.id)) ? p.id : Number(p.id),
      name: p.name,
      brand: p.brand_id || 'beauty-glowry',
      brandInfo: p.brand ? { name: p.brand.name, logo: p.brand.logo } : null,
      category: p.category?.name || 'Uncategorized',
      price: Number(p.price),
      originalPrice: Number(p.discount_price || p.price),
      discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
      image: p.images[0]?.url || '',
      stock: p.stock_qty,
      rating: averageRating,
      reviewCount: reviewCount,
      isBestseller: p.is_featured,
      isNew: p.is_featured,
      isActive: p.is_active,
      isFreeDelivery: p.is_free_delivery,
      description: p.description || '',
      actives: [],
      skinTypes: p.skin_type_tags,
      concerns: p.skin_type_tags,
      inciList: p.ingredients || '',
      usageSteps: p.how_to_use ? p.how_to_use.split('\n') : [],
      variants: p.variants.map((v) => ({
        id: v.id,
        label: v.size || 'Standard',
        sku: v.sku,
        stock: v.stock_qty,
        price: Number(v.price || p.price),
      })),
      productImages: p.images.map((img) => img.url),
      size: p.variants[0]?.size || '30ml',
      reviews: reviewsData.map((r: any) => ({
        id: r.id,
        name: r.user?.name || 'Glowry Customer',
        rating: r.rating,
        text: r.comment || '',
        date: r.created_at.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        verified: r.verified_purchase,
      })),
      qnas: (p.qnas || []).map((q: any) => ({
        id: q.id,
        question: q.question,
        answer: q.answer || null,
        askedBy: q.user?.name || 'Customer',
        date: q.created_at.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      })),
    };

    return NextResponse.json(formattedProduct);
  } catch (error: any) {
    console.error('[API Product GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const p = await prisma.product.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id },
        ],
      },
      include: {
        images: true,
      },
    });

    if (!p) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const slug = data.name ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : p.slug;

    let catSlug = p.category_id;
    if (data.category) {
      const newCatSlug = data.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      catSlug = newCatSlug;
      await prisma.category.upsert({
        where: { slug: newCatSlug },
        update: { name: data.category },
        create: { id: newCatSlug, name: data.category, slug: newCatSlug },
      });
    }

    // Update product properties
    const updatedProduct = await prisma.product.update({
      where: { id: p.id },
      data: {
        name: data.name ?? p.name,
        slug,
        brand_id: data.brand ?? p.brand_id,
        category_id: catSlug,
        description: data.description ?? p.description,
        ingredients: data.inciList ?? p.ingredients,
        how_to_use: data.usageSteps ? (Array.isArray(data.usageSteps) ? data.usageSteps.join('\n') : data.usageSteps) : p.how_to_use,
        skin_type_tags: data.skinTypes ? (Array.isArray(data.skinTypes) ? data.skinTypes : data.skinTypes.split(',').map((s: string) => s.trim())) : p.skin_type_tags,
        price: data.price ?? p.price,
        discount_price: data.originalPrice ?? p.discount_price,
        stock_qty: data.stock ?? p.stock_qty,
        is_featured: data.isBestseller ?? data.is_featured,
        is_active: data.isActive !== undefined ? data.isActive : p.is_active,
        is_free_delivery: data.isFreeDelivery !== undefined ? data.isFreeDelivery : p.is_free_delivery,
      },
    });

    // Update Product Images (Main and Gallery)
    if (data.image || data.productImages) {
      await prisma.productImage.deleteMany({ where: { product_id: p.id } });
      
      const imagesToCreate = [];
      const mainImg = data.image || p.images[0]?.url;
      if (mainImg) {
        imagesToCreate.push({
          product_id: p.id,
          url: mainImg,
          alt_text: `${data.name || p.name} - Beauty Glowry`,
          position: 0,
        });
      }

      const galleryImgs = data.productImages || [];
      if (Array.isArray(galleryImgs)) {
        galleryImgs.forEach((imgUrl: string, idx: number) => {
          if (imgUrl && imgUrl !== mainImg) {
            imagesToCreate.push({
              product_id: p.id,
              url: imgUrl,
              alt_text: `${data.name || p.name} Gallery ${idx + 1} - Beauty Glowry`,
              position: idx + 1,
            });
          }
        });
      }

      if (imagesToCreate.length > 0) {
        await prisma.productImage.createMany({
          data: imagesToCreate,
        });
      }
    }

    // If variants array is provided, recreate them
    if (data.variants && Array.isArray(data.variants)) {
      await prisma.productVariant.deleteMany({ where: { product_id: p.id } });
      for (const v of data.variants) {
        await prisma.productVariant.create({
          data: {
            product_id: p.id,
            size: v.label || v.size,
            sku: v.sku || `${slug.slice(0, 3).toUpperCase()}-${(v.label || v.size || 'std').toUpperCase()}`,
            price: v.price || data.price || p.price,
            stock_qty: v.stock || data.stock || p.stock_qty,
            image: data.image || p.sku, // fallback
          },
        });
      }
    }

    await logAdminAction(
      'UPDATE_PRODUCT',
      `Product "${updatedProduct.name}" was modified.`
    );

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error('[API Product PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const p = await prisma.product.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id },
        ],
      },
    });

    if (!p) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: p.id },
    });

    await logAdminAction(
      'DELETE_PRODUCT',
      `Product "${p.name}" (SKU: ${p.sku}) was deleted.`
    );

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('[API Product DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
