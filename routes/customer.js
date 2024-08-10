const express = require("express");
const mongoose = require("mongoose");
const {
  customerSchema,
  transactionSchema,
  investmentSchema,
  goldpriceSchema,
  customerSupportSchema,
} = require("../models/customer");
const bcrypt = require("bcrypt");
const axios = require("axios");
const puppeteer = require("puppeteer");
const fs = require("fs");

const customerRouter = express.Router();

const CustomerModel = mongoose.model("customer", customerSchema);
const TransactionModel = mongoose.model("transaction", transactionSchema);
const InvestmentModel = mongoose.model("investment", investmentSchema);
const GoldPriceModel = mongoose.model("goldprice", goldpriceSchema);
const CSupportModel = mongoose.model("suctomer_suport", customerSupportSchema);
const Razorpay = require("razorpay");
var instance = new Razorpay({
  key_id: "rzp_test_s7rXzSSkEG43th",
  key_secret: "s1jHaXqUDzoUqfZVHNnm9zbX",
});

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function generateRandomGoldPrice(min, max) {
  // Generate a random float between min and max
  const randomPrice = (Math.random() * (max - min) + min).toFixed(2);
  return parseFloat(randomPrice);
}

function generateOTP(length) {
  // Define characters that can be used in the OTP
  const chars = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    // Generate a random index to select a character from chars
    const randomIndex = Math.floor(Math.random() * chars.length);
    // Append the selected character to the OTP
    otp += chars[randomIndex];
  }
  return otp;
}

customerRouter.get("/get-gold-buy-price", async function (req, res) {
  const goldPrice = generateRandomGoldPrice(7553.43, 7777.77);
  const colte = { goldPrice: goldPrice, priceFor: "buy" };
  await GoldPriceModel.create(colte).then((response) => {
    res.send({ status: true, type: "success", data: response });
  });
});

customerRouter.get("/get-gold-sell-price", async function (req, res) {
  const goldPrice = generateRandomGoldPrice(7503.43, 7707.77);
  const colte = { goldPrice: goldPrice, priceFor: "sell" };
  await GoldPriceModel.create(colte).then((response) => {
    res.send({ status: true, type: "success", data: response });
  });
});

customerRouter.get("/get-gold-price", async function (req, res) {
  const buy = await refereshGoldBuyPrice();
  const sell = await refereshGoldSellPrice();
  res.send({ status: true, type: "success", data: { buy: buy, sell: sell } });
});

async function refereshGoldSellPrice() {
  const goldPrice = generateRandomGoldPrice(7503.43, 7707.77);
  const colte = { goldPrice: goldPrice, priceFor: "sell" };
  await GoldPriceModel.create(colte);
  return colte;
}

async function refereshGoldBuyPrice() {
  const goldPrice = generateRandomGoldPrice(7553.43, 7777.77);
  const colte = { goldPrice: goldPrice, priceFor: "buy" };
  await GoldPriceModel.create(colte);
  return colte;
}

customerRouter.post("/c1/login", async function (req, res) {
  const otp = generateOTP(6);
  // console.log(otp);
  await CustomerModel.findOne({
    phone: req.body.phone,
  }).then(async function (existsUser) {
    if (existsUser !== null) {
      CustomerModel.findOneAndUpdate(
        { phone: req.body.phone },
        { $set: { rememberToken: otp } }
      ).then(async function () {
        const smsData = {
          sender_id: "DKZINV",
          message: "168960",
          // "message":$text,
          // "messege_id": 160043,
          language: "english",
          route: "dlt",
          entity_id: "1201160714810173527",
          numbers: req.body.phone, // comma separated numbers
          variables_values: otp,
        };
        axios.post("https://www.fast2sms.com/dev/bulkV2", smsData, {
          headers: {
            accept: "*/*",
            "cache-control": "no-cache",
            "content-type": "application/json",
            authorization:
              "f9htlY0aujVGR6MQ2x5PzkNo3dTJbCqDBEp4XgiIWU7vncr1eA6jC3i01KZkqM7tETz9wrYoIh2aQdpm",
          },
        });
        res.send({
          status: true,
          message: "OTP send to mobile number",
        });
      });
    } else {
      CustomerModel.create({
        phone: req.body.phone,
        rememberToken: otp,
        referralCode: "CUS" + makeid(6).toUpperCase(),
      }).then(async function () {
        res.send({
          status: true,
          message: "OTP send to mobile number",
        });
      });
    }
  });
});

