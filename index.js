// Required
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require('./config');

// Database 
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('laoshi.db');

// Game
var Game = require('./app/game');
var game = new Game(client, db);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.username}!`);
  client.user.setGame('!hsk [1-6]')
});

client.on('message', msg => {
	if (msg.author == client.user) return; 

	cmd = msg.content;

	/* Commands */
	if (cmd.substr(0,4) === '!hsk') {
		if (cmd === '!hsk count' || cmd === '!hsk info') {
			msg.channel.send('HSK test consists of 2500 words / 2663 symbols. See https://en.wikipedia.org/wiki/Hanyu_Shuiping_Kaoshi for more information');
			return;
		}
		if (cmd.startsWith('!hsk suggest')) {
			params = msg.content.toLowerCase().split(" ");
			game.suggest(msg, params);
			return;
		}
		if (cmd === '!hsk top') {
			game.output_highscores(msg);
			return;
		}

		if (game.in_progress(msg.guild, msg.channel)) {
			if (cmd === '!hsk stop') {
				game.end_game(msg);
				return;
			}

			msg.reply('a game is already in progress! use !hsk stop');
			return;
		}
	
		params = msg.content.toLowerCase().split(" ");
		game.init(params, msg);
	} else {
		if (cmd.substr(0,1) === '.' && game.in_progress(msg.guild, msg.channel)) {
			game.record_response(msg);
		}
	}
});

client.login(config.token);