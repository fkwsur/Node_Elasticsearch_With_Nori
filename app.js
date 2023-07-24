const express = require("express");
const app = express();
const db = require('./models');
const {
  Op,
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


app.use(express.urlencoded({ extended: true }));
app.use(express.json());


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

// crud 일어날때 싱크 디비 같이 핸들링
app.post('/add', async (req,res) => {
  try {
    let {name} = req.body;
      const rows  = await db.foods.create({
        name : name
      })
      if(!rows) throw "에러";
      const rows2  = await db.search_sync.create({
        f_idx : rows.idx,
        status : 1
      })
      if(!rows2) throw "에러";
      return res.status(200).json({"result" : "success"})
  } catch (error) {
    console.log(error)
    res.status(200).json({"error" : "에러"})
  }
})
app.post('/update', async (req,res) => {
  try {
    let {idx,name} = req.body;
      const rows  = await db.foods.update({
        name : name
        },{where : { idx : idx}
      })
      if(!rows) throw "에러";
      const rows2  = await db.search_sync.update({
        status : 1,
      },{where : { f_idx : idx }
      })
      if(!rows2) throw "에러";
      return res.status(200).json({"result" : "success"})
  } catch (error) {
    console.log(error)
    res.status(200).json({"error" : "에러"})
  }
})
app.post('/delete', async (req,res) => {
  try {
    let {idx} = req.body;
      const rows  = await db.foods.destroy({
        where : { idx : idx}
      })
      if(!rows) throw "에러";
      const rows2  = await db.search_sync.update({
        status : '-1',
      },{where : { f_idx : idx }
      })
      if(!rows2) throw "에러";
      return res.status(200).json({"result" : "success"})
  } catch (error) {
    console.log(error)
    res.status(200).json({"error" : "에러"})
  }
})
app.get('/search', async (req,res) => {
  try {
      let {keyword} = req.query;
      await client.indices.refresh({ index: 'reallasttest' })
      const result = await client.search({
        index: 'reallasttest',
        query: {
          match: { name: keyword }
        }
      })
    return res.status(200).json(result.hits.hits)
  } catch (error) {
    console.log(error);
    res.status(200).json({"error" : "에러"})
  }
})

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


// 노리 인덱스 만들기 (초기에만 하면 됨)
const CreateNoriIndex = async() => {
  try {
    await axios.put('http://localhost:9200/nori_foods', {
      settings : {
          analysis : {
              analyzer : {
                  default : {
                      type : "nori"
                  }
              }
          }
      },
      mappings : {
          properties : {
              character : {
                  type : "keyword"
              },
              quote : {
                  type : "text",
                  analyzer  : "nori"
              }
          }
      }
  })
  } catch (error) {
    console.log(error);
  }
}

Batch();
app.listen(8084, () => console.log('running'))
