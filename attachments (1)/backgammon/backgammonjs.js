import * as SpielfeldKomponenten from "./SpielFeldSteine.js";
import * as Spielerdice from "./WürfelSpieler.js";
import { i18nmanager } from "../i18nmanager.js";
// -------------------------------------------------------------
import { switchPage } from "../script35.js";

function i18nAlert(key, data = {}) {
  window.i18n.i18nAlert(key, data);
}

function t(key, data = {}) {
  return window.i18n.t(key, data);
}
export let spiel = null;
let ausgewaehlteZacke = null;
let ausgespielteSteineWeiß = 0;
let ausgespielteSteineSchwarz = 0;
//Alles um BAckgammon ab hier ----------
// DIESE FUNKTION WIRD EXPORTIERT UND ERST NACH DEM FETCH AUFGERUFEN!
export function initialisiereSpielstartKnoepfe() {
  console.log("Aktiviere Backgammon-Knöpfe und Event-Listener...");
  // --- SPIELSTART LOGIK ---

  const btnSpielstarten = document.getElementById("spielstarten");
  const spieler1Input = document.getElementById("spieler1");
  const spieler2Input = document.getElementById("spieler2");
  if (btnSpielstarten && spieler1Input && spieler2Input) {
    btnSpielstarten.addEventListener("click", () => {
      const name1 = spieler1Input.value.trim();
      const name2 = spieler2Input.value.trim();
      if (name1 === "" || name2 === "") {
        i18nAlert("alerts.inputname_message");
        return;
      }
      const spieler1 = new Spielerdice.Spieler(1);
      const spieler2 = new Spielerdice.Spieler(2);

      spieler1.anmelden(name1);
      spieler2.anmelden(name2);

      // 1. Blende den Anmeldeschirm aus
      const startPhase = document.getElementById("spielstart");
      if (startPhase) startPhase.classList.remove("aktiv");

      // 2. Schalte das Haupt-System aktiv (zeigt das #backgammon-Loch in der Haupt-HTML)
      switchPage("backgammon");

      // 3. Aktiviert das Spielbrett, indem es die versteckende Klasse sauber löscht
     const brett = document.getElementById("spielbrett");
      if (brett) {
        brett.classList.add("aktiv"); 
      }

      // 4. Jetzt die Logik initialisieren (nur einmal und es läuft sauber durch!)
      spiel ??= new SpielLogik(spieler1, spieler2);
    });
  } else {
    console.warn("Spielstart-Buttons oder Inputs wurden im HTML nicht gefunden!");
  }
  const modal = document.getElementById("rules-modal");
  const openBtn = document.getElementById("open-rules");
  const closeBtn = document.getElementById("close-rules");

  if (modal && openBtn && closeBtn) {
    openBtn.addEventListener("click", () => { modal.showModal(); });
    closeBtn.addEventListener("click", () => { modal.close(); });
    modal.addEventListener("click", (e) => {
      const dialogDimensions = modal.getBoundingClientRect();
      if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
      ) {
        modal.close();
      }
    });
  }
}