customerRouter.post("/c1/verifyotp", async function (req, res) {
  const otp = generateOTP(6);
  // console.log(otp);
  await CustomerModel.findOne({
    phone: req.body.phone,
    rememberToken: req.body.rememberToken,
  }).then(async function (existsUser) {
    if (existsUser !== null) {
      const token = makeid(20);
      CustomerModel.findOneAndUpdate(
        { phone: req.body.phone },
        { $set: { rememberToken: token, phoneVerified: true } }
      ).then(async function () {
        res.send({
          status: true,
          message: "OTP validated!",
          token: token,
        });
      });
    } else {
      res.send({
        status: false,
        message: "OTP not valid!",
      });
    }
  });
});

customerRouter.post("/c1/investNow", async (req, res) => {
  CustomerModel.findOne({ rememberToken: req.body.token }).then(
    async (detail) => {
      console.log(detail);
      const receipt = "order_rcptid_" + Date.now();
      var options = {
        amount: req.body.amount * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: receipt,
      };
      instance.orders.create(options, async function (err, order) {
        const order1 = {
          customerId: detail._id,
          amount: req.body.amount, // amount in the smallest currency unit
          currency: "INR",
          orderId: order.id,
        };
        res.send({
          type: "success",
          data: order,
          amount: req.body.amount,
          detail: detail,
        });
      });
    }
  );
});

customerRouter.post("/c1/confirm-order", async (req, res) => {
  CustomerModel.findOne({ rememberToken: req.body.token }).then(
    async (detail) => {
      if (detail !== null) {
        TransactionModel.countDocuments({}).then(async (count) => {
          const transSchema = {
            customerId: detail._id,
            txnNo: count + 1,
            txnId: makeid(9),
            particular: "buy digital gold",
            type: "credit",
            amount: req.body.amount,
            description: "Buy gold investment",
            modeOfPayment: "online",
            paymentId: req.body.paymentId,
          };
          await TransactionModel.create(transSchema).then(async (trans) => {
            const invest = {
              investmentId: makeid(10),
              transRefId: trans._id,
              customerId: detail._id,
              investmentGrams: req.body.goldgrams,
              investmentAmount:
                req.body.amount - ((req.body.amount / 100) * 3).toFixed(2),
              goldPrice: req.body.goldPrice,
              goldType: "buy",
            };
            await InvestmentModel.create(invest).then(async (inv) => {
              res.send({
                status: true,
                type: "success",
                message: "Transaction created successfully",
              });
            });
          });
        });
      }
    }
  );
});

customerRouter.get("/c1/list-investment", async (req, res) => {
  CustomerModel.findOne({ rememberToken: req.query.token }).then(
    async (detail) => {
      if (detail !== null) {
        await InvestmentModel.find({ customerId: detail._id })
          .populate({ path: "transRefId" })
          .then(async (list) => {
            const goldPriceData = await refereshGoldSellPrice();
            const currentPricePerGram = goldPriceData.goldPrice;

            const grams = detail.currentGoldInGrams;
            const amount = detail.currentGoldInAmount;

            let colte = [];
            const presendGoldPrice = grams * currentPricePerGram;

            for (let i = 0; i < list.length; i++) {
              const dd = list[i];

              const data = {
                amount: dd.investmentAmount,
                grams: dd.investmentGrams,
                created: dd.created_at,
                id: dd._id,
              };
              colte.push(data);
            }
            const alldata = {
              amount: amount.toFixed(2),
              grams: grams.toFixed(4),
              data: colte,
              presendGoldPrice: presendGoldPrice.toFixed(2),
            };
            res.send({ status: true, type: "success", data: alldata });
          });
      }
    }
  );
});

