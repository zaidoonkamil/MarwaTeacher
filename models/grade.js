const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Grade = sequelize.define('Grade', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unitName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Unit One"
  },
  lectureName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "lecture One"
  },
  lectureNos: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  examGrades: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  originalGrades: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  resitGrades1: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  resitGrades2: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  }
}, {
  timestamps: true,
});

module.exports = Grade;
