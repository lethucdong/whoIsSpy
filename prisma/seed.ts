// Seed bộ từ khóa vào database (tùy chọn — cần DATABASE_URL).
// Chạy: npm run db:seed

import { PrismaClient } from "@prisma/client";
import { KEYWORD_PAIRS } from "../lib/keywords/data";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${KEYWORD_PAIRS.length} cặp từ khóa...`);
  let created = 0;
  for (const p of KEYWORD_PAIRS) {
    await prisma.keywordPair.upsert({
      where: { civilian_spy: { civilian: p.civilian, spy: p.spy } },
      update: {
        category: p.category,
        difficulty: p.difficulty,
      },
      create: {
        civilian: p.civilian,
        spy: p.spy,
        category: p.category,
        difficulty: p.difficulty,
      },
    });
    created++;
  }
  console.log(`✓ Đã seed ${created} cặp từ khóa.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
