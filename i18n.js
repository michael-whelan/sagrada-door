/*
 * Page language: English, Spanish, Catalan.
 *
 * Everything the interface says lives here, keyed by locale. The door itself stays in data.js -
 * boxes, prayer texts and the English language names are the source of truth - and `names` and
 * `notes` below translate those entries by the same id, so adding a language to data.js never
 * means editing it in three places.
 *
 * The prayers are never translated: they are what is carved on the door.
 */
window.UI = {

  en: {
    title: "Door of the Lord's Prayer · Sagrada Família",
    h1: "Our Father door",
    sub: "Sagrada Família · Glory façade",
    alt: "Bronze door with the Lord's Prayer in Catalan and the daily-bread petition in 50 languages",
    search: "Search a language…",
    clear: "Clear",
    close: "Close",
    start: "Tap the door or search to find a language.",
    onDoor: "{n} highlighted on the door.",
    onSheet: "{n} highlighted. Drag the sheet up to read it.",
    missing: "{n} hasn't been located on the door yet.",
    empty: "No language found",
    jump: "Read full text ↓",
    notLocated: "Not located on the photo yet.",
    verify: "Text to check against a trusted source.",
    pending: "The full text for this language hasn't been added yet.",
    langLabel: "Page language",
    credit: "Lettering by Josep Maria Subirachs and Bruno Gallart. Highlight positions are placed by hand, and AI was used to identify the languages I couldn’t read — so expect mistakes.",
    gift: "Developed as a gift to the people of BCN by Michael",
    site: "Website"
  },

  es: {
    title: "Puerta del Padrenuestro · Sagrada Família",
    h1: "Puerta del Padrenuestro",
    sub: "Sagrada Família · Fachada de la Gloria",
    alt: "Puerta de bronce con el padrenuestro en catalán y la petición del pan de cada día en 50 idiomas",
    search: "Busca un idioma…",
    clear: "Borrar",
    close: "Cerrar",
    start: "Toca la puerta o busca para encontrar un idioma.",
    onDoor: "Mostrando {n} en la puerta.",
    onSheet: "Mostrando {n}. Arrastra el panel hacia arriba para leer el texto.",
    missing: "Todavía no hemos localizado {n} en la puerta.",
    empty: "No se encontró ningún idioma",
    jump: "Leer el texto completo ↓",
    notLocated: "Aún sin localizar en la foto.",
    verify: "Texto pendiente de contrastar con una fuente fiable.",
    pending: "El texto completo de este idioma aún no se ha añadido.",
    langLabel: "Idioma de la página",
    credit: "Rótulos de Josep Maria Subirachs y Bruno Gallart. Las posiciones de los resaltados están puestas a mano, y se usó IA para identificar los idiomas que yo no sabía leer: espera errores.",
    gift: "Hecho como regalo para la gente de BCN, por Michael",
    site: "Sitio web"
  },

  ca: {
    title: "Porta del Parenostre · Sagrada Família",
    h1: "Porta del Parenostre",
    sub: "Sagrada Família · Façana de la Glòria",
    alt: "Porta de bronze amb el parenostre en català i la petició del pa de cada dia en 50 idiomes",
    search: "Cerca un idioma…",
    clear: "Esborra",
    close: "Tanca",
    start: "Toca la porta o cerca per trobar un idioma.",
    onDoor: "Mostrant {n} a la porta.",
    onSheet: "Mostrant {n}. Arrossega el plafó cap amunt per llegir el text.",
    missing: "Encara no hem localitzat {n} a la porta.",
    empty: "No s’ha trobat cap idioma",
    jump: "Llegeix el text complet ↓",
    notLocated: "Encara no localitzat a la foto.",
    verify: "Text pendent de contrastar amb una font fiable.",
    pending: "El text complet d’aquest idioma encara no s’ha afegit.",
    langLabel: "Idioma de la pàgina",
    credit: "Lletres de Josep Maria Subirachs i Bruno Gallart. Les posicions dels realçats estan posades a mà, i es va fer servir IA per identificar els idiomes que jo no sabia llegir: espera errors.",
    gift: "Fet com a regal per a la gent de BCN, per Michael",
    site: "Lloc web"
  }
};

