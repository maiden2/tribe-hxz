const haxball = require('haxball.js');
const FormData = require('form-data');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const axios = require('axios');
const bcrypt = require("bcrypt");
require('dotenv').config(); // INIT .ENV
const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(process.env.MONGODB_URI); // INIT MONGODB

let db, playersDB, adminsDB, nickRequestsDB, bansDB, statsDB, playerInventoryDB; // Var for DB

/* INIT ROOM */
haxball.then(async (HBInit) => {

	/* DEBUG */
	const debugFilter = true;
	const debugDiscord = true;
	let debugMode = true;
	function writeLog(file, mess, flagCL) {
		/*if (file != "") {
			fs.promises.appendFile(file + ".txt", "\n" + getDate() + " - " + mess) // Con questa funzione inseriamo in coda al file
				.then(() => { });
		}
		if (flagCL) {*/
			console.log(formatCurrentDate() + " - " + mess);
		//}
	}
	let stringaWriteLog = debugMode ? "TEST" : "ROOM";
	writeLog("", "~~~~~~~~~~~~~~~~~~~~~~~~ INIZIO AVVIO "+stringaWriteLog+" ~~~~~~~~~~~~~~~~~~~~~~~~", true);
	/* -------------- */

	/* TOKEN & API */
	const token = process.env.HAXBALL_TOKEN; // https://www.haxball.com/headlesstoken
	let matchWebhook = debugDiscord ? '' : 'https://discord.com/api/webhooks/1194553131590238208/NBat80BTxZAZqRtK7xq4CzHMl-Q7hmL48ETd1P4kFhYRWEN3FQl4Vod0GCWGAO4rDh4c'; // this webhook is used to send the summary of the match | it should be in a public discord channel
	let roomWebhook = debugDiscord ? '' : 'https://discord.com/api/webhooks/1194792923510865991/CJ5Er0QxNXkjhI1IRvBeR_VGgLKIpKNUWaUFEPoCjo3dGQZ6fU9V7ECzfdKwh2kfW1Em'; // this webhook is used to send the details of the room (chat, join, leave) | it should be in a private discord channel
	let modWebhook = debugDiscord ? '' : 'https://discord.com/api/webhooks/1194808745608351774/O673aExurDGo0p2RmzdaD8-zsRaFjU1pWcs7SCA32A42SIDzPzPi7_z-fIfCNqr15r_T'; // this webhook is used to send the details of the commands (ban, warn, kick, password) | it should be in a FOUNDER private discord channel
	let errWebhook = debugDiscord ? '' : 'https://discord.com/api/webhooks/1266077151904534689/3jzF9eQtZhYQjhSeKlI7FYVMUdtpH7e0-UQEwtnY6Cn2iWEHCmoL1J6LM9NvxlccWCtw'; // this webhook is 
	/* ------------------------------------- */

	/* RUN MONGODB */
	async function run() {
		await client.connect()
		writeLog("", "Connessione al Database riuscita.", true);
		db = debugMode ? client.db("HaxZoneTEST") : client.db("HaxZoneDB");
		//dbD = client.db("DiscordDB")
		playersDB = db.collection("PlayersAccount");
		adminsDB = db.collection("PlayersAdmin");
		playersRolesDB = db.collection("PlayersRoles")
		bansDB = db.collection("PlayersBan");
		//tempBanDB = db.collection("PlayersTempban");
		statsDB = db.collection("PlayersStats");
		monthlystatsDB = db.collection("PlayerStatsMonthly");
		playerInventoryDB = db.collection("PlayersInventory");
		nickRequestsDB = db.collection("ChangeNickRequests"); // ESISTE SOLO NEL DB di TEST -> Se non attivi la modalità DEBUG ti darà errore
		nicknameChangeRequestsDB = db.collection("ListChangeNickRequest")
		//verifyDB = db.collection("DiscordVerify");
		topStreakDB = db.collection("TopStreak");
		//nicknameBLDB = db.collection("NicknameBlacklist");

		/*ranksDB = db.collection("RankList");
		rankingDB = db.collection("PlayersRanking");*/
		/*monthlyEventDB = db.collection("MonthlyPlayChallengeSeries");*/

		//prizeEventDB = db.collection("FruitParty");
		penaltiesDB = db.collection("PlayersPenalties");
		stringDB = db.collection("String");
		stadiDB = db.collection("Stadiums");
		//ticketCountDB = dbD.collection("TicketCount");
		//subscriberDB = db.collection("PlayersSub");
	}
	await run().catch(err => writeLog("", "Errore RUN MONGODB: " + err, true))
	/* -------------------------------------------------------- */

	/* JSON DATA */
	let authArray = []

	let allAdmins = undefined;

	/* RANK */
	const ranks = ["Bronze", "Silver", "Gold", "Diamond"];
	const maxLevel = 3; // Ogni rank ha tre sotto-livelli





	//let tempBlacklist = [{ nickname: "", id: -1, auth: "", connect: "", data: "", durata: "", reason: "", bannedBy: "" }]

	let infractionCount = 0
	//let customization = [{ nickname: "", currentSkin: -1, currentStadium: -1, allowedSkin: [], allowedStadium: [], sacks: [] }]
	//let ranking = [{ nickname: "", rankPoints: -251, rankString: "", rankedGames: -1 }]
	//let subscriber = [{ nickname: "", subrole: -1, subroleString: "", endData: -1, colorchat: "", customWelcome: "", prefix: "", currentAnimation: "" }]
	//let nicknameBlacklist = [{ nickname: "" }]
	//let rankList = [{ rankName: "", rankUp: 0, rankDown: 0, rankString: "" }]
	//let monthlyEvent = [{ month: 0, year: 0, name: "", total_game: 0, first_goal: 0, second_goal: 0, desc_fg: "", desc_sg: "", name_sacks: "", code: "", isFull: false }]
	/* ---------------------------------------- */



	/* CONFIG ROOM */
	const roomName = debugFilter ? '🔷️ • HaxZone 2.0 • ⚠️ TEST 🛠️🔷' : '🔷️ • HaxZone 2.0 • ⚽ BigLassic ⚽🔷';
	const maxPlayers = 22;
	const roomPublic = debugMode ? false : true;
	const geo = { "code": "IT", "lat": 42.5176066, "lon": 12.5154288 }

	let fetchRecordingVariable = true;
	let timeLimit = 3;
	let scoreLimit = 3;

	let gameConfig = {
		roomName: roomName,
		maxPlayers: maxPlayers,
		public: roomPublic,
		noPlayer: true,
		geo: geo
	}

	if (typeof token == 'string' && token.length == 39) {
		gameConfig.token = token;
	}

	let room = HBInit(gameConfig); // HAXBALL_ROOM_INIT

	let roomPassword = "";
	if (debugFilter) {
		roomPassword = process.env.ROOM_PASSWORD;
		room.setPassword(roomPassword);
	}

	room.setScoreLimit(scoreLimit);
	room.setTimeLimit(timeLimit);
	room.setTeamsLock(true);
	room.setKickRateLimit(6, 0, 0);

	/* ----------------------- */

	/* STADI */
	let STTrai = '{"name":"Stadium HaxZone Orange SOLO","width":510,"height":265,"spawnDistance":338,"bg":{"type":"none","width":460,"height":205,"kickOffRadius":77.5,"cornerRadius":0,"color":"505050"},"vertexes":[{"x":-460,"y":205,"cMask":["wall"],"cGroup":["wall"],"trait":"ballArea","color":"FFFFFF","bias":-30,"curve":0,"vis":false},{"x":-460,"y":64,"trait":"ballArea","bias":-30},{"x":-460,"y":-64,"trait":"ballArea","bias":-30},{"x":-460,"y":-205,"cMask":["wall"],"cGroup":["wall"],"trait":"ballArea","color":"FFFFFF","vis":false,"curve":0,"bias":-30},{"x":460,"y":205,"cMask":["wall"],"cGroup":["wall"],"trait":"ballArea","color":"FFFFFF","bias":30,"curve":0,"vis":false,"_data":{"mirror":{}}},{"x":460,"y":80,"trait":"ballArea","bias":30,"_data":{"mirror":{}}},{"x":460,"y":-80,"trait":"ballArea","bias":30,"_data":{"mirror":{}}},{"x":460,"y":-205,"cMask":["wall"],"cGroup":["wall"],"trait":"ballArea","color":"FFFFFF","bias":30,"curve":0,"vis":false,"_data":{"mirror":{}}},{"x":0,"y":235,"cMask":["wall"],"cGroup":["wall"],"trait":"kickOffBarrier","vis":false},{"x":0,"y":-235,"cMask":["wall"],"cGroup":["wall"],"trait":"kickOffBarrier","vis":false},{"x":0,"y":205,"cMask":["wall"],"cGroup":["wall"],"color":"FFFFFF","curve":0},{"x":0,"y":-205,"cMask":["wall"],"cGroup":["wall"],"color":"FFFFFF","vis":true,"curve":0},{"x":0,"y":77.5,"bCoef":0.5,"cMask":["wall"],"cGroup":["wall"],"vis":true,"curve":0,"color":"FFFFFF"},{"x":0,"y":-77.5,"bCoef":0.5,"cMask":["wall"],"cGroup":["wall"],"vis":true,"curve":0,"color":"FE904B"},{"x":27.5,"y":-40,"cMask":["wall"],"cGroup":["wall"],"curve":180,"color":"FFFFFF"},{"x":35,"y":-40,"cMask":["wall"],"cGroup":["wall"],"color":"FFFFFF","curve":180},{"x":-30,"y":0,"cMask":["wall"],"cGroup":["wall"],"color":"195096"},{"x":30,"y":0,"cMask":["wall"],"cGroup":["wall"],"color":"195096"},{"x":32.5,"y":-42.5,"cMask":["wall"],"cGroup":["wall"],"curve":0,"color":"BBBBBB"},{"x":32.5,"y":71,"cMask":["wall"],"cGroup":["wall"],"curve":0,"color":"BBBBBB"},{"x":-30,"y":2.5,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":30,"y":2.5,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":-30,"y":-2.5,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":30,"y":-2.5,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":27.5,"y":-40,"cMask":["wall"],"cGroup":["wall"],"color":"BBBBBB"},{"x":27.5,"y":72.94251024604365,"cMask":["wall"],"cGroup":["wall"],"color":"BBBBBB"},{"x":30,"y":-42.5,"cMask":["wall"],"cGroup":["wall"],"color":"FFFFFF"},{"x":30,"y":71,"cMask":["wall"],"cGroup":["wall"],"color":"FFFFFF"},{"x":-29.632118985932685,"y":-71.49565804334709,"cMask":["wall"],"cGroup":["wall"],"color":"195096"},{"x":-30,"y":42.5,"cMask":["wall"],"cGroup":["wall"],"color":"195096"},{"x":-32.5,"y":-70.75989601521246,"cMask":["wall"],"cGroup":["wall"],"color":"195096"},{"x":-32.5,"y":42.5,"cMask":["wall"],"cGroup":["wall"],"color":"195096"},{"x":-27.5,"y":-73.5,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":-27.5,"y":40.1,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":-35,"y":-68.89017754931677,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":-35,"y":40.1,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":35,"y":-40.1,"cMask":["wall"],"cGroup":["wall"],"curve":0,"color":"BBBBBB"},{"x":35,"y":70,"cMask":["wall"],"cGroup":["wall"],"curve":0,"color":"BBBBBB"},{"x":-35,"y":40,"cMask":["wall"],"cGroup":["wall"],"curve":-180},{"x":-27.5,"y":40,"cMask":["wall"],"cGroup":["wall"],"curve":-180},{"x":27.5,"y":-40,"cMask":["wall"],"cGroup":["wall"],"curve":180,"color":"BBBBBB"},{"x":35,"y":-40,"cMask":["wall"],"cGroup":["wall"],"curve":180,"color":"BBBBBB"},{"x":460,"y":90,"bCoef":1,"cMask":["c0"],"cGroup":["c0"],"vis":false},{"x":129.2892838155986,"y":90,"bCoef":1,"cMask":["c0"],"cGroup":["c0"],"vis":false},{"x":460,"y":-90,"bCoef":1,"cMask":["c0"],"cGroup":["c0"],"vis":false,"_data":{"mirror":{}}},{"x":129.2892838155986,"y":-90,"bCoef":1,"cMask":["c0"],"cGroup":["c0"],"vis":false,"_data":{"mirror":{}}},{"x":-30,"y":-205,"cMask":["ball"],"cGroup":["ball"],"vis":false},{"x":-30,"y":205,"cMask":["ball"],"cGroup":["ball"],"vis":false}],"segments":[{"v0":0,"v1":1,"trait":"ballArea","bias":-30},{"v0":2,"v1":3,"trait":"ballArea","bias":-30},{"v0":4,"v1":5,"trait":"ballArea","bias":30},{"v0":6,"v1":7,"trait":"ballArea","bias":30},{"v0":3,"v1":0,"curve":0,"color":"FE904B","bCoef":0.5,"cMask":["wall"],"cGroup":["wall"],"trait":"goalPost"},{"v0":0,"v1":10,"color":"FE904B","cMask":["wall"],"cGroup":["wall"]},{"v0":3,"v1":11,"curve":0,"vis":true,"color":"FE904B","cMask":["wall"],"cGroup":["wall"]},{"v0":7,"v1":4,"curve":0,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"],"_data":{"mirror":{},"arc":{"a":[460,-205],"b":[460,205],"curve":0}}},{"v0":4,"v1":10,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":11,"v1":7,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":12,"v1":8,"vis":false,"color":"FF0000","bCoef":0.5,"cMask":["wall"],"cGroup":["wall"]},{"v0":13,"v1":9,"vis":false,"color":"FF0000","bCoef":0.5,"cMask":["wall"],"cGroup":["wall"]},{"v0":13,"v1":12,"curve":180,"vis":true,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":12,"v1":13,"curve":180,"vis":true,"color":"FE904B","cMask":["wall"],"cGroup":["wall"]},{"v0":11,"v1":13,"curve":0,"vis":true,"color":"FE904B","cMask":["wall"],"cGroup":["wall"]},{"v0":12,"v1":10,"curve":0,"vis":true,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":0,"v1":4,"curve":0,"vis":false,"color":"FFFFFF","bCoef":1,"cMask":["ball"],"trait":"ballArea","bias":30},{"v0":7,"v1":3,"curve":0,"vis":false,"color":"FFFFFF","bCoef":1,"trait":"ballArea","bias":30},{"v0":14,"v1":15,"curve":180,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":16,"v1":17,"color":"FE904B","cMask":["wall"],"cGroup":["wall"]},{"v0":18,"v1":19,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":20,"v1":21,"color":"FE904B","cMask":["wall"],"cGroup":["wall"]},{"v0":22,"v1":23,"color":"FE904B","cMask":["wall"],"cGroup":["wall"]},{"v0":24,"v1":25,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":26,"v1":27,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":28,"v1":29,"color":"FE904B","cMask":["wall"],"cGroup":["wall"]},{"v0":30,"v1":31,"color":"FE904B","cMask":["wall"],"cGroup":["wall"]},{"v0":32,"v1":33,"color":"FE904B","cMask":["wall"],"cGroup":["wall"]},{"v0":34,"v1":35,"color":"FE904B","cMask":["wall"],"cGroup":["wall"]},{"v0":36,"v1":37,"curve":0,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":38,"v1":39,"curve":-180.74779114404333,"color":"FE904B","cMask":["wall"],"cGroup":["wall"]},{"v0":42,"v1":43,"vis":false,"color":"5689E5","bCoef":1,"cMask":["c0"],"cGroup":["c0"],"y":90},{"v0":44,"v1":45,"vis":false,"color":"5689E5","bCoef":1,"cMask":["c0"],"cGroup":["c0"],"y":90,"_data":{"mirror":{},"arc":{"a":[460,-90],"b":[129.2892838155986,-90],"radius":null,"center":[null,null],"from":null,"to":null}}},{"v0":46,"v1":47,"curve":0,"vis":false,"color":"FE904B","cMask":["ball"],"cGroup":["ball"]}],"goals":[{"p0":[472,80],"p1":[472,-80],"team":"blue"}],"discs":[{"pos":[-460,-80],"color":"FC8433","trait":"goalPost"},{"radius":4,"invMass":0,"pos":[-474,-80],"color":"FC8433"},{"radius":4,"invMass":0,"pos":[-483,-80],"color":"FC8433"},{"radius":4,"invMass":0,"pos":[-492,-80],"color":"FC8433"},{"radius":4,"invMass":0,"pos":[-500,-75],"color":"FC8433"},{"radius":4,"invMass":0,"pos":[-500,-65],"color":"FC8433"},{"radius":4,"invMass":1,"pos":[-500,-55],"color":"FC8433"},{"radius":4,"invMass":1,"pos":[-500,-45],"color":"FC8433"},{"radius":4,"invMass":1,"pos":[-500,-35],"color":"FC8433"},{"radius":4,"invMass":1,"pos":[-500,-25],"color":"FC8433"},{"radius":4,"invMass":1,"pos":[-500,-15],"color":"FC8433"},{"radius":4,"invMass":1,"pos":[-500,-5],"color":"FC8433"},{"radius":4,"invMass":1,"pos":[-500,5],"color":"FC8433"},{"radius":4,"invMass":1,"pos":[-500,15],"color":"FC8433"},{"radius":4,"invMass":1,"pos":[-500,25],"color":"FC8433"},{"radius":4,"invMass":1,"pos":[-500,35],"color":"FC8433"},{"radius":4,"invMass":1,"pos":[-500,45],"color":"FC8433"},{"radius":4,"invMass":1,"pos":[-500,55],"color":"FC8433"},{"radius":4,"invMass":0,"pos":[-500,65],"color":"FC8433"},{"radius":4,"invMass":0,"pos":[-500,75],"color":"FC8433"},{"radius":4,"invMass":0,"pos":[-492,80],"color":"FC8433"},{"radius":4,"invMass":0,"pos":[-483,80],"color":"FC8433"},{"radius":4,"invMass":0,"pos":[-474,80],"color":"FC8433"},{"pos":[-460,80],"color":"FC8433","trait":"goalPost"},{"pos":[460,-80],"color":"BBBBBB","trait":"goalPost","_data":{"mirror":{}}},{"radius":4,"invMass":0,"pos":[474,-80],"color":"BBBBBB"},{"radius":4,"invMass":0,"pos":[483,-80],"color":"BBBBBB"},{"radius":4,"invMass":0,"pos":[492,-80],"color":"BBBBBB"},{"radius":4,"invMass":0,"pos":[500,-75],"color":"BBBBBB"},{"radius":4,"invMass":0,"pos":[500,-65],"color":"BBBBBB"},{"radius":4,"invMass":1,"pos":[500,-55],"color":"BBBBBB"},{"radius":4,"invMass":1,"pos":[500,-45],"color":"BBBBBB"},{"radius":4,"invMass":1,"pos":[500,-35],"color":"BBBBBB"},{"radius":4,"invMass":1,"pos":[500,-25],"color":"BBBBBB"},{"radius":4,"invMass":1,"pos":[500,-15],"color":"BBBBBB"},{"radius":4,"invMass":1,"pos":[500,-5],"color":"BBBBBB"},{"radius":4,"invMass":1,"pos":[500,5],"color":"BBBBBB"},{"radius":4,"invMass":1,"pos":[500,15],"color":"BBBBBB"},{"radius":4,"invMass":1,"pos":[500,25],"color":"BBBBBB"},{"radius":4,"invMass":1,"pos":[500,35],"color":"BBBBBB"},{"radius":4,"invMass":1,"pos":[500,45],"color":"BBBBBB"},{"radius":4,"invMass":1,"pos":[500,55],"color":"BBBBBB"},{"radius":4,"invMass":0,"pos":[500,65],"color":"BBBBBB"},{"radius":4,"invMass":0,"pos":[500,75],"color":"BBBBBB"},{"radius":4,"invMass":0,"pos":[492,80],"color":"BBBBBB"},{"radius":4,"invMass":0,"pos":[483,80],"color":"BBBBBB"},{"radius":4,"invMass":0,"pos":[474,80],"color":"BBBBBB"},{"pos":[460,80],"color":"BBBBBB","trait":"goalPost"},{"radius":15,"invMass":0.000001,"pos":[433.01145248804715,-61.00448140836626],"color":"5689E5","bCoef":1,"cMask":["ball","c0"],"cGroup":["ball","c0"],"damping":1,"speed":[0,4],"_data":{"mirror":{}}}],"planes":[{"normal":[0,1],"dist":-205,"trait":"ballArea","_data":{"extremes":{"normal":[0,1],"dist":-205,"canvas_rect":[-826.9776,-309.096,826.9776,309.096],"a":[-826.9776,-205],"b":[826.9776,-205]}}},{"normal":[0,-1],"dist":-205,"trait":"ballArea","vis":true,"bias":30,"_data":{"extremes":{"normal":[0,-1],"dist":-205,"canvas_rect":[-826.9776,-309.096,826.9776,309.096],"a":[-826.9776,205],"b":[826.9776,205]}}},{"normal":[0,1],"dist":-235,"bCoef":0.1,"_data":{"extremes":{"normal":[0,1],"dist":-235,"canvas_rect":[-826.9776,-309.096,826.9776,309.096],"a":[-826.9776,-235],"b":[826.9776,-235]}}},{"normal":[0,-1],"dist":-235,"bCoef":0.1,"_data":{"extremes":{"normal":[0,-1],"dist":-235,"canvas_rect":[-826.9776,-309.096,826.9776,309.096],"a":[-826.9776,235],"b":[826.9776,235]}}},{"normal":[1,0],"dist":-510,"bCoef":0.1,"_data":{"extremes":{"normal":[1,0],"dist":-510,"canvas_rect":[-826.9776,-309.096,826.9776,309.096],"a":[-510,-309.096],"b":[-510,309.096]}}},{"normal":[-1,0],"dist":-510,"bCoef":0.1,"_data":{"extremes":{"normal":[-1,0],"dist":-510,"canvas_rect":[-826.9776,-309.096,826.9776,309.096],"a":[510,-309.096],"b":[510,309.096]}}}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]},"dr":{"color":"FC8433"},"db":{"color":"BBBBBB"},"jr":{"strength":0.1,"color":"FC8433"},"jb":{"strength":0.1,"color":"BBBBBB"}},"joints":[{"d0":1,"d1":2,"length":null,"trait":"jr"},{"d0":2,"d1":3,"length":null,"trait":"jr"},{"d0":3,"d1":4,"length":null,"trait":"jr"},{"d0":4,"d1":5,"length":null,"trait":"jr"},{"d0":5,"d1":6,"length":null,"trait":"jr"},{"d0":6,"d1":7,"length":null,"trait":"jr"},{"d0":7,"d1":8,"length":null,"trait":"jr"},{"d0":8,"d1":9,"length":null,"trait":"jr"},{"d0":9,"d1":10,"length":null,"trait":"jr"},{"d0":10,"d1":11,"length":null,"trait":"jr"},{"d0":11,"d1":12,"length":null,"trait":"jr"},{"d0":12,"d1":13,"length":null,"trait":"jr"},{"d0":13,"d1":14,"length":null,"trait":"jr"},{"d0":14,"d1":15,"length":null,"trait":"jr"},{"d0":15,"d1":16,"length":null,"trait":"jr"},{"d0":16,"d1":17,"length":null,"trait":"jr"},{"d0":17,"d1":18,"length":null,"trait":"jr"},{"d0":18,"d1":19,"length":null,"trait":"jr"},{"d0":19,"d1":20,"length":null,"trait":"jr"},{"d0":20,"d1":21,"length":null,"trait":"jr"},{"d0":21,"d1":22,"length":null,"trait":"jr"},{"d0":22,"d1":23,"length":null,"trait":"jr"},{"d0":25,"d1":26,"trait":"jb"},{"d0":26,"d1":27,"trait":"jb"},{"d0":27,"d1":28,"trait":"jb","invMass":1},{"d0":28,"d1":29,"trait":"jb","invMass":1},{"d0":29,"d1":30,"trait":"jb","invMass":1},{"d0":30,"d1":31,"trait":"jb","invMass":1},{"d0":31,"d1":32,"trait":"jb","invMass":1},{"d0":32,"d1":33,"trait":"jb","invMass":1},{"d0":33,"d1":34,"trait":"jb","invMass":1},{"d0":34,"d1":35,"trait":"jb","invMass":1},{"d0":35,"d1":36,"trait":"jb","invMass":1},{"d0":36,"d1":37,"trait":"jb","invMass":1},{"d0":37,"d1":38,"trait":"jb","invMass":1},{"d0":38,"d1":39,"trait":"jb"},{"d0":39,"d1":40,"trait":"jb"},{"d0":40,"d1":41,"trait":"jb"},{"d0":41,"d1":42,"trait":"jb"},{"d0":42,"d1":43,"trait":"jb"},{"d0":43,"d1":44,"trait":"jb"}],"ballPhysics":{"color":"CCCCCC","radius":10,"bCoef":0.5,"cMask":["all"],"damping":0.99,"invMass":1,"gravity":[0,0],"cGroup":["ball"]},"redSpawnPoints":[[-192.5,0],[-192.5,50],[-407,0]],"blueSpawnPoints":[[192.5,0],[192.5,50],[407,0]],"playerPhysics":{"acceleration":0.11,"kickStrength":7,"kickingAcceleration":0.1,"radius":15,"bCoef":0.5,"invMass":0.5,"damping":0.96,"cGroup":["red","blue","c0"],"gravity":[0,0],"kickingDamping":0.96,"kickback":0},"kickOffReset":"full","canBeStored":false,"cameraWidth":0,"cameraHeight":0,"maxViewWidth":0,"cameraFollow":"ball"}';/*await stadiDB.findOne({type: "training", active: true});*/
	let ST2vs2 = '{"name":"Stadium HaxZone 2v2 Cyan","width":510,"height":265,"spawnDistance":338,"bg":{"type":"none","width":460,"height":205,"kickOffRadius":77.5,"cornerRadius":0,"color":"505050"},"vertexes":[{"x":-460,"y":205,"cMask":["wall"],"cGroup":["wall"],"trait":"ballArea","color":"0EBDDB","bias":-30,"curve":0,"vis":false},{"x":-460,"y":64,"trait":"ballArea","bias":-30},{"x":-460,"y":-64,"trait":"ballArea","bias":-30},{"x":-460,"y":-205,"cMask":["wall"],"cGroup":["wall"],"trait":"ballArea","color":"FFFFFF","vis":false,"curve":0,"bias":-30},{"x":460,"y":205,"cMask":["wall"],"cGroup":["wall"],"trait":"ballArea","color":"FFFFFF","bias":30,"curve":0,"vis":false},{"x":460,"y":64,"trait":"ballArea","bias":30},{"x":460,"y":-64,"trait":"ballArea","bias":30},{"x":460,"y":-205,"cMask":["wall"],"cGroup":["wall"],"trait":"ballArea","color":"FFFFFF","bias":30,"curve":0,"vis":false},{"x":0,"y":235,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","vis":false},{"x":0,"y":-235,"cMask":["red","blue"],"trait":"kickOffBarrier","vis":false},{"x":0,"y":205,"cMask":["wall"],"cGroup":["wall"],"color":"0EBDDB"},{"x":0,"y":-205,"cMask":["wall"],"cGroup":["wall"],"color":"FFFFFF","vis":true,"curve":0},{"x":0,"y":77.5,"bCoef":0.5,"trait":"kickOffBarrier","vis":true,"curve":0,"color":"FFFFFF"},{"x":0,"y":-77.5,"bCoef":0.5,"trait":"kickOffBarrier","vis":true,"curve":0,"color":"FE904B"},{"x":27.5,"y":-40,"cMask":["wall"],"cGroup":["wall"],"curve":180,"color":"FFFFFF"},{"x":35,"y":-40,"cMask":["wall"],"cGroup":["wall"],"color":"FFFFFF","curve":180},{"x":-30,"y":0,"cMask":["wall"],"cGroup":["wall"],"color":"195096"},{"x":30,"y":0,"cMask":["wall"],"cGroup":["wall"],"color":"195096"},{"x":32.5,"y":-42.5,"cMask":["wall"],"cGroup":["wall"],"curve":0,"color":"BBBBBB"},{"x":32.5,"y":71,"cMask":["wall"],"cGroup":["wall"],"curve":0,"color":"BBBBBB"},{"x":-30,"y":2.5,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":30,"y":2.5,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":-30,"y":-2.5,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":30,"y":-2.5,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":27.5,"y":-40,"cMask":["wall"],"cGroup":["wall"],"color":"BBBBBB"},{"x":27.5,"y":72.94251024604365,"cMask":["wall"],"cGroup":["wall"],"color":"BBBBBB"},{"x":30,"y":-42.5,"cMask":["wall"],"cGroup":["wall"],"color":"FFFFFF"},{"x":30,"y":71,"cMask":["wall"],"cGroup":["wall"],"color":"FFFFFF"},{"x":-29.632118985932685,"y":-71.49565804334709,"cMask":["wall"],"cGroup":["wall"],"color":"195096"},{"x":-30,"y":42.5,"cMask":["wall"],"cGroup":["wall"],"color":"195096"},{"x":-32.5,"y":-70.75989601521246,"cMask":["wall"],"cGroup":["wall"],"color":"195096"},{"x":-32.5,"y":42.5,"cMask":["wall"],"cGroup":["wall"],"color":"195096"},{"x":-27.5,"y":-73.5,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":-27.5,"y":40.1,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":-35,"y":-68.89017754931677,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":-35,"y":40.1,"cMask":["wall"],"cGroup":["wall"],"color":"FE904B"},{"x":35,"y":-40.1,"cMask":["wall"],"cGroup":["wall"],"curve":0,"color":"BBBBBB"},{"x":35,"y":70,"cMask":["wall"],"cGroup":["wall"],"curve":0,"color":"BBBBBB"},{"x":-35,"y":40,"cMask":["wall"],"cGroup":["wall"],"curve":-180},{"x":-27.5,"y":40,"cMask":["wall"],"cGroup":["wall"],"curve":-180},{"x":27.5,"y":-40,"cMask":["wall"],"cGroup":["wall"],"curve":180,"color":"BBBBBB"},{"x":35,"y":-40,"cMask":["wall"],"cGroup":["wall"],"curve":180,"color":"BBBBBB"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea","bias":-30},{"v0":2,"v1":3,"trait":"ballArea","bias":-30},{"v0":4,"v1":5,"trait":"ballArea","bias":30},{"v0":6,"v1":7,"trait":"ballArea","bias":30},{"v0":3,"v1":0,"curve":0,"color":"0EBDDB","bCoef":0.5,"cMask":["wall"],"cGroup":["wall"],"trait":"goalPost"},{"v0":0,"v1":10,"color":"0EBDDB","cMask":["wall"],"cGroup":["wall"]},{"v0":3,"v1":11,"curve":0,"vis":true,"color":"0EBDDB","cMask":["wall"],"cGroup":["wall"]},{"v0":7,"v1":4,"curve":0,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":4,"v1":10,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":11,"v1":7,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":12,"v1":8,"vis":false,"color":"FF0000","bCoef":0.5,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier"},{"v0":13,"v1":9,"vis":false,"color":"FF0000","bCoef":0.5,"cMask":["red","blue"],"trait":"kickOffBarrier"},{"v0":13,"v1":12,"curve":180,"vis":true,"color":"FFFFFF","cMask":["red","blue"],"cGroup":["redKO"],"trait":"kickOffBarrier"},{"v0":12,"v1":13,"curve":180,"vis":true,"color":"0EBDDB","cMask":["red","blue"],"cGroup":["blueKO"],"trait":"kickOffBarrier"},{"v0":11,"v1":13,"curve":0,"vis":true,"color":"0EBDDB","cMask":["wall"],"cGroup":["wall"],"trait":"kickOffBarrier"},{"v0":12,"v1":10,"curve":0,"vis":true,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":0,"v1":4,"curve":0,"vis":false,"color":"FFFFFF","bCoef":1,"cMask":["ball"],"trait":"ballArea","bias":30},{"v0":7,"v1":3,"curve":0,"vis":false,"color":"FFFFFF","bCoef":1,"trait":"ballArea","bias":30},{"v0":14,"v1":15,"curve":180,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":16,"v1":17,"color":"0EBDDB","cMask":["wall"],"cGroup":["wall"]},{"v0":18,"v1":19,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":20,"v1":21,"color":"0EBDDB","cMask":["wall"],"cGroup":["wall"]},{"v0":22,"v1":23,"color":"0EBDDB","cMask":["wall"],"cGroup":["wall"]},{"v0":24,"v1":25,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":26,"v1":27,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":28,"v1":29,"color":"0EBDDB","cMask":["wall"],"cGroup":["wall"]},{"v0":30,"v1":31,"color":"0EBDDB","cMask":["wall"],"cGroup":["wall"]},{"v0":32,"v1":33,"color":"0EBDDB","cMask":["wall"],"cGroup":["wall"]},{"v0":34,"v1":35,"color":"0EBDDB","cMask":["wall"],"cGroup":["wall"]},{"v0":36,"v1":37,"curve":0,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":38,"v1":39,"curve":-180.74779114404333,"color":"0EBDDB","cMask":["wall"],"cGroup":["wall"]}],"goals":[{"p0":[-472,-64],"p1":[-472,64],"team":"red"},{"p0":[472,64],"p1":[472,-64],"team":"blue"}],"discs":[{"pos":[-460,-60],"color":"05B2DE","trait":"goalPost"},{"radius":4,"invMass":0,"pos":[-474,-60],"trait":"dr"},{"radius":4,"invMass":0,"pos":[-483,-60],"trait":"dr"},{"radius":4,"invMass":0,"pos":[-492,-60],"trait":"dr"},{"radius":4,"invMass":0,"pos":[-500,-55],"trait":"dr"},{"radius":4,"invMass":1,"pos":[-500,-45],"trait":"dr"},{"radius":4,"invMass":1,"pos":[-500,-35],"trait":"dr"},{"radius":4,"invMass":1,"pos":[-500,-25],"trait":"dr"},{"radius":4,"invMass":1,"pos":[-500,-15],"trait":"dr"},{"radius":4,"invMass":1,"pos":[-500,-5],"trait":"dr"},{"radius":4,"invMass":1,"pos":[-500,5],"trait":"dr"},{"radius":4,"invMass":1,"pos":[-500,15],"trait":"dr"},{"radius":4,"invMass":1,"pos":[-500,25],"trait":"dr"},{"radius":4,"invMass":1,"pos":[-500,35],"trait":"dr"},{"radius":4,"invMass":1,"pos":[-500,45],"trait":"dr"},{"radius":4,"invMass":0,"pos":[-500,55],"trait":"dr"},{"radius":4,"invMass":0,"pos":[-492,60],"trait":"dr"},{"radius":4,"invMass":0,"pos":[-483,60],"trait":"dr"},{"radius":4,"invMass":0,"pos":[-474,60],"trait":"dr"},{"pos":[-460,60],"color":"05B2DE","trait":"goalPost"},{"pos":[460,-60],"color":"BBBBBB","trait":"goalPost"},{"radius":4,"invMass":0,"pos":[474,-60],"trait":"db"},{"radius":4,"invMass":0,"pos":[483,-60],"trait":"db"},{"radius":4,"invMass":0,"pos":[492,-60],"trait":"db"},{"radius":4,"invMass":0,"pos":[500,-55],"trait":"db"},{"radius":4,"invMass":1,"pos":[500,-45],"trait":"db"},{"radius":4,"invMass":1,"pos":[500,-35],"trait":"db"},{"radius":4,"invMass":1,"pos":[500,-25],"trait":"db"},{"radius":4,"invMass":1,"pos":[500,-15],"trait":"db"},{"radius":4,"invMass":1,"pos":[500,-5],"trait":"db"},{"radius":4,"invMass":1,"pos":[500,5],"trait":"db"},{"radius":4,"invMass":1,"pos":[500,15],"trait":"db"},{"radius":4,"invMass":1,"pos":[500,25],"trait":"db"},{"radius":4,"invMass":1,"pos":[500,35],"trait":"db"},{"radius":4,"invMass":1,"pos":[500,45],"trait":"db"},{"radius":4,"invMass":0,"pos":[500,55],"trait":"db"},{"radius":4,"invMass":0,"pos":[492,60],"trait":"db"},{"radius":4,"invMass":0,"pos":[483,60],"trait":"db"},{"radius":4,"invMass":0,"pos":[474,60],"trait":"db"},{"pos":[460,60],"color":"BBBBBB","trait":"goalPost"}],"planes":[{"normal":[0,1],"dist":-205,"trait":"ballArea"},{"normal":[0,-1],"dist":-205,"trait":"ballArea","vis":true,"bias":30},{"normal":[0,1],"dist":-235,"bCoef":0.1},{"normal":[0,-1],"dist":-235,"bCoef":0.1},{"normal":[1,0],"dist":-510,"bCoef":0.1},{"normal":[-1,0],"dist":-510,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]},"dr":{"color":"05B2DE"},"db":{"color":"BBBBBB"},"jr":{"strength":0.1,"color":"05B2DE"},"jb":{"strength":0.1,"color":"BBBBBB"}},"joints":[{"d0":1,"d1":2,"length":null,"trait":"jr"},{"d0":2,"d1":3,"length":null,"trait":"jr"},{"d0":3,"d1":4,"length":null,"trait":"jr"},{"d0":4,"d1":5,"length":null,"trait":"jr"},{"d0":5,"d1":6,"length":null,"trait":"jr"},{"d0":6,"d1":7,"length":null,"trait":"jr"},{"d0":7,"d1":8,"length":null,"trait":"jr"},{"d0":8,"d1":9,"length":null,"trait":"jr"},{"d0":9,"d1":10,"length":null,"trait":"jr"},{"d0":10,"d1":11,"length":null,"trait":"jr"},{"d0":11,"d1":12,"length":null,"trait":"jr"},{"d0":12,"d1":13,"length":null,"trait":"jr"},{"d0":13,"d1":14,"length":null,"trait":"jr"},{"d0":14,"d1":15,"length":null,"trait":"jr"},{"d0":15,"d1":16,"length":null,"trait":"jr"},{"d0":16,"d1":17,"length":null,"trait":"jr"},{"d0":17,"d1":18,"length":null,"trait":"jr"},{"d0":18,"d1":19,"length":null,"trait":"jr"},{"d0":19,"d1":20,"length":null,"trait":"jr"},{"d0":21,"d1":22,"length":null,"trait":"jb"},{"d0":22,"d1":23,"length":null,"trait":"jb"},{"d0":23,"d1":24,"length":null,"trait":"jb"},{"d0":24,"d1":25,"length":null,"trait":"jb"},{"d0":25,"d1":26,"length":null,"trait":"jb"},{"d0":26,"d1":27,"length":null,"trait":"jb"},{"d0":27,"d1":28,"length":null,"trait":"jb"},{"d0":28,"d1":29,"length":null,"trait":"jb"},{"d0":29,"d1":30,"length":null,"trait":"jb"},{"d0":30,"d1":31,"length":null,"trait":"jb"},{"d0":31,"d1":32,"length":null,"trait":"jb"},{"d0":32,"d1":33,"length":null,"trait":"jb"},{"d0":33,"d1":34,"length":null,"trait":"jb"},{"d0":34,"d1":35,"length":null,"trait":"jb"},{"d0":35,"d1":36,"length":null,"trait":"jb"},{"d0":36,"d1":37,"length":null,"trait":"jb"},{"d0":37,"d1":38,"length":null,"trait":"jb"},{"d0":38,"d1":39,"length":null,"trait":"jb"},{"d0":39,"d1":40,"length":null,"trait":"jb"}],"ballPhysics":{"color":"CCCCCC","radius":10,"bCoef":0.5,"cMask":["all"],"damping":0.99,"invMass":1,"gravity":[0,0],"cGroup":["ball"]},"redSpawnPoints":[[-192.5,0],[-192.5,50],[-407,0]],"blueSpawnPoints":[[192.5,0],[192.5,50],[407,0]],"playerPhysics":{"acceleration":0.11,"kickStrength":7,"kickingAcceleration":0.1,"radius":15,"bCoef":0.5,"invMass":0.5,"damping":0.96,"cGroup":["red","blue"],"gravity":[0,0],"kickingDamping":0.96,"kickback":0},"kickOffReset":"full","canBeStored":false,"cameraWidth":0,"cameraHeight":0,"maxViewWidth":0,"cameraFollow":"ball"}';/*await stadiDB.findOne({type: "2v2", active: true});*/
	let ST3vs3 = '{"name":"Stadium HaxZone Italy","width":600,"height":300,"spawnDistance":350,"bg":{"type":"none","width":550,"height":240,"kickOffRadius":80,"cornerRadius":0,"color":"505050"},"vertexes":[{"x":-550,"y":240,"cMask":["ball"],"cGroup":["wall"],"trait":"ballArea","bias":30,"curve":0,"color":"910000"},{"x":-550,"y":80,"trait":"ballArea","bias":-30,"color":"008FBA"},{"x":-550,"y":-80,"trait":"ballArea","bias":-30,"color":"008FBA"},{"x":-550,"y":-240,"cMask":["wall"],"cGroup":["wall"],"trait":"ballArea","bias":-30,"curve":0,"color":"910000"},{"x":550,"y":240,"cMask":["ball"],"cGroup":["wall"],"trait":"ballArea","color":"008FBA","bias":30,"curve":0},{"x":550,"y":80,"trait":"ballArea","bias":30,"color":"910000"},{"x":550,"y":-80,"trait":"ballArea","bias":30,"color":"910000"},{"x":550,"y":-240,"cMask":["wall"],"cGroup":["wall"],"trait":"ballArea","color":"008FBA","bias":30,"curve":0},{"x":0,"y":270,"trait":"kickOffBarrier"},{"x":0,"y":80,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","color":"FFFFFF","vis":true,"curve":180,"_data":{"mirror":{}}},{"x":0,"y":-80,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","color":"FFFFFF","vis":true,"curve":180,"_data":{"mirror":{}}},{"x":0,"y":-240,"bCoef":1,"cMask":["wall"],"cGroup":["wall"],"color":"FFFFFF"},{"x":0,"y":240,"bCoef":1,"cMask":["wall"],"cGroup":["wall"],"color":"FFFFFF"},{"x":0,"y":-270,"bCoef":0.1,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier","curve":0}],"segments":[{"v0":0,"v1":1,"trait":"ballArea","bias":-30},{"v0":2,"v1":3,"trait":"ballArea","bias":-30},{"v0":4,"v1":5,"trait":"ballArea","bias":30},{"v0":6,"v1":7,"trait":"ballArea","bias":30},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"curve":180,"vis":true,"color":"FFFFFF","cGroup":["blueKO"],"trait":"kickOffBarrier","_data":{"mirror":{},"arc":{"a":[0,80],"b":[0,-80],"curve":180,"radius":80,"center":[0,0],"from":1.5707963267948966,"to":-1.5707963267948966}}},{"v0":9,"v1":10,"curve":-180,"vis":true,"color":"FFFFFF","cGroup":["redKO"],"trait":"kickOffBarrier"},{"v0":3,"v1":0,"curve":0,"vis":true,"color":"008C45","cMask":["wall"],"cGroup":["wall"]},{"v0":0,"v1":12,"curve":0,"vis":true,"color":"008C45","cMask":["wall"],"cGroup":["wall"]},{"v0":12,"v1":4,"curve":0,"vis":true,"color":"CD212A","cMask":["wall"],"cGroup":["wall"]},{"v0":4,"v1":7,"curve":0,"vis":true,"color":"CD212A","cMask":["wall"],"cGroup":["wall"]},{"v0":3,"v1":11,"curve":0,"vis":true,"color":"008C45","cMask":["wall"],"cGroup":["wall"]},{"v0":7,"v1":11,"curve":0,"vis":true,"color":"CD212A","cMask":["wall"],"cGroup":["wall"]},{"v0":11,"v1":10,"curve":0,"vis":true,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":9,"v1":12,"curve":0,"vis":true,"color":"FFFFFF","cMask":["wall"],"cGroup":["wall"]},{"v0":0,"v1":4,"curve":0,"vis":false,"color":"999999","bCoef":1,"cMask":["ball"],"trait":"ballArea","bias":30},{"v0":7,"v1":3,"curve":0,"vis":false,"color":"999999","bCoef":1,"cMask":["ball"],"trait":"ballArea","bias":30},{"v0":10,"v1":13,"curve":0,"vis":false,"bCoef":0.1,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"kickOffBarrier"}],"goals":[{"p0":[-562,80],"p1":[-562,-80],"team":"red"},{"p0":[562,80],"p1":[562,-80],"team":"blue"}],"discs":[{"pos":[-550,-80],"color":"009246","trait":"goalPost"},{"radius":4,"invMass":0,"pos":[-564,-80],"color":"009246"},{"radius":4,"invMass":0,"pos":[-573,-80],"color":"009246"},{"radius":4,"invMass":0,"pos":[-582,-80],"color":"009246"},{"radius":4,"invMass":0,"pos":[-590,-75],"color":"009246"},{"radius":4,"invMass":0,"pos":[-590,-65],"color":"009246"},{"radius":4,"invMass":1,"pos":[-590,-55],"color":"009246"},{"radius":4,"invMass":1,"pos":[-590,-45],"color":"009246"},{"radius":4,"invMass":1,"pos":[-590,-35],"color":"009246"},{"radius":4,"invMass":1,"pos":[-590,-25],"color":"009246"},{"radius":4,"invMass":1,"pos":[-590,-15],"color":"009246"},{"radius":4,"invMass":1,"pos":[-590,-5],"color":"009246"},{"radius":4,"invMass":1,"pos":[-590,5],"color":"009246"},{"radius":4,"invMass":1,"pos":[-590,15],"color":"009246"},{"radius":4,"invMass":1,"pos":[-590,25],"color":"009246"},{"radius":4,"invMass":1,"pos":[-590,35],"color":"009246"},{"radius":4,"invMass":1,"pos":[-590,45],"color":"009246"},{"radius":4,"invMass":1,"pos":[-590,55],"color":"009246"},{"radius":4,"invMass":0,"pos":[-590,65],"color":"009246"},{"radius":4,"invMass":0,"pos":[-590,75],"color":"009246"},{"radius":4,"invMass":0,"pos":[-564,80],"color":"009246"},{"radius":4,"invMass":0,"pos":[-573,80],"color":"009246"},{"radius":4,"invMass":0,"pos":[-582,80],"color":"009246"},{"pos":[-550,80],"color":"009246","trait":"goalPost"},{"pos":[550,-80],"color":"CE2B37","trait":"goalPost"},{"radius":4,"invMass":0,"pos":[564,-80],"color":"CE2B37"},{"radius":4,"invMass":0,"pos":[573,-80],"color":"CE2B37"},{"radius":4,"invMass":0,"pos":[582,-80],"color":"CE2B37"},{"radius":4,"invMass":0,"pos":[590,-75],"color":"CE2B37"},{"radius":4,"invMass":0,"pos":[590,-65],"color":"CE2B37"},{"radius":4,"invMass":1,"pos":[590,-55],"color":"CE2B37"},{"radius":4,"invMass":1,"pos":[590,-45],"color":"CE2B37"},{"radius":4,"invMass":1,"pos":[590,-35],"color":"CE2B37"},{"radius":4,"invMass":1,"pos":[590,-25],"color":"CE2B37"},{"radius":4,"invMass":1,"pos":[590,-15],"color":"CE2B37"},{"radius":4,"invMass":1,"pos":[590,-5],"color":"CE2B37"},{"radius":4,"invMass":1,"pos":[590,5],"color":"CE2B37"},{"radius":4,"invMass":1,"pos":[590,15],"color":"CE2B37"},{"radius":4,"invMass":1,"pos":[590,25],"color":"CE2B37"},{"radius":4,"invMass":1,"pos":[590,35],"color":"CE2B37"},{"radius":4,"invMass":1,"pos":[590,45],"color":"CE2B37"},{"radius":4,"invMass":1,"pos":[590,55],"color":"CE2B37"},{"radius":4,"invMass":0,"pos":[590,65],"color":"CE2B37"},{"radius":4,"invMass":0,"pos":[590,75],"color":"CE2B37"},{"radius":4,"invMass":0,"pos":[564,80],"color":"CE2B37"},{"radius":4,"invMass":0,"pos":[573,80],"color":"CE2B37"},{"radius":4,"invMass":0,"pos":[582,80],"color":"CE2B37"},{"pos":[550,80],"color":"CE2B37","trait":"goalPost"}],"planes":[{"normal":[0,1],"dist":-270,"bCoef":0.1,"_data":{"extremes":{"normal":[0,1],"dist":-270,"canvas_rect":[-413.6946902408528,-175.04711857864012,413.6946902408528,175.04711857864012],"a":[-413.6946902408528,-270],"b":[413.6946902408528,-270]}}},{"normal":[0,-1],"dist":-270,"bCoef":0.1,"_data":{"extremes":{"normal":[0,-1],"dist":-270,"canvas_rect":[-413.6946902408528,-175.04711857864012,413.6946902408528,175.04711857864012],"a":[-413.6946902408528,270],"b":[413.6946902408528,270]}}},{"normal":[1,0],"dist":-600,"bCoef":0.1,"_data":{"extremes":{"normal":[1,0],"dist":-600,"canvas_rect":[-413.6946902408528,-175.04711857864012,413.6946902408528,175.04711857864012],"a":[-600,-175.04711857864012],"b":[-600,175.04711857864012]}}},{"normal":[-1,0],"dist":-600,"bCoef":0.1,"_data":{"extremes":{"normal":[-1,0],"dist":-600,"canvas_rect":[-413.6946902408528,-175.04711857864012,413.6946902408528,175.04711857864012],"a":[600,-175.04711857864012],"b":[600,175.04711857864012]}}}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]},"jr":{"strength":0.1,"color":"0033A0"},"jb":{"strength":0.1,"color":"CE2B37"}},"joints":[{"d0":1,"d1":2,"length":null,"trait":"jr"},{"d0":2,"d1":3,"length":null,"trait":"jr"},{"d0":3,"d1":4,"length":null,"trait":"jr"},{"d0":4,"d1":5,"length":null,"trait":"jr"},{"d0":5,"d1":6,"length":null,"trait":"jr"},{"d0":6,"d1":7,"length":null,"trait":"jr"},{"d0":7,"d1":8,"length":null,"trait":"jr"},{"d0":8,"d1":9,"length":null,"trait":"jr"},{"d0":9,"d1":10,"length":null,"trait":"jr"},{"d0":10,"d1":11,"length":null,"trait":"jr"},{"d0":11,"d1":12,"length":null,"trait":"jr"},{"d0":12,"d1":13,"length":null,"trait":"jr"},{"d0":13,"d1":14,"length":null,"trait":"jr"},{"d0":14,"d1":15,"length":null,"trait":"jr"},{"d0":15,"d1":16,"length":null,"trait":"jr"},{"d0":16,"d1":17,"length":null,"trait":"jr"},{"d0":17,"d1":18,"length":null,"trait":"jr"},{"d0":18,"d1":19,"length":null,"trait":"jr"},{"d0":19,"d1":20,"length":null,"trait":"jr"},{"d0":20,"d1":21,"length":null,"trait":"jr"},{"d0":21,"d1":22,"length":null,"trait":"jr"},{"d0":22,"d1":23,"length":null,"trait":"jr"},{"d0":25,"d1":26,"trait":"jb"},{"d0":26,"d1":27,"trait":"jb"},{"d0":27,"d1":28,"trait":"jb","invMass":1},{"d0":28,"d1":29,"trait":"jb","invMass":1},{"d0":29,"d1":30,"trait":"jb","invMass":1},{"d0":30,"d1":31,"trait":"jb","invMass":1},{"d0":31,"d1":32,"trait":"jb","invMass":1},{"d0":32,"d1":33,"trait":"jb","invMass":1},{"d0":33,"d1":34,"trait":"jb","invMass":1},{"d0":34,"d1":35,"trait":"jb","invMass":1},{"d0":35,"d1":36,"trait":"jb","invMass":1},{"d0":36,"d1":37,"trait":"jb","invMass":1},{"d0":37,"d1":38,"trait":"jb","invMass":1},{"d0":38,"d1":39,"trait":"jb"},{"d0":39,"d1":40,"trait":"jb"},{"d0":40,"d1":41,"trait":"jb"},{"d0":41,"d1":42,"trait":"jb"},{"d0":42,"d1":43,"trait":"jb"},{"d0":43,"d1":44,"trait":"jb"}],"playerPhysics":{"acceleration":0.11,"kickingAcceleration":0.1,"kickStrength":7,"radius":15,"bCoef":0.5,"invMass":0.5,"damping":0.96,"cGroup":["red","blue"],"gravity":[0,0],"kickingDamping":0.96,"kickback":0},"kickOffReset":"full","canBeStored":false,"ballPhysics":{"color":"CCCCCC","radius":10,"bCoef":0.5,"cMask":["all"],"damping":0.99,"invMass":1,"gravity":[0,0],"cGroup":["ball"]},"cameraWidth":0,"cameraHeight":0,"maxViewWidth":0,"cameraFollow":"ball","redSpawnPoints":[[-190,0],[-190,100],[-190,-100],[-384,0]],"blueSpawnPoints":[[190,0],[190,100],[190,-100],[384,0]]}';/*await stadiDB.findOne({type: "3v3", active: true});*/
	/* ------------------ */

	let currentStadium = '';

	/* ANNOUNCEMENT */
	async function messageUpdate() {
		let msgUpdate = await stringDB.findOne({name: "msgUpdate"});
		if(!msgUpdate) return "";

		return msgUpdate.text;
	}

	async function monitorPlayers() { // Make the function async
		let PlaAnn = await stringDB.findOne({name: "PlaAnn"});
		let GueAnn = await stringDB.findOne({name: "GueAnn"});
		
		const playerList = room.getPlayerList();
		for (let i = playerList.length - 1; i >= 0; i--) {
			const thisPlayer = await playersDB.findOne({ nickname: playerList[i].name });
			if (!thisPlayer) {
		    	room.sendAnnouncement(GueAnn.text, playerList[i].id, announcementColor, "bold", HaxNotification.CHAT);
		    } else {
		    	room.sendAnnouncement(PlaAnn.text, playerList[i].id, announcementColor, "bold", HaxNotification.CHAT);
		    }
		}
	}

	/* ------------------------------ */

	/* OPTIONS */
	let drawTimeLimit = Infinity;
	let teamSize = 3;

	let disableBans = false;

	let afkLimit = debugMode ? Infinity : 15;
	let defaultSlowMode = 2;
	let chooseModeSlowMode = 2.5;
	let slowMode = defaultSlowMode;
	let notVerifiedSlowMode = 2.5;
	let SMSet = new Set();

	let mentionPlayersUnpause = true;
	/* ---------------------------------- */

	/* OBJECTS */
	class Goal {
		constructor(time, team, striker, assist) {
			this.time = time;
			this.team = team;
			this.striker = striker;
			this.assist = assist;
		}
	}

	class Game {
		constructor() {
			this.date = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }))
			this.scores = room.getScores();
			this.playerComp = getStartingLineups();
			this.goals = [];
			this.rec = room.startRecording();
			this.touchArray = [];
		}
	}

	class PlayerComposition {
		constructor(player, auth, timeEntry, timeExit) {
			this.player = player;
			this.auth = auth;
			this.timeEntry = timeEntry;
			this.timeExit = timeExit;
			this.inactivityTicks = 0;
			this.GKTicks = 0;
		}
	}

	class MutePlayer {
		constructor(name, id, auth) {
			this.id = MutePlayer.incrementId();
			this.name = name;
			this.playerId = id;
			this.auth = auth;
			this.unmuteTimeout = null;
			this.timeoutEnd = -1;
		}

		static incrementId() {
			if (!this.latestId) this.latestId = 1
			else this.latestId++
			return this.latestId
		}

		setDuration(minutes) {
			this.unmuteTimeout = setTimeout(() => {
				room.sendAnnouncement(
					`✔️ Sei stato smutato.`,
					this.playerId,
					announcementColor,
					"bold",
					HaxNotification.CHAT
				);
				this.remove();
			}, minutes * 60 * 1000);
			muteArray.add(this);
			this.timeoutEnd = Date.now() + (minutes * 60 * 1000)
		}

		getRemainingTime() {
			if (this.timeoutEnd != -1) return parseInt((this.timeoutEnd - Date.now()) / 1000)
			else return 0
		}

		remove() {
			this.unmuteTimeout = null;
			this.timeoutEnd = -1
			muteArray.removeById(this.id);
		}
	}

	class MuteList {
		constructor() {
			this.list = [];
		}

		add(mutePlayer) {
			this.list.push(mutePlayer);
			return mutePlayer;
		}

		getById(id) {
			let index = this.list.findIndex(mutePlayer => mutePlayer.id === id);
			if (index !== -1) {
				return this.list[index];
			}
			return null;
		}

		getByPlayerId(id) {
			let index = this.list.findIndex(mutePlayer => mutePlayer.playerId === id);
			if (index !== -1) {
				return this.list[index];
			}
			return null;
		}

		getByAuth(auth) {
			let index = this.list.findIndex(mutePlayer => mutePlayer.auth === auth);
			if (index !== -1) {
				return this.list[index];
			}
			return null;
		}

		removeById(id) {
			let index = this.list.findIndex(mutePlayer => mutePlayer.id === id);
			if (index !== -1) {
				this.list.splice(index, 1);
			}
		}

		removeByAuth(auth) {
			let index = this.list.findIndex(mutePlayer => mutePlayer.auth === auth);
			if (index !== -1) {
				this.list.splice(index, 1);
			}
		}
	}

	class BallTouch {
		constructor(player, time, goal, position) {
			this.player = player;
			this.time = time;
			this.goal = goal;
			this.position = position;
		}
	}

	class HaxStatistics {
		constructor(playerName = '') {
			this.playerName = playerName;
			this.games = 0;
			this.wins = 0;
			this.winrate = '0.00%';
			this.playtime = 0;
			this.goals = 0;
			this.assists = 0;
			this.CS = 0;
			this.ownGoals = 0;
		}
	}
	/* -------------------------------- */

	/* PLAYERS INFO */
	const Team = { SPECTATORS: 0, RED: 1, BLUE: 2 };
	const State = { PLAY: 0, PAUSE: 1, STOP: 2 };

	const Role = { GUEST: 0, PLAYER: 1, PARTNER: 2, VIP: 3, EVENT: 3.1, HELPER: 4, MODERATOR: 5, ADMIN: 6, FOUNDER: 7, DEVELOPER: 8, OWNER: 9 };
	const RoleEmoji = { GUEST: "🔒", PLAYER: "👤", EVENT: "🟨", VIP: "💎", HELPER: "⛑️", MODERATOR: "🪖", ADMIN: "🎩", FOUNDER: "🔒", DEVELOPER: "👨‍💻" ,OWNER: "🔑"};

	const Skins = {HALF: 1, MIL_INT: 2, XMAS: 3, ROM_LAZ: 4, POKER: 5, LALIGA: 6, BUNDESLIGA: 7, CRO_ITA: 8, BRA_ARG: 9, ENG_NED: 10, FOIL: 11}
	let AvatarRed = null;
	let AvatarBlue = null;

	const HaxNotification = { NONE: 0, CHAT: 1, MENTION: 2 };
	const Situation = { STOP: 0, KICKOFF: 1, PLAY: 2, GOAL: 3 };

	let gameState = State.STOP;
	let playSituation = Situation.STOP;
	let goldenGoal = false;

	let playersAll = [];
	let players = [];
	let teamRed = [];
	let teamBlue = [];
	let teamSpec = [];

	let teamRedStats = [];
	let teamBlueStats = [];

	let rageQuitCheck = false
	let playerLeft = undefined
	/* --------------------------- */

	/* SKIN */
	function skinsCommand(player, message) {
    	let testo = "";
    	Object.entries(Skins).forEach(([key, value]) => {
		    testo += `\n[${value}] skin -> ${key}`;
		});

		room.sendAnnouncement(
			"LISTA SKIN:" + testo,
			player.id,
			loginColor,
			'bold',
			HaxNotification.CHAT
		);
	}

	function setSkinCommand(player, message) {
		let msgArray = message.split(/ +/).slice(1);
		if (msgArray.length > 0) {
			let team = msgArray[0];
			let skin = msgArray[1];
			if (skin == Skins.HALF) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 44, 0xFFFFFF, [0x455E5D, 0xFF6969]); // HALF a
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 316, 0xFFFFFF, [0x29A7B6, 0x455E5D]); // HALF b	
				}
			}
			else if (skin == Skins.MIL_INT) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 0, 0xFFFFFF, [0xFB090B, 0x000000, 0xFB090B]) // Milan
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 0, 0xECDF1D, [0x010E80, 0x000000, 0x010E80]) // Inter
				}
			}
			else if (skin == Skins.XMAS) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 302, 0xFFFFFF, [0xFFFFFF, 0xFFB6B6, 0xFF0000]) // red xmas
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 123, 0xFFFFFF, [0xFFFFFF, 0xB1D5FF, 0x01B2FF]) // blue xmas
				}
			}
			else if (skin == Skins.ROM_LAZ) {
				if (team == Team.RED) {
					AvatarRed = "🐺";
					room.setTeamColors(1, 0, 0x000000, [0xF0BC42, 0x8E1F2F]) // Roma
				} else if (team == Team.BLUE) {
					AvatarBlue = "🦅";
					room.setTeamColors(2, 0, 0x15366F, [0xFFFFFF, 0x87D8F7]) // Lazio
				}
			}
			else if (skin == Skins.POKER) {
				if (team == Team.RED) {
					AvatarRed = "♦️";
					room.setTeamColors(1, 0, 0xFFFFFF, [0xFF0000]) // quadri
				} else if (team == Team.BLUE) {
					AvatarBlue = "♠️";
					room.setTeamColors(2, 0, 0xFFFFFF, [0x000000])  // picche
				}
			}
			else if (skin == Skins.LALIGA) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 0, 0xFFED02, [0xA50044, 0x004D98, 0xA50044]) // Barca
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 35, 0xB9A229, [0xFFFFFF, 0xFFFFFF, 0xFFFFFF])  // Real Madrid
				}
			}
			else if (skin == Skins.BUNDESLIGA) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 0, 0xFFFFFF, [0xAB0000]) // Bayern Monaco
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 45, 0xFFFFFF, [0xFDE100, 0x000000])  // Borussia Dortmund
				}
			}
			else if (skin == Skins.CRO_ITA) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 0, 0xED1C24, [0xFFFFFF]) // Croazia
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 0, 0x000000, [0x008C45, 0xF4F9FF, 0xCD212A])  // Italia
				}
			}
			else if (skin == Skins.BRA_ARG) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 0, 0x009739, [0xFEDD00]) // Brasile
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 90, 0xFFEB2D, [0x94D6D4, 0xFFFFFF, 0x94D6D4])  // Argentina
				}
			}
			else if (skin == Skins.ENG_NED) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 180, 0x121212, [0xFFFFFF, 0xFF1818, 0xFFFFFF]) // Inghilterra
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 90, 0x000000, [0x920000, 0xFFFFFF, 0x0A2092])  // Olanda
				}
			}
			else if (skin == Skins.FOIL) {
				if (team == Team.RED) {
					AvatarRed = "⚜️";
					room.setTeamColors(1, 28, 0xFFFFFF, [0xBDBDBD, 0xE1E1E1, 0xFFFFFF]) // White
				} else if (team == Team.BLUE) {
					AvatarBlue = "⚜️";
					room.setTeamColors(2, 28, 0xFFFFFF, [0x2C2C2C, 0x4E4E4E, 0x8C8C8C])  // Black
				}
			}
			else {
				/*if (skin == Skins.QUALCOSA) {*/
				if (team == Team.RED) {

				} else if (team == Team.BLUE) {

				}
				/*}*/
			}
			room.getPlayerList().forEach(p => { if (p.team == team) room.setPlayerAvatar(p.id, team == Team.RED ? AvatarRed : AvatarBlue) })
		}else {
			room.sendAnnouncement(
			`Numero errato di argomenti. Inserisci "!help skin" per ulteriori informazioni.`,
			player.id,
			errorColor,
			'bold',
			HaxNotification.CHAT
			);
		}
	}
	/* ------------------ */

	/* STATS */
	let possession = [0, 0];
	let actionZoneHalf = [0, 0];
	let lastWinner = Team.SPECTATORS;
	let streak = 0;
	let lastStreakGame = undefined;
	let startStreak = "";
	let endStreak = undefined;
	let infoStreak = [];
	let teamStreak = [];
	let lastTeam = [];
	/* -------------------------------- */


	const loadFromDB = async (firstRun, joinCall) => {
		const filter = {};
		const sort = {
		  'role': 1
		};
		allAdmins = await adminsDB.find(filter, { sort }).toArray();

		if (firstRun) setInterval(monitorPlayers, 400 * 1000);
		if (!joinCall) writeLog("", "Ruoli in Array Caricati.", true);

		const pipeline = [
		  {
		    // Filtra gli oggetti con almeno un'infrazione
		    $match: { "numberInfractions": { $gt: 0 } }
		  },
		  {
		    // Calcola la somma di tutte le infrazioni per ogni giocatore
		    $group: {
		      _id: "$nickname",
		      totalInfractions: { $sum: "$numberInfractions" }
		    }
		  },
		  {
		    // Proietta solo i campi _id e totalInfractions
		    $project: {
		      _id: 1,
		      totalInfractions: 1
		    }
		  }
		];

		let cursor = penaltiesDB.aggregate(pipeline);
		let results = await cursor.toArray();

		// "results" conterrà un array di oggetti con nickname e totalInfractions
	    let totalInfractionsAll = 0;
	    for (let result of results) {
	      totalInfractionsAll += result.totalInfractions;
	    }
	    infractionCount = totalInfractionsAll;
		if (!joinCall) writeLog("", "Fedina penale caricata.", true);

		if (firstRun) {
			await playersDB.updateMany({ isLogged: { $ne: false } }, { $set: { isLogged: false } })
		}
		if (!joinCall) writeLog("", "Player sloggati correttamente.", true);

		/*nicknameBlacklist = await nicknameBLDB.find({}).project({ _id: 0 }).toArray()
		if (!joinCall) console.log("Blacklist nickname caricata.")*/

		/*ranking = await rankingDB.find({}).project({ _id: 0 }).toArray()
		if (!joinCall) console.log("Ranking caricato.")*/

		/*customization = await customizationDB.find({}).project({ _id: 0 }).toArray()
		if (!joinCall) console.log("Customizzazione caricata.")*/

		/*subscriber = await subscriberDB.find({}).project({ _id: 0 }).toArray()
		if (!joinCall) console.log("Sub caricate.")*/

		if (!joinCall) {
			/*if (!firstRun) {
				tempBlacklist = await tempBansDB.find({}).project({ _id: 0 }).toArray()
				console.log("Tempbans caricati.")
			}
			else if (!debugMode) tempBansDB.deleteMany({})
			if (debugMode) tempBlacklist = []*/

			/*rankList = await ranksDB.find({}).project({ _id: 0 }).toArray()
			console.log("Lista ranks caricata.")*/
		}
		writeLog("", "--- Load From DB: Caricato con successo!", true)
	}
	await loadFromDB(true, false).catch(err => writeLog("", "Errore LoadFromDB: " + err, true))
	/* ----------------------------------------------------------------------------------- */

	/* GAME */
	let lastTouches = Array(2).fill(null);
	let lastTeamTouched;

	let speedCoefficient = 100 / (5 * (0.99 ** 60 + 1));
	let ballSpeed = 0;
	let playerRadius = 15;
	let ballRadius = 10;
	let triggerDistance = playerRadius + ballRadius + 0.01;

	let ballTouched = false
	let ballTouchTimer = undefined
	let lastPlayerKick = undefined
	let playersRocket = []
	let rocketTeamGoal = []
	/* ------------------------------------------------------- */


	/* COLORS */
	let welcomeColor = 0xc4ff65;
	let announcementColor = 0xffefd6;
	let loginColor = 0x0067e2;
	let infoColor = 0xbebebe;
	let privateMessageColor = 0xffc933;
	let redColor = 0xff4c4c;
	let blueColor = 0x62cbff;
	let warningColor = 0xffa135;
	let errorColor = 0xb80f0f;
	let successColor = 0x75ff75;

	let developerColor = 0x0067e2;
	let founderColor = 0xff3c1e;
	let adminColor = 0x9543a5;
	let moderatorColor = 0x158218;
	let helperColor = 0xff9123;
	let vipColor = 0x00aaff;
	let partnerColor = 0xfff29e;
	let playerColor = 0xfffafa;
	let guestColor = 0xb6b6b6;
	let ownerColor = 333333;
	let defaultColor = null;
	/* -------------------------- */

	/* AUXILIARY */
	let checkTimeVariable = false;
	let checkStadiumVariable = true;
	let endGameVariable = false;
	let cancelGameVariable = false;
	let kickFetchVariable = false;

	let chooseMode = false;
	let timeOutCap;
	let capLeft = false;
	let redCaptainChoice = '';
	let blueCaptainChoice = '';
	let chooseTime = 20;

	let AFKSet = new Set();
	let AFKMinSet = new Map();
	let AFKCooldownSet = new Set();
	let AFKTimers = new Map();
	let AFKAvvertimentoTimers = new Map();
	let minAFKDuration = 3;
	let maxAFKDuration = 30;
	let AFKCooldown = 0;

	let muteArray = new MuteList();
	let muteDuration = 5;

	let removingPlayers = false;
	let insertingPlayers = false;

	let stopTimeout;
	let startTimeout;
	let unpauseTimeout;
	let removingTimeout;
	let insertingTimeout;

	let emptyPlayer = {
		id: 0,
	};
	stadiumCommand(emptyPlayer, "!training");

	let game = new Game();
	/* -------------------------------------- */

	/* CHECK COMMAND */

	async function checkWarn(playerWarn, typeWarn) {
		let warned = await penaltiesDB.findOne({ nickname: playerWarn.name });
		if(warned == null || warned == undefined) return 1;
		let livello = parseInt(warned.levelWarn);
		if (typeWarn == "WARN" && livello < 10) livello += 1;
		else if (typeWarn == "UNWARN" && livello > 0) livello -= 1;
		await penaltiesDB.updateOne({ nickname: playerWarn.name }, { $set: { levelWarn: livello } })
		return livello;
	}

	async function createPenalties(player) {
		const newPenalties = {
			nickname: player.name,
			levelWarn: 0,
			numberInfractions: 0,
			infractions: [],
			removedInfractions: []
		}
		await penaltiesDB.insertOne(newPenalties)
		return newPenalties
	}

	/* COMMANDS */
	let commands = {
		help: {
			aliases: ['commands'],
			roles: Role.GUEST,
			desc: `Questo comando mostra tutti i comandi disponibili. Può anche mostrare la descrizione di un comando in particolare.
				Esempio: \'!help bb\' per mostrare la descrizione del comando \'bb\'.`,
			function: helpCommand,
		},
		rules: {
			aliases: ['regole'],
			roles: Role.GUEST,
			desc: `Questo comando ti mostra il regolamento di HaxZone.`,
			function: ruleCommand,
		},
		social: {
			aliases: ['discord', 'ds', 'telegram', 'tg', 'socials'],
			roles: Role.GUEST,
			desc: `Questo comando ti mostrerà il link per entrare nei nostri Social: server Discord e comunity Telegram!`,
			function: socialCommand,
		},
		event: {
			aliases: ['evento'],
			roles: Role.GUEST,
			desc: `Questo comando ti dirà se e quale evento è attivo attualmente!`,
			function: eventCommand,
		},
		register: {
			aliases: ['reg'],
			roles: Role.GUEST,
			desc: `Questo comando ti permette di registrarti se non hai ancora un account.
				Comando: !reg password.
				Esempio: !reg Ciao123    ti registrerà con la password Ciao123`,
			function: registerCommand,
		},
		login: {
			aliases: ['l'],
			roles: Role.GUEST,
			desc: `Questo comando ti permette di accedere al tuo account se ne hai già uno.
				Comando: !l password.
				Esempio: !l Ciao123    ti farà accedere inserendo la password Ciao123`,
			function: loginCommand,
		},
		changenickrequest: {
			aliases: ['changenickrequest', 'cnr', 'changenick', 'crn'],
			roles: Role.PLAYER,
			desc: `Questo comando ti permette di cambiare nickname.
				ESEMPIO: !changenick o !chn "nickname attuale" "nickname nuovo" motivazione `,
			function: changenickCommand,
		},
		resetpassword: {
			aliases: ["rpw"],
			roles: Role.FOUNDER,
			desc: `Questo comando ti permette di resettare la password dopo che hai effettuato l'accesso.
				Esempio: !rpw password 			dove "password" sarà la nuova password che vuoi inserire.`,
			function: resetPasswordCommand,
		},
		streak: {
			aliases: ['st'],
			roles: Role.PLAYER,
			desc: `Questo comando ti informa sull'attuale streak.`,
			function: streakCommand,
		},
		topstreak: {
			aliases: ["ts"],
			roles: Role.PLAYER,
			desc: `Questo comando ti mostra le TOP STREAK.`,
			function: topStreakCommand,
		},
		stats: {
			aliases: [],
			roles: Role.PLAYER,
			desc: `Questo comando ti permette di visualizzare le tue statistiche, oppure le statistiche di un altro player.
					Richiede 1 argomento opzionale, SE mancante potrai visualizzare le TUE statistiche:
					Argomento 1(Opzionale): #ID or "NickName"		Da inserire se si vuole sapere le statistiche di un altro player.
					Esempio: !stats 			stampa in chat le TUE statistiche.
					Esempio: !stats #123 		stampa in chat le statistiche del player con ID 123.
					Esempio: !stats "Paladino"	stampa in chat le statistiche del player Paladino.`,
			function: statsCommand,
		},
		leaderboard: {
			aliases: ['lb'],
			roles: Role.PLAYER,
			desc: `Questo comando mostra i 5 giocatori migliori nelle varie categorie.
			Richiede 1 argomento:
    		Argomento 1: <category> 	dove <category> è la categoria specifica che vuoi visualizzare tra: games, wins, winrate, goals, owngoals, assists, cs, hattrick e playtime.
   		 	Esempio: !lb winrate 		mostra i migliori 5 nella categoria "winrate".`,
			function: leaderboardCommand,
		},
		leaderboardmonthly: {
			aliases: ['lbmonthly', 'lbm'],
			roles: Role.PLAYER,
			desc: `Questo comando mostra i 5 giocatori migliori del MESE nelle varie categorie.
			Richiede 1 argomento:
    		Argomento 1: <category>		dove <category> è la categoria specifica che vuoi visualizzare tra: games, wins, winrate, goals, owngoals, assists, cs, hattrick e playtime.
   		 	Esempio: !lbm winrate 		mostra i migliori 5 del MESE nella categoria "winrate".`,
			function: leaderboardCommand,
		},
		warns: {
			aliases: [],
			roles: Role.PLAYER,
			desc: `Questo comando mostrerà il tuo storico sulle ultime 5 infrazioni subite e rimosse.
			Richiede un argomento opzionale:
    		Argomento 1(opzionale): #ID or "NickName" 		per scegliere il giocatore di cui vuoi sapere le informazioni {only Staff}.
   		 	Esempio: !warns 					mostrerà il tuo storico delle ultime 5 infrazioni". 
			 		 !warns #5 					mostrerà le infrazioni dell'ID player 5
			 		 !warns "Paladino" 			mostrerà le infrazioni del player Paladino`,
			function: warnListCommand,
		},
		afk: {
			aliases: [],
			roles: Role.PLAYER,
			desc: `Questo comando vi fa andare in AFK.
				Quando attivato: l'AFK durerà  minimo ${minAFKDuration}min e massimo ${maxAFKDuration}min.`,
			function: afkCommand,
		},
		afks: {
			aliases: ['afklist'],
			roles: Role.PLAYER,
			desc: `Questo comando mostra la lista dei giocatori che sono AFK.`,
			function: afkListCommand,
		},
		bb: {
			aliases: ['bye', 'gn', 'cya'],
			roles: Role.PLAYER,
			desc: `Questo comando ti fa uscire dalla room.`,
			function: leaveCommand,
		},
		staff: {
			aliases: ['adminlist', 'admins'],
			roles: Role.PLAYER,
			desc: `Questo comando mostra tutti i giocatori che sono admin.`,
			function: staffListCommand,
		},
		rr: {
			aliases: [],
			roles: Role.HELPER,
			desc: `Questo comando riavvia la partita.`,
			function: restartCommand,
		},
		rrs: {
			aliases: [],
			roles: Role.HELPER,
			desc: `Questo comando scambia le squadre e fa ripartire la partita.`,
			function: restartSwapCommand,
		},
		swap: {
			aliases: [],
			roles: Role.HELPER,
			desc: `Questo comando scambierà le squadre ma solo a partita ferma.`,
			function: swapCommand,
		},
		stadi: {
			aliases: ['stadiums'],
			roles: Role.HELPER,
			desc: `Questo comando ti elencherà la lista degli stadi disponibili.`,
			function: stadiCommand,
		},
		stadio: {
			aliases: ['stadium', 'training', 'orange2v2' ,'b&w3v3'],
			roles: Role.HELPER,
			desc: `Questo comando inserirà lo stadio da te scritto.
				ESEMPIO: !orange2v2 o !b&w3v3     inserirà lo stadio scelto.`,
			function: stadiumCommand,
		},
		skins: {
			aliases: ['listaskin'],
			roles: Role.HELPER,
			desc: `Questo comando ti elencherà la lista delle skin disponibili.`,
			function: skinsCommand,
		},
		skin: {
			aliases: ['setskin'],
			roles: Role.HELPER,
			desc: `Questo comando inserirà la skin da te scritto.
				Richiede 2 argomenti:
				Argomento 1: <team> dove <team> è il numero della squadra, con <1> Red Team con <2> Blue Team.
				Argomento 2: <skin> dove inserire il numero della skin, dalla lista delle skin.
				ESEMPIO: !skin 1 5 		dove <1> sta per RED TEAM e <5> sta per la 5° skin dalla lista delle skin.`,
			function: setSkinCommand,
		},
		kick: {
			aliases: ['kc', 'kicks'],
			roles: Role.HELPER,
			desc: `Questo comando consente di Kickare un giocatore dalla room.
				Richiede 2 argomenti:
				Argomento 1: #<id> dove <id> è l'identificativo del giocatore.
				Argomento 2(opzionale): <motivo> dove è possibile scrivere il motivo del kick.
				ESEMPIO: !kick #301 Per bullismo    Kickerà il giocatore con id 301 dalla room.`,
			function: kickCommand,
		},
		warn: {
			aliases: [],
			roles: Role.HELPER,
			desc: `Questo comando permette di avvertire un giocatore. Il giocatore potrà essere mutato.
    		Richiede 2 argomenti:
    		Argomento 1: #<id> dove <id> è l'id del giocatore che si vuole avvertire.
			Argomento 2: <arg> dove <arg> è il motivo del warn
    		Esempio: !warn #3 Si fa autogoal       avverte il giocatore con l'id 3 perchè "Si fa autogoal".`,
			function: warnCommand,
		},
		unwarn: {
			aliases: [],
			roles: Role.HELPER,
			desc: `Questo comando permette di abbassare il livello di un warn ad un giocatore.
    		Richiede 1 argomento:
    		Argomento 1: <id>       dove <id> è l'id del giocatore a cui vuoi abbasserà il warn. Per vedere le infrazioni usare !help warns.
    		Argomento 2: <arg>    	dove <arg> è il motivo dell'unwarn.
    		Esempio: !unwarn #300 Perchè è bravo		abbasserà di un livello i warn del giocatore con id 300 perché è bravo.
             		 !unwarn #300 Ha chiesto scusa 		abbasserà il warn all'utente perchè ha chiesto scusa.`,
			function: unwarnCommand,
		},
		mutelist: {
			aliases: [],
			roles: Role.HELPER,
			desc: `Questo comando ti elencherà la lista dei player mutati.`,
			function: muteListCommand,
		},
		readmutes: {
			aliases: ['rm'],
			roles: Role.HELPER,
			desc: `Questo comando ti permette di attivare o disattivare la lettura dei messaggi dei player mutati.`,
			function: readMutesCommand,
		},
		bans: {
			aliases: ['banlist'],
			roles: Role.MODERATOR,
			desc: `Questo comando mostra la lista dei giocatori che sono stati bannati e i loro ID.`,
			function: banListCommand,
		},
		ban: {
			aliases: [],
			roles: Role.MODERATOR,
			desc: `Questo comando Banna un player dalla room.
				Richiede 2 argomenti:
				Argomento 1: #<id>, dove <id> è l'id del giocatore che si vuole bannare.
				Argomento 2: MOTIVO, deve essere scritto dopo l'id il motivo del BAN.
				Esempio: !ban #301 Perché spammava troppo     bannerá il giocatore con id 301 perchè "Perché spammava troppo".`,
			function: banCommand,
		},
		unban: {
			aliases: [],
			roles: Role.MODERATOR,
			desc: `Questo comando Rimuoverà il Ban ad un player.
				Richiede 1 argomento:
				Argomento 1: #<id>, dove <id> è l'id del giocatore a cui si vuole Rimuovere il Ban.
				Esempio: !unban #301    Rimuoverà il Ban al giocatore con id 301.`,
			function: unBanCommand,
		},
		setrole: {
			aliases: ['sr'],
			roles: Role.OWNER,
			desc: `Questo comando consente di modificare il Ruolo ad un player.
				Richiede 3 argomenti:
				Argomento 1: nickname del player tra ""
				Argomento 2: nuovo ruolo del player tra ""
				Argomento 3: motivazione
				Esempio: !setrole "Ben" "5" si è comportato male `,
			function: setRoleCommand,
		},
		password: {
			aliases: ['pw'],
			roles: Role.ADMIN,
			desc: `Questo comando consente di aggiungere una password per entrare in room.
				Richiede 1 argomento:
				Argomento 1: password che sarà la nuova password per entrare in room.
				ESEMIO: !password Ciao123    imposterà la password 'Ciao123' per entrare in room.
		
				Per rimuovere la password alla room, è sufficiente scrivere '!password'.`,
			function: passwordCommand,
		},
		listrequestnick: {
			aliases: ['lrn'],
			roles: Role.ADMIN,
			desc: `Questo comando consente di vedere le richieste di cambio nick.
				Ti mostrerà tutti i cambi nick.
				Potrai selezionare l'utente da accettare o rifiutare digitando !select con il numero dell'utente`,
			function: listrequestnickCommand,
		},
		select: {
			aliases: ['select'],
			roles: Role.ADMIN,
			desc: `Questo comando ti consente di selezionare l'utente che ha richiesto un cambio nome.
				Dovrai fare !select numero della richiesta Accetta o rifiuta` ,
			function: selectchangeCommand,
		},
		clearbans: {
			aliases: ['clearban'],
			roles: Role.OWNER,
			desc: `Questo comando annulla il ban a tutti i giocatori.
				ESEMPIO: !clearbans   eliminarà il ban a tutti i giocatori`,
			function: clearBansCommand,
		},
	};
	/* ----------------------------------------------------------------------------------- */


	/* FUNCTIONS */

	/* AUXILIARY FUNCTIONS */
	async function postStreak(reason, streak) {
	    let daPostare = false;
	    let streaksFromDB = await topStreakDB.find({}).toArray();
	    writeLog('', 'Retrieved streaks from database', true);

	    if (streaksFromDB.length < 5) {
	        daPostare = true;
	        writeLog('', 'Less than 5 streaks in the database, setting daPostare to true', true);
	    } else {
	        const filter = {};
	        const projection = {
	          'streak': 1
	        };
	        const sort = {
	          'streak': 1,
	          'timestamp': -1
	        };
	        const limit = 1;
	        const cursor = topStreakDB.find(filter, { projection, sort, limit });
	        const result = await cursor.toArray();
	        writeLog('', 'Lowest streak in the database retrieved', true);

	        if (streak > result[0].streak) {
	            await topStreakDB.deleteOne({_id: result[0]._id});
	            daPostare = true;
	            writeLog('', `A streak lower than current streak (${streak}) found and deleted, setting daPostare to true`, true);
	        }
	    }

	    if (daPostare) {
	        let cstm = `**Streak di:** ${streak} Vittorie\n**Streak iniziata da:** `
	        let count = 0;
	        infoStreak.forEach(a => {
	            if (a.IsTeamStreak) {
	                count++;
	                if (count < 3) cstm += `${a.nickname}, `
	                else {
	                    cstm = cstm.substring(0, cstm.length - 2);
	                    cstm += ` e ${a.nickname}\n`;
	                }
	            }
	        });
	        const minutes = ((endStreak - startStreak) / 1000) / 60;
	        const hours = parseInt(minutes / 60);
	        const minutesRemaining = parseInt(minutes % 60);
	        cstm += `**Motivo dell'interruzione:** ${reason}\n\n**__Classifica Player__:**\n` + "```c\n";

	        const boardOrdered = infoStreak.sort((a, b) => b.count - a.count);
	        boardOrdered.forEach(a => cstm += `${a.nickname}: ${a.count}${a.IsTeamStreak == false ? " {Subentrato}" : ""}\n`);
	        cstm = cstm.substring(0, cstm.length - 1) + "\n```";
	        writeLog('', 'Custom message for posting constructed', true);

	        if (matchWebhook != '') {
	            let objectBodyWebhook = {
	                embeds: [
	                    {
	                        title: `💣 NUOVA STREAK DA RECORD 🤩`,
	                        description: cstm,
	                        color: 16736315,
	                        footer: {
	                            text: `Inizio: ${yearLong(startStreak)} • Durata: ${hours == 1 ? "un'ora" : hours == 0 ? "" : hours + " ore"}${hours == 0 || minutesRemaining == 0 ? "" : " e "}${minutesRemaining == 1 ? "un minuto" : minutesRemaining == 0 ? "" : minutesRemaining + " minuti"} • Fine: ${yearLong(endStreak)}`,
	                        },
	                    },
	                ],
	                username: "Record new Streak"
	            };
	            fetch(matchWebhook, {
	                method: 'POST',
	                body: JSON.stringify(objectBodyWebhook),
	                headers: {
	                    'Content-Type': 'application/json',
	                },
	            }).then((res) => res);
	            writeLog('', 'Webhook sent successfully', true);
	        }

	        const streakPlayers = `${boardOrdered[0].nickname} [${boardOrdered[0].count}] ${boardOrdered[0].IsTeamStreak ? "TO" : ""}, ${boardOrdered[1].nickname} [${boardOrdered[1].count}] ${boardOrdered[1].IsTeamStreak ? "TO" : ""} e ${boardOrdered[2].nickname} [${boardOrdered[2].count}] ${boardOrdered[2].IsTeamStreak ? "TO" : ""}`;
	        const newStreak = { streak: streak, players: streakPlayers, timestamp: Date.now() };
	        await topStreakDB.insertOne(newStreak);
	        writeLog('', 'New streak inserted into the database', true);

	        let msg = "🤩 La streak è appena entrata a far parte delle \"TOP 5 STREAK\"! 💣\nUsa il comando !topstreak per vedere la classifica completa";
	        room.sendAnnouncement(msg, null, announcementColor, 'bold', HaxNotification.CHAT);
	    }
	}


	if (typeof String.prototype.replaceAll != 'function') {
		String.prototype.replaceAll = function (search, replacement) {
			let target = this;
			return target.split(search).join(replacement);
		};
	}

	function yearLong(date) {
		const dateStrings = new Intl.DateTimeFormat('it-IT', { dateStyle: "short", timeStyle: "short" }).format(date).replace(", ", " alle ore ").split('/')
		const longYearString = dateStrings[0] + "/" + dateStrings[1] + "/20" + dateStrings[2]
		return longYearString
	}

	function getDate() {
		let d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));
		return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
	}

	async function hexToString(hex) {
		let str = "";
		for (let i = 0; i < hex.length; i += 2) str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
		return str
	}

	function stringToHex(str) {
	  let hex = "";
	  for (let i = 0; i < str.length; i++) hex += str.charCodeAt(i).toString(16)
	  return hex;
	}
	/* -------------------------------------------------------------- */


	/* MATH FUNCTIONS */
	function getRandomInt(max) {
		// returns a random number between 0 and max-1
		return Math.floor(Math.random() * Math.floor(max));
	}

	function pointDistance(p1, p2) {
		return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
	}

	function convertToUnicodeFormat(str) {
		let newStr = ""
		for (let i = 0; i < str.length; i++) {
			let char = str[i]
			if (char === ' ') {
				newStr += ' '
			}
			else if (/^[a-zA-Z0-9]*$/.test(char)) {
				if (isNaN(Number(char))) {
					if (char === char.toLowerCase()) {
						let unicode = char.charCodeAt(0) + 120205  // Caratteri minuscoli
						newStr += String.fromCodePoint(unicode)
					} else {
						let unicode = char.charCodeAt(0) + 120211  // Caratteri maiuscoli
						newStr += String.fromCodePoint(unicode)
					}
				} else {
					let unicode = char.charCodeAt(0) + 120734  // Numeri
					newStr += String.fromCodePoint(unicode)
				}
			}
			else newStr += char
		}
		return newStr
	}
	/* -------------------------------------------------------------- */


	/* TIME FUNCTIONS */
	function getHoursStats(time) {
		return Math.floor(time / 3600);
	}

	function getMinutesGame(time) {
		let t = Math.floor(time / 60);
		return `${Math.floor(t / 10)}${Math.floor(t % 10)}`;
	}

	function getMinutesReport(time) {
		return Math.floor(Math.round(time) / 60);
	}

	function getMinutesEmbed(time) {
		let t = Math.floor(Math.round(time) / 60);
		return `${Math.floor(t / 10)}${Math.floor(t % 10)}`;
	}

	function getMinutesStats(time) {
		return Math.floor(time / 60) - getHoursStats(time) * 60;
	}

	function getSecondsGame(time) {
		let t = Math.floor(time - Math.floor(time / 60) * 60);
		return `${Math.floor(t / 10)}${Math.floor(t % 10)}`;
	}

	function getSecondsReport(time) {
		let t = Math.round(time);
		return Math.floor(t - getMinutesReport(t) * 60);
	}

	function getSecondsEmbed(time) {
		let t = Math.round(time);
		let t2 = Math.floor(t - Math.floor(t / 60) * 60);
		return `${Math.floor(t2 / 10)}${Math.floor(t2 % 10)}`;
	}

	function getTimeGame(time) {
		return `[${getMinutesGame(time)}:${getSecondsGame(time)}]`;
	}

	function getTimeEmbed(time) {
		return `[${getMinutesEmbed(time)}:${getSecondsEmbed(time)}]`;
	}

	function getTimeStats(time) {
		if (getHoursStats(time) > 0) {
			return `${getHoursStats(time)}h${getMinutesStats(time)}m`;
		} else {
			return `${getMinutesStats(time)}m`;
		}
	}

	function getGoalGame() {
		return game.scores.red + game.scores.blue;
	}

	function getPlaytimeString(pt) {
		const seconds = Math.floor(pt % 60)
		const minutes = Math.floor(pt % 3600 / 60)
		const hours = Math.floor(pt % (3600 * 24) / 3600)
		const days = Math.floor(pt / (3600 * 24))
		return (days > 0 ? (days + "d " + hours + "h " + minutes + "m") : (hours > 0 ? (hours + "h " + minutes + "m") : (minutes > 0 ? (minutes + "m " + seconds + "s") : seconds + "s")))
	}

	function formatCurrentDate() {
	  let now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));

	  let day = String(now.getDate()).padStart(2, '0');
	  let month = String(now.getMonth() + 1).padStart(2, '0'); // Gennaio è 0!
	  let year = now.getFullYear();

	  let hours = String(now.getHours()).padStart(2, '0'); // +1 per orario italiano
	  let minutes = String(now.getMinutes()).padStart(2, '0');
	  let seconds = String(now.getSeconds()).padStart(2, '0');

	  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
	}
	/* -------------------------------------------------------------- */


	/* REPORT FUNCTIONS */
	function findFirstNumberCharString(str) {
		let str_number = str[str.search(/[0-9]/g)];
		return str_number === undefined ? "0" : str_number;
	}

	function getIdReport() {
		let d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));
		return `${d.getFullYear() % 100}${d.getMonth() < 9 ? '0' : ''}${d.getMonth() + 1}${d.getDate() < 10 ? '0' : ''}${d.getDate()}${d.getHours() < 10 ? '0' : ''}${d.getHours()}${d.getMinutes() < 10 ? '0' : ''}${d.getMinutes()}${d.getSeconds() < 10 ? '0' : ''}${d.getSeconds()}${findFirstNumberCharString(roomName)}`;
	}

	function getRecordingName(game) {
		let d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }));
		let redCap = game.playerComp[0][0] != undefined ? game.playerComp[0][0].player.name : 'Red';
		let blueCap = game.playerComp[1][0] != undefined ? game.playerComp[1][0].player.name : 'Blue';
		let day = d.getDate() < 10 ? '0' + d.getDate() : d.getDate();
		let month = d.getMonth() < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1);
		let year = d.getFullYear() % 100 < 10 ? '0' + (d.getFullYear() % 100) : (d.getFullYear() % 100);
		let hour = d.getHours() < 10 ? '0' + d.getHours() : d.getHours();
		let minute = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
		return `${day}-${month}-${year}_${hour}-${minute}_${redCap}_${game.scores.red}-${game.scores.blue}_${blueCap}.hbr2`;
	}

	function fetchRecording(game) {
		if (matchWebhook != "") {
            let form = new FormData();
            let fileBuffer = Buffer.from(game.rec);

            form.append('file', fileBuffer, getRecordingName(game));
            form.append("payload_json", JSON.stringify({
                "username": roomName
            }));

			fetch(matchWebhook, {
				method: 'POST',
				body: form,
			}).then((res) => res);
		}
	}

	function fetchStreakRecording(game) {
		if (matchWebhook != "") {
            let form = new FormData();
            let fileBuffer = Buffer.from(game.rec);

            form.append('file', fileBuffer, getRecordingName(game));
            form.append("payload_json", JSON.stringify({
                "username": "Dream Team <3"
            }));

			fetch(matchWebhook, {
				method: 'POST',
				body: form,
			}).then((res) => res);
		}
	}
	/* -------------------------------------------------------------- */


	/* FEATURE FUNCTIONS */
	function getCommand(commandStr) {
		if (commands.hasOwnProperty(commandStr)) return commandStr;
		for (const [key, value] of Object.entries(commands)) {
			for (let alias of value.aliases) {
				if (alias == commandStr) return key;
			}
		}
		return false;
	}

	function getPlayerComp(player) {
		if (player == null || player.id == 0) return null;
		let comp = game.playerComp;
		let index = comp[0].findIndex((c) => c.auth == authArray[player.id][0]);
		if (index != -1) return comp[0][index];
		index = comp[1].findIndex((c) => c.auth == authArray[player.id][0]);
		if (index != -1) return comp[1][index];
		return null;
	}

	function getTeamArray(team, includeAFK = true) {
		if (team == Team.RED) return teamRed;
		if (team == Team.BLUE) return teamBlue;
		if (includeAFK) {
			return playersAll.filter((p) => p.team === Team.SPECTATORS);
		}
		return teamSpec;
	}

	function sendAnnouncementTeam(message, team, color, style, mention) {
		for (let player of team) {
			room.sendAnnouncement(message, player.id, color, style, mention);
		}
	}

	function teamChat(player, message) {
		let msgArray = message.split(/ +/).slice(1);
		let emoji = player.team == Team.RED ? '🔴' : player.team == Team.BLUE ? '🔵' : '⚪';
		let msg = `${emoji} [TEAM] ${player.name}: ${msgArray.join(' ')}`;
		let team = getTeamArray(player.team, true);
		let color = player.team == Team.RED ? redColor : player.team == Team.BLUE ? blueColor : null;
		let style = 'bold';
		let mention = HaxNotification.CHAT;
		sendAnnouncementTeam(msg, team, color, style, mention);
	}

	function playerChat(player, message) {
		let msgArray = message.split(/ +/);
		let playerTargetIndex = playersAll.findIndex(
			(p) => p.name.replaceAll(' ', '_') == msgArray[0].substring(2)
		);
		if (playerTargetIndex == -1) {
			room.sendAnnouncement(
				`Giocatore inesistente, verifica se il nome è corretto.`,
				player.id,
				errorColor,
				'bold',
				null
			);
			return false;
		}
		let playerTarget = playersAll[playerTargetIndex];
		if (player.id == playerTarget.id) {
			room.sendAnnouncement(
				`Non puoi inviare un PM a te stesso!`,
				player.id,
				errorColor,
				'bold',
				null
			);
			return false;
		}
		let messageFrom = `📝 [PM con ${playerTarget.name}] ${player.name}: ${msgArray.slice(1).join(' ')}`

		let messageTo = `📝 [PM con ${player.name}] ${player.name}: ${msgArray.slice(1).join(' ')}`

		room.sendAnnouncement(
			messageFrom,
			player.id,
			privateMessageColor,
			'bold',
			HaxNotification.CHAT
		);
		room.sendAnnouncement(
			messageTo,
			playerTarget.id,
			privateMessageColor,
			'bold',
			HaxNotification.CHAT
		);
	}
	/* -------------------------------------------------------------- */


	/* PHYSICS FUNCTIONS */
	function calculateStadiumVariables() {
		if (checkStadiumVariable && teamRed.length + teamBlue.length > 0) {
			checkStadiumVariable = false;
			setTimeout(() => {
				let ballDisc = room.getDiscProperties(0);
				let allPlayer = teamRed.concat(teamBlue);
				let playerDisc = room.getPlayerDiscProperties(allPlayer[0].id);
				for (var i = allPlayer.length - 1; i >= 0; i--) {
					playerDisc = room.getPlayerDiscProperties(allPlayer[i].id);
					if((playerDisc != undefined && playerDisc != null) && (playerDisc.radius != undefined && playerDisc.radius != null)){
						playerRadius = playerDisc.radius;
						i = -1;
					}
				}
				if((ballDisc != undefined && ballDisc != null) && (ballDisc.radius != undefined && ballDisc.radius != null)){
					ballRadius = ballDisc.radius;
					speedCoefficient = 100 / (5 * ballDisc.invMass * (ballDisc.damping ** 60 + 1));
				}
				triggerDistance = ballRadius + playerRadius + 0.01;
			}, 1);
		}
	}

	function checkGoalKickTouch(array, index, goal) {
		if (array != null && array.length >= index + 1) {
			let obj = array[index];
			if (obj != null && obj.goal != null && obj.goal == goal) return obj;
		}
		return null;
	}
	/* -------------------------------------------------------------- */


	/* FUNCTIONS FOR CHOOSING PLAYERS */
	function topButton() {
		if (teamSpec.length > 0) {
			if (teamRed.length == teamBlue.length && teamSpec.length > 1) {
				if (teamSpec[0] != undefined) room.setPlayerTeam(teamSpec[0].id, Team.RED);
				if (teamSpec[1] != undefined) room.setPlayerTeam(teamSpec[1].id, Team.BLUE);
			} else if (teamRed.length < teamBlue.length) {
				if (teamSpec[0] != undefined) room.setPlayerTeam(teamSpec[0].id, Team.RED);
			}
			else if (teamSpec[0] != undefined) room.setPlayerTeam(teamSpec[0].id, Team.BLUE);
		}
	}

	function randomButton() {
		if (teamSpec.length > 0) {
			if (teamRed.length == teamBlue.length && teamSpec.length > 1) {
				let r = getRandomInt(teamSpec.length);
				if (teamSpec[r] != undefined) {
					room.setPlayerTeam(teamSpec[r].id, Team.RED);
					teamSpec = teamSpec.filter((spec) => spec.id != teamSpec[r].id);
					const r2 = getRandomInt(teamSpec.length)
					if (teamSpec[r2] != undefined) room.setPlayerTeam(teamSpec[r2].id, Team.BLUE);
				}
			} else if (teamRed.length < teamBlue.length) {
				const r = getRandomInt(teamSpec.length)
				if (teamSpec[r] != undefined) room.setPlayerTeam(teamSpec[r].id, Team.RED);
			}
			else {
				const r = getRandomInt(teamSpec.length)
				if (teamSpec[r] != undefined) room.setPlayerTeam(teamSpec[r].id, Team.BLUE);
			}
		}
	}

	function blueToSpecButton() {
		clearTimeout(removingTimeout);
		removingPlayers = true;
		removingTimeout = setTimeout(() => {
			removingPlayers = false;
		}, 100);
		for (let i = 0; i < teamBlue.length; i++) {
			room.setPlayerTeam(teamBlue[teamBlue.length - 1 - i].id, Team.SPECTATORS);
		}
	}

	function redToSpecButton() {
		clearTimeout(removingTimeout);
		removingPlayers = true;
		removingTimeout = setTimeout(() => {
			removingPlayers = false;
		}, 100);
		for (let i = 0; i < teamRed.length; i++) {
			room.setPlayerTeam(teamRed[teamRed.length - 1 - i].id, Team.SPECTATORS);
		}
	}

	function resetButton() {
		clearTimeout(removingTimeout);
		removingPlayers = true;
		removingTimeout = setTimeout(() => {
			removingPlayers = false;
		}, 100);
		for (let i = 0; i < Math.max(teamRed.length, teamBlue.length); i++) {
			if (Math.max(teamRed.length, teamBlue.length) - teamRed.length - i > 0)
				room.setPlayerTeam(teamBlue[teamBlue.length - 1 - i].id, Team.SPECTATORS);
			else if (Math.max(teamRed.length, teamBlue.length) - teamBlue.length - i > 0)
				room.setPlayerTeam(teamRed[teamRed.length - 1 - i].id, Team.SPECTATORS);
			else break;
		}
		for (let i = 0; i < Math.min(teamRed.length, teamBlue.length); i++) {
			room.setPlayerTeam(
				teamBlue[Math.min(teamRed.length, teamBlue.length) - 1 - i].id,
				Team.SPECTATORS
			);
			room.setPlayerTeam(
				teamRed[Math.min(teamRed.length, teamBlue.length) - 1 - i].id,
				Team.SPECTATORS
			);
		}
	}

	function swapButton() {
		clearTimeout(removingTimeout);
		removingPlayers = true;
		removingTimeout = setTimeout(() => {
			removingPlayers = false;
		}, 100);
		for (let player of teamBlue) {
			room.setPlayerTeam(player.id, Team.RED);
		}
		for (let player of teamRed) {
			room.setPlayerTeam(player.id, Team.BLUE);
		}
	}

	/* COMMAND FUNCTIONS */

	/* ACCOUNT SYSTEM */
	async function logPlayer(player, password, auto) {
		const thisPlayer = await playersDB.findOne({nickname: player.name});
		const anotherAccount = await playersDB.findOne({$and: [{nickname: {$ne: player.name}}, {$or: [{auth: authArray[player.id][0]}, {connect: authArray[player.id][1]}]}, { sharedAccounts: { $ne: player.name } }]});

		let msg = ""//, msgSacks = "Al momento non hai nessun pacchetto da aprire"
		let msgUpdate = await messageUpdate(); //per richiedere il messaggio dal DB
		if (thisPlayer != undefined) {
			if (thisPlayer.isBanned) {
				banCommand(null, "!ban \""+player.name+"\" Multiaccount! [AutoBan]");
			} else if (anotherAccount != undefined && !debugMode ) {
				room.sendAnnouncement("Hai già un account registrato col nickname '" + anotherAccount.nickname + "'\nÉ possibile chiedere il cambio nickname agli Admin.", player.id, loginColor, 'bold', HaxNotification.CHAT)
			}
			else {
				const adminPlayer = await adminsDB.findOne({nickname: thisPlayer.nickname, auth: thisPlayer.auth, role: thisPlayer.role});
				if(adminPlayer != undefined) room.setPlayerAdmin(player.id, true);

				try {
					const IP = await hexToString(authArray[player.id][1]);
					let response = await axios.get("https://api.findip.net/" + IP + "/?token=679987f257234c649691860bf584bb22");
					const jRes = await response.data;
					if (thisPlayer.country != jRes.country.names.en) {
						writeLog("", player.name + " ha un IP proveniente da un paese diverso da quello rilevato in fase di registrazione: " + thisPlayer.country + "!=" + jRes.country.names.en, true)
						if (thisPlayer == undefined || !('vpn' in thisPlayer) || ('vpn' in thisPlayer && thisPlayer.vpn !== true))
							room.kickPlayer(player.id, "IP da un paese diverso da quello in fase di registrazione!", false);
					}
				} catch (errr) {
					writeLog("", " ££££££££££££££££££££££ Errore axios1: " + errr, true);
				}
				thisPlayer.lastLogin = Date.now()
				thisPlayer.isLogged = true
				thisPlayer.auth = authArray[player.id][0]
				thisPlayer.connect = authArray[player.id][1]
				playersDB.updateOne({ nickname: player.name }, { $set: { auth: thisPlayer.auth, connect: thisPlayer.connect, lastLogin: thisPlayer.lastLogin, isLogged:  thisPlayer.isLogged} })
				if (auto){ msg = `👋 Ehi ${player.name} bentornato! Login automatico effettuato!\n`;}
				else { msg = `👋 Ehi ${player.name} bentornato! Login effettuato con successo!\n`; }

				// prende i warns e ogni mese leva un warn per buona condotta
				let penaltiesPlayer = await penaltiesDB.findOne({ nickname: player.name });

			    if (penaltiesPlayer){
			    	let firstInfraction = undefined;
			    	if(penaltiesPlayer.infractions && penaltiesPlayer.infractions.length > 0) {
				      firstInfraction = penaltiesPlayer.infractions[0].date;
				      if( (firstInfraction-Date.now()) >= 2678400000 ) unwarnCommand(player, "!unwarn '"+player.name+"' Buona condotta per 1 mese!" )
				    }
				}

				/*if (AFKSet.has(player.id)) {
					AFKSet.delete(player.id)
					updateTeams()
					handlePlayersJoin()
					clearTimeout(AFKLogin[player.id])
					delete AFKLogin[player.id]
				}*/
				/*const custPlayer = customization.find(a => a.nickname == player.name)
				if (custPlayer.sacks.length > 0) msgSacks = `Hai ${custPlayer.sacks.length == 1 ? "un sacco" : custPlayer.sacks.length + " sacchi"} da aprire! digita !sacks per saperne di più`*/
				room.sendAnnouncement("🔷️    HaxZone    🔷️\n" + msg + msgUpdate, player.id, loginColor, 'bold', HaxNotification.CHAT);
				//if (thisPlayer.role >= Role.VERIFY) room.sendAnnouncement(msgSacks, player.id, welcomeColor, 'bold', HaxNotification.CHAT)
			}
		}else {
			let nazionale = "MONDO";
			try {
				const IP = await hexToString(authArray[player.id][1]);
				let response = await axios.get("https://api.findip.net/" + IP + "/?token=679987f257234c649691860bf584bb22")
				const jRes = await response.data
				nazionale = jRes.country.names.en;
			} catch (errr) {
				writeLog("", " ££££££££££££££££££££££ Errore axios2: " + errr, true);
			}
			const regPlayer = { registerDate: Date.now(), nickname: player.name, auth: authArray[player.id][0], connect: authArray[player.id][1], password: password, country: nazionale, role: Role.PLAYER, roleString: RoleEmoji.PLAYER, eventString: "", lastLogin: Date.now(), isBanned: false, isLogged: true, sharedAccounts: [] }
			//const custPlayer = { nickname: player.name, currentSkin: -1, currentStadium: -1, allowedSkin: [CustomSkin.CLASSIC, CustomSkin.FUTSAL, CustomSkin.BIGLASSIC], allowedStadium: [CustomStadium.HAXFREE], sacks: [] }
			//const rankPlayer = { nickname: player.name, rankPoints: 0, rankString: "▪ 🐤🟤", rankedGames: 0 }

			//customization.push(custPlayer)
			//ranking.push(rankPlayer)
			playersDB.insertOne(regPlayer)
			//customizationDB.insertOne(custPlayer)
			//rankingDB.insertOne(rankPlayer)

			/*if (AFKSet.has(player.id)) {
				AFKSet.delete(player.id)
				updateTeams()
				handlePlayersJoin()
				clearTimeout(AFKLogin[player.id])
				delete AFKLogin[player.id]
			}*/

			room.sendAnnouncement(`🔷️    HaxZone    🔷️\n👋 Benvenuto ${player.name}, ti sei registrato correttamente!\n` + msgUpdate, player.id, loginColor, 'bold', HaxNotification.CHAT)
		}
	}

	async function registerCommand(player, message) {
		const msgArray = message.split(/ +/).slice(1);
		let msg = "";
		
		if (msgArray.length > 0) {
			const anotherAccount = await playersDB.findOne({
				$and: [
					{ nickname: { $ne: player.name } },
					{ $or: [{ auth: authArray[player.id][0] }, { connect: authArray[player.id][1] }] },
					{ sharedAccounts: { $ne: player.name } }
				]
			});
	
			if (anotherAccount != undefined && !debugMode) {
				msg = `Hai già un altro account col nickname '${anotherAccount.nickname}'!\nPotrai continuare a giocare, ma non potrai effettuare il login o la registrazione finché non entri col tuo account principale!`;
			} else {
				const thisPlayer = await playersDB.findOne({ nickname: player.name });
	
				if (thisPlayer == undefined) {
					if (msgArray[0].length > 4 && /^(?=.*[a-zA-Z])(?=.*[0-9]).*$/.test(msgArray[0])) {
						bcrypt.hash(msgArray[0], 10, async (err, hash) => {
							// Utilizza la `country` dall'authArray
							const playerCountry = authArray[player.id][2] || 'N/A';  // Se `country` non è disponibile, default 'N/A'
	
						// Inserisci il nuovo giocatore con il ruolo EVENT
						await playersDB.insertOne({
							nickname: player.name,
							auth: authArray[player.id][0],
							password: hash,
							role: Role.EVENT, // Assegna automaticamente il ruolo EVENT
							connect: authArray[player.id][1], // Associa la connessione
							country: playerCountry, // Usa il valore di `player.country` se disponibile, altrimenti 'N/A'
							isLogged: true, // Imposta isLogged come vero
							sharedAccounts: [], // Inizializza gli account condivisi come vuoti
							registrationDate: new Date(), // Data di registrazione corrente
							isBanned: false, // Imposta isBanned come false di default
							roleString: '🟨', // Imposta il valore di default per roleString
						});

							logPlayer(player, hash, false); // Procedi con il login
						});
						return false;
					} else {
						msg = `La password deve avere un numero minimo di 5 caratteri e contenere almeno una lettera e un numero.`;
					}
				} else {
					msg = `Questo nickname è già registrato. Puoi procedere ad accedere con il comando: !login password.`;
				}
			}
		} else {
			msg = `Comando errato. Per ulteriori informazioni, digitare "!help register".`;
		}
	
		room.sendAnnouncement(msg, player.id, errorColor, 'bold', HaxNotification.CHAT);
	}

	async function loginCommand(player, message) {
		const msgArray = message.split(/ +/).slice(1)
		let msg = "";
		if (msgArray.length > 0 && msgArray[0].length > 0) {
			const anotherAccount = await playersDB.findOne({$and: [{nickname: {$ne: player.name}}, {$or: [{auth: player.auth}, {connect: player.conn}]}, { sharedAccounts: { $ne: player.name } }]});
			if (anotherAccount != undefined && !debugMode) msg = `Hai già un altro account col nickname '${anotherAccount.nickname}'!\nPotrai continuare a giocare, ma non potrai effettuare il login o la registrazione finché non entri col tuo account principale.`
			else {
				const thisPlayer = await playersDB.findOne({nickname: player.name});
				if (thisPlayer != undefined) {
					if (!thisPlayer.isLogged) {
						bcrypt.compare(msgArray[0], thisPlayer.password, async (err, result) => {
							if (result) await logPlayer(player, null, false)
							else room.sendAnnouncement(`Password errata, riprova o usa il comando !resetpassword per cambiare password!`, player.id, errorColor, 'bold', HaxNotification.CHAT)
						})
					} else msg = 'Sei già connesso!'
				} else msg = `Questo nickname non è ancora registrato. Puoi procedere con la registrazione tramite !register password.`
			}
		} else msg = `Comando errato. Per ulteriori informazioni, digitare "!help login".`
		if (msg != "") room.sendAnnouncement(msg, player.id, errorColor, 'bold', HaxNotification.CHAT)
	}

	async function resetPasswordCommand(player, message) {
		try{
			let msgArray = resultDB = undefined;
		  	let msg = i = "";
	    	let targetPlayer = new Object();

	    	if(message.split(/ +/)[0] == "!resetpassword") i = 15;
	    	else if (message.split(/ +/)[0] == "!rpw") i = 5;

		  	if(	message.substring(i,i+1) == '"' || message.substring(i,i+1) == "'"){
	        	msgArray = message.split(message.substring(i,i+1)); // [0]->"!rpw" [1]->"GIORGIO alla"
	    		targetPlayer.nickname = msgArray[1].trim();

	    		resultDB = await playersDB.findOne({nickname: targetPlayer.nickname});
	    		if(resultDB == undefined || resultDB == null ) throw "Questo player non ha ancora un account registrato.";

	    		targetPlayer.password = msgArray[2].trim();
	    	}
	        else if(message.substring(i,i+1) == "#"){
	        	msgArray = message.split(" "); // [0]->"!rpw" [1]->"#123"
	        	targetPlayer.id = msgArray[1].startsWith('#') ? msgArray[1].substring(1).trim() : msgArray[1].trim();
	        	targetPlayer = room.getPlayer(parseInt(targetPlayer.id));
	        	if(targetPlayer==undefined || targetPlayer==null) throw "Giocatore non esistente in room";

	        	resultDB = await playersDB.findOne({nickname: targetPlayer.name});
	    		if(resultDB == undefined || resultDB == null ) throw "Questo player non ha ancora un account registrato.";

	    		targetPlayer.nickname = resultDB.nickname;
	    		targetPlayer.password = msgArray.slice(2).join(" ").trim();
	        }
	        else {
	        	targetPlayer.nickname = player.name;

	        	resultDB = await playersDB.findOne({$and: [{nickname: targetPlayer.nickname}, {$or: [{auth: player.auth}, {connect: player.conn}]}]});
	    		if(resultDB == undefined || resultDB == null ) throw "Questo player non ha ancora un account registrato o non hai il permesso per resettargli la password, contatta un Admin o un Founder.";

	    		targetPlayer.password = message.split(/ +/).slice(1).join(" ").trim();
	        }


		    // Verifica se il comando include un ID e il player è admin
	        if (msgArray != undefined && player.role < Role.ADMIN) {
	          throw "Non hai il ruolo per resettare la password di questo account, contatta un Admin o un Founder.";
	        }


	        // reset password effettivo
			if (targetPlayer.password.length > 4 && /^(?=.*[a-zA-Z])(?=.*[0-9]).*$/.test(targetPlayer.password)) {
				bcrypt.hash(targetPlayer.password, 10, async (err, hash) => {
					if (err) throw `Errore aggiornamento password, contatta lo staff su !discord.`;

					await playersDB.updateOne({ nickname: targetPlayer.nickname }, { $set: { password: hash } })
					if(msgArray != undefined) msg = `Hai resettato con successo la password di ${targetPlayer.nickname} in ${targetPlayer.password}.`
					else msg = `Hai resettato con successo la tua password in ${targetPlayer.password}.`;
					room.sendAnnouncement(msg, player.id, announcementColor, 'bold', HaxNotification.CHAT)
				});
			} else throw `La password deve avere un numero minimo di 5 caratteri e contenere almeno una lettera e un numero.`
		}catch(err){
			writeLog("", err, true);
			room.sendAnnouncement(err, player.id, errorColor, 'bold', HaxNotification.CHAT)
		}
	}

	/* PLAYER COMMANDS */
	async function helpCommand(player, message) {
		let msgArray = message.split(/ +/).slice(1);
		let fPla = fPar = fVip = fHel = fMod = fAdm = fFou = fDev = fOwn = false;
		if (msgArray.length == 0) {
			let commandString = 'GUEST commands :\n';
			for (const [key, value] of Object.entries(commands)) {
				if (value.desc && value.roles == Role.GUEST) {
					commandString += ` !${key},`;
				} else if (value.roles == Role.PLAYER) fPla = true;
				else if (value.roles == Role.PARTNER) fPar = true;
				else if (value.roles == Role.VIP) fVip = true;
				else if (value.roles == Role.HELPER) fHel = true;
				else if (value.roles == Role.MODERATOR) fMod = true;
				else if (value.roles == Role.ADMIN) fAdm = true;
				else if (value.roles == Role.FOUNDER) fFou = true;
				else if (value.roles == Role.DEVELOPER) fDev = true;
				else if (value.roles == Role.OWNER) fOwn = true;
			}
			commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			if (player.role >= Role.PLAYER && fPla) {
				commandString += `PLAYER commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.PLAYER) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':')
					commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (player.role >= Role.PARTNER && fPar) {
				commandString += `PARTNER commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.PARTNER) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':') commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (player.role >= Role.VIP && fVip) {
				commandString += `VIP commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.VIP) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':')
					commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (player.role >= Role.HELPER && fHel) {
				commandString += `HELPER commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.HELPER) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':') commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (player.role >= Role.MODERATOR && fMod) {
				commandString += `MODERATOR commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.MODERATOR) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':')
					commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (player.role >= Role.ADMIN && fAdm) {
				commandString += `ADMIN commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.ADMIN) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':') commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (player.role >= Role.FOUNDER && fFou) {
				commandString += `FOUNDER commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.FOUNDER) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':')
					commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (player.role >= Role.DEVELOPER && fDev) {
				commandString += `DEVELOPER commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.DEVELOPER) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':') commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (player.role >= Role.OWNER && fOwn) {
				commandString += `OWNER commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.OWNER) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':') commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			commandString += "Per sapere più dettagli sui singoli comandi, digita '!help <nome comando>'.";
			room.sendAnnouncement(
				commandString,
				player.id,
				infoColor,
				'bold',
				HaxNotification.CHAT
			);
		} else if (msgArray.length >= 1) {
			let commandName = getCommand(msgArray[0].toLowerCase());
			if (commandName != false && commands[commandName].desc != false)
				room.sendAnnouncement(
					`comando: '${commandName}'\n${commands[commandName].desc}`,
					player.id,
					infoColor,
					'bold',
					HaxNotification.CHAT
				);
			else
				room.sendAnnouncement(
					`Il comando di cui chiedi informazioni non esiste. Verifica la lista dei comandi, scrivendo \'!help\'`,
					player.id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
		}
	}

	async function ruleCommand(player, message) {
		let msg = await stringDB.findOne({name: "ruleCommand"});
		room.sendAnnouncement(
			msg.text,
			player.id,
			loginColor,
			'bold',
			HaxNotification.CHAT
		);
	}

	async function socialCommand(player, message) {
		let msg = await stringDB.findOne({name: "socialCommand"});
		room.sendAnnouncement(
			msg.text,
			player.id,
			loginColor,
			'bold',
			HaxNotification.CHAT
		);
	}

	async function eventCommand(player, message) {
		let msg = await stringDB.findOne({name: "eventCommand"});
		room.sendAnnouncement(
			msg.text,
			player.id,
			loginColor,
			'bold',
			HaxNotification.CHAT
		);
	}

	async function statsCommand(player, message) { //!stats #123
		try{
			let msgArray = resultDB = undefined;
			let msg = "";
	    	let playerStats = new Object();
	    	message = message.trim();

			if(message.substring(7,8) == '"' || message.substring(7,8) == "'"){
	        	msgArray = message.split(message.substring(7,8)); // [0]->"!stats" [1]->"GIORGIO alla"
	    		playerStats.name = msgArray[1].trim();

	    		resultDB = await playersDB.findOne({nickname: playerStats.name});
	    		if(resultDB == undefined || resultDB == null ) throw "Giocatore non esistente nel db";
	    	}
	        else if(message.substring(7,8) == "#"){
	        	msgArray = message.split(" "); // [0]->"!stats" [1]->"#123"
	        	playerStats.id = msgArray[1].startsWith('#') ? msgArray[1].substring(1).trim() : msgArray[1].trim();
	        	playerStats = room.getPlayer(parseInt(playerStats.id));
	        	if(playerStats==undefined || playerStats==null) throw "Giocatore non esistente in room";

	        	resultDB = await playersDB.findOne({nickname: playerStats.name});
	    		if(resultDB == undefined || resultDB == null ) throw "Giocatore non esistente nel db";
	        }
	        else {
	        	playerStats.name = player.name;
	        }

	        if(msgArray == undefined && message.length > 6) throw "Errore comando. Verifica il funzionamento con !help stats";
	        if(msgArray == undefined) msg = "📝 Le tue statistiche";
		    else msg = "📝 Le statistiche di ["+playerStats.name+"]";

			const statPlayer = await statsDB.findOne({nickname: playerStats.name})
			const allDate = new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }).split("/")
			const thisMonth = allDate[0] + "-" + parseInt(allDate[2]);
			const monthlyStatPlayer = await monthlystatsDB.findOne({$and: [{nickname: playerStats.name}, {month: thisMonth}]} )
			if (statPlayer != undefined) {
				const ptString = getPlaytimeString(statPlayer.playtime)
				msg += ` totali\n🏟️ Games: ${statPlayer.games}, ✨ Wins: ${statPlayer.wins}, 💯 Winrate: ${statPlayer.winrate}, ⚽ Goals: ${statPlayer.goals}, ❌ Own Goals: ${statPlayer.ownGoals}, 👟 Assists: ${statPlayer.assists}, 🥅 Clean Sheets: ${statPlayer.cs}, 3️⃣ Hat Trick: ${statPlayer.hatTrick}, ⏱️ Playtime: ${ptString}\n`
				
				if(msgArray == undefined) msg += "📝 Le tue statistiche";
		    	else msg += "📝 Le statistiche di ["+playerStats.name+"]";

				if (monthlyStatPlayer != undefined) {
					const monthlyPtString = getPlaytimeString(monthlyStatPlayer.playtime)
					msg += ` mensili\n🏟️ Games: ${monthlyStatPlayer.games}, ✨ Wins: ${monthlyStatPlayer.wins}, 💯 Winrate: ${monthlyStatPlayer.winrate}, ⚽ Goals: ${monthlyStatPlayer.goals}, ❌ Own Goals: ${monthlyStatPlayer.ownGoals}, 👟 Assists: ${monthlyStatPlayer.assists}, 🥅 Clean Sheets: ${monthlyStatPlayer.cs}, 3️⃣ Hat Trick: ${monthlyStatPlayer.hatTrick}, ⏱️ Playtime: ${monthlyPtString}`
				}
				else msg += ` mensili non sono ancora disponibili. Gioca una partita in 3v3 per visualizzarle`
				if (statPlayer.games <= 14) msg += "\nDevi giocare almeno 15 partite 3v3 per visualizzare il suo winrate!"
			}
			else msg += `Nessuna statistica registrata!`
			room.sendAnnouncement(msg, player.id, infoColor, 'bold', HaxNotification.CHAT)
		}catch(err){
			writeLog("", err, true);
			room.sendAnnouncement(err, player.id, infoColor, 'bold', HaxNotification.CHAT)
		}
	}

	async function leaderboardCommand(player, message) {
	    let msgArray = message.split(/ +/);

	    let msg = "", typeColor = errorColor, orderedStats = "", statistiche, category = "all";

	    if(msgArray[0] == "!lb" || msgArray[0] == "!leaderboard"){
	    	statistiche = await statsDB.find({}).toArray();
	    	msg = "Leaderboard allTime";
	    }
	    else{
	    	const allDate = new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }).split("/");
			const thisMonth = allDate[0] + "-" + parseInt(allDate[2]);
			const monthlyStatPlayer = await monthlystatsDB.find({month: thisMonth}).toArray();
	    	statistiche = monthlyStatPlayer;
	    	msg = "Leaderboard monthly";
	    }

	    if (msgArray.length > 1) category = msgArray[1];
	    category = category.toLowerCase();
        switch (category) {
            case "games":
                orderedStats = statistiche.sort((a, b) => b.games - a.games)
				if (orderedStats.length > 0) {
					msg += " per la categoria 🏟️ Games:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].games != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].games}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg = "Non c'è ancora una leaderboard per la categoria 🏟️ Games!"
				break;
			case "wins":
                orderedStats = statistiche.sort((a, b) => b.wins - a.wins)
				if (orderedStats.length > 0) {
					msg += " per la categoria ✨ Wins:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].wins != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].wins}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg = "Non c'è ancora una leaderboard per la categoria ✨ Wins!"
				break;
			case "winrate":
                orderedStats = statistiche.sort((a, b) => parseFloat(b.winrate.substring(0, b.winrate.length - 1)) - parseFloat(a.winrate.substring(0, a.winrate.length - 1)))
				orderedStats = orderedStats.filter(obj => obj.games > 50);
				if (orderedStats.length > 0) {
					msg += " per la categoria 💯 Winrate:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].winrate != "???") msg += `${orderedStats[i].nickname} [${orderedStats[i].winrate}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg = "Non c'è ancora una leaderboard per la categoria 💯 Winrate!"
				break;
			case "goals":
                orderedStats = statistiche.sort((a, b) => b.goals - a.goals)
				if (orderedStats.length > 0) {
					msg += " per la categoria ⚽ Goals:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].goals != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].goals}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg = "Non c'è ancora una leaderboard per la categoria ⚽ Goals!"
				break;
			case "owngoals":
                orderedStats = statistiche.sort((a, b) => b.ownGoals - a.ownGoals)
				if (orderedStats.length > 0) {
					msg += " per la categoria ❌ Own Goals:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].ownGoals != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].ownGoals}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg = "Non c'è ancora una leaderboard per la categoria ❌ Own Goals!"
				break;
			case "assists":
                orderedStats = statistiche.sort((a, b) => b.assists - a.assists)
				if (orderedStats.length > 0) {
					msg += " per la categoria 👟 Assists:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].assists != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].assists}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg = "Non c'è ancora una leaderboard per la categoria 👟 Assists!"
				break;
			case "cs":
                orderedStats = statistiche.sort((a, b) => b.cs - a.cs)
				if (orderedStats.length > 0) {
					msg += " per la categoria 🥅 Clean Sheets:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].cs != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].cs}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg = "Non c'è ancora una leaderboard per la categoria 🥅 Clean Sheets!"
				break;
			case "hattrick":
                orderedStats = statistiche.sort((a, b) => b.hatTrick - a.hatTrick)
				if (orderedStats.length > 0) {
					msg += " per la categoria 3️⃣ Hat Trick:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].hatTrick != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].hatTrick}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg = "Non c'è ancora una leaderboard per la categoria 3️⃣ Hat Trick!"
				break;
			case "playtime":
                orderedStats = statistiche.sort((a, b) => b.playtime - a.playtime)
				if (orderedStats.length > 0) {
					msg += " per la categoria ⏱️ Playtime:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].playtime != 0) msg += `${orderedStats[i].nickname} [${getPlaytimeString(orderedStats[i].playtime)}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg = "Non c'è ancora una leaderboard per la categoria ⏱️ Playtime!"
				break;
			case "all":
				orderedStats = statistiche.sort((a, b) => b.games - a.games)
				if (orderedStats.length > 0) {
					msg += " di tutte le categorie\n🏟️ Games:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].games != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].games}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg += "\nNon c'è ancora una leaderboard per la categoria 🏟️ Games!"

				orderedStats = statistiche.sort((a, b) => b.wins - a.wins)
				if (orderedStats.length > 0) {
					msg += "\n✨ Wins:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].wins != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].wins}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg += "\nNon c'è ancora una leaderboard per la categoria ✨ Wins!"

				orderedStats = statistiche.sort((a, b) => parseFloat(b.winrate.substring(0, b.winrate.length - 1)) - parseFloat(a.winrate.substring(0, a.winrate.length - 1)))
				orderedStats = orderedStats.filter(obj => obj.games > 50);
				if (orderedStats.length > 0) {
					msg += "\n💯 Winrate:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].winrate != "???") msg += `${orderedStats[i].nickname} [${orderedStats[i].winrate}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg += "\nNon c'è ancora una leaderboard per la categoria 💯 Winrate!"

				orderedStats = statistiche.sort((a, b) => b.goals - a.goals)
				if (orderedStats.length > 0) {
					msg += "\n⚽ Goals:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].goals != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].goals}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg += "\nNon c'è ancora una leaderboard per la categoria ⚽ Goals!"

				orderedStats = statistiche.sort((a, b) => b.ownGoals - a.ownGoals)
				if (orderedStats.length > 0) {
					msg += "\n❌ Own Goals:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].ownGoals != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].ownGoals}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg += "\nNon c'è ancora una leaderboard per la categoria ❌ Own Goals!"

				orderedStats = statistiche.sort((a, b) => b.assists - a.assists)
				if (orderedStats.length > 0) {
					msg += "\n👟 Assists:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].assists != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].assists}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg += "\nNon c'è ancora una leaderboard per la categoria 👟 Assists!"

				orderedStats = statistiche.sort((a, b) => b.cs - a.cs)
				if (orderedStats.length > 0) {
					msg += "\n🥅 Clean Sheets:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].cs != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].cs}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg += "\nNon c'è ancora una leaderboard per la categoria 🥅 Clean Sheets!"

				orderedStats = statistiche.sort((a, b) => b.hatTrick - a.hatTrick)
				if (orderedStats.length > 0) {
					msg += "\n3️⃣ Hat Trick:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].hatTrick != 0) msg += `${orderedStats[i].nickname} [${orderedStats[i].hatTrick}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg += "\nNon c'è ancora una leaderboard per la categoria 3️⃣ Hat Trick!"

				orderedStats = statistiche.sort((a, b) => b.playtime - a.playtime)
				if (orderedStats.length > 0) {
					msg += "\n⏱️ Playtime:\n"
					for (let i = 0; i < orderedStats.length && i < 5; i++) {
						if (orderedStats[i].playtime != 0) msg += `${orderedStats[i].nickname} [${getPlaytimeString(orderedStats[i].playtime)}], `
					}
					msg = msg.substring(0, msg.length - 2) + '.'
					typeColor = infoColor
				}
				else msg += "\nNon c'è ancora una leaderboard per la categoria ⏱️ Playtime!"
				break;
            default:
                msg = "Hai specificato un argomento errato! Le categorie disponibili sono: \"games\", \"wins\", \"winrate\", \"goals\", \"owngoals\", \"assists\", \"cs\", \"hattrick\", \"playtime\".";
        }
        // Invia il messaggio di risposta al giocatore
        room.sendAnnouncement(msg, player.id, typeColor, 'bold', HaxNotification.CHAT);
	}

	function afkCommand(player, message) {

		// !afk "GIORGIO alla" || !afk #13
	    /*try {
			message = message.trim();

			if (message.length() > 4) {
				
			}
	    	let msgArray = resultDB = undefined;
	    	let playerToAFK = new Object();

	    	if(message.substring(5, 6) == '"' || message.substring(5, 6) == "'"){
	        	msgArray = message.split(message.substring(5, 6)); // [0]->"!afk" [1]->"GIORGIO alla"
	    		playerToAFK.name = msgArray[1].trim();

	    		playerToAFK = room.getPlayerList().find(a => a.name == playerToAFK.name);
	    		if(playerToAFK==undefined) throw "Giocatore non esistente in room";

	    		playerToBan.auth = resultDB.auth;
	    		playerToBan.connect = resultDB.connect;
	    		playerToBan.role = resultDB.role;
	    		reason = msgArray[2].trim();
	    	}
	        else if(message.substring(5, 6) == "#"){
	        	msgArray = message.split(" "); // [0]->"!ban" [1]->"#123" [2, 3, 4, ...]->"Perchè si"
	        	let playerID = msgArray[1].startsWith('#') ? msgArray[1].substring(1).trim() : msgArray[1].trim();
	        	playerToBan = room.getPlayer(parseInt(playerID));
        		if(playerToBan==undefined || playerToBan==null) throw "Giocatore non esistente in room";

        		resultDB = await playersDB.findOne({nickname: playerToBan.name});
    			if(resultDB == undefined || resultDB == null ) throw "Giocatore non esistente nel db";

	        	playerToBan.auth = resultDB.auth; 
	        	playerToBan.connect = resultDB.connect;
	        	playerToBan.role = resultDB.role;
	        	reason = msgArray.slice(2).join(" ").trim();
	        }
	        else throw "Il formato del comando ban non è valido";
            if(reason=="" || reason==undefined) throw "Errore: Motivo Warn obbligatorio. Per ulteriori informazioni, digitare !help warn";

	        // Verifica se il giocatore esiste e non è un admin
	        let playerFromBan = player.name;
	        
	        if(reason != "" && reason != " "){
	        	if (getRole(player) > parseInt(playerToBan.role)) {
				}
			}
		}catch(err){writeLog("", err, true)}*/

		if (player.team == Team.SPECTATORS || players.length == 1 || player.admin || (message == "AfkAutomaticoSeFermoInCampo" && !AFKSet.has(player.id))) {
			if (AFKSet.has(player.id)) {
				if (AFKMinSet.has(player.id) && currentStadium != 'training') {
					let data = AFKMinSet.get(player.id);
					let startTime = (data.split("|")[1])*1;
					let timeRemain = Math.max(0, (minAFKDuration*60*1000) - (Date.now() - startTime));
					room.sendAnnouncement(
						`C'è un minimo di ${minAFKDuration} minuti di tempo AFK. Tempo rimanente ${parseInt(timeRemain/1000)} secondi!`,
						player.id,
						errorColor,
						'bold',
						HaxNotification.CHAT
					);
				} else {
					AFKSet.delete(player.id);
					// Cancella il timer associato al giocatore
			        if (AFKTimers.has(player.id)) {
			        	if(AFKAvvertimentoTimers.has(player.id)){
			        		clearTimeout(AFKAvvertimentoTimers.get(player.id));
			            	AFKAvvertimentoTimers.delete(player.id);
			        	}
			            clearTimeout(AFKTimers.get(player.id));
			            AFKTimers.delete(player.id);
			        }

			        if(AFKMinSet.has(player.id)) {
			        	clearTimeout(AFKMinSet.get(player.id).split("|")[0]);
			        	AFKMinSet.delete(player.id);
			        }

					room.sendAnnouncement(
						`🌅 ${player.name} non è più AFK !`,
						null,
						announcementColor,
						'bold',
						null
					);

					if (roomWebhook != '') {
						let stringContent = `[${formatCurrentDate()}] 🌅 SI É SVEGLIATO (${room.getPlayerList().length}/${maxPlayers})\n**${player.name}**` +
							`[${player.auth}] {${player.conn}}`;
						fetch(roomWebhook, {
							method: 'POST',
							body: JSON.stringify({
								content: stringContent,
								username: roomName,
							}),
							headers: {
								'Content-Type': 'application/json',
							},
						}).then((res) => res);
					}

					updateTeams();
					handlePlayersJoin();
				}
			} else {
				if (AFKCooldownSet.has(player.id) && message != "AfkAutomaticoSeFermoInCampo") {
					room.sendAnnouncement(
						`Puoi andare AFK solo ogni ${AFKCooldown} minuti. Non esagerare troppo con il comando!`,
						player.id,
						errorColor,
						'bold',
						HaxNotification.CHAT
					);
				} else {
					AFKSet.add(player.id);
					if (!player.admin) {
						/*AFKCooldownSet.add(player.id);*/
						let timeoutMinAFKId = setTimeout(
							(id) => {
								if(AFKMinSet.has(id)) 
									AFKMinSet.delete(id);
							},
							minAFKDuration * 60 * 1000,
							player.id
						);
						const minData = timeoutMinAFKId + "|" + Date.now(); //salvo anche la data di creazione
						// Salva l'ID del timer Avvertimento nella Map
						AFKMinSet.set(player.id, minData);

						const timeoutAvvertimentoId = setTimeout(
							(id) => {
								if(room.getPlayer(id) != null && AFKSet.has(id)){
									room.sendAnnouncement("L'AFK sta per terminare, tra 1 minuto verrai Kickato per fare spazio!", player.id, announcementColor, 'bold', HaxNotification.CHAT)
								}
								// Rimuovi il timer dalla Map quando scade
        						AFKAvvertimentoTimers.delete(id);
							},
							(maxAFKDuration-1) * 60 * 1000,
							player.id
						);

						// Salva l'ID del timer Avvertimento nella Map
						AFKAvvertimentoTimers.set(player.id, timeoutAvvertimentoId);

						const timeoutId = setTimeout(
							(id) => {
								if(room.getPlayer(id) != null && AFKSet.has(id)){
									AFKSet.delete(id);
									room.kickPlayer(id, "Limite AFK raggiunto", false);
								}
								// Rimuovi il timer dalla Map quando scade
        						AFKTimers.delete(id);
							},
							maxAFKDuration * 60 * 1000,
							player.id
						);

						// Salva l'ID del timer nella Map
						AFKTimers.set(player.id, timeoutId);

						// Commento perché AFKCooldown == 0 attualmente (03/07/2024)
						/*setTimeout(
							(id) => {
								if(AFKCooldownSet.has(id)) 
									AFKCooldownSet.delete(id);
							},
							AFKCooldown * 60 * 1000,
							player.id
						);*/
					}
					room.setPlayerTeam(player.id, Team.SPECTATORS);
					if (message != "AfkAutomaticoSeFermoInCampo") {
						room.sendAnnouncement(
							`😴 ${player.name} adesso è AFK !`,
							null,
							announcementColor,
							'bold',
							null
						);
					}else{
						room.sendAnnouncement(
							`😴 ${player.name} è stato mandato AFK !`,
							null,
							announcementColor,
							'bold',
							null
						);
					}
					if (roomWebhook != '') {
						let stringContent = `[${formatCurrentDate()}] 😴 AFK (${room.getPlayerList().length}/${maxPlayers})\n**${player.name}**` +
							`[${player.auth}] {${player.conn}}`;
						fetch(roomWebhook, {
							method: 'POST',
							body: JSON.stringify({
								content: stringContent,
								username: roomName,
							}),
							headers: {
								'Content-Type': 'application/json',
							},
						}).then((res) => res);
					}
					
					updateTeams();
					handlePlayersLeave();
				}
			}
		} else {
			room.sendAnnouncement(
				`Non puoi andare AFK mentre sei in una squadra !`,
				player.id,
				errorColor,
				'bold',
				HaxNotification.CHAT
			);
		}
	}

	function afkListCommand(player, message) {
		if (AFKSet.size == 0) {
			room.sendAnnouncement(
				"😴 Non c'è nessuno nella lista AFK.",
				player.id,
				announcementColor,
				'bold',
				null
			);
			return;
		}
		let cstm = '😴 Lista degli AFK :\n';
		AFKSet.forEach((_, value) => {
			let p = room.getPlayer(value);
			if (p != null) cstm += p.name + `, `;
		});
		cstm = cstm.substring(0, cstm.length - 2) + '';
		room.sendAnnouncement(cstm, player.id, announcementColor, 'bold', null);
	}

	function leaveCommand(player, message) {
		room.kickPlayer(player.id, 'Bye !', false);
	}

	function streakCommand(player) {
		let cstm = `☄️ Streak attuale: ${streak} vittorie`
		if (infoStreak.length != 0) {
			cstm += "\n\nPlayers del Team attualmente in streak:\n"
			infoStreak.forEach((a, i) => {
				if (i == 0) cstm += `${a.nickname}`
				else if (i < infoStreak.length - 1) cstm += `, ${a.nickname}`
				else cstm += ` e ${a.nickname}`
			})
		}
		room.sendAnnouncement(cstm, player.id, announcementColor, 'bold', HaxNotification.CHAT)
	}

	async function topStreakCommand(player) {
		let cstm = `☄️ Top streak :`
		const filter = {};
		const sort = {
		  'streak': -1,
		  'timestamp': 1
		};
		const cursor = topStreakDB.find(filter, {sort});
		const result = await cursor.toArray();

		cstm += "\n🥇- "+result[0].players;
		cstm += "\n🥈- "+result[1].players;
		cstm += "\n🥉- "+result[2].players;
		cstm += "\n4️⃣- "+result[3].players;
		cstm += "\n5️⃣- "+result[4].players;

		//result.forEach(a => cstm += `\nStreak ${a.streak}: ${a.players}`)
		room.sendAnnouncement(cstm, player.id, announcementColor, 'bold', HaxNotification.CHAT)
	}

	function staffListCommand(player, message) {
	    if (!allAdmins || allAdmins.length === 0) {
	        room.sendAnnouncement(
	            "📢 Non c'è nessuno nell'elenco dello staff.",
	            player.id,
	            announcementColor,
	            'bold',
	            null
	        );
	        return;
	    }

	    const roleIcons = {
	        4: "⛑️ HELPER",
	        5: "🪖 MODERATOR",
	        6: "🎩 ADMIN",
	        7: "🗝️ FOUNDER",
	        8: "💻 DEVELOP"
	    };

	    let groupedStaff = {};

	    allAdmins.forEach(admin => {
	        const roleName = roleIcons[admin.role];
	        if (!groupedStaff[roleName]) {
	            groupedStaff[roleName] = [];
	        }
	        groupedStaff[roleName].push(admin.nickname);
	    });

	    let announcementMessage = '📢 Lista Staff :\n';
	    Object.keys(groupedStaff).forEach(role => {
	        announcementMessage += `${role}: ${groupedStaff[role].join(', ')}\n`;
	    });

	    room.sendAnnouncement(
	        announcementMessage,
	        player.id,
	        announcementColor,
	        'bold',
	        null
	    );
	}

	loadPendingRequests()

	let changeRequests = []; // Variabile per memorizzare le richieste in memoria

	async function loadPendingRequests() {
		changeRequests = await nicknameChangeRequestsDB.find({}).toArray();
		console.log("Richieste di cambio nickname caricate:", changeRequests);
	}


	async function changenickCommand(player, message) {
		if (message.startsWith("!changenick") || message.startsWith("!changenickrequest") || message.startsWith("!cnr") || message.startsWith("!crn")) {
	
			if (changeRequests.some(req => req.playerName === player.name)) {
				room.sendAnnouncement("Hai già una richiesta di cambio nickname in sospeso. Attendi che venga gestita prima di inviarne un'altra.", player.id, null, 'bold');
				return;
			}
	
			const regex = /"([^"]+)"\s+"([^"]+)"\s+(.+)/;
			const matches = message.match(regex);
	
			if (!matches || matches.length !== 4) {
				room.sendAnnouncement('Formato non valido! Usa: !changenick "nickname_corrente" "nickname_nuovo" motivazione', player.id, null, 'bold');
				return;
			}
	
			let currentNick = matches[1];
			let newNick = matches[2];
			let motivation = matches[3];
	
			if (currentNick !== player.name) {
				room.sendAnnouncement("Il nickname corrente non corrisponde al tuo nome utente.", player.id, null, 'bold');
				return;
			}
	
			// Controlla se il nuovo nickname è già esistente
			const nicknameExists = await playersDB.findOne({ nickname: newNick });
			if (nicknameExists) {
				room.sendAnnouncement(`Il nickname "${newNick}" è già in uso. Scegli un altro nickname.`, player.id, null, 'bold');
				return;
			}
	
			const request = { playerName: player.name, currentNick, requestedNick: newNick, motivation };
	
			// Salva la richiesta sia in memoria che nel database
			changeRequests.push(request);
			await nicknameChangeRequestsDB.insertOne(request); // Salva nel database
	
			room.sendAnnouncement(`${player.name} ha inviato una richiesta di cambio nickname da "${currentNick}" a "${newNick}" con motivazione: "${motivation}".`, player.id, null, 'bold');
		}
	}
	
	// variabile per tenere traccia se hai già mostrato la lista delle richieste o meno
	let listRequestShown = false;

	async function listrequestnickCommand(player, message) {
		if (message === "!listrequestnick" || message === "!lrn") {
			if (player.role >= Role.ADMIN) {
				if (changeRequests.length === 0) {
					room.sendAnnouncement("Non ci sono richieste di cambio nickname.", player.id, null, 'bold');
				} else {
					listRequestShown = true;
					changeRequests.forEach((req, index) => {
						room.sendAnnouncement(`${index + 1}. ${req.playerName} vuole cambiare il nickname da [${req.currentNick}] a [${req.requestedNick}]. Motivazione: ${req.motivation}`, player.id, null, 'bold', HaxNotification.CHAT);
					});
					room.sendAnnouncement("Per selezionare una richiesta, digita !select [numero_richiesta] Accetta o Rifiuta.", player.id, null, 'bold', HaxNotification.CHAT);
				}
			} else {
				room.sendAnnouncement("Solo gli admin possono vedere le richieste.", player.id, null, 'bold');
			}
		}
	}

	function getFormattedDate() {
		let now = new Date();
		
		// Imposta il fuso orario +2
		let timezoneOffset = 2 * 60; // +2 ore
		let localDate = new Date(now.getTime() + (timezoneOffset + now.getTimezoneOffset()) * 60000);
	
		// Format data: YYYY-MM-DD HH:mm:ss
		let year = localDate.getFullYear();
		let month = String(localDate.getMonth() + 1).padStart(2, '0'); // Mesi da 0 a 11
		let day = String(localDate.getDate()).padStart(2, '0');
		let hours = String(localDate.getHours()).padStart(2, '0');
		let minutes = String(localDate.getMinutes()).padStart(2, '0');
		let seconds = String(localDate.getSeconds()).padStart(2, '0');
	
		// Formattiamo la data come richiesto
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} +02:00`;
	}

	async function selectchangeCommand(player, message) {
		if (player.role >= Role.ADMIN) {
			if (!listRequestShown) {
				room.sendAnnouncement("Devi prima visualizzare le richieste di cambio nickname con !listrequestnick o !lrn.", player.id, null, 'bold', HaxNotification.CHAT);
				return;
			}
	
			// Estrai numero della richiesta e la decisione (Accetta o Rifiuta)
			const regex = /!select\s+(\d+)\s+(Accetta|Rifiuta)/;
			const matches = message.match(regex);
	
			if (!matches || matches.length !== 3) {
				room.sendAnnouncement("Formato non valido! Usa !select numero_richiesta Accetta o Rifiuta", player.id, null, 'bold', HaxNotification.CHAT);
				return;
			}
	
			let requestIndex = parseInt(matches[1]) - 1;
			let decision = matches[2];
	
			if (changeRequests[requestIndex]) {
				let currentRequest = changeRequests[requestIndex];
	
				if (decision === 'Accetta') {
					room.sendAnnouncement(`La richiesta di ${currentRequest.playerName} è stata accettata. Il nuovo nickname è "${currentRequest.requestedNick}".`, player.id, null, 'bold', HaxNotification.CHAT);
	
					// Aggiorna il nickname nei vari database
					await playersDB.updateOne({ nickname: currentRequest.currentNick }, { $set: { nickname: currentRequest.requestedNick } });
					await adminsDB.updateOne({ nickname: currentRequest.currentNick }, { $set: { nickname: currentRequest.requestedNick } });
					await statsDB.updateOne({ nickname: currentRequest.currentNick }, { $set: { nickname: currentRequest.requestedNick } });
					await monthlystatsDB.updateMany({ nickname: currentRequest.currentNick }, { $set: { nickname: currentRequest.requestedNick } });
					await penaltiesDB.updateMany({ nickname: currentRequest.currentNick }, { $set: { nickname: currentRequest.requestedNick } });
					await bansDB.updateMany({ nickname: currentRequest.currentNick }, { $set: { nickname: currentRequest.requestedNick } });
	
					// Salva il log della richiesta accettata
					await nickRequestsDB.insertOne({
						currentNickname: currentRequest.currentNick,
						newNickname: currentRequest.requestedNick,
						status: "Accettato 🟢",
						motivation: currentRequest.motivation,
						handledBy: player.name,
						date: getFormattedDate()
					});
					room.sendAnnouncement(`Il nickname di ${currentRequest.playerName} è stato aggiornato nel database.`, player.id, null, 'bold', HaxNotification.CHAT);
				}
				else if (decision === 'Rifiuta') {
					room.sendAnnouncement(`La richiesta di ${currentRequest.playerName} è stata rifiutata.`, player.id, null, 'bold', HaxNotification.CHAT);
	
					// Salva il log della richiesta rifiutata
					await nickRequestsDB.insertOne({
						oldNickname: currentRequest.currentNick,
						requestedNickname: currentRequest.requestedNick,
						status: "Rifiutato 🔴",
						motivation: currentRequest.motivation,
						handledBy: player.name,
						date: getFormattedDate()
					});
				}
	
				// Rimuovi la richiesta da `changeRequests` e dal database `nicknameChangeRequestsDB`
				changeRequests.splice(requestIndex, 1);
				await nicknameChangeRequestsDB.deleteOne({ currentNick: currentRequest.currentNick, requestedNick: currentRequest.requestedNick });
	
			} else {
				room.sendAnnouncement(`Sezione non valida.`, player.id, null, 'bold', HaxNotification.CHAT);
			}
		}
	}
	
						
					


				
	

	/* HELPER COMMANDS */
	function restartCommand(player, message) {
		instantRestart();
	}

	function restartSwapCommand(player, message) {
		room.stopGame();
		swapButton();
		startTimeout = setTimeout(() => {
			room.startGame();
		}, 10);
	}

	function swapCommand(player, message) {
		if (playSituation == Situation.STOP) {
			swapButton();
			room.sendAnnouncement(
				'✔️ Squadre scambiate !',
				null,
				announcementColor,
				'bold',
				null
			);
		} else {
			room.sendAnnouncement(
				`Bisognerà stoppare la partita prima di scambiare le squadre.`,
				player.id,
				errorColor,
				'bold',
				HaxNotification.CHAT
			);
		}
	}
	/* ----------------------------------------- */


	/* MODERATOR COMMANDS */
	function stadiCommand(player, message) {
		let ALLSTADI = [
			{ name: "training" },
			{ name: "orange2v2"},
			{ name: "b&w3v3"}
    	]
    	let testo = "";
    	ALLSTADI.forEach(p => {
    		testo += "\n!"+p.name;
    	});

		room.sendAnnouncement(
			"LISTA STADI:"+testo,
			player.id,
			loginColor,
			'bold',
			HaxNotification.CHAT
		);
	}

	function stadiumCommand(player, message) {
		let msgArray = message.split(/ +/);
		room.setScoreLimit(scoreLimit);
		room.setTimeLimit(timeLimit);
		if (gameState == State.STOP) {
			//Se qualcuno scrive !stadio/!stadium, rimette lo stadio salvato nella VAR
			if (['!stadio'].includes(msgArray[0].toLowerCase()) || ['!stadium'].includes(msgArray[0].toLowerCase())) {
				stadiumCommand(emptyPlayer, `!${currentStadium}`);
			}
			else if (['!training'].includes(msgArray[0].toLowerCase())) {
				room.setScoreLimit(0);
				room.setTimeLimit(0);
				room.setCustomStadium(STTrai);
				currentStadium = 'training';
			}
			else if (['!orange2v2'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(ST2vs2);
				currentStadium = 'orange2v2';
			}
			else if (['!b&w3v3'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(ST3vs3);
				currentStadium = 'b&w3v3';
			} else {
				room.sendAnnouncement(
					`Stadio non esistente. usa !stadi per sapere la lista.`,
					player.id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
			}
		} else {
			room.sendAnnouncement(
				`Prima stoppa la partita per usare questo comando.`,
				player.id,
				errorColor,
				'bold',
				HaxNotification.CHAT
			);
		}
	}

	async function kickCommand(player, message) {
		let msgArray = message.split(/ +/).slice(1);
		if (msgArray.length > 0) {
			if (msgArray[0].length > 0 && msgArray[0][0] == '#') {
				msgArray[0] = msgArray[0].substring(1, msgArray[0].length);
				if (room.getPlayer(parseInt(msgArray[0])) != null) {
					let playerKick = room.getPlayer(parseInt(msgArray[0]));
					let motivo = `Kickato da ${player.name}`;
					if (msgArray.length > 1) {
						motivo = msgArray.slice(1).join(' ');
					}
					const rolePlayerKick = await getRole(playerKick);
					if (player.role >= rolePlayerKick) {
						room.kickPlayer(playerKick.id, motivo, false);
						room.sendAnnouncement(
							`${playerKick.name} è stato kickato, motivo: ${motivo}.`,
							null,
							announcementColor,
							'bold',
							HaxNotification.CHAT
						);
					} else {
						room.sendAnnouncement(
							`Non puoi kickare un ruolo più alto di te o admin.`,
							player.id,
							errorColor,
							'bold',
							HaxNotification.CHAT
						);
					}
				} else {
					room.sendAnnouncement(
						`Non c'è nessun giocatore con tale ID nella stanza. Inserisci "!help kick" per ulteriori informazioni.`,
						player.id,
						errorColor,
						'bold',
						HaxNotification.CHAT
					);
				}
			} else {
				room.sendAnnouncement(
					`Comando errato. Inserisci "!help kick" per ulteriori informazioni.`,
					player.id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
			}
		} else {
			room.sendAnnouncement(
				`Numero errato di argomenti. Inserisci "!help kick" per ulteriori informazioni.`,
				player.id,
				errorColor,
				'bold',
				HaxNotification.CHAT
			);
		}
	}

	async function warnListCommand(player, message) { //!warns #123
	  try {
	  	let msgArray = penaltiesPlayer = resultDB = undefined;
	  	let msg = "";
    	let playerWarns = new Object();

	  	if(message.substring(7,8) == '"' || message.substring(7,8) == "'"){
        	msgArray = message.split(message.substring(7,8)); // [0]->"!warns" [1]->"GIORGIO alla"
    		playerWarns.name = msgArray[1].trim();

    		resultDB = await playersDB.findOne({nickname: playerWarns.name});
    		if(resultDB == undefined || resultDB == null ) throw "Giocatore non esistente nel db";
    	}
        else if(message.substring(7,8) == "#"){
        	msgArray = message.split(" "); // [0]->"!warns" [1]->"#123"
        	playerWarns.id = msgArray[1].startsWith('#') ? msgArray[1].substring(1).trim() : msgArray[1].trim();
        	playerWarns = room.getPlayer(parseInt(playerWarns.id));
        	if(playerWarns==undefined || playerWarns==null) throw "Giocatore non esistente in room";

        	resultDB = await playersDB.findOne({nickname: playerWarns.name});
    		if(resultDB == undefined || resultDB == null ) throw "Giocatore non esistente nel db";
        }
        else {
        	playerWarns.name = player.name;
        }

	    // Verifica se il comando include un ID e il player è admin
        if (msgArray != undefined && player.role < Role.HELPER) {
          throw "Non hai i permessi per visualizzare le infrazioni di altri giocatori.";
        }

	    penaltiesPlayer = await penaltiesDB.findOne({ nickname: playerWarns.name });

	    if (penaltiesPlayer){
			msg= `Livello attuale di avvertimenti: ${penaltiesPlayer.levelWarn}/10\n\n`;
	    	if(penaltiesPlayer.infractions && penaltiesPlayer.infractions.length > 0) {
		      msg += "Infrazioni:\n";
		      penaltiesPlayer.infractions.forEach((infraction, index) => {
		        msg += `[${index + 1}] "${infraction.type}" - da "${infraction.infractionBy}" per "${infraction.reason}" [${new Date(infraction.date).toLocaleString()}]\n`;
		      });

		      // Mostra le ultime 5 infrazioni rimosse, se presenti
		      if (penaltiesPlayer.removedInfractions && penaltiesPlayer.removedInfractions.length > 0) {
		        const lastRemovedInfractions = penaltiesPlayer.removedInfractions.slice(-5); // Prende le ultime 5 infrazioni rimosse
		        msg += "\nUltime 5 infrazioni rimosse:\n";
		        lastRemovedInfractions.forEach((infraction, index) => {
		          msg += `[${index + 1}] "${infraction.type}" - da "${infraction.infractionBy}" per "${infraction.reason}" [${new Date(infraction.date).toLocaleString()}] Rimosso da: "${infraction.removedBy}" per: "${infraction.removeReason}" [${new Date(infraction.removeDate).toLocaleString()}]\n`;
		        });
		      }

		    }
		}else msg = "Nessuna infrazione trovata per questo giocatore.";


	    room.sendAnnouncement(msg, player.id, errorColor, "bold", 2);
	  } catch (err) {
	    writeLog("", "Errore durante il recupero delle infrazioni:"+ err, true);
	    room.sendAnnouncement(err, player.id, errorColor, "bold", 2);
	  }
	}

	async function warnCommand(player, message) { // !warn #123 Si fa autogoal
	  try {
	  	let msgArray = reason = penaltiesPlayer = resultDB = undefined;
	  	let msg = "";
    	let playerToWarn = new Object();

    	if(message.substring(6, 7) == '"' || message.substring(6, 7) == "'"){
        	msgArray = message.split(message.substring(6, 7)); // [0]->"!warn" [1]->"GIORGIO alla" [2]->"Si fa autogoal"
    		playerToWarn.name = msgArray[1].trim();

    		resultDB = await playersDB.findOne({nickname: playerToWarn.name});
    		if(resultDB == undefined || resultDB == null ) throw "Giocatore non esistente nel db";

    		playerToWarn.auth = resultDB.auth;
    		playerToWarn.connect = resultDB.connect;
    		playerToWarn.role = resultDB.role;

    		reason = msgArray[2].trim();
    	}
        else if(message.substring(6, 7) == "#"){
        	msgArray = message.split(" "); // [0]->"!warn" [1]->"#123" [2, 3, 4, ...]->"Si fa autogoal"
        	let playerID = msgArray[1].startsWith('#') ? msgArray[1].substring(1).trim() : msgArray[1].trim();
        	playerToWarn = room.getPlayer(parseInt(playerID));
        	if(playerToWarn==undefined || playerToWarn==null) throw "Giocatore non esistente in room";

        	resultDB = await playersDB.findOne({nickname: playerToWarn.name});
    		if(resultDB == undefined || resultDB == null ) throw "Giocatore non esistente nel db";

        	playerToWarn.auth = resultDB.auth;
        	playerToWarn.connect = resultDB.connect;
        	playerToWarn.role = resultDB.role;
        	reason = msgArray.slice(2).join(" ").trim();
        }
        else throw "Il formato del comando non è valido, immetti: '!help warn'";
        if(reason=="" || reason==undefined) throw "Motivo Warn obbligatorio. Per ulteriori informazioni, digitare !help warn";

	    penaltiesPlayer = await penaltiesDB.findOne({ nickname: playerToWarn.name });
	    
	    if (msg == "" && player.role > parseInt(playerToWarn.role)) {
	        if (penaltiesPlayer == undefined || penaltiesPlayer == null) penaltiesPlayer = createPenalties(playerToWarn);
	        let warnLevel = await checkWarn(playerToWarn, "WARN");
	        
	        // Gestione warn, muting e feedback
	        let warnMinutes = 0;
	        switch (warnLevel) {
	          case 1:
	          	warnMinutes = 5;
	          	break;
	          case 2:
	          	warnMinutes = 10;
	          	break;
	          case 3:
	            warnMinutes = 15;
	          	break;
	          case 4:
	          	warnMinutes = 30;
	            break;
	          case 5:
	            warnMinutes = 60;
	            break;
	          case 6:
	          	warnMinutes = 120;
	            break;
	          case 7:
	            warnMinutes = 720; //BAN TEMPORANEO 12h
	            break;
	          case 8:
	          	warnMinutes = 1440;//BAN TEMPORANEO 1gg
	            break;
	          case 9:
	            warnMinutes = 4320;//BAN TEMPORANEO 3gg
	            break;
	          case 10:
	            banCommand(player, "!ban \"" + playerToWarn.name + "\" Raggiunti 10 warn | PERMABAN");
	            msg = `⛔ ${playerToWarn.name} è stato bannato da ${player.name} per "${reason}".\nAvvertimenti: 10/10`;
	            // ... (codice per ban permanente)
	            break;
	          default:
	            warnMinutes = 0;
	            break;
	        }

	        const minutesMute = warnMinutes == 0 ? 'Non mutato' : warnMinutes == 60 ? 'un\'ora' : warnMinutes + ' minuti';
	        msg = `${warnLevel <= 0 ? "❗❗" : ""} ${playerToWarn.name} è stato ${warnLevel <= 0 ? "avvertito" : ("mutato per " + minutesMute)} da ${player.name} per "${reason}".\nAvvertimenti: ${warnLevel}/10`;

	        // ... (codice per aggiornare database penaltiesDB)
	        const newInfraction = {
				infractionID: infractionCount,
				type: "WARN",
				infractionBy: player.name,
				reason: `${reason} [${warnLevel}/10]`,
				date: Date.now()
			}
			const filter = { nickname: playerToWarn.name };
			const update = {
			  $push: { infractions: newInfraction },
			  $inc: { numberInfractions: 1 }
			};

			await penaltiesDB.updateOne(filter, update).then(() => {
				// ... (codice per inviare annuncio, webhook e log)
	        	room.sendAnnouncement(msg, null, announcementColor, 'bold', null);
			    
			    // Scrivi i log
			    writeLog("", msg, true);

			}).catch((err) => {
			  console.error("Errore warn durante l'aggiornamento del database:", err);
			  msg = `Errore durante l'aggiunta del warn.`;
			});

			// ... (codice per mutare il giocatore)
	        if (warnMinutes > 0) {
	        	let muteObj = await muteArray.getByAuth(playerToWarn.auth);
		  		if(muteObj != undefined && muteObj != null) muteObj.remove();
	        	muteObj = new MutePlayer(playerToWarn.name, infractionCount, playerToWarn.auth);
	        	muteObj.setDuration(warnMinutes);
	        }
	        infractionCount += 1;

	        // Invia un webhook
		    if (modWebhook != '') {
				let stringContent = `[${formatCurrentDate()}] ⚠️ WARN (${room.getPlayerList().length}/${maxPlayers})\n**${msg}**` +
					`[${playerToWarn.auth}] {${playerToWarn.connect}}`;
				fetch(modWebhook, {
					method: 'POST',
					body: JSON.stringify({
						content: stringContent,
						username: roomName,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				}).then((res) => res);
			}	        

	        return false;
	    } else {
	    	msg = "Non puoi avvertire un player con ruolo più alto del tuo.->"+player.role +"_"+ parseInt(playerToWarn.role);
	    }
	    room.sendAnnouncement(msg, player.id, errorColor, 'bold', HaxNotification.CHAT);
	  } catch (err) {
	    writeLog("", "[COMANDO WARN]:"+ err, true);
	    room.sendAnnouncement(err, player.id, errorColor, "bold", 2);
	  }
	}


	async function unwarnCommand(player, message) { // !unwarn #123 Ha chiesto scusa
	  try {
	  	let msgArray = reason = penaltiesPlayer = undefined;
    	let msg = "";
    	let playerToSwarn = new Object();

    	if(message.substring(8, 9) == '"' || message.substring(8, 9) == "'"){
        	msgArray = message.split(message.substring(8, 9)); // [0]->"!unwarn" [1]->"GIORGIO alla" [2]->"Ha chiesto scusa"
    		playerToSwarn.name = msgArray[1].trim();

    		let resultDB = await playersDB.findOne({nickname: playerToSwarn.name});
    		if(resultDB == undefined || resultDB == null ) throw "Giocatore non esistente nel db";

    		playerToSwarn.auth = resultDB.auth;
    		playerToSwarn.connect = resultDB.connect;
    		playerToSwarn.role = resultDB.role;
    		reason = msgArray[2].trim();
    	}
        else if(message.substring(8, 9) == "#"){
        	msgArray = message.split(" "); // [0]->"!unwarn" [1]->"#123" [2, 3, 4, ...]->"Ha chiesto scusa"
        	let playerID = msgArray[1].startsWith('#') ? msgArray[1].substring(1).trim() : msgArray[1].trim();

        	playerToSwarn = room.getPlayer(parseInt(playerID));
        	if(playerToSwarn==undefined || playerToSwarn==null) throw "Giocatore non esistente in room";

        	let resultDB = await playersDB.findOne({nickname: playerToSwarn.name});
    		if(resultDB == undefined || resultDB == null ) throw "Giocatore non esistente nel db";

        	playerToSwarn.auth = resultDB.auth;
        	playerToSwarn.connect = resultDB.connect;
        	playerToSwarn.role = await getRole(resultDB);
        	reason = msgArray.slice(2).join(" ").trim();
        }
        else throw "Il formato del comando non è valido, immetti: '!help unwarn'";
        if(reason=="" || reason==undefined) throw "Motivo Unwarn obbligatorio. Per ulteriori informazioni, digitare !help unwarn";
	    
	    penaltiesPlayer = await penaltiesDB.findOne({ nickname: playerToSwarn.name });
	    if (!penaltiesPlayer) throw "Il giocatore non ha infrazioni da rimuovere o il suo ID è cambiato, verifica con !warns."

	    let livello = parseInt(penaltiesPlayer.levelWarn);
		if (livello <= 0) {
			msg = `Il giocatore ${penaltiesPlayer.nickname} non ha infrazioni da rimuovere.`;
			room.sendAnnouncement(msg, player.id, errorColor, 'bold', HaxNotification.CHAT); // Mostra messaggio all’admin
			return; // Interrompe l'esecuzione se non ci sono infrazioni da rimuovere
		} else {
			// prendo ed elimino la prima infrazione dalla lista
			const firstInfraction = penaltiesPlayer.infractions[0];
			penaltiesPlayer.infractions.shift();
		
			// Modifica le proprietà di "firstInfraction"
			livello--;
			penaltiesPlayer.levelWarn = livello;
			firstInfraction.type = "UNWARN";
			firstInfraction.removedBy = player.name;
			firstInfraction.removeReason = reason;
			firstInfraction.removeDate = Date.now();
		
			// Aggiungo alla lista infrazioni Rimosse
			penaltiesPlayer.removedInfractions.push(firstInfraction);
		
			const filter = { nickname: penaltiesPlayer.nickname };
			const update = { $set: penaltiesPlayer };
		
			await penaltiesDB.updateOne(filter, update).then(() => {
				msg = `Un warn rimosso a ${penaltiesPlayer.nickname} da ${player.name} per "${reason}".\nAvvertimenti: ${livello}/10`;
				room.sendAnnouncement(msg, null, announcementColor, 'bold', HaxNotification.CHAT);
			}).catch((err) => {
				throw "Errore unwarn durante l'aggiornamento del database: " + err;
			});
		
			let muteObj = await muteArray.getByAuth(playerToSwarn.auth);
			if (muteObj != undefined && muteObj != null) muteObj.remove();
		
			// Invia un webhook
			if (modWebhook != '') {
				let stringContent = `[${formatCurrentDate()}] ⚠️✖️ UNWARN (${room.getPlayerList().length}/${maxPlayers})\n**${msg}**` +
					`[${playerToSwarn.auth}] {${playerToSwarn.connect}}`;
				fetch(modWebhook, {
					method: 'POST',
					body: JSON.stringify({
						content: stringContent,
						username: roomName,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				}).then((res) => res);
			}
		}
		
	  } catch (err) {
	    writeLog("", err, true);
	    room.sendAnnouncement(err, player.id, errorColor, 'bold', HaxNotification.CHAT);
	  }
	}

	async function readMutesCommand(player) {
		let msg = "", typeColor = errorColor;
		let thisAdmin = allAdmins.find(a => a.nickname == player.name);
	
		if (thisAdmin != undefined) {
			thisAdmin.readMutes = !thisAdmin.readMutes; // Inverti lo stato di `readMutes`
			if (thisAdmin.readMutes) msg = "Hai attivato la lettura dei messaggi dei player mutati.";
			else msg = "Hai disattivato la lettura dei messaggi dei player mutati.";
			
			// Aggiorna il database
			adminsDB.updateOne(
				{ nickname: thisAdmin.nickname, auth: thisAdmin.auth },
				{ $set: { readMutes: thisAdmin.readMutes } }
			);
			
			typeColor = announcementColor;
		} else {
			msg = "Errore imprevisto.";
		}
		
		room.sendAnnouncement(msg, player.id, typeColor, 'bold', HaxNotification.CHAT);
	}

	async function banListCommand(player, message) {
		try {
			// Recupera l'elenco dei giocatori bannati dal database in ordine decrescente per data di ban
			let bannedPlayers = await bansDB.find({}).sort({ date: -1 }).toArray();
	
			if (bannedPlayers && bannedPlayers.length > 0) {
				// Costruisci il messaggio con l'elenco dei giocatori bannati
				let msg = "📜 Giocatori bannati:\n";
				bannedPlayers.forEach(playersB => {
					msg += `${playersB.nickname} [ID: ${playersB.banID}] - Motivo: ${playersB.reason} - Da: ${playersB.bannedBy.name}\n`;
				});
				room.sendAnnouncement(msg, player.id, 0x00FF00, "bold", 2);
			} else {
				// Nessun giocatore bannato
				room.sendAnnouncement("📜 Nessun giocatore bannato.", player.id, 0x00FF00, "bold", 2);
			}
		} catch (err) {
			if (modWebhook != '') {
				let stringContent = `[${formatCurrentDate()}] 📜 LISTA-BAN (${message}) by ${player.name}\n**Errore nel comando di elenco ban: **` +
					err;
				fetch(modWebhook, {
					method: 'POST',
					body: JSON.stringify({
						content: stringContent,
						username: roomName,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				}).then((res) => res);
			}
			room.sendAnnouncement("Errore nel comando di elenco bannati: " + err, player.id, errorColor, "bold", 2);
		}
	}

	async function banCommand(player, message) { // !ban "GIORGIO alla" Perchè si || !ban #123 Perchè si
	    
	    let playerFromBan = new Object();
	    playerFromBan.id = null;
	    playerFromBan.name = "HaxZone🚓";
	    playerFromBan.role = 10;
	    if(player != null){
	    	playerFromBan.id = player.id;
	    	playerFromBan.name = player.name;
	    	playerFromBan.role = player.role;
	    }

	    try { /*!ban "2ms" Tossico, insulto allo staff, migliore amico di alexis
	    		Errore nel comando ban:TypeError: Cannot set properties of undefined (setting 'name')*/
	    	let msgArray = reason = resultDB = undefined;
	    	let playerToBan = new Object();

	    	if(message.substring(5, 6) == '"' || message.substring(5, 6) == "'"){
	        	msgArray = message.split(message.substring(5, 6)); // [0]->"!ban" [1]->"GIORGIO alla" [2]->"Perchè si"

	    		playerToBan = room.getPlayerList().find(a => a.name == msgArray[1].trim());
	    		if(playerToBan==undefined || playerToBan==null){
	    			playerToBan = new Object();
	    			playerToBan.name = msgArray[1].trim();

	    			resultDB = await playersDB.findOne({nickname: playerToBan.name});
		    		if(resultDB == undefined) throw "Giocatore non esistente in room e nè registrato";

		    		playerToBan.id = null;
		    		playerToBan.auth = resultDB.auth;
			    	playerToBan.connect = resultDB.connect;
			    	playerToBan.role = resultDB.role;
	    		}
	    		else{
		    		playerToBan.auth = authArray[playerToBan.id][0];
		    		playerToBan.connect = authArray[playerToBan.id][1];
		    		playerToBan.role = await getRole(playerToBan);
	    		}

	    		reason = msgArray[2].trim();
	    	}
	        else if(message.substring(5, 6) == "#"){
	        	msgArray = message.split(" "); // [0]->"!ban" [1]->"#123" [2, 3, 4, ...]->"Perchè si"
	        	let playerID = msgArray[1].startsWith('#') ? msgArray[1].substring(1).trim() : msgArray[1].trim();
	        	playerID = parseInt(playerID);

	        	playerToBan = room.getPlayer(playerID);
        		if(playerToBan==undefined || playerToBan==null) throw "Giocatore non esistente in room! Usa il nick se è registrato";

		    	playerToBan.auth = authArray[playerID][0];
		    	playerToBan.connect = authArray[playerID][1];
		    	playerToBan.role = await getRole(playerToBan);
	        	
	        	reason = msgArray.slice(2).join(" ").trim();
	        }
	        else throw "Il formato del comando ban non è valido, immetti: '!help ban' ";
            if(reason=="" || reason==undefined) throw "Motivo Warn obbligatorio. Per ulteriori informazioni, digitare !help warn";
	        
        	if (playerFromBan.role > parseInt(playerToBan.role)) {
	           	
	           	if(playerToBan.hasOwnProperty("id") && playerToBan.id != null){
		            room.kickPlayer(playerToBan.id, reason, true);
	           	}

	            // Registra il ban nel database
				await bansDB.insertOne({ nickname: playerToBan.name, real_nick: playerToBan.name, banID: playerToBan.id, auth: playerToBan.auth, connect: playerToBan.connect, reason: reason, bannedBy: playerFromBan, date: Date.now() })

	            // Invia un webhook
	            if (modWebhook != '') {
					let stringContent = `[${formatCurrentDate()}] 🚷 BAN (${room.getPlayerList().length}/${maxPlayers})\n**"${playerToBan.name}" è stato bannato per: ${reason}. Da ${playerFromBan.name}**` +
						`[${playerToBan.auth}] {${playerToBan.connect}}`;
					fetch(modWebhook, {
						method: 'POST',
						body: JSON.stringify({
							content: stringContent,
							username: roomName,
						}),
						headers: {
							'Content-Type': 'application/json',
						},
					}).then((res) => res);
				}

	            // Annuncia il ban nella chat del gioco
	            room.sendAnnouncement(`"${playerToBan.name}" è stato bannato per: ${reason}`, null, 0x00FF00, "bold", 2);

	            // Scrivi i log
	            writeLog("", "Giocatore bannato: "+playerToBan.name+", Motivo: "+reason, true);
	        } else {
	        	if(playerFromBan.id != null) room.sendAnnouncement("Giocatore non trovato o ha ruolo uguale/superiore al tuo.", playerFromBan.id, 0xFF0000, "bold", 2);
	        }
	    } catch (err) {
	    	writeLog("", "Errore:"+ err, true);
	        if (modWebhook != '') {
				let stringContent = `[${formatCurrentDate()}] 🚷 BAN (${message})by ${playerFromBan.name}\n**Errore nel comando di ban: **` +
					err;
				fetch(modWebhook, {
					method: 'POST',
					body: JSON.stringify({
						content: stringContent,
						username: roomName,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				}).then((res) => res);
			}
	        if(playerFromBan.id != null) room.sendAnnouncement("Errore: "+ err, playerFromBan.id, errorColor, "bold", 2);
	    }
	}

	async function unBanCommand(player, message) {
		try {
			let msgArray = banRecord = undefined;
			let playerToSban = new Object();
			let reason = "";
	
			// Controlla il formato del comando per ottenere il nome e il motivo
			if (message.substring(7, 8) == '"' || message.substring(7, 8) == "'") {
				msgArray = message.split(message.substring(7, 8)); // [0]->"!unban" [1]->"Nome Giocatore" [2]->"Motivo"
				playerToSban.name = msgArray[1].trim();
				reason = msgArray[2] ? msgArray[2].trim() : "Motivo non specificato";
	
				// Verifica nel database MongoDB se il giocatore è bannato
				banRecord = await bansDB.findOne({ nickname: playerToSban.name });
				if (!banRecord) throw "Il giocatore non risulta tra i bannati";
			} else {
				throw "Il formato del comando unban non è valido. Immetti: '!help unban'";
			}
	
			// Rimuovi i ban per tutti gli pseudonimi di quel giocatore
			let query = { $or: [{ "nickname": banRecord.nickname }, { "real_nick": banRecord.nickname }] };
			let allBansPlayer = await bansDB.find(query).toArray();
			for (let oneBansPlayer of allBansPlayer) {
				room.clearBan(parseInt(oneBansPlayer.banID));
			}
	
			if (banRecord) {
				// Rimuovi il giocatore dai database MongoDB
				const result = await bansDB.deleteMany(query);
	
				// Ottieni il numero di account sbloccati
				let unbanCount = result.deletedCount;
	
				// Annuncia la revoca del ban con il motivo nella chat del gioco
				room.sendAnnouncement(`I ban di "${banRecord.nickname}" sono stati revocati per ${unbanCount} account. Motivo: ${reason}`, null, 0x00FF00, "bold", 2);
	
				if (roomWebhook != '') {
					let stringContent = `[${formatCurrentDate()}] 🛂 UNBAN (${room.getPlayerList().length}/${maxPlayers})\nBan revocato per il giocatore: **"${banRecord.nickname}"** da ${player.name} per ${unbanCount} account. Motivo: ${reason}`;
					fetch(roomWebhook, {
						method: 'POST',
						body: JSON.stringify({
							content: stringContent,
							username: roomName,
						}),
						headers: {
							'Content-Type': 'application/json',
						},
					}).then((res) => res);
				}
	
				// Scrivi i log con il motivo dell’unban
				writeLog("", `Ban revocato per il giocatore: [${banRecord.nickname}] per ${reason}`, true);
			} else {
				room.sendAnnouncement("Giocatore non trovato o non bannato.", player.id, 0xFF0000, "bold", 2);
			}
		} catch (err) {
			writeLog("", "Errore: " + err, true);
			if (modWebhook != '') {
				let stringContent = `[${formatCurrentDate()}] 🛂 UNBAN (${message}) by ${player.name}\n**Errore nel comando di unBan: **` + err;
				fetch(modWebhook, {
					method: 'POST',
					body: JSON.stringify({
						content: stringContent,
						username: roomName,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				}).then((res) => res);
			}
			room.sendAnnouncement("Errore: " + err, player.id, errorColor, "bold", 2);
		}
	}

	/*function muteCommand(player, message) {
		let msgArray = message.split(/ +/).slice(1);
		if (msgArray.length > 0) {
			if (msgArray[0].length > 0 && msgArray[0][0] == '#') {
				msgArray[0] = msgArray[0].substring(1, msgArray[0].length);
				if (room.getPlayer(parseInt(msgArray[0])) != null) {
					let playerMute = room.getPlayer(parseInt(msgArray[0]));
					let minutesMute = muteDuration;
					if (msgArray.length > 1 && parseInt(msgArray[1]) > 0) {
						minutesMute = parseInt(msgArray[1]);
					}
					if (getRole(player) >= getRole(playerMute)) {
						let muteObj = new MutePlayer(playerMute.name, playerMute.id, playerMute.auth);
						muteObj.setDuration(minutesMute);
						room.sendAnnouncement(
							`${playerMute.name} è stato mutato per ${minutesMute} minuti.`,
							null,
							announcementColor,
							'bold',
							null
						);
					} else {
						room.sendAnnouncement(
							`Non puoi mutare un ruolo uguale o più alto del tuo.`,
							player.id,
							errorColor,
							'bold',
							HaxNotification.CHAT
						);
					}
				} else {
					room.sendAnnouncement(
						`Non c'è nessun giocatore con tale ID nella stanza. Inserisci "!help mute" per ulteriori informazioni.`,
						player.id,
						errorColor,
						'bold',
						HaxNotification.CHAT
					);
				}
			} else {
				room.sendAnnouncement(
					`Comando errato. Inserisci "!help mute" per ulteriori informazioni.`,
					player.id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
			}
		} else {
			room.sendAnnouncement(
				`Numero errato di argomenti. Inserisci "!help mute" per ulteriori informazioni.`,
				player.id,
				errorColor,
				'bold',
				HaxNotification.CHAT
			);
		}
	}

	function unmuteCommand(player, message) {
		let msgArray = message.split(/ +/).slice(1);
		if (msgArray.length > 0) {
			if (msgArray[0].length > 0 && msgArray[0][0] == '#') {
				msgArray[0] = msgArray[0].substring(1, msgArray[0].length);
				if (room.getPlayer(parseInt(msgArray[0])) != null) {
					let playerUnmute = room.getPlayer(parseInt(msgArray[0]));
					if (muteArray.getByPlayerId(playerUnmute.id) != null) {
						let muteObj = muteArray.getByPlayerId(playerUnmute.id);
						muteObj.remove()
						room.sendAnnouncement(
							`${playerUnmute.name} è stato smutato !`,
							null,
							announcementColor,
							'bold',
							HaxNotification.CHAT
						);
					} else {
						room.sendAnnouncement(
							`Questo giocatore non è mutato !`,
							player.id,
							errorColor,
							'bold',
							HaxNotification.CHAT
						);
					}
				} else {
					room.sendAnnouncement(
						`Non c'è nessun giocatore con questo ID nella stanza. Per ulteriori informazioni, digitare "!help unmute".`,
						player.id,
						errorColor,
						'bold',
						HaxNotification.CHAT
					);
				}
			} else if (msgArray[0].length > 0 && parseInt(msgArray[0]) > 0 && muteArray.getById(parseInt(msgArray[0])) != null) {
				let playerUnmute = muteArray.getById(parseInt(msgArray[0]));
				playerUnmute.remove();
				room.sendAnnouncement(
					`${playerUnmute.name} è stato smutato !`,
					null,
					announcementColor,
					'bold',
					HaxNotification.CHAT
				);
			} else {
				room.sendAnnouncement(
					`Comando errato. Digitare "!help unmute" per ulteriori informazioni.`,
					player.id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
			}
		} else {
			room.sendAnnouncement(
				`Numero errato di argomenti. Per ulteriori informazioni, digitate "!help unmute".`,
				player.id,
				errorColor,
				'bold',
				HaxNotification.CHAT
			);
		}
	}*/

	function muteListCommand(player, message) {
		if (muteArray.list.length == 0) {
			room.sendAnnouncement(
				"🔇 Non c'è nessuno nella lista dei mutati.",
				player.id,
				announcementColor,
				'bold',
				null
			);
			return false;
		}
		let cstm = '🔇 Lista mutati:';
		for (let mute of muteArray.list) {
			cstm += `\n${mute.name}`; // Solo il nome del giocatore
		}
		room.sendAnnouncement(
			cstm,
			player.id,
			announcementColor,
			'bold',
			null
		);
	}
	/* ----------------------------------------------- */

/* ADMIN COMMANDS */
async function setRoleCommand(player, message) {
	try {
		// Estrarre i parametri dal messaggio
		const args = message.match(/"([^"]+)"\s+"(\d+)"\s+(.+)/);
		if (!args || args.length < 4) {
			throw "Formato comando non valido. Usa: !setrole \"nickname player\" \"numero nuovo ruolo\" motivazione";
		}

		const [_, targetNickname, newRoleStr, reason] = args;
		const newRole = parseInt(newRoleStr, 10);

		// Controllo per evitare che un admin modifichi il proprio ruolo
		if (targetNickname === player.name) {
			throw "Non puoi modificare il tuo stesso ruolo.";
		}

		// Validare il numero del ruolo
		if (isNaN(newRole) || newRole < 1 || newRole > 9) {
			throw "Numero del ruolo non valido. Usa un numero da 1 a 9.";
		}

		// Ricavare la stringa del ruolo in base al nuovo ruolo
		const roleStrings = ["", "👤", "🔒", "🟨", "⛑️", "🪖", "🎩", "🔒", "👨‍💻", "🔑"];
		const newRoleString = roleStrings[newRole];

		// Verificare che il giocatore esista nei database
		const targetPlayer = await playersDB.findOne({ nickname: targetNickname });
		if (!targetPlayer) {
			throw `Giocatore "${targetNickname}" non trovato nel database.`;
		}

		// Salvare ruolo e stringa del ruolo precedenti
		const previousRole = targetPlayer.role;
		const previousRoleString = targetPlayer.roleString;

		// Aggiornare ruolo e stringa del ruolo nel database playersDB
		await playersDB.updateOne(
			{ nickname: targetNickname },
			{ $set: { role: newRole, roleString: newRoleString } }
		);

		// Se il nuovo ruolo è tra 4 e 9
		let roomPlayer = room.getPlayerList().find(p => p.name === targetNickname);
		if (newRole >= 4 && newRole <= 9) {
			if (roomPlayer) room.setPlayerAdmin(roomPlayer.id, true); // Assegna admin in stanza

			// Verifica se esiste già in adminsDB
			const adminRecord = await adminsDB.findOne({ nickname: targetNickname });
			if (!adminRecord) {
				// Inserisce un nuovo documento se non esiste già
				await adminsDB.insertOne({
					auth: targetPlayer.auth,
					nickname: targetNickname,
					role: newRole,
					readMutes: true
				});
			} else {
				// Aggiorna solo il role se il record esiste già
				await adminsDB.updateOne(
					{ nickname: targetNickname },
					{ $set: { role: newRole } }
				);
			}
		}
		// Se il nuovo ruolo è tra 1 e 3
		else if (newRole >= 1 && newRole <= 3) {
			if (roomPlayer) room.setPlayerAdmin(roomPlayer.id, false); // Rimuove admin in stanza
			// Cancella l'utente da adminsDB se era un admin
			await adminsDB.deleteOne({ nickname: targetNickname });
		}

		// Inserire il log del cambio ruolo in PlayersRoles
		await playersRolesDB.insertOne({
			date: new Date(),                
			setBy: player.name,              
			targetPlayer: targetNickname,    
			previousRole: previousRole,      
			newRole: newRole,                
			previousRoleString: previousRoleString,
			newRoleString: newRoleString,
			reason: reason                   
		});

		// Notificare l'avvenuto cambio di ruolo
		let msg = `Il ruolo di "${targetNickname}" è stato aggiornato a "${newRoleString}" da ${player.name} per il motivo: "${reason}".`;
		room.sendAnnouncement(msg, null, announcementColor, "bold", 2);
		

		// Log e webhook
		writeLog("", msg, true);
		if (modWebhook != "") {
			let stringContent = `[${formatCurrentDate()}] 🛡️ SETROLE\n${msg}`;
			fetch(modWebhook, {
				method: "POST",
				body: JSON.stringify({ content: stringContent, username: roomName }),
				headers: { "Content-Type": "application/json" },
			}).then((res) => res);
		}
	} catch (err) {
		room.sendAnnouncement(`Errore: ${err}`, player.id, errorColor, "bold", 2);
		writeLog("", `Errore setRoleCommand: ${err}`, true);
	}
}




	function passwordCommand(player, message) {
		let msgArray = message.split(/ +/).slice(1);
		if (msgArray.length > 0) {
			if (msgArray.length == 1 && msgArray[0] == '') {
				roomPassword = '';
				room.setPassword(null);
				room.sendAnnouncement(
					`La password della stanza è stata rimossa.`,
					player.id,
					announcementColor,
					'bold',
					HaxNotification.CHAT
				);
			}
			roomPassword = msgArray.join(' ');
			room.setPassword(roomPassword);
			room.sendAnnouncement(
				`La password per entrare in room adesso è:  ${roomPassword}`,
				player.id,
				announcementColor,
				'bold',
				HaxNotification.CHAT
			);
		} else {
			if (roomPassword != '') {
				roomPassword = '';
				room.setPassword(null);
				room.sendAnnouncement(
					`La password per entrare in room è stata rimossa.`,
					player.id,
					announcementColor,
					'bold',
					HaxNotification.CHAT
				);
			} else {
				room.sendAnnouncement(
					`Errore cambio room password. Per ulteriori informazioni, digitare "!help password".`,
					player.id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
			}
		}
	}
	/* ------------------------------------------------------- */


	/* FOUNDER COMMANDS*/
	async function clearBansCommand(player, message) {
	    try {
	        // Rimuovi tutti i record di ban dai database MongoDB
	        await bansDB.deleteMany({});

	        // Revoca tutti i ban nel gioco
	        room.clearBans();

	        // Annuncia la revoca dei ban nella chat del gioco
	        room.sendAnnouncement(`👮🏻 Tutti i ban sono stati revocati`, null, announcementColor, "bold", 2);

	        if (modWebhook != '') {
	            let stringContent = `[${formatCurrentDate()}] 👮🏻 CLEAR-BANS \n**${message}) by ${player.name} **`;
	            fetch(modWebhook, {
	                method: 'POST',
	                body: JSON.stringify({
	                    content: stringContent,
	                    username: roomName,
	                }),
	                headers: {
	                    'Content-Type': 'application/json',
	                },
	            }).then((res) => res);
	        }

	        // Scrivi i log
	        writeLog("", "Tutti i ban sono stati revocati by" + player.name, true);

	    } catch (err) {
	        console.error("Errore nel comando clearBans:", err);
	        if (modWebhook != '') {
	            let stringContent = `[${formatCurrentDate()}] 👮🏻 CLEAR-BANS (${message}) by ${player.name}\n**Errore nel comando di clearBans: **` +
	                err;
	            fetch(modWebhook, {
	                method: 'POST',
	                body: JSON.stringify({
	                    content: stringContent,
	                    username: roomName,
	                }),
	                headers: {
	                    'Content-Type': 'application/json',
	                },
	            }).then((res) => res);
	        }
	        room.sendAnnouncement("Errore nel comando di revoca di tutti i ban.", player.id, 0xFF0000, "bold", 2);
	    }
	}
	/* --------------------------------------- */


	/* GAME FUNCTIONS */
	function checkTime() {
		const scores = room.getScores();
		if (game != undefined) game.scores = scores;
		if (Math.abs(scores.time - scores.timeLimit) <= 0.01 && scores.timeLimit != 0 && playSituation == Situation.PLAY) {
			if (scores.red != scores.blue) {
				if (!checkTimeVariable) {
					checkTimeVariable = true;
					setTimeout(() => {
						checkTimeVariable = false;
					}, 3000);
					scores.red > scores.blue ? endGame(Team.RED) : endGame(Team.BLUE);
					stopTimeout = setTimeout(() => {
						room.stopGame();
					}, 2000);
				}
				return;
			}
			if (drawTimeLimit != 0) {
				goldenGoal = true;
				room.sendAnnouncement(
					'⚽ Il primo che segna vince !',
					null,
					announcementColor,
					'bold',
					HaxNotification.CHAT
				);
			}
		}
		if (Math.abs(scores.time - drawTimeLimit * 60 - scores.timeLimit) <= 0.01 && scores.timeLimit != 0) {
			if (!checkTimeVariable) {
				checkTimeVariable = true;
				setTimeout(() => {
					checkTimeVariable = false;
				}, 10);
				endGame(Team.SPECTATORS);
				room.stopGame();
				goldenGoal = false;
			}
		}
	}

	function instantRestart() {
		room.stopGame();
		startTimeout = setTimeout(() => {
			room.startGame();
		}, 10);
	}

	function resumeGame() {
		startTimeout = setTimeout(() => {
			room.startGame();
		}, 1000);
		setTimeout(() => {
			room.pauseGame(false);
		}, 500);
	}

	function endGame(winner) {
		if (players.length >= 2 * teamSize - 1) activateChooseMode()
		const scores = room.getScores()
		let msg = "", findEvent = undefined
		game.scores = scores
		lastWinner = winner
		endGameVariable = true
		if (rageQuitCheck && playerLeft != undefined) { // SE C'è STATO UN QUIT, SISTEMA UN ATTIMO LE SQUADRE PER I CALCOLI
			if (winner == Team.RED) teamBlue.push({ name: playerLeft.name, id: playerLeft.id })
			else if (winner == Team.BLUE) teamRed.push({ name: playerLeft.name, id: playerLeft.id })
		}
		if (teamRed.length == 3 && teamBlue.length == 3) { // SE LE SQUADRE SONO APPOSTO:
			const dateMatch = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }))
			if (streak == 0) { // Se la streak non esiste la crea E INIZIALIZZA LE LISTE E VARIABILI
				streak = 1
				lastStreakGame = undefined
				startStreak = dateMatch
				endStreak = undefined
				infoStreak = []
				teamStreak = []
				lastTeam = []
				if (winner == Team.RED) {
					teamRed.forEach(a => { teamStreak.push({ nickname: a.name, auth: authArray[a.id][0] }); lastTeam.push({ nickname: a.name, auth: authArray[a.id][0]}); infoStreak.push({ nickname: a.name, auth: authArray[a.id][0], count: 1, return_count: 0, IsTeamStreak: true }) })
					room.sendAnnouncement(`✨ La squadra Red ha vinto ${scores.red} - ${scores.blue}! Streak: ${streak}`, null, redColor, 'bold', HaxNotification.CHAT)
				} else {
					teamBlue.forEach(a => { teamStreak.push({ nickname: a.name, auth: authArray[a.id][0] }); lastTeam.push({ nickname: a.name, auth: authArray[a.id][0] }); infoStreak.push({ nickname: a.name, auth: authArray[a.id][0], count: 1, return_count: 0, IsTeamStreak: true }) })
					room.sendAnnouncement(`✨ La squadra Blu ha vinto ${scores.blue} - ${scores.red}! Streak: ${streak}`, null, blueColor, 'bold', HaxNotification.CHAT)
				}
			} else if (winner == Team.RED) { // SE LA STREAK ESISTE E VINCONO I ROSSI
				// questa parte elimina i giocatori che erano in streak e non sono più in team
				teamStreak.forEach(a => { 
					if (teamRed.findIndex(b => b.name == a.nickname && authArray[b.id][0] == a.auth) == -1)
						teamStreak = teamStreak.filter(c => c.nickname != a.nickname && c.auth != a.auth) 
				})
				if (teamStreak.length > 0 && streak > 0) { // se rimangono ancora persone con una streak in corso
					streak++
					lastStreakGame = game
					// aggiunge il count streak e leva le persone non più in last team
					teamStreak.forEach(a => {
						const el = infoStreak.find(b => b.nickname == a.nickname && b.auth == a.auth && b.return_count == 0)
						if (el != undefined) el.count = el.count + 1
						lastTeam = lastTeam.filter(b => b.nickname != a.nickname && b.auth != a.auth)
					})
					// incrementa il count e aggiunge i possibili nuovi player dicendo che sono entrati a streak in corso
					teamRed.forEach(a => {
						const els = infoStreak.filter(b => b.nickname == a.name && b.auth == authArray[a.id][0])
						let maxRC = 0, el = undefined
						if (els.length > 0) {
							els.forEach(b => { if (b.return_count > maxRC) maxRC = b.return_count })
							el = infoStreak.find(b => b.nickname == a.name && b.auth == authArray[a.id][0] && b.return_count == maxRC)
						}
						if (el != undefined) {
							if (lastTeam.findIndex(b => b.nickname == el.nickname && b.auth == el.auth) == -1 && teamStreak.findIndex(b => b.nickname == el.nickname && b.auth == el.auth) == -1)
								infoStreak.push({ nickname: el.nickname, auth: el.auth, count: 1, return_count: maxRC + 1, IsTeamStreak: false })
							else if (teamStreak.findIndex(b => b.nickname == el.nickname && b.auth == el.auth) == -1) el.count = el.count + 1
						}
						else infoStreak.push({ nickname: a.name, auth: authArray[a.id][0], count: 1, return_count: 0, IsTeamStreak: false })
					})
				} else { // La streak si è interrotta, Abbandono del team iniziale
					let reason = ""
					if (teamStreak.length == 0) {
						reason = "Abbandono del team iniziale"
						msg = `🥲 Non è rimasto nessun player del team iniziale. La streak si è interrotta!`
					}

					endStreak = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }))
					if (streak >= 10) postStreak(reason)
					streak = 1
					startStreak = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }))
					endStreak = undefined
					infoStreak = []
					teamStreak = []
					teamRed.forEach(a => { teamStreak.push({ nickname: a.name, auth: authArray[a.id][0] }); infoStreak.push({ nickname: a.name, auth: authArray[a.id][0], count: 1, return_count: 0, IsTeamStreak: true }) })
				}
				room.sendAnnouncement(`✨ La squadra Red ha vinto ${scores.red} - ${scores.blue}! Streak: ${streak}`, null, redColor, 'bold', HaxNotification.CHAT)
				lastTeam = []
				teamRed.forEach(a => lastTeam.push({ nickname: a.name, auth: authArray[a.id][0] }))
			} else if (winner == Team.BLUE) { // se vince la squadra di destra interrompendo la streak
				let reason = "Sconfitti da: "
				teamBlue.forEach((a, i) => {
					if (i < 2) reason += a.name + ", "
					else reason = reason.substring(0, reason.length - 2) + " e " + a.name
				})

				endStreak = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }))
				if (streak >= 10) postStreak(reason)
				streak = 1
				startStreak = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }))
				endStreak = undefined
				room.sendAnnouncement(`✨ La squadra Blu ha vinto ${scores.blue} - ${scores.red}! Streak: ${streak}`, null, blueColor, 'bold', HaxNotification.CHAT)
				infoStreak = []
				teamStreak = []
				lastTeam = []
				teamBlue.forEach(a => { teamStreak.push({ nickname: a.name, auth: authArray[a.id][0] }); lastTeam.push({ nickname: a.name, auth: authArray[a.id][0] }); infoStreak.push({ nickname: a.name, auth: authArray[a.id][0], count: 1, return_count: 0, IsTeamStreak: true }) })
			} else {
				streak = 0
				room.sendAnnouncement('💤 Limite di estrazione raggiunto!', null, announcementColor, 'bold', HaxNotification.CHAT)
			}
		} else {
			if (streak > 0) {
				let reason = "Partita terminata in 2v2 o 1v1"
				msg = `🥲La streak si è interrotta!`

				endStreak = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }))
				if (streak >= 10) postStreak(reason)
				startStreak = undefined
				endStreak = undefined
				infoStreak = []
				teamStreak = []
			}
			if (winner == Team.RED) room.sendAnnouncement(`✨ La squadra Red ha vinto ${scores.red} - ${scores.blue}!`, null, redColor, 'bold', HaxNotification.CHAT)
			else if (winner == Team.BLUE) room.sendAnnouncement(`✨ La squadra Blu ha vinto ${scores.blue} - ${scores.red}!`, null, blueColor, 'bold', HaxNotification.CHAT)
			else room.sendAnnouncement('💤 Limite di estrazione raggiunto!', null, announcementColor, 'bold', HaxNotification.CHAT)
			streak = 0
			if (teamRed.length == 2 && teamBlue.length == 2) {
				/*if (winner == Team.RED && !debugMode) updatePlayerRanks(teamRed, teamBlue, 2, Team.RED)
				else if (winner == Team.BLUE && !debugMode) updatePlayerRanks(teamBlue, teamRed, 2, Team.BLUE)*/
			}
		}
		if (rageQuitCheck && playerLeft != undefined) {
			if (winner == Team.RED) teamBlue = teamBlue.filter(a => a.name != playerLeft.name && a.id != playerLeft.id)
			else if (winner == Team.BLUE) teamRed = teamRed.filter(a => a.name != playerLeft.name && a.id != playerLeft.id)
			playerLeft = undefined
		}
		let possessionRedPct = (possession[0] / (possession[0] + possession[1])) * 100
		let possessionBluePct = 100 - possessionRedPct
		let possessionString = `🔶 ${possessionRedPct.toFixed(0)}% - ${possessionBluePct.toFixed(0)}% 🔷`
		let actionRedPct = (actionZoneHalf[0] / (actionZoneHalf[0] + actionZoneHalf[1])) * 100
		let actionBluePct = 100 - actionRedPct
		let actionString = `🔶 ${actionRedPct.toFixed(0)}% - ${actionBluePct.toFixed(0)}% 🔷`
		let CSString = getCSString(scores)
		room.sendAnnouncement(`📊 Possesso: ${possessionString}\n📊 Zona d'azione: ${actionString}\n${CSString}`, null, announcementColor, 'bold', HaxNotification.NONE)
		
		/*if (findEvent != undefined) {
			if (findEvent.total_game == findEvent.first_goal) msg = `🔓 Primo obbiettivo dell'evento ${findEvent.name} raggiunto! Potrete vincere i premi a fine evento`
			else if (findEvent.total_game == findEvent.second_goal) msg = `🔓 Secondo obbiettivo dell'evento ${findEvent.name} raggiunto! Potrete vincere i RP a fine evento`
		}*/
		if (msg != "") room.sendAnnouncement(msg, null, announcementColor, 'bold', HaxNotification.CHAT)
		if (!debugMode) updateStats()
	}


	/* CHOOSING FUNCTIONS */
	function activateChooseMode() {
		chooseMode = true;
		slowMode = chooseModeSlowMode;
		/*room.sendAnnouncement(`🐢 La modalità lenta è attiva a [${chooseModeSlowMode}s].`, null, announcementColor, 'bold', HaxNotification.CHAT);*/
	}

	function deactivateChooseMode() {
		chooseMode = false;
		clearTimeout(timeOutCap);
		if (slowMode != defaultSlowMode) {
			slowMode = defaultSlowMode;
			/*room.sendAnnouncement(`🐢 La modalità lenta è tornata a [${defaultSlowMode}s].`, null, announcementColor, 'bold', HaxNotification.CHAT);*/
		}
		redCaptainChoice = '';
		blueCaptainChoice = '';
	}

	function getSpecList(player) {
		if (player == null) return null;
		let cstm = 'Giocatori : ';
		for (let i = 0; i < teamSpec.length; i++) {
			cstm += teamSpec[i].name + `[${i + 1}], `;
		}
		cstm = cstm.substring(0, cstm.length - 2) + '.';
		room.sendAnnouncement(
			cstm,
			player.id,
			infoColor,
			'bold',
			HaxNotification.CHAT
		);
	}

	function choosePlayer() {
		clearTimeout(timeOutCap);
		let captain;
		if (teamRed.length <= teamBlue.length && teamRed.length != 0) {
			captain = teamRed[0];
		} else if (teamBlue.length < teamRed.length && teamBlue.length != 0) {
			captain = teamBlue[0];
		}
		if (captain != null) {
			room.sendAnnouncement(
				"Per scegliere un giocatore, inserire il suo numero dalla Lista o usare 'top', 'random' o 'bottom'.",
				captain.id,
				infoColor,
				'bold',
				HaxNotification.MENTION
			);
			timeOutCap = setTimeout(
				(player) => {
					room.sendAnnouncement(
						`Sbrigati ${player.name}, manca solo ${Number.parseInt(String(chooseTime / 2))} secondi per scegliere !`,
						player.id,
						warningColor,
						'bold',
						HaxNotification.MENTION
					);
					timeOutCap = setTimeout(
						(player) => {
							afkCommand(player, "AfkAutomaticoSeFermoInCampo");
							room.sendAnnouncement(
								`La prossima volta sbrigati a scegliere !`,
								player.id,
								warningColor,
								'bold',
								HaxNotification.MENTION
							);
							/*room.kickPlayer(
								player.id,
								"La prossima volta sbrigati a scegliere !",
								false
							);*/
						},
						chooseTime * 500,
						captain
					);
				},
				chooseTime * 1000,
				captain
			);
		}
		if (teamRed.length != 0 && teamBlue.length != 0) {
			getSpecList(teamRed.length <= teamBlue.length ? teamRed[0] : teamBlue[0]);
		}
	}

	function chooseModeFunction(player, message) {
		let msgArray = message.split(/ +/);
		if (player.id == teamRed[0].id || player.id == teamBlue[0].id) {
			if (teamRed.length <= teamBlue.length && player.id == teamRed[0].id) {
				if (['top', 'auto'].includes(msgArray[0].toLowerCase())) {
					if (teamSpec[0] != undefined) {
						room.setPlayerTeam(teamSpec[0].id, Team.RED);
						redCaptainChoice = 'top';
						clearTimeout(timeOutCap);
						room.sendAnnouncement(
							`${player.name} ha scelto i primi !`,
							null,
							announcementColor,
							'bold',
							HaxNotification.CHAT
						);
					}
				} else if (['random', 'rand'].includes(msgArray[0].toLowerCase())) {
					let r = getRandomInt(teamSpec.length);
					if (teamSpec[r] != undefined) {
						room.setPlayerTeam(teamSpec[r].id, Team.RED);
						redCaptainChoice = 'random';
						clearTimeout(timeOutCap);
						room.sendAnnouncement(
							`${player.name} ha scelto Random !`,
							null,
							announcementColor,
							'bold',
							HaxNotification.CHAT
						);
					}
				} else if (['bottom', 'bot'].includes(msgArray[0].toLowerCase())) {
					if (teamSpec[teamSpec.length - 1] != undefined) {
						room.setPlayerTeam(teamSpec[teamSpec.length - 1].id, Team.RED);
						redCaptainChoice = 'bottom';
						clearTimeout(timeOutCap);
						room.sendAnnouncement(
							`${player.name} ha scelto gli ultimi !`,
							null,
							announcementColor,
							'bold',
							HaxNotification.CHAT
						);
					}
				} else if (!Number.isNaN(Number.parseInt(msgArray[0]))) {
					if (Number.parseInt(msgArray[0]) > teamSpec.length || Number.parseInt(msgArray[0]) < 1) {
						room.sendAnnouncement(
							`Il numero non è valido !`,
							player.id,
							errorColor,
							'bold',
							HaxNotification.CHAT
						);
					} else {
						if (teamSpec[Number.parseInt(msgArray[0]) - 1] != undefined) {
							room.setPlayerTeam(teamSpec[Number.parseInt(msgArray[0]) - 1].id, Team.RED);
							room.sendAnnouncement(
								`${player.name} ha scelto ${teamSpec[Number.parseInt(msgArray[0]) - 1].name} !`,
								null,
								announcementColor,
								'bold',
								HaxNotification.CHAT
							);
						}
					}
				} else return false;
				return true;
			}
			if (teamRed.length > teamBlue.length && player.id == teamBlue[0].id) {
				if (['top', 'auto'].includes(msgArray[0].toLowerCase())) {
					if (teamSpec[0] != undefined) {
						room.setPlayerTeam(teamSpec[0].id, Team.BLUE);
						blueCaptainChoice = 'top';
						clearTimeout(timeOutCap);
						room.sendAnnouncement(
							`${player.name} ha scelto i primi !`,
							null,
							announcementColor,
							'bold',
							HaxNotification.CHAT
						);
					}
				} else if (['random', 'rand'].includes(msgArray[0].toLowerCase())) {
					const r = getRandomInt(teamSpec.length)
					if (teamSpec[r] != undefined) {
						room.setPlayerTeam(teamSpec[r].id, Team.BLUE);
						blueCaptainChoice = 'random';
						clearTimeout(timeOutCap);
						room.sendAnnouncement(
							`${player.name} ha scelto Random !`,
							null,
							announcementColor,
							'bold',
							HaxNotification.CHAT
						);
					}
				} else if (['bottom', 'bot'].includes(msgArray[0].toLowerCase())) {
					if (teamSpec[teamSpec.length - 1] != undefined) {
						room.setPlayerTeam(teamSpec[teamSpec.length - 1].id, Team.BLUE);
						blueCaptainChoice = 'bottom';
						clearTimeout(timeOutCap);
						room.sendAnnouncement(
							`${player.name} ha scelto gli ultimi !`,
							null,
							announcementColor,
							'bold',
							HaxNotification.CHAT
						);
					}
				} else if (!Number.isNaN(Number.parseInt(msgArray[0]))) {
					if (Number.parseInt(msgArray[0]) > teamSpec.length || Number.parseInt(msgArray[0]) < 1) {
						room.sendAnnouncement(
							`Il numero non è valido !`,
							player.id,
							errorColor,
							'bold',
							HaxNotification.CHAT
						);
					} else {
						if (teamSpec[Number.parseInt(msgArray[0]) - 1] != undefined) {
							room.setPlayerTeam(teamSpec[Number.parseInt(msgArray[0]) - 1].id, Team.BLUE);
							room.sendAnnouncement(
								`${player.name} ha scelto ${teamSpec[Number.parseInt(msgArray[0]) - 1].name} !`,
								null,
								announcementColor,
								'bold',
								HaxNotification.CHAT
							);
						}
					}
				} else return false;
				return true;
			}
		}
	}

	function checkCaptainLeave(player) {
		if (
			(teamRed.findIndex((red) => red.id == player.id) == 0 && chooseMode && teamRed.length <= teamBlue.length) ||
			(teamBlue.findIndex((blue) => blue.id == player.id) == 0 && chooseMode && teamBlue.length < teamRed.length)
		) {
			choosePlayer();
			capLeft = true;
			setTimeout(() => {
				capLeft = false;
			}, 10);
		}
	}

	function slowModeFunction(player, message) {
		if (!player.admin) {
			if (!SMSet.has(player.id)) {
				SMSet.add(player.id);
				setTimeout(
					(number) => {
						SMSet.delete(number);
					},
					slowMode * 1000,
					player.id
				);
			} else {
				return true;
			}
		}
		return false;
	}

	/* PLAYER FUNCTIONS */

	function updateTeams() {
		playersAll = room.getPlayerList();
		players = playersAll.filter((p) => !AFKSet.has(p.id));
		teamRed = players.filter((p) => p.team == Team.RED);
		teamBlue = players.filter((p) => p.team == Team.BLUE);
		teamSpec = players.filter((p) => p.team == Team.SPECTATORS);
	}

	async function getRole(player) {
		if(player != undefined){
			const thisPlayer = await playersDB.findOne({nickname: player.name});
			if (thisPlayer != undefined) return thisPlayer.role
		}
		
		return Role.GUEST
	}

	function ghostKickHandle(oldP, newP) {
		let teamArrayId = getTeamArray(oldP.team, true).map((p) => p.id);
		teamArrayId.splice(teamArrayId.findIndex((id) => id == oldP.id), 1, newP.id);

		room.kickPlayer(oldP.id, 'Ghost kick', false);
		room.setPlayerTeam(newP.id, oldP.team);
		room.setPlayerAdmin(newP.id, oldP.admin);
		room.reorderPlayers(teamArrayId, true);

		if (oldP.team != Team.SPECTATORS && playSituation != Situation.STOP) {
			let discProp = room.getPlayerDiscProperties(oldP.id);
			room.setPlayerDiscProperties(newP.id, discProp);
		}
	}

	/* ACTIVITY FUNCTIONS */

	function handleActivityPlayer(player) {
		let pComp = getPlayerComp(player);
		if (pComp != null) {
			pComp.inactivityTicks++;
			if (pComp.inactivityTicks == 60 * ((2 / 3) * afkLimit)) {
				room.sendAnnouncement(
					`⛔ ${player.name}, se non ti muovi o non invii un messaggio nei prossimi ${Math.floor(afkLimit / 3)} secondi, sarai kickato !`,
					player.id,
					warningColor,
					'bold',
					HaxNotification.MENTION
				);
				return;
			}
			if (pComp.inactivityTicks >= 60 * afkLimit) {
				pComp.inactivityTicks = 0;
				if (game.scores.time <= afkLimit - 0.5) {
					setTimeout(() => {
						!chooseMode ? instantRestart() : room.stopGame();
					}, 10);
				}
				afkCommand(player, "AfkAutomaticoSeFermoInCampo");//room.kickPlayer(player.id, 'AFK', false);
			}
		}
	}

	function handleActivityPlayerTeamChange(changedPlayer) {
		if (changedPlayer.team == Team.SPECTATORS) {
			let pComp = getPlayerComp(changedPlayer);
			if (pComp != null) pComp.inactivityTicks = 0;
		}
	}

	function handleActivityStop() {
		for (let player of players) {
			let pComp = getPlayerComp(player);
			if (pComp != null) pComp.inactivityTicks = 0;
		}
	}

	function handleActivity() {
		if (gameState === State.PLAY && players.length > 1) {
			for (let player of teamRed) {
				handleActivityPlayer(player);
			}
			for (let player of teamBlue) {
				handleActivityPlayer(player);
			}
		}
	}

	/* LINEUP FUNCTIONS */

	function getStartingLineups() {
		let compositions = [[], []];
		for (let player of teamRed) {
			compositions[0].push(
				new PlayerComposition(player, authArray[player.id][0], [0], [])
			);
		}
		for (let player of teamBlue) {
			compositions[1].push(
				new PlayerComposition(player, authArray[player.id][0], [0], [])
			);
		}
		return compositions;
	}

	function handleLineupChangeTeamChange(changedPlayer) {
		if (gameState != State.STOP) {
			let playerLineup;
			if (changedPlayer.team == Team.RED) {
				// player gets in red team
				let redLineupAuth = game.playerComp[0].map((p) => p.auth);
				let ind = redLineupAuth.findIndex((auth) => auth == authArray[changedPlayer.id][0]);
				if (ind != -1) {
					// Player goes back in
					playerLineup = game.playerComp[0][ind];
					if (playerLineup.timeExit.includes(game.scores.time)) {
						// gets subbed off then in at the exact same time -> no sub
						playerLineup.timeExit = playerLineup.timeExit.filter((t) => t != game.scores.time);
					} else {
						playerLineup.timeEntry.push(game.scores.time);
					}
				} else {
					playerLineup = new PlayerComposition(
						changedPlayer,
						authArray[changedPlayer.id][0],
						[game.scores.time],
						[]
					);
					game.playerComp[0].push(playerLineup);
				}
			} else if (changedPlayer.team == Team.BLUE) {
				// player gets in blue team
				let blueLineupAuth = game.playerComp[1].map((p) => p.auth);
				let ind = blueLineupAuth.findIndex((auth) => auth == authArray[changedPlayer.id][0]);
				if (ind != -1) {
					// Player goes back in
					playerLineup = game.playerComp[1][ind];
					if (playerLineup.timeExit.includes(game.scores.time)) {
						// gets subbed off then in at the exact same time -> no sub
						playerLineup.timeExit = playerLineup.timeExit.filter((t) => t != game.scores.time);
					} else {
						playerLineup.timeEntry.push(game.scores.time);
					}
				} else {
					playerLineup = new PlayerComposition(
						changedPlayer,
						authArray[changedPlayer.id][0],
						[game.scores.time],
						[]
					);
					game.playerComp[1].push(playerLineup);
				}
			}
			if (teamRed.some((r) => r.id == changedPlayer.id)) {
				// player leaves red team
				let redLineupAuth = game.playerComp[0].map((p) => p.auth);
				let ind = redLineupAuth.findIndex((auth) => auth == authArray[changedPlayer.id][0]);
				playerLineup = game.playerComp[0][ind];
				if (playerLineup.timeEntry.includes(game.scores.time)) {
					// gets subbed off then in at the exact same time -> no sub
					if (game.scores.time == 0) {
						game.playerComp[0].splice(ind, 1);
					} else {
						playerLineup.timeEntry = playerLineup.timeEntry.filter((t) => t != game.scores.time);
					}
				} else {
					playerLineup.timeExit.push(game.scores.time);
				}
			} else if (teamBlue.some((r) => r.id == changedPlayer.id)) {
				// player leaves blue team
				let blueLineupAuth = game.playerComp[1].map((p) => p.auth);
				let ind = blueLineupAuth.findIndex((auth) => auth == authArray[changedPlayer.id][0]);
				playerLineup = game.playerComp[1][ind];
				if (playerLineup.timeEntry.includes(game.scores.time)) {
					// gets subbed off then in at the exact same time -> no sub
					if (game.scores.time == 0) {
						game.playerComp[1].splice(ind, 1);
					} else {
						playerLineup.timeEntry = playerLineup.timeEntry.filter((t) => t != game.scores.time);
					}
				} else {
					playerLineup.timeExit.push(game.scores.time);
				}
			}
		}
	}

	function handleLineupChangeLeave(player) {
		try{
			if (playSituation != Situation.STOP) {
				if (player.team == Team.RED) {
					// player gets in red team
					let redLineupAuth = game.playerComp[0].map((p) => p.auth);
					let ind = redLineupAuth.findIndex((auth) => auth == authArray[player.id][0]);
					let playerLineup = game.playerComp[0][ind];
					if (playerLineup.timeEntry.includes(game.scores.time)) {
						// gets subbed off then in at the exact same time -> no sub
						if (game.scores.time == 0) {
							game.playerComp[0].splice(ind, 1);
						} else {
							playerLineup.timeEntry = playerLineup.timeEntry.filter((t) => t != game.scores.time);
						}
					} else {
						playerLineup.timeExit.push(game.scores.time);
					}
				} else if (player.team == Team.BLUE) {
					// player gets in blue team
					let blueLineupAuth = game.playerComp[1].map((p) => p.auth);
					let ind = blueLineupAuth.findIndex((auth) => auth == authArray[player.id][0]);
					let playerLineup = game.playerComp[1][ind];
					if (playerLineup.timeEntry.includes(game.scores.time)) {
						// gets subbed off then in at the exact same time -> no sub
						if (game.scores.time == 0) {
							game.playerComp[1].splice(ind, 1);
						} else {
							playerLineup.timeEntry = playerLineup.timeEntry.filter((t) => t != game.scores.time);
						}
					} else {
						playerLineup.timeExit.push(game.scores.time);
					}
				}
			}
		}catch(err){
			writeLog("", "ERROR handleLineupChangeLeave(){ "+err+" }", true);
		}
	}

	/* TEAM BALANCE FUNCTIONS */

	function balanceTeams() {
		if (!chooseMode) {
			if (players.length == 0) { // nessun giocatore stoppa tutto
				room.stopGame();
				room.setScoreLimit(scoreLimit);
				room.setTimeLimit(timeLimit);
			} else if (players.length == 1 && teamRed.length == 0) { // se c'è un solo giocatore (mette la mappa SOLO)
				instantRestart();
				setTimeout(() => {
					room.setScoreLimit(0);
					room.setTimeLimit(0);
					stadiumCommand(emptyPlayer, `!training`);
				}, 5);
				room.setPlayerTeam(players[0].id, Team.RED);
			} else if (Math.abs(teamRed.length - teamBlue.length) == teamSpec.length && teamSpec.length > 0) { // se le squadre hanno un numero di giocatori diverso e ci sono PERFETTAMENTE quegli SPECT (sale di campo)
				const n = Math.abs(teamRed.length - teamBlue.length);
				if (players.length == 2) {
					instantRestart();
					setTimeout(() => {
						stadiumCommand(emptyPlayer, `!orange2v2`);
					}, 5);
				}
				if (teamRed.length > teamBlue.length) {
					for (let i = 0; i < n; i++) {
						if(teamSpec[i] != undefined) room.setPlayerTeam(teamSpec[i].id, Team.BLUE);
					}
				} else {
					for (let i = 0; i < n; i++) {
						if(teamSpec[i] != undefined) room.setPlayerTeam(teamSpec[i].id, Team.RED);
					}
				}
			} else if (Math.abs(teamRed.length - teamBlue.length) > teamSpec.length) { // se le squadre hanno un numero di player diversi ma non ci sono gli SPECT (scende di campo)
				const n = Math.abs(teamRed.length - teamBlue.length);
				if (players.length == 1) {
					instantRestart();
					setTimeout(() => {
						room.setScoreLimit(0);
						room.setTimeLimit(0);
						stadiumCommand(emptyPlayer, `!training`);
					}, 5);
					room.setPlayerTeam(players[0].id, Team.RED);
					return;
				} else if (teamSize > 2 && players.length == 5) {
					instantRestart();
					setTimeout(() => {
						stadiumCommand(emptyPlayer, `!orange2v2`);
					}, 5);
				}
				if (players.length == teamSize * 2 - 1) {
					teamRedStats = [];
					teamBlueStats = [];
				}
				if (teamRed.length > teamBlue.length) {
					for (let i = 0; i < n; i++) {
						room.setPlayerTeam(
							teamRed[teamRed.length - 1 - i].id,
							Team.SPECTATORS
						);
					}
				} else {
					for (let i = 0; i < n; i++) {
						room.setPlayerTeam(
							teamBlue[teamBlue.length - 1 - i].id,
							Team.SPECTATORS
						);
					}
				}
			} else if (Math.abs(teamRed.length - teamBlue.length) < teamSpec.length && teamRed.length != teamBlue.length) { // se le squadre hanno un numero di giocatori diverso e ci sono degli SPECT in più (entra in modalità DECISIONE)
				room.pauseGame(true);
				activateChooseMode();
				choosePlayer();
			} else if (teamSpec.length >= 2 && teamRed.length == teamBlue.length && teamRed.length < teamSize) { // se le squadre sono meno del 3v3 e ci sono gli spect
				if (teamRed.length == 2) {
					let scores = room.getScores();
					if (scores != null){
						if (scores.time < 80 || (scores.time < 120 && scores.red == scores.blue && scores.red == 0)) {
							instantRestart();
							setTimeout(() => {
								stadiumCommand(emptyPlayer, `!b&w3v3`);
							}, 5);
							topButton();
						}
					}else{
						instantRestart();
						setTimeout(() => {
							stadiumCommand(emptyPlayer, `!b&w3v3`);
						}, 5);
						topButton();
					}
				}else if(teamRed.length < 2){
					topButton();
				}
			}
		}
	}

	function handlePlayersJoin() {
		if (chooseMode) {
			if (teamSize > 2 && players.length >= 6) {
				setTimeout(() => {
					stadiumCommand(emptyPlayer, `!b&w3v3`);
				}, 5);
			}
			getSpecList(teamRed.length <= teamBlue.length ? teamRed[0] : teamBlue[0]);
		}
		balanceTeams();
	}

	function handlePlayersLeave() {
		if (gameState != State.STOP) {
			let scores = room.getScores(); //https://github.com/haxball/haxball-issues/wiki/Headless-Host
			if (players.length >= 2 * teamSize && scores.time >= (5 / 6) * game.scores.timeLimit && teamRed.length != teamBlue.length) {
				let rageQuitCheck = false;
				if (teamRed.length < teamBlue.length) {
					if (scores.blue - scores.red == 2) {
						endGame(Team.BLUE);
						rageQuitCheck = true;
					}
				} else {
					if (scores.red - scores.blue == 2) {
						endGame(Team.RED);
						rageQuitCheck = true;
					}
				}
				if (rageQuitCheck) {
					room.sendAnnouncement(
						"Ragequit rilevato, partita terminata.",
						null,
						infoColor,
						'bold',
						HaxNotification.MENTION
					)
					stopTimeout = setTimeout(() => {
						room.stopGame();
					}, 100);
					return;
				}
			}
		}
		if (chooseMode) {
			if (teamSize > 2 && players.length == 5) {
				setTimeout(() => {
					stadiumCommand(emptyPlayer, `!orange2v2`);
				}, 5);
			}
			if (teamRed.length == 0 || teamBlue.length == 0) {
				if(teamSpec[0] != undefined) room.setPlayerTeam(teamSpec[0].id, teamRed.length == 0 ? Team.RED : Team.BLUE);
				return;
			}
			if (Math.abs(teamRed.length - teamBlue.length) == teamSpec.length) {
				deactivateChooseMode();
				resumeGame();
				let b = teamSpec.length;
				if (teamRed.length > teamBlue.length) {
					for (let i = 0; i < b; i++) {
						clearTimeout(insertingTimeout);
						insertingPlayers = true;
						setTimeout(() => {
							if(teamSpec[0] != undefined) room.setPlayerTeam(teamSpec[0].id, Team.BLUE);
						}, 5 * i);
					}
					insertingTimeout = setTimeout(() => {
						insertingPlayers = false;
					}, 5 * b);
				} else {
					for (let i = 0; i < b; i++) {
						clearTimeout(insertingTimeout);
						insertingPlayers = true;
						setTimeout(() => {
							if(teamSpec[0] != undefined) room.setPlayerTeam(teamSpec[0].id, Team.RED);
						}, 5 * i);
					}
					insertingTimeout = setTimeout(() => {
						insertingPlayers = false;
					}, 5 * b);
				}
				return;
			}
			if (streak == 0 && gameState == State.STOP) {
				if (Math.abs(teamRed.length - teamBlue.length) == 2) {
					let teamIn = teamRed.length > teamBlue.length ? teamRed : teamBlue;
					room.setPlayerTeam(teamIn[teamIn.length - 1].id, Team.SPECTATORS)
				}
			}
			if (teamRed.length == teamBlue.length && teamSpec.length < 2) {
				deactivateChooseMode();
				resumeGame();
				return;
			}

			if (capLeft) {
				choosePlayer();
			} else {
				getSpecList(teamRed.length <= teamBlue.length ? teamRed[0] : teamBlue[0]);
			}
		}
		balanceTeams();
	}

	function handlePlayersTeamChange(byPlayer) {
		if (chooseMode && !removingPlayers && byPlayer == null) {
			if (Math.abs(teamRed.length - teamBlue.length) == teamSpec.length) {
				deactivateChooseMode();
				resumeGame();
				let b = teamSpec.length;
				if (teamRed.length > teamBlue.length) {
					for (let i = 0; i < b; i++) {
						clearTimeout(insertingTimeout);
						insertingPlayers = true;
						setTimeout(() => {
							if(teamSpec[0] != undefined) room.setPlayerTeam(teamSpec[0].id, Team.BLUE);
						}, 5 * i);
					}
					insertingTimeout = setTimeout(() => {
						insertingPlayers = false;
					}, 5 * b);
				} else {
					for (let i = 0; i < b; i++) {
						clearTimeout(insertingTimeout);
						insertingPlayers = true;
						setTimeout(() => {
							if(teamSpec[0] != undefined) room.setPlayerTeam(teamSpec[0].id, Team.RED);
						}, 5 * i);
					}
					insertingTimeout = setTimeout(() => {
						insertingPlayers = false;
					}, 5 * b);
				}
				return;
			} else if (
				(teamRed.length == teamSize && teamBlue.length == teamSize) ||
				(teamRed.length == teamBlue.length && teamSpec.length < 2)
			) {
				deactivateChooseMode();
				resumeGame();
			} else if (teamRed.length <= teamBlue.length && redCaptainChoice != '') {
				if (redCaptainChoice == 'top') {
					if(teamSpec[0] != undefined) room.setPlayerTeam(teamSpec[0].id, Team.RED);
				} else if (redCaptainChoice == 'random') {
					let r = getRandomInt(teamSpec.length);
					if(teamSpec[r] != undefined) room.setPlayerTeam(teamSpec[r].id, Team.RED);
				} else {
					if(teamSpec[teamSpec.length - 1] != undefined) room.setPlayerTeam(teamSpec[teamSpec.length - 1].id, Team.RED);
				}
				return;
			} else if (teamBlue.length < teamRed.length && blueCaptainChoice != '') {
				if (blueCaptainChoice == 'top') {
					if(teamSpec[0] != undefined) room.setPlayerTeam(teamSpec[0].id, Team.BLUE);
				} else if (blueCaptainChoice == 'random') {
					let r = getRandomInt(teamSpec.length);
					if(teamSpec[r] != undefined) room.setPlayerTeam(teamSpec[r].id, Team.BLUE);
				} else {
					if(teamSpec[teamSpec.length - 1] != undefined) room.setPlayerTeam(teamSpec[teamSpec.length - 1].id, Team.BLUE);
				}
				return;
			} else {
				choosePlayer();
			}
		}
	}

	function handlePlayersStop(byPlayer) {
		if (byPlayer == null && endGameVariable) {
			if (chooseMode) {
				if (players.length == 2 * teamSize) {
					chooseMode = false;
					resetButton();
					for (let i = 0; i < teamSize; i++) {
						clearTimeout(insertingTimeout);
						insertingPlayers = true;
						setTimeout(() => {
							randomButton();
						}, 200 * i);
					}
					insertingTimeout = setTimeout(() => {
						insertingPlayers = false;
					}, 200 * teamSize);
					stadiumCommand(emptyPlayer, `!b&w3v3`);
					startTimeout = setTimeout(() => {
						room.startGame();
					}, 2000);
				} else {
					if (lastWinner == Team.RED) {
						blueToSpecButton();
					} else if (lastWinner == Team.BLUE) {
						redToSpecButton();
						setTimeout(() => {
							swapButton();
						}, 10);
					} else {
						resetButton();
					}
					clearTimeout(insertingTimeout);
					insertingPlayers = true;
					setTimeout(() => {
						topButton();
					}, 300);
					insertingTimeout = setTimeout(() => {
						insertingPlayers = false;
					}, 300);
				}
			} else {
				//da eliminare il primo if(players.length == 1)
				if (players.length == 1) {
					startTimeout = setTimeout(() => {
						room.startGame();
					}, 2000);
				} else if (players.length == 2) {
					if (lastWinner == Team.BLUE) {
						swapButton();
					}
					startTimeout = setTimeout(() => {
						room.startGame();
					}, 2000);
				} else if (players.length == 3 || players.length >= 2 * teamSize + 1) {
					if (lastWinner == Team.RED) {
						blueToSpecButton();
					} else {
						redToSpecButton();
						setTimeout(() => {
							swapButton();
						}, 5);
					}
					clearTimeout(insertingTimeout);
					insertingPlayers = true;
					setTimeout(() => {
						topButton();
					}, 200);
					insertingTimeout = setTimeout(() => {
						insertingPlayers = false;
					}, 300);
					startTimeout = setTimeout(() => {
						room.startGame();
					}, 2000);
				} else if (players.length == 4) {
					resetButton();
					clearTimeout(insertingTimeout);
					insertingPlayers = true;
					setTimeout(() => {
						randomButton();
						setTimeout(() => {
							randomButton();
						}, 500);
					}, 500);
					insertingTimeout = setTimeout(() => {
						insertingPlayers = false;
					}, 2000);
					startTimeout = setTimeout(() => {
						room.startGame();
					}, 2000);
				} else if (players.length == 5 || players.length >= 2 * teamSize + 1) {
					if (lastWinner == Team.RED) {
						blueToSpecButton();
					} else {
						redToSpecButton();
						setTimeout(() => {
							swapButton();
						}, 5);
					}
					clearTimeout(insertingTimeout);
					insertingPlayers = true;
					insertingTimeout = setTimeout(() => {
						insertingPlayers = false;
					}, 200);
					setTimeout(() => {
						topButton();
					}, 200);
					activateChooseMode();
				} else if (players.length == 6) {
					resetButton();
					clearTimeout(insertingTimeout);
					insertingPlayers = true;
					insertingTimeout = setTimeout(() => {
						insertingPlayers = false;
					}, 1500);
					setTimeout(() => {
						randomButton();
						setTimeout(() => {
							randomButton();
							setTimeout(() => {
								randomButton();
							}, 500);
						}, 500);
					}, 500);
					stadiumCommand(emptyPlayer, `!b&w3v3`);
					startTimeout = setTimeout(() => {
						room.startGame();
					}, 2000);
				}
			}
		}
	}

	/* STATS FUNCTIONS */

	/* GK FUNCTIONS */

	function handleGKTeam(team) {
		if (team == Team.SPECTATORS) {
			return null;
		}
		let teamArray = team == Team.RED ? teamRed : teamBlue;
		let playerGK = teamArray.reduce((prev, current) => {
			if (team == Team.RED) {
				return (prev && prev.position.x < current.position.x) ? prev : current
			} else {
				return (prev && prev.position.x > current.position.x) ? prev : current
			}
		}, null);
		let playerCompGK = getPlayerComp(playerGK);
		return playerCompGK;
	}

	function handleGK() {
		let redGK = handleGKTeam(Team.RED);
		if (redGK != null) {
			redGK.GKTicks++;
		}
		let blueGK = handleGKTeam(Team.BLUE);
		if (blueGK != null) {
			blueGK.GKTicks++;
		}
	}

	function getGK(team) {
		if (team == Team.SPECTATORS) {
			return null;
		}
		let teamArray = team == Team.RED ? game.playerComp[0] : game.playerComp[1];
		let playerGK = teamArray.reduce((prev, current) => {
			return (prev && prev.GKTicks > current.GKTicks) ? prev : current
		}, null);
		return playerGK;
	}

	function getCS(scores) {
		let playersNameCS = [];
		let redGK = getGK(Team.RED);
		let blueGK = getGK(Team.BLUE);
		if (redGK != null && scores.blue == 0) {
			playersNameCS.push(redGK.player.name);
		}
		if (blueGK != null && scores.red == 0) {
			playersNameCS.push(blueGK.player.name);
		}
		return playersNameCS;
	}

	function getCSString(scores) {
		let playersCS = getCS(scores);
		if (playersCS.length == 0) {
			return "🥅 Nessun CS";
		} else if (playersCS.length == 1) {
			return `🥅 ${playersCS[0]} ha fatto un CS.`;
		} else {
			return `🥅 ${playersCS[0]} e ${playersCS[1]} ha fatto un CS.`;
		}
	}

	/* GLOBAL STATS FUNCTIONS */

	function getLastTouchOfTheBall() {
		const ballPosition = room.getBallPosition();
		updateTeams();
		let playerArray = [];
		for (let player of players) {
			if (player.position != null) {
				let distanceToBall = pointDistance(player.position, ballPosition);
				if (distanceToBall < triggerDistance) {
					if (playSituation == Situation.KICKOFF) playSituation = Situation.PLAY;
					playerArray.push([player, distanceToBall]);
				}
			}
		}
		if (playerArray.length != 0) {
			let playerTouch = playerArray.sort((a, b) => a[1] - b[1])[0][0];
			if (lastTeamTouched == playerTouch.team || lastTeamTouched == Team.SPECTATORS) {
				if (lastTouches[0] == null || (lastTouches[0] != null && lastTouches[0].player.id != playerTouch.id)) {
					game.touchArray.push(
						new BallTouch(
							playerTouch,
							game.scores.time,
							getGoalGame(),
							ballPosition
						)
					);
					lastTouches[0] = checkGoalKickTouch(
						game.touchArray,
						game.touchArray.length - 1,
						getGoalGame()
					);
					lastTouches[1] = checkGoalKickTouch(
						game.touchArray,
						game.touchArray.length - 2,
						getGoalGame()
					);
				}
			}
			lastTeamTouched = playerTouch.team;
		}
	}

	function getBallSpeed() {
		let ballProp = room.getDiscProperties(0);
		return Math.sqrt(ballProp.xspeed ** 2 + ballProp.yspeed ** 2) * speedCoefficient;
	}

	function getGameStats() {
		if (playSituation == Situation.PLAY && gameState == State.PLAY) {
			lastTeamTouched == Team.RED ? possession[0]++ : possession[1]++;
			let ballPosition = room.getBallPosition();
			ballPosition.x < 0 ? actionZoneHalf[0]++ : actionZoneHalf[1]++;
			handleGK();
		}
	}

	/* GOAL ATTRIBUTION FUNCTIONS */

	function getGoalAttribution(team) {
		let goalAttribution = Array(2).fill(null);
		if (lastTouches[0] != null) {
			if (lastTouches[0].player.team == team) {
				// Direct goal scored by player
				if (lastTouches[1] != null && lastTouches[1].player.team == team) {
					goalAttribution = [lastTouches[0].player, lastTouches[1].player];
				} else {
					goalAttribution = [lastTouches[0].player, null];
				}
			} else {
				// Own goal
				goalAttribution = [lastTouches[0].player, null];
			}
		}
		return goalAttribution;
	}

	function getGoalString(team) {
		let goalString;
		let scores = game.scores;
		let goalAttribution = getGoalAttribution(team);
		if (goalAttribution[0] != null) {
			if (goalAttribution[0].team == team) {
				if (goalAttribution[1] != null && goalAttribution[1].team == team) {
					goalString = `⚽ ${getTimeGame(scores.time)} Goal di ${goalAttribution[0].name} ! 👟 Assist di ${goalAttribution[1].name}. Goal speed : ${ballSpeed.toFixed(2)}km/h.`;
					game.goals.push(
						new Goal(
							scores.time,
							team,
							goalAttribution[0],
							goalAttribution[1]
						)
					);
				} else {
					goalString = `⚽ ${getTimeGame(scores.time)} Goal di ${goalAttribution[0].name} ! Goal speed : ${ballSpeed.toFixed(2)}km/h.`;
					game.goals.push(
						new Goal(scores.time, team, goalAttribution[0], null)
					);
				}
			} else {
				goalString = `❌ ${getTimeGame(scores.time)} Auto goal di ${goalAttribution[0].name} ! Goal speed : ${ballSpeed.toFixed(2)}km/h.`;
				game.goals.push(
					new Goal(scores.time, team, goalAttribution[0], null)
				);
			}
		} else {
			goalString = `⚽ ${getTimeGame(scores.time)} Goal per i ${team == Team.RED ? 'red' : 'blue'} ! Goal speed : ${ballSpeed.toFixed(2)}km/h.`;
			game.goals.push(
				new Goal(scores.time, team, null, null)
			);
		}

		return goalString;
	}

	/* ROOM STATS FUNCTIONS */

	async function updatePlayerStats(player, teamStats) {
		const pComp = getPlayerComp(player)
		const thisPlayer = await playersDB.findOne({nickname: player.name});
		const stat = await statsDB.findOne({nickname: player.name})
		const allDate = new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }).split("/")
		const thisMonth = allDate[0] + "-" + parseInt(allDate[2]);
		const mStat = await monthlystatsDB.findOne({nickname: player.name, month: thisMonth});
		let newHatTrick = 0
		if (thisPlayer != undefined) {
			if (stat != undefined) {
				stat.games++
				if (lastWinner == teamStats) stat.wins++
				stat.winrate = stat.games >= 15 ? (((100 * stat.wins) / (stat.games || 1)).toFixed(2) + `%`) : "0.0%"
				stat.goals += getGoalsPlayer(pComp)
				if (getGoalsPlayer(pComp) >= 3) stat.hatTrick += 1
				stat.assists += getAssistsPlayer(pComp)
				stat.ownGoals += getOwnGoalsPlayer(pComp)
				stat.cs += getCSPlayer(pComp)
				stat.playtime += getGametimePlayer(pComp)
				await statsDB.updateOne({ nickname: player.name }, { $set: { games: stat.games, wins: stat.wins, winrate: stat.winrate, goals: stat.goals, ownGoals: stat.ownGoals, assists: stat.assists, cs: stat.cs, playtime: stat.playtime, hatTrick: stat.hatTrick } })
			} else {
				if (getGoalsPlayer(pComp) >= 3) newHatTrick = 1
				const newStat = { nickname: player.name, games: 1, wins: 0, winrate: "0.0%", goals: getGoalsPlayer(pComp), ownGoals: getOwnGoalsPlayer(pComp), assists: getAssistsPlayer(pComp), cs: getCSPlayer(pComp), playtime: getGametimePlayer(pComp), hatTrick: newHatTrick }
				if (lastWinner == teamStats) newStat.wins = 1
				await statsDB.insertOne(newStat)
			}

			if (mStat != undefined) {
				mStat.games++
				if (lastWinner == teamStats) mStat.wins++
				mStat.winrate = mStat.games >= 15 ? (((100 * mStat.wins) / (mStat.games || 1)).toFixed(2) + `%`) : "0.0%"
				mStat.goals += getGoalsPlayer(pComp)
				if (getGoalsPlayer(pComp) >= 3) mStat.hatTrick += 1
				mStat.assists += getAssistsPlayer(pComp)
				mStat.ownGoals += getOwnGoalsPlayer(pComp)
				mStat.cs += getCSPlayer(pComp)
				mStat.playtime += getGametimePlayer(pComp)
				await monthlystatsDB.updateOne({ nickname: player.name, month: thisMonth }, { $set: { games: mStat.games, wins: mStat.wins, winrate: mStat.winrate, goals: mStat.goals, ownGoals: mStat.ownGoals, assists: mStat.assists, cs: mStat.cs, playtime: mStat.playtime, hatTrick: mStat.hatTrick } })
			} else {
				if (getGoalsPlayer(pComp) >= 3) newHatTrick = 1
				const newMStat = { nickname: player.name, games: 1, wins: 0, winrate: "0.0%", goals: getGoalsPlayer(pComp), ownGoals: getOwnGoalsPlayer(pComp), assists: getAssistsPlayer(pComp), cs: getCSPlayer(pComp), playtime: getGametimePlayer(pComp), hatTrick: newHatTrick, month: thisMonth }
				if (lastWinner == teamStats) newMStat.wins = 1
				await monthlystatsDB.insertOne(newMStat)
			}
		}


		
	}

	function updateStats() {
		if (
			players.length >= 2 * teamSize &&
			(
				game.scores.time >= (5 / 6) * game.scores.timeLimit ||
				game.scores.red == game.scores.scoreLimit ||
				game.scores.blue == game.scores.scoreLimit
			) &&
			teamRedStats.length >= teamSize && teamBlueStats.length >= teamSize
		) {
			teamRedStats.forEach(player => updatePlayerStats(player, Team.RED))
			teamBlueStats.forEach(player => updatePlayerStats(player, Team.BLUE))
		}
	}

	/*
	function printRankings(statKey, id = 0) {
		let leaderboard = [];
		statKey = statKey == "cs" ? "CS" : statKey;
		for (let i = 0; i < localStorage.length; i++) {
			let key = localStorage.key(i);
			if (key.length == 43)
				leaderboard.push([
					JSON.parse(localStorage.getItem(key)).playerName,
					JSON.parse(localStorage.getItem(key))[statKey],
				]);
		}
		if (leaderboard.length < 5) {
			if (id != 0) {
				room.sendAnnouncement(
					'Not enough games played yet !',
					id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
			}
			return;
		}
		leaderboard.sort(function (a, b) { return b[1] - a[1]; });
		let rankingString = `${statKey.charAt(0).toUpperCase() + statKey.slice(1)}> `;
		for (let i = 0; i < 5; i++) {
			let playerName = leaderboard[i][0];
			let playerStat = leaderboard[i][1];
			if (statKey == 'playtime') playerStat = getTimeStats(playerStat);
			rankingString += `#${i + 1} ${playerName} : ${playerStat}, `;
		}
		rankingString = rankingString.substring(0, rankingString.length - 2);
		room.sendAnnouncement(
			rankingString,
			id,
			infoColor,
			'bold',
			HaxNotification.CHAT
		);
	}*/

	/* GET STATS FUNCTIONS */

	function getGamePlayerStats(player) {
		let stats = new HaxStatistics(player.name);
		let pComp = getPlayerComp(player);
		stats.goals += getGoalsPlayer(pComp);
		stats.assists += getAssistsPlayer(pComp);
		stats.ownGoals += getOwnGoalsPlayer(pComp);
		stats.playtime += getGametimePlayer(pComp);
		stats.CS += getCSPlayer(pComp);
		return stats;
	}

	function getGametimePlayer(pComp) {
		if (pComp == null) return 0;
		let timePlayer = 0;
		for (let j = 0; j < pComp.timeEntry.length; j++) {
			if (pComp.timeExit.length < j + 1) {
				timePlayer += game.scores.time - pComp.timeEntry[j];
			} else {
				timePlayer += pComp.timeExit[j] - pComp.timeEntry[j];
			}
		}
		return Math.floor(timePlayer);
	}

	function getGoalsPlayer(pComp) {
		if (pComp == null) return 0;
		let goalPlayer = 0;
		for (let goal of game.goals) {
			if (goal.striker != null && goal.team === pComp.player.team) {
				if (authArray[goal.striker.id][0] == pComp.auth) {
					goalPlayer++;
				}
			}
		}
		return goalPlayer;
	}

	function getOwnGoalsPlayer(pComp) {
		if (pComp == null) return 0;
		let goalPlayer = 0;
		for (let goal of game.goals) {
			if (goal.striker != null && goal.team !== pComp.player.team) {
				if (authArray[goal.striker.id][0] == pComp.auth) {
					goalPlayer++;
				}
			}
		}
		return goalPlayer;
	}

	function getAssistsPlayer(pComp) {
		if (pComp == null) return 0;
		let assistPlayer = 0;
		for (let goal of game.goals) {
			if (goal.assist != null) {
				if (authArray[goal.assist.id][0] == pComp.auth) {
					assistPlayer++;
				}
			}
		}
		return assistPlayer;
	}

	function getGKPlayer(pComp) {
		if (pComp == null) return 0;
		let GKRed = getGK(Team.RED);
		if (GKRed && pComp.auth == GKRed.auth) {
			return Team.RED;
		}
		let GKBlue = getGK(Team.BLUE);
		if (GKBlue && pComp.auth == GKBlue.auth) {
			return Team.BLUE;
		}
		return Team.SPECTATORS;
	}

	function getCSPlayer(pComp) {
		if (pComp == null || game.scores == null) return 0;
		if (getGKPlayer(pComp) == Team.RED && game.scores.blue == 0) {
			return 1;
		} else if (getGKPlayer(pComp) == Team.BLUE && game.scores.red == 0) {
			return 1;
		}
		return 0;
	}

	function actionReportCountTeam(goals, team) {
		let playerActionSummaryTeam = [];
		let indexTeam = team == Team.RED ? 0 : 1;
		let indexOtherTeam = team == Team.RED ? 1 : 0;
		for (let goal of goals[indexTeam]) {
			if (goal[0] != null) {
				if (playerActionSummaryTeam.find(a => a[0].id == goal[0].id)) {
					let index = playerActionSummaryTeam.findIndex(a => a[0].id == goal[0].id);
					playerActionSummaryTeam[index][1]++;
				} else {
					playerActionSummaryTeam.push([goal[0], 1, 0, 0]);
				}
				if (goal[1] != null) {
					if (playerActionSummaryTeam.find(a => a[0].id == goal[1].id)) {
						let index = playerActionSummaryTeam.findIndex(a => a[0].id == goal[1].id);
						playerActionSummaryTeam[index][2]++;
					} else {
						playerActionSummaryTeam.push([goal[1], 0, 1, 0]);
					}
				}
			}
		}
		if (goals[indexOtherTeam].length == 0 && room.getPlayerList().length > 1) {
			if (getGK(team) != null) {
				let playerCS = getGK(team).player;
				if (playerCS != null) {
					if (playerActionSummaryTeam.find(a => a[0].id == playerCS.id)) {
						let index = playerActionSummaryTeam.findIndex(a => a[0].id == playerCS.id);
						playerActionSummaryTeam[index][3]++;
					} else {
						playerActionSummaryTeam.push([playerCS, 0, 0, 1]);
					}
				}
			}
		}

		playerActionSummaryTeam.sort((a, b) => (a[1] + a[2] + a[3]) - (b[1] + b[2] + b[3]));
		return playerActionSummaryTeam;
	}

	/* PRINT FUNCTIONS */

	function printPlayerStats(stats) {
		let statsString = '';
		for (let [key, value] of Object.entries(stats)) {
			if (key == 'playerName') statsString += `${value}: `;
			else {
				if (key == 'playtime') value = getTimeStats(value);
				let reCamelCase = /([A-Z](?=[a-z]+)|[A-Z]+(?![a-z]))/g;
				let statName = key.replaceAll(reCamelCase, ' $1').trim();
				statsString += `${statName.charAt(0).toUpperCase() + statName.slice(1)}: ${value}, `;
			}
		}
		statsString = statsString.substring(0, statsString.length - 2);
		return statsString;
	}

	/* FETCH FUNCTIONS */

	function fetchGametimeReport(game) {
		let fieldGametimeRed = {
			name: '🔴        **RED TEAM STATS**',
			value: '⌛ __**Game Time:**__\n\n',
			inline: true,
		};
		let fieldGametimeBlue = {
			name: '🔵       **BLUE TEAM STATS**',
			value: '⌛ __**Game Time:**__\n\n',
			inline: true,
		};
		let redTeamTimes = game.playerComp[0].map((p) => [p.player, getGametimePlayer(p)]);
		let blueTeamTimes = game.playerComp[1].map((p) => [p.player, getGametimePlayer(p)]);

		for (let time of redTeamTimes) {
			let minutes = getMinutesReport(time[1]);
			let seconds = getSecondsReport(time[1]);
			fieldGametimeRed.value += `> **${time[0].name}:** ${minutes > 0 ? `${minutes}m` : ''}` +
				`${seconds > 0 || minutes == 0 ? `${seconds}s` : ''}\n`;
		}
		fieldGametimeRed.value += `\n${blueTeamTimes.length - redTeamTimes.length > 0 ? '\n'.repeat(blueTeamTimes.length - redTeamTimes.length) : ''
			}`;
		fieldGametimeRed.value += '=====================';

		for (let time of blueTeamTimes) {
			let minutes = getMinutesReport(time[1]);
			let seconds = getSecondsReport(time[1]);
			fieldGametimeBlue.value += `> **${time[0].name}:** ${minutes > 0 ? `${minutes}m` : ''}` +
				`${seconds > 0 || minutes == 0 ? `${seconds}s` : ''}\n`;
		}
		fieldGametimeBlue.value += `\n${redTeamTimes.length - blueTeamTimes.length > 0 ? '\n'.repeat(redTeamTimes.length - blueTeamTimes.length) : ''
			}`;
		fieldGametimeBlue.value += '=====================';

		return [fieldGametimeRed, fieldGametimeBlue];
	}

	function fetchActionsSummaryReport(game) {
		let fieldReportRed = {
			name: '🔴        **RED TEAM STATS**',
			value: '📊 __**Player Stats:**__\n\n',
			inline: true,
		};
		let fieldReportBlue = {
			name: '🔵       **BLUE TEAM STATS**',
			value: '📊 __**Player Stats:**__\n\n',
			inline: true,
		};
		let goals = [[], []];
		for (let i = 0; i < game.goals.length; i++) {
			goals[game.goals[i].team - 1].push([game.goals[i].striker, game.goals[i].assist]);
		}
		let redActions = actionReportCountTeam(goals, Team.RED);
		if (redActions.length > 0) {
			for (let act of redActions) {
				fieldReportRed.value += `> **${act[0].team != Team.RED ? '[❌⚽] '+act[0].name+'' : act[0].name+':'}**` +
					`${act[1] > 0 && act[0].team == Team.RED ? ` ${act[1]} ⚽` : ''}` +
					`${act[2] > 0 ? ` ${act[2]} 👟` : ''}` +
					`${act[3] > 0 ? ` ${act[3]} 🥅` : ''}\n`;
			}
		}
		let blueActions = actionReportCountTeam(goals, Team.BLUE);
		if (blueActions.length > 0) {
			for (let act of blueActions) {
				fieldReportBlue.value += `> **${act[0].team != Team.BLUE ? '[❌⚽] '+act[0].name : act[0].name+':'}**` +
					`${act[1] > 0 && act[0].team == Team.BLUE ? ` ${act[1]} ⚽` : ''}` +
					`${act[2] > 0 ? ` ${act[2]} 👟` : ''}` +
					`${act[3] > 0 ? ` ${act[3]} 🥅` : ''}\n`;
			}
		}

		fieldReportRed.value += `\n${blueActions.length - redActions.length > 0 ? '\n'.repeat(blueActions.length - redActions.length) : ''
			}`;
		fieldReportRed.value += '=====================';

		fieldReportBlue.value += `\n${redActions.length - blueActions.length > 0 ? '\n'.repeat(redActions.length - blueActions.length) : ''
			}`;
		fieldReportBlue.value += '=====================';

		return [fieldReportRed, fieldReportBlue];
	}

	function fetchSummaryEmbed(game) {
		let fetchEndgame = [fetchGametimeReport, fetchActionsSummaryReport];
		let fields = [
			{
				name: '🔴    **RED TEAM STATS**',
				value: '=====================\n\n',
				inline: true,
			},
			{
				name: '🔵    **BLUE TEAM STATS**',
				value: '=====================\n\n',
				inline: true,
			},
		];
		for (let i = 0; i < fetchEndgame.length; i++) {
			let fieldsReport = fetchEndgame[i](game);
			fields[0].value += fieldsReport[0].value + '\n\n';
			fields[1].value += fieldsReport[1].value + '\n\n';
		}
		fields[0].value = fields[0].value.substring(0, fields[0].value.length - 2);
		fields[1].value = fields[1].value.substring(0, fields[1].value.length - 2);

		let possR = possession[0] / (possession[0] + possession[1]);
		let possB = 1 - possR;
		let possRString = (possR * 100).toFixed(0).toString();
		let possBString = (possB * 100).toFixed(0).toString();
		let zoneR = actionZoneHalf[0] / (actionZoneHalf[0] + actionZoneHalf[1]);
		let zoneB = 1 - zoneR;
		let zoneRString = (zoneR * 100).toFixed(0).toString();
		let zoneBString = (zoneB * 100).toFixed(0).toString();
		let win = (game.scores.red > game.scores.blue) * 1 + (game.scores.blue > game.scores.red) * 2;
		let objectBodyWebhook = {
			embeds: [
				{
					title: '📝 MATCH REPORT - '+formatCurrentDate(),
					description:
						`**${getTimeEmbed(game.scores.time)}** ` +
						(win == 1 ? '**Red Team** ' : 'Red Team ') + game.scores.red +
						' - ' +
						game.scores.blue + (win == 2 ? ' **Blue Team**' : ' Blue Team') +
						'\n```c\nPossession: ' + possRString + '% - ' + possBString + '%' +
						'\nAction Zone: ' + zoneRString + '% - ' + zoneBString + '%\n```\n\n',
					color: 9567999,
					fields: fields,
					footer: {
						text: `Recording: ${getRecordingName(game)}`,
					},
					timestamp: new Date().toISOString(),
				},
			],
			username: roomName
		};

		if (matchWebhook != '') {
			fetch(matchWebhook, {
				method: 'POST',
				body: JSON.stringify(objectBodyWebhook),
				headers: {
					'Content-Type': 'application/json',
				},
			}).then((res) => res);
		}
	}

	/* EVENTS */

	/* PLAYER MOVEMENT */

	// Funzione per verificare se un giocatore è Admin o superiore
	function isAdminOrHigher(player) {
		return player.role >= Role.ADMIN || player.role == Role.DEVELOPER || player.role == Role.FOUNDER || player.role == Role.HELPER;
	}
	
	room.onPlayerJoin = async function (player) {
		writeLog("", room.getPlayerList().length+"/"+maxPlayers+" [" + player.id + "] " + player.name + " connesso: " + player.auth, true);
		if (roomWebhook != '') {
			let stringContent = `[${formatCurrentDate()}] ➡️ JOIN (${room.getPlayerList().length}/${maxPlayers})\n**${player.name}**` +
				`[${player.auth}] {${player.conn}}`;
			fetch(roomWebhook, {
				method: 'POST',
				body: JSON.stringify({
					content: stringContent,
					username: roomName,
				}),
				headers: {
					'Content-Type': 'application/json',
				},
			}).then((res) => res);
		} 

		authArray[player.id] = [player.auth, player.conn];
		let msg = ""
		await loadFromDB(false, true).catch(err => writeLog("", "Errore loadFromDB in onPlayerJoin: " + err, true))

		if (player.name.length < 1) {
			setTimeout(() => room.kickPlayer(player.id, "Non sono ammessi nickname vuoti (Empty nicknames are not allowed)", false), 50)
			return false
		}


		try {
			const IP = await hexToString(authArray[player.id][1]);
			let response = await axios.get("https://vpnapi.io/api/" + IP + "?key=c45fd81fc4d742a89a85b076ee296182");
			// Converti la stringa JSON in un oggetto JavaScript
			const data = response.data;

			// Accedi al valore di "vpn"
			const isVpn = data.security.vpn;
			const isProxy = data.security.proxy;
			const isTor = data.security.tor;
			const isRelay = data.security.relay;

			// Verifica se è true o false
			if (isVpn || isProxy || isTor || isRelay) {
			    writeLog("", "A " + player.name + " gli è stata rilevata una VPN [" + IP + "]{VPN: "+isVpn+"}{PROXY: "+isProxy+"}{TOR: "+isTor+"}{RELAY: "+isRelay+"}", true)
				if (modWebhook != '') {
					let stringContent = `[${formatCurrentDate()}] 📵 VPN DETECT\n` + "A " + player.name + " gli è stata rilevata una VPN [" + IP + "]{VPN: "+isVpn+"}{PROXY: "+isProxy+"}{TOR: "+isTor+"}{RELAY: "+isRelay+"}" +
						`[${player.auth}] {${player.conn}}`;
					fetch(modWebhook, {
						method: 'POST',
						body: JSON.stringify({
							content: stringContent,
							username: roomName,
						}),
						headers: {
							'Content-Type': 'application/json',
						},
					}).then((res) => res);
				}

				try {
					let plVPN = await playersDB.findOne({nickname: player.name});
					if (plVPN == undefined || !('vpn' in plVPN) || ('vpn' in plVPN && plVPN.vpn !== true)) {
						room.kickPlayer(player.id, "VPN non consentite!", false);
						return false;
					}
				} catch (e) {
					room.kickPlayer(player.id, "VPN non consentite!", false);
					return false;
				}
			}
		} catch (errr) {
			writeLog("", " ££££££££££££££££££££££ Errore axios room.onPlayerJoin: " + errr, true);
		}

		if (await bansDB.findOne({$or:[{auth: player.auth}, {connect: player.conn}]}) != undefined) {
			let plB = await bansDB.findOne({$or:[{auth: player.auth}, {connect: player.conn}]})
			let isPermaban = false
			if (plB != undefined) {
				isPermaban = true
				let playerFromBan = new Object();
			    playerFromBan.id = null;
			    playerFromBan.name = "HaxZone🚓";
			    playerFromBan.role = 10;

				// Creiamo un nuovo oggetto senza _id
				let newBanEntry = {
				    nickname: player.name,
				    real_nick: plB.nickname,
				    connect: player.conn,
				    auth: player.auth,
				    banID: player.id,
				    reason: "AutoBan",
				    bannedBy: playerFromBan,
				    date: Date.now()
				}

				try {
				    // Inseriamo il nuovo oggetto, lasciando che MongoDB generi un nuovo _id
				    await bansDB.insertOne(newBanEntry);
					room.kickPlayer(player.id, reason, true);
				} catch (error) {
				    writeLog("", "Errore durante il ban:"+ error, true);
				}
			}
			/*plB = tempBlacklist.find((a) => a.auth == player.auth)
			if (plB != undefined) {
				isPermaban = false
				tempBlacklist = tempBlacklist.filter(a => a.auth != player.auth)
				tempBlacklist.push({ nickname: player.name, id: player.id, auth: plB.auth, connect: player.conn, data: plB.data, durata: plB.durata, reason: plB.reason, bannedBy: plB.bannedBy })
				tempBansDB.updateOne({ auth: player.auth }, { $set: { nickname: player.name, id: player.id, connect: player.conn } })
			}*/
			
			return false
		}
		const thisPlayer = await playersDB.findOne({nickname: player.name})
		const anotherAccount = await playersDB.findOne({$and: [{nickname: {$ne: player.name}}, {$or: [{auth: player.auth}, {connect: player.conn}]}, { sharedAccounts: { $ne: player.name } }]});
		if (anotherAccount != undefined && !debugMode) {
			room.sendAnnouncement(`🔏 Hai già un altro account col nickname '${anotherAccount.nickname}'! Potrai giocare ma non potrai effettuare il login o la registrazione finché non entri col tuo account principale.`, player.id, loginColor, 'bold', HaxNotification.CHAT)
			room.getPlayerList().forEach(a => { if (a.admin) room.sendAnnouncement(`🔏 AVVISO: Il player appena entrato '${player.name}' ha già un account registrato col nickname '${anotherAccount.nickname}'!`, a.id, loginColor, 'bold', HaxNotification.CHAT) })
		}
		if (thisPlayer != undefined && thisPlayer.isLogged && !debugMode) setTimeout(() => room.kickPlayer(player.id, "Questo player è già loggato", false), 50)
		//if (thisPlayer != undefined && thisPlayer.auth != player.auth && thisPlayer.connect != player.conn) setTimeout(() => room.kickPlayer(player.id, "É vietato rubare i nickname agli altri giocatori! Contatta lo staff se ritieni sia un errore.", false), 50)

		if (thisPlayer != undefined && thisPlayer.role == Role.DEVELOPER) {
			msg = `${thisPlayer.roleString} Il Developer ${player.name} è entrato nella stanza!`
		}
		else if (thisPlayer != undefined && thisPlayer.role == Role.FOUNDER) {
			msg = `${thisPlayer.roleString} Il Founder ${player.name} è entrato nella stanza!`
		}
		else if (thisPlayer != undefined && thisPlayer.role == Role.ADMIN) {
			if (player.name == "Momito") msg = `${thisPlayer.roleString} Il Gestore Ds ${player.name} è entrato nella stanza!`
			else msg = `${thisPlayer.roleString} L'Admin ${player.name} è entrato nella stanza!`
		}
		else if (thisPlayer != undefined && thisPlayer.role == Role.MODERATOR) {
			msg = `${thisPlayer.roleString} Il Moderatore ${player.name} è entrato nella stanza!`
		}
		else if (thisPlayer != undefined && thisPlayer.role == Role.HELPER) {
			msg = `${thisPlayer.roleString} L'Helper ${player.name} è entrato nella stanza!`
		}
		else if (thisPlayer != undefined && thisPlayer.role == Role.VIP) {
			msg = `${thisPlayer.roleString} Il Vip ${player.name} è entrato nella stanza!`
		}
		else if (thisPlayer != undefined && thisPlayer.role == Role.PARTNER) {
			msg = `${thisPlayer.roleString} Il Partner ${player.name} è entrato nella stanza!`
		}
		if (msg != "") room.sendAnnouncement(msg, null, announcementColor, 'bold', HaxNotification.CHAT)

		if (anotherAccount == undefined || debugMode) {
			if (thisPlayer != undefined) {
				if (thisPlayer.auth != player.auth || thisPlayer.connect != player.conn || (Date.now() - thisPlayer.lastLogin > 259200000)) {
					room.sendAnnouncement(`🔏 Non hai ancora effettuato il login! Accedi con !login password!`, player.id, loginColor, 'bold', HaxNotification.CHAT)
				}
				else {
					await logPlayer(player, null, true)
				}
			}
			else {
				room.sendAnnouncement(`👋 Benvenuto ${player.name}!\nScrivi "!help" per scoprire tutto ciò che offriamo!\nLeggi il nostro regolamento per una convivenza pacifica digitando !regole`, player.id, welcomeColor, 'bold', HaxNotification.CHAT)
				room.sendAnnouncement(`🔏 Non hai ancora effettuato il login! Accedi con !login password oppure registrati con !register password se non hai ancora un account!`, player.id, loginColor, 'bold', HaxNotification.CHAT)
			}
		}

		updateTeams();

		// da capire
		let sameAuthCheck = playersAll.filter((p) => p.id != player.id && p.auth == player.auth);
		if (sameAuthCheck.length > 0 && !debugMode) {
			let oldPlayerArray = playersAll.filter((p) => p.id != player.id && p.auth == player.auth);
			for (let oldPlayer of oldPlayerArray) {
				ghostKickHandle(oldPlayer, player);
			}
		}
		handlePlayersJoin();
	};

	room.onPlayerTeamChange = function (changedPlayer, byPlayer) {
		handleLineupChangeTeamChange(changedPlayer);
		if (AFKSet.has(changedPlayer.id) && changedPlayer.team != Team.SPECTATORS) {
			room.setPlayerTeam(changedPlayer.id, Team.SPECTATORS);
			room.sendAnnouncement(
				`😴 ${changedPlayer.name} è AFK !`,
				null,
				errorColor,
				'bold',
				HaxNotification.CHAT
			);
			return;
		}
		if (changedPlayer.team == 1) {
			room.setPlayerAvatar(changedPlayer.id, AvatarRed)
		} else if (changedPlayer.team == 2) {
			room.setPlayerAvatar(changedPlayer.id, AvatarBlue)
		} else {
			room.setPlayerAvatar(changedPlayer.id, null)
		}
		updateTeams();
		if (gameState != State.STOP) {
			if (changedPlayer.team != Team.SPECTATORS && game.scores.time <= (3 / 4) * game.scores.timeLimit && Math.abs(game.scores.blue - game.scores.red) < 2) {
				changedPlayer.team == Team.RED ? teamRedStats.push(changedPlayer) : teamBlueStats.push(changedPlayer);
			}
		}
		handleActivityPlayerTeamChange(changedPlayer);
		handlePlayersTeamChange(byPlayer);
	};

	room.onPlayerLeave = async function (player) {
		writeLog("", room.getPlayerList().length+"/"+maxPlayers+" [" + player.id + "] " + player.name + " disconnesso ----------------------------------", true);

		setTimeout(() => {
			if (!kickFetchVariable) {
				if (roomWebhook != '') {
					let stringContent = `[${formatCurrentDate()}] ⬅️ LEAVE (${room.getPlayerList().length}/${maxPlayers})\n**${player.name}**` +
						`[${authArray[player.id][0]}] {${authArray[player.id][1]}}`;
					fetch(roomWebhook, {
						method: 'POST',
						body: JSON.stringify({
							content: stringContent,
							username: roomName,
						}),
						headers: {
							'Content-Type': 'application/json',
						},
					}).then((res) => res);
				}
			} else kickFetchVariable = false;
		}, 10);
		const thisPlayer = await playersDB.findOne({nickname: player.name, auth: authArray[player.id][0]});
		if (thisPlayer != undefined) await playersDB.updateOne({ nickname: player.name }, { $set: { isLogged: false } })
		handleLineupChangeLeave(player);
		checkCaptainLeave(player);
		updateTeams();
		handlePlayersLeave();
	};

	room.onPlayerKicked = function (kickedPlayer, reason, ban, byPlayer) {
		kickFetchVariable = true;
		/*if (modWebhook != '') {
			let stringContent = `[${getDate()}] ⛔ ${ban ? 'BAN' : 'KICK'} (${playersAll.length}/${maxPlayers})\n` +
				`**${kickedPlayer.name}** [${kickedPlayer.auth}] {${kickedPlayer.conn}} was ${ban ? 'banned' : 'kicked'}` +
				`${byPlayer != null ? ' by **' + byPlayer.name + '** [' + byPlayer.auth + '] {' + byPlayer.conn + '}' : ''}`
			fetch(modWebhook, {
				method: 'POST',
				body: JSON.stringify({
					content: stringContent,
					username: roomName,
				}),
				headers: {
					'Content-Type': 'application/json',
				},
			}).then((res) => res);
		}*/
		if (ban) {
			if (byPlayer != null) {
				room.sendAnnouncement(
					'Puoi bannare solo tramite !ban!',
					byPlayer.id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
				room.setPlayerAdmin(byPlayer.id, false);
				room.clearBan(kickedPlayer.id)
				return false
			}
		}
	};

	/* PLAYER ACTIVITY */
	room.onPlayerChat = function (player, message) {
		// clean string MESSAGE
		let oldMessage = message;
		message = message.trim();
		if ((typeof message === "string" && message.length === 0) || message === null || message == ""){
				writeLog("", "[Err message] " + player.name + ": " + oldMessage, true);
				return false;
		}

	    // Ritarda l'esecuzione di un millisecondo
	    setTimeout(() => {
	        handlePlayerChat(player, message);
	    }, 1);
	    return false;
	};


	async function handlePlayerChat(player, message) {
	    const thisPlayer = await playersDB.findOne({nickname: player.name});
		if (thisPlayer != undefined){
			Object.assign(player, {auth: thisPlayer.auth});
	    	Object.assign(player, {conn: thisPlayer.connect});
	    	Object.assign(player, {role: thisPlayer.role});
	    	Object.assign(player, {logged: thisPlayer.isLogged});
		}else{
			Object.assign(player, {auth: authArray[player.id][0]});
	    	Object.assign(player, {conn: authArray[player.id][1]});
	    	Object.assign(player, {role: Role.GUEST});
	    	Object.assign(player, {logged: false});
		}
	    
		writeLog("", "[" + player.role + "] " + player.name + ": " + message, true);

		// DELETE AFK
		if (gameState !== State.STOP && player.team != Team.SPECTATORS) {
			let pComp = getPlayerComp(player);
			if (pComp != null) pComp.inactivityTicks = 0;
		}

		// VARIABLES
		let msgArray = message.split(/ +/);
		let convertedToNickname = convertToUnicodeFormat(player.name)
		let msg = "", typeColor = errorColor, isMessage = true, isBold = 1, commandName;

		// COMMANDS
		if (msgArray[0][0].includes("!")) {
			commandName = getCommand(msgArray[0].slice(1).toLowerCase())
			if (commandName) {
				const command = commands[commandName]
				if ((Array.isArray(command.roles) && command.roles.some(role => player.role >= role)) || player.role >= command.roles) {
					// Se il giocatore ha il permesso di usare il comando
					await command.function(player, message);
				} else {
					room.sendAnnouncement(`Non hai accesso a questo comando. Immetti '!help' per ottenere i comandi disponibili.`, player.id, errorColor, 'bold', HaxNotification.CHAT);
				}
				
			} else {
				room.sendAnnouncement(`Il comando che hai inserito non esiste. Immetti '!help' per ottenere i comandi disponibili.`, player.id, errorColor, 'bold', HaxNotification.CHAT)
			}
			if (modWebhook != '') {
				fetch(modWebhook, {
					method: 'POST',
					body: JSON.stringify({
						content: `[${formatCurrentDate()}] 💬🛠️ CHAT-COMANDO\n**${player.name}**: ${message.replace('@', '@ ')}`,
						username: roomName,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				}).then((res) => res)
			}
			return Promise.resolve(false);
		} else {
			if (roomWebhook != '') {
				fetch(roomWebhook, {
					method: 'POST',
					body: JSON.stringify({
						content: `[${formatCurrentDate()}] 💬 CHAT\n**${player.name}**: ${message.replace('@', '@ ')}`,
						username: roomName,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				}).then((res) => res)
			}
		}

		// CHOOSEMODE CHAT
		if (chooseMode && teamRed.length * teamBlue.length != 0) {
			let choosingMessageCheck = chooseModeFunction(player, message)
			if (choosingMessageCheck) return false
		}


		// MUTE SYSTEM
		if (player.role < Role.ADMIN && muteArray.getByAuth(player.auth) != null) {
			room.sendAnnouncement(`Sei stato mutato! [tempo rimanente: ${getPlaytimeString(muteArray.getByAuth(player.auth).getRemainingTime())}]\nRispetta le regole!`, player.id, errorColor, 'bold', HaxNotification.CHAT)

			room.getPlayerList().forEach(a => {
				if (a.admin) {
					let thisAdmin = allAdmins.find(b => b.nickname == a.name)
					if(thisAdmin != null){
						if (thisAdmin.readMutes) room.sendAnnouncement(`[MUTED] ${player.name}: ${message}`, a.id, 0xFFC312, 'bold', HaxNotification.CHAT)
					}else{
						if (roomWebhook != '') {
							fetch(roomWebhook, {
								method: 'POST',
								body: JSON.stringify({
									content: `[${formatCurrentDate()}] ⚠️ CHAT\n**Admin:${a.name}[${a.admin}]**: ERRORE MUTE SYSTEM`,
									username: roomName,
								}),
								headers: {
									'Content-Type': 'application/json',
								},
							}).then((res) => res)
						}
					}
				}
			})
			return false
		}

		// GROUP CHAT
		if ((msgArray[0].toLowerCase() == 't' || (msgArray[0] == '!' && msgArray[1].toLowerCase() == 't')) && player.role != Role.GUEST && player.logged) {
			teamChat(player, message, convertedToNickname)
			return false
		}
		if (msgArray[0].substring(0, 2) == '@@' && player.role != Role.GUEST && player.logged) {
			playerChat(player, message, convertedToNickname)
			return false
		}
		if (msgArray[0].toLowerCase() == 's!' && player.role != Role.GUEST && player.logged) {
			//adminChat(player, message, convertedToNickname)
			//return false
		}

		// GLOBAL CHAT
		//const rankPlayer = ranking.find(a => a.nickname == player.name)
		if (thisPlayer != undefined /*&& rankPlayer != undefined*/ && (msgArray[0][0] != '!') && player.logged) {
			if (thisPlayer.nickname == "Momito") { typeColor = 0x910101, isBold = 1 }
			else if (thisPlayer.role == Role.DEVELOPER) { typeColor = developerColor, isBold = 1 }
			else if (thisPlayer.role == Role.FOUNDER) typeColor = founderColor
			else if (thisPlayer.role == Role.ADMIN) typeColor = adminColor
			else if (thisPlayer.role == Role.MODERATOR) typeColor = moderatorColor
			else if (thisPlayer.role == Role.HELPER) typeColor = helperColor
			else if (thisPlayer.role == Role.VIP) { typeColor = vipColor, isBold = 0 }
			else if (thisPlayer.role == Role.PARTNER) { typeColor = partnerColor, isBold = 0 }
			else if (thisPlayer.role == Role.PLAYER) { typeColor = playerColor, isBold = 0 }
			else if (thisPlayer.role == Role.EVENT) { typeColor = helperColor }
			else if (thisPlayer.role == Role.OWNER) { typeColor = ownerColor }

			//msg = `${thisPlayer.roleString} ${rankPlayer.rankString}${thisPlayer.eventString} ${convertedToNickname}: ${message}`
			msg = `${thisPlayer.roleString} ${convertedToNickname}: ${message}`
		} else {
			room.getPlayerList().forEach(a => {
				if (a.admin) {
					let thisAdmin = allAdmins.find(b => b.nickname == a.name)
					if(thisAdmin != null){
						if (thisAdmin.readMutes) room.sendAnnouncement(`[NOT ACCESS] ${player.name}: ${message}`, a.id, 0xFFC312, 'bold', HaxNotification.CHAT)
					}else{
						if (roomWebhook != '') {
							fetch(roomWebhook, {
								method: 'POST',
								body: JSON.stringify({
									content: `[${formatCurrentDate()}] ⚠️ CHAT\n**Admin:${a.name}[${a.admin}]**: ERRORE NOT ACCESS SYSTEM`,
									username: roomName,
								}),
								headers: {
									'Content-Type': 'application/json',
								},
							}).then((res) => res)
						}
					}
				}
			});
			msg = `Non puoi chattare se non hai un account (!register o !login se ne hai già uno)!`;
			isMessage = false;
			typeColor = errorColor;
			isBold = 2;
		}

		// slowmode
		if (slowMode > 0) {
			let filter = slowModeFunction(player, message);
			if (filter) { 
				room.sendAnnouncement(`⏲️ Devi attendere ${(player.role < Role.PLAYER) ? (notVerifiedSlowMode + " secondi") : (slowMode == 1) ? "un secondo" : (slowMode + " secondi")} per poter inviare un nuovo messaggio.`, player.id, infoColor, 'bold', HaxNotification.CHAT);
				return Promise.resolve(false);
			}
		}

		// annunci chat globale
		if (msg != "") {
			room.sendAnnouncement(msg, isMessage ? null : player.id, typeColor, isBold == 1 ? 'bold' : (isBold == 2 ? 'small-bold' : 'normal'), HaxNotification.CHAT);
		}
		return Promise.resolve(false);
	};


	room.onPlayerActivity = function (player) {
		if (gameState !== State.STOP) {
			let pComp = getPlayerComp(player);
			if (pComp != null) pComp.inactivityTicks = 0;
		}
	};

	room.onPlayerBallKick = function (player) {
		ballSpeedKick = getBallSpeed()
		if (playSituation != Situation.GOAL) {
			let ballPosition = room.getBallPosition();
			if (game.touchArray.length == 0 || player.id != game.touchArray[game.touchArray.length - 1].player.id) {
				if (playSituation == Situation.KICKOFF) playSituation = Situation.PLAY;
				lastTeamTouched = player.team;
				game.touchArray.push(
					new BallTouch(
						player,
						game.scores.time,
						getGoalGame(),
						ballPosition
					)
				);
				lastTouches[0] = checkGoalKickTouch(
					game.touchArray,
					game.touchArray.length - 1,
					getGoalGame()
				);
				lastTouches[1] = checkGoalKickTouch(
					game.touchArray,
					game.touchArray.length - 2,
					getGoalGame()
				);
			}
			if (lastPlayerKick != undefined && lastPlayerKick.id != player.id && lastPlayerKick.team == player.team) {
				if (ballTouched && ballSpeedKick >= 90) {
					clearTimeout(ballTouchTimer)
					ballTouched = false
					playersRocket = [player, lastPlayerKick]
					room.setPlayerAvatar(playersRocket[0].id, "🚀")
					room.setPlayerAvatar(playersRocket[1].id, "🚀")
					setTimeout(() => {
						if (playSituation != Situation.GOAL)
							room.getPlayerList().forEach(a => {
								if (a.team == 1 && playersRocket[0].team == 1) {
									room.setPlayerAvatar(a.id, AvatarRed)
								}
								else if (a.team == 2 && playersRocket[0].team == 2)
									room.setPlayerAvatar(a.id, AvatarBlue)
							})
						else if (playSituation == Situation.GOAL) room.getPlayerList().forEach(a => { if (a.team == 1 && playersRocket[0].team == 1 && !rocketTeamGoal.includes(a.id)) { room.setPlayerAvatar(a.id, AvatarRed) } else if (a.team == 2 && playersRocket[0].team == 2 && !rocketTeamGoal.includes(a.id)) room.setPlayerAvatar(a.id, AvatarBlue) })
					}, 2000)
				}
			}
			lastPlayerKick = player
			clearTimeout(ballTouchTimer)
			ballTouched = true
			ballTouchTimer = setTimeout(() => ballTouched = false, 150)
		}
	};

	/* GAME MANAGEMENT */

	room.onGameStart = function (byPlayer) {
		clearTimeout(startTimeout);
		if (byPlayer != null) clearTimeout(stopTimeout);
		game = new Game();
		let randomSkin = Math.floor(Math.random() * (Object.entries(Skins).length) + 1);
		let textRed = "!skin 1 "+randomSkin;
		let textBlu = "!skin 2 "+randomSkin;
		setSkinCommand(emptyPlayer, textRed);
		setSkinCommand(emptyPlayer, textBlu);
		possession = [0, 0];
		actionZoneHalf = [0, 0];
		gameState = State.PLAY;
		endGameVariable = false;
		goldenGoal = false;
		playSituation = Situation.KICKOFF;
		lastTouches = Array(2).fill(null);
		lastTeamTouched = Team.SPECTATORS;
		teamRedStats = [];
		teamBlueStats = [];
		if (teamRed.length == teamSize && teamBlue.length == teamSize) {
			for (let i = 0; i < teamSize; i++) {
				teamRedStats.push(teamRed[i]);
				teamBlueStats.push(teamBlue[i]);
			}
		}
		calculateStadiumVariables();
	};

	room.onGameStop = function (byPlayer) {
		clearTimeout(stopTimeout);
		clearTimeout(unpauseTimeout);
		if (byPlayer != null) clearTimeout(startTimeout);
		game.rec = room.stopRecording();
		if (
			!cancelGameVariable && game.playerComp[0].length + game.playerComp[1].length > 0 &&
			(
				(game.scores.timeLimit != 0 &&
					((game.scores.time >= 0.5 * game.scores.timeLimit &&
						game.scores.time < 0.75 * game.scores.timeLimit &&
						game.scores.red != game.scores.blue) ||
						game.scores.time >= 0.75 * game.scores.timeLimit)
				) ||
				endGameVariable
			)
		) {
			fetchSummaryEmbed(game);
			if (fetchRecordingVariable) {
				setTimeout((gameEnd) => { fetchRecording(gameEnd); }, 500, game);
			}
		}
		cancelGameVariable = false;
		gameState = State.STOP;
		playSituation = Situation.STOP;
		updateTeams();
		handlePlayersStop(byPlayer);
		handleActivityStop();
	};

	room.onGamePause = function (byPlayer) {
		gameState = State.PAUSE;
		if (mentionPlayersUnpause && gameState == State.PAUSE) {
			if (byPlayer != null) {
				room.sendAnnouncement(
					`Gioco in pausa da ${byPlayer.name} !`,
					null,
					defaultColor,
					'bold',
					HaxNotification.NONE
				);
			} else {
				room.sendAnnouncement(
					`Gioco in pausa !`,
					null,
					defaultColor,
					'bold',
					HaxNotification.NONE
				);
			}
		}
		clearTimeout(unpauseTimeout);
	};

	room.onGameUnpause = function (byPlayer) {
		unpauseTimeout = setTimeout(() => {
			gameState = State.PLAY;
		}, 2000);
		if (mentionPlayersUnpause) {
			if (byPlayer != null) {
				room.sendAnnouncement(
					`Gioco ripreso da ${byPlayer.name} !`,
					null,
					defaultColor,
					'bold',
					HaxNotification.NONE
				);
			} else {
				room.sendAnnouncement(
					`Gioco ripreso !`,
					null,
					defaultColor,
					'bold',
					HaxNotification.NONE
				);
			}
		}
		if (
			(teamRed.length == teamSize && teamBlue.length == teamSize && chooseMode) ||
			(teamRed.length == teamBlue.length && teamSpec.length < 2 && chooseMode)
		) {
			deactivateChooseMode();
		}
	};

	room.onTeamGoal = function (team) {
		const scores = room.getScores();
		game.scores = scores;
		playSituation = Situation.GOAL;
		ballSpeed = getBallSpeed();
		let goalString = getGoalString(team);
		for (let player of teamRed) {
			let playerComp = getPlayerComp(player);
			team == Team.RED ? playerComp.goalsScoredTeam++ : playerComp.goalsConcededTeam++;
		}
		for (let player of teamBlue) {
			let playerComp = getPlayerComp(player);
			team == Team.BLUE ? playerComp.goalsScoredTeam++ : playerComp.goalsConcededTeam++;
		}
		room.sendAnnouncement(
			goalString,
			null,
			team == Team.RED ? redColor : blueColor,
			null,
			HaxNotification.CHAT
		);
		if (roomWebhook != '') {
			fetch(roomWebhook, {
				method: 'POST',
				body: JSON.stringify({
					content: `[${formatCurrentDate()}] ${goalString}`,
					username: roomName,
				}),
				headers: {
					'Content-Type': 'application/json',
				},
			}).then((res) => res);
		}
		if ((scores.scoreLimit != 0 && (scores.red == scores.scoreLimit || scores.blue == scores.scoreLimit)) || goldenGoal) {
			endGame(team);
			goldenGoal = false;
			stopTimeout = setTimeout(() => {
				room.stopGame();
			}, 1000);
		}
	};

	room.onPositionsReset = function () {
		lastTouches = Array(2).fill(null);
		lastTeamTouched = Team.SPECTATORS;
		playSituation = Situation.KICKOFF;
	};

	/* MISCELLANEOUS */

	room.onRoomLink = function (url) {
		writeLog("", `${url}`, true);
		if (!debugMode) {
			const objectBodyWebhook = {
				embeds: [
					{
						title: `Nuovo riavvio della room`,
						author: {name: "NEW RESTART"},
						description: `[${getDate()}] 🔗 LINK:  ${url}`,
						color: 0x0652DD,
						timestamp: new Date().toISOString(),
					},
				],
				username: roomName
			}
			if (modWebhook != '') {
				fetch(modWebhook, {
					method: 'POST',
					body: JSON.stringify(objectBodyWebhook),
					headers: {
						'Content-Type': 'application/json',
					},
				}).then((res) => res)
			}
		}
	};

	room.onPlayerAdminChange = async function (changedPlayer, byPlayer) {
		updateTeams();
		if (!changedPlayer.admin && await getRole(byPlayer) >= Role.ADMIN) {
			room.setPlayerAdmin(changedPlayer.id, true);
			return;
		}
	};

	room.onKickRateLimitSet = function (min, rate, burst, byPlayer) {
		if (byPlayer != null) {
			room.sendAnnouncement(
				`Non è consentito modificare il limite di kickrate. Deve rimanere a "6-0-0"..`,
				player.id,
				errorColor,
				'bold',
				HaxNotification.CHAT
			);
			room.setKickRateLimit(6, 0, 0);
		}
	};

	room.onStadiumChange = async function (newStadiumName, byPlayer) {
		if (byPlayer != null) {
			if (await getRole(byPlayer) < Role.HELPER && currentStadium != 'other') {
				room.sendAnnouncement(
					`Non puoi modificare lo stadio manualmente ! Utilizzare i comandi dello stadio.`,
					byPlayer.id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
				stadiumCommand(emptyPlayer, `!${currentStadium}`);
			} else {
				room.sendAnnouncement(
					`Mappa modificata. Per favore utilizzate i comandi per lo stadio.`,
					byPlayer.id,
					infoColor,
					'bold',
					HaxNotification.CHAT
				);
				currentStadium = 'other';
			}
		}
		checkStadiumVariable = true;
	};

	room.onGameTick = function () {
		checkTime();
		getLastTouchOfTheBall();
		getGameStats();
		handleActivity();
	};


});