const farbuebersetzungen = {
  rot: { de: "Rot", en: "Red", fr: "Rouge", es: "rojo" },
  blau: { de: "Blau", en: "Blue", fr: "Bleu", es: "azul" },
  gruen: { de: "Grün", en: "Green", fr: "Vert", es: "Verde" },
  Weiß: { de: "Weiß", en: "White", fr: "Blanc", es: "Blanco/a" },
  Schwarz: { de: "Schwarz", en: "Black", fr: "Noir", es: "Negro/a" },
};
export class SpielLogik {
  constructor(spieler1Objekt, spieler2Objekt) {
    this.anzeigeSpieler = document.getElementById("aktueller-spieler");
    this.spieler1 = spieler1Objekt;
    this.spieler2 = spieler2Objekt;
    this.aktiverSpielerFarbe = "Weiß";
    this.phase = "auslosung";
    this.wurfSpieler1 = 0;
    this.wurfSpieler2 = 0;
    this.verbleibendeZuege = []; // Speichert die gewürfelten Augen
    // Jetzt greifst du über den vergebenen Namen auf die Klassen zu:
    this.board = new SpielfeldKomponenten.SpielFeld("backgammon-board");
    this.SpielfeldKomponenten = {
      barSchwarz: SpielfeldKomponenten.barSchwarz,
      barWeiß: SpielfeldKomponenten.barWeiß,
      ausstiegSchwarz: SpielfeldKomponenten.ausstiegSchwarz,
      ausstiegWeiß: SpielfeldKomponenten.ausstiegWeiß,
    };

    this.checker = new SpielfeldKomponenten.Steine(this);
    this.schwarzeSteine = new SpielfeldKomponenten.SteineSchwarz(
      "schwarz_standard",
      [],
      "feld_standard",
      this,
    ); //id, pos, fId, this);
    this.weißeSteine = new SpielfeldKomponenten.SteineWeiß(
      "schwarz_standard",
      [],
      "feld_standard",
      this,
    ); //id, pos, fId, this);
    this.dice = new Spielerdice.Wuerfel();
    this.checker.platziereStartSteine();

    if (this.anzeigeSpieler) {
      this.anzeigeSpieler.textContent = this.spieler1.spielerName;
    }

    // Falls das i18n-Modul das Span gekillt hat, Fallback auf das Haupt-Div:
    const hauptAnzeige = document.getElementById("spieler-anzeige");
    if (hauptAnzeige && !this.anzeigeSpieler) {
            // Ermittle die aktive Sprache (Standard: "de")
      const aktiveSprache = (window.i18n && window.i18n.aktuelleSprache) || "de";
      
      // Nutzt das farbuebersetzungen-Objekt für das (Weiß) oder (Schwarz)
      const uebersetzteFarbe = (typeof farbuebersetzungen !== "undefined" && farbuebersetzungen["Weiß"])
        ? (farbuebersetzungen["Weiß"][aktiveSprache] || "Weiß")
        : "Weiß";

      // Dynamischer, übersetzter Text für die UI:
      if (aktiveSprache === "en") {
        hauptAnzeige.textContent = `Turn: ${this.spieler1.spielerName} (${uebersetzteFarbe})`;
      } else if (aktiveSprache === "fr") {
        hauptAnzeige.textContent = `Au tour de: ${this.spieler1.spielerName} (${uebersetzteFarbe})`;
      } else if (aktiveSprache === "es") {
        hauptAnzeige.textContent = `Turno de: ${this.spieler1.spielerName} (${uebersetzteFarbe})`;
      } else {
        hauptAnzeige.textContent = `Am Zug: ${this.spieler1.spielerName} (${uebersetzteFarbe})`;
      }
    }

    // Falls die Feld-Klasse dort auch mal direkt gebraucht wird:
    // const testFeld = new SpielfeldKomponenten.Feld(1, 1, 0);
    this.initRollButton();
    this.initPassButton();
    this.initKlickStone();
  }

