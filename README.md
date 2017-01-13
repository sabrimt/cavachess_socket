#Cavachess WebSocket socket.io server  

This is the WebSocket component for the Cavachess project.  
Cavachess is a community website around Chess.   

## Initialization (localhost)
* Git clone this repository
* Install dependencies => npm install
* Launch your websocket server => node server.js 
  
## Get Cavachess   
See : https://github.com/tgachet/cavachess  

## Features
* 1 vs 1 Chess games
* Ingame chat
* Matchmaking :
    ** Players must choose the same game mode   
    ** Players must have a close rank (+/- 200 pts)  

### Known issues
* Leaving or reloading the page close your websocket connection (instant loss)  
* Currently no id user restriction (you can play against yourself)  
* Queue sometimes failing to match players  
  
### Dependencies  
* socket.io  
* express.js  

## Author 
Thomas Gachet  