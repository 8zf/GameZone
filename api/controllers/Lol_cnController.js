/**
 * Lol_cnController
 *
 * @description :: Server-side logic for managing lol_cns
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var co = require('co');
var rp = require('request-promise');

const TOKEN = "A2447-12FA7-49373-342A7";

module.exports = {
  getInfo: function (req, res) {
    var name = req.query.summoner_name;
    var vaid = req.query.vaid;
    console.log('Request summoner name: ' + name + ' vaid: ' + vaid);



    co(function*() {
      //get user area info
      var options = {
        url: 'http://lolapi.games-cube.com/UserArea?keyword=' + encodeURI(name),
        headers: {
          'DAIWAN-API-TOKEN': TOKEN
        }
      };
      var summoner = {};
      var all_summoners = yield rp(options);
      all_summoners = eval('(' + all_summoners + ')');

      //find corresponding one
      
      var result;
      for (var index in all_summoners.data) {
        if (all_summoners.data[index].area_id == vaid.toString()) {
          summoner = all_summoners.data[index];
          console.log("find corresponding one! in: " + index);
          break;
        }
      }

      if (JSON.stringify(summoner).length < 3) {
        result = "Sorry we can't find this summoner";
        console.log("nobody found");
        res.view('lol_CN/not_found', {result: result});
      }
      console.log(summoner);


      //get user hot info
      options = {
        url: 'http://lolapi.games-cube.com/UserHotInfo?qquin=' + encodeURI(summoner.qquin) + '&vaid=' + vaid,
        headers: {
          'DAIWAN-API-TOKEN': TOKEN
        }
      };

      var summoner_hotinfo = yield rp(options);
      summoner_hotinfo = eval('(' + summoner_hotinfo + ')');
      var tiers = ['最强王者', '钻石', '铂金', '黄金', '白银', '青铜', '超凡大师'];
      var tier = summoner_hotinfo.data[0].tier;
      var queue = summoner_hotinfo.data[0].queue;

      if(tier == 255)
        summoner_hotinfo.data[0].rank = '无段位';
      else if (tier == 0)
        summoner_hotinfo.data[0].rank = '最强王者';
      else {
        var str = tiers[tier] + (queue+1).toString();
        summoner_hotinfo.data[0].rank = str;
      }
      summoner_hotinfo = summoner_hotinfo.data[0];
      // console.log(summoner_hotinfo);


      //get user detailed info
      options = {
        url: 'http://lolapi.games-cube.com/UserExtInfo?qquin=' + encodeURI(summoner.qquin) + '&vaid=' + vaid,
        headers: {
          'DAIWAN-API-TOKEN': TOKEN
        }
      };

      var summoner_extinfo = yield rp(options);
      summoner_extinfo = eval('(' + summoner_extinfo + ')');
      // console.log(summoner_extinfo);

      var pos = summoner_extinfo.data[0].items[0].recent_position;
      var data_pos = [
        { name: 'Jungle', value: pos.jungle_use_num },
        { name: 'ADC', value: pos.adc_use_num},
        { name: 'Top', value: pos.up_use_num},
        { name: 'Mid', value: pos.mid_use_num},
        { name: 'Sup', value: pos.aux_use_num}
      ];
      // console.log(data_pos);

      var kda = summoner_extinfo.data[0].items[0].recent_kda;
      var data_kda = [
        { name: 'Kill', value: kda.k_num },
        { name: 'Death', value: kda.d_num},
        { name: 'Assist', value: kda.a_num}
      ];
      // console.log(data_kda);

      var mastery = summoner_extinfo.data[3].champion_list.sort(function (a, b) {
        return b.used_exp_value - a.used_exp_value;
      });

      var mastery_champion_name_list = [];
      var mastery_champion = [];

      for ( var i = 0; i < 10; i++)
      {
        var temp = yield rp({
          url: 'http://lolapi.games-cube.com/GetChampionENName?id=' + mastery[i].champion_id,
          headers: {
            'DAIWAN-API-TOKEN': TOKEN
          }
        });
        temp = eval('(' + temp + ')');
        mastery_champion_name_list[i] = temp.data[0].return;
        mastery_champion[i] = mastery[i].used_exp_value;
      }

      // console.log(mastery_champion);
      // console.log(mastery_champion_name_list);



      //get summoner combat list
      options = {
        url: 'http://lolapi.games-cube.com/CombatList?qquin='
          + encodeURI(summoner.qquin)
          + '&vaid=' + vaid,
        headers: {
          'DAIWAN-API-TOKEN': TOKEN
        }
      };
      if(typeof req.query.p != 'undefined')
        options.url += '&p=' + req.query.p.toString();
      var combat_list = yield rp(options);
      combat_list = eval('(' + combat_list + ')');
      combat_list = combat_list.data[0].battle_list;
      for (var i = 0; i < combat_list.length; i++)
      {

        options = {
          url: 'http://lolapi.games-cube.com/GetWin?win=' + combat_list[i].win,
          headers: {
            'DAIWAN-API-TOKEN': TOKEN
          }
        };
        var win = yield rp(options);
        win = eval('(' + win + ')');
        if(win.data.length == 0)
          win = "Unknown";
        else
          win = win.data[0].return;
        combat_list[i].win = win;

        options = {
          url: 'http://lolapi.games-cube.com/GetGameType?game_type=' + combat_list[i].game_type,
          headers: {
            'DAIWAN-API-TOKEN': TOKEN
          }
        };
        var game_type = yield rp(options);
        game_type = eval('(' + game_type + ')');
        if(game_type.data.length == 0)
        {
          if(combat_list[i].game_type == 25)
            game_type = "末日人机";
          else
            game_type = "Unknown";
        }
        else
          game_type = game_type.data[0].name;
        combat_list[i].game_type = game_type;

        options = {
          url: 'http://lolapi.games-cube.com/GetJudgement?flag=' + combat_list[i].flag,
          headers: {
            'DAIWAN-API-TOKEN': TOKEN
          }
        };
        var flag = yield rp(options);
        flag = eval('(' + flag + ')');
        if(flag.data.length.length == 0)
          flag = "Unknown";
        else
          flag = flag.data[0].return;
        combat_list[i].flag = flag;

      }


      //return result to ejs
      res.view('lol_CN/lol_CN', {
        summoner_hotinfo: summoner_hotinfo,
        data_pos: data_pos,
        data_kda: data_kda,
        mastery_champion_name_list: mastery_champion_name_list,
        mastery_champion: mastery_champion,
        combat_list: combat_list
      });



    }).catch((err)=> {
      res.send(err);
    });

  }
};