  // --- BACKGAMMON BEREICH: AUSLOSUNG, REGULÄRES WÜRFELN & STEINE MARKIEREN ---
  initRollButton() {
    const btnRoll = document.getElementById("btn-roll");
    const diceResult = document.getElementById("dice-result");
    // Zustandstracking des Matches
    // Dynamische Ermittlung der aktiven Sprache (Standard: "de")
    const aktiveSprache = (window.i18n && window.i18n.aktuelleSprache) || "de";

    if (btnRoll) {
     // Starttext übersetzen (de: "Startwurf", es: "Tirada inicial" etc.)
      const startText = aktiveSprache === "es" ? "Tirada inicial" : (aktiveSprache === "en" ? "Initial Roll" : (aktiveSprache === "fr" ? "Tirage initial" : "Startwurf"));
      btnRoll.textContent = `${startText}: ${this.spieler1.spielerName}`;
    }
    if (btnRoll && diceResult) {
      btnRoll.addEventListener("click", () => {
        const aktiveSpracheLive = (window.i18n && window.i18n.aktuelleSprache) || "de";
        // --- A: DIE AUSLOSUNG ---
        if (this.phase === "auslosung") {
          const wurf = this.dice.sendNum();
          const name1 = this.spieler1.spielerName;
          const name2 = this.spieler2.spielerName;

          const startText = aktiveSpracheLive === "es" ? "Tirada inicial" : (aktiveSpracheLive === "en" ? "Initial Roll" : (aktiveSpracheLive === "fr" ? "Tirage initial" : "Startwurf"));
          if (this.wurfSpieler1 === 0) {
            this.wurfSpieler1 = wurf;
            diceResult.innerHTML = `<span class="wuerfel">${this.wurfSpieler1}</span>`;
            btnRoll.textContent = `${startText}: ${name2}`;
          } else if (this.wurfSpieler2 === 0) {
            this.wurfSpieler2 = wurf;
            diceResult.innerHTML += `<span class="wuerfel">${this.wurfSpieler2}</span>`;

            const regulaerText = aktiveSpracheLive === "es" ? "Tirar dados" : (aktiveSpracheLive === "en" ? "Roll Dice" : (aktiveSpracheLive === "fr" ? "Lancer les dés" : "Regulär Würfeln"));
            if (this.wurfSpieler1 > this.wurfSpieler2) {
              setTimeout(() => {
                i18nAlert("alerts.startwinname_message", {
                  defaultValue:
                    "{{name1}} gewinnt den Startwurf und beginnt (Farbe: Weiß)!",
                  playerName: name1,
                });

                this.aktiverSpielerFarbe = "Weiß";
                if (this.anzeigeSpieler)
                  this.anzeigeSpieler.textContent = name1 + " (Weiß)";
                this.phase = "spiel";
                btnRoll.textContent = regulaerText;
                this.verbleibendeZuege = [this.wurfSpieler1, this.wurfSpieler2];
              }, 250);
            } else if (this.wurfSpieler2 > this.wurfSpieler1) {
              setTimeout(() => {
                i18nAlert("alerts.startwinname_message", {
                  defaultValue:
                    "{{name2}} gewinnt den Startwurf und beginnt (Farbe: Weiß)!",
                  playerName: name2,
                });
                this.aktiverSpielerFarbe = "Weiß";
                if (this.anzeigeSpieler)
                  this.anzeigeSpieler.textContent = name2 + " (Weiß)";
                this.phase = "spiel";
                btnRoll.textContent = regulaerText;
                // WICHTIG: Die Startwürfel direkt als Züge eintragen!
                this.verbleibendeZuege = [this.wurfSpieler1, this.wurfSpieler2];
              }, 250);
            } else {
              i18nAlert("alerts.samedice_message", {
                defaultValue: "Gleichstand! Bitte noch einmal würfeln.",
              });
              this.wurfSpieler1 = 0;
              this.wurfSpieler2 = 0;
              diceResult.innerHTML = "";
              btnRoll.textContent = `${startText}: ${name1}`;
            }
          }
        }
        // --- B: DAS REGULÄRE SPIEL ---
        else if (this.phase === "spiel") {
          // Wenn noch ungenutzte Würfel da sind, darf nicht neu gewürfelt werden
          if (this.verbleibendeZuege.length > 0) {
            i18nAlert("alerts.makemove_message", {
              defaultValue: "Du musst erst deine Züge machen!",
            });
            return;
          }
          this.aufhebenSelektion(this);
          const wuerfel1 = this.dice.sendNum(); //sendnum() von der Klasse würfel neue Objektvariante
          const wuerfel2 = this.dice.sendNum();
          diceResult.innerHTML = `<span class="wuerfel">${wuerfel1}</span><span class="wuerfel">${wuerfel2}</span>`;
          // Würfe für die Logik speichern
          if (wuerfel1 === wuerfel2) {
            // Pasch im Backgammon: Alle Zahlen zählen 4-mal!
            this.verbleibendeZuege = [wuerfel1, wuerfel1, wuerfel1, wuerfel1];
          } else {
            this.verbleibendeZuege = [wuerfel1, wuerfel2];
          }
          // HINWEIS: Der Spielerwechsel wurde hier entfernt.
          // Er findet jetzt statt, wenn verbleibendeZuege leer ist!
        }
      });
    }
  }
  initPassButton() {
    //Button zum passen fals man nicht ziehen kann um eine funktion zur berechnung zu umgehen
    const btnPass = document.getElementById("btn-pass");
    if (btnPass) {
      btnPass.addEventListener("click", () => {
        if (this.phase === "spiel" && this.verbleibendeZuege.length > 0) {
          this.verbleibendeZuege = []; // Züge verwerfen
          this.pruefeSpielerWechsel(); // Spielerwechsel erzwingen
        }
      });
    }
  }
  initKlickStone() {
    // --- KLICK-LOGIK FÜR DIE STEINE (INKLUSIVE BAR-REGELN) ---
    document.querySelectorAll(".point").forEach((zacke) => {
      zacke.addEventListener("click", () => {
        if (this.phase === "auslosung") return;
        if (this.verbleibendeZuege.length === 0) {
          i18nAlert("alerts.rolldice1_message", {
            defaultValue: "Bitte zuerst würfeln!",
          });
          return;
        }
        const zuId = parseInt(zacke.getAttribute("data-point"));
        const istObereReihe = zacke.parentElement.classList.contains("top-row");
        // --- PRÜFUNG: HAT DER SPIELER STEINE AUF DER BAR? ---
        //const hatSteineAufBar = (this.aktiverSpielerFarbe === "Weiß" && barWeiß > 0) || (this.aktiverSpielerFarbe === "Schwarz" && barSchwarz > 0);
        const hatSteineAufBar =
          (this.aktiverSpielerFarbe === "Weiß" &&
            this.SpielfeldKomponenten.barWeiß.anzahlSteine > 0) ||
          (this.aktiverSpielerFarbe === "Schwarz" &&
            this.SpielfeldKomponenten.barSchwarz.anzahlSteine > 0);
        // ABGEPASST AN DEIN CSS:
        // In der top-row ist der oberste Stein das LETZTE Element (lastElementChild)
        // In der bottom-row (wegen column-reverse) ist der oberste Stein das ERSTE Element (firstElementChild)
        const alleSteineInZacke = zacke.querySelectorAll(".checker");
        let obersterStein = null;
        if (alleSteineInZacke.length > 0) {
          obersterStein = alleSteineInZacke[alleSteineInZacke.length - 1];
        }
        // FALL 1: Stein auswählen (Nur erlaubt, wenn man KEINE Steine auf der Bar hat!)
        if (!this.ausgewaehlteZacke) {
          // --- NEU: LOGIK FÜR DAS WIEDEREINSETZEN VON DER BAR ---
          if (hatSteineAufBar) {
            // Berechnen, wie weit der Schritt von "außerhalb" auf dieses Feld wäre
            // Weiß startet vor Feld 1 (quasi bei 0) -> distanz ist die Feldnummer selbst
            // Schwarz startet nach Feld 24 (quasi bei 25) -> distanz ist 25 - Feldnummer
            let barDistanz =
              this.aktiverSpielerFarbe === "Weiß" ? zuId : 25 - zuId;
            // Prüfen, ob die gewürfelten Augen zu diesem Einstiegsfeld passen
            const wuerfelIndex = this.verbleibendeZuege.indexOf(barDistanz);
            if (wuerfelIndex !== -1) {
              // Prüfen, ob das Feld frei ist (weniger als 2 gegnerische Steine)
              const gegnerFarbe =
                this.aktiverSpielerFarbe === "Weiß" ? "Schwarz" : "Weiß";
              const gegnerSteineAnzahl = zacke.querySelectorAll(
                `.checker.${gegnerFarbe}`,
              ).length;
              if (gegnerSteineAnzahl >= 2) {
                i18nAlert("alerts.blocked_message", {
                  defaultValue:
                    "Dieses Einstiegsfeld ist vom Gegner blockiert!",
                });
                return;
              }
              // --- ZUG VON DER BAR AUSFÜHREN ---
              const barZoneId =
                this.aktiverSpielerFarbe === "Weiß"
                  ? "Bar-Weiß-Zone"
                  : "Bar-Schwarz-Zone";
              const barZone = document.getElementById(barZoneId);
              if (barZone && barZone.lastElementChild) {
                const steinVonBar = barZone.lastElementChild;
                // Falls der Gegner dort genau 1 Stein hat -> Schlagen!
                if (gegnerSteineAnzahl === 1) {
                  const geschlagenerStein = zacke.querySelector(
                    `.checker.${gegnerFarbe}`,
                  );
                  const zielBarZone = document.getElementById(
                    gegnerFarbe === "Weiß"
                      ? "Bar-Weiß-Zone"
                      : "Bar-Schwarz-Zone",
                  );
                  i18nAlert("alerts.kickedoutagain_message", {
                    defaultValue: `💥 Direkt beim Einstieg gekickt! Der {{farbe}}e Stein muss auf die Bar!`,
                    farbe: gegnerFarbe,
                  });
                  if (geschlagenerStein && zielBarZone) {
                    zielBarZone.appendChild(geschlagenerStein);
                  }
                  if (gegnerFarbe === "Weiß")
                    this.SpielfeldKomponenten.barWeiß.anzahlSteine++;
                  else this.SpielfeldKomponenten.barSchwarz.anzahlSteine++;
                }
                // Stein von der Bar auf das angeklickte Feld setzen
                steinVonBar.classList.remove("selected");

                zacke.appendChild(steinVonBar);
                // Zähler verringern
                if (this.aktiverSpielerFarbe === "Weiß")
                  this.SpielfeldKomponenten.barWeiß.anzahlSteine--;
                else this.SpielfeldKomponenten.barSchwarz.anzahlSteine--;
                // Würfel abziehen und Zug beenden
                this.verbleibendeZuege.splice(wuerfelIndex, 1);
                i18nAlert("alerts.backingame_message", {
                  defaultValue: `Stein erfolgreich von der Bar ins Feld {{feld}} eingesetzt!`,
                  feld: zuId,
                });
                this.pruefeSpielerWechsel();
              }
            } else {
              i18nAlert("alerts.noentry_message", {
                defaultValue: `Ungültiger Einstieg! Du kannst mit deinen Würfeln [{{zuege}}] nicht auf Feld {{feld}} einsteigen (benötigte Augenzahl: {{distanz}}).`,
                zuege: this.verbleibendeZuege.join(", "),
                feld: zuId,
                distanz: barDistanz,
              });
            }
            return; // Wichtig: Verhindert, dass der normale Auswahlcode danach ausgeführt wird!
          }

          if (
            obersterStein &&
            obersterStein.classList.contains(this.aktiverSpielerFarbe)
          ) {
            document
              .querySelectorAll(".checker.selected")
              .forEach((s) => s.classList.remove("selected"));
            obersterStein.classList.add("selected");
            this.ausgewaehlteZacke = zacke;
          } else if (obersterStein) {
            i18nAlert("alerts.notyourstone_message", {
              defaultValue: "Das ist nicht dein Stein!",
            });
          }
        }
        // FALL 2: Abbrechen bei Klick auf dieselbe Zacke
        else if (this.ausgewaehlteZacke === zacke) {
          this.aufhebenSelektion(this);
        }
        // FALL 3: Stein bewegen / Schlagen (Normaler Zug vom Feld)
        else {
          const vonId = parseInt(
            this.ausgewaehlteZacke.getAttribute("data-point"),
          );
          let distanz =
            this.aktiverSpielerFarbe === "Weiß" ? zuId - vonId : vonId - zuId;
          if (distanz <= 0) {
            i18nAlert("alerts.wrongdirection_message", {
              defaultValue: "Falsche Richtung! Du musst dich vorwärts bewegen.",
            });
            this.aufhebenSelektion(this);
            return;
          }
          const aktuellerChecker =
            this.aktiverSpielerFarbe === "Weiß"
              ? this.weißeSteine
              : this.schwarzeSteine;
          aktuellerChecker.fuehreZugAus(distanz, zacke, () => {
            // Wenn der Zug erfolgreich war, bewegen wir den ausgewählten Stein
            const steinZumBewegen =
              this.ausgewaehlteZacke.querySelector(".checker.selected");
            if (steinZumBewegen) {
              zacke.appendChild(steinZumBewegen);
            }
          });
        }
      });
    });
    // --- DOPPELKLICK-LOGIK FÜR DAS AUSSPIELEN AM SPIELENDE ---
    document.querySelectorAll(".point").forEach((zacke) => {
      zacke.addEventListener("dblclick", () => {
        if (this.phase !== "spiel" || this.verbleibendeZuege.length === 0)
          return;
        // Prüfen, ob dieser Spieler überhaupt schon ausspielen darf
        if (!this.darfAusspielen(this.aktiverSpielerFarbe, this)) {
          i18nAlert("alerts.allstonesinside1_message", {
            defaultValue:
              "Du musst erst ALLE deine Steine in dein Heimfeld bringen!",
          });
          return;
        }
        const vonId = parseInt(zacke.getAttribute("data-point"));
        const alleSteineInZacke = zacke.querySelectorAll(".checker");
        // Liegt hier überhaupt ein Stein des aktiven Spielers?
        let obersterStein =
          alleSteineInZacke.length > 0
            ? alleSteineInZacke[alleSteineInZacke.length - 1]
            : null;
        if (
          !obersterStein ||
          !obersterStein.classList.contains(this.aktiverSpielerFarbe)
        )
          return;
        // Berechnen, wie viele Augen man exakt braucht, um das Feld zu verlassen:
        // Weiß steht auf 19-24. Von 24 braucht man 1 Auge, von 23 braucht man 2... also: 25 - vonId
        // Schwarz steht auf 1-6. Von 1 braucht man 1 Auge, von 2 braucht man 2... also exakt: vonId
        let benoetigteAugen =
          this.aktiverSpielerFarbe === "Weiß" ? 25 - vonId : vonId;
        // Schauen, ob wir die exakte Würfelzahl im Array haben
        let wuerfelIndex = this.verbleibendeZuege.indexOf(benoetigteAugen);
        // Offizielle Backgammon-Regel: Wenn man eine höhere Zahl gewürfelt hat, als man eigentlich braucht
        // (z.B. man steht auf der 23, braucht eine 2, hat aber nur eine 6), darf man den am weitesten hinten
        // liegenden Stein trotzdem rauswerfen, wenn keine Steine weiter hinten stehen.
        if (wuerfelIndex === -1) {
          // Wir suchen nach dem höchsten verfügbaren Würfel, der GRÖSSER ist als benötigt
          const hoehererWuerfel = this.verbleibendeZuege.find(
            (w) => w > benoetigteAugen,
          );
          if (hoehererWuerfel) {
            // TODO: Für die einfachste Version erlauben wir den Zug direkt mit dem höheren Würfel
            wuerfelIndex = this.verbleibendeZuege.indexOf(hoehererWuerfel);
          }
        }
        if (wuerfelIndex !== -1) {
          // Stein vom Brett löschen
          zacke.removeChild(obersterStein);
          // Zähler erhöhen
          if (this.aktiverSpielerFarbe === "Weiß") {
            ausgespielteSteineWeiß++;
          } else {
            ausgespielteSteineSchwarz++;
          }
          // Würfel abziehen und Auswahl säubern
          this.verbleibendeZuege.splice(wuerfelIndex, 1);
          this.aufhebenSelektion(this);
          const aktiveSprache =
             (window.i18n && window.i18n.aktuelleSprache) || "de";

          const uebersetzteFarbe =
              farbuebersetzungen[this.aktiverSpielerFarbe]?.[aktiveSprache] ??
              this.aktiverSpielerFarbe;
          i18nAlert("alerts.stoneout_message", {
            farbe :uebersetzteFarbe,
          });
          // GEWINN-PRÜFUNG: Wer 15 Steine draußen hat, gewinnt das Match!
          if (ausgespielteSteineWeiß === 15) {
            const sieger = this.spieler1.spielerName || "Spieler Weiß";
            i18nAlert("alerts.winnergame_message", {
              defaultValue: `🏆 Herzlichen Glückwunsch! {{sieger}} WEIß hat das Spiel gewonnen!`,
              sieger: sieger,
            });
            // Name UND Datum/Punkte als Objekt speichern (besser für die Highscore-Logik!)
            highscoreListe.push({
              name: sieger,
              farbe: "Weiß",
              datum: new Date().toLocaleDateString(),
            });
            localStorage.setItem(
              "backgammon_highscores",
              JSON.stringify(highscoreListe),
            );
            if (typeof aktualisiereHighscoreAnzeige === "function")
              aktualisiereHighscoreAnzeige();
            // ZÜGE SOFORT SPERREN (Damit der andere nicht weiterspielt!)
            //hier sollten noch alle steine vom feld gelöscht werden
            this.verbleibendeZuege = [];
            this.phase = "beendet"; // Spiel ende
            //zu spielende springen
            switchPage("spielende");
          } else if (ausgespielteSteineSchwarz === 15) {
            const sieger = this.spieler2.spielerName || "Spieler Schwarz";
            i18nAlert("alerts.winnergame2_message", {
              defaultValue: `🏆 Herzlichen Glückwunsch! {{sieger}}  SCHWARZ hat das Spiel gewonnen!`,
              sieger: sieger,
            });
            // Name UND Datum/Punkte als Objekt speichern (besser für die Highscore-Logik!)
            highscoreListe.push({
              name: sieger,
              farbe: "Schwarz",
              datum: new Date().toLocaleDateString(),
            });
            localStorage.setItem(
              "backgammon_highscores",
              JSON.stringify(highscoreListe),
            );
            if (typeof aktualisiereHighscoreAnzeige === "function")
              aktualisiereHighscoreAnzeige();
            // ZÜGE SOFORT SPERREN (Damit der andere nicht weiterspielt!)
            //hier sollten noch alle steine vom feld gelöscht werden (oder steine neu aufstellen)
            this.verbleibendeZuege = [];
            this.phase = "beendet";
            //zu spielende springen
            switchPage("spielende");
          }
          this.pruefeSpielerWechsel();
        } else {
          i18nAlert("alerts.wrongvalueout_message", { vonId, benoetigteAugen });
        }
      });
    });
  }
  aufhebenSelektion(aktuellesSpiel) {
    /*document.querySelectorAll('.checker.selected').forEach(stein => {stein.classList.remove('selected');});
    ausgewaehlteZacke = null;*/
    document.querySelectorAll(".checker.selected").forEach((stein) => {
      stein.classList.remove("selected");
    });

    // 🟢 Hier setzt du die Variable innerhalb der Spiel-Instanz zurück!
    if (aktuellesSpiel) {
      aktuellesSpiel.ausgewaehlteZacke = null;
    }
  }

