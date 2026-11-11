import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Customer, Debt, Payment } from "./models.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const balanceOf = (debt) =>
  Math.max(0, Number(debt.amount) - Number(debt.paidAmount || 0));

const statusOf = (debt) => {
  const balance = balanceOf(debt);
  if (balance <= 0) return "Paid";
  if (Number(debt.paidAmount || 0) > 0) return "Partial";
  return "Unpaid";
};

app.get("/api/health", (req, res) => {
  res.json({ message: "Sari-Sari Store API is running." });
});

app.get("/api/dashboard", asyncRoute(async (req, res) => {
  const [customers, debts, payments] = await Promise.all([
    Customer.countDocuments(),
    Debt.find().populate("customer", "name"),
    Payment.find()
  ]);

  const totalUtang = debts.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalPaid = debts.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
  const outstanding = debts.reduce((sum, item) => sum + balanceOf(item), 0);

  res.json({
    totalCustomers: customers,
    totalUtang,
    totalPaid,
    outstanding,
    totalPayments: payments.length,
    recentDebts: debts.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)
      .map((d) => ({
        _id: d._id,
        customerName: d.customer?.name || "Deleted customer",
        description: d.description,
        amount: d.amount,
        balance: balanceOf(d),
        status: statusOf(d),
        date: d.date
      }))
  });
}));

app.get("/api/customers", asyncRoute(async (req, res) => {
  const customers = await Customer.find().sort({ name: 1 });
  res.json(customers);
}));

app.post("/api/customers", asyncRoute(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ message: "Customer name is required." });
  const customer = await Customer.create({
    name,
    contact: req.body.contact || "",
    address: req.body.address || ""
  });
  res.status(201).json(customer);
}));

app.put("/api/customers/:id", asyncRoute(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    {
      name: String(req.body.name || "").trim(),
      contact: req.body.contact || "",
      address: req.body.address || ""
    },
    { new: true, runValidators: true }
  );
  if (!customer) return res.status(404).json({ message: "Customer not found." });
  res.json(customer);
}));

app.delete("/api/customers/:id", asyncRoute(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ message: "Customer not found." });

  const linkedDebt = await Debt.exists({ customer: customer._id });
  if (linkedDebt) {
    return res.status(400).json({
      message: "This customer has utang records. Keep the customer record so transaction history stays accurate."
    });
  }
  await customer.deleteOne();
  res.json({ message: "Customer deleted." });
}));

app.get("/api/debts", asyncRoute(async (req, res) => {
  const debts = await Debt.find().populate("customer", "name contact")
    .sort({ date: -1 });
  res.json(debts.map((d) => ({
    ...d.toObject(),
    customerName: d.customer?.name || "Deleted customer",
    balance: balanceOf(d),
    status: statusOf(d)
  })));
}));

app.post("/api/debts", asyncRoute(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!req.body.customer || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: "Choose a customer and enter a valid amount." });
  }
  const customer = await Customer.findById(req.body.customer);
  if (!customer) return res.status(404).json({ message: "Customer not found." });

  const debt = await Debt.create({
    customer: customer._id,
    description: req.body.description || "Store purchase",
    amount,
    date: req.body.date ? new Date(req.body.date) : new Date(),
    dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
    notes: req.body.notes || ""
  });
  res.status(201).json(debt);
}));

app.get("/api/payments", asyncRoute(async (req, res) => {
  const payments = await Payment.find()
    .populate("customer", "name")
    .populate("debt", "description amount")
    .sort({ date: -1 });
  res.json(payments.map((p) => ({
    ...p.toObject(),
    customerName: p.customer?.name || "Deleted customer",
    debtDescription: p.debt?.description || "Utang record"
  })));
}));

app.post("/api/payments", asyncRoute(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!req.body.debt || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: "Choose an utang record and enter a valid payment." });
  }

  const debt = await Debt.findById(req.body.debt);
  if (!debt) return res.status(404).json({ message: "Utang record not found." });

  const balance = balanceOf(debt);
  if (balance <= 0) return res.status(400).json({ message: "This utang is already fully paid." });
  if (amount > balance) {
    return res.status(400).json({ message: "Payment cannot be greater than the remaining balance." });
  }

  const payment = await Payment.create({
    debt: debt._id,
    customer: debt.customer,
    amount,
    method: req.body.method || "Cash",
    date: req.body.date ? new Date(req.body.date) : new Date(),
    notes: req.body.notes || ""
  });

  debt.paidAmount = Number(debt.paidAmount || 0) + amount;
  await debt.save();

  res.status(201).json(payment);
}));

app.get("/api/history", asyncRoute(async (req, res) => {
  const [debts, payments] = await Promise.all([
    Debt.find().populate("customer", "name"),
    Payment.find().populate("customer", "name")
  ]);

  const events = [
    ...debts.map((d) => ({
      _id: `debt-${d._id}`,
      type: "Utang Added",
      customerName: d.customer?.name || "Deleted customer",
      description: d.description,
      amount: d.amount,
      date: d.date
    })),
    ...payments.map((p) => ({
      _id: `payment-${p._id}`,
      type: "Payment Received",
      customerName: p.customer?.name || "Deleted customer",
      description: p.method || "Payment",
      amount: p.amount,
      date: p.date
    }))
  ];

  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(events);
}));

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (error.name === "CastError" || error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }
  res.status(500).json({ message: error.message || "Internal server error." });
});

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sari_sari_utang")
  .then(() => {
    console.log("Connected to MongoDB: sari_sari_utang");
    app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });