import { prisma } from '../src/lib/prisma';
import { brands as staticBrands, products as staticProducts, categories as staticCategories } from '../src/data/products';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function mapConcernsToTags(concerns: string[]): string[] {
  const mapping: Record<string, string> = {
    "Acne & Blemishes": "Acne",
    "Dullness & Uneven Tone": "Brightening",
    "Enlarged Pores": "Pores",
    "Blackheads & Pores": "Pores",
    "Excess Sebum": "Oiliness",
    "Aging & Fine Lines": "Aging",
    "Hyperpigmentation & Dark Spots": "Dark Spots",
    "Redness & Sensitivity": "Sensitive",
    "Dehydration & Dryness": "Hydration",
    "Compromised Barrier": "Sensitive",
    "Fine Lines": "Aging",
    "Dullness": "Brightening",
  };
  return concerns.map(c => mapping[c] || c);
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

  const activeStaticIds = new Set(staticProducts.map((p) => String(p.id)));

  // Clean up any seeded products that are no longer in staticProducts
  const dbProducts = await prisma.product.findMany({
    select: { id: true },
  });

  for (const dbP of dbProducts) {
    if (!isNaN(Number(dbP.id)) && !activeStaticIds.has(dbP.id)) {
      // Check if any variant of this product has associated order items
      const hasOrderItems = await prisma.orderItem.findFirst({
        where: {
          product_variant: {
            product_id: dbP.id,
          },
        },
      });

      if (hasOrderItems) {
        console.log(`Product ID: ${dbP.id} has associated orders. Deactivating instead of deleting.`);
        await prisma.product.update({
          where: { id: dbP.id },
          data: { is_active: false },
        });
      } else {
        console.log(`Cleaning up removed static product ID: ${dbP.id}`);
        await prisma.productVariant.deleteMany({ where: { product_id: dbP.id } });
        await prisma.productImage.deleteMany({ where: { product_id: dbP.id } });
        await prisma.productReview.deleteMany({ where: { product_id: dbP.id } });
        await prisma.productQnA.deleteMany({ where: { product_id: dbP.id } });
        await prisma.product.delete({ where: { id: dbP.id } });
      }
    }
  }

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
        skin_type_tags: Array.from(new Set([...p.skinTypes, ...mapConcernsToTags(p.concerns)])),
        price: p.price,
        discount_price: p.discountPrice || p.price,
        sku: mainSku,
        stock_qty: p.stock,
        is_featured: p.isBestseller || p.isNew,
        is_active: true,
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
        skin_type_tags: Array.from(new Set([...p.skinTypes, ...mapConcernsToTags(p.concerns)])),
        price: p.price,
        discount_price: p.discountPrice || p.price,
        sku: mainSku,
        stock_qty: p.stock,
        is_featured: p.isBestseller || p.isNew,
        is_active: true,
      },
    });

    // Handle variants safely without violating foreign key constraints
    const activeSkus = new Set(p.variants.map((v) => v.sku));
    const existingVariants = await prisma.productVariant.findMany({
      where: { product_id: product.id },
    });

    for (const ev of existingVariants) {
      if (!activeSkus.has(ev.sku)) {
        const hasOrders = await prisma.orderItem.findFirst({
          where: { product_variant_id: ev.id },
        });
        if (!hasOrders) {
          await prisma.productVariant.delete({ where: { id: ev.id } });
        }
      }
    }

    await prisma.productImage.deleteMany({ where: { product_id: product.id } });

    // Seed Variants using upsert
    for (const v of p.variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          size: v.label,
          price: v.price || p.price,
          stock_qty: v.stock || p.stock,
          image: p.image,
        },
        create: {
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
