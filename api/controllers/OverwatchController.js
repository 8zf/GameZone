/**
 * OverwatchController
 *
 * @description :: Server-side logic for managing overwatches
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var co = require('co');
var rp = require('request-promise');

module.exports = {
	getInfo: function (req, res) {
    
    co(function*() {
      var battle_id = req.query.battleid;
      var terminal = req.query.terminal;
      var field = req.query.field;
      battle_id = 'ISY-21796';
      terminal = 'pc';
      field = 'eu';
      var user_profile = yield rp({url: "https://api.lootbox.eu/pc/eu/" + battle_id + "/profile"});
      var user_achievement = yield rp({url: "https://api.lootbox.eu/pc/eu/" + battle_id + "/achievements"});
      var overall_hero_stat = yield rp({url: "https://api.lootbox.eu/pc/eu/" + battle_id + "/quick-play/heroes"});
      var career_stat = yield rp({url: "https://api.lootbox.eu/pc/eu/" + battle_id + "/competitive-play/allHeroes/"});
    });
    res.send("yo");
  }
};

