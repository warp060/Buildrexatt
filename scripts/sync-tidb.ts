import dotenv from 'dotenv';
import { getDb } from '../server/db';
import { syncAllToTiDB, verifyConnection, getPool, isTiDBConfigured, getTableCounts, clearAllTiDBTables } from '../server/tidb';

dotenv.config();

async function main() {
  console.log('====================================================');
  console.log('   BUILDREX — Sync Local Data to TiDB Cloud');
  console.log('====================================================\n');

  if (!isTiDBConfigured()) {
    console.warn('⚠️ TiDB credentials are not configured in .env.');
    process.exit(1);
  }

  const pool = getPool();
  const connCheck = await verifyConnection(pool);
  if (!connCheck.ok) {
    console.error('❌ Cannot connect to TiDB Cloud:', connCheck.error);
    await pool.end().catch(() => {});
    process.exit(1);
  }

  const localDb = getDb();
  console.log(`Local records loaded:`);
  console.log(`- Users: ${localDb.users.length}`);
  console.log(`- Departments: ${localDb.departments.length}`);
  console.log(`- Attendance: ${localDb.attendance.length}`);
  console.log(`- Work Updates: ${localDb.work_updates.length}`);
  console.log(`- Leave Requests: ${localDb.leave_requests.length}`);
  console.log(`- Attendance Corrections: ${localDb.attendance_corrections.length}`);
  console.log(`- Audit Logs: ${localDb.audit_logs.length}\n`);

  console.log('Purging legacy dummy rows from TiDB Cloud...');
  await clearAllTiDBTables(pool);

  console.log('Synchronizing real Google Sheet team dataset to TiDB Cloud...');
  const result = await syncAllToTiDB(localDb);

  if (result.ok) {
    console.log('\n✅ SYNC COMPLETED SUCCESSFULLY!');
    const counts = await getTableCounts(pool);
    console.log('\n📊 Updated TiDB Table Counts:');
    console.table(counts);
  } else {
    console.error('\n❌ SYNC FAILED:', result.message);
  }

  await pool.end().catch(() => {});
  process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
