const express = require("express");
const clientUploadRouter = express.Router();
const multer = require("multer");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const fs = require("fs");
const mongoose = require("mongoose");
const { customerSchema } = require("../models/customer");

const CustomerModel = mongoose.model("customer", customerSchema);
var storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: function (req, file, cb) {
    //req.body is empty...
    //How could I get the new_file_name property sent from client here?
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.use(express.static("./public/uploads"));

clientUploadRouter.post("/upload", upload.array("attachment"), uploadFiles);
async function uploadFiles(req, res) {
  const alt = [];
  await req.files.forEach(async function (file, i) {
    // console.log(alt);
    if (req.files.length - 1 === i) {
      res.json(req.files);
    }
  });
}

clientUploadRouter.post(
  "/upload-single",
  upload.array("attachment"),
  uploadFile
);
async function uploadFile(req, res) {
  const colte = {
    destination: req.files[0].destination,
    encoding: req.files[0].encoding,
    fieldname: req.files[0].fieldname,
    filename: req.files[0].filename,
    mimetype: req.files[0].mimetype,
    originalname: req.files[0].originalname,
    path: req.files[0].path,
    size: req.files[0].size,
    uploadedBy: existsUser._id,
  };
  res.json({
    status: true,
    message: "File uploaded successfully",
    data: req.files[0].path,
  });
}

clientUploadRouter.post(
  "/upload-profile/:id",
  upload.array("attachment"),
  uploadFile
);
async function uploadFile(req, res) {
  //   console.log(res);
  CustomerModel.findOneAndUpdate(
    { rememberToken: req.params.id },
    { $set: { profilePicture: req.files[0].path } }
  ).then(() => {
    res.json({
      status: true,
      message: "File uploaded successfully",
      data: req.files[0].path,
    });
  });
}

module.exports = clientUploadRouter;
