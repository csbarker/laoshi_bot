const Discord = require("discord.js");
const client = new Discord.Client();
const config = require('./config');

var Game = require('./app/game');
var game = new Game(client);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.username}!`);
});

client.on('message', msg => {
	cmd = msg.content;

	/* Commands */
	if (cmd.substr(0,4) === '!hsk') {
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
	}
});

client.login(config.token);