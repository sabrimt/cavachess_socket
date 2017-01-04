// Tout d'abbord on initialise notre application avec le framework Express 
// et la bibliothèque http integrée à node.
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// On gère les requêtes HTTP des utilisateurs en leur renvoyant les fichiers du dossier 'public'
app.use("/", express.static(__dirname + '/web'));

http.listen(3000, function(){
  console.log('Server is listening on *:3000');
});

/* Initialisation */
var queue = [];    // list of sockets waiting for peers
var rooms = {};    // map socket.id => room
var names = {};    // map socket.id => name
var allUsers = {}; // map socket.id => socket


/* Gestion de la file d'attente */
var findPeerForLoneSocket = function(socket) {
    // this is place for possibly some extensive logic
    // which can involve preventing two people pairing multiple times

    if (queue.length > 0) {
        // S'il existe quelqu'un dans la file
        var peer = queue.pop();
        var room = socket.id + '#' + peer.id;

        // Les utilisateurs rejoignent le même salon
        peer.join(room);
        socket.join(room);

        // Enregistrement du nom de la room en cours d'utilisation
        rooms[peer.id] = room;
        rooms[socket.id] = room;

        // Echange des infos entre les deux utilisteurs
        peer.emit('gameStart', {'name': names[socket.id], 'room':room, 'color':'white'});
        socket.emit('gameStart', {'name': names[peer.id], 'room':room, 'color':'black'});
    } else {
        // Personne dans la file d'attente, on ajoute l'utilisateur
        queue.push(socket);
    }
};

/* Connexion du client au serveur */
io.on('connection', function (socket) {

    console.log('User '+socket.id + ' connected');

    /* Reception de l'event login. */
    socket.on('login', function (data) {
        names[socket.id] = data.username; // On stock le username de la personne qui vient de se connecter // names{socket.id : username}
        allUsers[socket.id] = socket; // allUsers{socket.id : username}. On stock tout l'objet socket par rapport à son id dans allUsers

        findPeerForLoneSocket(socket); // On vérifie s'il y a quelqu'un dans la file d'attente
    });

    /* Réception d'un event message et renvoi aux utilisateurs de la salle excepté l'envoyeur */
    socket.on('gameturninfo', function (data) {
        var room = rooms[socket.id];
        socket.broadcast.to(room).emit('gameturninfo', data);
    });

    /* */
    socket.on('leaveRoom', function () {
    	console.log('Un utilisateur a quitté (message serv)');
        // On quitte la room
        socket.leave(room);

        socket.broadcast.to(room).emit('gameEnd');
    });

    socket.on('disconnect', function () {
    	console.log('Navigateur fermé ou perte de connexion (message serv)');
    	console.log(io.engine.clientsCount);
        socket.broadcast.to(room).emit('gameEnd');

    });
});