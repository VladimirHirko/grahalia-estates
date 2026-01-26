const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Run with dotenv: npx dotenv -e .env.local -- npm run seed");
  }

  const sqlPath = path.resolve(process.cwd(), "db/migrations/0004_seed_features.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(sql);
    console.log("✅ Seed completed:", sqlPath);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
