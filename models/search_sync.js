module.exports = (sequelize, DataTypes) => {
    const search_sync = sequelize.define(
      "search_sync",
      {
        idx: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        f_idx: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        // 0은 이미 있는거 / 1은 생성해야할데이터나 업데이트 할 데이터 / -1 삭제해야할 데이터
        status: {
          type: DataTypes.STRING,
          allowNull: false,
        }     
      },
      {
        freezeTableName: true,
        // timestamps: true,
        comment: '검색 싱크 테이블',
      }
    );
    return search_sync;
  };