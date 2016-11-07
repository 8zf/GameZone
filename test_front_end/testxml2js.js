/**
 * Created by zhangfeng on 16-11-5.
 */
var xml2js = require('xml2js-es6-promise');
var co = require('co');
var rp = require('request-promise');
co(function*() {
  var a = yield rp({url: 'http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?key=C2E792D0267F8DA56D531607EAE52999&steamid=76561198155328047&format=xml&appid=316390'}).catch((err)=>{
    console.log('err');
  });
  console.log('success');
});

