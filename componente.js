
function funzione1(giocatoreDaCercare) {
  console.log(variabile)
  //let risultatoAPI = //RICHIESTA API di tutte le stats di tutti i giocatori
  //risultatoAPI.find(a => a.nickname == giocatoreDaCercare)
  //return "Ciao";
}

function funzione2(num, player) {
  console.log(num + "\t\t");

  player.forEach( p => {
    var testo = `\n[${p.nome} ${p.cognome}] Età -> ${p.eta}`;
    console.log(testo);
  });
}

// Esporta le funzioni per renderle accessibili ad altri file
module.exports = {
  funzione1,
  funzione2
};
