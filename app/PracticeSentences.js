const fetch = require('node-fetch');
const Discord = require("discord.js");
const _ = require("underscore");
const cheerio = require('cheerio');

module.exports = class Game {
    constructor(client, db) {
        this.client = client;
        this.currentSentence = null;
    }

    parse(msg) {
        let params = msg.content.toLowerCase().split(" ");
        let cmd = params[0];

        switch (cmd) {
            case '!s':
                this.respondWithExampleSentence(msg, params[1]);
                return;
            case '!g':
                this.evaluateGuess(msg, params);
                return;
            case '!idk':
                this.respondWithCurrentSentenceTranslation(msg)
        }
    }

    getCurrentSentenceTranslation() {
        if (this.current_setence !== null) {
            let $ = cheerio.load(this.current_setence.translation.trim());
            return $.text();
        }

        return null;
    }

    respondWithCurrentSentenceTranslation(msg) {
        let translation = this.getCurrentSentenceTranslation();
        if (translation !== null) {
            msg.channel.send(translation);
            this.current_setence = null;
        }
    }

    respondWithExampleSentence(msg, hanzi) {
        this.getExampleSentences(hanzi)
            .then(json => {
                let mylist = json.exampleList;
                this.current_setence = mylist[_.random(0, mylist.length)];
                msg.channel.send(this.current_setence.example);
            });
    }

    evaluateGuess(msg, msgParts) {
        if (this.current_setence !== null) {
            let guess = msgParts.join(' ').replace('!g','').toLowerCase();
            let answer = this.getCurrentSentenceTranslation().toLowerCase().replace('.','');

            if (guess === answer) {
                msg.channel.send('100% correct! The answer is "' + this.getCurrentSentenceTranslation() + '"');
                this.current_setence = null;
            } else {
                let guessParts = guess.split(' ');
                let answerParts = answer.split(' ');
                let intersection = _.intersection(guessParts, answerParts);

                if (intersection.length === answerParts.length) {
                    msg.channel.send('Correct answer, wrong order though! The answer is "' + this.getCurrentSentenceTranslation() + '"');
                } else if (intersection.length >= Math.floor(answerParts.length / 2)) {
                    msg.channel.send('Close! The answer is "' + this.getCurrentSentenceTranslation() + '"');
                } else {
                    msg.channel.send('Sorry :( The answer is "' + this.getCurrentSentenceTranslation() + '"');
                }

                this.current_setence = null;
            }
        }
    }

    async getExampleSentences(hanzi) {
        let params = new URLSearchParams({
            query: hanzi,
            page: 1,
            page_size: 20,
            examType: "normal",
            fieldType: '',
            author: '',
            country: '',
            ql: "default",
            format: "json",
            platform: "isPC"
        });

        let url = `https://dict.naver.com/linedict/cnen/example/search.dict?${params.toString()}`;

        console.log(url);

        return await fetch(url)
            .then(response => response.json())
            .then(myJson => myJson)
    }
};