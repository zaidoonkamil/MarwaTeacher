const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ExamAnswer = sequelize.define('ExamAnswer', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = ExamAnswer;
