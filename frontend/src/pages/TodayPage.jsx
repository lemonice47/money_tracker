import { useCallback, useEffect, useState } from "react";
import { analyticsApi, transactionsApi } from "../api";
import {
  CATEGORIES, Empty, ErrorBox, TransactionRow,
  dayLabel, parseDate, shiftDate, todayIso, useMoney,
} from "../components/ui";

export default function TodayPage() {
  const { currency, money, signed, plain } = useMoney();
  const [day, setDay] = useState(todayIso());
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const [type, setType] = useState("expense");
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // Load the day's transactions and the summary together.
  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([transactionsApi.list({ date: day }), analyticsApi.summary(day)]);
      setTransactions(list.transactions);
      setSummary(sum);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [day]);

  useEffect(() => {
    load();
  }, [load]);

  const chooseType = (t) => {
    setType(t);
    setCategory(CATEGORIES[t][0]);
  };

  const add = async (e) => {
    e.preventDefault();
    const value = Number(amount.replace(/[,\s]/g, ""));
    if (!value || value <= 0) return setError("Type an amount above zero, like 2500.");
    setBusy(true);
    try {
      await transactionsApi.create({ type, amount: value, category, note, date: day });
      setAmount("");
      setNote("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await transactionsApi.remove(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const label = dayLabel(day);
  const maxDay = summary ? Math.max(...summary.last14Days.map((d) => d.expense), 0) : 0;
  const topCat = summary?.byCategory[0]?.amount || 1;

  return (
    <div className="stack">
      <div className="daybar">
        <button className="nav" onClick={() => setDay(shiftDate(day, -1))} aria-label="Previous day">‹</button>
        <div className="day">
          <strong>{label}</strong>
          <input type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} aria-label="Pick a date" />
        </div>
        <button className="nav" onClick={() => setDay(shiftDate(day, 1))} aria-label="Next day">›</button>
        <button className="btn ghost" onClick={() => setDay(todayIso())}>Today</button>
      </div>

      <ErrorBox error={error} />

      <section className="card totals">
        <div><span className="label">Money in</span><span className="num c-in">{money(summary?.day.income || 0)}</span></div>
        <div><span className="label">Money out</span><span className="num c-out">{money(summary?.day.expense || 0)}</span></div>
        <div>
          <span className="label">Left</span>
          <span className={"num " + ((summary?.day.net || 0) < 0 ? "c-out" : "")}>{signed(summary?.day.net || 0)}</span>
        </div>
      </section>

      <section className="card">
        <form className="add-form" onSubmit={add} autoComplete="off">
          <div className="seg" role="group" aria-label="Entry type">
            <button type="button" className="out" aria-pressed={type === "expense"} onClick={() => chooseType("expense")}>Spent</button>
            <button type="button" className="in" aria-pressed={type === "income"} onClick={() => chooseType("income")}>Received</button>
          </div>
          <label className="amount-row">
            <span className="cur">{currency}</span>
            <input inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" />
          </label>
          <div className="chips" role="group" aria-label="Category">
            {CATEGORIES[type].map((c) => (
              <button type="button" key={c} className="chip" aria-pressed={c === category} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <input placeholder="Note (optional), e.g. lunch with Aung" maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} aria-label="Note" />
          <button className="btn primary" disabled={busy}>
            {busy ? "Saving…" : type === "income" ? "Add money received" : "Add spending"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>{["Today", "Yesterday", "Tomorrow"].includes(label) ? `${label}'s entries` : `Entries for ${label}`}</h2>
        {transactions.length ? (
          <ul className="tx-list">
            {transactions.map((t) => <TransactionRow key={t._id} t={t} onDelete={remove} />)}
          </ul>
        ) : (
          <Empty>Nothing recorded for this day yet. Add what you spent or received above.</Empty>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Spending, last 14 days</h2>
          <span className="label">{maxDay ? `Highest day ${money(maxDay)}` : "No spending yet"}</span>
        </div>
        <div className="chart">
          {summary?.last14Days.map((d) => (
            <button
              key={d.date}
              className={"bar" + (d.date === day ? " sel" : "")}
              onClick={() => setDay(d.date)}
              aria-label={`${dayLabel(d.date)}: spent ${money(d.expense)}`}
            >
              <span className="fill" style={{ height: maxDay ? `${Math.max(2, (d.expense / maxDay) * 92)}px` : "2px" }} />
              <small>{parseDate(d.date).getDate()}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>{parseDate(day).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
        <div className="totals">
          <div><span className="label">In</span><span className="num c-in">{money(summary?.month.income || 0)}</span></div>
          <div><span className="label">Out</span><span className="num c-out">{money(summary?.month.expense || 0)}</span></div>
          <div>
            <span className="label">Net</span>
            <span className={"num " + ((summary?.month.net || 0) < 0 ? "c-out" : "c-in")}>{signed(summary?.month.net || 0)}</span>
          </div>
        </div>
        {summary?.byCategory.length ? (
          <div className="cats">
            {summary.byCategory.map((c) => (
              <div className="cat-row" key={c.category}>
                <span>{c.category}</span>
                <div className="track"><span style={{ width: `${(c.amount / topCat) * 100}%` }} /></div>
                <span className="num">{plain(c.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No spending this month.</Empty>
        )}
      </section>
    </div>
  );
}