customerRouter.get("/c1/get-invoice", async function (req, res) {
  // launch a new chrome instance
  const browser = await puppeteer.launch({
    headless: true,
  });

  InvestmentModel.findOne({ _id: req.query.id })
    .populate({ path: "customerId" })
    .populate({ path: "transRefId" })
    .then(async (invoice) => {
      //   console.log(req);
      if (invoice !== null) {
        // create a new page
        const page = await browser.newPage();

        // set your html as the pages content
        const html = `

  <div style="margin:10%;font-family: 'Roboto', Arial, sans-serif;">
          <div style="display: flex; justify-content: space-between; padding-top: 0.75rem;padding-bottom: 0.75rem;">
            <div>TAX INVOICE</div>
            <div>Original - Customer Copy</div>
          </div>
          <div style="padding-top: 0.75rem;padding-bottom: 0.75rem; color: #6366f1;">
            Dikazo Solutions Private Limited
          </div>
          <div style="display: flex; justify-content: space-between; font-size: .75rem;line-height: 1rem;">
            <div>
              D No 1, 98/9/3/23, Image Gardens Rd,
              above Axis bank
            </div>
            <div>PAN No : AAGCJ2412E</div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: .75rem;line-height: 1rem;">
            <div>Madhapur,</div>
            <div>GSTIN : 29AAGCJ2412E1ZV</div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: .75rem;line-height: 1rem;">
            <div>Telangana 500081</div>
            <div>CIN No : U47733KA2023PTC181719</div>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 0.75rem;padding-bottom: 0.75rem; margin-top: 1.5rem;margin-bottom: 1.5rem; border-bottom: 1px solid; border-bottom-color: #e2e2e2; border-top: 1px solid; border-top-color: #e2e2e2;">
            <div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #6366f1;">Order No</div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #000000">${
                invoice.transRefId.txnId + invoice.transRefId.txnNo
              }</div>
            </div>
            <div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #6366f1;">Date</div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #000000">${formatDate(
                invoice.created_at
              )}</div>
            </div>
            <div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #6366f1;">Customer ID</div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #000000">${
                invoice.customerId._id
              }</div>
            </div>
          </div>
          <div>
            <div style="font-size: 0.875rem; line-height: 1.25rem; color: #6366f1;">Bill to</div>
            <div style="font-size: 0.875rem; line-height: 1.25rem; color: #000000">Name : Mohammed</div>
            <div style="font-size: 0.875rem; line-height: 1.25rem; color: #000000">Phone Number : +91${
              invoice.customerId.phone
            }</div>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 0.75rem;padding-bottom: 0.75rem; margin-top: 1.5rem;margin-bottom: 1.5rem; border-bottom: 1px solid; border-bottom-color: #e2e2e2;">
            <div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #6366f1;">Description</div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #000000">
                Gold 24 Carat
                <br />
                HSN Code : 71081300
              </div>
            </div>
            <div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #6366f1;">Grams*</div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #000000">${
                invoice.investmentGrams
              }</div>
            </div>
            <div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #6366f1;">Rate Per Gram</div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #000000">₹ ${
                invoice.goldPrice
              }</div>
            </div>
            <div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #6366f1;">Total Amount</div>
              <div style="font-size: 0.875rem; line-height: 1.25rem; color: #000000">₹ ${
                invoice.investmentAmount
              }</div>
            </div>
          </div>
          <div style="width: 100%; display: flex;">
            <div style="width: 50%"></div>
            <div style="width: 50%">
              <div style="padding-top: 1.25rem;padding-bottom: 1.25rem; margin-bottom: 0.75rem;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="font-size: 16px; line-height: 1rem; text-decoration: underline; padding-bottom: 1.5rem;">Applied Tax</div>
                    <div>(1.5% SGST Tax+1.5% CGST Tax)</div>
                  </div>
                  <div>₹ ${((invoice.transRefId.amount / 100) * 3).toFixed(
                    2
                  )}</div>
                </div>
              </div>
              <div style="padding-top: 1.25rem;padding-bottom: 1.25rem; border-bottom: 1px solid; border-bottom-color: #e2e2e2; border-top: 1px solid; border-top-color: #e2e2e2">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="font-size: 1.25rem;line-height: 1.75rem; color: #6366f1;">
                      Total Invoice Value
                    </div>
                  </div>
                  <div>₹ ${invoice.transRefId.amount}</div>
                </div>
              </div>
            </div>
          </div>
          <div style="padding-top: 0.75rem;padding-bottom: 0.75rem;">
            <b>Declaration</b>
            <div>
              We declare that the above quantity of goods are kept by the seller
              in a safe vault on behalf of the buyer. It can be delivered in
              minted product as per the Terms & Conditions.
            </div>
          </div>
          <div style="padding-top: 0.75rem;padding-bottom: 0.75rem;">
            <b>Declaration</b>
            <div>
              The gold grams you own are calculated by dividing the amount paid
              net of GST by the gold rate and rounded down to 4 decimal places.
              For example, .00054 grams will be rounded down to .0005 grams.
            </div>
          </div>
          <div style="padding-top: 0.75rem;padding-bottom: 0.75rem;">
            <div>(E & O.E.)</div>
            <div>(Subject to Realization)</div>
          </div>
          <div style="display: flex; justify-content: flex-end; text-align: center;">
            <div>
              For Dikazo Solutions Private Limited
              <br />
              (Authorized Signatory)
            </div>
          </div>
        </div>`;
        await page.setContent(html, {
          waitUntil: "domcontentloaded",
        });

        // create a pdf buffer
        const pdfBuffer = await page.pdf({
          format: "A4",
        });

        // or a .pdf file
        await page.pdf({
          format: "A4",
          path: `public/invoice/${invoice.transRefId.txnId}.pdf`,
        });

        // close the browser
        await browser.close();
        res.send({
          status: true,
          type: "success",
          data: `${invoice.transRefId.txnId}.pdf`,
        });
      }
    });
});

