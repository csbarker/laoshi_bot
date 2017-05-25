const Discord = require("discord.js");
const client = new Discord.Client();
const config = require('./config');

var Game = require('./app/game');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.username}!`);
});

client.on('message', msg => {
	game_in_progress = false;

	/* Commands */
	if (msg.content.substr(0,4) === '!hsk') {
		if (game_in_progress) {
			msg.reply('A game is already in progress!');
			return;
		}
	
		params = msg.content.toLowerCase().split(" ");
		game = new Game(client, params, msg);
		game.setup();
	}
});

client.login(config.token);