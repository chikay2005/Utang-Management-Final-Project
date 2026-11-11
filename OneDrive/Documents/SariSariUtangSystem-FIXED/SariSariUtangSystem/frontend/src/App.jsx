
import React, { useEffect, useMemo, useState } from "react";
import {
  Store, LayoutDashboard, Users, BookOpen, Wallet, History,
  RefreshCw, Menu, X, Plus, Search, Pencil, Trash2, ArrowUpRight,
  CircleAlert, CheckCircle2, LoaderCircle
} from "lucide-react";
import { api } from "./api.js";

const money = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  }).format(Number(value || 0));

const dateText = (value) =>
  value ? new Date(value).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric"
  }) : "—";

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const emptyData = {
  dashboard: { totalCustomers: 0, totalUtang: 0, totalPaid: 0, outstanding: 0, recentDebts: [] },
  customers: [], debts: [], payments: [], history: []
};

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", contact: "", address: "", customer: "", description: "", amount: "", date: today(), method: "Cash" });

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboard, customers, debts, payments, history] = await Promise.all([
        api.dashboard(), api.customers(), api.debts(), api.payments(), api.history()
      ]);
      setData({
        dashboard: { ...emptyData.dashboard, ...dashboard },
        customers: Array.isArray(customers) ? customers : [],
        debts: Array.isArray(debts) ? debts : [],
        payments: Array.isArray(payments) ? payments : [],
        history: Array.isArray(history) ? history : []
      });
    } catch (err) {
      setError(err.message || "Unable to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const filteredCustomers = useMemo(() =>
    data.customers.filter((c) => `${c.name} ${c.contact || ""}`.toLowerCase().includes(search.toLowerCase())),
    [data.customers, search]
  );

  const filteredDebts = useMemo(() =>
    data.debts.filter((d) => `${d.customerName || d.customer?.name || ""} ${d.description || ""}`.toLowerCase().includes(search.toLowerCase())),
    [data.debts, search]
  );

  const filteredPayments = useMemo(() =>
    data.payments.filter((p) => `${p.customerName || p.customer?.name || ""} ${p.method || ""}`.toLowerCase().includes(search.toLowerCase())),
    [data.payments, search]
  );

  const changePage = (name) => {
    setPage(name);
    setSearch("");
    setMobileOpen(false);
  };

  const openModal = (type, item = null) => {
    setEditing(item);
    setForm(item ? {
      name: item.name || "",
      contact: item.contact || "",
      address: item.address || "",
      customer: item.customer?._id || item.customer || "",
      description: item.description || "",
      amount: item.amount || "",
      date: item.date ? todayFrom(item.date) : today(),
      method: item.method || "Cash"
    } : {
      name: "", contact: "", address: "", customer: "",
      description: "", amount: "", date: today(), method: "Cash"
    });
    setModal(type);
  };

  const save = async (event) => {
    event.preventDefault();
    setError("");
    try {
      if (modal === "customer") {
        if (editing) await api.updateCustomer(editing._id, form);
        else await api.addCustomer(form);
      } else if (modal === "debt") {
        await api.addDebt({
          customer: form.customer,
          description: form.description,
          amount: Number(form.amount),
          date: form.date
        });
      } else if (modal === "payment") {
        await api.addPayment({
          debt: form.customer,
          amount: Number(form.amount),
          method: form.method,
          date: form.date
        });
      }
      setModal("");
      setNotice("Changes saved successfully.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Unable to save changes.");
    }
  };

  const removeCustomer = async (customer) => {
    if (!window.confirm(`Delete ${customer.name}?`)) return;
    try {
      await api.deleteCustomer(customer._id);
      setNotice("Customer deleted.");
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const navItems = [
    ["Dashboard", LayoutDashboard], ["Customers", Users],
    ["Utang Records", BookOpen], ["Payments", Wallet],
    ["Transaction History", History]
  ];

  const pageTitle = {
    Dashboard: "Store overview",
    Customers: "Customer records",
    "Utang Records": "Utang records",
    Payments: "Payment records",
    "Transaction History": "Transaction history"
  }[page];

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><Store size={21} /></div>
          <div><strong>Sari-Sari</strong><span>UTANG MANAGEMENT</span></div>
          <button className="close-nav" onClick={() => setMobileOpen(false)} aria-label="Close"><X size={19} /></button>
        </div>
        <div className="nav-caption">MAIN MENU</div>
        <nav>
          {navItems.map(([label, Icon]) => (
            <button key={label} className={`nav-link ${page === label ? "active" : ""}`} onClick={() => changePage(label)}>
              <Icon size={17} />{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="store-note"><div className="note-icon"><Store size={16} /></div><div><b>Store records</b><span>Simple. Organized. Reliable.</span></div></div>
          <small className="version">LOCAL STORE MANAGEMENT</small>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="breadcrumb">Sari-Sari Store <span>/</span> <b>{page}</b></div>
          <button className="refresh-button" onClick={loadAll}><RefreshCw size={14} /><span>Refresh data</span></button>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div><p className="eyebrow">STORE MANAGEMENT</p><h1>{page}</h1><p className="subheading">{pageTitle}</p></div>
            <div className="heading-date">{new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
          </div>

          {error && <div className="alert error"><CircleAlert size={16} />{error}<button onClick={() => setError("")}>×</button></div>}
          {notice && <div className="alert success"><CheckCircle2 size={16} />{notice}<button onClick={() => setNotice("")}>×</button></div>}

          {loading ? <div className="loading"><LoaderCircle className="spin" size={20} />Loading store records...</div> : (
            <>
              {page === "Dashboard" && <Dashboard dashboard={data.dashboard} debts={data.debts} onNavigate={changePage} />}

              {page === "Customers" && (
                <Panel title="Customers" subtitle={`${data.customers.length} registered customers`}
                  action={<button className="primary-button" onClick={() => openModal("customer")}><Plus size={14} />Add customer</button>}>
                  <SearchBar value={search} onChange={setSearch} />
                  <div className="table-wrap"><table><thead><tr><th>CUSTOMER</th><th>CONTACT</th><th>ADDRESS</th><th>ACTIONS</th></tr></thead>
                    <tbody>{filteredCustomers.map((c) => <tr key={c._id}><td className="customer-cell">{c.name}</td><td>{c.contact || "—"}</td><td>{c.address || "—"}</td><td><div className="row-actions"><button onClick={() => openModal("customer", c)} aria-label="Edit"><Pencil size={14} /></button><button className="delete-action" onClick={() => removeCustomer(c)} aria-label="Delete"><Trash2 size={14} /></button></div></td></tr>)}</tbody></table>
                    {!filteredCustomers.length && <Empty message="No customers found." />}</div>
                </Panel>
              )}

              {page === "Utang Records" && (
                <Panel title="Utang records" subtitle="Track customer purchases and remaining balances"
                  action={<button className="primary-button" onClick={() => openModal("debt")}><Plus size={14} />Add utang</button>}>
                  <SearchBar value={search} onChange={setSearch} />
                  <div className="table-wrap"><table><thead><tr><th>CUSTOMER</th><th>DESCRIPTION</th><th>DATE</th><th>AMOUNT</th><th>BALANCE</th><th>STATUS</th></tr></thead>
                    <tbody>{filteredDebts.map((d) => <tr key={d._id}><td className="customer-cell">{d.customerName || d.customer?.name || "—"}</td><td>{d.description}</td><td>{dateText(d.date)}</td><td className="amount">{money(d.amount)}</td><td className="amount">{money(d.balance)}</td><td><Status value={d.status} /></td></tr>)}</tbody></table>
                    {!filteredDebts.length && <Empty message="No utang records found." />}</div>
                </Panel>
              )}

              {page === "Payments" && (
                <Panel title="Payments" subtitle="Record and review customer payments"
                  action={<button className="primary-button" onClick={() => openModal("payment")}><Plus size={14} />Add payment</button>}>
                  <SearchBar value={search} onChange={setSearch} />
                  <div className="table-wrap"><table><thead><tr><th>CUSTOMER</th><th>PAYMENT METHOD</th><th>DATE</th><th>AMOUNT PAID</th></tr></thead>
                    <tbody>{filteredPayments.map((p) => <tr key={p._id}><td className="customer-cell">{p.customerName || p.customer?.name || "—"}</td><td><span className="method-pill">{p.method || "Cash"}</span></td><td>{dateText(p.date)}</td><td className="amount paid-text">{money(p.amount)}</td></tr>)}</tbody></table>
                    {!filteredPayments.length && <Empty message="No payments found." />}</div>
                </Panel>
              )}

              {page === "Transaction History" && (
                <Panel title="Transaction history" subtitle="A combined record of utang and payments">
                  <div className="table-wrap"><table><thead><tr><th>TYPE</th><th>CUSTOMER</th><th>DETAILS</th><th>DATE</th><th>AMOUNT</th></tr></thead>
                    <tbody>{data.history.map((h) => <tr key={h._id}><td><span className={`type-pill ${h.type === "Payment Received" ? "payment-type" : ""}`}>{h.type}</span></td><td className="customer-cell">{h.customerName}</td><td>{h.description}</td><td>{dateText(h.date)}</td><td className="amount">{money(h.amount)}</td></tr>)}</tbody></table>
                    {!data.history.length && <Empty message="No transactions yet." />}</div>
                </Panel>
              )}
            </>
          )}
        </section>
      </main>

      {modal && <Modal title={modal === "customer" ? (editing ? "Edit customer" : "Add customer") : modal === "debt" ? "Add utang record" : "Record payment"} onClose={() => setModal("")}>
        <form onSubmit={save}>
          {modal === "customer" ? <>
            <Field label="Customer name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter customer name" /></Field>
            <Field label="Contact number"><input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Optional" /></Field>
            <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Optional" /></Field>
          </> : modal === "debt" ? <>
            <Field label="Customer"><select required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}><option value="">Select customer</option>{data.customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></Field>
            <Field label="Description"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Rice, canned goods" /></Field>
            <Field label="Amount (PHP)"><input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></Field>
            <Field label="Date"><input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          </> : <>
            <Field label="Utang record"><select required value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}><option value="">Select unpaid utang</option>{data.debts.filter((d) => Number(d.balance) > 0).map((d) => <option key={d._id} value={d._id}>{d.customerName || d.customer?.name} — balance {money(d.balance)}</option>)}</select></Field>
            <Field label="Payment amount (PHP)"><input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></Field>
            <Field label="Payment method"><select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}><option>Cash</option><option>GCash</option><option>Bank transfer</option></select></Field>
            <Field label="Date"><input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          </>}
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal("")}>Cancel</button><button className="primary-button" type="submit">Save record</button></div>
        </form>
      </Modal>}
    </div>
  );
}

function todayFrom(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Dashboard({ dashboard, debts, onNavigate }) {
  const stats = [
    ["Total customers", dashboard.totalCustomers, Users, "neutral"],
    ["Total utang", money(dashboard.totalUtang), BookOpen, "brown"],
    ["Total collected", money(dashboard.totalPaid), Wallet, "green"],
    ["Outstanding balance", money(dashboard.outstanding), Wallet, "orange"]
  ];

  return <>
    <div className="stats-grid">{stats.map(([label, value, Icon, tone]) => <div className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={18} /></div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-note">Updated from store records</span></div>)}</div>
    <div className="section-grid">
      <Panel title="Recent utang records" subtitle="Latest customer purchases" action={<button className="text-button" onClick={() => onNavigate("Utang Records")}>View all <ArrowUpRight size={13} /></button>}>
        <div className="table-wrap"><table><thead><tr><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>BALANCE</th><th>STATUS</th></tr></thead><tbody>
          {dashboard.recentDebts.map((d) => <tr key={d._id}><td className="customer-cell">{d.customerName}</td><td>{dateText(d.date)}</td><td className="amount">{money(d.amount)}</td><td className="amount">{money(d.balance)}</td><td><Status value={d.status} /></td></tr>)}
        </tbody></table>{!dashboard.recentDebts.length && <Empty message="No utang records yet." />}</div>
      </Panel>
      <div className="quick-panel"><div className="panel-heading"><div><h2>Quick access</h2><p>Manage your store records</p></div></div>
        {[["Customers", "View and manage customers", Users], ["Utang Records", "Track customer balances", BookOpen], ["Payments", "Record customer payments", Wallet], ["Transaction History", "Review all transactions", History]].map(([name, desc, Icon]) => <button className="quick-action" key={name} onClick={() => onNavigate(name)}><span className="quick-icon"><Icon size={16} /></span><span><b>{name}</b><small>{desc}</small></span><span className="chevron">›</span></button>)}
      </div>
    </div>
    <div className="tip-box"><span className="tip-symbol">i</span><p><b>Storekeeping tip:</b> Record every purchase and payment to keep customer balances accurate.</p></div>
  </>;
}

function Panel({ title, subtitle, action, children }) {
  return <div className="panel full-panel"><div className="table-toolbar"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>{children}</div>;
}

function SearchBar({ value, onChange }) {
  return <div className="table-toolbar search-toolbar"><div className="search-box"><Search size={14} /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search records..." /></div></div>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Status({ value }) {
  const status = String(value || "Unpaid").toLowerCase();
  return <span className={`status ${status}`}><span />{value || "Unpaid"}</span>;
}

function Empty({ message }) {
  return <div className="empty-state"><div className="empty-icon"><BookOpen size={21} /></div><b>{message}</b><p>Records will appear here when added.</p></div>;
}

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="modal"><div className="modal-heading"><div><h2>{title}</h2><p>Enter the details below.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={16} /></button></div>{children}</div></div>;
}
