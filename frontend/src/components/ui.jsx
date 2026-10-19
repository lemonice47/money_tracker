// Small shared UI pieces and helpers used across pages.
import { useAuth } from "../context/AuthContext";

export const CATEGORIES = {
  expense: ["Food", "Transport", "Shopping", "Bills", "Health", "Family", "Fun", "Other"],
  income: ["Salary", "Business", "Gift", "Other"],
};

export const CURRENCIES = ["MMK", "USD", "THB", "SGD", "EUR", "GBP", "JPY", "INR", "CNY"];

export function PageHeader({ title, children }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      <div className="actions">{children}</div>
    </header>
  );
}

export function ErrorBox({ error }) {
  if (!error) return null;
  return <div className="error">{error}</div>;
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

// ---- dates: "YYYY-MM-DD" strings in the user's own calendar ----
const pad = (n) => String(n).padStart(2, "0");
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayIso = () => isoDate(new Date());
export const parseDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const shiftDate = (s, days) => {
  const d = parseDate(s);
  d.setDate(d.getDate() + days);
  return isoDate(d);
};
export function dayLabel(s) {
  const t = todayIso();
  if (s === t) return "Today";
  if (s === shiftDate(t, -1)) return "Yesterday";
  if (s === shiftDate(t, 1)) return "Tomorrow";
  return parseDate(s).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

// ---- money: formats in the signed-in user's currency ----
export function useMoney() {
  const { user } = useAuth();
  const currency = user?.currency || "MMK";
  const noCents = currency === "MMK" || currency === "JPY";
  const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: noCents ? 0 : 2 });
  const plain = (n) => nf.format(n);
  const money = (n) => `${nf.format(n)} ${currency}`;
  const signed = (n) => (n < 0 ? "−" : "") + money(Math.abs(n));
  return { currency, plain, money, signed };
}

export function TransactionRow({ t, onDelete }) {
  const { plain } = useMoney();
  const isIncome = t.type === "income";
  return (
    <li className="tx">
      <span className={"tag" + (isIncome ? " in" : "")}>{t.category}</span>
      <div className="tx-text">
        {t.note || (isIncome ? "Received" : "Spent")}
        <small>{new Date(t.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</small>
      </div>
      <span className={"num " + (isIncome ? "c-in" : "c-out")}>
        {isIncome ? "+" : "−"}
        {plain(t.amount)}
      </span>
      {onDelete && (
        <button className="del" onClick={() => onDelete(t._id)} aria-label={`Delete ${t.category} ${plain(t.amount)}`}>
          ×
        </button>
      )}
    </li>
  );
}