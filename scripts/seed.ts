import { PrismaClient } from '@prisma/client';
import { getProducts } from '../lib/data';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Get mock data from existing data file
  const products = await getProducts();

  // Clear existing data
  await prisma.product.deleteMany();
  console.log('Deleted existing records.');

  // Insert products
  for (const product of products) {
    await prisma.product.create({
      data: {
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        images: JSON.stringify(product.images), // Convert array to JSON string
        basePrice: product.basePrice,
        currentPrice: product.currentPrice,
        discount: product.discount,
        rating: product.rating,
        reviewCount: product.reviewCount,
        trustScore: product.trustScore,
        specs: JSON.stringify(product.specs),
        priceHistory: JSON.stringify(product.priceHistory),
        sellers: JSON.stringify(product.sellers),
        tags: JSON.stringify(product.tags),
      },
    });
  }

  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