const formatDate = (isoString) => {
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date string");
  }

  // Format the date to 'dd/mm/yyyy'
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  const formattedDate = date
    .toLocaleDateString("en-GB", options)
    .split("/")
    .reverse()
    .join("/");

  return formattedDate;
};

customerRouter.post("/c1/sell-gold", async (req, res) => {
  CustomerModel.findOne({ rememberToken: req.body.token }).then(
    async (detail) => {
      if (detail !== null) {
        if (req.body.grams < detail.currentGoldInGrams) {
          const grams = detail.currentGoldInGrams - req.body.grams;
          const amount = grams * req.body.goldPrice;

          TransactionModel.countDocuments({}).then(async (count) => {
            const transSchema = {
              customerId: detail._id,
              txnNo: count + 1,
              txnId: makeid(9),
              particular: "gold sold",
              type: "debit",
              amount: req.body.amount,
              description: "sell digital gold",
              modeOfPayment: "wallet",
              paymentId: "abc123",
            };
            await CustomerModel.findOneAndUpdate(
              { rememberToken: req.body.token },
              {
                $set: {
                  currentGoldInGrams: grams,
                  currentGoldInAmount: amount,
                },
              }
            ).then(async () => {
              await TransactionModel.create(transSchema).then(async (trans) => {
                res.send({
                  status: true,
                  type: "success",
                  message: "Gold sold successfully",
                });
              });
            });
          });
        }
      }
    }
  );
});

customerRouter.post("/c1/get-profile/:token", function (req, res) {
  CustomerModel.findOne({ rememberToken: req.params.token })
    .then((response) => {
      const colte = {
        profilePicture: response.profilePicture,
        name: response.name,
        phone: response.phone,
        age: response.age,
        gender: response.gender,
        email: response.email,
        walletBalance: response.walletBalance,
        sipEnable: response.sipEnable,
        sipAmount: response.sipAmount,
        sipFrequency: response.sipFrequency,
      };
      res.send({ status: true, type: "success", data: colte });
    })
    .catch((err) => {
      res.send({ status: false, type: "error", data: err });
    });
});

customerRouter.post("/c1/update-profile/:token", function (req, res) {
  CustomerModel.findOneAndUpdate(
    { rememberToken: req.params.token },
    {
      $set: {
        profilePicture: req.body.profilePicture,
        name: req.body.name,
        // phone: req.body.phone,
        age: req.body.age,
        gender: req.body.gender,
        email: req.body.email,
      },
    }
  )
    .then((response) => {
      res.send({ status: true, type: "success", data: response.data });
    })
    .catch((err) => {
      res.send({ status: false, type: "error", data: err });
    });
});

