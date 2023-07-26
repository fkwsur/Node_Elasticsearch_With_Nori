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
      let data1 = [];
      let data2 = [];
      let dataset =[];
      for(element of rows){
        if(element.sync == '1'){
          // await client.index({
          //   index: 'reallasttest',
          //   id : element.idx,
          //   body: {
          //    name: element.name
          //   }
          // })
          let setIndex =  {
            index: 'reallasttest',
            id : element.idx,
            body: {
             name: element.name
            }
          }
          dataset.push(setIndex);
          data1.push(element.idx);
        }else if(element.sync == '-1'){
          // await axios.delete(`http://localhost:9200/reallasttest/_doc/${element.idx}`)
          data2.push(element.idx);
        }
      }
      await client.bulk({ dataset })
      await db.foods.update({
        sync : "0"
      },{
        where : { idx : data1 }
      })
      await db.foods.destroy({ where: { idx: data2 }})


    } catch (error) {
      console.log(error);
    }
  }

setInterval(() => {
    Batch();
}, 2000);
