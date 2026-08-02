import { prisma } from '../src/lib/prisma';
import { brands as staticBrands, products as staticProducts, categories as staticCategories } from '../src/data/products';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Brands
  console.log('Seeding brands...');
  for (const b of staticBrands) {
    await prisma.brand.upsert({
      where: { id: b.id },
      update: {
        name: b.name,
        slug: b.id,
        logo: b.logo,
        description: b.description,
      },
      create: {
        id: b.id,
        name: b.name,
        slug: b.id,
        logo: b.logo,
        description: b.description,
      },
    });
  }

  // 2. Seed Categories
  console.log('Seeding categories...');
  for (const catName of staticCategories) {
    const catSlug = slugify(catName);
    await prisma.category.upsert({
      where: { slug: catSlug },
      update: {
        name: catName,
      },
      create: {
        id: catSlug,
        name: catName,
        slug: catSlug,
      },
    });
  }

  // 3. Seed Products
  console.log('Seeding products, variants, and images...');
  for (const p of staticProducts) {
    const prodSlug = slugify(p.name);
    const catSlug = slugify(p.category);
    const mainSku = p.variants[0]?.sku || `SKU-${p.id}`;

    // Upsert Product
    const product = await prisma.product.upsert({
      where: { slug: prodSlug },
      update: {
        name: p.name,
        brand_id: p.brand,
        category_id: catSlug,
        description: p.description,
        ingredients: p.inciList,
        how_to_use: p.usageSteps.join('\n'),
        skin_type_tags: p.skinTypes,
        price: p.price,
        discount_price: p.discountPrice || p.price,
        sku: mainSku,
        stock_qty: p.stock,
        is_featured: p.isBestseller || p.isNew,
      },
      create: {
        id: String(p.id),
        name: p.name,
        slug: prodSlug,
        brand_id: p.brand,
        category_id: catSlug,
        description: p.description,
        ingredients: p.inciList,
        how_to_use: p.usageSteps.join('\n'),
        skin_type_tags: p.skinTypes,
        price: p.price,
        discount_price: p.discountPrice || p.price,
        sku: mainSku,
        stock_qty: p.stock,
        is_featured: p.isBestseller || p.isNew,
      },
    });

    // Delete existing variants and images to prevent duplicates when re-seeding
    await prisma.productVariant.deleteMany({ where: { product_id: product.id } });
    await prisma.productImage.deleteMany({ where: { product_id: product.id } });

    // Seed Variants
    for (const v of p.variants) {
      await prisma.productVariant.create({
        data: {
          product_id: product.id,
          size: v.label,
          sku: v.sku,
          price: v.price || p.price,
          stock_qty: v.stock || p.stock,
          image: p.image,
        },
      });
    }

    // Seed Images
    const allImages = [p.image, ...(p.productImages || []).filter((img) => img !== p.image)];
    for (let i = 0; i < allImages.length; i++) {
      const isMainImage = i === 0;
      const altText = isMainImage
        ? `${p.name} - Beauty Glowry`
        : `${p.name} Gallery ${i} - Beauty Glowry`;
      await prisma.productImage.create({
        data: {
          product_id: product.id,
          url: allImages[i],
          alt_text: altText,
          position: i,
        },
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
