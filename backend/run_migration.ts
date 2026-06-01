import sql from './src/db';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🔄 Running database migrations...');
  const sqlPath = 'C:\\Users\\Fouxth\\.gemini\\antigravity\\brain\\f10637ab-5fd0-47dd-9ab4-f11811ce7ab5\\scratch\\01_add_tenants.sql';
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`Migration SQL file not found at: ${sqlPath}`);
    process.exit(1);
  }

  const migrationSql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Applying SQL:');
  console.log(migrationSql);

  try {
    // Execute raw multi-statement SQL using postgres package
    await sql.unsafe(migrationSql);
    console.log('✅ Database migration applied successfully!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
