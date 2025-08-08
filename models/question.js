const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Exam = require('./exam');

const Question = sequelize.define('Question', {
  text: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('multiple_choice', 'text'),
    defaultValue: 'multiple_choice',
    allowNull: false
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Exam,
      key: 'id'
    }
  }
});

Exam.hasMany(Question, { foreignKey: 'examId' });
Question.belongsTo(Exam, { foreignKey: 'examId' });

module.exports = Question;
