//using express (node js web application framework)
const express = require("express");
const fs = require("fs");
const https = require("https");
const app = express();
const server = https.createServer({
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
},
    app
);
app.use(express.json());
app.use(express.static('public'))

//open websocket server
const wsServer = require('ws').Server;
const py = new wsServer({ server: server});



//set router
const appRoutes = require("./route");

//establish database connection
const dbconnection = require("./helper/dbconn");
dbconnection();

//websocket communication
const Coyotes = require("./models/coyotes"); //get access to the coyote coordinates database
py.on('connection', (client) => { //server connected -> execute function
    console.log('Client connected');
    client.on('message', function mss(message){ //message received from client -> execute function mss
        console.log('client: %s', message);
        var stredmsg = message.toString();
        if(stredmsg.includes(',')) { //message format: use ',' as delimiter
            var xCoord = stredmsg.split(',')[0];
            var yCoord = stredmsg.split(',')[1];
            //var time = stredmsg.split(',')[2]; temporary
            var newCoyote = new Coyotes({
                x: xCoord,
                y: yCoord,
                time: Date.now() //time (temporary)
            });
            newCoyote.save(); //save to the database
        }

        py.clients.forEach(client => { //send every client same message
            console.log(stredmsg);
            client.send(stredmsg);
        })
    });
    client.send("hello"); //send client hello after connection success
});

//api router setting
app.use("/api", appRoutes);

//open http port 8081
server.listen(process.env.PORT, ()=> {
    console.log("listening on port 8081");
})