const express = require('express');
const { User, Grade, Unit} = require('../models');
const bcrypt = require("bcrypt");
const saltRounds = 10;
const router = express.Router();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const multer = require("multer");
const upload = multer();
const { Op } = require('sequelize');


router.post("/users", upload.none(), async (req, res) => {
  const { name, phone, password, role = 'user' } = req.body;

  try {
    const existingUser = await User.findOne({ where: { phone } });

    if (existingUser) {
      return res.status(400).json({ error: "الهاتف قيد الاستخدام بالفعل" });
    }

    if (phone.length !== 13) {
      return res.status(400).json({ error: "يجب أن يتكون رقم الهاتف من 13 رقمًا" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = await User.create({ name, phone, password: hashedPassword, role });

    const existingGrade = await Grade.findOne({
      order: [['createdAt', 'ASC']],
    });

    await Grade.create({
      userId: user.id,
      unitName: existingGrade?.unitName || "Unit One",
      lectureName: existingGrade?.lectureName || "lecture No",
      lectureNos: existingGrade?.lectureNos || ["lecture 1", "lecture 2", "lecture 3", "lecture 4", "lecture 5"],
      examGrades: [0, 0, 0, 0, 0],
      originalGrades: [0, 0, 0, 0, 0],
      resitGrades1: [0, 0, 0, 0, 0],
      resitGrades2: [0, 0, 0, 0, 0]
    });


    res.status(201).json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '365d' } 
    );
};

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: "Access denied, no token provided" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
};

router.post("/login", upload.none() ,async (req, res) => {
    const { phone, password } = req.body;

    try {
        const user = await User.findOne({ where: { phone } });

        if (!user) {
            return res.status(400).json({ error: "هاتف غير صالح" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: "كلمة المرور غير صالحة" });
        }

        const token = generateToken(user);

        res.status(201).json({ message: "Login successful",
            user:{
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        },
        token: token 
    });
    } catch (err) {
        console.error("❌ Error logging in:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      where: { role: { [Op.ne]: 'admin' } },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      totalItems: count,
      totalPages,
      currentPage: page,
      users
    });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/all-users", async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: { [Op.ne]: 'admin' } },
      attributes: ['name'],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(users);
  } catch (err) {
    console.error("❌ Error fetching all users:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "لم يتم العثور على المستخدم" });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/users/:id", authenticateToken ,async (req,res)=>{
    const {id} = req.params;

    if (req.user.id !== parseInt(id)) {
        return res.status(403).json({ error: "Access denied, you are not authorized to view this user's data" });
    }

    try{
        const user = await User.findByPk(id);
        if(!user){
            return res.status(404).json({error:"User not found"});
        }
        res.status(200).json(user);
    }catch(err){
        console.error(" Error fetching user:",err);
        res.status(500).json({error:"Internal Server Error"});
    }
    }
);

router.delete("/users/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: "لم يتم العثور على المستخدم" });
        }

        await user.destroy();
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("❌ Error deleting user:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;