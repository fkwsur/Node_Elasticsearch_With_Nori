const app = require("express")()
const db = require('./models');
const dotenv = require('dotenv');
const { Client } = require('@elastic/elasticsearch')
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


async function run () {
  await client.index({
    index: 'nori',
    body: {
      settings: {
    index: {
      analysis: {
        tokenizer: {
          nori_user_dict: {
            type: "nori_tokenizer",
            decompound_mode: "mixed",
            discard_punctuation: "false",
            user_dictionary: "userdict_ko.txt"
          }
        },
        analyzer: {
          my_analyzer: {
            type: "custom",
            tokenizer: "파스타"
          }
        }
      }
    }
    },
      character: 'pasta list',
      quote: '맛있는 크림파스타를 함께 만들어보아요^^'
    },
  })

  //sample
  await client.index({
    index: 'test',
    body: {
      character: 'Daenerys Targaryen',
      quote: 'I am the blood of the dragon.'
    }
  })

  // 노리 형태소 분석기 ahffk인덱스에 적용 후 nori에 있는 데이터 옮김
  await client.indices.refresh({ index: 'ahffk' })

  // Let's search!
  const result= await client.search({
    index: 'ahffk',
    query: {
      match: { quote: '크림' }
    }
  })
  console.log(result.hits.hits)
}
run().catch(console.log)

require('http')
  .createServer(app)
  .listen(8081, () => {
    console.log('server on');
  });