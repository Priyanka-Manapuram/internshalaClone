const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, default: "" },
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  invoiceNumber: { type: String, required: true },
  paidAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Invoice", InvoiceSchema);