const express = require("express");
const Ads = require("../models/ads");
const router = express.Router();
const upload = require("../middlewares/uploads");

router.post("/ads", upload.array("images", 5), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }

    const images = req.files.map(file => file.filename);

    const ads = await Ads.create({
      images,
      title,
      description: description,
    });

    res.status(201).json({ message: "ads created successfully", ads });
  } catch (err) {
    console.error("❌ Error creating ads:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/ads", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: ads } = await Ads.findAndCountAll({
            offset,
            limit,
            order: [['createdAt', 'DESC']]
        });

        res.json({total: count, page, totalPages: Math.ceil(count / limit), ads });
    } catch (err) {
        console.error("❌ Error fetching ads:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.delete("/ads/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const ad = await Ads.findByPk(id);
        if (!ad) {
            return res.status(404).json({ error: "Ad not found" });
        }

        await ad.destroy();
        res.status(200).json({ message: "Ad deleted successfully" });
    } catch (err) {
        console.error("❌ Error deleting ad:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;
