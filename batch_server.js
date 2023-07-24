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
      let query =  'select search_sync.f_idx,search_sync.status,foods.name from search_sync left outer join foods on search_sync.f_idx = foods.idx where search_sync.status in (?,?)'
      const rows = await sequelize.query(query, {
        replacements: ["1","-1"],
        type: QueryTypes.SELECT,
      });
      for(element of rows){
        if(element.status == '1'){
        await client.index({
          index: 'reallasttest',
          id : element.f_idx,
          body: {
            name: element.name
          }
        })
        const update  = await db.search_sync.update({
          status : '0',
          },{where : { f_idx : element.f_idx }
        })
        if(!update) throw "에러";
        }else if(element.status == '-1'){
  
          await axios.delete(`http://localhost:9200/reallasttest/_doc/${element.f_idx}`)
  
          const delete_rows = await db.search_sync.destroy({
            where : { f_idx : element.f_idx}
          })
          if(!delete_rows) throw "에러";
        }
      }
    } catch (error) {
      console.log(error);
    }
  }


setInterval(() => {
    Batch();
}, 2000);
