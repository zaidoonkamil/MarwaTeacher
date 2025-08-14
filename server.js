require("dotenv").config();
require('./models'); 
const express = require("express");
const sequelize = require("./config/db");
const usersRouter = require("./routes/user");
const adsRoutes = require("./routes/ads");
const courseRoutes = require("./routes/course");
const lessonRoutes = require("./routes/lesson");
const examRoutes = require('./routes/exam');
const gradesRoutes = require('./routes/grades');

const app = express();
app.use(express.json());
app.use("/uploads", express.static("./" + "uploads"));


sequelize.sync({ force: false })
    .then(() => console.log("✅ Database & User table synced!"))
    .catch(err => console.error("❌ Error syncing database:", err));


app.use("/", usersRouter);
app.use("/", adsRoutes);
app.use("/", courseRoutes);
app.use("/", lessonRoutes);
app.use("/", examRoutes);
app.use("/", gradesRoutes);

const PORT = 1200;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});