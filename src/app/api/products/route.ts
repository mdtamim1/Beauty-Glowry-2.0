import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { logAdminAction } from '../../../lib/audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isBestseller = searchParams.get('isBestseller') === 'true';
    const isNew = searchParams.get('isNew') === 'true';
    const concern = searchParams.get('concern');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build Prisma query filters
    const where: any = {};
    
    if (!includeInactive) {
      where.is_active = true;
    }

    if (category && category !== 'All') {
      where.category = {
        name: {
          equals: category,
          mode: 'insensitive',
        },
      };
    }

    if (isBestseller) {
      where.is_featured = true;
    }

    if (concern) {
      where.skin_type_tags = {
        has: concern,
      };
    }

    const dbProducts = await prisma.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
        variants: true,
        images: {
          orderBy: { position: 'asc' },
        },
        reviews: true,
      },
    });

    // Map database structures to match frontend expectations
    const formattedProducts = dbProducts.map((p) => {
      const mainImage = p.images[0]?.url || '';
      const reviewsData = p.reviews || [];
      const reviewCount = reviewsData.length;
      const averageRating = reviewCount > 0
        ? Number((reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
        : 5.0;

      return {
        id: isNaN(Number(p.id)) ? p.id : Number(p.id),
        name: p.name,
        brand: p.brand_id || 'beauty-glowry',
        brandInfo: p.brand ? { name: p.brand.name, logo: p.brand.logo } : null,
        category: p.category?.name || 'Uncategorized',
        price: Number(p.price),
        originalPrice: Number(p.discount_price || p.price),
        discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
        image: mainImage,
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
        concerns: p.skin_type_tags, // mapping as fallback
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
      };
    });

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error('[API Products GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.name || !data.price || !data.image) {
      return NextResponse.json({ error: 'Name, price, and main image are required' }, { status: 400 });
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const catSlug = data.category ? data.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : 'uncategorized';

    // Ensure category exists
    if (data.category) {
      await prisma.category.upsert({
        where: { slug: catSlug },
        update: { name: data.category },
        create: { id: catSlug, name: data.category, slug: catSlug },
      });
    }

    // Ensure brand exists
    const brandId = data.brand || 'beauty-glowry';

    const newProduct = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        brand_id: brandId,
        category_id: catSlug,
        description: data.description,
        ingredients: data.inciList,
        how_to_use: data.usageSteps ? (Array.isArray(data.usageSteps) ? data.usageSteps.join('\n') : data.usageSteps) : '',
        skin_type_tags: [
          ...(data.skinTypes ? (Array.isArray(data.skinTypes) ? data.skinTypes : data.skinTypes.split(',').map((s: string) => s.trim())) : []),
          ...(data.concerns ? (Array.isArray(data.concerns) ? data.concerns : data.concerns.split(',').map((s: string) => s.trim())) : [])
        ].filter(Boolean),
        price: data.price,
        discount_price: data.originalPrice || data.price,
        sku: data.sku || `${slug.slice(0, 3).toUpperCase()}-STD`,
        stock_qty: data.stock || 0,
        is_featured: data.isBestseller || data.isNew || false,
        is_active: data.isActive !== false,
        is_free_delivery: data.isFreeDelivery || false,
      },
    });

    // Create Main Image and Gallery Images in ProductImage
    const imagesToCreate = [];
    if (data.image) {
      imagesToCreate.push({
        product_id: newProduct.id,
        url: data.image,
        alt_text: `${data.name} - Beauty Glowry`,
        position: 0,
      });
    }

    if (data.productImages && Array.isArray(data.productImages)) {
      let galleryCount = 1;
      data.productImages.forEach((imgUrl: string) => {
        if (imgUrl && imgUrl !== data.image) {
          imagesToCreate.push({
            product_id: newProduct.id,
            url: imgUrl,
            alt_text: `${data.name} Gallery ${galleryCount} - Beauty Glowry`,
            position: galleryCount,
          });
          galleryCount++;
        }
      });
    }

    if (imagesToCreate.length > 0) {
      await prisma.productImage.createMany({
        data: imagesToCreate,
      });
    }

    // Create variants if provided
    if (data.variants && Array.isArray(data.variants)) {
      for (const v of data.variants) {
        await prisma.productVariant.create({
          data: {
            product_id: newProduct.id,
            size: v.label || v.size,
            sku: v.sku || `${slug.slice(0, 3).toUpperCase()}-${(v.label || v.size || 'std').toUpperCase()}`,
            price: v.price || data.price,
            stock_qty: v.stock || data.stock,
            image: data.image,
          },
        });
      }
    } else {
      // Default standard variant
      await prisma.productVariant.create({
        data: {
          product_id: newProduct.id,
          size: data.size || '30ml',
          sku: data.sku || `${slug.slice(0, 3).toUpperCase()}-STD`,
          price: data.price,
          stock_qty: data.stock || 0,
          image: data.image,
        },
      });
    }

    await logAdminAction(
      'CREATE_PRODUCT',
      `Product "${newProduct.name}" (SKU: ${newProduct.sku}) was successfully created.`
    );

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error('[API Products POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
