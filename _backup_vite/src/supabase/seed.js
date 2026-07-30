import { supabase, isSupabaseConfigured } from './config';
import { products } from '../data/products';

export const seedProducts = async () => {
  if (!isSupabaseConfigured) {
    console.log("Supabase not fully configured. Skipping PostgreSQL seed.");
    return;
  }

  try {
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (fetchError) {
      console.warn("Could not check existing products in PostgreSQL:", fetchError.message);
      return;
    }

    if (!existingProducts || existingProducts.length === 0) {
      console.log("Seeding products to PostgreSQL / Supabase...");
      
      const formattedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        original_price: p.originalPrice || p.price,
        category: p.category || 'Skincare',
        image: p.image,
        description: p.description || '',
        stock: p.stock || 50,
        is_new: p.isNew || false,
        is_bestseller: p.isBestseller || false,
        rating: p.rating || 5,
        review_count: p.reviewCount || 0,
        tags: p.tags || []
      }));

      const { error: insertError } = await supabase
        .from('products')
        .insert(formattedProducts);

      if (insertError) {
        console.error("Error inserting products to PostgreSQL:", insertError.message);
      } else {
        console.log("PostgreSQL product seeding complete!");
      }
    } else {
      console.log("Products already exist in PostgreSQL. Skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding products to PostgreSQL:", error);
  }
};
