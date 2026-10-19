import { useEffect, useMemo, useState } from "react";
import { transactionsApi } from "../api";
import { CATEGORIES, Empty, ErrorBox, PageHeader, TransactionRow, dayLabel, todayIso, useMoney } from "../components/ui";

const allCategories = [...new Set([...CATEGORIES.expense, ...CATEGORIES.income])];

export default function HistoryPage() {
  const { money, signed } = useMoney();
  const [month, setMonth] = useState(todayIso().slice(0, 7));
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    transactionsApi
      .list({ month, type, category })
      .then((d) => {
        setTransactions(d.transactions);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, [month, type, category]);

  const remove = async (id) => {
    try {
      await transactionsApi.remove(id);
      setTransactions((list) => list.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  // Group by day, newest day first (the API already sorts newest first).
  const groups = useMemo(() => {
    const map = new Map();
    for (const t of transactions) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date).push(t);
    }
    return [...map.entries()];
  }, [transactions]);

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="stack">
      <PageHeader title="History">
        <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
      </PageHeader>

      <div className="filters">
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          <option value="">Spent and received</option>
          <option value="expense">Spent only</option>
          <option value="income">Received only</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <ErrorBox error={error} />

      <section className="card totals">
        <div><span className="label">In</span><span className="num c-in">{money(income)}</span></div>
        <div><span className="label">Out</span><span className="num c-out">{money(expense)}</span></div>
        <div><span className="label">Net</span><span className={"num " + (income - expense < 0 ? "c-out" : "c-in")}>{signed(income - expense)}</span></div>
      </section>

      {groups.length ? (
        groups.map(([date, list]) => (
          <section className="card" key={date}>
            <h2>{dayLabel(date)}</h2>
            <ul className="tx-list">
              {list.map((t) => <TransactionRow key={t._id} t={t} onDelete={remove} />)}
            </ul>
          </section>
        ))
      ) : (
        <section className="card"><Empty>No entries match for this month.</Empty></section>
      )}
    </div>
  );
}