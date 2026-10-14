import dotenv from 'dotenv';
import { verifyConnection, getPool, getTableCounts, isTiDBConfigured, getConfig, ensureDatabaseExists } from '../server/tidb';

dotenv.config();

async function main() {
  console.log('====================================================');
  console.log('   BUILDREX — TiDB Cloud Connection Diagnostic');
  console.log('====================================================\n');

  const config = getConfig();
  console.log(`Configured Host:     ${config.host}`);
  console.log(`Configured Port:     ${config.port}`);
  console.log(`Configured User:     ${config.user}`);
  console.log(`Configured Database: ${config.database}`);
  console.log(`SSL Enabled:         ${config.ssl}`);
  console.log(`Configured in .env:  ${isTiDBConfigured() ? 'YES' : 'NO (using defaults)'}\n`);

  if (!isTiDBConfigured()) {
    console.warn('⚠️  TiDB Cloud credentials (TIDB_HOST, TIDB_USER, TIDB_PASSWORD) not configured in .env');
    console.log('ℹ️  The BUILDREX application operates seamlessly using the local JSON datastore fallback.');
    console.log('ℹ️  To connect TiDB Cloud: register a free cluster at https://tidbcloud.com and copy credentials into .env.\n');
  }

  console.log('Testing connection to cluster...');
  if (isTiDBConfigured()) {
    await ensureDatabaseExists();
  }
  const pool = getPool();
  const result = await verifyConnection(pool);

  if (result.ok) {
    console.log(`\n✅ CONNECTED SUCCESSFULLY!`);
    console.log(`TiDB Server Version: ${result.version}`);
    console.log(`Round-trip Latency:  ${result.latencyMs} ms\n`);

    try {
      const counts = await getTableCounts(pool);
      console.log('📊 Table Record Counts:');
      console.table(counts);
    } catch (e: any) {
      console.log('Could not fetch table counts (tables may not be migrated yet). Run npm run db:migrate');
    }
  } else {
    console.error(`\n❌ CONNECTION FAILED:`);
    console.error(result.error);
    console.log('\n💡 Troubleshooting Tips:');
    console.log('1. Verify your IP is allowed in TiDB Cloud Security Settings (0.0.0.0/0 for anywhere).');
    console.log('2. Check username format (e.g. xxx.root).');
    console.log('3. Verify TIDB_PASSWORD and TIDB_DATABASE in .env.');
  }

  await pool.end().catch(() => {});
  process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
