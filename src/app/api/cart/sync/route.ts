import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

// Helper to authenticate user and return user ID
function getUserIdFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const tokenSecret = process.env.NEXTAUTH_SECRET || 'beautyglowry-auth-secret-key-123456';
  try {
    const decoded: any = jwt.verify(token, tokenSecret);
    return decoded.id;
  } catch (e) {
    return null;
  }
}

// GET handler: retrieve user's DB cart and wishlist
export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Cart
    const dbCart = await prisma.cart.findFirst({
      where: { user_id: userId },
      include: {
        items: {
          include: {
            product_variant: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { position: 'asc' } },
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 2. Fetch Wishlist
    const dbWishlist = await prisma.wishlist.findMany({
      where: { user_id: userId },
    });

    // 3. Format Response
    const formattedCart = dbCart ? dbCart.items.map((item: any) => {
      const pv = item.product_variant;
      const prod = pv.product;
      const mainImage = prod.images?.[0]?.url || '';
      return {
        id: `${prod.id}-${pv.id}`,
        product: {
          id: prod.id,
          name: prod.name,
          image: mainImage,
          price: Number(prod.price),
          discount_price: prod.discount_price ? Number(prod.discount_price) : undefined,
          category: prod.category?.name || 'Uncategorized',
        },
        variant: {
          id: pv.id,
          label: pv.size || 'Standard',
          sku: pv.sku,
          size: pv.size,
          price: pv.price ? Number(pv.price) : undefined,
        },
        quantity: item.quantity,
      };
    }) : [];

    const formattedWishlist = dbWishlist.map((w: any) => w.product_id);

    return NextResponse.json({
      success: true,
      cart: formattedCart,
      wishlist: formattedWishlist,
    });
  } catch (error: any) {
    console.error('API Cart Sync GET Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST handler: merge or overwrite DB cart and wishlist
export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cart = [], wishlist = [], merge = false } = await request.json();

    // 1. Get or create Cart for the user
    let dbCart = await prisma.cart.findFirst({
      where: { user_id: userId },
    });

    if (!dbCart) {
      dbCart = await prisma.cart.create({
        data: {
          user_id: userId,
          session_id: `session-${userId}`,
        },
      });
    }

    if (merge) {
      // --- MERGE MODE (on login) ---
      // Sync Cart Items
      const existingItems = await prisma.cartItem.findMany({
        where: { cart_id: dbCart.id },
      });

      for (const clientItem of cart) {
        let variantId = clientItem.variant?.id;
        if (!variantId) {
          // Fallback: get first product variant
          const pv = await prisma.productVariant.findFirst({
            where: { product_id: clientItem.product.id },
          });
          variantId = pv?.id;
        }

        if (!variantId) continue;

        const existing = existingItems.find(
          (item: any) => item.product_variant_id === variantId
        );

        if (existing) {
          // Keep the higher quantity or sum them
          const newQty = Math.max(existing.quantity, clientItem.quantity);
          await prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: newQty },
          });
        } else {
          await prisma.cartItem.create({
            data: {
              cart_id: dbCart.id,
              product_variant_id: variantId,
              quantity: clientItem.quantity,
            },
          });
        }
      }

      // Sync Wishlist Items
      const existingWishlist = await prisma.wishlist.findMany({
        where: { user_id: userId },
      });

      for (const productId of wishlist) {
        const exists = existingWishlist.some((w: any) => w.product_id === productId);
        if (!exists) {
          await prisma.wishlist.create({
            data: {
              user_id: userId,
              product_id: productId,
            },
          });
        }
      }
    } else {
      // --- SYNCHRONIZE OVERWRITE MODE ---
      await prisma.$transaction(async (tx: any) => {
        // Overwrite Cart
        await tx.cartItem.deleteMany({
          where: { cart_id: dbCart!.id },
        });

        for (const clientItem of cart) {
          let variantId = clientItem.variant?.id;
          if (!variantId) {
            const pv = await tx.productVariant.findFirst({
              where: { product_id: clientItem.product.id },
            });
            variantId = pv?.id;
          }

          if (variantId) {
            await tx.cartItem.create({
              data: {
                cart_id: dbCart!.id,
                product_variant_id: variantId,
                quantity: clientItem.quantity,
              },
            });
          }
        }

        // Overwrite Wishlist
        await tx.wishlist.deleteMany({
          where: { user_id: userId },
        });

        for (const productId of wishlist) {
          await tx.wishlist.create({
            data: {
              user_id: userId,
              product_id: productId,
            },
          });
        }
      });
    }

    // 2. Fetch and return updated final state
    const finalCart = await prisma.cart.findFirst({
      where: { user_id: userId },
      include: {
        items: {
          include: {
            product_variant: {
              include: {
                product: {
                  include: {
                    images: { orderBy: { position: 'asc' } },
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const finalWishlist = await prisma.wishlist.findMany({
      where: { user_id: userId },
    });

    const formattedCart = finalCart ? finalCart.items.map((item: any) => {
      const pv = item.product_variant;
      const prod = pv.product;
      const mainImage = prod.images?.[0]?.url || '';
      return {
        id: `${prod.id}-${pv.id}`,
        product: {
          id: prod.id,
          name: prod.name,
          image: mainImage,
          price: Number(prod.price),
          discount_price: prod.discount_price ? Number(prod.discount_price) : undefined,
          category: prod.category?.name || 'Uncategorized',
        },
        variant: {
          id: pv.id,
          label: pv.size || 'Standard',
          sku: pv.sku,
          size: pv.size,
          price: pv.price ? Number(pv.price) : undefined,
        },
        quantity: item.quantity,
      };
    }) : [];

    const formattedWishlist = finalWishlist.map((w: any) => w.product_id);

    return NextResponse.json({
      success: true,
      cart: formattedCart,
      wishlist: formattedWishlist,
    });
  } catch (error: any) {
    console.error('API Cart Sync POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
