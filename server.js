var express = require('express');
var path = require('path');
var exphbs = require('express-handlebars');
var async = require('async');
var request = require('request');
var bodyParser = require('body-parser')

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.set('port', (process.env.PORT || 3000));
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.post('/', urlencodedParser,function(req,res){
    var data = {};
    var api_key ='RGAPI-1cf35d25-40bc-4a58-875b-90d3a586dc72';
    var s_toSearch = req.body.name
    var URL = 'https://oc1.api.riotgames.com/lol/summoner/v4/summoners/by-name/'+s_toSearch+'?api_key=' +api_key;
    //https://oc1.api.riotgames.com/lol/league/v4/entries/by-summoner/e5lrPFt6jsk12aEZqkvL4QimZA84t0IaD2z0YZXTxC6S?api_key=RGAPI-3f7edfc8-7ac7-42d2-a35e-8f417560d489
    async.waterfall([
        function(callback){
        request(URL, function (err, response, body) {
            if(!err && response.statusCode == 200){
                var json = JSON.parse(body);
                data.id = json.id;
                data.name = json.name;
                console.log(data.name);
                URL = 'https://oc1.api.riotgames.com/lol/league/v4/entries/by-summoner/'+data.id+'?api_key=' +api_key;
                request('https://oc1.api.riotgames.com/lol/league/v4/entries/by-summoner/'+data.id+'?api_key=' +api_key, function (err, response, body) {
                    if(!err && response.statusCode == 200){
                        var json = JSON.parse(body);
                        if(json.length === 0 ){
                            data.tier = 'unranked, ';
                            data.rank = 'cannot find stats';
                        }else {
                            for (var x in json) {
                                if (json[x] !== 'undefined') {
                                    if (json[x].queueType === 'RANKED_SOLO_5x5') {
                                        data.tier = json[x].tier;
                                        data.rank = json[x].rank;
                                    }
                                }
                            }
                        }
                        console.log(data)
                        callback(null,data);
                    }else{
                        console.log(err)
                    }

                });
            }else{
                console.log(err)
            }

        });
        }
    ],
        function(err, data){
            if(err){
                console.log(err);
                return;
            }
            res.render('home',{
                info: data
            })
        });
});
app.get('/',function(req,res){
    res.render('home')
});
app.listen(app.get('port'),function(){
    console.log('server started on port '+ app.get("port"))
});