
const RustPlus = require('@liamcottle/rustplus.js');
const Lifx = require('node-lifx-lan');

//instantiating rustplus using environment variables which are set prior to running
const rustPlus = new RustPlus(process.env.SERVER_IP, process.env.SERVER_PORT, process.env.STEAM_ID, process.env.PLAYER_TOKEN);

//setting constants for the entity IDs 
const SMART_ALARM_ENTITY_ID = 21499543;
const DOWNSTAIRS_LIGHT_ID = 22628776;
const UPSTAIRS_LIGHT_ID = 22605021;
const DOORS = 22759038;

rustPlus.on('connected', () => {
	console.log("Rust+ API connected");
	console.log(process.env.SERVER_IP + " " + process.env.SERVER_PORT + " " + process.env.STEAM_ID + " " + process.env.PLAYER_TOKEN);
	rustPlus.sendTeamMessage(`[WillBot] Connected.`); //sends message to initialise

	rustPlus.getEntityInfo(SMART_ALARM_ENTITY_ID, (message) => { //getting state of smart alarm - changes won't register without this
		console.log("getEntityInfo response message: " + JSON.stringify(message));
		return true;
	})
	/*rustPlus.getEntityInfo(DOWNSTAIRS_LIGHT_ID, (message) => { 
		console.log("getEntityInfo response message: " + JSON.stringify(message));
		return true;
	})
	rustPlus.getEntityInfo(UPSTAIRS_LIGHT_ID, (message) => { 
		console.log("getEntityInfo response message: " + JSON.stringify(message));
		return true;
	})
	rustPlus.getEntityInfo(DOORS, (message) => { 
		console.log("getEntityInfo response message: " + JSON.stringify(message));
		return true;
	})*/

	rustPlus.on('message', (message) => { //message logging
		if (message.broadcast && message.broadcast.teamMessage && !message.broadcast.teamMessage.message.message.startsWith('[WillBot]')) {
			console.log("message received: " + JSON.stringify(message));
		}
		if (message.broadcast && message.broadcast.teamMessage && message.broadcast.teamMessage.message.message.startsWith('§Bot connected (Message needed to setup connection rust -​> discord)')) {
			console.log("message received: " + JSON.stringify(message)); //only for fun - interacts with Sekwah41's bot
			rustPlus.sendTeamMessage("Hello there Sekwah's bot! How are you today?");
		}
		if (message.broadcast && message.broadcast.entityChanged) {

			var entityChanged = message.broadcast.entityChanged;
			var entityId = entityChanged.entityId;
			var stateActive = entityChanged.payload.value;

			rustPlus.sendTeamMessage(getName(entityId) + " is now " + (stateActive ? "active" : "inactive") + ". (ID: " + entityId + ")");

			if (entityId != SMART_ALARM_ENTITY_ID) return;
			if (stateActive) {
				Lifx.discover({ wait: 3000 }).then((device_list) => {
					dev = device_list[0];
					// Set the color to blue
					return dev.lightSetColor({
						color: {
							hue: 0.66,
							saturation: 1.0,
							brightness: 1.0,
							kelvin: 3500
						},
						duration: 0.0
					});
				}).then(() => {
					// Set the waveform effect
					return dev.lightSetWaveform({
						transient: 1,
						color: { // Red
							hue: 1.0,
							saturation: 1.0,
							brightness: 1.0,
							kelvin: 3500
						},
						period: 1000,
						cycles: 10000,
						waveform: 4, // PULSE
						skew_ratio: 0.5
					});
				}).then(() => {
					console.log('Alarm lights activated!');
				}).catch((error) => {
					console.error(error);
				});

			} else {
				Lifx.discover({ wait: 3000 }).then((device_list) => {
					dev = device_list[0]; //nice
					// Set the color to white when alarm is deactivated    
					return dev.lightSetColor({
						color: {
							hue: 1.0,
							saturation: 0.01,
							brightness: 1.0,
							kelvin: 2700
						},
						duration: 0.0
					});
				}).then(() => {
					console.log('Alarm lights deactivated!');
				}).catch((error) => {
					console.error(error);
				});
			}
		}
	});

	setInterval(keepAlive, 10000); //runs every 10 seconds to make sure the connection doesn't drop


}); //onconnected

//earlier attempt to fix disconnection issue
rustPlus.on('disconnected', () => {
	console.log("Disconnected! Trying to reconnect...")
	rustPlus.connect();
})

function getName(id) {
	switch (id) {
		case 1005683: return ("Test Alarm");
		case SMART_ALARM_ENTITY_ID: return ("Base Alarm");
		/*	case DOWNSTAIRS_LIGHT_ID: return ("Downstairs Light");
			case UPSTAIRS_LIGHT_ID: return ("Upstairs Light");
			case DOORS: return ("Door System"); */
		default: return ("undefined");
	}
}

function keepAlive() { //keeping the connection alive
	rustPlus.getInfo(message => { 
		console.log(message);
	})
}