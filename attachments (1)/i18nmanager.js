export class i18nmanager {
  /**
   * @param {string} basePath - Der Ordnerpfad zu den JSON-Dateien (Standard: 'lang/')
   */
  constructor(basePath = "lang/") {
    // Zustandvariablen (früher lose Variablen)
    this.basePath = basePath;
    this.uebersetzungen = {};
    this.aktuelleSprache = localStorage.getItem("preferredLanguage") || "de";
  }

  /**
   * Startet das System sicher, sobald das DOM bereit ist
   */
  async init() {
    if (document.readyState === "loading") {
      await new Promise((resolve) =>
        document.addEventListener("DOMContentLoaded", resolve),
      );
    }

    // Sprache laden und das Dropdown-Menü vorbereiten
    await this.ladeSprache(this.aktuelleSprache);
    this.setupSprachDropdown();
  }

  /**
   * Hilfsmethode: Löst verschachtelte JSON-Pfade (z. B. "grades.good") auf
   */
  getNestedTranslation(path) {
    if (!path) return null;
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
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
      // 1. Haupt-Übersetzungen aus 'lang/' laden
      const responseHaupt = await fetch(`lang/${sprache}.json`);
      let hauptDaten = {};
      if (responseHaupt.ok) {
        hauptDaten = await responseHaupt.json();
      } else {
        console.warn(`Haupt-Sprachdatei lang/${sprache}.json nicht gefunden.`);
      }

      // 2. Backgammon-Übersetzungen aus 'backgammon/lang/' laden
      const responseBackgammon = await fetch(`backgammon/lang/${sprache}.json`);
      let backgammonDaten = {};
      if (responseBackgammon.ok) {
        backgammonDaten = await responseBackgammon.json();
      } else {
        console.warn(
          `Backgammon-Sprachdatei backgammon/lang/${sprache}.json nicht gefunden.`,
        );
      }
      // 3. Beide Objekte zusammenführen (Zusammenhang gerettet!)
      // Der Spread-Operator (...) verschmilzt beide JSON-Strukturen fehlerfrei.
      this.uebersetzungen = {
        ...hauptDaten,
        ...backgammonDaten,
        elements: {
          ...(hauptDaten.elements || {}),
          ...(backgammonDaten.elements || {}),
        },
        alerts: {
          ...(hauptDaten.alerts || {}),
          ...(backgammonDaten.alerts || {}),
        },
      };
      // Kombiniert den flexiblen Basis-Pfad mit der gewählten Sprache
      /*  const response = await fetch(`${this.basePath}${sprache}.json`);
      if (!response.ok)
        throw new Error(`Datei ${this.basePath}${sprache}.json nicht gefunden`);

      this.uebersetzungen = await response.json();*/
      this.aktuelleSprache = sprache;

      // Führt die Übersetzung des HTML-Dokuments aus
      this.uebersetzeDOM();

      // Speichert die Spracheinstellung
      localStorage.setItem("preferredLanguage", sprache);

      // Aktualisiert den Button-Text
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

    // HIER KÖNNEN SIE SPÄTER IHRE SPEZIAL-MENÜS (WIE DAS GRADESELECT) EINREIHEN
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
        "grades.Ungenügend",
        "grades.out_of_order",
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
      if (
        aktuellerWertIndex >= 0 &&
        gradeSelect.children.length > aktuellerWertIndex
      ) {
        gradeSelect.selectedIndex = aktuellerWertIndex;
      }
      /* if (aktuellerWertIndex >= 0)
        gradeSelect.selectedIndex = aktuellerWertIndex;*/
    }
  }

  /**
   * Steuert das Öffnen/Schließen und die Klick-Events des Sprach-Dropdowns
   */
  setupSprachDropdown() {
    const dropdownBtn = document.getElementById("current-lang-btn");
    const langList = document.getElementById("lang-list");
    if (!dropdownBtn || !langList) return;

    // Klick auf den Sprachwähler-Button (Menü auf/zu)
    dropdownBtn.addEventListener("click", () => {
      const isExpanded = dropdownBtn.getAttribute("aria-expanded") === "true";
      dropdownBtn.setAttribute("aria-expanded", !isExpanded);
      langList.classList.toggle("show");
    });

    // Klick auf die einzelnen Sprachen in der Liste
    langList.querySelectorAll("li").forEach((item) => {
      item.addEventListener("click", (event) => {
        const selectedLang = event.target.getAttribute("data-lang");

        // Wichtig: Aufruf über "this", da es nun eine Klassenmethode ist
        this.ladeSprache(selectedLang);

        langList.classList.remove("show");
        dropdownBtn.setAttribute("aria-expanded", "false");
      });
    });
  }
}