  darfAusspielen(spielerFarbe, spiel) {
    // Wenn noch Steine auf der Bar liegen, darf man nicht ausspielen!
    if (
      spielerFarbe === "Weiß" &&
      this.SpielfeldKomponenten.barWeiß.anzahlSteine > 0
    )
      return false;
    if (
      spielerFarbe === "Schwarz" &&
      this.SpielfeldKomponenten.barSchwarz.anzahlSteine > 0
    )
      return false;

    // Alle Points auf dem Brett durchsuchen
    const allePoints = document.querySelectorAll(".point");
    let steineAuserhalb = 0;

    allePoints.forEach((zacke) => {
      const punktId = parseInt(zacke.getAttribute("data-point"));
      const steineDesSpielers = zacke.querySelectorAll(
        `.checker.${spielerFarbe}`,
      ).length;

      if (spielerFarbe === "Weiß") {
        // Weiß darf NUR noch auf den Feldern 19-24 Steine haben.
        // Also zählen wir alle Steine auf den Feldern 1 bis 18:
        if (punktId <= 18) steineAuserhalb += steineDesSpielers;
      } else {
        // Schwarz darf NUR noch auf den Feldern 1-6 Steine haben.
        // Also zählen wir alle Steine auf den Feldern 7 bis 24:
        if (punktId >= 7) steineAuserhalb += steineDesSpielers;
      }
    });

    // Wenn 0 Steine außerhalb sind, ist der Weg frei fürs Finale!
    return steineAuserhalb === 0;
  }

