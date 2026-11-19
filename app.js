const express = require("express");
const mongoose = require("mongoose");
const app = express();
const methodOverride = require("method-override");

const applicantRoutes = require("./routes/applicant");
const courseRoutes = require("./routes/course");
const yearRoutes = require("./routes/year");
const signatoryRoutes = require("./routes/signatory");
const facultyRoutes = require("./routes/faculty");
const addressRoutes = require("./routes/address");
const courseSchedule = require("./routes/courseSchedule");
const noticeRoutes = require("./routes/notice");
const honorariumRoutes = require("./routes/honorarium");
const resultRoutes = require("./routes/result");

const path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  "/fullcalendar",
  express.static(path.join(__dirname, "node_modules/fullcalendar")),
);
app.use(
  "/handsontable",
  express.static(path.join(__dirname, "node_modules/handsontable/dist")),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

async function main() {
  await mongoose.connect("mongodb://localhost:27017/SDC");
}
main()
  .then(() => console.log("connected to DB"))
  .catch((e) => {
    console.log(e);
  });

app.listen(8080, () => {
  console.log("server is listening on 8080");
});

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.use("/applicant", applicantRoutes);
app.use("/course", courseRoutes);
app.use("/year", yearRoutes);
app.use("/signatory", signatoryRoutes);
app.use("/faculty", facultyRoutes);
app.use("/address", addressRoutes);
app.use("/course", courseSchedule);
app.use("/course", noticeRoutes);
app.use("/course", honorariumRoutes);
app.use("/course", resultRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    return res.status(500).json({ message: err.message || "Server error" });
  }

  res.status(500).send(err.message || "Some Error Occurred");
});
