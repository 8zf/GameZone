/**
 * SteamController
 *
 * @description :: Server-side logic for managing steams
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var xml2js = require('xml2js-es6-promise');
var co = require('co');
var rp = require('request-promise');
const KEY = 'C2E792D0267F8DA56D531607EAE52999';


module.exports = {
  getInfo: function (req, res) {
    var steamid = req.query.steamid;
    console.log('steamid: ' + steamid);
    // console.log('key: ' + KEY);
    co(function*() {

      //get user summary
      var user_summary;
      var options = {
        url: ' http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=' + KEY + '&steamids=' + steamid + '&format=xml'
      };
      user_summary = yield rp(options);
      user_summary = yield xml2js(user_summary, {explicitArray: false});
      if (!user_summary.response.players.player)
        res.view('steam/notfound', {
          result: "No user with this steam id found"
        });
      user_summary = user_summary.response.players.player;
      // console.log(JSON.stringify(user_summary.avatarfull));


      //get owned games and process
      var owned_games;
      options = {
        url: 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=' + KEY + '&steamid=' + steamid + '&format=xml'
      };
      owned_games = yield rp(options);
      owned_games = yield xml2js(owned_games, {explicitArray: false});
      owned_games = owned_games.response.games.message;
      // console.log(owned_games);
      var game_name;

      // console.log("loop begin");
      for (var i = 0; i < owned_games.length; i++) {

        game_name = yield rp({url: 'http://store.steampowered.com/api/appdetails?appids=' + owned_games[i].appid});
        game_name = eval('(' + game_name + ')');
        owned_games[i].icon = "https://steamcdn-a.akamaihd.net/steam/apps/" + owned_games[i].appid + "/header.jpg";
        owned_games[i].official_url = "http://store.steampowered.com/app/" + owned_games[i].appid;
        owned_games[i].achievement_link = "/steam_achievement?steamid=" + steamid + "&appid=" + owned_games[i].appid;
        // console.log(owned_games[i].appid + ': ' + game_name[owned_games[i].appid].data.name)
        // console.log(owned_games[i].icon);
        owned_games[i].game_name = game_name[owned_games[i].appid].data.name;
      }
      // console.log("loop end");

      // console.log(user_summary);
      // console.log(owned_games);
      res.view('steam/steam', {
        user_summary: user_summary,
        owned_games: owned_games
      });
    });
  },

  getAchievement: function (req, res) {

    var steamid = req.query.steamid;
    var appid = req.query.appid;
    console.log('steamid: ' + steamid);
    console.log('appid: ' + appid);
    console.log('key: ' + KEY);

    var game_achievement;

    co(function*() {

      var app_detail = yield rp({url: "http://store.steampowered.com/api/appdetails?appids=" + appid});
      app_detail = eval('(' + app_detail + ')');
      app_detail = app_detail[appid];
      if(app_detail.success == 'false')
        res.view('steam/notfound', {
          result: "sorry, no game in this id found"
        });
      else
        app_detail = app_detail.data;
      app_detail.icon = "https://steamcdn-a.akamaihd.net/steam/apps/" + appid + "/header.jpg";
      
      try {
        console.log('http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?key=' + KEY + '&steamid=' + steamid + '&format=xml&appid=' + appid);
        game_achievement = yield rp({url: 'http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?key=' + KEY + '&steamid=' + steamid + '&format=xml&appid=' + appid});
      } catch (err) {
        game_achievement =
          `<?xml version="1.0" encoding="UTF-8"?>
          <!DOCTYPE playerstats>
          <playerstats>
          <error>Requested app has no stats</error>
          <success>false</success>
          </playerstats>`;
      }
      // console.log(game_achievement);

      game_achievement = yield xml2js(game_achievement, {explicitArray: false});
      // console.log(game_achievement);
      console.log(game_achievement.playerstats.success);

      var achievements = [];
      // game_achievement.playerstats.success == 'true'
      if (game_achievement.playerstats.success == 'true' && game_achievement.playerstats.achievements)
      {
        console.log('存在achievement');
        game_achievement = game_achievement.playerstats.achievements.achievement;
        console.log(game_achievement)
        
        console.log('loop begin');
        for (var i = 0; i < game_achievement.length; i++){
          if (game_achievement[i].achieved == '0')
          {
            console.log('continue');
            continue;
          }
          var ach_icon = yield rp({url: 'http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=' + KEY + '&format=json&appid=' + appid});
          ach_icon = eval('(' + ach_icon + ')');
          ach_icon = ach_icon.game.availableGameStats.achievements;
          console.log('typeof ach_icon: ' + (typeof ach_icon));
          console.log('ach name to match: ' + game_achievement[i].apiname);
          ach_icon = ach_icon.filter(function (value) {
            return value.name == game_achievement[i].apiname;
          });
          // console.log(ach_icon[0]);
          //find here (icon/description)
          ach_icon = ach_icon[0];
          achievements.push({
            description: ach_icon.description,
            icon: ach_icon.icon,
            displayName: ach_icon.displayName
          });
          // console.log(JSON.stringify(ach_icon));
        }
        console.log('loop end');
        // console.log(JSON.stringify(achievements));
        
      }

      


      res.view('steam/achievements', {
        app_detail: app_detail,
        achievements: achievements
      });
    });

  }

};

