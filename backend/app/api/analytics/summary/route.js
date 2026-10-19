import mongoose from "mongoose";
import Transaction from "@/models/Transaction";
import { handler, json, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { DATE_RE, shiftDate } from "@/lib/dates";

// GET /api/analytics/summary?date=2026-10-19
// Everything the dashboard needs in one request: that day's totals,
// that month's totals and spending by category, and the 14 days
// ending on that date.
export const GET = handler(async (req) => {
  const user = await requireUser(req);
  const userId = new mongoose.Types.ObjectId(user._id);
  const date = new URL(req.url).searchParams.get("date");
  if (!DATE_RE.test(date || "")) throw new ApiError(400, "date must look like 2026-10-19");

  const month = date.slice(0, 7);
  const start14 = shiftDate(date, -13);

  const [dayTotals, monthTotals, byCategory, daily] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId, date } },
      { $group: { _id: "$type", amount: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: `${month}-01`, $lte: `${month}-31` } } },
      { $group: { _id: "$type", amount: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { userId, type: "expense", date: { $gte: `${month}-01`, $lte: `${month}-31` } } },
      { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      { $sort: { amount: -1 } },
    ]),
    Transaction.aggregate([
      { $match: { userId, type: "expense", date: { $gte: start14, $lte: date } } },
      { $group: { _id: "$date", amount: { $sum: "$amount" } } },
    ]),
  ]);

  const totals = (rows) => {
    const income = rows.find((r) => r._id === "income")?.amount || 0;
    const expense = rows.find((r) => r._id === "expense")?.amount || 0;
    return { income, expense, net: income - expense };
  };

  // 14 days, oldest first, filling days with no spending as 0.
  const dailyMap = Object.fromEntries(daily.map((d) => [d._id, d.amount]));
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = shiftDate(start14, i);
    return { date: d, expense: dailyMap[d] || 0 };
  });

  return json({
    date,
    day: totals(dayTotals),
    month: { month, ...totals(monthTotals) },
    byCategory: byCategory.map((r) => ({ category: r._id, amount: r.amount })),
    last14Days,
  });
});