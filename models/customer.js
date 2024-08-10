const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customerSchema = new Schema(
  {
    name: { type: String, required: false },
    age: { type: Number, required: false },
    gender: { type: String, required: false },
    maritalStatus: { type: String, required: false },
    profilePicture: { type: String, required: false },
    referralCode: { type: String, required: false },
    email: { type: String, required: false },
    phone: { type: Number, required: false },
    otp: { type: String, required: false },
    rememberToken: { type: String, required: false },
    phoneVerified: { type: Boolean, required: false },
    currentGoldInGrams: { type: Number, required: false },
    currentGoldInAmount: { type: Number, required: false },
    walletBalance: { type: Number, required: false },
    sipEnable: { type: Boolean, required: false, default: false },
    sipAmount: { type: Number, required: false },
    sipFrequency: { type: Number, required: false },
    lastSip: { type: Date, required: false },
    status: { type: Boolean, required: false, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const goldpriceSchema = new Schema(
  {
    goldPrice: { type: Number, required: true },
    priceFor: { type: String, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
const transactionSchema = new Schema(
  {
    customerId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "customer",
      required: true,
    },
    txnNo: { type: Number, required: true },
    txnId: { type: String, required: true },
    particular: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: false },
    modeOfPayment: { type: String, required: true },
    paymentId: { type: String, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const investmentSchema = new Schema(
  {
    investmentId: { type: String, required: true }, // dummy string
    transRefId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "transaction",
      required: true,
    }, // reference to transaction
    customerId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "customer",
      required: true,
    },
    investmentGrams: { type: Number, required: true },
    investmentAmount: { type: Number, required: true },
    goldPrice: { type: Number, required: true },
    goldType: { type: String, required: true }, // buy or sell
    status: { type: Boolean, required: true, default: true }, // investment status
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const customerSupportSchema = new Schema(
  {
    phone: { type: String, required: false },
    email: { type: String, required: false },
    issue: { type: String, required: false },
    reason: { type: String, required: false },
    attachment: { type: String, required: false },
    status: { type: Boolean, required: false, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports.customerSchema = customerSchema;
module.exports.transactionSchema = transactionSchema;
module.exports.investmentSchema = investmentSchema;
module.exports.goldpriceSchema = goldpriceSchema;
module.exports.customerSupportSchema = customerSupportSchema;
