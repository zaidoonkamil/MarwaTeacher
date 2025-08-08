const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserCourses = sequelize.define('UserCourses', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  }
}, {
  timestamps: false,
  tableName: 'UserCourses'
});

module.exports = UserCourses;
