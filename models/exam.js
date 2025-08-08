const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Exam = sequelize.define('Exam', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Exam;
