import { i18nmanager } from "../i18nmanager.js";

function i18nAlert(key, data = {}) {
  window.i18n.i18nAlert(key, data);
}
export class SpielFeld {
  constructor(spielFeldId) {
    this.spielFeldId = spielFeldId ?? "backgammon-board";
    this.sizeX = "12fr";
    this.sizeY = "500px";
    this.felder = [];
    this.ausgewaehlteZacke = null;
    // 2. Das Spielfeld generieren
    this.createPoints();
  }
  NumSteine() {}

  createPoints() {
    const topRowContainer = document.querySelector(".top-row");
    const bottomRowContainer = document.querySelector(".bottom-row");

    // Sicherheits-Check, falls das HTML noch braucht:
    if (!topRowContainer || !bottomRowContainer) {
      console.warn(
        "Spielfeld-Container (.top-row oder .bottom-row) noch nicht im DOM gefunden! Versuche es gleich erneut...",
      );
      topRowContainer.innerHTML = "";
      bottomRowContainer.innerHTML = "";
      this.felder = []; // Array zurücksetzen
      // Kleiner Trick: Wartet 50ms, falls der Browser langsam gerendert hat
      setTimeout(() => this.createPoints(), 50);
      return;
    }
    // --- OBERE REIHE GENERIEREN (Zahlen 13 bis 24) ---
    const obereZahlen = Array.from({ length: 12 }, (_, index) => index + 13);
    obereZahlen.forEach((id, index) => {
      const currentX = index + 1;
      // 1. Neues Feld-Objekt erzeugen und Werte übergeben
      const neuesFeld = new Feld(id, currentX, 0);
      // 2. Das Feld im Spielfeld-Array abspeichern
      this.felder.push(neuesFeld);
      // 3. Das HTML-Element des Feldes erzeugen und im DOM platzieren
      const pointElement = neuesFeld.generatePointElement(id);
      topRowContainer.appendChild(pointElement);
    });
    // --- UNTERE REIHE GENERIEREN (Zahlen 12 bis 1) ---
    // Oft zählen die Zacken unten von rechts nach links zurück
    const untereZahlen = Array.from(
      { length: 12 },
      (_, index) => index + 1,
    ).reverse();
    untereZahlen.forEach((id, index) => {
      const currentX = index + 1;
      // 1. Neues Feld-Objekt erzeugen
      const neuesFeld = new Feld(id, currentX, 500);
      // 2. Im Array abspeichern
      this.felder.push(neuesFeld);
      // 3. Im DOM platzieren
      const pointElement = neuesFeld.generatePointElement(id);
      bottomRowContainer.appendChild(pointElement);
    });
  }
}
export class Feld {
  constructor(feldId, posX = 0, posY = 0) {
    this.feldId = feldId;
    this.posX = posX;
    this.posY = posY;
    this.form = "dreieck";
    console.log(
      `feldId: ${this.feldId} , posY: ${this.posY} px, posX: ${this.posX} fr`,
    );
  }

  // Hilfsmethode, die ein einzelnes Punkt-Element baut
  generatePointElement(number) {
    const pointDiv = document.createElement("div");
    pointDiv.classList.add("point");
    pointDiv.setAttribute("data-point", number);

    return pointDiv;
  }
}
export class SpezialFelder {
  constructor(spezialFeldId, FeldName, anzahlSteine = 0, posX = "", posY = "") {
    this.spezialFeldId = spezialFeldId;
    this.FeldName = FeldName;
    this.anzahlSteine = anzahlSteine;
    this.posX = posX;
    this.posY = posY;
  }
}

export const barWeiß = new SpezialFelder(26, "barWeiß", 0, "mitte", "unten");
export const barSchwarz = new SpezialFelder(
  27,
  "barschwarz",
  0,
  "mitte",
  "oben",
);
export const ausstiegSchwarz = new SpezialFelder(
  0,
  "ausstiegSchwarz",
  0,
  "rechts",
  "unten",
);
export const ausstiegWeiß = new SpezialFelder(
  25,
  "ausstiegWeiß",
  0,
  "rechts",
  "oben",
);

// --- BACKGAMMON SPIELSTEINE-STARTAUFSTELLUNG INITIALISIEREN ---
const startAufstellung = {
  1: { spieler: "Weiß", anzahl: 2 },
  6: { spieler: "Schwarz", anzahl: 5 },
  8: { spieler: "Schwarz", anzahl: 3 },
  12: { spieler: "Weiß", anzahl: 5 },
  13: { spieler: "Schwarz", anzahl: 5 },
  17: { spieler: "Weiß", anzahl: 3 },
  19: { spieler: "Weiß", anzahl: 5 },
  24: { spieler: "Schwarz", anzahl: 2 },
};

