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
var allUsers = {}; // map socket.id => socket
var waitingUsers = {};

/* Fonctions de filtre */
/* Joueur voulant jouer la même compétition */
function findCompet(competition) {
	return function filtreQueue(elem) {
		return elem.competition === competition;		
	};	
}

/* Socket qui vient de se déconnecter dans la file d'attente */
function findSocket(id) {
	return function filtreQueue(elem) {
		return elem.player.id === id;		
	};	
}

/* Joueurs ayant un rang similaire */
function findRank(rank) {
	return function filtreQueue(elem) {
		var diff = elem.rank - rank;
		if(diff < 201 && diff > -201 ) {
			return true;
		}
		else {
			return false;
		}		
	};	
}

/* Retirer un joueur ayant trouvé un adversaire de la file d'attente */
function removeSocket(competition, rank) {
	return function filtreQueue(elem) {
		if(elem.competition === competition && elem.rank === rank){
			return true;
		}		
	};	
}


/* Gestion de la file d'attente */
var queueSocket = function(socket, name, competition, rank) {

	

	var queueCompet = queue.filter(findCompet(competition));
	var queueRank = queueCompet.filter(findRank(rank));

    if (queueRank.length > 0) {
        // S'il existe quelqu'un dans la file
        var peer = queueRank.pop();
        var room = socket.id + '#' + peer.player.id;

        // Les utilisateurs rejoignent le même salon
        peer.player.join(room);
        socket.join(room);

        // Enregistrement du nom de la room en cours d'utilisation
        rooms[peer.player.id] = room;
        rooms[socket.id] = room;

        // Echange des infos entre les deux utilisteurs
        peer.player.emit('gameStart', {'name': name, 'room':room, 'color':'white', 'rank': rank});
        socket.emit('gameStart', {'name': peer.name, 'room':room, 'color':'black', 'rank' : peer.rank});

        var queuepop = queue.findIndex(removeSocket(competition, rank));
        queue.splice(queuepop, 1);
    }
    else
    {
    	// Ajout du joueur à la file d'attente globale
    	queue.push({'player': socket, 'name' : name, 'competition' : competition, 'rank' : rank});
    }
    console.log("file d'attente : "+queue.length);
    console.log("queueCompet "+queueCompet.length);
    console.log("queueRank "+queueRank.length);
    //console.log(queueCompet);
    //console.log(queueRank);
    //console.log(queue);
};



/* Connexion du client au serveur */
io.on('connection', function (socket) {

    console.log('User '+socket.id + ' connected');

    /* LOGIN */
    socket.on('login', function (data) {
        queueSocket(socket, data.username, data.competition, data.rank); 
    });

    /* TOUR DE JEU */
    socket.on('gameturninfo', function (data) {
    	//console.log(data);
        var room = rooms[socket.id];
        socket.broadcast.to(room).emit('gameturninfo', data);
    });

    /* FIN DE LA PARTIE */
    socket.on('gameOver', function (data) {
    	//console.log("Fin de la partie : " + data);
    	var room = rooms[socket.id];
        socket.broadcast.to(room).emit('gameOver', data);
    });

    /* DECONNEXION*/
    socket.on('disconnect', function () {
    	var room = rooms[socket.id];
    	var removeSocket = queue.findIndex(findSocket(socket.id));
    	if(removeSocket !== -1) {
    		queue.splice(removeSocket);
    		console.log("Index du joueur dans la file d'attente supprimé : "+removeSocket);
    	}   	
        socket.broadcast.to(room).emit('gameEnd');

    	
    	console.log(socket.id+" s'est déconnecté");  	
    	console.log(io.engine.clientsCount+ " utilisateurs connectés");
    });

    /* CHAT */
    socket.on('chatmessage', function(data){
    	var room = rooms[socket.id];
    	message = data.username+" : "+data.message;
    	io.in(room).emit('receptionmessage', message);
    });
});