const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Course = require('./course');

const Lesson = sequelize.define('Lesson', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  images: {
    type: DataTypes.JSON,
    allowNull: false
  },
  videoUrl: {
    type: DataTypes.TEXT
  },
  pdfUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  description: {
    type: DataTypes.TEXT
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false 
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Course,
      key: 'id'
    }
  }
}, {
  timestamps: true
});


module.exports = Lesson;