export class Steine {
  constructor(farbe, position, spiel) {
    this.farbe = farbe;
    this.position = [];
    this.spiel = spiel;
    this.anzahl = 30;
    this.form = "rund";
  }
  platziereStartSteine() {
    console.log("Platziere die Startaufstellung der Steine...");

    // 1. KORREKTUR: Zuerst alle alten Steine von JEDER Zacke runterwerfen!
    document.querySelectorAll(".point").forEach((zacke) => {
      zacke.innerHTML = "";
    });
    for (const zackeId in startAufstellung) {
      const zackeInfo = startAufstellung[zackeId];
      const zackeElement = document.querySelector(
        `.point[data-point="${zackeId}"]`,
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
      const gegnerFarbe =
        this.spiel.aktiverSpielerFarbe === "Weiß" ? "Schwarz" : "Weiß";
      const gegnerSteine = zielZacke.querySelectorAll(
        `.checker.${gegnerFarbe}`,
      );
      const gegnerSteineAnzahl = gegnerSteine.length;

      if (gegnerSteineAnzahl >= 2) {
        i18nAlert("alerts.blockedpoint_message", {
          defaultValue: "Dieser Point ist vom Gegner blockiert!",
        });
        this.spiel.aufhebenSelektion(this.spiel);
        return;
      }
      // 1. ZUERST den eigenen Stein im DOM bewegen!
      bewegeSteinDOMFunktion();
      this.spiel.verbleibendeZuege.splice(wuerfelIndex, 1);
      this.spiel.aufhebenSelektion(this.spiel);

      // 2. JETZT VERZÖGERT PRÜFEN (Schlagen & Spielerwechsel nach der Animation)
      setTimeout(() => {
        // SCHLAGEN: 1 gegnerischer Stein wandert auf die Bar
        if (gegnerSteineAnzahl === 1) {
          const geschlagenerStein = zielZacke.querySelector(
            `.checker.${gegnerFarbe}`,
          );
          if (geschlagenerStein) {
             //Ermittle die aktuell aktive Sprache (Standard: "de")
            const aktiveSprache = (window.i18n && window.i18n.aktuelleSprache) || "de";
            // Lokales Fallback-Objekt, falls die Variable aus der anderen Datei nicht sichtbar ist
            const lokaleFarben = {
              Weiß: { de: "Weiß", en: "White", fr: "Blanc", es: "Blanco/a" },
              Schwarz: { de: "Schwarz", en: "Black", fr: "Noir", es: "Negro/a" }
            };
            //Holt die Farbe ("White", "Blanc", "Blanco/a") passend zur Sprache
            const uebersetzteGegnerFarbe = lokaleFarben[gegnerFarbe] 
              ? (lokaleFarben[gegnerFarbe][aktiveSprache] || gegnerFarbe)
              : gegnerFarbe;
            // i18n-alert für das Schlagen abfeuern
            i18nAlert("alerts.kickedatbar_message", {
              farbe: uebersetzteGegnerFarbe,
              defaultValue: `💥 Gekickt! Der {{farbe}}e Stein wurde auf die Bar geschlagen!`,
            });

            // Stein von der Zacke lösen und in die richtige Bar-Zone verschieben
            const barZoneId =
              gegnerFarbe === "Weiß" ? "Bar-Weiß-Zone" : "Bar-Schwarz-Zone";
            const barZone = document.getElementById(barZoneId);
            if (barZone) {
              geschlagenerStein.classList.remove("selected");
              barZone.appendChild(geschlagenerStein); // Physisch verschieben!
            }

            // Counter im Hintergrund erhöhen
            if (gegnerFarbe === "Weiß") barWeiß.anzahlSteine++;
            else barSchwarz.anzahlSteine++;
          }
        }

        // WICHTIG: Der Spielerwechsel muss IN das Timeout,
        // damit er wartet, bis das Schlagen physisch beendet ist!
        this.spiel.pruefeSpielerWechsel();
      }, 250); // 250 Millisekunden warten (entspricht der CSS-Animation + Puffer)
    } else {
      i18nAlert("alerts.wrongvalueingame_message", {
        defaultValue: `Ungültiger Zug! Keine passende Würfelzahl für ${distanz} Felder.`,
      });
      this.spiel.aufhebenSelektion(this.spiel);
    }
  }
  fuehreZugAus(distanz, zielZacke, bewegeSteinDOMFunktion) {
    // 'this.farbe' ist ja entweder 'schwarz' oder 'weiß' dank der Vererbung!
    if (
      this.farbe.toLowerCase() !== this.spiel.aktiverSpielerFarbe.toLowerCase()
    ) {
      console.log("Du bist gar nicht dran!");
      return; // Zug wird abgebrochen
    }
    this.steinBewegen(distanz, zielZacke, bewegeSteinDOMFunktion);
  }
}
export class SteineWeiß extends Steine {
  constructor(steinId, startPos, feldId, spiel) {
    super("weiß", startPos, spiel);

    this.steinId = steinId;
    this.feldId = feldId;
    this.anzahlmax = 15;
  }
}
export class SteineSchwarz extends Steine {
  constructor(steinId, startPos, feldId, spiel) {
    super("schwarz", startPos, spiel);

    this.steinId = steinId;
    this.feldId = feldId;
    this.anzahlmax = 15;
  }
}
