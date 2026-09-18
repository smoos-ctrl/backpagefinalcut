// ==========================================
// 1. STATISCHE IMPORTE
// ==========================================
import {
  SpielLogik,
  aktualisiereHighscoreAnzeige,
  initialisiereSpielstartKnoepfe,
  initialisiereSpielendeKnoepfe,
} from "./backgammon/backgammonjs.js";
import { i18nmanager } from "./i18nmanager.js";
// ==========================================
// 2. GLOBALE VARIABLEN & INT-LOGIK
// ==========================================
let backgammonWurdeBereitsGeladen = false;
//let uebersetzungen = {};
//export let aktuelleSprache = "de";
const i18n = new i18nmanager("lang/");
i18n.init();
// HIER DEKLARIEREN: Damit ist die Variable in der gesamten Datei bekannt!
let spiel = null;
let spieler1 = null; // Falls noch nicht geschehen
let spieler2 = null; // Falls noch nicht geschehen
// ==========================================
// 3. SEITEN-UMSCHALT-ZENTRALE
// ==========================================
export function switchPage(zielId) {
  if (!zielId) return;

  // Raute entfernen und bereinigen
  const gesauberteId = zielId.replace("#", "").trim().toLowerCase();
  console.log("Navigiere zu ID:", gesauberteId);

  // Alle Standard-Seiten der Hauptdatei unsichtbar machen
  document.querySelectorAll("main > .seite").forEach((seite) => {
    seite.classList.remove("aktiv");
    seite.style.display = "none"; // Setzt eventuelle Inline-Blockaden zurück
  });
  const footer = document.querySelector(".main-footer");
  if (footer) {
    footer.style.display =
      gesauberteId === "spielstart" ||
      gesauberteId === "spielende" ||
      gesauberteId === "backgammon"
        ? "none"
        : "block";
  }
  // Sonderlogik für Backgammon-Phasen (Spielstart / Spielende)
  if (
    gesauberteId === "spielstart" ||
    gesauberteId === "spielende" ||
    gesauberteId === "backgammon"
  ) {
    const spielContainer = document.getElementById("backgammon");
    if (spielContainer) {
      spielContainer.classList.add("aktiv");
      spielContainer.style.display = "block"; // Wichtig: Block statt Flex!

      // Alle inneren Bereiche des Spiels radikal verstecken
      const spielstartPhase = document.getElementById("spielstart");
      const spielbrettPhase = document.getElementById("spielbrett");
      const spielendePhase = document.getElementById("spielende");

      if (spielstartPhase) spielstartPhase.classList.remove("aktiv");
      if (spielbrettPhase) spielbrettPhase.classList.remove("aktiv");
      if (spielendePhase) spielendePhase.classList.remove("aktiv");

      // Jetzt NUR die exakt angeforderte Phase aufblenden!
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

  // Normale Seitenaktivierung (inklusive Case-Insensitive Check für Impressum)
  const zielSeite =
    document.getElementById(gesauberteId) ||
    document.querySelector(`[id="${gesauberteId}" i]`);
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

  // Wenn das Spiel bereits geladen ist, springen wir nur zur Phase
  if (backgammonWurdeBereitsGeladen) {
    switchPage(zielAnker);
    return;
  }

  fetch(dateipfad)
    .then((response) => {
      if (!response.ok) throw new Error("HTML-Datei nicht gefunden");
      return response.text();
    })
    .then((html) => {
      const spielContainer = document.getElementById("backgammon");
      if (spielContainer) {
        // Wir spritzen das Spiel in den EIGENEN Container, NICHT in home!
        spielContainer.innerHTML = html;
        backgammonWurdeBereitsGeladen = true;
        console.log("Backgammon-html erfolgreich isoliert geladen!");

        if (i18n && typeof i18n.init === "function") {
          i18n.init();
        }
        initialisiereSpielstartKnoepfe();
        initialisiereSpielendeKnoepfe();

        // Alle Phasen vorab initial unsichtbar machen
        spielContainer
          .querySelectorAll("#spielstart, #spielbrett, #spielende")
          .forEach((phase) => {
            phase.style.display = "none";
          });

        // Initialisieren
        if (typeof aktualisiereHighscoreAnzeige === "function") {
          aktualisiereHighscoreAnzeige();
        }

        // Schalte die gewählte Phase sichtbar
        switchPage(zielAnker);
      }
    })
    .catch((error) => {
      console.error("Fehler beim Ajax-Laden von Backgammon:", error);
    });
}

// ==========================================
// 4. DOM-READY INITIALISIERUNG
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // A) Klick-Manager für ALLE Links (Header, Nav, Footer & data-page Attribute)
  document
    .querySelectorAll("header a, nav a, footer a, .menue-link")
    .forEach((link) => {
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

        // Automatisches Schließen von Menüs
        const uebergeordnetesMenue = link.closest(".mein-menue");
        if (uebergeordnetesMenue) {
          umschalten(uebergeordnetesMenue.id);
        }
      });
    });

  // B) Dropdown-Auswahl für Mobilgeräte
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

  // C) Togglen von Listen über [data-target]
  document.querySelectorAll("[data-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");
      umschalten(targetId);
    });
  });

  // D) Hamburger-Menü Button Hauptseite
  const menuButtonMain = document.getElementById("menuButtonMain");
  if (menuButtonMain) {
    menuButtonMain.addEventListener("click", () => umschalten("listboxmain"));
  }

  // E) Grade-Select Logik (Klammern korrigiert) (Buttonfield)
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
      const hashHex = Array.from(new Uint8Array(hashBuffer).slice(0, 32))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      localStorage.setItem("savedHash", hashHex);
      console.log("Hash gespeichert", hashHex);
    });
  }

  // F) Kontaktformular Event-Verknüpfung
  const kontaktForm = document.getElementById("meinKontaktFormular");
  if (kontaktForm) {
    kontaktForm.addEventListener("submit", speichereDatenAlsDatei);
  }

  // G) Vorlese-Button
  const vorleseBtn = document.getElementById("btn-vorlesen");
  if (vorleseBtn) {
    vorleseBtn.addEventListener("click", ganzeSeiteVorlesen);
  }

  // H) Schriftgrößen-Buttons
  document.querySelectorAll(".btn-font").forEach((button) => {
    button.addEventListener("click", () => changeFontSize(button.dataset.size));
  });
  document.addEventListener("DOMContentLoaded", () => {
    i18n.init();
  });
});

