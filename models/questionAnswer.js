const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const QuestionAnswer = sequelize.define('QuestionAnswer', {
  examAnswerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  selectedChoiceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
});

module.exports = QuestionAnswer;
