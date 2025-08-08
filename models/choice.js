const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Question = require('./question');

const Choice = sequelize.define('Choice', {
  text: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Question,
      key: 'id'
    }
  }
});

module.exports = Choice;
