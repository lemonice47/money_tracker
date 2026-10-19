import Transaction from "@/models/Transaction";
import { handler, json, readBody, pick, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { DATE_RE, MONTH_RE } from "@/lib/dates";

const FIELDS = ["type", "amount", "category", "note", "date"];

// GET /api/transactions?date=2026-10-19
//     /api/transactions?month=2026-10
//     /api/transactions?from=2026-10-01&to=2026-10-31
// Optional &type=expense|income&category=Food. Newest first.
export const GET = handler(async (req) => {
  const user = await requireUser(req);
  const sp = new URL(req.url).searchParams;
  const filter = { userId: user._id };

  const date = sp.get("date");
  const month = sp.get("month");
  const from = sp.get("from");
  const to = sp.get("to");
  if (date) {
    if (!DATE_RE.test(date)) throw new ApiError(400, "date must look like 2026-10-19");
    filter.date = date;
  } else if (month) {
    if (!MONTH_RE.test(month)) throw new ApiError(400, "month must look like 2026-10");
    filter.date = { $gte: `${month}-01`, $lte: `${month}-31` };
  } else if (from || to) {
    if ((from && !DATE_RE.test(from)) || (to && !DATE_RE.test(to))) {
      throw new ApiError(400, "from and to must look like 2026-10-19");
    }
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to) filter.date.$lte = to;
  }
  if (sp.get("type")) filter.type = sp.get("type");
  if (sp.get("category")) filter.category = sp.get("category");

  const transactions = await Transaction.find(filter).sort({ date: -1, createdAt: -1 }).limit(1000);
  return json({ transactions });
});

// POST /api/transactions  { type, amount, category, date, note? }
export const POST = handler(async (req) => {
  const user = await requireUser(req);
  const body = pick(await readBody(req), FIELDS);
  const transaction = await Transaction.create({ ...body, userId: user._id });
  return json({ transaction }, 201);
});