  pruefeSpielerWechsel() {
    if (this.verbleibendeZuege.length === 0) {
      const name1 = this.spieler1.spielerName;
      const name2 = this.spieler2.spielerName;

      if (this.aktiverSpielerFarbe === "Weiß") {
        this.aktiverSpielerFarbe = "Schwarz";
      } else {
        this.aktiverSpielerFarbe = "Weiß";
      }

      const aktuellerName = this.aktiverSpielerFarbe === "Weiß" ? name1 : name2;
      //Ermittle die aktive Sprache
      const aktiveSprache =
        (window.i18n && window.i18n.aktuelleSprache) || "de";

      const uebersetzteFarbe =
          farbuebersetzungen[this.aktiverSpielerFarbe]?.[aktiveSprache] ??
          this.aktiverSpielerFarbe;

      const farbZusatz = ` (${uebersetzteFarbe})`;
    
      // Sicherheits-Check: Falls das Element im DOM neu generiert wurde, frisch holen
      if (!this.anzeigeSpieler) {
        this.anzeigeSpieler = document.getElementById("aktueller-spieler");
      }

      // Jetzt über "this." aufrufen:
      if (this.anzeigeSpieler) {
        this.anzeigeSpieler.textContent = aktuellerName + farbZusatz;
      } else {
        // Fallback auf das Haupt-Div, falls das Span fehlt
        const hauptAnzeige = document.getElementById("spieler-anzeige");
        if (hauptAnzeige) {
           // Fallback übersetzen
          if (aktiveSprache === "en") {
            hauptAnzeige.textContent = `Turn: ${aktuellerName}${farbZusatz}`;
          } else if (aktiveSprache === "fr") {
            hauptAnzeige.textContent = `Au tour de: ${aktuellerName}${farbZusatz}`;
          } else if (aktiveSprache === "es") {
            hauptAnzeige.textContent = `Turno de: ${aktuellerName}${farbZusatz}`;
          } else {
            hauptAnzeige.textContent = `Am Zug: ${aktuellerName}${farbZusatz}`;
          }
        }
      }
      i18nAlert("alerts.changeplayer_message", {
        defaultValue: "Spielerwechsel! {{playerName}} ist am Zug.",
        playerName: aktuellerName + farbZusatz,
      });
      //i18nAlert('changeplayer_message',{defaultValue:`Spielerwechsel! ${aktiverSpielerFarbe === "Weiß" ? name1 : name2} ist am Zug.`});
    }
  }
}
////Spielende - once again ?
// --- HIGHSCORE AUS LOCALSTORAGE LADEN ODER NEU STARTEN ---
// Diese Zeile ganz oben in deiner Datei (oder dort, wo highscoreListe definiert ist) platzieren:
export let highscoreListe =
  JSON.parse(localStorage.getItem("backgammon_highscores")) || [];
