import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { products } from '../data/products';

export const seedProducts = async () => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("Seeding products to Firestore...");
      for (const product of products) {
        await addDoc(productsRef, {
          ...product,
          createdAt: new Date().toISOString()
        });
      }
      console.log("Seeding complete!");
    } else {
      console.log("Products already exist in Firestore. Skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding products:", error);
  }
};
