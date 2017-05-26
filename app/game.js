var fs = require("fs");

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
		var characters = params[2] || this.lang[hsk_level].length;

		// Validation
		if (this.valid_options.indexOf(params[1]) === -1) {
			msg.reply('please select a number from 1 to 6');
			return;
		}

		var hsk_length = this.lang[hsk_level].length;
		if (!Number.isInteger(characters) 
			|| characters < hsk_length 
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
			rounds: {},
			results: {}
		}

		msg
			.reply(`Now practicing HSK ${params[1]} (${characters} characters)`)
			.then(msg => this.start_round(msg, params));
	}

	/*
	* END GAME
	*/
	end_game(msg) {
		var game_key = msg.guild + msg.channel;
		delete this.games[game_key];
		msg.reply('has ended the game');
	}

	start_round(msg, params) {
		var random_entry = this.lang[params[1]][30];
		var random_data = random_entry.split('\t');
		msg.reply(`Translate: ${random_data[0]} / ${random_data[0]}`);
	}
}