const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TextExamAnswer = sequelize.define('TextExamAnswer', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fileUrl: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'examId']
    }
  ]
});

module.exports = TextExamAnswer;
