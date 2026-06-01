import sql from '../db';

export async function dbGetCustomers(tenantId: string) {
  return await sql`SELECT * FROM customers WHERE tenant_id = ${tenantId} ORDER BY full_name ASC`;
}

export async function dbGetCustomerById(id: string, tenantId: string) {
  const [customer] = await sql`SELECT * FROM customers WHERE id = ${id} AND tenant_id = ${tenantId}`;
  return customer;
}

export async function dbCreateCustomer(data: any, userId: string, tenantId: string) {
  return await sql`
    INSERT INTO customers ${sql({ ...data, createdBy: userId, tenantId })}
    RETURNING *
  `;
}

export async function dbUpdateCustomer(id: string, updates: any, tenantId: string) {
  const [customer] = await sql`
    UPDATE customers SET ${sql(updates)}
    WHERE id = ${id} AND tenant_id = ${tenantId}
    RETURNING *
  `;
  return customer;
}

export async function dbDeleteCustomer(id: string, tenantId: string) {
  return await sql`DELETE FROM customers WHERE id = ${id} AND tenant_id = ${tenantId}`;
}

