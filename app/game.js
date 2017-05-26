var Discord = require("discord.js");
var fs = require("fs");
var _ = require("underscore");

module.exports = class Game {
	constructor(client) {
		this.client = client;
		this.valid_options = ['1','2','3','4','5','6']
		this.games = {
			//"HSK_Bot_Test<#317297114155843584>": 'true'
		};

		// load hsk strings
		this.lang = {};

		for (var i = 0; i <= this.valid_options.length - 1; i++) {
			var key = this.valid_options[i];
			this.lang[key] = fs
				.readFileSync(`./lang/HSK_${key}.txt`)
				.toString('utf-8')
				.split('\n');
		}
	}

	in_progress(guild, channel) {
		return this.games.hasOwnProperty(guild + channel);
	}

	/*
	*	START THE GAME
	*/
	init(params, msg) {
		var hsk_level = params[1] || 1;
		var characters = parseInt(params[2]) || this.lang[hsk_level].length;

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

		// All good; lets get ready to rumble
		var game_key = msg.guild + msg.channel;
		this.games[game_key] = {
			round: 1,
			hsk_level: hsk_level,
			started: Date.now(),
			total_rounds: characters,
			characters_left: _.range(0, characters),
			rounds: [],
			results: {}
		}

		var embed = new Discord.RichEmbed()
		.setTitle(`HSK ${params[1]} Practice Initiated`)
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
		delete this.games[game_key];
		msg.channel.send(`${msg.author} has ended the game`);
	}

	start_round(i, msg) {		
		var game_key = msg.guild + msg.channel;
		var _game = this.games[game_key] || null;
		if (_game === null) return;

		var character_key = _.random(0, this.lang[_game.hsk_level].length);
		var character_line = this.lang[_game.hsk_level][character_key];
		var character = character_line.split('\t');

		msg.channel.send(`:star2: Round #${i}: Translate: ${character[0]} / ${character[1]}`);

		this.games[game_key].rounds.push({
			round: i,
			question: `${character[0]} / ${character[1]}`,
			answer: `${character[2]} / ${character[3]}`,
		});
		this.games[game_key].characters_left.splice(character_key, 1);

		var _this = this;
		setTimeout(function() {
			_this.finish_round(i ,msg);
		}, 5000);
	}

	finish_round(i, msg) {
		var game_key = msg.guild + msg.channel;
		var _game = this.games[game_key] || null;
		if (_game === null) return;

		// game over?
		if (i == _game.total_rounds) {
			this.end_game(msg);
			return;
		}

		// find all the answers
		// determine which are correct
		// determine which are wrong

		// next round
		this.games[game_key].round++;
		this.start_round(this.games[game_key].round, msg);
	}
}