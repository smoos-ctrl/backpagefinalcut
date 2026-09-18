(() => {
  // i18nmanager.js
  var i18nmanager = class {
    /**
     * @param {string} basePath - Der Ordnerpfad zu den JSON-Dateien (Standard: 'lang/')
     */
    constructor(basePath = "lang/") {
      this.basePath = basePath;
      this.uebersetzungen = {};
      this.aktuelleSprache = localStorage.getItem("preferredLanguage") || "de";
    }
    /**
     * Startet das System sicher, sobald das DOM bereit ist
     */
    async init() {
      if (document.readyState === "loading") {
        await new Promise(
          (resolve) => document.addEventListener("DOMContentLoaded", resolve)
        );
      }
      await this.ladeSprache(this.aktuelleSprache);
      this.setupSprachDropdown();
    }
    /**
     * Hilfsmethode: Löst verschachtelte JSON-Pfade (z. B. "grades.good") auf
     */
    getNestedTranslation(path) {
      if (!path) return null;
      return path.split(".").reduce((current, key) => {
        return current && current[key] !== void 0 ? current[key] : null;
      }, this.uebersetzungen);
    }
    /**
     * Holt eine Übersetzung anhand des Schlüssels und ersetzt optionale Platzhalter
     */
    t(key, data = {}) {
      let text = this.getNestedTranslation(key) || data.defaultValue || key;
      Object.keys(data).forEach((dataKey) => {
        if (dataKey !== "defaultValue") {
          text = text.replaceAll(`{{${dataKey}}}`, data[dataKey]);
        }
      });
      return text;
    }
    /**
     * Zeigt eine Übersetzung als nativen Browser-Alert an
     */
    i18nAlert(key, data = {}) {
      const meldung = this.t(key, data);
      alert(meldung);
    }
    /**
     * Lädt die JSON-Sprachdatei und triggert die DOM-Übersetzung
     */
    async ladeSprache(sprache) {
      try {
        const responseHaupt = await fetch(`lang/${sprache}.json`);
        let hauptDaten = {};
        if (responseHaupt.ok) {
          hauptDaten = await responseHaupt.json();
        } else {
          console.warn(`Haupt-Sprachdatei lang/${sprache}.json nicht gefunden.`);
        }
        const responseBackgammon = await fetch(`backgammon/lang/${sprache}.json`);
        let backgammonDaten = {};
        if (responseBackgammon.ok) {
          backgammonDaten = await responseBackgammon.json();
        } else {
          console.warn(
            `Backgammon-Sprachdatei backgammon/lang/${sprache}.json nicht gefunden.`
          );
        }
        this.uebersetzungen = {
          ...hauptDaten,
          ...backgammonDaten,
          elements: {
            ...hauptDaten.elements || {},
            ...backgammonDaten.elements || {}
          },
          alerts: {
            ...hauptDaten.alerts || {},
            ...backgammonDaten.alerts || {}
          }
        };
        this.aktuelleSprache = sprache;
        this.uebersetzeDOM();
        localStorage.setItem("preferredLanguage", sprache);
        const btn = document.getElementById("current-lang-btn");
        if (btn) btn.textContent = sprache.toUpperCase();
      } catch (error) {
        console.error("Fehler beim Laden der JSON-Datei:", error);
      }
    }
    /**
     * Sucht alle data-i18n Attribute im HTML und übersetzt diese
     */
    uebersetzeDOM() {
      document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.getAttribute("data-i18n");
        if (key.startsWith("placeholder:")) {
          const realKey = key.replace("placeholder:", "");
          const text = this.getNestedTranslation(realKey);
          if (text) element.setAttribute("placeholder", text);
        } else {
          const text = this.getNestedTranslation(key);
          if (text) element.textContent = text;
        }
      });
      this.aktualisiereSpezialElemente();
    }
    /**
     * Platzhalter für dynamische JS-Elemente (wie Ihr Noten-Dropdown)
     */
    aktualisiereSpezialElemente() {
      const gradeSelect = document.getElementById("grade");
      if (gradeSelect) {
        const optionKeys = [
          "grades.Sehr_gut",
          "grades.Gut",
          "grades.Befriedigend",
          "grades.Ausreichend",
          "grades.Mangelhaft",
          "grades.Ungen\xFCgend",
          "grades.out_of_order"
        ];
        const aktuellerWertIndex = gradeSelect.selectedIndex;
        gradeSelect.innerHTML = "";
        optionKeys.forEach((key) => {
          const uebersetzterText = this.t(key);
          const optionElement = document.createElement("option");
          optionElement.value = uebersetzterText;
          optionElement.textContent = uebersetzterText;
          gradeSelect.appendChild(optionElement);
        });
        if (aktuellerWertIndex >= 0 && gradeSelect.children.length > aktuellerWertIndex) {
          gradeSelect.selectedIndex = aktuellerWertIndex;
        }
      }
    }
    /**
     * Steuert das Öffnen/Schließen und die Klick-Events des Sprach-Dropdowns
     */
    setupSprachDropdown() {
      const dropdownBtn2 = document.getElementById("current-lang-btn");
      const langList2 = document.getElementById("lang-list");
      if (!dropdownBtn2 || !langList2) return;
      dropdownBtn2.addEventListener("click", () => {
        const isExpanded = dropdownBtn2.getAttribute("aria-expanded") === "true";
        dropdownBtn2.setAttribute("aria-expanded", !isExpanded);
        langList2.classList.toggle("show");
      });
      langList2.querySelectorAll("li").forEach((item) => {
        item.addEventListener("click", (event) => {
          const selectedLang = event.target.getAttribute("data-lang");
          this.ladeSprache(selectedLang);
          langList2.classList.remove("show");
          dropdownBtn2.setAttribute("aria-expanded", "false");
        });
      });
    }
  };

  // backgammon/SpielFeldSteine.js
  function i18nAlert(key, data = {}) {
    window.i18n.i18nAlert(key, data);
  }
  var SpielFeld = class {
    constructor(spielFeldId) {
      this.spielFeldId = spielFeldId ?? "backgammon-board";
      this.sizeX = "12fr";
      this.sizeY = "500px";
      this.felder = [];
      this.ausgewaehlteZacke = null;
      this.createPoints();
    }
    NumSteine() {
    }
    createPoints() {
      const topRowContainer = document.querySelector(".top-row");
      const bottomRowContainer = document.querySelector(".bottom-row");
      if (!topRowContainer || !bottomRowContainer) {
        console.warn(
          "Spielfeld-Container (.top-row oder .bottom-row) noch nicht im DOM gefunden! Versuche es gleich erneut..."
        );
        topRowContainer.innerHTML = "";
        bottomRowContainer.innerHTML = "";
        this.felder = [];
        setTimeout(() => this.createPoints(), 50);
        return;
      }
      const obereZahlen = Array.from({ length: 12 }, (_, index) => index + 13);
      obereZahlen.forEach((id, index) => {
        const currentX = index + 1;
        const neuesFeld = new Feld(id, currentX, 0);
        this.felder.push(neuesFeld);
        const pointElement = neuesFeld.generatePointElement(id);
        topRowContainer.appendChild(pointElement);
      });
      const untereZahlen = Array.from(
        { length: 12 },
        (_, index) => index + 1
      ).reverse();
      untereZahlen.forEach((id, index) => {
        const currentX = index + 1;
        const neuesFeld = new Feld(id, currentX, 500);
        this.felder.push(neuesFeld);
        const pointElement = neuesFeld.generatePointElement(id);
        bottomRowContainer.appendChild(pointElement);
      });
    }
  };
  var Feld = class {
    constructor(feldId, posX = 0, posY = 0) {
      this.feldId = feldId;
      this.posX = posX;
      this.posY = posY;
      this.form = "dreieck";
      console.log(
        `feldId: ${this.feldId} , posY: ${this.posY} px, posX: ${this.posX} fr`
      );
    }
    // Hilfsmethode, die ein einzelnes Punkt-Element baut
    generatePointElement(number) {
      const pointDiv = document.createElement("div");
      pointDiv.classList.add("point");
      pointDiv.setAttribute("data-point", number);
      return pointDiv;
    }
  };
  var SpezialFelder = class {
    constructor(spezialFeldId, FeldName, anzahlSteine = 0, posX = "", posY = "") {
      this.spezialFeldId = spezialFeldId;
      this.FeldName = FeldName;
      this.anzahlSteine = anzahlSteine;
      this.posX = posX;
      this.posY = posY;
    }
  };
  var barWei\u00DF = new SpezialFelder(26, "barWei\xDF", 0, "mitte", "unten");
  var barSchwarz = new SpezialFelder(
    27,
    "barschwarz",
    0,
    "mitte",
    "oben"
  );
  var ausstiegSchwarz = new SpezialFelder(
    0,
    "ausstiegSchwarz",
    0,
    "rechts",
    "unten"
  );
  var ausstiegWei\u00DF = new SpezialFelder(
    25,
    "ausstiegWei\xDF",
    0,
    "rechts",
    "oben"
  );
  var startAufstellung = {
    1: { spieler: "Wei\xDF", anzahl: 2 },
    6: { spieler: "Schwarz", anzahl: 5 },
    8: { spieler: "Schwarz", anzahl: 3 },
    12: { spieler: "Wei\xDF", anzahl: 5 },
    13: { spieler: "Schwarz", anzahl: 5 },
    17: { spieler: "Wei\xDF", anzahl: 3 },
    19: { spieler: "Wei\xDF", anzahl: 5 },
    24: { spieler: "Schwarz", anzahl: 2 }
  };
  var Steine = class {
    constructor(farbe, position, spiel2) {
      this.farbe = farbe;
      this.position = [];
      this.spiel = spiel2;
      this.anzahl = 30;
      this.form = "rund";
    }
    platziereStartSteine() {
      console.log("Platziere die Startaufstellung der Steine...");
      document.querySelectorAll(".point").forEach((zacke) => {
        zacke.innerHTML = "";
      });
      for (const zackeId in startAufstellung) {
        const zackeInfo = startAufstellung[zackeId];
        const zackeElement = document.querySelector(
          `.point[data-point="${zackeId}"]`
        );
        if (zackeElement) {
          for (let i = 0; i < zackeInfo.anzahl; i++) {
            const stein = document.createElement("div");
            stein.className = `checker ${zackeInfo.spieler}`;
            zackeElement.appendChild(stein);
          }
        }
      }
    }
    steinBewegen(distanz, zielZacke, bewegeSteinDOMFunktion) {
      const wuerfelIndex = this.spiel.verbleibendeZuege.indexOf(distanz);
      if (wuerfelIndex !== -1) {
        const gegnerFarbe = this.spiel.aktiverSpielerFarbe === "Wei\xDF" ? "Schwarz" : "Wei\xDF";
        const gegnerSteine = zielZacke.querySelectorAll(
          `.checker.${gegnerFarbe}`
        );
        const gegnerSteineAnzahl = gegnerSteine.length;
        if (gegnerSteineAnzahl >= 2) {
          i18nAlert("alerts.blockedpoint_message", {
            defaultValue: "Dieser Point ist vom Gegner blockiert!"
          });
          this.spiel.aufhebenSelektion(this.spiel);
          return;
        }
        bewegeSteinDOMFunktion();
        this.spiel.verbleibendeZuege.splice(wuerfelIndex, 1);
        this.spiel.aufhebenSelektion(this.spiel);
        setTimeout(() => {
          if (gegnerSteineAnzahl === 1) {
            const geschlagenerStein = zielZacke.querySelector(
              `.checker.${gegnerFarbe}`
            );
            if (geschlagenerStein) {
              const aktiveSprache = window.i18n && window.i18n.aktuelleSprache || "de";
              const lokaleFarben = {
                Wei\u00DF: { de: "Wei\xDF", en: "White", fr: "Blanc", es: "Blanco/a" },
                Schwarz: { de: "Schwarz", en: "Black", fr: "Noir", es: "Negro/a" }
              };
              const uebersetzteGegnerFarbe = lokaleFarben[gegnerFarbe] ? lokaleFarben[gegnerFarbe][aktiveSprache] || gegnerFarbe : gegnerFarbe;
              i18nAlert("alerts.kickedatbar_message", {
                farbe: uebersetzteGegnerFarbe,
                defaultValue: `\u{1F4A5} Gekickt! Der {{farbe}}e Stein wurde auf die Bar geschlagen!`
              });
              const barZoneId = gegnerFarbe === "Wei\xDF" ? "Bar-Wei\xDF-Zone" : "Bar-Schwarz-Zone";
              const barZone = document.getElementById(barZoneId);
              if (barZone) {
                geschlagenerStein.classList.remove("selected");
                barZone.appendChild(geschlagenerStein);
              }
              if (gegnerFarbe === "Wei\xDF") barWei\u00DF.anzahlSteine++;
              else barSchwarz.anzahlSteine++;
            }
          }
          this.spiel.pruefeSpielerWechsel();
        }, 250);
      } else {
        i18nAlert("alerts.wrongvalueingame_message", {
          defaultValue: `Ung\xFCltiger Zug! Keine passende W\xFCrfelzahl f\xFCr ${distanz} Felder.`
        });
        this.spiel.aufhebenSelektion(this.spiel);
      }
    }
    fuehreZugAus(distanz, zielZacke, bewegeSteinDOMFunktion) {
      if (this.farbe.toLowerCase() !== this.spiel.aktiverSpielerFarbe.toLowerCase()) {
        console.log("Du bist gar nicht dran!");
        return;
      }
      this.steinBewegen(distanz, zielZacke, bewegeSteinDOMFunktion);
    }
  };
  var SteineWei\u00DF = class extends Steine {
    constructor(steinId, startPos, feldId, spiel2) {
      super("wei\xDF", startPos, spiel2);
      this.steinId = steinId;
      this.feldId = feldId;
      this.anzahlmax = 15;
    }
  };
  var SteineSchwarz = class extends Steine {
    constructor(steinId, startPos, feldId, spiel2) {
      super("schwarz", startPos, spiel2);
      this.steinId = steinId;
      this.feldId = feldId;
      this.anzahlmax = 15;
    }
  };

  // backgammon/WürfelSpieler.js
  var Wuerfel = class {
    constructor(wuerfelId) {
      this.wuerfelId = "";
      this.posX = "";
      this.posY = "";
      this.form = "quadrat";
    }
    #randomNum() {
      return Math.floor(Math.random() * 6) + 1;
    }
    sendNum() {
      return this.#randomNum();
    }
  };
  var Spieler = class {
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
  };

  // backgammon/backgammonjs.js
  function i18nAlert2(key, data = {}) {
    window.i18n.i18nAlert(key, data);
  }
  var spiel = null;
  var ausgespielteSteineWei\u00DF = 0;
  var ausgespielteSteineSchwarz = 0;
  function initialisiereSpielstartKnoepfe() {
    console.log("Aktiviere Backgammon-Kn\xF6pfe und Event-Listener...");
    const btnSpielstarten = document.getElementById("spielstarten");
    const spieler1Input = document.getElementById("spieler1");
    const spieler2Input = document.getElementById("spieler2");
    if (btnSpielstarten && spieler1Input && spieler2Input) {
      btnSpielstarten.addEventListener("click", () => {
        const name1 = spieler1Input.value.trim();
        const name2 = spieler2Input.value.trim();
        if (name1 === "" || name2 === "") {
          i18nAlert2("alerts.inputname_message");
          return;
        }
        const spieler1 = new Spieler(1);
        const spieler2 = new Spieler(2);
        spieler1.anmelden(name1);
        spieler2.anmelden(name2);
        const startPhase = document.getElementById("spielstart");
        if (startPhase) startPhase.classList.remove("aktiv");
        switchPage("backgammon");
        const brett = document.getElementById("spielbrett");
        if (brett) {
          brett.classList.add("aktiv");
        }
        spiel ??= new SpielLogik(spieler1, spieler2);
      });
    } else {
      console.warn("Spielstart-Buttons oder Inputs wurden im HTML nicht gefunden!");
    }
    const modal = document.getElementById("rules-modal");
    const openBtn = document.getElementById("open-rules");
    const closeBtn = document.getElementById("close-rules");
    if (modal && openBtn && closeBtn) {
      openBtn.addEventListener("click", () => {
        modal.showModal();
      });
      closeBtn.addEventListener("click", () => {
        modal.close();
      });
      modal.addEventListener("click", (e) => {
        const dialogDimensions = modal.getBoundingClientRect();
        if (e.clientX < dialogDimensions.left || e.clientX > dialogDimensions.right || e.clientY < dialogDimensions.top || e.clientY > dialogDimensions.bottom) {
          modal.close();
        }
      });
    }
  }
  var farbuebersetzungen = {
    rot: { de: "Rot", en: "Red", fr: "Rouge", es: "rojo" },
    blau: { de: "Blau", en: "Blue", fr: "Bleu", es: "azul" },
    gruen: { de: "Gr\xFCn", en: "Green", fr: "Vert", es: "Verde" },
    Wei\u00DF: { de: "Wei\xDF", en: "White", fr: "Blanc", es: "Blanco/a" },
    Schwarz: { de: "Schwarz", en: "Black", fr: "Noir", es: "Negro/a" }
  };
  var SpielLogik = class {
    constructor(spieler1Objekt, spieler2Objekt) {
      this.anzeigeSpieler = document.getElementById("aktueller-spieler");
      this.spieler1 = spieler1Objekt;
      this.spieler2 = spieler2Objekt;
      this.aktiverSpielerFarbe = "Wei\xDF";
      this.phase = "auslosung";
      this.wurfSpieler1 = 0;
      this.wurfSpieler2 = 0;
      this.verbleibendeZuege = [];
      this.board = new SpielFeld("backgammon-board");
      this.SpielfeldKomponenten = {
        barSchwarz,
        barWei\u00DF,
        ausstiegSchwarz,
        ausstiegWei\u00DF
      };
      this.checker = new Steine(this);
      this.schwarzeSteine = new SteineSchwarz(
        "schwarz_standard",
        [],
        "feld_standard",
        this
      );
      this.wei\u00DFeSteine = new SteineWei\u00DF(
        "schwarz_standard",
        [],
        "feld_standard",
        this
      );
      this.dice = new Wuerfel();
      this.checker.platziereStartSteine();
      if (this.anzeigeSpieler) {
        this.anzeigeSpieler.textContent = this.spieler1.spielerName;
      }
      const hauptAnzeige = document.getElementById("spieler-anzeige");
      if (hauptAnzeige && !this.anzeigeSpieler) {
        const aktiveSprache = window.i18n && window.i18n.aktuelleSprache || "de";
        const uebersetzteFarbe = typeof farbuebersetzungen !== "undefined" && farbuebersetzungen["Wei\xDF"] ? farbuebersetzungen["Wei\xDF"][aktiveSprache] || "Wei\xDF" : "Wei\xDF";
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
      this.initRollButton();
      this.initPassButton();
      this.initKlickStone();
    }
    // --- BACKGAMMON BEREICH: AUSLOSUNG, REGULÄRES WÜRFELN & STEINE MARKIEREN ---
    initRollButton() {
      const btnRoll = document.getElementById("btn-roll");
      const diceResult = document.getElementById("dice-result");
      const aktiveSprache = window.i18n && window.i18n.aktuelleSprache || "de";
      if (btnRoll) {
        const startText = aktiveSprache === "es" ? "Tirada inicial" : aktiveSprache === "en" ? "Initial Roll" : aktiveSprache === "fr" ? "Tirage initial" : "Startwurf";
        btnRoll.textContent = `${startText}: ${this.spieler1.spielerName}`;
      }
      if (btnRoll && diceResult) {
        btnRoll.addEventListener("click", () => {
          const aktiveSpracheLive = window.i18n && window.i18n.aktuelleSprache || "de";
          if (this.phase === "auslosung") {
            const wurf = this.dice.sendNum();
            const name1 = this.spieler1.spielerName;
            const name2 = this.spieler2.spielerName;
            const startText = aktiveSpracheLive === "es" ? "Tirada inicial" : aktiveSpracheLive === "en" ? "Initial Roll" : aktiveSpracheLive === "fr" ? "Tirage initial" : "Startwurf";
            if (this.wurfSpieler1 === 0) {
              this.wurfSpieler1 = wurf;
              diceResult.innerHTML = `<span class="wuerfel">${this.wurfSpieler1}</span>`;
              btnRoll.textContent = `${startText}: ${name2}`;
            } else if (this.wurfSpieler2 === 0) {
              this.wurfSpieler2 = wurf;
              diceResult.innerHTML += `<span class="wuerfel">${this.wurfSpieler2}</span>`;
              const regulaerText = aktiveSpracheLive === "es" ? "Tirar dados" : aktiveSpracheLive === "en" ? "Roll Dice" : aktiveSpracheLive === "fr" ? "Lancer les d\xE9s" : "Regul\xE4r W\xFCrfeln";
              if (this.wurfSpieler1 > this.wurfSpieler2) {
                setTimeout(() => {
                  i18nAlert2("alerts.startwinname_message", {
                    defaultValue: "{{name1}} gewinnt den Startwurf und beginnt (Farbe: Wei\xDF)!",
                    playerName: name1
                  });
                  this.aktiverSpielerFarbe = "Wei\xDF";
                  if (this.anzeigeSpieler)
                    this.anzeigeSpieler.textContent = name1 + " (Wei\xDF)";
                  this.phase = "spiel";
                  btnRoll.textContent = regulaerText;
                  this.verbleibendeZuege = [this.wurfSpieler1, this.wurfSpieler2];
                }, 250);
              } else if (this.wurfSpieler2 > this.wurfSpieler1) {
                setTimeout(() => {
                  i18nAlert2("alerts.startwinname_message", {
                    defaultValue: "{{name2}} gewinnt den Startwurf und beginnt (Farbe: Wei\xDF)!",
                    playerName: name2
                  });
                  this.aktiverSpielerFarbe = "Wei\xDF";
                  if (this.anzeigeSpieler)
                    this.anzeigeSpieler.textContent = name2 + " (Wei\xDF)";
                  this.phase = "spiel";
                  btnRoll.textContent = regulaerText;
                  this.verbleibendeZuege = [this.wurfSpieler1, this.wurfSpieler2];
                }, 250);
              } else {
                i18nAlert2("alerts.samedice_message", {
                  defaultValue: "Gleichstand! Bitte noch einmal w\xFCrfeln."
                });
                this.wurfSpieler1 = 0;
                this.wurfSpieler2 = 0;
                diceResult.innerHTML = "";
                btnRoll.textContent = `${startText}: ${name1}`;
              }
            }
          } else if (this.phase === "spiel") {
            if (this.verbleibendeZuege.length > 0) {
              i18nAlert2("alerts.makemove_message", {
                defaultValue: "Du musst erst deine Z\xFCge machen!"
              });
              return;
            }
            this.aufhebenSelektion(this);
            const wuerfel1 = this.dice.sendNum();
            const wuerfel2 = this.dice.sendNum();
            diceResult.innerHTML = `<span class="wuerfel">${wuerfel1}</span><span class="wuerfel">${wuerfel2}</span>`;
            if (wuerfel1 === wuerfel2) {
              this.verbleibendeZuege = [wuerfel1, wuerfel1, wuerfel1, wuerfel1];
            } else {
              this.verbleibendeZuege = [wuerfel1, wuerfel2];
            }
          }
        });
      }
    }
    initPassButton() {
      const btnPass = document.getElementById("btn-pass");
      if (btnPass) {
        btnPass.addEventListener("click", () => {
          if (this.phase === "spiel" && this.verbleibendeZuege.length > 0) {
            this.verbleibendeZuege = [];
            this.pruefeSpielerWechsel();
          }
        });
      }
    }
    initKlickStone() {
      document.querySelectorAll(".point").forEach((zacke) => {
        zacke.addEventListener("click", () => {
          if (this.phase === "auslosung") return;
          if (this.verbleibendeZuege.length === 0) {
            i18nAlert2("alerts.rolldice1_message", {
              defaultValue: "Bitte zuerst w\xFCrfeln!"
            });
            return;
          }
          const zuId = parseInt(zacke.getAttribute("data-point"));
          const istObereReihe = zacke.parentElement.classList.contains("top-row");
          const hatSteineAufBar = this.aktiverSpielerFarbe === "Wei\xDF" && this.SpielfeldKomponenten.barWei\u00DF.anzahlSteine > 0 || this.aktiverSpielerFarbe === "Schwarz" && this.SpielfeldKomponenten.barSchwarz.anzahlSteine > 0;
          const alleSteineInZacke = zacke.querySelectorAll(".checker");
          let obersterStein = null;
          if (alleSteineInZacke.length > 0) {
            obersterStein = alleSteineInZacke[alleSteineInZacke.length - 1];
          }
          if (!this.ausgewaehlteZacke) {
            if (hatSteineAufBar) {
              let barDistanz = this.aktiverSpielerFarbe === "Wei\xDF" ? zuId : 25 - zuId;
              const wuerfelIndex = this.verbleibendeZuege.indexOf(barDistanz);
              if (wuerfelIndex !== -1) {
                const gegnerFarbe = this.aktiverSpielerFarbe === "Wei\xDF" ? "Schwarz" : "Wei\xDF";
                const gegnerSteineAnzahl = zacke.querySelectorAll(
                  `.checker.${gegnerFarbe}`
                ).length;
                if (gegnerSteineAnzahl >= 2) {
                  i18nAlert2("alerts.blocked_message", {
                    defaultValue: "Dieses Einstiegsfeld ist vom Gegner blockiert!"
                  });
                  return;
                }
                const barZoneId = this.aktiverSpielerFarbe === "Wei\xDF" ? "Bar-Wei\xDF-Zone" : "Bar-Schwarz-Zone";
                const barZone = document.getElementById(barZoneId);
                if (barZone && barZone.lastElementChild) {
                  const steinVonBar = barZone.lastElementChild;
                  if (gegnerSteineAnzahl === 1) {
                    const geschlagenerStein = zacke.querySelector(
                      `.checker.${gegnerFarbe}`
                    );
                    const zielBarZone = document.getElementById(
                      gegnerFarbe === "Wei\xDF" ? "Bar-Wei\xDF-Zone" : "Bar-Schwarz-Zone"
                    );
                    i18nAlert2("alerts.kickedoutagain_message", {
                      defaultValue: `\u{1F4A5} Direkt beim Einstieg gekickt! Der {{farbe}}e Stein muss auf die Bar!`,
                      farbe: gegnerFarbe
                    });
                    if (geschlagenerStein && zielBarZone) {
                      zielBarZone.appendChild(geschlagenerStein);
                    }
                    if (gegnerFarbe === "Wei\xDF")
                      this.SpielfeldKomponenten.barWei\u00DF.anzahlSteine++;
                    else this.SpielfeldKomponenten.barSchwarz.anzahlSteine++;
                  }
                  steinVonBar.classList.remove("selected");
                  zacke.appendChild(steinVonBar);
                  if (this.aktiverSpielerFarbe === "Wei\xDF")
                    this.SpielfeldKomponenten.barWei\u00DF.anzahlSteine--;
                  else this.SpielfeldKomponenten.barSchwarz.anzahlSteine--;
                  this.verbleibendeZuege.splice(wuerfelIndex, 1);
                  i18nAlert2("alerts.backingame_message", {
                    defaultValue: `Stein erfolgreich von der Bar ins Feld {{feld}} eingesetzt!`,
                    feld: zuId
                  });
                  this.pruefeSpielerWechsel();
                }
              } else {
                i18nAlert2("alerts.noentry_message", {
                  defaultValue: `Ung\xFCltiger Einstieg! Du kannst mit deinen W\xFCrfeln [{{zuege}}] nicht auf Feld {{feld}} einsteigen (ben\xF6tigte Augenzahl: {{distanz}}).`,
                  zuege: this.verbleibendeZuege.join(", "),
                  feld: zuId,
                  distanz: barDistanz
                });
              }
              return;
            }
            if (obersterStein && obersterStein.classList.contains(this.aktiverSpielerFarbe)) {
              document.querySelectorAll(".checker.selected").forEach((s) => s.classList.remove("selected"));
              obersterStein.classList.add("selected");
              this.ausgewaehlteZacke = zacke;
            } else if (obersterStein) {
              i18nAlert2("alerts.notyourstone_message", {
                defaultValue: "Das ist nicht dein Stein!"
              });
            }
          } else if (this.ausgewaehlteZacke === zacke) {
            this.aufhebenSelektion(this);
          } else {
            const vonId = parseInt(
              this.ausgewaehlteZacke.getAttribute("data-point")
            );
            let distanz = this.aktiverSpielerFarbe === "Wei\xDF" ? zuId - vonId : vonId - zuId;
            if (distanz <= 0) {
              i18nAlert2("alerts.wrongdirection_message", {
                defaultValue: "Falsche Richtung! Du musst dich vorw\xE4rts bewegen."
              });
              this.aufhebenSelektion(this);
              return;
            }
            const aktuellerChecker = this.aktiverSpielerFarbe === "Wei\xDF" ? this.wei\u00DFeSteine : this.schwarzeSteine;
            aktuellerChecker.fuehreZugAus(distanz, zacke, () => {
              const steinZumBewegen = this.ausgewaehlteZacke.querySelector(".checker.selected");
              if (steinZumBewegen) {
                zacke.appendChild(steinZumBewegen);
              }
            });
          }
        });
      });
      document.querySelectorAll(".point").forEach((zacke) => {
        zacke.addEventListener("dblclick", () => {
          if (this.phase !== "spiel" || this.verbleibendeZuege.length === 0)
            return;
          if (!this.darfAusspielen(this.aktiverSpielerFarbe, this)) {
            i18nAlert2("alerts.allstonesinside1_message", {
              defaultValue: "Du musst erst ALLE deine Steine in dein Heimfeld bringen!"
            });
            return;
          }
          const vonId = parseInt(zacke.getAttribute("data-point"));
          const alleSteineInZacke = zacke.querySelectorAll(".checker");
          let obersterStein = alleSteineInZacke.length > 0 ? alleSteineInZacke[alleSteineInZacke.length - 1] : null;
          if (!obersterStein || !obersterStein.classList.contains(this.aktiverSpielerFarbe))
            return;
          let benoetigteAugen = this.aktiverSpielerFarbe === "Wei\xDF" ? 25 - vonId : vonId;
          let wuerfelIndex = this.verbleibendeZuege.indexOf(benoetigteAugen);
          if (wuerfelIndex === -1) {
            const hoehererWuerfel = this.verbleibendeZuege.find(
              (w) => w > benoetigteAugen
            );
            if (hoehererWuerfel) {
              wuerfelIndex = this.verbleibendeZuege.indexOf(hoehererWuerfel);
            }
          }
          if (wuerfelIndex !== -1) {
            zacke.removeChild(obersterStein);
            if (this.aktiverSpielerFarbe === "Wei\xDF") {
              ausgespielteSteineWei\u00DF++;
            } else {
              ausgespielteSteineSchwarz++;
            }
            this.verbleibendeZuege.splice(wuerfelIndex, 1);
            this.aufhebenSelektion(this);
            const aktiveSprache = window.i18n && window.i18n.aktuelleSprache || "de";
            const uebersetzteFarbe = farbuebersetzungen[this.aktiverSpielerFarbe]?.[aktiveSprache] ?? this.aktiverSpielerFarbe;
            i18nAlert2("alerts.stoneout_message", {
              farbe: uebersetzteFarbe
            });
            if (ausgespielteSteineWei\u00DF === 15) {
              const sieger = this.spieler1.spielerName || "Spieler Wei\xDF";
              i18nAlert2("alerts.winnergame_message", {
                defaultValue: `\u{1F3C6} Herzlichen Gl\xFCckwunsch! {{sieger}} WEI\xDF hat das Spiel gewonnen!`,
                sieger
              });
              highscoreListe.push({
                name: sieger,
                farbe: "Wei\xDF",
                datum: (/* @__PURE__ */ new Date()).toLocaleDateString()
              });
              localStorage.setItem(
                "backgammon_highscores",
                JSON.stringify(highscoreListe)
              );
              if (typeof aktualisiereHighscoreAnzeige === "function")
                aktualisiereHighscoreAnzeige();
              this.verbleibendeZuege = [];
              this.phase = "beendet";
              switchPage("spielende");
            } else if (ausgespielteSteineSchwarz === 15) {
              const sieger = this.spieler2.spielerName || "Spieler Schwarz";
              i18nAlert2("alerts.winnergame2_message", {
                defaultValue: `\u{1F3C6} Herzlichen Gl\xFCckwunsch! {{sieger}}  SCHWARZ hat das Spiel gewonnen!`,
                sieger
              });
              highscoreListe.push({
                name: sieger,
                farbe: "Schwarz",
                datum: (/* @__PURE__ */ new Date()).toLocaleDateString()
              });
              localStorage.setItem(
                "backgammon_highscores",
                JSON.stringify(highscoreListe)
              );
              if (typeof aktualisiereHighscoreAnzeige === "function")
                aktualisiereHighscoreAnzeige();
              this.verbleibendeZuege = [];
              this.phase = "beendet";
              switchPage("spielende");
            }
            this.pruefeSpielerWechsel();
          } else {
            i18nAlert2("alerts.wrongvalueout_message", { vonId, benoetigteAugen });
          }
        });
      });
    }
    aufhebenSelektion(aktuellesSpiel) {
      document.querySelectorAll(".checker.selected").forEach((stein) => {
        stein.classList.remove("selected");
      });
      if (aktuellesSpiel) {
        aktuellesSpiel.ausgewaehlteZacke = null;
      }
    }
    darfAusspielen(spielerFarbe, spiel2) {
      if (spielerFarbe === "Wei\xDF" && this.SpielfeldKomponenten.barWei\u00DF.anzahlSteine > 0)
        return false;
      if (spielerFarbe === "Schwarz" && this.SpielfeldKomponenten.barSchwarz.anzahlSteine > 0)
        return false;
      const allePoints = document.querySelectorAll(".point");
      let steineAuserhalb = 0;
      allePoints.forEach((zacke) => {
        const punktId = parseInt(zacke.getAttribute("data-point"));
        const steineDesSpielers = zacke.querySelectorAll(
          `.checker.${spielerFarbe}`
        ).length;
        if (spielerFarbe === "Wei\xDF") {
          if (punktId <= 18) steineAuserhalb += steineDesSpielers;
        } else {
          if (punktId >= 7) steineAuserhalb += steineDesSpielers;
        }
      });
      return steineAuserhalb === 0;
    }
    pruefeSpielerWechsel() {
      if (this.verbleibendeZuege.length === 0) {
        const name1 = this.spieler1.spielerName;
        const name2 = this.spieler2.spielerName;
        if (this.aktiverSpielerFarbe === "Wei\xDF") {
          this.aktiverSpielerFarbe = "Schwarz";
        } else {
          this.aktiverSpielerFarbe = "Wei\xDF";
        }
        const aktuellerName = this.aktiverSpielerFarbe === "Wei\xDF" ? name1 : name2;
        const aktiveSprache = window.i18n && window.i18n.aktuelleSprache || "de";
        const uebersetzteFarbe = farbuebersetzungen[this.aktiverSpielerFarbe]?.[aktiveSprache] ?? this.aktiverSpielerFarbe;
        const farbZusatz = ` (${uebersetzteFarbe})`;
        if (!this.anzeigeSpieler) {
          this.anzeigeSpieler = document.getElementById("aktueller-spieler");
        }
        if (this.anzeigeSpieler) {
          this.anzeigeSpieler.textContent = aktuellerName + farbZusatz;
        } else {
          const hauptAnzeige = document.getElementById("spieler-anzeige");
          if (hauptAnzeige) {
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
        i18nAlert2("alerts.changeplayer_message", {
          defaultValue: "Spielerwechsel! {{playerName}} ist am Zug.",
          playerName: aktuellerName + farbZusatz
        });
      }
    }
  };
  var highscoreListe = JSON.parse(localStorage.getItem("backgammon_highscores")) || [];
  function aktualisiereHighscoreAnzeige() {
    const listenElement = document.getElementById("highscore-liste");
    if (!listenElement) return;
    listenElement.innerHTML = "";
    const liste = window.highscoreListe || JSON.parse(localStorage.getItem("backgammon_highscores")) || [];
    const aktiveSprache = window.i18n && window.i18n.aktuelleSprache || "de";
    liste.forEach((eintrag) => {
      const li = document.createElement("li");
      const aktiveSprache2 = window.i18n && window.i18n.aktuelleSprache || "de";
      const uebersetzteFarbe = farbuebersetzungen[eintrag.farbe]?.[aktiveSprache2] ?? eintrag.farbe;
      li.innerHTML = `
            <strong style="color: #333;">${eintrag.name}</strong> 
            <span style="font-size: 0.85em; color: #666;">
                (${uebersetzteFarbe}) - ${eintrag.datum}
            </span>
        `;
      listenElement.appendChild(li);
    });
  }
  function initialisiereSpielendeKnoepfe() {
    const btnRestart = document.getElementById("btn-restart-same");
    const btnAgain = document.getElementById("btn-restart-new");
    if (btnRestart) {
      btnRestart.addEventListener("click", () => {
        switchPage("backgammon");
      });
    }
    if (btnAgain) {
      btnAgain.addEventListener("click", () => {
        switchPage("spielstart");
      });
    }
    const btnToggleHighscore = document.getElementById("btn-toggle-highscore");
    if (btnToggleHighscore) {
      btnToggleHighscore.addEventListener("click", () => {
        const container = document.querySelector(".highscore-container");
        if (container) {
          if (container.style.display === "none" || container.style.display === "") {
            container.style.display = "block";
          } else {
            container.style.display = "none";
          }
        }
      });
    }
  }

  // script35.js
  var backgammonWurdeBereitsGeladen = false;
  var i18n = new i18nmanager("lang/");
  i18n.init();
  function switchPage(zielId) {
    if (!zielId) return;
    const gesauberteId = zielId.replace("#", "").trim().toLowerCase();
    console.log("Navigiere zu ID:", gesauberteId);
    document.querySelectorAll("main > .seite").forEach((seite) => {
      seite.classList.remove("aktiv");
      seite.style.display = "none";
    });
    const footer = document.querySelector(".main-footer");
    if (footer) {
      footer.style.display = gesauberteId === "spielstart" || gesauberteId === "spielende" || gesauberteId === "backgammon" ? "none" : "block";
    }
    if (gesauberteId === "spielstart" || gesauberteId === "spielende" || gesauberteId === "backgammon") {
      const spielContainer = document.getElementById("backgammon");
      if (spielContainer) {
        spielContainer.classList.add("aktiv");
        spielContainer.style.display = "block";
        const spielstartPhase = document.getElementById("spielstart");
        const spielbrettPhase = document.getElementById("spielbrett");
        const spielendePhase = document.getElementById("spielende");
        if (spielstartPhase) spielstartPhase.classList.remove("aktiv");
        if (spielbrettPhase) spielbrettPhase.classList.remove("aktiv");
        if (spielendePhase) spielendePhase.classList.remove("aktiv");
        if (gesauberteId === "backgammon") {
          if (spielbrettPhase) spielbrettPhase.classList.add("aktiv");
        } else if (gesauberteId === "spielstart") {
          if (spielstartPhase) spielstartPhase.classList.add("aktiv");
        } else if (gesauberteId === "spielende") {
          if (spielendePhase) spielendePhase.classList.add("aktiv");
        }
      }
      return;
    }
    const zielSeite = document.getElementById(gesauberteId) || document.querySelector(`[id="${gesauberteId}" i]`);
    if (zielSeite) {
      const spielContainer = document.getElementById("backgammon");
      if (spielContainer) {
        spielContainer.classList.remove("aktiv");
        spielContainer.style.display = "none";
      }
      zielSeite.classList.add("aktiv");
      zielSeite.style.display = "flex";
    } else {
      console.warn("Seite nicht im DOM gefunden:", gesauberteId);
    }
  }
  function ladeBackgammonUeberFetch(vollstaendigesZiel) {
    const [dateipfad, anker] = vollstaendigesZiel.split("#");
    const zielAnker = anker ? anker.toLowerCase() : "spielstart";
    if (backgammonWurdeBereitsGeladen) {
      switchPage(zielAnker);
      return;
    }
    fetch(dateipfad).then((response) => {
      if (!response.ok) throw new Error("HTML-Datei nicht gefunden");
      return response.text();
    }).then((html) => {
      const spielContainer = document.getElementById("backgammon");
      if (spielContainer) {
        spielContainer.innerHTML = html;
        backgammonWurdeBereitsGeladen = true;
        console.log("Backgammon-html erfolgreich isoliert geladen!");
        if (i18n && typeof i18n.init === "function") {
          i18n.init();
        }
        initialisiereSpielstartKnoepfe();
        initialisiereSpielendeKnoepfe();
        spielContainer.querySelectorAll("#spielstart, #spielbrett, #spielende").forEach((phase) => {
          phase.style.display = "none";
        });
        if (typeof aktualisiereHighscoreAnzeige === "function") {
          aktualisiereHighscoreAnzeige();
        }
        switchPage(zielAnker);
      }
    }).catch((error) => {
      console.error("Fehler beim Ajax-Laden von Backgammon:", error);
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("header a, nav a, footer a, .menue-link").forEach((link) => {
      link.addEventListener("click", (event) => {
        const hrefZiel = link.getAttribute("href");
        const dataZiel = link.getAttribute("data-page");
        const ziel = hrefZiel || dataZiel;
        if (!ziel || ziel === "#") return;
        event.preventDefault();
        if (ziel.includes("backgammon/backgammonhtml.html")) {
          ladeBackgammonUeberFetch(ziel);
        } else {
          switchPage(ziel);
        }
        const uebergeordnetesMenue = link.closest(".mein-menue");
        if (uebergeordnetesMenue) {
          umschalten(uebergeordnetesMenue.id);
        }
      });
    });
    const selectMenue = document.querySelector("#listboxmain select");
    if (selectMenue) {
      selectMenue.addEventListener("change", (event) => {
        const zielId = event.target.value;
        if (!zielId) return;
        if (zielId.includes("backgammonhtml.html")) {
          ladeBackgammonUeberFetch(zielId);
        } else {
          switchPage(zielId);
        }
      });
    }
    document.querySelectorAll("[data-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");
        umschalten(targetId);
      });
    });
    const menuButtonMain = document.getElementById("menuButtonMain");
    if (menuButtonMain) {
      menuButtonMain.addEventListener("click", () => umschalten("listboxmain"));
    }
    const zweiButton = document.getElementById("zweibutton");
    const gradeSelect = document.getElementById("grade");
    if (zweiButton && gradeSelect) {
      zweiButton.addEventListener("click", () => {
        gradeSelect.classList.toggle("anzeigen");
      });
      gradeSelect.addEventListener("change", async (e) => {
        const text = document.getElementById("eingabename").value;
        const note = e.target.value;
        if (!text || !note) return;
        const msgBuffer = new TextEncoder().encode(text + note);
        const hashBuffer = await crypto.subtle.digest("SHA-512", msgBuffer);
        const hashHex = Array.from(new Uint8Array(hashBuffer).slice(0, 32)).map((b) => b.toString(16).padStart(2, "0")).join("");
        localStorage.setItem("savedHash", hashHex);
        console.log("Hash gespeichert", hashHex);
      });
    }
    const kontaktForm = document.getElementById("meinKontaktFormular");
    if (kontaktForm) {
      kontaktForm.addEventListener("submit", speichereDatenAlsDatei);
    }
    const vorleseBtn = document.getElementById("btn-vorlesen");
    if (vorleseBtn) {
      vorleseBtn.addEventListener("click", ganzeSeiteVorlesen);
    }
    document.querySelectorAll(".btn-font").forEach((button) => {
      button.addEventListener("click", () => changeFontSize(button.dataset.size));
    });
    document.addEventListener("DOMContentLoaded", () => {
      i18n.init();
    });
  });
  function umschalten(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.style.display = element.style.display === "none" || element.style.display === "" ? "block" : "none";
  }
  function changeFontSize(action) {
    const root = document.documentElement;
    let currentSize = parseFloat(window.getComputedStyle(root).fontSize);
    root.style.fontSize = (action === "increase" ? currentSize + 2 : currentSize - 2) + "px";
  }
  function ganzeSeiteVorlesen() {
    window.speechSynthesis.cancel();
    const text = document.body.innerText;
    const sprachAusgabe = new SpeechSynthesisUtterance(text);
    sprachAusgabe.lang = "de-DE";
    window.speechSynthesis.getVoices();
    window.speechSynthesis.speak(sprachAusgabe);
  }
  function speichereDatenAlsDatei(event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const nachricht = document.getElementById("kontaktarea").value;
    const datum = (/* @__PURE__ */ new Date()).toLocaleString();
    const dateiInhalt = `KONTAKTFORMULAR AUSWERTUNG
===========================

    Datum: ${datum}
Name: 
    ${name}
E-Mail: 
    ${email}
Nachricht:
${nachricht}`;
    const blob = new Blob([dateiInhalt], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `nachricht_${name.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    event.target.reset();
  }
  window.i18n = i18n;
  var dropdownBtn = document.getElementById("current-lang-btn");
  var langList = document.getElementById("lang-list");
  if (dropdownBtn && langList) {
    dropdownBtn.addEventListener("click", () => {
      const isExpanded = dropdownBtn.getAttribute("aria-expanded") === "true";
      dropdownBtn.setAttribute("aria-expanded", !isExpanded);
      langList.classList.toggle("show");
    });
    langList.querySelectorAll("li").forEach((item) => {
      item.addEventListener("click", () => {
        const selectedLang = item.getAttribute("data-lang");
        console.log("Wechsle globale Sprache zu:", selectedLang);
        if (i18n && typeof i18n.ladeSprache === "function") {
          i18n.ladeSprache(selectedLang);
          dropdownBtn.textContent = selectedLang;
        }
        if (i18n && typeof i18n.init === "function") {
          i18n.init();
        }
        const spielContainer = document.getElementById("backgammon");
        if (spielContainer && window.i18n) {
          if (typeof window.i18n.init === "function") {
            window.i18n.init();
          }
        }
        if (window.i18n && typeof window.i18n.aktualisiereSpezialElemente === "function") {
          window.i18n.aktualisiereSpezialElemente();
        }
        langList.classList.remove("show");
        dropdownBtn.setAttribute("aria-expanded", "false");
      });
    });
  }
})();
