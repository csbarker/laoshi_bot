// Required
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require('./config');

// Database 
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('laoshi.db');

// Game
var PracticeHSK = require('./app/PracticeHSK');
var hskGame = new PracticeHSK(client, db);
var PracticeSentences = require('./app/PracticeSentences');
var sentenceGame = new PracticeSentences(client, db);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.username}!`);
  client.user.setActivity('!hsk [1-6] or !s [hanzi]')
});

client.on('message', msg => {
	if (msg.author.bot) return;

	hskGame.parse(msg);
	sentenceGame.parse(msg);
});

client.login(config.token);