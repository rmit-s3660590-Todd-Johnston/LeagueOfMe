var express = require('express');
var path = require('path');
var exphbs = require('express-handlebars');
var async = require('async');
var request = require('request');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient
var app = express();

app.use(express.static('views/images'));
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.set('port', (process.env.PORT || 3000));


var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.post('/', urlencodedParser,function(req,res){
    var data = {};
    var api_key ='RGAPI-0048cdc5-a6eb-4598-8de0-de68c421055d';
    var s_toSearch = req.body.name
    var r_toSearch = req.body.region
    var sum_URL = 'https://'+r_toSearch+'.api.riotgames.com/lol/summoner/v4/summoners/by-name/'+s_toSearch+'?api_key=' +api_key;
    async.waterfall([
        function(callback){
        request(sum_URL, async function (err, response, body) {
            if(!err && response.statusCode == 200){
                var json = JSON.parse(body);
                data.id = json.id;
                data.name = json.name;
                sum2_URL = 'https://'+r_toSearch+'.api.riotgames.com/lol/league/v4/entries/by-summoner/'+data.id+'?api_key=' +api_key;
                cm_URL = 'https://'+r_toSearch+'.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/'+data.id+'?api_key=' +api_key;
                request(sum2_URL, async function (err, response, body) {
                    if(!err && response.statusCode == 200){
                        var json = JSON.parse(body);
                        if(json.length === 0 ){
                            data.tier = 'unranked, ';
                            data.rank = '';
                            try {
                                var favChamp = await findChampMastery(cm_URL)
                                data.champIcon = favChamp.icon
                                data.champName = favChamp.name

                            }catch(err){
                                console.log(err)
                            }
                        }else {
                            for (var x in json) {
                                if (json[x] !== 'undefined') {
                                    if (json[x].queueType === 'RANKED_SOLO_5x5') {
                                        data.tier = json[x].tier;
                                        data.rank = json[x].rank;
                                        try {
                                            var favChamp = await findChampMastery(cm_URL)
                                            data.champIcon = favChamp.icon
                                            data.champName = favChamp.name

                                        }catch(err){
                                            console.log(err)
                                        }
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

function findChampMastery(cm_URL) {
    return new Promise(function (resolve ,reject) {
        request(cm_URL,  function (err, response, body) {
            if(!err && response.statusCode == 200) {
                var json = JSON.parse(body);
                var champID = json[0].championId
                console.log(champID)
                MongoClient.connect("mongodb+srv://nick:lolman1@cluster0-kxw5r.gcp.mongodb.net/test?retryWrites=true&w=majority", function(err, db) {
                    if (err) throw err;
                    var dbo = db.db("LeagueofME");
                    dbo.collection("Champions").findOne({'key': champID.toString()}, function(err, result) {
                        if (err) throw err;
                        var result = result
                        db.close();
                        resolve(result);
                    });
                });



            }
        });
    })
}

