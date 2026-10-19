import mongoose from "mongoose";
import { DATE_RE } from "@/lib/dates";

export const TYPES = ["expense", "income"];
export const CATEGORIES = {
  expense: ["Food", "Transport", "Shopping", "Bills", "Health", "Family", "Fun", "Other"],
  income: ["Salary", "Business", "Gift", "Other"],
};

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: { values: TYPES, message: "Type must be expense or income" }, required: true },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be above zero"],
    },
    category: { type: String, required: [true, "Category is required"], trim: true, maxlength: 40 },
    note: { type: String, default: "", trim: true, maxlength: 120 },
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [DATE_RE, "Date must look like 2026-10-19"],
    },
  },
  { timestamps: true, versionKey: false }
);

transactionSchema.index({ userId: 1, date: -1 });

export default mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);