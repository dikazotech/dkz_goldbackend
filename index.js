const express = require("express");

const customerRouter = require("./routes/customer");
const clientUploadRouter = require("./routes/upload");
const app = express();

app.use("/public", express.static("public"));

const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

mongoose.connect(
  "mongodb+srv://rehankhan:B7uzwg8DlkIUJ9xb@cluster0.yimbm.mongodb.net/gold?retryWrites=true&w=majority"
);

app.use(bodyParser.json());
app.use(cors());

app.use(customerRouter);
app.use(clientUploadRouter);

app.listen(process.env.PORT | 4009, function () {
  console.log("listening on port 4009");
});
