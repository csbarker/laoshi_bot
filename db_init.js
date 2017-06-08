var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('laoshi.db');
 
db.serialize(function() {
    //db.run("CREATE TABLE players (id TEXT, name TEXT, score INT)");
    //db.run("INSERT INTO players VALUES (?, ?, ?)", ['201650154867130368', 'CB', 100]);
    db.each("SELECT * FROM players", function(err, row) { console.log(row); });
    //db.run('DELETE FROM players')
});

db.close();