const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Course = sequelize.define('Course', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {
  timestamps: true
});

module.exports = Course;
