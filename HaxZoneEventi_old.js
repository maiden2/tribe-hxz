const haxball = require('haxball.js');
const FormData = require('form-data');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const axios = require('axios');
const bcrypt = require("bcrypt");
require('dotenv').config(); // INIT .ENV
const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(process.env.MONGODB_URI); // INIT MONGODB
// Richiedi il modulo componente.js
const componente = require('./componente');

let db, playersDB, adminsDB, bansDB, ipBanDB, statsDB, playerInventoryDB; // Var for DB

/* INIT ROOM */
haxball.then(async (HBInit) => {

	/* DEBUG */
	const debugFilter = true
	const debugDiscord = false
	let debugMode = false;
	function writeLog(file, mess, flagCL) {
		/*if (file != "") {
			fs.promises.appendFile(file + "EVENTO.txt", "\n" + getDate() + " - " + mess) // Con questa funzione inseriamo in coda al file
				.then(() => { });
		}
		if (flagCL) {*/
			console.log(formatCurrentDate() + " - " + mess);
		//}
	}
	writeLog("", "~~~~~~~~~~~~~~~~~~~~~~~~ INIZIO AVVIO EVENTI ~~~~~~~~~~~~~~~~~~~~~~~~", true);
	/* -------------- */

	/* TOKEN & API */
	const token = process.env.EVENT_TOKEN; // https://www.haxball.com/headlesstoken
	let gameWebhook = debugDiscord ? '' : 'https://discord.com/api/webhooks/1194798481232121897/HYMEwlAOHxyzho2L6jUA0lWU4A4q0YzrRaSK_5e5JFx3w5TOVlYIKxolHSde3Kc6ktMF'; // this webhook is used to send the summary of the games ; it should be in a public discord channel
	let roomWebhook = debugDiscord ? '' : 'https://discord.com/api/webhooks/1194808100255965244/NJpeWyJtWrDxpaaPhR2XxrZ6N_VBfrpTC-wv1WhipoBneVHzhzZk-aESF3ZZpeB3WyXo'; // this webhook is used to send the details of the room (chat, join, leave) ; it should be in a private discord channel
	let modWebhook = debugDiscord ? '' : 'https://discord.com/api/webhooks/1194810375745585172/NLm8pfJNZB-JpQuq4DCmgXHnU83xcEd_sL0T3DyG2kgY8aiTH2_mrE_l327jfeDJmGYC'; // this webhook is used to send the details of the commands (ban, kick, password) ; it should be in a FOUNDER private discord channel
	/* ------------------------------------- */

	/* RUN MONGODB */
	async function run() {
		await client.connect()
		writeLog("log", "Connessione al Database riuscita.", false);
		db = client.db("HaxZoneDB");
		playersDB = db.collection("PlayersAccount");
		adminsDB = db.collection("PlayersAdmin");
		bansDB = db.collection("PlayersBan");
		//tempBanDB = db.collection("PlayersTempban");
		ipBanDB = db.collection("IPBan");
		
		playerInventoryDB = db.collection("PlayersInventory");
		//verifyDB = db.collection("DiscordVerify");
		topStreakDB = db.collection("TopStreak");
		//nicknameBLDB = db.collection("NicknameBlacklist");

		/*ranksDB = db.collection("RankList");
		rankingDB = db.collection("PlayersRanking");
		monthlystatsDB = db.collection("MonthlyPlayersStats");
		monthlyEventDB = db.collection("MonthlyPlayChallengeSeries");*/

		//prizeEventDB = db.collection("FruitParty");
		//penaltiesDB = db.collection("PlayersPenalties");
		//ticketCountDB = dbD.collection("TicketCount");
		//subscriberDB = db.collection("PlayersSub");

		dbEvent = client.db("HaxZoneEvent");
		statsDB = dbEvent.collection("PlayersStats");
		gamesDB = dbEvent.collection("Games");
		leaderDB = dbEvent.collection("Leaderboard");
	}
	await run().catch(err => writeLog("", "Errore RUN MONGODB: " + err, true))
	/* -------------------------------------------------------- */

	/* JSON DATA */
	let authArray = []

	let partnerList = [/*[auth, nickname]*/]
	let vipList = [/*[auth, nickname]*/]
	let helperList = [/*[auth, nickname]*/]
	let moderatorList = [/*[auth, nickname]*/]
	let adminList = [/*[auth, nickname]*/]
	let founderList = [/*[auth, nickname]*/]
	let developerList = [/*[auth, nickname]*/]

	let blackList = [{ nickname: "", ac_nick: "", banID: -1, infractionID: -1, auth: "", connect: "", reason: "", BannedBy: "" }]
	//let tempBlacklist = [{ nickname: "", id: -1, auth: "", connect: "", data: "", durata: "", reason: "", BannedBy: "" }]
	let IPBanList = [{ Connect: "", Auth: "", Permaban: true }]

	/*let penalties = [{ nickname: "", levelWarn: -1, numberInfractions: -1, infractions: [], removedInfractions: [] }]
	let infractionCount = 0*/

	let accounts = [{ registerDate: -1, nickname: "", auth: "", connect: "", password: "", country: "", role: -1, roleString: "", lastLogin: -1, isBanned: false, isLogged: false }]
	//let customization = [{ nickname: "", currentSkin: -1, currentStadium: -1, allowedSkin: [], allowedStadium: [], sacks: [] }]
	//let ranking = [{ nickname: "", rankPoints: -251, rankString: "", rankedGames: -1 }]
	//let subscriber = [{ nickname: "", subrole: -1, subroleString: "", endData: -1, colorchat: "", customWelcome: "", prefix: "", currentAnimation: "" }]
	let stats = [{ nickname: "", games: -1, wins: -1, winrate: "", goals: -1, ownGoals: -1, assists: -1, cs: -1, playtime: -1, hatTrick: -1 }]
	let topstreaks = [{ streak: -1, players: "", timestamp: -1 }]
	//let nicknameBlacklist = [{ nickname: "" }]
	//let rankList = [{ rankName: "", rankUp: 0, rankDown: 0, rankString: "" }]
	let monthlyStats = [{ nickname: "", games: -1, wins: -1, winrate: "", goals: -1, ownGoals: -1, assists: -1, cs: -1, playtime: -1, hatTrick: -1, month: -1 }]
	//let monthlyEvent = [{ month: 0, year: 0, name: "", total_game: 0, first_goal: 0, second_goal: 0, desc_fg: "", desc_sg: "", name_sacks: "", code: "", isFull: false }]
	/* ---------------------------------------- */



	/* CONFIG ROOM */
	const roomName = '🔷️ • HaxZone • 🏆 LEAGUE 2 🎖️🔷';
	const maxPlayers = 22;
	const roomPublic = debugMode ? false : true;
	const geo = { "code": "IT", "lat": 42.5176067, "lon": 12.5154289 }

	let fetchRecordingVariable = true;
	let timeLimit = 5;
	let scoreLimit = 0;
    let lastAction = true
    let maxDefenders = 0
    let kickOffKL = false
    let numberHalves = 1, currentHalf = 1

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

	let roomPassword = process.env.ROOM_PASSWORD;
	room.setPassword(roomPassword);
	
	room.setScoreLimit(scoreLimit);
	room.setTimeLimit(timeLimit);
	room.setTeamsLock(true);
	room.setKickRateLimit(6, 0, 0);
	/* ----------------------- */


	
	let currentStadium = 'training';
	let bigMapObj = JSON.parse(SThaxzone);

	/* ANNOUNCEMENT */
	let msgUpdate = "✨ Room HaxZone League!\n🏆 HAXZONE LEAGUE 🎖️\nLink Discord --->>> https://discord.gg/5XU2e8M85d <<<---"
	/* ------------------------------ */

	/* OPTIONS */
	let drawTimeLimit = 0;
	let teamSize = 3;
	let maxAdmins = 0;

	let disableBans = false;

	let afkLimit = debugMode ? Infinity : 15;
	let defaultSlowMode = 1;
	let chooseModeSlowMode = 2.5;
	let slowMode = defaultSlowMode;
	let notVerifiedSlowMode = 2.5
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

	const Role = { GUEST: 0, PLAYER: 1, PARTNER: 2, VIP: 3, HELPER: 4, MODERATOR: 5, ADMIN: 6, FOUNDER: 7, DEVELOPER: 8 };
	const RoleEmoji = { GUEST: "🔒", PLAYER: "👤", PARTNER: "🤝", VIP: "💎", HELPER: "⛑️", MODERATOR: "🪖", ADMIN: "🎩", FOUNDER: "🔑", DEVELOPER: "👨‍💻" };

	let skinRed = 1;
	let skinBlu = 1;
	const Skins = { HAX: 0, LUPA_CASA: 1, LUPA_TRAS: 2, LUPA_TERZ: 3,  SPOR_CASA: 4, SPOR_TRAS: 5, SPOR_TERZ: 6, INPS_CASA: 7, INPS_TRAS: 8, INPS_TERZ: 9, TROL_CASA: 10, TROL_TRAS: 11, TROL_TERZ: 12, CERI_CASA: 13, CERI_TRAS: 14, CERI_TERZ: 15, POTA_CASAS: 16, POTA_TRAS: 17, POTA_TERZ: 18, MONK_CASA: 19, MONK_TRAF: 20, MONK_TERZ: 21, ASTR_CASA: 22, ASTR_TRAS: 23, ASTR_TERZ: 24, SKIL_CASA:25, SKIL_TRAS: 26, SKIL_TERZ: 27,  CAMM_CASA: 28, CAMM_TRAS: 29, CAMM_TERZ:30, WOLV_CASA: 31, WOLV_TRAS: 32, WOLV_TERZ: 33, BRIG_CASA: 34, BRIG_TRAS: 35, BRIG_TERZ: 36 }
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
	let banList = [];
	/* --------------------------- */

	/* SKIN */
	function skinsCommand(player, message) {
		let testo = "";
    	Object.entries(Skins).forEach(([key, value]) => {
    		if( value==0 || (value-1)%3==0) testo += "\n"
		    testo += `[${value}] skin -> ${key}, `;
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
			if (skin == Skins.HAX) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 42, 0x432323, [0xFF6771, 0xFFFFFF, 0xFF6771])
					skinRed = Skins.HAX;
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 42, 0x3E535D, [0xA9E5FF, 0xFFFFFF, 0xA9E5FF])
					skinBlu = Skins.HAX;
				}
			}
			else if (skin == Skins.LUPA) {
				if (team == Team.RED) {
					AvatarRed = "🐺";
					room.setTeamColors(1, 110, 0x030303, [0xBF4EB8, 0xE46FD7, 0xBF4EB8])
					skinRed = Skins.LUPA;
				} else if (team == Team.BLUE) {
					AvatarBlue = "🐺";
					room.setTeamColors(2, 250, 0x030303, [0xBF4EB8, 0xE46FD7, 0xBF4EB8])
					skinBlu = Skins.LUPA;
				}
			}
			else if (skin == Skins.SPORT) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 0, 0xF2B52C, [0xFFFFFF])
					skinRed = Skins.SPORT;
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 0, 0xF2B52C, [0xFFFFFF])
					skinBlu = Skins.SPORT;
				}
			}
			else if (skin == Skins.WOLV_CASA) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 34, 0xFFFFFF, [0x39AFE2, 0x35A2D1, 0x2F91BB])
					skinRed = Skins.WOLV_CASA;
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 34, 0xFFFFFF, [0x39AFE2, 0x35A2D1, 0x2F91BB])
					skinBlu = Skins.WOLV_CASA;
				}
			}
			else if (skin == Skins.WOLV_TRAS) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 34, 0xFFFFFF, [0x5E125D])
					skinRed = Skins.WOLV_TRAS;
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 34, 0xFFFFFF, [0x5E125D]) 
					skinBlu = Skins.WOLV_TRAS;
				}
			}
			else if (skin == Skins.WOLV_TERZ) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 35, 0xFFFFFF, [0x2A2A2A, 0xFB971D])
					skinRed = Skins.WOLV_TERZ;
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 35, 0xFFFFFF, [0x2A2A2A, 0xFB971D]) 
					skinBlu = Skins.WOLV_TERZ;
				}
			}
			else if (skin == Skins.MONK_CASA) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 58, 0xFFFFFF, [0xFF78F3, 0xC8102E, 0xFF78F3])
					skinRed = Skins.MONK_CASA;
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 58, 0xFFFFFF, [0xFF78F3, 0xC8102E, 0xFF78F3]) 
					skinBlu = Skins.MONK_CASA;
				}
			}
			else if (skin == Skins.MONK_TRAF) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 45, 0x545454, [0xC0C0C0, 0xD9B338])
					skinRed = Skins.MONK_TRAF;
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 45, 0x545454, [0xC0C0C0, 0xD9B338])
					skinBlu = Skins.MONK_TRAF;
				}
			}
			else if (skin == Skins.MONK_TERZ) {
				if (team == Team.RED) {
					AvatarRed = null;
					room.setTeamColors(1, 45, 0xFFFFFF, [0x1E8AB6, 0x1E8AB6, 0xF928D2])
					skinRed = Skins.MONK_TERZ;
				} else if (team == Team.BLUE) {
					AvatarBlue = null;
					room.setTeamColors(2, 45, 0xFFFFFF, [0x1E8AB6, 0x1E8AB6, 0xF928D2])
					skinBlu = Skins.MONK_TERZ;
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
	/* -------------------------------- */


	const loadFromDB = async (firstRun, joinCall) => {
		const allAdmins = await adminsDB.find({}).project({ _id: 0 }).toArray()
		if (!firstRun) {
			partnerList = []
			vipList = []
			helperList = []
			moderatorList = []
			adminList = []
			founderList = []
			developerList = []
		}
		allAdmins.forEach(a => {
			switch (a.role) {
				case 2: {
					partnerList.push([a.auth, a.nickname])
					break
				}
				case 3: {
					vipList.push([a.auth, a.nickname])
					break
				}
				case 4: {
					helperList.push([a.auth, a.nickname])
					break
				}
				case 5: {
					moderatorList.push([a.auth, a.nickname])
					break
				}
				case 6: {
					adminList.push([a.auth, a.nickname])
					break
				}
				case 7: {
					founderList.push([a.auth, a.nickname])
					break
				}
				case 8: {
					developerList.push([a.auth, a.nickname])
					break
				}
				default:
					break
			}
		})
		if (!joinCall) writeLog("log", "Ruoli in Array Caricati.", false);

		blackList = await bansDB.find({}).project({ _id: 0 }).toArray()
		if (firstRun && !debugMode) {
			blackList.forEach(a => { if (a.id != -1) a.id = -1 })
			await bansDB.updateMany({ id: { $ne: -1 } }, { $set: { id: -1 } })
			await bansDB.updateMany({ ac_nick: { $ne: "???" } }, { $set: { ac_nick: "???" } })
		}
		if (!joinCall) writeLog("log", "Player bananti caricati..", false);

		if (firstRun && !debugMode) await ipBanDB.deleteMany({ Permaban: false })
		IPBanList = await ipBanDB.find({}).project({ _id: 0 }).toArray()
		if (!joinCall) writeLog("log", "IP bannati caricati.", false);

		/*penalties = await penaltiesDB.find({}).project({ _id: 0 }).toArray()
		infractionCount = (await ticketCountDB.findOne({ category: "infraction" }))?.count
		if (!joinCall) console.log("Fedina penale caricata.", infractionCount)*/

		if (firstRun) {
			await playersDB.updateMany({ role: 0 }, { $set: { roleString: "👤" } })
			await playersDB.updateMany({ isLogged: { $ne: false } }, { $set: { isLogged: false } })
			accounts = await playersDB.find({}).project({ _id: 0 }).toArray()
		}
		else if (!firstRun) {
			const allAccounts = await playersDB.find({}).project({ _id: 0 }).toArray()
			allAccounts.forEach(a => a.isLogged = false)
			room.getPlayerList().forEach(a => {
				const newAccount = allAccounts.find(b => b.nickname == a.name && b.auth == authArray[a.id][0])
				const oldAccount = accounts.find(b => b.nickname == a.name && b.auth == authArray[a.id][0])
				if (newAccount != undefined && oldAccount != undefined) newAccount.isLogged = oldAccount.isLogged
			})
			accounts = allAccounts
		}
		if (!joinCall) writeLog("log", "Account dei player caricati.", false);

		/*const verified = await verifyDB.find({}).project({ _id: 0 }).toArray()
		accounts.forEach(a => {
			if (verified.findIndex(b => b.nickname == a.nickname) != -1) {
				if (a.role < Role.VERIFY) {
					a.role = Role.VERIFY
					a.roleString = RoleEmoji.VERIFY
					accountsDB.updateOne({ nickname: a.nickname }, { $set: { role: Role.VERIFY, roleString: RoleEmoji.VERIFY } })
				}
			}
			else if (a.role >= Role.VERIFY && a.role <= Role.ADMIN_MINUS) {
				a.role = Role.REGISTER
				a.roleString = RoleEmoji.REGISTER
				accountsDB.updateOne({ nickname: a.nickname }, { $set: { role: Role.REGISTER, roleString: RoleEmoji.REGISTER } })
			}
		})
		if (!joinCall) console.log("Verifiche caricate.")*/

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

			stats = await statsDB.find({}).project({ _id: 0 }).toArray()
			writeLog("log", "Statistiche dei player caricate.", false);

			topstreaks = await topStreakDB.find({}).project({ _id: 0 }).toArray()
			topstreaks.sort((a, b) => {
				if (a.streak < b.streak) return 1
				else if (a.streak > b.streak) return -1
				if (a.timestamp < b.timestamp) return 1
				else if (a.timestamp > b.timestamp) return -1
				return 0
			})
			topstreaks = [topstreaks[0], topstreaks[1], topstreaks[2], topstreaks[3], topstreaks[4]]
			writeLog("log", "Top Streak caricate.", false);

			/*rankList = await ranksDB.find({}).project({ _id: 0 }).toArray()
			console.log("Lista ranks caricata.")*/
		}
		/*if (firstRun) {
			monthlyStats = await monthlystatsDB.find({}).project({ _id: 0 }).toArray()
			console.log("Statistiche mensili caricate.")
			monthlyEvent = await monthlyEventDB.find({}).project({ _id: 0 }).toArray()
			console.log("Eventi mensili caricati.\n")
		} else if (playSituation == Situation.STOP) {
			monthlyStats = await monthlystatsDB.find({}).project({ _id: 0 }).toArray()
			if (!joinCall) console.log("Statistiche mensili caricate.")
			monthlyEvent = await monthlyEventDB.find({}).project({ _id: 0 }).toArray()
			if (!joinCall) console.log("Eventi mensili caricati.\n")
		}*/
		/*if (!debugMode && firstRun) {
			const objectBodyWebhook = {
				embeds: [
					{
						title: `Nuovo riavvio della room`,
						author: {
							name: "NEW RESTART",
							icon_url: "https://i.imgur.com/d5pn5HE.gif"
						},
						color: 0x0652DD,
						timestamp: new Date().toISOString(),
					},
				],
				username: "Check Moderazione [3v3]"
			}
			if (modWebkook != '') {
				fetch(modWebkook, {
					method: 'POST',
					body: JSON.stringify(objectBodyWebhook),
					headers: {
						'Content-Type': 'application/json',
					},
				}).then((res) => res)
			}
		}*/
		writeLog("log", "--- Load From DB: Caricato con successo!", false)
	}
	await loadFromDB(true, false).catch(err => writeLog("log", "Errore LoadFromDB: " + err, false))
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

	let AnimationIntervalGoal = ""
	let AnimationIntervalAssist = ""
	let AnimationIntervalOwnGoal = ""
	let animationAvatar = ""
	let animationCount = 0
	let animationAvatarCount = 0

	let lastBallPosition = undefined
  	let lastActionChecked = false
  	let lastActionFinished = false
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
	let AFKMinSet = new Set();
	let AFKCooldownSet = new Set();
	let minAFKDuration = 0;
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
	stadiumCommand(emptyPlayer, "!haxzone");

	let game = new Game();
	/* -------------------------------------- */


	/* COMMANDS */
	let commands = {
		help: {
			aliases: ['commands'],
			roles: Role.GUEST,
			desc: `Questo comando mostra tutti i comandi disponibili. Può anche mostrare la descrizione di un comando in particolare.
				Esempio: \'!help bb\' per mostrare la descrizione del comando \'bb\'.`,
			function: helpCommand,
		},
		/*rules: {
			aliases: ['regole'],
			roles: Role.GUEST,
			desc: `Questo comando ti mostra il regolamento di HaxZone.`,
			function: ruleCommand,
		},*/
		social: {
			aliases: ['discord', 'ds', 'telegram', 'tg', 'socials'],
			roles: Role.GUEST,
			desc: `Questo comando ti mostrerà il link per entrare nei nostri Social: server Discord e comunity Telegram!`,
			function: socialCommand,
		},
		/*event: {
			aliases: ['evento'],
			roles: Role.GUEST,
			desc: `Questo comando ti dirà se e quale evento è attivo attualmente!`,
			function: eventCommand,
		},*/
		/*register: {
			aliases: ['reg'],
			roles: Role.GUEST,
			desc: `Questo comando ti permette di registrarti se non hai ancora un account.
				Esempio: !reg <password>.`,
			function: registerCommand,
		},*/
		login: {
			aliases: ['l'],
			roles: Role.PLAYER,
			desc: `Questo comando ti permette di accedere al tuo account se ne hai giÃ  uno.
				Esempio: !l <password>.`,
			function: loginCommand,
		},
		resetpassword: {
			aliases: ["rpw"],
			roles: Role.PLAYER,
			desc: `Questo comando ti permette di resettare la password.
				Esempio: !rpw <password>.`,
			function: resetPasswordCommand,
		},
		stats: {
			aliases: ['stat'],
			roles: Role.PLAYER,
			desc: `Questo comando ti permette di visualizzare le tue statistiche.
				Esempio: !stats`,
			function: statsCommand,
		},
		/*leaderboard: {
			aliases: ['lb'],
			roles: Role.PLAYER,
			desc: ``,
			function: leaderboardCommand,
		},
		leaderboardmonthly: {
			aliases: ['lbmonthly'],
			roles: Role.PLAYER,
			desc: ``,
			function: leaderboardMonthlyCommand,
		},*/
		afk: {
			aliases: [],
			roles: Role.PLAYER,
			desc: `Questo comando vi fa andare in AFK.
				Quando attivato: l'AFK durerà  minimo 1min e massimo 5min, mentre avrai 10min di cooldown.`,
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
		/*staff: {
			aliases: ['adminlist', 'admins'],
			roles: Role.PLAYER,
			desc: `Questo comando mostra tutti i giocatori che sono admin.`,
			function: staffListCommand,
		},*/
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
			aliases: ['stadio', 'stadium'],
			roles: Role.HELPER,
			desc: `Questo comando ti elencherà la lista degli stadi disponibili.`,
			function: stadiCommand,
		},
		stadio: {
			aliases: ['haxzone', 'inps', 'lupacchiotti', 'troller', 'cerignola', 'cip', 'astra', 'skillux',
			 'sport', 'cammels', 'monkeys', 'wolves', 'brigate'],
			roles: Role.HELPER,
			desc: `Questo comando inserirà lo stadio da te scritto.
				ESEMPIO: !inps o !monkeys     inserirà lo stadio di quella nazione.`,
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
			roles: Role.MODERATOR,
			desc: `Questo comando consente di Kickare un giocatore dalla room.
				Richiede 2 argomenti:
				Argomento 1: #<id> dove <id> è l'identificativo del giocatore.
				Argomento 2(opzionale): <motivo> dove è possibile scrivere il motivo del kick.
				ESEMPIO: !kick #301 Per bullismo    Kickerà il giocatore con id 301 dalla room.`,
			function: kickCommand,
		},
		/*warns: {
			aliases: ['warnlist'],
			roles: Role.MODERATOR,
			desc: `Questo comando mostra la lista dei giocatori che sono stati warnati e i loro ID.`,
			function: warnListCommand,
		},
		warn: {
			aliases: [],
			roles: Role.MODERATOR,
			desc: `Questo comando consente di Warnare un giocatore per un oltraggio alle regole.
				Richiede 2 argomenti:
				Argomento 1: #<id> dove <id> è l'identificativo del giocatore.
				Argomento 2: <regola> dove si va a specificare il numero della regola infranta.
				ESEMIO: !warn #301 5    Warnerà il giocatore con id 301 per aver infranto la regola 5.`,
			function: warnCommand,
		},
		unwarn: {
			aliases: [],
			roles: Role.MODERATOR,
			desc: `Questo comando consente di Levare il warn ad un giocatore specifico.
				Richiede 1 argomento:
				Argomento 1: #<id> dove <id> è l'identificativo del giocatore.
				ESEMIO: !unwarn #301    Leverà il warn al giocatore con id 301.`,
			function: unwarnCommand,
		},*/
		/*bans: {
			aliases: ['banlist'],
			roles: Role.MODERATOR,
			desc: `Questo comando mostra la lista dei giocatori che sono stati bannati e i loro ID.`,
			function: banListCommand,
		},*/
		ban: {
			aliases: [],
			roles: Role.MODERATOR,
			desc: `Questo comando Banna un player dalla room.
				Richiede 1 argomento:
				Argomento 1: #<id>, dove <id> è l'id del giocatore che si vuole bannare (Non funziona se il giocatore è un amministratore).
				Esempio: !ban #301   bannerá il giocatore con id 301.`,
			/*desc: `Questo comando Banna un player dalla room in modo temporaneo.
				Richiede 2 argomenti:
				Argomento 1: #<id>, dove <id> è l'id del giocatore che si vuole bannare (Non funziona se il giocatore è un amministratore).
				Argomento 2: <durata> dove <durata> è la durata del ban in minuti.
				Esempio: !ban #301 20   bannerá il giocatore con id 301 per 20 minuti.`,*/
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
		/*setrole: {
			aliases: ['modifyrole'],
			roles: Role.ADMIN,
			desc: `Questo comando consente di modificare il Ruolo ad un player.
				Richiede 2 argomenti:
				Argomento 1: #<id>, dove <id> è l'id del giocatore a cui si vuole modificare il ruolo.
				Argomento 2: <id Ruolo>, dove <id Ruolo> è il numero identificativo del Ruolo che si vuole modificare al player.
				Esempio: !setrole #3 darà  l'admin al giocatore con id 3.`,
			function: setRoleCommand,
		},*/
		/*removerole: {
			aliases: ['rmrole'],
			roles: Role.ADMIN,
			desc: `Questo comando consente di rimuovere il Ruolo ad un player portandolo a PLAYER [1].
				Richiede 1 argomento:
				Argomento 1: #<id>, dove <id> è l'id del giocatore a cui si vuole rimuovere il ruolo.
				Esempio: !removerole #3   rimuoverà il ruolo al giocatore con id 3 portandolo a semplice Player.`,
			function: removeRoleCommand,
		},*/
		password: {
			aliases: ['pw'],
			roles: Role.ADMIN,
			desc: `Questo comando consente di aggiungere una password per entrare in room.
				Richiede 1 argomento:
				Argomento 1: <password> che sarà la nuova password per entrare in room.
				ESEMIO: !password Ciao123    imposterà la password 'Ciao123' per entrare in room.
		
				Per rimuovere la password alla room, è sufficiente scrivere '!password'.`,
			function: passwordCommand,
		},
		clearbans: {
			aliases: ['clearban'],
			roles: Role.FOUNDER,
			desc: `Questo comando annulla il ban a tutti i giocatori.
				ESEMPIO: !clearbans   eliminarà il ban a tutti i giocatori`,
			function: clearBansCommand,
		},
		/*clearwarns: {
			aliases: [],
			roles: Role.FOUNDER,
			desc: `Questo comando annulla il warn a tutti i giocatori.
				ESEMPIO: !clearwarns  eliminarà il warn a tutti i giocatori`,
			function: clearWarnsCommand,
		}*/
	};
	/* ----------------------------------------------------------------------------------- */


	/* FUNCTIONS */

	/* AUXILIARY FUNCTIONS */
	function postStreak(reason) {
		let cstm = `**Streak di:** ${streak}\n**Streak iniziata da:** `
		let count = 0
		infoStreak.forEach(a => {
			if (a.IsTeamStreak) {
				count++
				if (count < 3) cstm += `${a.nickname}, `
				else {
					cstm = cstm.substring(0, cstm.length - 2)
					cstm += ` e ${a.nickname}\n`
				}
			}
		})
		const minutes = ((endStreak - startStreak) / 1000) / 60
		const hours = parseInt(minutes / 60)
		const minutesRemaining = parseInt(minutes % 60)
		cstm += `**Motivo dell'interruzione:** ${reason}\n\n**__Classifica Player__:**\n` + "```c\n"

		const boardOrdered = infoStreak.sort((a, b) => b.count - a.count)
		boardOrdered.forEach(a => cstm += `${a.nickname}: ${a.count}${a.IsTeamStreak == true ? " (Fa parte del team iniziale)" : ""}\n`)
		cstm = cstm.substring(0, cstm.length - 1) + "\n```"

		/*let objectBodyWebhook = {
			embeds: [
				{
					title: `💣 NUOVA STREAK DA DREAM TEAM 💣`,
					description: cstm,
					color: 16736315,
					footer: {
						text: `Inizio: ${yearLong(startStreak)} • Durata: ${hours == 1 ? "un'ora" : hours == 0 ? "" : hours + " ore"}${hours == 0 || minutesRemaining == 0 ? "" : " e "}${minutesRemaining == 1 ? "un minuto" : minutesRemaining == 0 ? "" : minutesRemaining + " minuti"} • Fine: ${yearLong(endStreak)}`,
					},
				},
			],
			username: "Dream Team <3"
		}
		if (streakWebhook != "") {
			fetch(streakWebhook, {
				method: 'POST',
				body: JSON.stringify(objectBodyWebhook),
				headers: {
					'Content-Type': 'application/json',
				},
			}).then((res) => res)
			setTimeout(() => fetchStreakRecording(lastStreakGame), 500)
		}*/

		const streakPlayers = `${boardOrdered[0].nickname} [${boardOrdered[0].count}] ${boardOrdered[0].IsTeamStreak ? "TO" : ""}, ${boardOrdered[1].nickname} [${boardOrdered[1].count}] ${boardOrdered[1].IsTeamStreak ? "TO" : ""} e ${boardOrdered[2].nickname} [${boardOrdered[2].count}] ${boardOrdered[2].IsTeamStreak ? "TO" : ""}`
		const newStreak = { streak: streak, players: streakPlayers, timestamp: Date.now() }
		topstreaks.push(newStreak)
		topstreaks.sort((a, b) => {
			if (a.streak < b.streak) return 1
			else if (a.streak > b.streak) return -1
			if (a.timestamp < b.timestamp) return 1
			else if (a.timestamp > b.timestamp) return -1
			return 0
		})
		topstreaks = [topstreaks[0], topstreaks[1], topstreaks[2], topstreaks[3], topstreaks[4]]
		topStreakDB.insertOne(newStreak)

		/*boardOrdered.forEach((a, i) => {
			if (i < 3) {
				const streakPlayer = customization.find(b => a.nickname == b.nickname)
				if (streakPlayer != undefined && !streakPlayer.allowedSkin.includes(CustomSkin.DREAMTEAM)) {
					streakPlayer.allowedSkin.push(CustomSkin.DREAMTEAM)
					streakPlayer.allowedSkin.sort((c, d) => c - d)
					customizationDB.updateOne({ nickname: streakPlayer.nickname }, { $set: { allowedSkin: streakPlayer.allowedSkin } })
				}
			}
		})
		const streakPID = []
		room.getPlayerList().forEach(a => {
			if (a.name == boardOrdered[0].nickname || a.name == boardOrdered[1].nickname || a.name == boardOrdered[2].nickname) {
				const streakPlayer = accounts.find(b => a.name == b.nickname)
				if (streakPlayer != undefined && !streakPlayer.allowedSkin.includes(CustomSkin.DREAMTEAM)) streakPID.push(a.id)
			}
		})
		streakPID.forEach(a => room.sendAnnouncement("Complimenti, hai sbloccato la skin \"DreamTeam\"! Puoi usarla con !skin dreamteam.", a.id, welcomeColor, 'bold', HaxNotification.MENTION))*/
	}

	if (typeof String.prototype.replaceAll != 'function') {
		String.prototype.replaceAll = function (search, replacement) {
			let target = this;
			return target.split(search).join(replacement);
		};
	}

	function getDate() {
		let d = new Date();
		return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
	}

	function hexToString(hex) {
		let str = ''
		for (let i = 0; i < hex.length; i += 2) str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
		return str
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

	function getEventSeriesChallenge(date) {
		const month = date.getMonth() + 1
		const year = date.getFullYear()
		//const hour = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
		//const minute = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
		//console.log(`${hour}:${minute}`)
		return monthlyEvent.find(a => a.month === month && a.year === year)
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
	  let now = new Date();

	  let day = String(now.getDate()).padStart(2, '0');
	  let month = String(now.getMonth() + 1).padStart(2, '0'); // Gennaio è 0!
	  let year = now.getFullYear();

	  let hours = String(now.getHours()).padStart(2, '0');
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
		let d = new Date();
		return `${d.getFullYear() % 100}${d.getMonth() < 9 ? '0' : ''}${d.getMonth() + 1}${d.getDate() < 10 ? '0' : ''}${d.getDate()}${d.getHours() < 10 ? '0' : ''}${d.getHours()}${d.getMinutes() < 10 ? '0' : ''}${d.getMinutes()}${d.getSeconds() < 10 ? '0' : ''}${d.getSeconds()}${findFirstNumberCharString(roomName)}`;
	}

	function getRecordingName(game) {
		let d = new Date();
		let redCap = game.playerComp[0][0] != undefined ? game.playerComp[0][0].player.name : 'Red';
		let blueCap = game.playerComp[1][0] != undefined ? game.playerComp[1][0].player.name : 'Blue';
		let day = d.getDate() < 10 ? '0' + d.getDate() : d.getDate();
		let month = d.getMonth() < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1);
		let year = d.getFullYear() % 100 < 10 ? '0' + (d.getFullYear() % 100) : (d.getFullYear() % 100);
		let hour = d.getHours() < 10 ? '0' + d.getHours() : d.getHours();
		let minute = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
		let flagRed = Object.keys(Skins).find(key => Skins[key] === skinRed);
		let flagBlu = Object.keys(Skins).find(key => Skins[key] === skinBlu);
		return `${day}-${month}-${year}_${hour}-${minute}_${flagRed}_${game.scores.red}-${game.scores.blue}_${flagBlu}.hbr2`;
	}

	function fetchRecording(game) {
		if (gameWebhook != "") {
			let form = new FormData();
			let fileBuffer = Buffer.from(game.rec);

			form.append('file', fileBuffer, getRecordingName(game));
			form.append("payload_json", JSON.stringify({
				"username": roomName
			}));

		fetch(gameWebhook, {
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
				let playerDisc = room.getPlayerDiscProperties(teamRed.concat(teamBlue)[0].id);
				ballRadius = ballDisc.radius;
				playerRadius = playerDisc.radius;
				triggerDistance = ballRadius + playerRadius + 0.01;
				speedCoefficient = 100 / (5 * ballDisc.invMass * (ballDisc.damping ** 60 + 1));
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
		let textRed = "!skin 1 "+skinBlu;
		let textBlu = "!skin 2 "+skinRed;
		setSkinCommand(emptyPlayer, textRed);
		setSkinCommand(emptyPlayer, textBlu);
	}

	/* COMMAND FUNCTIONS */

	/* ACCOUNT SYSTEM */
	async function logPlayer(player, password, auto) {
		const thisPlayer = accounts.find(a => a.nickname == player.name)
		const anotherAccount = accounts.find(a => a.nickname != player.name && (a.auth == authArray[player.id][0] || a.connect == authArray[player.id][1]))
		let msg = ""//, msgSacks = "Al momento non hai nessun pacchetto da aprire"
		msgUpdate //solo per sapere che esiste come var global
		if (thisPlayer != undefined) {
			if (thisPlayer.isBanned) {
				room.kickPlayer(player.id, "Multiaccount! [AutoBan]", true)
				blackList.push({ nickname: player.name, ac_nick: player.name, banID: player.id, infractionID: 666, auth: authArray[player.id][0], connect: authArray[player.id][1], reason: "(Accesso da un account bannato)", BannedBy: "HaxZone" })
				//ticketCountDB.updateOne({ category: "infraction" }, { $set: { count: infractionCount + 1 } })
				const newInfraction = {
					infractionID: 666,
					type: "BAN",
					ruleBroken: "0",
					infractionBy: "HaxZone",
					expirationHours: -1,
					reason: `Multiaccount! [AutoBan]`,
					date: Date.now()
				}
				//let penaltiesPlayer = penalties.find(a => a.nickname == player.name)
				//if (penaltiesPlayer == undefined) penaltiesPlayer = createPenalties(player)
				//penaltiesPlayer.numberInfractions += 1
				//penaltiesPlayer.infractions.push(newInfraction)
				//penaltiesDB.updateOne({ nickname: player.name }, { $set: { numberInfractions: penaltiesPlayer.numberInfractions, infractions: penaltiesPlayer.infractions } })
				bansDB.insertOne({ nickname: player.name, ac_nick: player.name, banID: player.id, infractionID: 666, auth: authArray[player.id][0], connect: authArray[player.id][1], reason: "(Accesso da un account bannato)", BannedBy: "HaxZone" })
				IPBanList.push({ Connect: authArray[player.id][1], Auth: authArray[player.id][0], Permaban: true })
				ipBanDB.insertOne({ Connect: authArray[player.id][1], Auth: authArray[player.id][0], Permaban: true })
				writeLog("connessioni", '//////////////// {' + player.name + '} è stato bannato! ////////////////', true);
				//infractionCount += 1
				/*if (modWebkook != '') {
					const objectBodyWebhook = {
						embeds: [
							{
								author: {
									name: "NEW BAN [LOGIN SYSTEM]",
									icon_url: "https://i.imgur.com/d5pn5HE.gif"
								},
								title: `**Bannato da:** LoginSystem.exe`,
								description: `\`\`\`asciidoc\nInformazioni del player bannato\n-------------------------------\nNome:: ${player.name}\nID:: ${player.id}\nAuth:: ${authArray[player.id][0]}\nConnect:: ${authArray[player.id][1]}\nMotivo del ban:: Regola 6 (Accesso da un account bannato)\n\`\`\``,
								color: 0xd63031,
								timestamp: new Date().toISOString(),
							},
						],
						username: "Check Moderazione [3v3]"
					}
					fetch(modWebkook, {
						method: 'POST',
						body: JSON.stringify(objectBodyWebhook),
						headers: {
							'Content-Type': 'application/json',
						},
					}).then((res) => res)
				}*/
			} else if (anotherAccount != undefined && !debugMode) {
				room.sendAnnouncement("Hai già un account registrato col nickname '" + anotherAccount.nickname + "'\nÉ possibile chiedere il cambio nickname ai Master.", player.id, loginColor, 'bold', HaxNotification.CHAT)
			}
			else {
				if (developerList.map((a) => a[0]).findIndex((auth) => auth == authArray[player.id][0]) != -1) {
					room.setPlayerAdmin(player.id, true)
					thisPlayer.role = Role.DEVELOPER
					thisPlayer.roleString = RoleEmoji.DEVELOPER
				}
				else if (founderList.map((a) => a[0]).findIndex((auth) => auth == authArray[player.id][0]) != -1) {
					room.setPlayerAdmin(player.id, true)
					thisPlayer.role = Role.FOUNDER
					thisPlayer.roleString = RoleEmoji.FOUNDER
				}
				else if (adminList.map((a) => a[0]).findIndex((auth) => auth == authArray[player.id][0]) != -1) {
					room.setPlayerAdmin(player.id, true)
					thisPlayer.role = Role.ADMIN
					thisPlayer.roleString = RoleEmoji.ADMIN
				}
				else if (moderatorList.map((a) => a[0]).findIndex((auth) => auth == authArray[player.id][0]) != -1) {
					room.setPlayerAdmin(player.id, true)
					thisPlayer.role = Role.MODERATOR
					thisPlayer.roleString = RoleEmoji.MODERATOR
				}
				else if (helperList.map((a) => a[0]).findIndex((auth) => auth == authArray[player.id][0]) != -1) {
					room.setPlayerAdmin(player.id, true)
					thisPlayer.role = Role.HELPER
					if (player.name == "Momito") thisPlayer.roleString = "🌹";
					else thisPlayer.roleString = RoleEmoji.HELPER
				}
				else if (vipList.map((a) => a[0]).findIndex((auth) => auth == authArray[player.id][0]) != -1) {
					thisPlayer.role = Role.VIP
					thisPlayer.roleString = RoleEmoji.VIP
				}
				else if (partnerList.map((a) => a[0]).findIndex((auth) => auth == authArray[player.id][0]) != -1) {
					thisPlayer.role = Role.PARTNER
					thisPlayer.roleString = RoleEmoji.PARTNER
				}
				else if (thisPlayer.role >= Role.PLAYER) {
					thisPlayer.role = Role.PLAYER
					thisPlayer.roleString = RoleEmoji.PLAYER;
				}
				try {
					const response = await axios.get("https://api.findip.net/" + hexToString(authArray[player.id][1]) + "/?token=679987f257234c649691860bf584bb22")
					const jRes = await response.data
					if (thisPlayer.country != jRes.country.names.en) {
						writeLog("connessioni", player.name + " ha un IP proveniente da un paese diverso da quello rilevato in fase di registrazione: " + thisPlayer.country + "!=" + jRes.country.names.en, true)
					}
				} catch (errr) {
					console.log("££££££££££££££££ Errore axios1 £££££££££££££££££££££££");
					writeLog("log", " ££££££££££££££££££££££ Errore axios1: " + errr, false);
				}
				thisPlayer.lastLogin = Date.now()
				thisPlayer.isLogged = true
				thisPlayer.auth = authArray[player.id][0]
				thisPlayer.connect = authArray[player.id][1]
				playersDB.updateOne({ nickname: player.name }, { $set: { auth: thisPlayer.auth, connect: thisPlayer.connect, lastLogin: thisPlayer.lastLogin } })
				if (auto) msg = `👋 Ehi ${player.name} bentornato! Login automatico effettuato!\n`;
				else { msg = `👋 Ehi ${player.name} bentornato! Login effettuato con successo!\n`; }

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
		}
		else {
			let nazionale = "MONDO";
			try {
				const response = await axios.get("https://api.findip.net/" + hexToString(authArray[player.id][1]) + "/?token=679987f257234c649691860bf584bb22")
				const jRes = await response.data
				nazionale = jRes.country.names.en;
			} catch (errr) {
				console.log("££££££££££££££££ Errore axios2 £££££££££££££££££££££££");
				writeLog("log", " ££££££££££££££££££££££ Errore axios2: " + errr, false);
			}
			const regPlayer = { registerDate: Date.now(), nickname: player.name, auth: authArray[player.id][0], connect: authArray[player.id][1], password: password, country: nazionale, role: Role.PLAYER, roleString: RoleEmoji.PLAYER, eventString: "", lastLogin: Date.now(), isBanned: false, isLogged: true }
			//const custPlayer = { nickname: player.name, currentSkin: -1, currentStadium: -1, allowedSkin: [CustomSkin.CLASSIC, CustomSkin.FUTSAL, CustomSkin.BIGLASSIC], allowedStadium: [CustomStadium.HAXFREE], sacks: [] }
			//const rankPlayer = { nickname: player.name, rankPoints: 0, rankString: "▪ 🐤🟤", rankedGames: 0 }

			accounts.push(regPlayer)
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

	function registerCommand(player, message) {
		const msgArray = message.split(/ +/).slice(1)
		let msg = ""
		if (msgArray.length > 0) {
			const anotherAccount = accounts.find(a => a.nickname != player.name && (a.auth == authArray[player.id][0] || a.connect == authArray[player.id][1]))
			if (anotherAccount != undefined && !debugMode) msg = `Hai già un altro account col nickname '${anotherAccount.nickname}'!\nPotrai continuare a giocare, ma non potrai effettuare il login o la registrazione finché non entri col tuo account principale!`
			else {
				const thisPlayer = accounts.find(a => a.nickname == player.name)
				if (thisPlayer == undefined) {
					if (msgArray[0].length > 4 && /^(?=.*[a-zA-Z])(?=.*[0-9]).*$/.test(msgArray[0])) {
						bcrypt.hash(msgArray[0], 10, (err, hash) => {
							logPlayer(player, hash, false)
						})
						return false
					} else msg = `La password deve avere un numero minimo di 5 caratteri e contenere almeno una lettera e un numero.`
				} else msg = `Questo nickname è già registrato. Puoi procedere ad accedere con il comando: !login <password>.`
			}
		} else msg = `Comando errato. Per ulteriori informazioni, digitare "!help register".`
		room.sendAnnouncement(msg, player.id, errorColor, 'bold', HaxNotification.CHAT)
	}

	function loginCommand(player, message) {
		const msgArray = message.split(/ +/).slice(1)
		let msg = ""
		if (msgArray.length > 0 && msgArray[0].length > 0) {
			const anotherAccount = accounts.find(a => a.nickname != player.name && (a.auth == authArray[player.id][0] || a.connect == authArray[player.id][1]))
			if (anotherAccount != undefined && !debugMode) msg = `Hai già un altro account col nickname '${anotherAccount.nickname}'!\nPotrai continuare a giocare, ma non potrai effettuare il login o la registrazione finché non entri col tuo account principale.`
			else {
				const thisPlayer = accounts.find(a => a.nickname == player.name)
				if (thisPlayer != undefined) {
					if (!thisPlayer.isLogged) {
						bcrypt.compare(msgArray[0], thisPlayer.password, (err, result) => {
							if (result) logPlayer(player, null, false)
							else room.sendAnnouncement(`Password errata, riprova o usa il comando !resetpassword per cambiare password!`, player.id, errorColor, 'bold', HaxNotification.CHAT)
						})
					} else msg = 'Sei già connesso!'
				} else msg = `Questo nickname non è ancora registrato. Puoi procedere con la registrazione tramite !register <password>.`
			}
		} else msg = `Comando errato. Per ulteriori informazioni, digitare "!help login".`
		if (msg != "") room.sendAnnouncement(msg, player.id, errorColor, 'bold', HaxNotification.CHAT)
	}

	function resetPasswordCommand(player, message) {
		const msgArray = message.split(/ +/).slice(1)
		let msg = ""
		if (msgArray.length == 2 && msgArray[0].length > 0 && msgArray[1].length > 0) {
			if (getRole(player) >= Role.PLAYER) {
				const targetPlayer = accounts.find(a => a.nickname == msgArray[0])
				if (targetPlayer != undefined) {
					if (msgArray[1].length > 4 && /^(?=.*[a-zA-Z])(?=.*[0-9]).*$/.test(msgArray[1])) {
						bcrypt.hash(msgArray[1], 10, (err, hash) => {
							targetPlayer.password = hash
							playersDB.updateOne({ nickname: targetPlayer.nickname }, { $set: { password: hash } })
							room.sendAnnouncement(`Hai resettato con successo la password di ${targetPlayer.nickname} in ${msgArray[1]}.`, player.id, announcementColor, 'bold', HaxNotification.CHAT)
						})
					} else msg = `La password deve avere un numero minimo di 5 caratteri e contenere almeno una lettera e un numero.`
				} else msg = `Questo player non ha ancora un account registrato.`
			} else msg = `Non hai il permesso per resettare la password di questo account, contatta un Admin o un Founder.`
		}
		else if (msgArray.length == 1 && msgArray[0].length > 0) {
			const targetPlayer = accounts.find(a => a.nickname == player.name)
			if (targetPlayer != undefined) {
				if (authArray[player.id][0] == targetPlayer.auth || authArray[player.id][1] == targetPlayer.connect) {
					if (msgArray[0].length > 4 && /^(?=.*[a-zA-Z])(?=.*[0-9]).*$/.test(msgArray[0])) {
						bcrypt.hash(msgArray[0], 10, (err, hash) => {
							targetPlayer.password = hash
							playersDB.updateOne({ nickname: targetPlayer.nickname }, { $set: { password: hash } })
							room.sendAnnouncement(`Hai resettato con successo la tua password in ${msgArray[0]}.`, player.id, announcementColor, 'bold', HaxNotification.CHAT)
						})
					} else msg = `La password deve avere un numero minimo di 5 caratteri e contenere almeno una lettera e un numero.`
				} else msg = `Non hai il permesso per resettare la password di questo account, contatta un Admin o un Founder.`
			} else msg = `Non hai ancora un account registrato!`
		} else msg = `Comando errato. Per ulteriori informazioni, digitare "!help resetpassword".`
		if (msg != "") room.sendAnnouncement(msg, player.id, errorColor, 'bold', HaxNotification.CHAT)
	}


	/* PLAYER COMMANDS */
	function helpCommand(player, message) {
		let msgArray = message.split(/ +/).slice(1);
		let fPla = fPar = fVip = fHel = fMod = fAdm = fFou = fDev = false;
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
			}
			commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			if (getRole(player) >= Role.PLAYER && fPla) {
				commandString += `PLAYER commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.PLAYER) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':')
					commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (getRole(player) >= Role.PARTNER && fPar) {
				commandString += `PARTNER commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.PARTNER) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':') commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (getRole(player) >= Role.VIP && fVip) {
				commandString += `VIP commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.VIP) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':')
					commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (getRole(player) >= Role.HELPER && fHel) {
				commandString += `HELPER commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.HELPER) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':') commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (getRole(player) >= Role.MODERATOR && fMod) {
				commandString += `MODERATOR commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.MODERATOR) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':')
					commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (getRole(player) >= Role.ADMIN && fAdm) {
				commandString += `ADMIN commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.ADMIN) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':') commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (getRole(player) >= Role.FOUNDER && fFou) {
				commandString += `FOUNDER commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.FOUNDER) commandString += ` !${key},`;
				}
				if (commandString.slice(commandString.length - 1) == ':')
					commandString += ` None,`;
				commandString = commandString.substring(0, commandString.length - 1) + '.\n\n';
			}
			if (getRole(player) >= Role.DEVELOPER && fDev) {
				commandString += `DEVELOPER commands :\n`;
				for (const [key, value] of Object.entries(commands)) {
					if (value.desc && value.roles == Role.DEVELOPER) commandString += ` !${key},`;
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
					`\'${commandName}\' comando :\n${commands[commandName].desc}`,
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

	function ruleCommand(player, message) {
		room.sendAnnouncement(
			"1. Tratta ogni persona con rispetto. Non sarà tollerato alcun tipo di molestia, persecuzione, sessismo, razzismo o incitamento all'odio. E possibile scherzarci sopra solo se non provoca fastidio.\n\n2. Non inviare link a scopo pubblicitario.\n\n3. Niente contenuti osceni o NSFW (per adulti). Ciò include testi, immagini o link contenenti nudità, sesso, violenza brutale o altri contenuti esplicitamente scioccanti.\n\n4. Le bestemmie sono permesse, evitare se possono infastidire \n\n5. Flammate Ilchicco AndreaPirla e Momito\n\nChi non segue queste regole verrà bandito dalla room. E' possibile richiedere assitenza presso discord: https://discord.gg/5XU2e8M85d",
			player.id,
			loginColor,
			'bold',
			HaxNotification.CHAT
		);
	}

	function socialCommand(player, message) {
		room.sendAnnouncement(
			"Questo è il link d'invito al nostro Discord --->>> https://discord.gg/5XU2e8M85d <<<--- entra per avere altri privilegi!\nQuesto è il link d'invito alla nostra comunity Telegram --->>> https://t.me/+K2wjKPhKBjk4Yzlk <<<--- entra e chatta!",
			player.id,
			loginColor,
			'bold',
			HaxNotification.CHAT
		);
	}

	function statsCommand(player, message) {
		const statPlayer = stats.find(a => a.nickname == player.name)
		//const monthlyStatPlayer = monthlyStats.find(a => a.nickname == player.name)
		const thisPlayer = accounts.find(a => a.nickname == player.name)
		if (statPlayer != undefined) {
			const ptString = getPlaytimeString(statPlayer.playtime)
			msg = `📝 Le tue statistiche totali\n🏟️ Games: ${statPlayer.games}, ✨ Wins: ${statPlayer.wins}, 💯 Winrate: ${statPlayer.winrate}, ⚽ Goals: ${statPlayer.goals}, 💩 Own Goals: ${statPlayer.ownGoals}, 👟 Assists: ${statPlayer.assists}, 🥅 Clean Sheets: ${statPlayer.cs}, 3️⃣ Hat Trick: ${statPlayer.hatTrick}, ⏱️ Playtime: ${ptString}`
			/*if (monthlyStatPlayer != undefined) {
				const monthlyPtString = getPlaytimeString(monthlyStatPlayer.playtime)
				msg += `\n📝 Le tue statistiche mensili\n🏟️ Games: ${monthlyStatPlayer.games}, ✨ Wins: ${monthlyStatPlayer.wins}, 💯 Winrate: ${monthlyStatPlayer.winrate}, ⚽ Goals: ${monthlyStatPlayer.goals}, 💩 Own Goals: ${monthlyStatPlayer.ownGoals}, 👟 Assists: ${monthlyStatPlayer.assists}, 🥅 Clean Sheets: ${monthlyStatPlayer.cs}, 3️⃣ Hat Trick: ${monthlyStatPlayer.hatTrick}, ⏱️ Playtime: ${monthlyPtString}`
			}
			else if (thisPlayer.role >= Role.VERIFY) msg += `\n📝 Le tue statistiche mensili non sono ancora disponibili. Gioca una partita in 3v3 per visualizzarle`
			else msg += `\n📝 Le tue statistiche mensili non sono disponibili non essendo un utente verificato. Verificati entrando nel nostro server discord!`*/
			if (statPlayer.games <= 14) msg += "\nDevi giocare almeno 15 partite 3v3 per visualizzare il suo winrate!"
		}
		else msg = `Non hai ancora delle statistiche registrate!`
		room.sendAnnouncement(msg, player.id, infoColor, 'bold', HaxNotification.CHAT)
	}

	function leaderboardCommand(player, message) {
		/*let key = message.split(/ +/)[0].substring(1).toLowerCase();
		printRankings(key, player.id);*/
	}

	function leaderboardMonthlyCommand() {
		// body...
	}

	function afkCommand(player, message) {
		if (player.team == Team.SPECTATORS || players.length == 1 || player.admin) {
			if (AFKSet.has(player.id)) {
				if (AFKMinSet.has(player.id)) {
					room.sendAnnouncement(
						`C'è un minimo di ${minAFKDuration} minuti di tempo AFK. Non abusare del comando!`,
						player.id,
						errorColor,
						'bold',
						HaxNotification.CHAT
					);
				} else {
					AFKSet.delete(player.id);
					room.sendAnnouncement(
						`🌅 ${player.name} non è più AFK !`,
						null,
						announcementColor,
						'bold',
						null
					);
					updateTeams();
					//handlePlayersJoin();
				}
			} else {
				if (AFKCooldownSet.has(player.id)) {
					room.sendAnnouncement(
						`Puoi andare AFK solo ogni ${AFKCooldown} minuti. Non abusare del comando!`,
						player.id,
						errorColor,
						'bold',
						HaxNotification.CHAT
					);
				} else {
					AFKSet.add(player.id);
					if (!player.admin) {
						AFKMinSet.add(player.id);
						AFKCooldownSet.add(player.id);
						setTimeout(
							(id) => {
								AFKMinSet.delete(id);
							},
							minAFKDuration * 60 * 1000,
							player.id
						);
						setTimeout(
							(id) => {
								AFKSet.delete(id);
							},
							maxAFKDuration * 60 * 1000,
							player.id
						);
						setTimeout(
							(id) => {
								AFKCooldownSet.delete(id);
							},
							AFKCooldown * 60 * 1000,
							player.id
						);
					}
					room.setPlayerTeam(player.id, Team.SPECTATORS);
					room.sendAnnouncement(
						`😴 ${player.name} adesso è AFK !`,
						null,
						announcementColor,
						'bold',
						null
					);
					updateTeams();
					//handlePlayersLeave();
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

	function staffListCommand(player, message) {
		if (helperList.length == 0
			&& moderatorList.length == 0
			&& adminList.length == 0
			&& founderList.length == 0
			&& developerList.length == 0) {
			room.sendAnnouncement(
				"📢 Non c'è nessuno nell'elenco dello staff.",
				player.id,
				announcementColor,
				'bold',
				null
			);
			return false;
		}
		let cstm = '📢 Lista Staff :\n';
		if (helperList.length != 0) {
			cstm += "⛑️ HELPER: "
			for (let i = 0; i < helperList.length; i++) {
				cstm += helperList[i][1] + `[${i + 1}]`;
				if (i < (helperList.length - 1)) cstm += ", ";
				else cstm += "\n";
			}
		}
		if (moderatorList.length != 0) {
			cstm += "🪖 MODERATOR: "
			for (let i = 0; i < moderatorList.length; i++) {
				cstm += moderatorList[i][1] + `[${i + 1}]`;
				if (i < (moderatorList.length - 1)) cstm += ", ";
				else cstm += "\n";
			}
		}
		if (adminList.length != 0) {
			cstm += "🎩 ADMIN: "
			for (let i = 0; i < adminList.length; i++) {
				cstm += adminList[i][1] + `[${i + 1}]`;
				if (i < (adminList.length - 1)) cstm += ", ";
				else cstm += "\n";
			}
		}
		if (founderList.length != 0) {
			cstm += "🔑 FOUNDER: "
			for (let i = 0; i < founderList.length; i++) {
				cstm += founderList[i][1] + `[${i + 1}]`;
				if (i < (founderList.length - 1)) cstm += ", ";
				else cstm += "\n";
			}
		}
		if (developerList.length != 0) {
			cstm += "👨🏻‍💻 DEVELOPER: "
			for (let i = 0; i < developerList.length; i++) {
				cstm += developerList[i][1] + `[${i + 1}]`;
				if (i < (developerList.length - 1)) cstm += ", ";
			}
		}
		room.sendAnnouncement(
			cstm,
			player.id,
			announcementColor,
			'bold',
			null
		);
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
			{ name: "haxzone" },
    		{ name: "inps" },
    		{ name: "lupacchiotti" },
    		{ name: "troller" },
    		{ name: "cerignola" },
    		{ name: "cip" },
    		{ name: "astra" },
    		{ name: "skillux" },
    		{ name: "sport" },
    		{ name: "cammels" },
    		{ name: "monkeys" },
    		{ name: "wolves" },
    		{ name: "brigate" }
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
			if (['!haxzone'].includes(msgArray[0].toLowerCase())) {
				room.setScoreLimit(0);
				room.setTimeLimit(0);
				room.setCustomStadium(SThaxzone);
				currentStadium = 'haxzone';
			}
			else if (['!inps'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(Inps);
				currentStadium = 'inps';
			}
			else if (['!lupacchiotti'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(Lupa);
				currentStadium = 'lupacchiotti';
			}
			else if (['!troller'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(Troller);
				currentStadium = 'troller';
			}
			else if (['!cerignola'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(Cerignola);
				currentStadium = 'cerignola';
			}
			else if (['!cip'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(Pota);
				currentStadium = 'cip';
			}
			else if (['!astra'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(Astra);
				currentStadium = 'astra';
			}
			else if (['!skillux'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(Skill);
				currentStadium = 'skillux';
			}
			else if (['!sport'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(Sport);
				currentStadium = 'sport';
			}
			else if (['!cammels'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(Cam);
				currentStadium = 'cammels';
			}
			else if (['!monkeys'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(Chao);
				currentStadium = 'monkeys';
			}
			else if (['!wolves'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(Wild);
				currentStadium = 'wolves';
			}
			else if (['!brigate'].includes(msgArray[0].toLowerCase())) {
				room.setCustomStadium(Aldo);
				currentStadium = 'brigate';
			}
			else {
				room.sendAnnouncement(
					`Stadio non esistente. usa !stadi per sapere la lista`,
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

	function kickCommand(player, message) {
		let msgArray = message.split(/ +/).slice(1);
		console.log("KICK COMMAND: ");
		console.log(msgArray);
		if (msgArray.length > 0) {
			if (msgArray[0].length > 0 && msgArray[0][0] == '#') {
				msgArray[0] = msgArray[0].substring(1, msgArray[0].length);
				if (room.getPlayer(parseInt(msgArray[0])) != null) {
					let playerKick = room.getPlayer(parseInt(msgArray[0]));
					let motivo = `Kickato da ${player.name}`;
					if (msgArray.length > 1) {
						motivo = msgArray.slice(1).join(' ');
					}
					if ((!playerKick.admin && getRole(player) >= getRole(playerKick)) || getRole(player) == 8) {
						room.kickPlayer(playerKick.id, motivo, false);
						/*room.sendAnnouncement(
							`${playerKick.name} è stato kickato, motivo: ${motivo}.`,
							null,
							announcementColor,
							'bold',
							null
						);*/
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

	function warnListCommand() {
		// body...
	}

	function warnCommand() {
		// body...
	}

	function unwarnCommand() {
		// body...
	}

	function banListCommand(player, message) {
		/*if (banList.length == 0) {
			room.sendAnnouncement(
				"📢 Non c'è nessuno nella lista dei Ban.",
				player.id,
				announcementColor,
				'bold',
				null
			);
			return false;
		}
		let cstm = '📢 Lista Bannati : ';
		for (let ban of banList) {
			cstm += ban[0] + `[${ban[1]}], `;
		}
		cstm = cstm.substring(0, cstm.length - 2) + '.';
		room.sendAnnouncement(
			cstm,
			player.id,
			announcementColor,
			'bold',
			null
		);*/
	}

	function banCommand(player, message) {
		let msgArray = message.split(/ +/).slice(1);
		console.log("BAN COMMAND: ");
		console.log(msgArray);
		if (msgArray.length > 0) {
			if (msgArray[0].length > 0 && msgArray[0][0] == '#') {
				msgArray[0] = msgArray[0].substring(1, msgArray[0].length);
				if (room.getPlayer(parseInt(msgArray[0])) != null) {
					let playerBan = room.getPlayer(parseInt(msgArray[0]));
					let motivo = `Bannato da ${player.name}`;
					if (msgArray.length > 1) {
						motivo = msgArray.slice(1).join(' ');
					}
					if ((!playerBan.admin && getRole(player) > getRole(playerBan)) || getRole(player) == 8) {
						room.kickPlayer(playerBan.id, motivo, true);
						/*room.sendAnnouncement(
							`${playerBan.name} è stato bannato, motivo: ${motivo}.`,
							null,
							announcementColor,
							'bold',
							null
						);*/
					} else {
						room.sendAnnouncement(
							`Non puoi bannare un ruolo più alto di te o admin.`,
							player.id,
							errorColor,
							'bold',
							HaxNotification.CHAT
						);
					}
				} else {
					room.sendAnnouncement(
						`Non c'è nessun giocatore con tale ID nella stanza. Inserisci "!help ban" per ulteriori informazioni.`,
						player.id,
						errorColor,
						'bold',
						HaxNotification.CHAT
					);
				}
			} else {
				room.sendAnnouncement(
					`Comando errato. Inserisci "!help ban" per ulteriori informazioni.`,
					player.id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
			}
		} else {
			room.sendAnnouncement(
				`Numero errato di argomenti. Inserisci "!help ban" per ulteriori informazioni.`,
				player.id,
				errorColor,
				'bold',
				HaxNotification.CHAT
			);
		}
	}

	function unBanCommand(player, message) {
		let msgArray = message.split(/ +/).slice(1);
		if (msgArray.length > 0) {
			if (msgArray[0].length > 0 && msgArray[0][0] == '#') {
				msgArray[0] = msgArray[0].substring(1, msgArray[0].length);
				let id = parseInt(msgArray[0]);
				/*if (room.getPlayer(parseInt(msgArray[0])) != null) {
					let playerBan = room.getPlayer(parseInt(msgArray[0]));*/
				room.clearBan(parseInt(playerBan.id));
				/*room.sendAnnouncement(
					`Il player #${id} è stato sbannato.`,
					null,
					announcementColor,
					'bold',
					null
				);*/
				/*} else {
					room.sendAnnouncement(
						`Non c'è nessun giocatore con tale ID nella stanza. Inserisci "!help ban" per ulteriori informazioni.`,
						player.id,
						errorColor,
						'bold',
						HaxNotification.CHAT
					);
				}*/
			} else {
				room.sendAnnouncement(
					`Comando errato. Inserisci "!help unban" per ulteriori informazioni.`,
					player.id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
			}
		} else {
			room.sendAnnouncement(
				`Numero errato di argomenti. Inserisci "!help unban" per ulteriori informazioni.`,
				player.id,
				errorColor,
				'bold',
				HaxNotification.CHAT
			);
		}
	}

	function muteCommand(player, message) {
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
					if (!playerMute.admin) {
						let muteObj = new MutePlayer(playerMute.name, playerMute.id, authArray[playerMute.id][0]);
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
							`Non puoi mutare un admin.`,
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
	}

	function muteListCommand(player, message) {
		if (muteArray.list.length == 0) {
			room.sendAnnouncement(
				"🔇 Non c'è nessuno la lista dei mutati.",
				player.id,
				announcementColor,
				'bold',
				null
			);
			return false;
		}
		let cstm = '🔇 Lista mutati : ';
		for (let mute of muteArray.list) {
			cstm += mute.name + `[${mute.id}], `;
		}
		cstm = cstm.substring(0, cstm.length - 2) + '.';
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
	function setRoleCommand(player, message) {
		/*let msgArray = message.split(/ +/).slice(1);
		if (msgArray.length > 0) {
			if (msgArray[0].length > 0 && msgArray[0][0] == '#') {
				msgArray[0] = msgArray[0].substring(1, msgArray[0].length);
				if (room.getPlayer(parseInt(msgArray[0])) != null) {
					let playerAdmin = room.getPlayer(parseInt(msgArray[0]));

					if (!adminList.map((a) => a[0]).includes(authArray[playerAdmin.id][0])) {
						if (!masterList.includes(authArray[playerAdmin.id][0])) {
							room.setPlayerAdmin(playerAdmin.id, true);
							adminList.push([authArray[playerAdmin.id][0], playerAdmin.name]);
							room.sendAnnouncement(
								`${playerAdmin.name} adesso è un Admin !`,
								null,
								announcementColor,
								'bold',
								HaxNotification.CHAT
							);
						} else {
							room.sendAnnouncement(
								`Questo giocatore è già un Master !`,
								player.id,
								errorColor,
								'bold',
								HaxNotification.CHAT
							);
						}
					} else {
						room.sendAnnouncement(
							`Questo giocatore è già un admin!`,
							player.id,
							errorColor,
							'bold',
							HaxNotification.CHAT
						);
					}
				} else {
					room.sendAnnouncement(
						`Non c'è nessun giocatore con tale ID nella stanza. Inserisci "!help setadmin" per ulteriori informazioni.`,
						player.id,
						errorColor,
						'bold',
						HaxNotification.CHAT
					);
				}
			} else {
				room.sendAnnouncement(
					`Comando errato. Inserisci "!help setadmin" per ulteriori informazioni.`,
					player.id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
			}
		} else {
			room.sendAnnouncement(
				`Numero errato di argomenti. Inserisci "!help setadmin" per ulteriori informazioni.`,
				player.id,
				errorColor,
				'bold',
				HaxNotification.CHAT
			);
		}*/
	}

	function removeRoleCommand(player, message) {
		/*let msgArray = message.split(/ +/).slice(1);
		if (msgArray.length > 0) {
			if (msgArray[0].length > 0 && msgArray[0][0] == '#') {
				msgArray[0] = msgArray[0].substring(1, msgArray[0].length);
				if (room.getPlayer(parseInt(msgArray[0])) != null) {
					let playerAdmin = room.getPlayer(parseInt(msgArray[0]));

					if (adminList.map((a) => a[0]).includes(authArray[playerAdmin.id][0])) {
						room.setPlayerAdmin(playerAdmin.id, false);
						adminList = adminList.filter((a) => a[0] != authArray[playerAdmin.id][0]);
						room.sendAnnouncement(
							`${playerAdmin.name} non è più un Admin !`,
							null,
							announcementColor,
							'bold',
							HaxNotification.CHAT
						);
					} else {
						room.sendAnnouncement(
							`Il giocatore non è un Admin !`,
							player.id,
							errorColor,
							'bold',
							HaxNotification.CHAT
						);
					}
				} else {
					room.sendAnnouncement(
						`Non c'è nessun giocatore con questo ID nella stanza. Per ulteriori informazioni, digitare "!help removeadmin".`,
						player.id,
						errorColor,
						'bold',
						HaxNotification.CHAT
					);
				}
			} else if (msgArray[0].length > 0 && parseInt(msgArray[0]) < adminList.length) {
				let index = parseInt(msgArray[0]);
				let playerAdmin = adminList[index];
				if (playersAll.findIndex((p) => authArray[p.id][0] == playerAdmin[0]) != -1) {
					// check if there is the removed admin in the room
					let indexRem = playersAll.findIndex((p) => authArray[p.id][0] == playerAdmin[0]);
					room.setPlayerAdmin(playersAll[indexRem].id, false);
				}
				adminList.splice(index);
				room.sendAnnouncement(
					`${playerAdmin[1]} non è più un admin !`,
					null,
					announcementColor,
					'bold',
					HaxNotification.CHAT
				);
			} else {
				room.sendAnnouncement(
					`Comando errato. Inserisci "!help removeadmin" per ulteriori informazioni.`,
					player.id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
			}
		} else {
			room.sendAnnouncement(
				`Numero errato di argomenti. Inserisci "!help removeadmin" per ulteriori informazioni.`,
				player.id,
				errorColor,
				'bold',
				HaxNotification.CHAT
			);
		}*/
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
	function clearBansCommand(player, message) {
		let msgArray = message.split(/ +/).slice(1);
		if (msgArray.length == 0) {
			room.clearBans();
			/*room.sendAnnouncement(
				'✔️ Tutti i ban sono stati cancellati !',
				null,
				announcementColor,
				'bold',
				null
			);*/
			banList = [];
		} else {
			room.sendAnnouncement(
				`Numero errato di argomenti. Digitare "!help clearbans" per maggiori informazioni.`,
				player.id,
				errorColor,
				'bold',
				HaxNotification.CHAT
			);
		}
	}

	/*function clearWarnsCommand() {
		// body...
	}*/
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
		if (rageQuitCheck && playerLeft != undefined) {
			if (winner == Team.RED) teamBlue.push({ name: playerLeft.name, id: playerLeft.id })
			else if (winner == Team.BLUE) teamRed.push({ name: playerLeft.name, id: playerLeft.id })
		}
		if (teamRed.length == 3 && teamBlue.length == 3) {
			const dateMatch = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }))
			if (streak == 0) {
				streak = 1
				lastStreakGame = undefined
				startStreak = dateMatch
				endStreak = undefined
				infoStreak = []
				teamStreak = []
				lastTeam = []
				if (winner == Team.RED) {
					teamRed.forEach(a => { teamStreak.push({ nickname: a.name, auth: authArray[a.id][0] }); lastTeam.push({ nickname: a.name, auth: authArray[a.id][0] }); infoStreak.push({ nickname: a.name, auth: authArray[a.id][0], count: 1, return_count: 0, IsTeamStreak: true }) })
					room.sendAnnouncement(`✨ La squadra Red ha vinto ${scores.red} - ${scores.blue}! Streak: ${streak}`, null, redColor, 'bold', HaxNotification.CHAT)
				} else {
					teamBlue.forEach(a => { teamStreak.push({ nickname: a.name, auth: authArray[a.id][0] }); lastTeam.push({ nickname: a.name, auth: authArray[a.id][0] }); infoStreak.push({ nickname: a.name, auth: authArray[a.id][0], count: 1, return_count: 0, IsTeamStreak: true }) })
					room.sendAnnouncement(`✨ La squadra Blu ha vinto ${scores.blue} - ${scores.red}! Streak: ${streak}`, null, blueColor, 'bold', HaxNotification.CHAT)
				}
			} else if (winner == Team.RED) {
				teamStreak.forEach(a => { if (teamRed.findIndex(b => b.name == a.nickname && authArray[b.id][0] == a.auth) == -1) teamStreak = teamStreak.filter(c => c.nickname != a.nickname && c.auth != a.auth) })
				if (teamStreak.length > 0 && streak > 0) {
					streak++
					lastStreakGame = game
					teamStreak.forEach(a => {
						const el = infoStreak.find(b => b.nickname == a.nickname && b.auth == a.auth && b.return_count == 0)
						if (el != undefined) el.count = el.count + 1
						lastTeam = lastTeam.filter(b => b.nickname != a.nickname && b.auth != a.auth)
					})
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
				} else {
					let reason = ""
					if (teamStreak.length == 0) {
						reason = "Abbandono del team iniziale"
						msg = `🥲 Non è rimasto nessun player del team iniziale. La streak si è interrotta!`
					}
					endStreak = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }))
					if (streak >= 20) postStreak(reason)
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
			} else if (winner == Team.BLUE) {
				let reason = "Sconfitti da: "
				teamBlue.forEach((a, i) => {
					if (i < 2) reason += a.name + ", "
					else reason = reason.substring(0, reason.length - 2) + " e " + a.name
				})
				endStreak = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }))
				if (streak >= 20) postStreak(reason)
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
			/*if (winner == Team.RED && !debugFilter) updatePlayerRanks(teamRed, teamBlue, 1, Team.RED)
			else if (winner == Team.BLUE && !debugFilter) updatePlayerRanks(teamBlue, teamRed, 1, Team.BLUE)*/
			/*if (!debugMode) {
				findEvent = getEventSeriesChallenge(new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })))
				findEvent.total_game += 1
				monthlyEventDB.updateOne({ "month": findEvent.month, "year": findEvent.year }, { $set: { total_game: findEvent.total_game } })
			}*/
		} else {
			if (streak > 0) {
				let reason = "Partita terminata in 2v2 o 1v1"
				msg = `🥲La streak si è interrotta!`
				endStreak = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }))
				if (streak >= 20) postStreak(reason)
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
				/*if (winner == Team.RED && !debugFilter) updatePlayerRanks(teamRed, teamBlue, 2, Team.RED)
				else if (winner == Team.BLUE && !debugFilter) updatePlayerRanks(teamBlue, teamRed, 2, Team.BLUE)*/
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
		if (streak == 20) msg = "🤩 La streak è appena entrata a far parte dei \"Dream Team\"!"
		else if (topstreaks.length > 0) {
			//console.log(topstreaks);
			/*if((streak - parseInt(topstreaks[0].streak)) == 1)
				msg = "😱 La streak attuale ha appena battuto il record!"*/
		}
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
						`Sbrigati ${player.name}, manca solo ${Number.parseInt(String(chooseTime / 2))} secondo per scegliere !`,
						player.id,
						warningColor,
						'bold',
						HaxNotification.MENTION
					);
					timeOutCap = setTimeout(
						(player) => {
							room.kickPlayer(
								player.id,
								"La prossima volta sbrigati a scegliere !",
								false
							);
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

	function updateAdmins(excludedPlayerID = 0) {
		if (players.length != 0 && players.filter((p) => p.admin).length < maxAdmins) {
			let playerArray = players.filter((p) => p.id != excludedPlayerID && !p.admin)
			let arrayID = playerArray.map((player) => player.id)
			room.setPlayerAdmin(Math.min(...arrayID), true)
		}
	}

	function getRole(player) {
		const thisPlayer = accounts.find(a => a.nickname == player.name)
		if (thisPlayer != undefined && thisPlayer.isLogged) return thisPlayer.role
		else if (thisPlayer != undefined && !thisPlayer.isLogged) return Role.PLAYER
		else return Role.PLAYER
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
					`⛔ ${player.name}, MUOVITI !`,
					player.id,
					warningColor,
					'bold',
					HaxNotification.MENTION
				);
				return;
			}
			/*if (pComp.inactivityTicks >= 60 * afkLimit) {
				pComp.inactivityTicks = 0;
				if (game.scores.time <= afkLimit - 0.5) {
					setTimeout(() => {
						!chooseMode ? instantRestart() : room.stopGame();
					}, 10);
				}
				room.kickPlayer(player.id, 'AFK', false);
			}*/
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
	}

	/* TEAM BALANCE FUNCTIONS */

	/*function balanceTeams() {
		if (!chooseMode) {
			if (players.length == 0) {
				room.stopGame();
				room.setScoreLimit(scoreLimit);
				room.setTimeLimit(timeLimit);
			} else if (players.length == 1 && teamRed.length == 0) {
				instantRestart();
				setTimeout(() => {
					stadiumCommand(emptyPlayer, `!training`);
				}, 5);
				room.setPlayerTeam(players[0].id, Team.RED);
			} else if (Math.abs(teamRed.length - teamBlue.length) == teamSpec.length && teamSpec.length > 0) {
				const n = Math.abs(teamRed.length - teamBlue.length);
				if (players.length == 2) {
					instantRestart();
					setTimeout(() => {
						stadiumCommand(emptyPlayer, `!classic`);
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
			} else if (Math.abs(teamRed.length - teamBlue.length) > teamSpec.length) {
				const n = Math.abs(teamRed.length - teamBlue.length);
				if (players.length == 1) {
					instantRestart();
					setTimeout(() => {
						stadiumCommand(emptyPlayer, `!training`);
					}, 5);
					room.setPlayerTeam(players[0].id, Team.RED);
					return;
				} else if (teamSize > 2 && players.length == 5) {
					instantRestart();
					setTimeout(() => {
						stadiumCommand(emptyPlayer, `!classic`);
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
			} else if (Math.abs(teamRed.length - teamBlue.length) < teamSpec.length && teamRed.length != teamBlue.length) {
				room.pauseGame(true);
				activateChooseMode();
				choosePlayer();
			} else if (teamSpec.length >= 2 && teamRed.length == teamBlue.length && teamRed.length < teamSize) {
				if (teamRed.length == 2) {
					instantRestart();
					setTimeout(() => {
						stadiumCommand(emptyPlayer, `!big`);
					}, 5);
				}
				topButton();
			}
		}
	}

	function handlePlayersJoin() {
		if (chooseMode) {
			if (teamSize > 2 && players.length == 6) {
				setTimeout(() => {
					stadiumCommand(emptyPlayer, `!big`);
				}, 5);
			}
			getSpecList(teamRed.length <= teamBlue.length ? teamRed[0] : teamBlue[0]);
		}
		balanceTeams();
	}

	function handlePlayersLeave() {
		if (gameState != State.STOP) {
			let scores = room.getScores();
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
					stadiumCommand(emptyPlayer, `!classic`);
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
					startTimeout = setTimeout(() => {
						room.startGame();
					}, 2000);
				}
			}
		}
	}*/

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

	function updatePlayerStats(player, teamStats) {
		const pComp = getPlayerComp(player)
		const thisPlayer = accounts.find(a => a.nickname == player.name)
		//const custPlayer = customization.find(a => a.nickname == player.name)
		const stat = stats.find(a => a.nickname == player.name)
		const thisMonth = parseInt(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }).split("/")[0])
		//const mStat = monthlyStats.find(a => a.nickname == player.name && a.month == thisMonth)
		let newHatTrick = 0
		if (thisPlayer != undefined /*&& custPlayer != undefined*/ && thisPlayer.isLogged && thisPlayer.role >= Role.PLAYER) {
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
				statsDB.updateOne({ nickname: player.name }, { $set: { games: stat.games, wins: stat.wins, winrate: stat.winrate, goals: stat.goals, ownGoals: stat.ownGoals, assists: stat.assists, cs: stat.cs, playtime: stat.playtime, hatTrick: stat.hatTrick } })
				//updateSkins(custPlayer, thisPlayer, stat, player)
			}
			else {
				if (getGoalsPlayer(pComp) >= 3) newHatTrick = 1
				const newStat = { nickname: player.name, games: 1, wins: 0, winrate: "0.0%", goals: getGoalsPlayer(pComp), ownGoals: getOwnGoalsPlayer(pComp), assists: getAssistsPlayer(pComp), cs: getCSPlayer(pComp), playtime: getGametimePlayer(pComp), hatTrick: newHatTrick }
				if (lastWinner == teamStats) newStat.wins = 1
				stats.push(newStat)
				statsDB.insertOne(newStat)
			}

			/*if (mStat != undefined && thisPlayer.role >= Role.VERIFY) {
				mStat.games++
				if (lastWinner == teamStats) mStat.wins++
				mStat.winrate = mStat.games >= 15 ? (((100 * mStat.wins) / (mStat.games || 1)).toFixed(2) + `%`) : "0.0%"
				mStat.goals += getGoalsPlayer(pComp)
				if (getGoalsPlayer(pComp) >= 3) mStat.hatTrick += 1
				mStat.assists += getAssistsPlayer(pComp)
				mStat.ownGoals += getOwnGoalsPlayer(pComp)
				mStat.cs += getCSPlayer(pComp)
				mStat.playtime += getGametimePlayer(pComp)
				monthlystatsDB.updateOne({ nickname: player.name }, { $set: { games: mStat.games, wins: mStat.wins, winrate: mStat.winrate, goals: mStat.goals, ownGoals: mStat.ownGoals, assists: mStat.assists, cs: mStat.cs, playtime: mStat.playtime, hatTrick: mStat.hatTrick } })
			} else if (thisPlayer.role >= Role.VERIFY) {
				if (getGoalsPlayer(pComp) >= 3) newHatTrick = 1
				const newMStat = { nickname: player.name, games: 1, wins: 0, winrate: "0.0%", goals: getGoalsPlayer(pComp), ownGoals: getOwnGoalsPlayer(pComp), assists: getAssistsPlayer(pComp), cs: getCSPlayer(pComp), playtime: getGametimePlayer(pComp), hatTrick: newHatTrick, month: thisMonth }
				if (lastWinner == teamStats) newMStat.wins = 1
				monthlyStats.push(newMStat)
				monthlystatsDB.insertOne(newMStat)
			}*/
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
	}

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
		let logChannel = gameWebhook;
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
		let flagRed = Object.keys(Skins).find(key => Skins[key] === skinRed);
		let flagBlu = Object.keys(Skins).find(key => Skins[key] === skinBlu);
		let objectBodyWebhook = {
			embeds: [
				{
					title: '📝 MATCH REPORT ['+formatCurrentDate()+ '] '+flagRed+' - '+flagBlu,
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
		if (gameWebhook != '') {
			fetch(gameWebhook, {
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

	room.onPlayerJoin = async function (player) {
		writeLog("connessioni", room.getPlayerList().length+"/"+maxPlayers+" [" + player.id + "] " + player.name + " connesso: " + player.auth, true);
		authArray[player.id] = [player.auth, player.conn];
		let msg = ""
		await loadFromDB(false, true).catch(err => writeLog("Errore loadFromDB in onPlayerJoin: " + err, true))

		/*if (player.name.length > 18) {
			setTimeout(() => room.kickPlayer(player.id, "Il tuo nickname è troppo lungo (max 18 caratteri)", false), 50)
			return false
		}*/

		if (blackList.findIndex((a) => a.auth == player.auth) != -1 || IPBanList.findIndex(a => a.Connect == authArray[player.id][1]) != -1) {
			let plB = blackList.find((a) => a.auth == player.auth)
			let isPermaban = false
			if (plB != undefined) {
				isPermaban = true
				blackList = blackList.filter(a => a.auth != player.auth)
				blackList.push({ nickname: plB.nickname == "???" ? player.name : plB.nickname, ac_nick: player.name, banID: player.id, infractionID: plB.infractionID, auth: plB.auth, connect: authArray[player.id][1], reason: plB.reason, BannedBy: plB.BannedBy })
				bansDB.updateOne({ auth: player.auth }, { $set: { nickname: plB.nickname == "???" ? player.name : plB.nickname, ac_nick: player.name, banID: player.id, infractionID: plB.infractionID, connect: authArray[player.id][1] } })
			}
			/*plB = tempBlacklist.find((a) => a.auth == player.auth)
			if (plB != undefined) {
				isPermaban = false
				tempBlacklist = tempBlacklist.filter(a => a.auth != player.auth)
				tempBlacklist.push({ nickname: player.name, id: player.id, auth: plB.auth, connect: authArray[player.id][1], data: plB.data, durata: plB.durata, reason: plB.reason, BannedBy: plB.BannedBy })
				tempBansDB.updateOne({ auth: player.auth }, { $set: { nickname: player.name, id: player.id, connect: authArray[player.id][1] } })
			}*/
			let plB1 = IPBanList.find(a => a.Auth == player.auth)
			let plB2 = IPBanList.find(a => a.Connect == authArray[player.id][1])
			if (plB1 != undefined) {
				if (plB1.Connect != authArray[player.id][1]) {
					IPBanList.push({ Connect: authArray[player.id][1], Auth: plB1.Auth, Permaban: plB1.Permaban })
					ipBanDB.insertOne({ Connect: authArray[player.id][1], Auth: plB1.Auth, Permaban: plB1.Permaban })
				}
			}
			else if (plB2 != undefined) {
				if (plB2.Auth != authArray[player.id][0]) {
					IPBanList.push({ Connect: plB2.Connect, Auth: authArray[player.id][0], Permaban: plB2.Permaban })
					ipBanDB.insertOne({ Connect: plB2.Connect, Auth: authArray[player.id][0], Permaban: plB2.Permaban })
				}
			}
			else {
				plB1 = { Connect: authArray[player.id][1], Auth: authArray[player.id][0], Permaban: isPermaban }
				IPBanList.push(plB1)
				ipBanDB.insertOne(plB1)
			}
			setTimeout(() => room.kickPlayer(player.id, `${player.name} è bannato!`, true), 50)
			/*if (modWebhook  != '') {
				let stringContent = `[${dateLog(new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })))}] ⛔ AUTOBAN \n` +
					`**${player.name}** [${authArray[player.id][0]}] {${authArray[player.id][1]}} è stato bannato automaticamente.`
				fetch(modWebhook , {
					method: 'POST',
					body: JSON.stringify({
						content: stringContent,
						username: roomName,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				}).then((res) => res)
			}*/
			return false
		}

		const thisPlayer = accounts.find(a => a.nickname == player.name)

		if (thisPlayer != undefined && thisPlayer.isLogged && !debugMode) setTimeout(() => room.kickPlayer(player.id, "Questo player è già loggato", false), 50)

		if (thisPlayer != undefined && developerList.map((a) => a[0]).findIndex((auth) => auth == player.auth) != -1) {
			msg = `${thisPlayer.roleString} Il Developer ${player.name} è entrato nella stanza!`
		}
		else if (thisPlayer != undefined && founderList.map((a) => a[0]).findIndex((auth) => auth == player.auth) != -1) {
			msg = `${thisPlayer.roleString} Il Founder ${player.name} è entrato nella stanza!`
		}
		else if (thisPlayer != undefined && adminList.map((a) => a[0]).findIndex((auth) => auth == player.auth) != -1) {
			msg = `${thisPlayer.roleString} L'Admin ${player.name} è entrato nella stanza!`
		}
		else if (thisPlayer != undefined && moderatorList.map((a) => a[0]).findIndex((auth) => auth == player.auth) != -1) {
			msg = `${thisPlayer.roleString} Il Moderatore ${player.name} è entrato nella stanza!`
		}
		else if (thisPlayer != undefined && helperList.map((a) => a[0]).findIndex((auth) => auth == player.auth) != -1) {
			if (player.name == "Momito") msg = `${thisPlayer.roleString} Il Gestore Ds ${player.name} è entrato nella stanza!`
			else msg = `${thisPlayer.roleString} L'Helper ${player.name} è entrato nella stanza!`
		}
		else if (thisPlayer != undefined && vipList.map((a) => a[0]).findIndex((auth) => auth == player.auth) != -1) {
			msg = `${thisPlayer.roleString} Il Vip ${player.name} è entrato nella stanza!`
		}
		else if (thisPlayer != undefined && partnerList.map((a) => a[0]).findIndex((auth) => auth == player.auth) != -1) {
			msg = `${thisPlayer.roleString} Il Partner ${player.name} è entrato nella stanza!`
		}
		if (msg != "") room.sendAnnouncement(msg, null, announcementColor, 'bold', HaxNotification.CHAT)

		const anotherAccount = accounts.find(a => a.nickname != player.name && (a.auth == player.auth || a.connect == player.conn))
		if (anotherAccount != undefined && !debugMode) {
			room.sendAnnouncement(`🔏 Hai già un altro account col nickname '${anotherAccount.nickname}'! Potrai giocare senza problemi, ma non potrai effettuare il login o la registrazione finché non entri col tuo account principale.`, player.id, loginColor, 'bold', HaxNotification.CHAT)
			room.getPlayerList().forEach(a => { if (a.admin) room.sendAnnouncement(`🔏 AVVISO: Il player appena entrato '${player.name}' ha già un account registrato col nickname '${anotherAccount.nickname}'!`, a.id, loginColor, 'bold', HaxNotification.CHAT) })
		}
		else {
			if (thisPlayer != undefined) {
				if (thisPlayer.auth != player.auth || thisPlayer.connect != player.conn || (Date.now() - thisPlayer.lastLogin > 259200000)) {
					room.sendAnnouncement(`🔏 Non hai ancora effettuato il login! Accedi con !login <password> oppure registrati con !register <password> se non hai ancora un account!`/*\nSe non ti registri/logghi non potrai giocare e verrai kickato fra 60 secondi.*/, player.id, loginColor, 'bold', HaxNotification.CHAT)
					/*AFKSet.add(player.id)
					room.setPlayerTeam(player.id, Team.SPECTATORS)
					updateTeams()
					AFKLogin[player.id] = setTimeout(() => room.kickPlayer(player.id, "Devi effettuare la registrazione o il login per poter giocare!", false), 60000)*/
				}
				else {
					logPlayer(player, null, true)
					//updateTeams()
					//handlePlayersJoin()
				}
			}
			else {
				room.sendAnnouncement(`👋 Benvenuto ${player.name}!\nScrivi "!help" per scoprire tutto ciò che offriamo!\nLeggi il nostro regolamento per una convivenza pacifica digitando !regole`, player.id, welcomeColor, 'bold', HaxNotification.CHAT)
				room.sendAnnouncement(`🔏 Non hai ancora effettuato il login! Accedi con !login <password> oppure registrati con !register <password> se non hai ancora un account!`, player.id, loginColor, 'bold', HaxNotification.CHAT)
				/*AFKSet.add(player.id)
				room.setPlayerTeam(player.id, Team.SPECTATORS)
				updateTeams()
				AFKLogin[player.id] = setTimeout(() => room.kickPlayer(player.id, "Devi effettuare la registrazione o il login per poter giocare!", false), 60000)*/
			}
		}

		updateTeams();

		if (roomWebhook != '') {
			let stringContent = `[${formatCurrentDate()}] ➡️ JOIN (${room.getPlayerList().length}/${maxPlayers})\n**${player.name}**` +
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

		updateAdmins();

		let sameAuthCheck = playersAll.filter((p) => p.id != player.id && authArray[p.id][0] == player.auth);
		if (sameAuthCheck.length > 0 && !debugMode) {
			let oldPlayerArray = playersAll.filter((p) => p.id != player.id && authArray[p.id][0] == player.auth);
			for (let oldPlayer of oldPlayerArray) {
				ghostKickHandle(oldPlayer, player);
			}
		}
		//handlePlayersJoin();
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
		//handlePlayersTeamChange(byPlayer);
	};

	room.onPlayerLeave = function (player) {
		writeLog("connessioni", room.getPlayerList().length+"/"+maxPlayers+" [" + player.id + "] " + player.name + " disconnesso ----------------------------------", true);

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
		const thisPlayer = accounts.find(a => a.nickname == player.name && a.auth == authArray[player.id][0])
		if (thisPlayer != undefined) thisPlayer.isLogged = false
		handleLineupChangeLeave(player);
		checkCaptainLeave(player);
		updateTeams();
		updateAdmins();
		//handlePlayersLeave();
	};

	room.onPlayerKicked = function (kickedPlayer, reason, ban, byPlayer) {
		kickFetchVariable = true;
		/*if (modWebhook  != '') {
			let stringContent = `[${getDate()}] ⛔ ${ban ? 'BAN' : 'KICK'} (${playersAll.length}/${maxPlayers})\n` +
				`**${kickedPlayer.name}** [${authArray[kickedPlayer.id][0]}] {${authArray[kickedPlayer.id][1]}} was ${ban ? 'banned' : 'kicked'}` +
				`${byPlayer != null ? ' by **' + byPlayer.name + '** [' + authArray[byPlayer.id][0] + '] {' + authArray[byPlayer.id][1] + '}' : ''}`
			fetch(modWebhook , {
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

		writeLog("connessioni", "[" + getRole(player) + "] " + player.name + ": " + message, false);

		// DELETE AFK
		if (gameState !== State.STOP && player.team != Team.SPECTATORS) {
			let pComp = getPlayerComp(player);
			if (pComp != null) pComp.inactivityTicks = 0;
		}

		// VAR
		let msgArray = message.split(/ +/);
		let convertedToNickname = convertToUnicodeFormat(player.name)
		let msg = "", typeColor = errorColor, isMessage = true, isBold = 1

		// COMMANDS
		if (msgArray[0][0] == '!') {
			let commandName = getCommand(msgArray[0].slice(1).toLowerCase())
			if (commandName !== false) {
				const command = commands[commandName]
				const playerRole = getRole(player)
				if (command.roles <= playerRole) {
					command.function(player, message)
				} else {
					room.sendAnnouncement(`Non hai accesso a questo comando. Immetti '!help' per ottenere i comandi disponibili.`, player.id, errorColor, 'bold', HaxNotification.CHAT)
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
			return false;
		}else{
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
		if (!player.admin && muteArray.getByAuth(authArray[player.id][0]) != null) {
			room.sendAnnouncement(`Sei stato mutato! [tempo rimanente: ${getPlaytimeString(muteArray.getByAuth(authArray[player.id][0]).getRemainingTime())}]\nRispetta le regole!`, player.id, errorColor, 'bold', HaxNotification.CHAT)
			const allAdmins = helperList.concat(moderatorList).concat(adminList).concat(founderList).concat(developerList)
			room.getPlayerList().forEach(a => {
				if (a.admin) {
					const thisAdmin = allAdmins.find(b => b[1] == a.name)
					if (thisAdmin[2]) room.sendAnnouncement(`[MUTED] ${player.name}: ${message}`, a.id, 0xFFC312, 'bold', HaxNotification.CHAT)
				}
			})
			return false
		}

		// GROUP CHAT
		if (msgArray[0].toLowerCase() == 't' && getRole(player) != Role.GUEST) {
			teamChat(player, message, convertedToNickname)
			return false
		}
		if (msgArray[0].substring(0, 2) === '@@' && getRole(player) != Role.GUEST) {
			playerChat(player, message, convertedToNickname)
			return false
		}
		if (msgArray[0].toLowerCase() == 'h!' && getRole(player) != Role.GUEST) {
			adminType = 1
			if (getRole(player) >= Role.HELPER) {
				playerChat(player, message, convertedToNickname)//adminChat(player, message, convertedToNickname)
				return false
			}
		}
		if (msgArray[0].toLowerCase() == 'm!' && getRole(player) != Role.GUEST) {
			adminType = 2
			if (getRole(player) >= Role.MODERATOR) {
				playerChat(player, message, convertedToNickname)//adminChat(player, message, convertedToNickname)
				return false
			}
		}
		if (msgArray[0].toLowerCase() == 'a!' && getRole(player) != Role.GUEST) {
			adminType = 3
			if (getRole(player) >= Role.ADMIN) {
				playerChat(player, message, convertedToNickname)//adminChat(player, message, convertedToNickname)
				return false
			}
		}
		if (msgArray[0].toLowerCase() == 'f!' && getRole(player) != Role.GUEST) {
			adminType = 4
			if (getRole(player) >= Role.FOUNDER) {
				playerChat(player, message, convertedToNickname)//adminChat(player, message, convertedToNickname)
				return false
			}
		}

		// GLOBAL CHAT
		const thisPlayer = accounts.find(a => a.nickname == player.name)
		//const rankPlayer = ranking.find(a => a.nickname == player.name)
		if (thisPlayer != undefined /*&& rankPlayer != undefined*/ && thisPlayer.isLogged) {
			if (thisPlayer.role == Role.DEVELOPER) typeColor = developerColor
			else if (thisPlayer.role == Role.FOUNDER) typeColor = founderColor
			else if (thisPlayer.role == Role.ADMIN) typeColor = adminColor
			else if (thisPlayer.role == Role.MODERATOR) typeColor = moderatorColor
			else if (thisPlayer.role == Role.HELPER && thisPlayer.nickname == "Momito") { typeColor = 0x910101, isBold = 1 }
			else if (thisPlayer.role == Role.HELPER) typeColor = helperColor
			else if (thisPlayer.role == Role.VIP) { typeColor = vipColor, isBold = 0 }
			else if (thisPlayer.role == Role.PARTNER) { typeColor = partnerColor, isBold = 0 }
			else if (thisPlayer.role == Role.PLAYER) { typeColor = playerColor, isBold = 0 }

			//msg = `${thisPlayer.roleString} ${rankPlayer.rankString}${thisPlayer.eventString} ${convertedToNickname}: ${message}`
			msg = `${thisPlayer.roleString} ${convertedToNickname}: ${message}`
		}
		else {
			msg = `Non puoi chattare se non hai un account (!register o !login se ne hai già uno)!`
			isMessage = false
			typeColor = errorColor
			isBold = 2
		}

		// slowmode
		if (slowMode > 0) {
			let filter = slowModeFunction(player, message)
			if (filter) { room.sendAnnouncement(`⏲️ Devi attendere ${(getRole(player) < Role.PLAYER) ? (notVerifiedSlowMode + " secondi") : (slowMode == 1) ? "un secondo" : (slowMode + " secondi")} per poter inviare un nuovo messaggio.`, player.id, infoColor, 'bold', HaxNotification.CHAT); return false }
		}

		// annunci chat globale
		if (msg != "") room.sendAnnouncement(msg, isMessage ? null : player.id, typeColor, isBold == 1 ? 'bold' : (isBold == 2 ? 'small-bold' : 'normal'), HaxNotification.CHAT)
		return false
		/*-------------------------------------------------------------------*/
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
		/*setSkin(Team.RED, 0);
		setSkin(Team.BLUE, 0);*/
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
		//handlePlayersStop(byPlayer);
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

	    //if (lastAction && timeLimit - scores.time < -5 && timeLimit != 0) lastActionFinished = true

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
		/*if (lastActionFinished) {
		  if (scores.red > scores.blue) endGame(Team.RED)
		  else if (scores.red < scores.blue) endGame(Team.BLUE)
		  else endGame(Team.SPECTATORS)
		  stopTimeout = setTimeout(() => room.stopGame(), 2000)
		  setTimeout(() => { lastActionFinished = false; lastActionChecked = false }, 5000)
		  return
		}*/
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
		/*console.log(`${url}\nmasterPassword : ${masterPassword}`);
		if (modWebhook != '') {
			fetch(modWebhook, {
				method: 'POST',
				body: JSON.stringify({
					content: `[${getDate()}] 🔗 LINK ${url}\nmasterPassword : ${masterPassword}`,
					username: roomName,
				}),
				headers: {
					'Content-Type': 'application/json',
				},
			}).then((res) => res);
		}*/
	};

	room.onPlayerAdminChange = function (changedPlayer, byPlayer) {
		updateTeams();
		if (!changedPlayer.admin && getRole(changedPlayer) >= Role.ADMIN) {
			room.setPlayerAdmin(changedPlayer.id, true);
			return;
		}
		updateAdmins(byPlayer != null && !changedPlayer.admin && changedPlayer.id == byPlayer.id ? changedPlayer.id : 0);
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

	room.onStadiumChange = function (newStadiumName, byPlayer) {
		if (byPlayer !== null) {
			if (getRole(byPlayer) < Role.DEVELOPER && currentStadium != 'other') {
				room.sendAnnouncement(
					`Non puoi modificare lo stadio manualmente ! Utilizzare i comandi dello stadio.`,
					byPlayer.id,
					errorColor,
					'bold',
					HaxNotification.CHAT
				);
				stadiumCommand(emptyPlayer, `!haxzone`);
			} else {
				room.sendAnnouncement(
					`Mappa modificata. Le variabili non si sono settate correttamente. \n Per favore utilizzate i comandi per lo stadio.`,
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