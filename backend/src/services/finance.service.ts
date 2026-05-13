import sql from '../db';
import { sendLineNotify } from './line.service';

export async function dbGetPayments() {
  return await sql`
    SELECT p.*, l.loan_number, c.full_name as customer_name
    FROM payments p
    JOIN loans l ON p.loan_id = l.id
    JOIN customers c ON l.customer_id = c.id
    ORDER BY p.payment_date DESC
  `;
}
export async function dbGetPaymentsByLoan(loanId: string) {
  return await sql`
    SELECT * FROM payments 
    WHERE loan_id = ${loanId}
    ORDER BY payment_date DESC
  `;
}
export async function dbCreatePayment(data: any, userId: string) {
  const result = await sql`
    INSERT INTO payments ${sql({ ...data, createdBy: userId })}
    RETURNING *
  `;
  
  if (result.length > 0) {
    const payment = result[0];
    const loans = await sql`
      SELECT l.loan_number, c.full_name as customer_name
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      WHERE l.id = ${payment.loanId}
    `;
    
    if (loans.length > 0) {
      const loan = loans[0];
      const formattedAmount = Number(payment.amount).toLocaleString('en-US', {minimumFractionDigits: 2});
      const message = `🔔 แจ้งเตือนรับชำระเงิน\n👤 ลูกค้า: ${loan.customerName}\n📝 สัญญา: ${loan.loanNumber}\n💰 ยอดชำระ: ${formattedAmount} บาท`;
      sendLineNotify(message, 'payment', {
        title: '🔔 รับชำระเงินเรียบร้อย',
        accentColor: '#10b981',
        items: [
          { label: 'ลูกค้า', value: loan.customerName },
          { label: 'เลขที่สัญญา', value: loan.loanNumber },
          { label: 'ยอดเงินชำระ', value: `${formattedAmount} บาท`, color: '#10b981' }
        ],
        footer: 'ตรวจสอบยอดในแอปได้ทันที'
      });
    }
  }
  
  return result;
}

export async function dbDeletePayment(id: string) {
  const payments = await sql`
    SELECT p.amount, l.loan_number, c.full_name as customer_name
    FROM payments p
    JOIN loans l ON p.loan_id = l.id
    JOIN customers c ON l.customer_id = c.id
    WHERE p.id = ${id}
  `;
  
  const result = await sql`DELETE FROM payments WHERE id = ${id}`;
  
  if (payments.length > 0) {
    const p = payments[0];
    const formattedAmount = Number(p.amount).toLocaleString('en-US', {minimumFractionDigits: 2});
    const message = `🚨 แจ้งเตือนความผิดปกติ (ลบข้อมูล)\n👤 ลูกค้า: ${p.customerName}\n📝 สัญญา: ${p.loanNumber}\n❌ ยอดที่ลบ: ${formattedAmount} บาท`;
    sendLineNotify(message, 'fraud', {
      title: '🚨 ยกเลิกรายการชำระ',
      accentColor: '#f59e0b',
      items: [
        { label: 'ลูกค้า', value: p.customerName },
        { label: 'เลขที่สัญญา', value: p.loanNumber },
        { label: 'ยอดที่ถูกลบ', value: `${formattedAmount} บาท` }
      ],
      footer: 'โปรดตรวจสอบความถูกต้องทันที'
    });
  }
  
  return result;
}

export async function dbGetExpenses() {
  return await sql`SELECT * FROM expenses ORDER BY expense_date DESC`;
}
export async function dbCreateExpense(data: any, userId: string) {
  const result = await sql`
    INSERT INTO expenses ${sql({ ...data, createdBy: userId })}
    RETURNING *
  `;
  
  if (result.length > 0) {
    const expense = result[0];
    const categoryMap: any = { fuel: 'ค่าน้ำมัน', staff: 'เงินเดือนพนักงาน', calls: 'ค่าโทรศัพท์', documents: 'ค่าเอกสาร', other: 'อื่นๆ' };
    const catText = categoryMap[expense.category] || expense.category;
    const formattedAmount = Number(expense.amount).toLocaleString('en-US', {minimumFractionDigits: 2});
    const message = `💸 แจ้งเตือนบันทึกรายจ่าย\n📂 หมวดหมู่: ${catText}\n💰 จำนวนเงิน: ${formattedAmount} บาท`;
    sendLineNotify(message, 'expense', {
      title: '💸 บันทึกรายจ่ายใหม่',
      accentColor: '#6366f1',
      items: [
        { label: 'หมวดหมู่', value: catText },
        { label: 'จำนวนเงิน', value: `${formattedAmount} บาท`, color: '#6366f1' },
        { label: 'รายละเอียด', value: expense.details || '-' }
      ],
      footer: 'บันทึกรายจ่ายเข้าระบบแล้ว'
    });
  }
  
  return result;
}
export async function dbDeleteExpense(id: string) {
  return await sql`DELETE FROM expenses WHERE id = ${id}`;
}
