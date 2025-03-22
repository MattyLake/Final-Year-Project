const express = require('express');
const path = require('path');
const app = express();

const viewPath = __dirname + '/public/views/';
const dataPath = __dirname + '/data/';

const port = 8080;

app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req,res,next) {
    console.log('/' + req.method + ' ' + req.path);
    next();
});

app.get('/', function(req,res){
    res.sendFile(viewPath + 'index.html');
});

app.get('/data/mapPolygonData', function(req,res){
  res.sendFile(dataPath + 'mapPolygonData.json');
});

app.get('/data/pandemicData', function(req,res){
    res.sendFile(dataPath + 'pandemicData.json');
});

app.listen(port, function () {
    console.log('Example app listening on port 8080!')
})