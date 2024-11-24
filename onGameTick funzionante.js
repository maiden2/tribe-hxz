room.onGameTick = function () {
    checkTime();
    getLastTouchOfTheBall();
    getGameStats();
    handleActivity();

    if (currentStadium !== "4v4") return; // Applicabile solo alla mappa 4v4

    const players = room.getPlayerList().filter(p => p.team !== Team.SPECTATORS && p.position);

    // Filtra i giocatori per squadra
    const teamRedPlayers = players.filter(p => p.team === Team.RED);
    const teamBluePlayers = players.filter(p => p.team === Team.BLUE);

    // Conta i giocatori di ciascuna squadra nelle rispettive zone difensive
    const redInLeftZonePlayers = teamRedPlayers.filter(p => p.position.x <= DEFENSE_ZONE.leftX);
    const blueInRightZonePlayers = teamBluePlayers.filter(p => p.position.x >= DEFENSE_ZONE.rightX);

    // Funzione per spostare il giocatore fuori dalla zona difensiva
    function repositionPlayer(player) {
        let newX = player.position.x < 0 ? DEFENSE_ZONE.leftX + 80 : DEFENSE_ZONE.rightX - 80;
        room.setPlayerDiscProperties(player.id, { x: newX });
    }

    // Avviso inviato solo una volta per squadra
    let redWarningSent = false;
    let blueWarningSent = false;

    // Gestione della zona difensiva della squadra rossa
    if (redInLeftZonePlayers.length >= 3) {
        teamRedPlayers.forEach(player => {
            // Se il giocatore è fuori dalla zona di difesa e sta cercando di entrare
            if (player.position.x > DEFENSE_ZONE.leftX && player.position.x <= DEFENSE_ZONE.leftX + 2) {
                repositionPlayer(player);
                if (!redWarningSent) {
                    room.sendAnnouncement(`⚠️ ${player.name}, solo 3 difensori rossi possono stare in questa zona!`, player.id, 0xFF0000, "bold", 2);
                    redWarningSent = true;
                }
            }
        });
    }

    // Gestione della zona difensiva della squadra blu
    if (blueInRightZonePlayers.length >= 3) {
        teamBluePlayers.forEach(player => {
            // Se il giocatore è fuori dalla zona di difesa e sta cercando di entrare
            if (player.position.x < DEFENSE_ZONE.rightX && player.position.x >= DEFENSE_ZONE.rightX - 2) {
                repositionPlayer(player);
                if (!blueWarningSent) {
                    room.sendAnnouncement(`⚠️ ${player.name}, solo 3 difensori blu possono stare in questa zona!`, player.id, 0xFF0000, "bold", 2);
                    blueWarningSent = true;
                }
            }
        });
    }
};