customerRouter.post("/c1/generate-otp", async function (req, res) {
  const otp = generateOTP(6);
  // console.log(otp);
  await CustomerModel.findOne({
    phone: req.body.phone,
  }).then(async function (existsUser) {
    if (existsUser !== null) {
      CustomerModel.findOneAndUpdate(
        { phone: req.body.phone },
        { $set: { otp: otp } }
      ).then(async function () {
        const smsData = {
          sender_id: "DKZINV",
          message: "168960",
          // "message":$text,
          // "messege_id": 160043,
          language: "english",
          route: "dlt",
          entity_id: "1201160714810173527",
          numbers: req.body.phone, // comma separated numbers
          variables_values: otp,
        };
        axios.post("https://www.fast2sms.com/dev/bulkV2", smsData, {
          headers: {
            accept: "*/*",
            "cache-control": "no-cache",
            "content-type": "application/json",
            authorization:
              "f9htlY0aujVGR6MQ2x5PzkNo3dTJbCqDBEp4XgiIWU7vncr1eA6jC3i01KZkqM7tETz9wrYoIh2aQdpm",
          },
        });
        res.send({
          status: true,
          message: "OTP send to mobile number",
        });
      });
    } else {
      res.send({
        status: true,
        message: "Wrong user",
      });
    }
  });
});

customerRouter.post("/c1/verify-change-phone-otp", async function (req, res) {
  const otp = generateOTP(6);
  // console.log(otp);
  await CustomerModel.findOne({
    phone: req.body.phone,
    otp: req.body.rememberToken,
  }).then(async function (existsUser) {
    if (existsUser !== null) {
      const token = makeid(20);
      CustomerModel.findOneAndUpdate(
        { phone: req.body.phone },
        { $set: { phone: req.body.phone, phoneVerified: true } }
      ).then(async function () {
        res.send({
          status: true,
          message:
            "OTP validated! Phone number: " +
            req.body.phone +
            " changed successfully",
          token: token,
        });
      });
    } else {
      res.send({
        status: false,
        message: "OTP not valid!",
      });
    }
  });
});

customerRouter.post("/c1/contact-support", async function (req, res) {
  CSupportModel.create(req.body).then(function () {
    res.send({
      status: true,
      type: "success",
      message: "Your issue registered successfully",
    });
  });
});

customerRouter.post("/c1/confirm-wallet-order", async (req, res) => {
  CustomerModel.findOne({ rememberToken: req.body.token }).then(
    async (detail) => {
      if (detail !== null) {
        TransactionModel.countDocuments({}).then(async (count) => {
          const transSchema = {
            customerId: detail._id,
            txnNo: count + 1,
            txnId: makeid(9),
            particular: "add money in wallet",
            type: "credit",
            amount: req.body.amount,
            description: "add money in wallet",
            modeOfPayment: "online",
            paymentId: req.body.paymentId,
          };
          await TransactionModel.create(transSchema).then(async (trans) => {
            await CustomerModel.findOneAndUpdate(
              { rememberToken: req.body.token },
              { $inc: { walletBalance: req.body.amount } }
            ).then((cc) => {
              res.send({
                status: true,
                type: "success",
                message: "Money added successfully",
              });
            });
          });
        });
      }
    }
  );
});

customerRouter.post("/c1/update-sip", async (req, res) => {
  console.log(req.header("token"));
  CustomerModel.findOne({ rememberToken: req.header("token") }).then(
    async (detail) => {
      if (detail !== null) {
        await CustomerModel.findOneAndUpdate(
          { rememberToken: req.header("token") },
          {
            $set: {
              sipEnable: req.body.sipEnable,
              sipAmount: req.body.sipAmount,
              sipFrequency: req.body.sipFrequency,
            },
          }
        ).then((cc) => {
          res.send({
            status: true,
            type: "success",
            message: "SIP has been updated successfully",
          });
        });
      }
    }
  );
});

module.exports = customerRouter;
