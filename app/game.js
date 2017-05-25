module.exports = class Game {
   constructor(client, params, msg) {
       this.client = client;
       this.params = params;
	   this.msg = msg;
   }

   setup() {
       this.msg.reply('Now playing HSK'+params[1]);
   }
}