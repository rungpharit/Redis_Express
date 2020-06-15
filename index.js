const express = require('express');
const axios = require('axios')
const app = express();
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379 ;

const client = redis.createClient(REDIS_PORT);

function setResponse(username,repos){
  return `${username} has public_repos ${repos} repos`
}

async function getRepos(req,res){
  try {
    const { username } = req.params;
    const response = await axios.get(`https://api.github.com/users/${username}`);
    const data = await response.data;
    const repos = data.public_repos;
    
    //Set data to Redis
    client.setex(username,3600,repos);

    res.send(setResponse(username,repos));
  }catch(err){
    res.status(500);
  }
}
// Cache middleware
function cache(req,res,next){
  const { username } = req.params;
  client.get(username,(err,data) => {
    if(err) throw err;

    if(data !== null){
      res.send(setResponse(username,data));
    }else{
      next();
    }
  })
}

app.get('/repos/:username',cache, getRepos);

app.listen(PORT,() => {
  console.log(`App run on port ${PORT} `)
});
