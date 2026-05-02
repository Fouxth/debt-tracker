import sql from './src/db';
async function test() {
  try {
    const res = await sql`SELECT * FROM users LIMIT 1`;
    console.log(res.columns);
  } catch (e) {
    console.log('Error', e);
  }
  process.exit();
}
test();
