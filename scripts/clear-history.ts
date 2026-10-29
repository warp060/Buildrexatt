import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { getPool, isTiDBConfigured, verifyConnection, getTableCounts } from '../server/tidb';

dotenv.config();

async function main() {
  console.log('====================================================');
  console.log('   BUILDREX — Reset Operational History');
  console.log('====================================================\n');

  // 1. Load data/buildrex.json
  const dataPath = path.resolve(process.cwd(), 'data', 'buildrex.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ data/buildrex.json not found');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Original state:`);
  console.log(`- Users: ${data.users?.length || 0}`);
  console.log(`- Departments: ${data.departments?.length || 0}`);
  console.log(`- Attendance: ${data.attendance?.length || 0}`);
  console.log(`- Work Updates: ${data.work_updates?.length || 0}`);
  console.log(`- Leave Requests: ${data.leave_requests?.length || 0}`);
  console.log(`- Attendance Corrections: ${data.attendance_corrections?.length || 0}`);
  console.log(`- Audit Logs: ${data.audit_logs?.length || 0}`);
  console.log(`- Notifications: ${data.notifications?.length || 0}\n`);

  // Clear operational history only
  data.attendance = [];
  data.work_updates = [];
  data.leave_requests = [];
  data.attendance_corrections = [];
  data.audit_logs = [];
  data.notifications = [];

  // Write back to data/buildrex.json
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log('✅ data/buildrex.json updated (history arrays set to [])');

  // 2. Clear TiDB Cloud if configured
  if (isTiDBConfigured()) {
    console.log('\nConnecting to TiDB Cloud...');
    const pool = getPool();
    const connCheck = await verifyConnection(pool);
    if (!connCheck.ok) {
      console.warn('⚠️ Could not connect to TiDB Cloud:', connCheck.error);
    } else {
      console.log('Clearing history tables in TiDB Cloud...');
      const conn = await pool.getConnection();
      try {
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        const historyTables = [
          'attendance',
          'work_updates',
          'leave_requests',
          'attendance_corrections',
          'audit_logs',
          'notifications',
        ];
        for (const tbl of historyTables) {
          await conn.query(`DELETE FROM ${tbl}`);
          console.log(`  - Cleared table: ${tbl}`);
        }
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ TiDB Cloud history tables cleared.');
      } catch (err: any) {
        console.error('Error clearing TiDB tables:', err.message);
      } finally {
        conn.release();
      }

      const counts = await getTableCounts(pool);
      console.log('\n📊 Updated TiDB Table Counts:');
      console.table(counts);
    }
    await pool.end().catch(() => {});
  }

  console.log('\n🎉 History reset complete! System ready for fresh usage from today onwards.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

