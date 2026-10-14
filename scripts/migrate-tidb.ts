import dotenv from 'dotenv';
import { runMigrations, verifyConnection, getPool, isTiDBConfigured, ensureDatabaseExists } from '../server/tidb';

dotenv.config();

async function main() {
  console.log('====================================================');
  console.log('   BUILDREX — TiDB Cloud Schema Migration Runner');
  console.log('====================================================\n');

  if (!isTiDBConfigured()) {
    console.warn('⚠️ TiDB credentials are not configured in .env.');
    console.log('Please configure TIDB_HOST, TIDB_USER, TIDB_PASSWORD, and TIDB_DATABASE to migrate TiDB.');
    process.exit(1);
  }

  console.log('Ensuring database exists in TiDB Cloud...');
  await ensureDatabaseExists();

  const pool = getPool();
  const connCheck = await verifyConnection(pool);
  if (!connCheck.ok) {
    console.error('❌ Cannot connect to TiDB Cloud cluster:', connCheck.error);
    await pool.end().catch(() => {});
    process.exit(1);
  }

  console.log(`Connected to TiDB (v${connCheck.version}). Applying tables...`);
  await runMigrations(pool);
  console.log('\n✅ All 10 relational tables verified and ready in TiDB Cloud!');

  await pool.end().catch(() => {});
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