/* The 50 entries of data.js, by id. Capitalised as list labels, not as running prose. */
window.UI.es.names = {
  ca: "Catalán", sq: "Albanés", de: "Alemán", zgh: "Amazigh (bereber)", vi: "Vietnamita",
  ar: "Árabe", arc: "Arameo", an: "Aranés (occitano)", bg: "Búlgaro", es: "Español",
  cs: "Checo", zh: "Chino", cop: "Copto", ko: "Coreano", hr: "Croata",
  da: "Danés", sl: "Esloveno", eo: "Esperanto", et: "Estonio", fi: "Finés",
  fr: "Francés", ga: "Gaélico irlandés", gl: "Gallego", el: "Griego", gn: "Guaraní",
  he: "Hebreo", hu: "Húngaro", id: "Indonesio", en: "Inglés", is: "Islandés",
  it: "Italiano", ja: "Japonés", la: "Latín", nl: "Neerlandés", no: "Noruego",
  pl: "Polaco", pt: "Portugués", qu: "Quechua", ro: "Rumano", ru: "Ruso",
  sa: "Sánscrito", sc: "Sardo", sr: "Serbio", sw: "Suajili", sv: "Sueco",
  tl: "Tagalo", bo: "Tibetano", uk: "Ucraniano", eu: "Vasco", wo: "Wólof"
};

window.UI.ca.names = {
  ca: "Català", sq: "Albanès", de: "Alemany", zgh: "Amazic (berber)", vi: "Vietnamita",
  ar: "Àrab", arc: "Arameu", an: "Aranès (occità)", bg: "Búlgar", es: "Castellà",
  cs: "Txec", zh: "Xinès", cop: "Copte", ko: "Coreà", hr: "Croat",
  da: "Danès", sl: "Eslovè", eo: "Esperanto", et: "Estonià", fi: "Finès",
  fr: "Francès", ga: "Gaèlic irlandès", gl: "Gallec", el: "Grec", gn: "Guaraní",
  he: "Hebreu", hu: "Hongarès", id: "Indonesi", en: "Anglès", is: "Islandès",
  it: "Italià", ja: "Japonès", la: "Llatí", nl: "Neerlandès", no: "Noruec",
  pl: "Polonès", pt: "Portuguès", qu: "Quítxua", ro: "Romanès", ru: "Rus",
  sa: "Sànscrit", sc: "Sard", sr: "Serbi", sw: "Suahili", sv: "Suec",
  tl: "Tagàlog", bo: "Tibetà", uk: "Ucraïnès", eu: "Basc", wo: "Wòlof"
};

/* Only the entries that carry a `note` in data.js. */
window.UI.es.notes = {
  ca: "La gran inscripción central: toda la oración está en catalán.",
  zgh: "Escrito en alfabeto tifinagh.",
  arc: "La puerta escribe el arameo con letras hebreas; este texto es la forma siríaca (Peshitta).",
  et: "En la foto solo se podía leer el encabezamiento «Meie isa».",
  gn: "La posición es una estimación («…eme’ẽ … ko árape»).",
  id: "En la foto solo se podía leer el encabezamiento «Bapa kami».",
  is: "En la foto solo se podía leer el encabezamiento «Faðir vor».",
  qu: "La posición es una estimación (la línea «Kanaqninchis…»).",
  sr: "Todavía sin localizar en la foto (cirílico, muy parecido a las líneas rusa, búlgara y ucraniana)."
};

window.UI.ca.notes = {
  ca: "La gran inscripció central: tota l’oració és en català.",
  zgh: "Escrit en alfabet tifinag.",
  arc: "La porta escriu l’arameu amb lletres hebrees; aquest text és la forma siríaca (Peshitta).",
  et: "A la foto només es podia llegir l’encapçalament «Meie isa».",
  gn: "La posició és una estimació («…eme’ẽ … ko árape»).",
  id: "A la foto només es podia llegir l’encapçalament «Bapa kami».",
  is: "A la foto només es podia llegir l’encapçalament «Faðir vor».",
  qu: "La posició és una estimació (la línia «Kanaqninchis…»).",
  sr: "Encara no localitzat a la foto (ciríl·lic, molt semblant a les línies russa, búlgara i ucraïnesa)."
};
