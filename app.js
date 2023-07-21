const express = require("express");
const app = express();
const db = require('./models');
const {
  Op
} = require("./models");
const dotenv = require('dotenv');
const { Client } = require('@elastic/elasticsearch');
const { where } = require("sequelize");
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

// 엘라스틱 서치 배치 서버 만들었을때의 코드
const Batch = async () => {
  try {
    const rows = await db.search_sync.findAll({
      where : {
        status : {
          [Op.or]: [1, -1]
        }
      }
    })
    for(element of rows){
      if(element.status == '1'){
        console.log("삽입")
        // 엘라스틱 서치에 넣거나 수정하는 로직
      }else if(element.status == '-1'){
        console.log("삭제")
        // 엘라스틱 서치 삭제하는 로직
      }
    }
  } catch (error) {
    console.log(error);
  }
}

Batch();

// async function run () {

//   await client.index({
//     index: 'nori',
//     body: {
//       settings: {
//     index: {
//       analysis: {
//         tokenizer: {
//           nori_user_dict: {
//             type: "nori_tokenizer",
//             decompound_mode: "mixed",
//             discard_punctuation: "false",
//             user_dictionary: "userdict_ko.txt"
//           }
//         },
//         analyzer: {
//           my_analyzer: {
//             type: "custom",
//             tokenizer: "파스타"
//           }
//         }
//       }
//     }
//     },
//       character: 'pasta list',
//       quote: '맛있는 크림파스타를 함께 만들어보아요^^'
//     },
//   })

//   //sample
//   await client.index({
//     index: 'test',
//     body: {
//       character: 'Daenerys Targaryen',
//       quote: 'I am the blood of the dragon.'
//     }
//   })

//   // 노리 형태소 분석기 ahffk인덱스에 적용 후 nori에 있는 데이터 옮김
//   await client.indices.refresh({ index: 'ahffk' })

//   // Let's search!
//   const result= await client.search({
//     index: 'foods',
//     query: {
//       match: { quote: '파스타' }
//     }
//   })
//   console.log(result.hits.hits)
// }
// run().catch(console.log)

app.listen(8084, () => console.log('running'))