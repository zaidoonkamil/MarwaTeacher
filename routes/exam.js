const express = require('express');
const router = express.Router();
const { Question, Choice, ExamAnswer, QuestionAnswer, TextExamAnswer, Exam, User} = require('../models');
const multer = require("multer");
const upload = require("../middlewares/uploads");
const { Op } = require("sequelize");


router.post("/exams", upload.none(), async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "العنوان مطلوب" });
    }

    const exam = await Exam.create({ title });

    res.status(201).json({
      message: "تم إنشاء الامتحان بنجاح",
      exam
    });

  } catch (err) {
    console.error("❌ Error creating exam:", err);
    res.status(500).json({ error: "حدث خطأ أثناء إنشاء الامتحان" });
  }
});

router.get("/exams", async (req, res) => {
  try {
    const exams = await Exam.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Question,
          attributes: ['id', 'type'],
          as: 'questions'
        }
      ]
    });

    const result = exams.map(exam => {
      const questions = exam.questions || [];
      const counts = {
        text: questions.filter(q => q.type === 'text').length,
        multiple_choice: questions.filter(q => q.type === 'multiple_choice').length
      };

      return {
        id: exam.id,
        title: exam.title,
        createdAt: exam.createdAt,
        questionCounts: counts
      };
    });

    res.status(200).json(result);

  } catch (err) {
    console.error("❌ Error fetching exams:", err);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الامتحانات" });
  }
});

router.delete("/exam/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const exam = await Exam.findByPk(id, {
      include: [
        { model: Question, as: 'questions', include: ['choices', 'questionAnswers'] }
      ]
    });

    if (!exam) {
      return res.status(404).json({ error: "الامتحان غير موجود" });
    }

    await TextExamAnswer.destroy({
      where: { examId: id }
    });

    const examAnswers = await ExamAnswer.findAll({ where: { examId: id } });

    for (const examAnswer of examAnswers) {
      await QuestionAnswer.destroy({
        where: { examAnswerId: examAnswer.id }
      });
    }

    await ExamAnswer.destroy({
      where: { examId: id }
    });

    for (const question of exam.questions) {
      await Choice.destroy({ where: { questionId: question.id } });
      await QuestionAnswer.destroy({ where: { questionId: question.id } });
    }

    await Question.destroy({
      where: { examId: id }
    });

    await Exam.destroy({ where: { id } });

    res.status(200).json({ message: "تم حذف الامتحان وكل التفاصيل المرتبطة به بنجاح" });

  } catch (err) {
    console.error("❌ Error deleting exam:", err);
    res.status(500).json({ error: "حدث خطأ أثناء حذف الامتحان" });
  }
});

