import { db } from './src/firebase/config.js';
import { collection, getDocs, updateDoc, doc, deleteField } from 'firebase/firestore';

async function cleanupProducts() {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  
  console.log(`Cleaning up ${snapshot.size} products...`);
  
  for (const productDoc of snapshot.docs) {
    const productRef = doc(db, 'products', productDoc.id);
    await updateDoc(productRef, {
      rating: deleteField(),
      reviews: deleteField()
    });
    console.log(`Cleaned up: ${productDoc.data().name}`);
  }
  console.log('Cleanup complete!');
}

cleanupProducts();
