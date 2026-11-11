import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

const debtSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },
    description: { type: String, trim: true, default: "Store purchase" },
    amount: { type: Number, required: true, min: 0.01 },
    paidAmount: { type: Number, default: 0, min: 0 },
    date: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },
    notes: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

const paymentSchema = new mongoose.Schema(
  {
    debt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Debt",
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, trim: true, default: "Cash" },
    date: { type: Date, default: Date.now },
    notes: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

export const Customer = mongoose.model("Customer", customerSchema);
export const Debt = mongoose.model("Debt", debtSchema);
export const Payment = mongoose.model("Payment", paymentSchema);