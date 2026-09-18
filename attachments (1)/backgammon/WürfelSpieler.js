export class Wuerfel {
  constructor(wuerfelId) {
    this.wuerfelId = "";
    this.posX = ""; //.dice-area
    this.posY = ""; //.dice-area
    this.form = "quadrat";
  }
  #randomNum() {
    return Math.floor(Math.random() * 6) + 1;
  }
  sendNum() {
    return this.#randomNum();
  }
}
export class Spieler {
  constructor(spielerId) {
    this.spielerId = spielerId;
    this.spielerName = "";
    this.anzahlWin = 0;
    this.wins = false;
  }
  anmelden(name) {
    this.spielerName = name;
  }
  countWin() {
    if (this.wins) {
      this.anzahlWin += 1;
      this.wins = false;
    }
  }
  getWins() {
    return this.anzahlWin;
  }
}