// --- HIGHSCORE-ANZEIGE IM HTML AKTUALISIEREN ---
export function aktualisiereHighscoreAnzeige() {
  const listenElement = document.getElementById("highscore-liste");
  if (!listenElement) return; // Falls das Element auf der aktuellen Seite nicht existiert, abbrechen

  listenElement.innerHTML = ""; // Liste zuerst leeren, um Dopplungen zu vermeiden
  const liste = window.highscoreListe || JSON.parse(localStorage.getItem("backgammon_highscores")) || [];
  const aktiveSprache = (window.i18n && window.i18n.aktuelleSprache) || "de";
  // Jeden Namen aus dem Array als Listeneintrag hinzufügen
  liste.forEach((eintrag) => {
    const li = document.createElement("li");
     
    const aktiveSprache =
     (window.i18n && window.i18n.aktuelleSprache) || "de";

    const uebersetzteFarbe =
     farbuebersetzungen[eintrag.farbe]?.[aktiveSprache] ??
     eintrag.farbe;

    // Da 'eintrag' jetzt ein Objekt ist, greifen wir gezielt auf .name, .farbe und .datum zu!
    li.innerHTML = `
            <strong style="color: #333;">${eintrag.name}</strong> 
            <span style="font-size: 0.85em; color: #666;">
                (${uebersetzteFarbe}) - ${eintrag.datum}
            </span>
        `;

    listenElement.appendChild(li);
  });
}
export function initialisiereSpielendeKnoepfe() {
  // --- SPIELENDE: EINFACHER SEITENWECHSEL ---
  const btnRestart = document.getElementById("btn-restart-same");
  const btnAgain = document.getElementById("btn-restart-new");

  // Mit denselben Spielern noch einmal (zurück zum leeren Spielbrett)
  if (btnRestart) {
    btnRestart.addEventListener("click", () => {
      switchPage("backgammon");
    });
  }

  // Ganz von vorn (zurück zur Namenseingabe)
  if (btnAgain) {
    btnAgain.addEventListener("click", () => {
      switchPage("spielstart");
    });
  }
 
  // --- HIGHSCORE BUTTON: EIN- UND AUSBLENDEN ---
  const btnToggleHighscore = document.getElementById("btn-toggle-highscore");
  if (btnToggleHighscore) {
    btnToggleHighscore.addEventListener("click", () => {
      const container = document.querySelector(".highscore-container");
      if (container) {
        // Wenn unsichtbar oder leer, dann anzeigen, sonst verstecken
        if (
          container.style.display === "none" ||
          container.style.display === ""
        ) {
          container.style.display = "block";
        } else {
          container.style.display = "none";
        }
      }
    });
  }
}