// ==========================================
// 5. EXPORTIERTE HILFSFUNKTIONEN
// ==========================================
export function umschalten(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.style.display =
    element.style.display === "none" || element.style.display === ""
      ? "block"
      : "none";
}

export function changeFontSize(action) {
  const root = document.documentElement;
  let currentSize = parseFloat(window.getComputedStyle(root).fontSize);
  root.style.fontSize =
    (action === "increase" ? currentSize + 2 : currentSize - 2) + "px";
}

export function ganzeSeiteVorlesen() {
  window.speechSynthesis.cancel();
  const text = document.body.innerText;
  const sprachAusgabe = new SpeechSynthesisUtterance(text);
  sprachAusgabe.lang = "de-DE";
  window.speechSynthesis.getVoices();
  window.speechSynthesis.speak(sprachAusgabe);
}

export function speichereDatenAlsDatei(event) {
  event.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const nachricht = document.getElementById("kontaktarea").value;
  const datum = new Date().toLocaleString();
  const dateiInhalt = `KONTAKTFORMULAR AUSWERTUNG\n===========================\n
    Datum: ${datum}\nName: 
    ${name}\nE-Mail: 
    ${email}\nNachricht:\n${nachricht}`;
  const blob = new Blob([dateiInhalt], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `nachricht_${name.replace(/\s+/g, "_")}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  event.target.reset();
}

// Macht die Instanz überall auf der Seite im JavaScript lesbar
window.i18n = i18n;

// =================================================================
// GLOBALER SPRACHWECHSLER-MANAGER (Nutzt die window.i18n Instanz!)
// =================================================================
const dropdownBtn = document.getElementById("current-lang-btn");
const langList = document.getElementById("lang-list");

if (dropdownBtn && langList) {
  // Menü öffnen/schließen (Umschalten der CSS-Klasse .show)
  dropdownBtn.addEventListener("click", () => {
    const isExpanded = dropdownBtn.getAttribute("aria-expanded") === "true";
    dropdownBtn.setAttribute("aria-expanded", !isExpanded);
    langList.classList.toggle("show");
  });

  // Klick auf die Sprachen in der Liste (de, en, fr, es)
  langList.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", () => {
      const selectedLang = item.getAttribute("data-lang");
      console.log("Wechsle globale Sprache zu:", selectedLang);
      // Nutze direkt die lokale Instanz 'i18n', die oben deklariert ist!
      if (i18n && typeof i18n.ladeSprache === "function") {
        i18n.ladeSprache(selectedLang);
        dropdownBtn.textContent = selectedLang;
      }

      // 2. KORREKTUR: Frisch-Scan für die gesamte Seite (inklusive nachgeladenem Backgammon!)
      if (i18n && typeof i18n.init === "function") {
        i18n.init(); // Übersetzt die Hauptseite UND das Spiel im selben Atemzug!
      }

      // BACKGAMMON: Dem Sprachmanager sagen, er soll das nachgeladene HTML JETZT frisch übersetzen!
      const spielContainer = document.getElementById("backgammon");
      if (spielContainer && window.i18n) {
        // Wir rufen die Übersetzungs-Schleife (init oder translate) direkt auf dem Spiel-Container auf
        if (typeof window.i18n.init === "function") {
          window.i18n.init(); // Scannt die gesamte Seite inklusive Backgammon neu!
        }
      }
      // Aktualisiert das Noten-Dropdown im Buttonfield, falls vorhanden
      if (
        window.i18n &&
        typeof window.i18n.aktualisiereSpezialElemente === "function"
      ) {
        window.i18n.aktualisiereSpezialElemente();
      }

      // Schließt das Dropdown-Menü wieder sauber
      langList.classList.remove("show");
      dropdownBtn.setAttribute("aria-expanded", "false");
    });
  });
}
