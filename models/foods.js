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
        },
        // 0은 이미 있는거 / 1은 생성해야할데이터나 업데이트 할 데이터 / -1 삭제해야할 데이터
        sync: {
          type: DataTypes.STRING(10),
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