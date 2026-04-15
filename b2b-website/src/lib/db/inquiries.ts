import type { Inquiry } from './types';

export interface CreateInquiryInput {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  country?: string;
  product_interest?: string;
  quantity?: string;
  message: string;
  attachments?: string;
}

export async function createInquiry(
  db: D1Database,
  input: CreateInquiryInput
): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO inquiries (
      company_name, contact_name, email, phone, country,
      product_interest, quantity, message, attachments
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    input.company_name,
    input.contact_name,
    input.email,
    input.phone || null,
    input.country || null,
    input.product_interest || null,
    input.quantity || null,
    input.message,
    input.attachments || null
  ).run();

  return result.meta.last_row_id;
}

export async function getInquiryById(
  db: D1Database,
  id: number
): Promise<Inquiry | null> {
  const result = await db.prepare(`
    SELECT * FROM inquiries WHERE id = ?
  `).bind(id).first<Inquiry>();

  return result;
}

export async function getInquiries(
  db: D1Database,
  options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<Inquiry[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (options?.status) {
    conditions.push('status = ?');
    params.push(options.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `SELECT * FROM inquiries ${where} ORDER BY created_at DESC`;

  if (options?.limit) {
    params.push(options.limit);
  }
  if (options?.offset) {
    params.push(options.offset);
  }

  const limitOffset = [
    options?.limit ? 'LIMIT ?' : '',
    options?.offset ? 'OFFSET ?' : '',
  ].filter(Boolean).join(' ');

  const result = await db.prepare(`${query} ${limitOffset}`.trim()).bind(...params).all<Inquiry>();
  return result.results;
}

export async function updateInquiryStatus(
  db: D1Database,
  id: number,
  status: 'pending' | 'contacted' | 'closed'
): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE inquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(status, id).run();

  return result.meta.changes > 0;
}

export async function getInquiryCount(
  db: D1Database,
  status?: string
): Promise<number> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.prepare(`SELECT COUNT(*) as count FROM inquiries ${where}`).bind(...params).first<{ count: number }>();
  return result?.count || 0;
}
