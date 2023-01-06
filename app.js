const app = require("express")()
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  // cloud: { id: '<cloud-id>' },
  // auth: { apiKey: 'base64EncodedKey' }
  node : "http://localhost:9200"
})

async function run () {
  // Let's start by indexing some data
  await client.index({
    index: 'pasta',
    body: {
      character: 'pasta list',
      quote: '맛있는 크림파스타를 함께 만들어보아요^^'
    }
  })

  // await client.index({
  //   index: 'game-of-thrones',
  //   body: {
  //     character: 'Daenerys Targaryen',
  //     quote: 'I am the blood of the dragon.'
  //   }
  // })

  // await client.index({
  //   index: 'game-of-thrones',
  //   body: {
  //     character: 'Tyrion Lannister',
  //     quote: 'A mind needs books like a sword needs a whetstone.'
  //   }
  // })

  // here we are forcing an index refresh, otherwise we will not
  // get any result in the consequent search
  await client.indices.refresh({ index: 'pasta' })

  // Let's search!
  const result= await client.search({
    index: 'pasta',
    query: {
      match: { quote: '파스타' }
    }
  })

  console.log(result.hits.hits)
}

run().catch(console.log)

app.listen(8084, () => {
    console.log("hi")
})