router.post("/questions", async (req, res) => {
  try {
    const { examId, questions } = req.body;

    // تحقق من وجود الامتحان
    const exam = await Exam.findByPk(examId);
    if (!exam) {
      return res.status(400).json({ error: "الامتحان غير موجود. تأكد من examId" });
    }

    const createdQuestions = [];

    for (const q of questions) {
      const question = await Question.create({
        text: q.text,
        examId: examId
      });

      for (const choice of q.choices) {
        await Choice.create({
          text: choice.text,
          isCorrect: choice.isCorrect,
          questionId: question.id
        });
      }

      createdQuestions.push(question);
    }

    res.status(201).json({
      message: "تم إنشاء جميع الأسئلة بنجاح",
      questions: createdQuestions
    });

  } catch (err) {
    console.error("❌ خطأ أثناء إنشاء الأسئلة:", err);
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.get("/questions/:examId", async (req, res) => {
  try {
    const { examId } = req.params;

    const questions = await Question.findAll({
      where: {
        examId,
        type: 'multiple_choice'
      },
      include: [
        {
          model: Choice,
          as: 'choices'
        },
        {
          model: Exam,
          as: 'exam'
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json(questions);

  } catch (err) {
    console.error("❌ Error fetching questions:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/submit-exam", async (req, res) => {
  try {
    const { userId, examId, answers } = req.body;
    let score = 0;

    let examAnswer = await ExamAnswer.findOne({ where: { userId, examId } });

    if (examAnswer) {
      return res.status(400).json({ error: "لقد قمت بتسليم هذا الامتحان مسبقًا." });
    } else {
      examAnswer = await ExamAnswer.create({ userId, examId, score: 0 });
    }

    for (let ans of answers) {
      const question = await Question.findByPk(ans.questionId, {
        include: [{ model: Choice, as: 'choices' }]
      });

      const correctChoice = question.choices.find(c => c.isCorrect);
      const isCorrect = ans.selectedChoiceId === correctChoice.id;

      if (isCorrect) score++;

      await QuestionAnswer.create({
        examAnswerId: examAnswer.id,
        questionId: ans.questionId,
        selectedChoiceId: ans.selectedChoiceId,
        isCorrect
      });
    }

    examAnswer.score = score;
    await examAnswer.save();

    res.status(200).json({
      message: "تم تسليم الامتحان",
      score,
      total: answers.length
    });

  } catch (err) {
    console.error("❌ Error submitting exam:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/exam/:examId/results", async (req, res) => {
  const { examId } = req.params;

  try {
    const totalQuestions = await Question.count({ where: { examId } });

    if (totalQuestions === 0) {
      return res.status(404).json({ error: "الامتحان لا يحتوي على أسئلة" });
    }

    const examAnswers = await ExamAnswer.findAll({
      where: { examId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name"]
        },
        {
          model: QuestionAnswer,
          as: "questionAnswers",
          attributes: ["isCorrect"]
        }
      ]
    });

    const results = examAnswers.map(examAnswer => {
      const correctCount = examAnswer.questionAnswers.filter(qa => qa.isCorrect).length;
      return {
        studentId: examAnswer.user.id,
        studentName: examAnswer.user.name,
        correctAnswers: correctCount,
        totalQuestions: totalQuestions,
        score: `${correctCount}/${totalQuestions}`
      };
    });

    res.status(200).json(results);

  } catch (err) {
    console.error("❌ خطأ أثناء جلب نتائج الامتحان:", err);
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

router.delete("/questions/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. حذف إجابات الطلاب لهذا السؤال
    await QuestionAnswer.destroy({
      where: { questionId: id }
    });

    // 2. حذف الخيارات لهذا السؤال
    await Choice.destroy({
      where: { questionId: id }
    });

    // 3. حذف السؤال نفسه
    const deletedCount = await Question.destroy({
      where: { id }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: "السؤال غير موجود" });
    }

    res.status(200).json({ message: "تم حذف السؤال وكل المتعلقات بنجاح" });

  } catch (err) {
    console.error("❌ Error deleting question:", err);
    res.status(500).json({ error: "حدث خطأ أثناء حذف السؤال" });
  }
});

router.post("/questions/bulk", upload.none(), async (req, res) => {
  try {
    const { examId, questions } = req.body;

    const parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;

    if (!examId || !Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return res.status(400).json({ error: "examId و questions مطلوبان" });
    }

    const createdQuestions = [];

    for (const q of parsedQuestions) {
      if (q.type === 'text' && typeof q.text === 'string' && q.text.trim() !== '') {
        const question = await Question.create({
          text: q.text.trim(),
          examId,
          type: 'text'
        });
        createdQuestions.push(question);
      }
    }

    res.status(201).json({
      message: "تمت إضافة الأسئلة النصية بنجاح",
      count: createdQuestions.length,
      questions: createdQuestions
    });

  } catch (err) {
    console.error("❌ Error creating bulk text questions:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/questionsBulk/:examId", async (req, res) => {
  try {
    const { examId } = req.params;

    if (!examId) {
      return res.status(400).json({ error: "examId مطلوب" });
    }

    const questions = await Question.findAll({
      where: { examId , type: 'text'},
      attributes: ['id', 'text'],
      order: [['id', 'ASC']]
    });

    if (!questions || questions.length === 0) {
      return res.status(404).json({ message: "لا توجد أسئلة لهذا الامتحان" });
    }

    res.status(200).json(questions);

  } catch (err) {
    console.error("❌ Error fetching bulk questions:", err);
    res.status(500).json({ error: "حدث خطأ في السيرفر" });
  }
});

router.post("/submit-text-answer", upload.array("images",5), async (req, res) => {
  try {
    const { userId, examId } = req.body;

    if (!userId || !examId || !req.files || req.files.length === 0) {
      return res.status(400).json({ error: "userId و examId والملف مطلوبة" });
    }

    const images = req.files
     .filter(file => !!file && !!file.filename)
     .map(file => file.filename);


    const existing = await TextExamAnswer.findOne({ where: { userId, examId } });
    if (existing) {
      return res.status(400).json({ error: "لقد قمت برفع الإجابة مسبقًا لهذا الامتحان" });
    }

    const answer = await TextExamAnswer.create({
      userId,
      examId,
      fileUrl: images
    });

    res.status(201).json({
      message: "تم رفع الإجابة بنجاح",
      answer
    });

  } catch (err) {
    console.error("❌ Error uploading text answer:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/text-answers/:examId", async (req, res) => {
  try {
    const { examId } = req.params;

    if (!examId) {
      return res.status(400).json({ error: "examId مطلوب" });
    }

    const answers = await TextExamAnswer.findAll({
      where: { examId },
      include: [
        {
          model: User,
          as: 'user', 
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!answers || answers.length === 0) {
      return res.status(404).json({ message: "لا توجد إجابات نصية لهذا الامتحان" });
    }

    res.status(200).json(answers);

  } catch (err) {
    console.error("❌ Error fetching text answers:", err.message); 
    res.status(500).json({
      error: "حدث خطأ في السيرفر",
      details: err.message
    });
  }
});


module.exports = router;