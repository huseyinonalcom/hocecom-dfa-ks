export const countryNameToAbbreviation = (name: string) => {
  const abbreviaton = countries.find((country) => country.names.find((countryName) => countryName.toLowerCase() == name.toLowerCase()))?.alpha2;
  return abbreviaton ?? name;
};

export const countries = [
  {
    id: 40,
    name: "Austria",
    names: ["Autriche", "Österreich", "Austria", "Áustria", "Oostenrijk", "Avusturya"],
    alpha2: "at",
    alpha3: "aut",
  },
  {
    id: 56,
    name: "Belgium",
    names: ["Belgique", "Belgien", "Belgie", "Belgio", "Bélgica", "België", "Belgia", "Belçika", "Belgium"],
    alpha2: "be",
    alpha3: "bel",
  },
  {
    id: 100,
    name: "Bulgaria",
    names: ["Bulgarie", "Bulgarien", "Bulgária", "Bulgarije", "Bułgaria", "Bulgaristan", "Bulgaria"],
    alpha2: "bg",
    alpha3: "bgr",
  },
  {
    id: 191,
    name: "Croatia",
    names: ["Croatie", "Kroatien", "Croacia", "Croazia", "Croácia", "Kroatië", "Chorwacja", "Hırvatistan", "Croatia"],
    alpha2: "hr",
    alpha3: "hrv",
  },
  {
    id: 203,
    name: "Czechia",
    names: ["Tchéquie", "Tschechien", "República Checa", "Rep. Ceca", "Chéquia", "Tsjechië", "Czechy", "Çekya", "Czechia"],
    alpha2: "cz",
    alpha3: "cze",
  },
  {
    id: 208,
    name: "Denmark",
    names: ["Danemark", "Dänemark", "Dinamarca", "Danimarca", "Denemarken", "Dania", "Danimarka", "Denmark"],
    alpha2: "dk",
    alpha3: "dnk",
  },
  {
    id: 233,
    name: "Estonia",
    names: ["Estonie", "Estland", "Estonia", "Estónia", "Estonya"],
    alpha2: "ee",
    alpha3: "est",
  },
  {
    id: 246,
    name: "Finland",
    names: ["Finlande", "Finnland", "Finlandia", "Finlândia", "Finland", "Finlandiya"],
    alpha2: "fi",
    alpha3: "fin",
  },
  {
    id: 250,
    name: "France",
    names: ["France", "Frankreich", "Francia", "França", "Frankrijk", "Francja", "Fransa"],
    alpha2: "fr",
    alpha3: "fra",
  },
  {
    id: 276,
    name: "Germany",
    names: ["Allemagne", "Deutschland", "Alemania", "Germania", "Alemanha", "Duitsland", "Niemcy", "Almanya", "Germany"],
    alpha2: "de",
    alpha3: "deu",
  },
  {
    id: 300,
    name: "Greece",
    names: ["Grèce", "Griechenland", "Grecia", "Grécia", "Griekenland", "Grecja", "Yunanistan", "Greece"],
    alpha2: "gr",
    alpha3: "grc",
  },
  {
    id: 348,
    name: "Hungary",
    names: ["Hongrie", "Ungarn", "Hungría", "Ungheria", "Hungria", "Hongarije", "Węgry", "Macaristan", "Hungary"],
    alpha2: "hu",
    alpha3: "hun",
  },
  {
    id: 372,
    name: "Ireland",
    names: ["Irlande", "Irland", "Irlanda", "Ierland", "Irlandia", "İrlanda", "Ireland"],
    alpha2: "ie",
    alpha3: "irl",
  },
  {
    id: 380,
    name: "Italy",
    names: ["Italie", "Italien", "Italia", "Itália", "Italië", "Włochy", "İtalya", "Italy"],
    alpha2: "it",
    alpha3: "ita",
  },
  {
    id: 428,
    name: "Latvia",
    names: ["Lettonie", "Lettland", "Letonia", "Lettonia", "Letônia", "Letland", "Łotwa", "Letonya", "Latvia"],
    alpha2: "lv",
    alpha3: "lva",
  },
  {
    id: 440,
    name: "Lithuania",
    names: ["Lituanie", "Litauen", "Lituania", "Lituânia", "Litouwen", "Litwa", "Litvanya", "Lithuania"],
    alpha2: "lt",
    alpha3: "ltu",
  },
  {
    id: 442,
    name: "Luxembourg",
    names: ["Luxembourg", "Luxemburg", "Luxemburgo", "Lussemburgo", "Luksemburg", "Lüksemburg"],
    alpha2: "lu",
    alpha3: "lux",
  },
  {
    id: 470,
    name: "Malta",
    names: ["Malte", "Malta"],
    alpha2: "mt",
    alpha3: "mlt",
  },
  {
    id: 528,
    name: "Netherlands",
    names: ["Pays-Bas", "Niederlande", "Países Bajos", "Paesi Bassi", "Países Baixos", "Nederland", "Holandia", "Hollanda", "Netherlands"],
    alpha2: "nl",
    alpha3: "nld",
  },
  {
    id: 616,
    name: "Poland",
    names: ["Pologne", "Polen", "Polonia", "Polónia", "Polska", "Polonya", "Poland"],
    alpha2: "pl",
    alpha3: "pol",
  },
  {
    id: 620,
    name: "Portugal",
    names: ["Portugal", "Portogallo", "Portugalia", "Portekiz"],
    alpha2: "pt",
    alpha3: "prt",
  },
  {
    id: 642,
    name: "Romania",
    names: ["Roumanie", "Rumänien", "Rumania", "Romania", "Roménia", "Roemenië", "Rumunia", "Romanya"],
    alpha2: "ro",
    alpha3: "rou",
  },
  {
    id: 703,
    name: "Slovakia",
    names: ["Slovaquie", "Slowakei", "Eslovaquia", "Slovacchia", "Eslováquia", "Slowakije", "Słowacja", "Slovakya", "Slovakia"],
    alpha2: "sk",
    alpha3: "svk",
  },
  {
    id: 705,
    name: "Slovenia",
    names: ["Slovénie", "Slowenien", "Eslovenia", "Slovenia", "Eslovênia", "Slovenië", "Słowenia", "Slovenya"],
    alpha2: "si",
    alpha3: "svn",
  },
  {
    id: 724,
    name: "Spain",
    names: ["Espagne", "Spanien", "España", "Spagna", "Espanha", "Spanje", "Hiszpania", "İspanya", "Spain"],
    alpha2: "es",
    alpha3: "esp",
  },
  {
    id: 752,
    name: "Sweden",
    names: ["Suède", "Schweden", "Suecia", "Svezia", "Suécia", "Zweden", "Szwecja", "İsveç", "Sweden"],
    alpha2: "se",
    alpha3: "swe",
  },
  {
    id: 756,
    name: "Switzerland",
    names: ["Suisse", "Schweiz", "Suiza", "Svizzera", "Suíça", "Zwitserland", "Szwajcaria", "İsviçre", "Switzerland"],
    alpha2: "ch",
    alpha3: "che",
  },
  {
    id: 826,
    name: "United Kingdom of Great Britain and Northern Ireland",
    names: [
      "Royaume-Uni",
      "Vereinigtes Königreich",
      "Reino Unido",
      "Regno Unito",
      "Verenigd Koninkrijk",
      "Wielka Brytania",
      "Birleşik Krallık",
      "United Kingdom of Great Britain and Northern Ireland",
    ],
    alpha2: "gb",
    alpha3: "gbr",
  },
];
