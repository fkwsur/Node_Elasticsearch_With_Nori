const db = require('./models');
const {
  sequelize,
  QueryTypes
} = require("./models");
const dotenv = require('dotenv');
const { Client } = require('@elastic/elasticsearch');
const axios  = require('axios');
const client = new Client({
  // cloud: { id: '<cloud-id>' },
  // auth: { apiKey: 'base64EncodedKey' }
  node : "http://localhost:9200"
})


db.sequelize
  .authenticate()
  .then(async () => {
    try {
      const { sequelize } = require("./models");
      await sequelize.sync(true);
      console.log("db connect ok");
    } catch (err) {
      console.log("seq:", err);
    }
  })
  .catch(err => {
    console.log('db' + err);
  });

  // 1. 엘라스틱 서치 인덱스가 있는지 확인
  // 2. 엘라스틱 서치 인덱스가 없으면 인덱스를 만들어주고 3번을 타는거고 있으면 원래코드가 돌아가게 짜야 함
  // 3. 원래 기존 인덱스 얘가가 아니라 새롭게 생긴 인덱스의 경우 : 모든값을 다 넣어버리기

// 엘라스틱 서치 배치 서버 코드
const Batch = async () => {
    try {
      const t = await sequelize.transaction();

      let query =  'select * from foods where sync = ?'
      const rows = await sequelize.query(query, {
        replacements: ["1"],
        type: QueryTypes.SELECT,
        transaction: t
      });
      let query2 =  'select * from foods where sync = ?'
      const rows2 = await sequelize.query(query2, {
        replacements: ["-1"],
        type: QueryTypes.SELECT,
        transaction: t
      });

      let update_data = [];
      let del_data = [];
      let dataset =[];
      for(element of rows){
          dataset.push({index: {_index: "reallasttest",_type: "_doc", _id: element.idx}},{name: element.name});
          update_data.push(element.idx);
      }
      for(element of rows2){
          dataset.push({delete:{_index:"reallasttest", _id: element.idx}});
          del_data.push(element.idx);
      }

      if(dataset.length == 0) return

      await client.bulk({
        body: dataset
      })

      await db.foods.update({
        sync : "0"
      },{
        where : { idx : update_data },
        transaction: t
      })
      await db.foods.destroy({ 
        where: { idx: del_data },
        transaction: t
      })
      await t.commit();
    } catch (error) {
      console.log(error);
      if (t) await t.rollback();
    }
  }

setInterval(() => {
    Batch();
}, 2000);
