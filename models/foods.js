module.exports = (sequelize, DataTypes) => {
    const foods = sequelize.define(
      "foods",
      {
        idx: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          autoIncrement: true
        },
        name: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: false,
        }
      },
      {
        freezeTableName: true,
        timestamps: true,
        comment: '음식 정보',
      }
    );
    return foods;
  };