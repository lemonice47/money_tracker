import Transaction from "@/models/Transaction";
import { handler, json, readBody, pick } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { findOwned } from "@/lib/ownership";

const FIELDS = ["type", "amount", "category", "note", "date"];

// GET /api/transactions/:id
export const GET = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  return json({ transaction: await findOwned(Transaction, id, user._id) });
});

// PUT /api/transactions/:id — partial update
export const PUT = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  const transaction = await findOwned(Transaction, id, user._id);
  Object.assign(transaction, pick(await readBody(req), FIELDS));
  await transaction.save();
  return json({ transaction });
});

// DELETE /api/transactions/:id
export const DELETE = handler(async (req, { params }) => {
  const user = await requireUser(req);
  const { id } = await params;
  const transaction = await findOwned(Transaction, id, user._id);
  await transaction.deleteOne();
  return json({ message: "Transaction deleted" });
});