import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { handler, json, readBody, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";

// GET /api/auth/me — current user profile
export const GET = handler(async (req) => {
  const user = await requireUser(req);
  return json({ user });
});

// PUT /api/auth/me  { name?, email?, currency?, currentPassword?, newPassword? }
export const PUT = handler(async (req) => {
  const me = await requireUser(req);
  const { name, email, currency, currentPassword, newPassword } = await readBody(req);
  const user = await User.findById(me._id).select("+password");

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (currency !== undefined) user.currency = currency;
  if (newPassword) {
    if (!currentPassword || !(await user.comparePassword(currentPassword))) {
      throw new ApiError(400, "Current password is incorrect");
    }
    user.password = newPassword;
  }
  await user.save();
  return json({ user });
});

// DELETE /api/auth/me — delete own account and all its transactions
export const DELETE = handler(async (req) => {
  const me = await requireUser(req);
  await Transaction.deleteMany({ userId: me._id });
  await User.deleteOne({ _id: me._id });
  return json({ message: "Account deleted" });
});