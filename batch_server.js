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

// 엘라스틱 서치 배치 서버 코드
const Batch = async () => {
    try {
      let query =  'select * from foods where sync in(?,?)'
      const rows = await sequelize.query(query, {
        replacements: ["1","-1"],
        type: QueryTypes.SELECT,
      });
      let update_data = [];
      let del_data = [];
      let dataset =[];
      for(element of rows){
        if(element.sync == '1'){
          dataset.push({index: {_index: "reallasttest",_type: "_doc", _id: element.idx}},{name: element.name});
          update_data.push(element.idx);
        }else if(element.sync == '-1'){
          dataset.push({delete:{_index:"reallasttest", _id: element.idx}});
          del_data.push(element.idx);
        }
      }

      if(dataset.length == 0) return

      await client.bulk({
        body: dataset
      })

      await db.foods.update({
        sync : "0"
      },{
        where : { idx : update_data }
      })
      await db.foods.destroy({ where: { idx: del_data }})


    } catch (error) {
      console.log(error);
    }
  }

setInterval(() => {
    Batch();
}, 2000);
