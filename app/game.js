var Discord = require("discord.js");
var fs = require("fs");
var _ = require("underscore");

module.exports = class Game {
	constructor(client, db) {
		this.client = client;
		this.valid_options = ['1','2','3','4','5','6']
		this.players = {};
		this.lang = {};
		this.games = {};
		this.db = db;

		// load lang
		for (var i = 0; i <= this.valid_options.length - 1; i++) {
			var key = this.valid_options[i];
			this.lang[key] = fs
				.readFileSync(`./lang/HSK_${key}.txt`)
				.toString('utf-8')
				.split('\n');
		}

		// load players
		var _self = this;
		db.each("SELECT * FROM players", function(err, row) { 
			_self.players[row.id] = {
				name: row.name,
				score: row.score
			};
		 });
	}

	in_progress(guild, channel) {
		return this.games.hasOwnProperty(guild + channel);
	}

	/*
	*	START THE GAME
	*/
	init(params, msg) {
		var hsk_level = params[1] || 1;
		var characters = parseInt(params[2]) || 1; //this.lang[hsk_level].length;

		// Validation
		if (this.valid_options.indexOf(params[1]) === -1) {
			msg.reply('please select a number from 1 to 6');
			return;
		}

		var hsk_length = this.lang[hsk_level].length;
		if (!Number.isInteger(characters) 
			|| characters > hsk_length 
			|| characters <= 0) {
				msg.reply(`the amount must be between 1 and ${hsk_length}`)
				return;
		}

		// ADD NEW GAME
		var game_key = msg.guild + msg.channel;
		this.games[game_key] = {
			round: 1,
			hsk_level: hsk_level,
			started: Date.now(),
			total_rounds: characters,
			characters_left: _.range(0, characters),
			rounds: {},
			results: {}
		}

		var embed = new Discord.RichEmbed()
			.setTitle(`HSK ${params[1]} Practice Initiated (${characters} characters)`)
			.setColor(0x00AE86)
			.setDescription(`Game initiated by ${msg.author}, use !hsk stop to cancel`)

		msg.channel.send({embed})
			.then(msg => this.start_round(1, msg));
	}

	/*
	* END GAME
	*/
	end_game(msg) {
		var game_key = msg.guild + msg.channel;

		this.output_game_results(msg);

		delete this.games[game_key];
		msg.channel.send(`${msg.author} has ended the game`);
	}

	start_round(i, msg) {		
		var game_key = msg.guild + msg.channel;
		var _game = this.games[game_key] || null;
		if (_game === null) return;

		var rounds = this.games[game_key].total_rounds;

		var character_key = _.random(0, this.lang[_game.hsk_level].length);
		var character_line = this.lang[_game.hsk_level][character_key];
		var character = character_line.split('\t');
		var character_english = character[4].trim().split('; ');

		var start_embed = new Discord.RichEmbed()
			.setTitle(`Round #${i} / ${rounds}`)
			.setDescription('To play, type  "." followed by the translation for the following character in pinyin or english.')
			.setColor('GREEN')
			.addField('Characters (Simplified/Traditional):', `${character[0]} / ${character[1]}`);

		msg.channel.send({embed: start_embed});

		// ADD NEW ROUND
		this.games[game_key].rounds[i] = {
			round: i,
			question: [character[0], character[1]],
			answers: [].concat(character[2], character[3], character_english),
			players_answers: {}
		};
		this.games[game_key].characters_left.splice(character_key, 1);

		console.log(this.games[game_key].rounds[i].answers);

		var _this = this;
		setTimeout(function() {
			_this.finish_round(i ,msg);
		}, 15000);
	}

	finish_round(i, msg) {
		var game_key = msg.guild + msg.channel;
		var _game = this.games[game_key] || null;
		if (_game === null) return;

		this.determine_round_results(i, msg);

		// game over?
		if (i == _game.total_rounds) {
			this.end_game(msg);
			return;
		}

		// next round
		this.games[game_key].round++;
		this.start_round(this.games[game_key].round, msg);
	}

	record_response(msg) {
		var game_key = msg.guild + msg.channel;
		var _game = this.games[game_key] || null;
		if (_game === null) return;

		var current_round = this.games[game_key].round;
		if(_game.rounds[current_round].players_answers.hasOwnProperty(msg.author.id)) return;

		_game.rounds[current_round].players_answers[msg.author.id] = {
			id: msg.author.id,
			name: msg.author.username,
			answer: msg.content.toLowerCase().substring(1),
			submitted: _.now(),
			correct: (_game.rounds[current_round].answers.indexOf(msg.content.toLowerCase().substring(1)) !== -1)
		};
	}

	determine_round_results(i, msg) {
		var game_key = msg.guild + msg.channel;
		var _game = this.games[game_key] || null;
		var _round = _game.rounds[i] || null;
		if (_game === null) return;

		var compiled = _.template("<%= icon %> <%= name %>: <%= points %>\n");
		var player_results = '';
		var next_round = i + 1;
		var next_round_string = (i == _game.total_rounds) ? 'This was the last round.' : `Round #${next_round} will begin shortly; use !hsk stop to quit`;
		var char_for_url = encodeURI(_round.question[0]);

		if (Object.keys(_round.players_answers).length <= 0) {
			player_results += ':zzz: no players this round';
		} else {
			_.each(_round.players_answers, function(data) {
				data.icon = (data.correct) ? ':white_check_mark:' : ':white_large_square:';
				data.points = (data.correct) ? '+10 points' : '';
				player_results += compiled(data);
			});
		}

		var results_embed = new Discord.RichEmbed()
			.setTitle(`Round #${i} - Complete`)
			.setColor('GOLD')
			.setFooter(next_round_string, 'http://i.imgur.com/w1vhFSR.png')
			.addField('Characters (Simplified/Traditional): ', _round.question.join('/'), true)
			.addField('Translations (Pinyin/English): ', _round.answers.join(', '), true)
			.addField(
				'Tools: ', 
				`[Example Sentences](http://ce.linedict.com/dict.html#/cnen/example?query=${char_for_url})`
				)
			.addField('Results: ', player_results);

		msg.channel.send({embed: results_embed});
	}

	output_game_results(msg) {
		var game_key = msg.guild + msg.channel;
		var _game = this.games[game_key] || null;
		if (_game === null) return;

		// go through each round
		var _self = this;
		_.each(_game.rounds, function(round) {
			if(Object.keys(round.players_answers).length <= 0) return;

			_.each(round.players_answers, function(pa) {
				// new player (global)
				if(!_self.players.hasOwnProperty(pa.id)) {
					_self.db.serialize(function() {
						_self.db.run("INSERT INTO players VALUES (?, ?, ?)", [pa.id, pa.name, 0]);
					});
					_self.players[pa.id] = {
						id: pa.id,
						name: pa.name,
						score: 0
					}
				}
				// new player (local game)
				if(!_game.results.hasOwnProperty(pa.id)) {
					_game.results[pa.id] = {
						id: pa.id,
						name: pa.name,
						score: 0
					}
				}

				if (!pa.correct) return;

				_game.results[pa.id].score += 10; // local
				_self.players[pa.id].score += 10; // global
			});
		});

		// sync players scores
		_.each(_game.results, function(player) {
			_self.db.serialize(function() {
				let real_player = _self.players[player.id];
				_self.db.run('UPDATE players SET score = ? WHERE id = ?', [real_player.score, player.id]);
			});
		});

		// now that we have updated the players scores we can output them
		var row_template = _.template(":trophy: <%= name %>: +<%= score %> (<%= global_score %>)\n");
		var player_results = '';
		
		if (Object.keys(_game.results).length <= 0) {
			player_results += ':zzz: no points awarded this game :sweat_smile:';
		} else {
			_.each(_game.results, function(data) {
				data.global_score = _self.players[data.id].score;
				player_results += row_template(data);
			});
		}

		var results_embed = new Discord.RichEmbed()
			.setTitle(`HSK Practice Complete`)
			.setColor('RED')
			.setFooter('Use !hsk [level] [characters] to start a new game', 'http://i.imgur.com/w1vhFSR.png')
			.addField('Results: ', player_results);

		msg.channel.send({embed: results_embed});
	}

	output_highscores(msg) {
		var scores_sorted = '';
		var row_template = _.template(":trophy: <%= name %>: <%= score %>\n");

		if (Object.keys(this.players).length <= 0) {
			scores_sorted += ':zzz: no participants yet';
		} else {
			var highscores = _.sortBy(this.players, 'score');
			_.each(highscores, function(data) {
				scores_sorted += row_template(data);
			});
		}

		var results_embed = new Discord.RichEmbed()
			.setTitle(`HSK Highscores`)
			.setColor('BLUE')
			.addField('Results: ', scores_sorted);

		msg.channel.send({embed: results_embed});
	}

	// !hsk suggest [character] [suggestion]
	suggest(msg, params) {
		if (params.length < 4) {
			msg.reply('Whoops, I didn\'t understand that. Please use !hsk suggest [character] [translation]');
			return;
		}

		let character = params[2] || null;
		let translation = params[3] || null;

		var me = this.client.users.get("201650154867130368");
		me.send(`New suggestion from ${msg.author}: ${character} -> ${translation}`);
		msg.reply('Thanks! Your suggestion has been noted :)')
	}
}