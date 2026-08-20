import type { DialogueData, DialogueLine, Mission, SideQuest, Flags } from './types';

const L = (speaker: string, color: string, text: string, mood: 'fun' | 'serious' = 'fun'): DialogueLine =>
  ({ speaker, color, text, mood });

const CLOMP = '#35a7ff';
const NARR = '#8d939e';

// ═══════════════════════════════════════════════════════════════════════
//  LE 13 MISSIONI PRINCIPALI DI CLOMP
// ═══════════════════════════════════════════════════════════════════════

export const MISSIONS: Mission[] = [
  // ── M0 · PROLOGO ──
  {
    id: 'prologo', title: 'Un Risveglio a Cuorcontento', zone: 'Tutta la città', giver: 'pina', rewardLove: 3,
    steps: [
      { t: 'cutscene', key: 'intro', label: 'Benvenuto a Cuorcontento' },
      { t: 'goto', x: 0, z: 0, r: 11, label: 'Prova la Yaris: raggiungi la Fontana del Cuore' },
      { t: 'goto', x: -112, z: -76, r: 7, label: 'Torna da Nonna Pina' },
      {
        t: 'talk', npc: 'pina', label: 'Parla con Nonna Pina',
        dialogue: {
          lines: [
            L('Nonna Pina', '#ff7b54', 'Bravo! Guidi già meglio del nonno, e lui una volta ha parcheggiato dentro la fontana. Apposta c\'è la fontana.'),
            L('Clomp', CLOMP, 'Nonna, oggi sento che succederà qualcosa di grande. Me lo dicono i capelli. Vibrano.'),
            L('Nonna Pina', '#ff7b54', 'I tuoi capelli vibrano quando c\'è vento, tesoro. Ma il cuore no: quello ha sempre ragione.', 'serious'),
            L('Nonna Pina', '#ff7b54', 'Cuorcontento ha bisogno di uno come te: uno che non spacca niente e aggiusta tutto. Vai, aiuta qualcuno. E lava la Yaris, che sembra una focaccia rotolata nella ghiaia.'),
          ],
        },
      },
    ],
  },

  // ── M1 · OPERAZIONE FOCACCIA ──
  {
    id: 'focaccia', title: 'Operazione Focaccia', zone: 'Quartiere Vecchio', giver: 'pina', rewardLove: 8,
    steps: [
      {
        t: 'talk', npc: 'pina', label: 'Parla con Nonna Pina',
        dialogue: {
          lines: [
            L('Nonna Pina', '#ff7b54', 'Clomp! Missione della giornata: tre focacce calde per tre anziani del quartiere. Il signor Gelsomino, la signora Wanda e quel brontolone di Anselmo.'),
            L('Clomp', CLOMP, 'Anselmo è quello che ha denunciato il sole perché "gli entrava in casa senza permesso"?'),
            L('Nonna Pina', '#ff7b54', 'Proprio lui. Più uno è spinoso, più ha bisogno di focaccia. È scienza delle nonne.'),
          ],
        },
      },
      { t: 'goto', x: -112, z: -80, r: 6, label: 'Porta la focaccia al signor Gelsomino' },
      {
        t: 'talk', npc: 'gelsomino', label: 'Consegna al signor Gelsomino',
        dialogue: {
          lines: [
            L('Gelsomino', '#9db56b', 'Una focaccia! Finalmente qualcuno mi tratta come un re. Anche se il mio regno è un balcone di quattro metri quadri con un geranio depresso.'),
            L('Clomp', CLOMP, 'Il geranio si riprenderà. I gerani sono testardi. Come i re.'),
          ],
        },
      },
      { t: 'goto', x: -60, z: 80, r: 6, label: 'Porta la focaccia alla signora Wanda' },
      {
        t: 'talk', npc: 'wanda', label: 'Consegna alla signora Wanda',
        dialogue: {
          lines: [
            L('Wanda', '#ef6f8e', 'Sei tu il ragazzo dai capelli blu! Ti ho sognato! Nel sogno c\'era anche un gatto arancione che mi rubava le calze...'),
            L('Wanda', '#ef6f8e', 'Era un brutto segno, sai. O un gatto molto pratico. Prendi un biscotto, che la focaccia si paga con la gentilezza.'),
          ],
        },
      },
      {
        t: 'talk', npc: 'pina', label: 'Oh no... la terza focaccia!',
        dialogue: {
          lines: [
            L('Narratore', NARR, 'Mentre Clomp riparte, una buca traditrice fa volare la terza focaccia fuori dal finestrino. Atterra. Sulla ghiaia. A faccia in giù.', 'serious'),
            L('Clomp', CLOMP, 'No. NO. La focaccia di Anselmo! La regola dei cinque secondi non vale sulla ghiaia, è risaputo.'),
          ],
          choices: [
            { label: 'Torna da Nonna Pina e confessa tutto', love: 3, flag: 'confess', reply: [L('Clomp', CLOMP, 'La verità, come la focaccia: meglio calda e subito.')] },
            { label: 'Compra una focaccia sostituta da Gennaro', love: 1, flag: 'swap', reply: [L('Clomp', CLOMP, 'Tecnicamente non è una bugia. È una focaccia di riserva con ambizioni.')] },
            { label: 'Raccoglila, soffiaci sopra e via', love: -1, flag: 'eat', reply: [L('Clomp', CLOMP, 'La ghiaia è... croccante? No. No, Clomp. Soffia più forte.')] },
          ],
        },
      },
      { t: 'goto', x: -112, z: -76, r: 6, label: 'Sistema la faccenda della focaccia' },
      { t: 'goto', x: 60, z: -80, r: 6, label: 'Consegna l\'ultima focaccia ad Anselmo' },
      {
        t: 'talk', npc: 'anselmo', label: 'Parla con Anselmo',
        dialogue: (f: Flags) => ({
          lines: f.eat
            ? [
              L('Anselmo', '#77c4d4', 'Questa focaccia ha un sapore... minerale. Sento la terra. Sento la strada. Sento le tue scelte di vita discutibili.'),
              L('Clomp', CLOMP, 'È la ricetta nuova: "Focaccia Rustica della Seconda Occasione".'),
              L('Anselmo', '#77c4d4', '...Ne voglio un\'altra ogni martedì.', 'serious'),
            ]
            : [
              L('Anselmo', '#77c4d4', 'Non voglio niente da nessuno! ...Cos\'è, focaccia? Con la cipolla? ...Va bene, ma sappi che non ti ringrazio.'),
              L('Narratore', NARR, 'Anselmo mangia la focaccia piangendo di gioia, ma con la faccia di chi sta leggendo una bolletta.', 'serious'),
            ],
        }),
      },
    ],
  },

  // ── M2 · MR. BAFFI IN PERICOLO ──
  {
    id: 'gatto', title: 'Mr. Baffi in Pericolo', zone: 'Parco dell\'Amore', giver: 'rosa', rewardLove: 8,
    steps: [
      {
        t: 'talk', npc: 'rosa', label: 'Parla con la Signora Rosa',
        dialogue: {
          lines: [
            L('Signora Rosa', '#ef6f8e', 'CLOOOOMP! Il mio Mr. Baffi! È salito sul fico del parco e ora mi guarda dall\'alto in basso! LETTERALMENTE!'),
            L('Clomp', CLOMP, 'Signora, i gatti guardano tutti dall\'alto in basso. È il loro mestiere.'),
            L('Signora Rosa', '#ef6f8e', 'Non fare il filosofo con me, capelli blu! Seguilo, convincilo, CORROMPILO. È un gatto, avrà un prezzo!'),
          ],
        },
      },
      { t: 'chase', label: 'Segui Mr. Baffi per il parco!', target: 'cat', spots: [[96, 86], [122, 94], [112, 132], [130, 122], [132, 132]] },
      {
        t: 'talk', npc: 'rosa', label: 'Riporta Mr. Baffi dalla Signora Rosa',
        dialogue: {
          lines: [
            L('Narratore', NARR, 'Mr. Baffi si lascia prendere in braccio, si fa riportare dalla signora Rosa... e dopo tre secondi scappa di nuovo, con la coda dritta come un\'antenna.', 'serious'),
            L('Signora Rosa', '#ef6f8e', 'Vedi? Fa così perché mi ama a modo suo. Come mio marito. Pace all\'anima sua: anche lui scappava, ma tornava sempre per cena.'),
          ],
          choices: [
            { label: '"Sembra davvero felice qui al parco"', love: 2, reply: [L('Signora Rosa', '#ef6f8e', 'Felice e viziato. La combinazione perfetta. Torna quando vuoi, ti preparo le lasagne.')] },
            { label: '"Domani torna di sicuro, parola di Clomp"', love: 1, reply: [L('Signora Rosa', '#ef6f8e', 'Le promesse dei ragazzi dai capelli blu valgono doppio. Lo sanno tutti.')] },
          ],
        },
      },
    ],
  },

  // ── M3 · LA SFIDA DELLE RUOTE DI FOCACCIA ──
  {
    id: 'gara', title: 'La Sfida delle Ruote di Focaccia', zone: 'Anello di Cuorcontento', giver: 'tonino', rewardLove: 10,
    steps: [
      {
        t: 'talk', npc: 'tonino', label: 'Parla con Tonino "Turbo"',
        dialogue: {
          lines: [
            L('Tonino "Turbo"', '#ffc93c', 'E così tu saresti il famoso Clomp! Ho sentito che la tua Yaris fa i 140... in discesa, col vento a favore e un santo sul sedile.'),
            L('Clomp', CLOMP, 'La Yaris del 2007 non corre. VOLA BASSO. C\'è differenza.'),
            L('Tonino "Turbo"', '#ffc93c', 'Balle! La mia Ape Cross elaborata fa i 90 all\'ora... in salita. Di dignità. Due giri dell\'Anello. Chi perde lava il vincitore. Con lo spazzolino.'),
          ],
        },
      },
      { t: 'race', label: 'GARA: 2 giri dell\'Anello! Raccogli i box "?" per i power-up', laps: 2 },
      {
        t: 'talk', npc: 'tonino', label: 'Parla con Tonino',
        dialogue: (f: Flags) => ({
          lines: f.raceWin
            ? [
              L('Tonino "Turbo"', '#ffc93c', 'Impossibile. IN-POSSIBILE. Ho perso contro una Yaris del 2007. Qualcuno chiami i giornali. Quelli piccoli, così la notizia si nota di più.'),
              L('Clomp', CLOMP, 'La Yaris non ha vinto. Ha semplicemente voluto bene all\'asfalto più forte di te.'),
            ]
            : [
              L('Tonino "Turbo"', '#ffc93c', 'AH! Visto? L\'Ape Cross non perdona! Anche se... devo ammettere che guidi bene per uno con una macchina che ha la mia stessa età. Anzi, è più vecchia. Rispetto.'),
              L('Clomp', CLOMP, 'Gustati la vittoria, Tonino. La Yaris sta solo scaldando i sentimenti.'),
            ],
          choices: [
            { label: 'Rendilo tuo rivale ufficiale', love: 3, reply: [
              L('Clomp', CLOMP, 'Sei veloce, Tonino. Ma la tua Ape frena col cuore. Da oggi sei il mio rivale ufficiale.'),
              L('Tonino "Turbo"', '#ffc93c', '...I rivali si vogliono bene, si sa. Ma NON dirlo in giro che rovino la reputazione.', 'serious'),
            ] },
            { label: '"Driiin driiin, passa il triciclo!"', love: -1, reply: [
              L('Tonino "Turbo"', '#ffc93c', 'Questo è un veicolo commerciale con ambizioni sportive! E tu sei un bullo coi capelli da mare! ...Però forte, quel sorpasso alla curva del forno.'),
            ] },
          ],
        }),
      },
    ],
  },

  // ── M4 · IL CORTILE DELLA FURIA ──
  {
    id: 'cortile', title: 'Il Cortile della Furia', zone: 'Cortile delle Scuole', giver: 'bruscolo', rewardLove: 10,
    steps: [
      {
        t: 'talk', npc: 'bruscolo', label: 'Affronta Bruscolo',
        dialogue: {
          lines: [
            L('Bruscolo', '#d64545', 'Fermo lì, Capelli Blu. Questo cortile è MIO. Si paga il pedaggio: una figurina, una caramella... o la tua dignità. Accetto anche spiccioli.'),
            L('Clomp', CLOMP, 'Propongo un\'alternativa: una bella battaglia. Ma a colpi di... amore.'),
            L('Bruscolo', '#d64545', 'Amore?! L\'amore non fa male! ...Aspetta. Vuol dire che posso perdere senza farmi male? Mi piace. DENTRO!'),
          ],
        },
      },
      { t: 'battle', label: 'BATTAGLIA nel cortile! Colpisci i 3 kart con i Gusci d\'Amore (3 colpi ciascuno)', rivals: 3 },
      {
        t: 'talk', npc: 'bruscolo', label: 'Parla con Bruscolo',
        dialogue: {
          lines: [
            L('Bruscolo', '#d64545', 'Ok. Ok. Ho perso contro uno che combatte a cuoricini. Se lo dico ai miei amici mi ridono dietro fino al 2030.'),
            L('Clomp', CLOMP, 'O... potresti dire che hai pareggiato contro l\'amore. Tecnicamente è un risultato storico.'),
            L('Bruscolo', '#d64545', '...Ehi. Funziona. "Ho pareggiato con l\'amore." Suona da leggenda.', 'serious'),
          ],
        },
      },
    ],
  },

  // ── M5 · IL BULLO E I LIBRI ──
  {
    id: 'libri', title: 'Il Bullo e i Libri', zone: 'Piazza del Cuore', giver: 'spolverina', rewardLove: 10,
    steps: [
      {
        t: 'talk', npc: 'spolverina', label: 'Parla con la Professoressa Spolverina',
        dialogue: {
          lines: [
            L('Prof. Spolverina', '#b8a1e0', 'Clomp, che disastro! Quel birbante di Bruscolo ha preso i libri della biblioteca e li ha sparpagliati per la piazza! C\'era dentro "Il Piccolo Principe", "Guerra e Pace" e... il mio ricettario della parmigiana.'),
            L('Clomp', CLOMP, 'I primi due si ricomprano. La parmigiana è patrimonio dell\'umanità.'),
            L('Prof. Spolverina', '#b8a1e0', 'Inseguilo! E cerca di non farti... clacsonare. Ha imparato a suonare il clacson con i piedi.', 'serious'),
          ],
        },
      },
      { t: 'chase', label: 'Raggiungi Bruscolo in piazza! (3 volte)', target: 'bruscolo', spots: [[22, 12], [-20, -14], [16, -22]] },
      {
        t: 'talk', npc: 'bruscolo', label: 'Bruscolo si arrende!',
        dialogue: {
          lines: [
            L('Bruscolo', '#d64545', 'Va bene, va bene! Mi hai beccato! Ma i libri li ho lanciati talmente bene che ora sono sparsi per tutta la piazza. Raccoglili tu, campione.'),
            L('Clomp', CLOMP, 'Affare fatto. Ma poi parliamo, io e te. Da non-bulli.'),
          ],
        },
      },
      { t: 'collect', label: 'Recupera i 5 libri della biblioteca', kind: 'book', spots: [[8, 8], [-12, 5], [5, -14], [-18, -10], [18, -6]] },
      {
        t: 'talk', npc: 'bruscolo', label: 'Cosa fare con Bruscolo?',
        dialogue: {
          lines: [
            L('Bruscolo', '#d64545', 'E va bene, mi hai beccato. Puniscimi, sgridami, chiama la mia nonna... NO, la nonna no. Tutto tranne la nonna.'),
          ],
          choices: [
            { label: 'Stringigli la mano e perdona', love: 3, flag: 'bff', reply: [
              L('Narratore', NARR, 'Bruscolo guarda la mano tesa come se fosse un panino che non sapeva di meritare.', 'serious'),
              L('Bruscolo', '#d64545', 'Nessuno mi ha mai stretto la mano DOPO che ho combinato un guaio... Che sensazione strana. Mi sento... pulito? Dentro? È grave?'),
            ] },
            { label: 'Fagli riportare i libri uno a uno', love: 2, reply: [
              L('Bruscolo', '#d64545', 'Giustizia poetica, eh? Va bene. Ma sappi che mentre cammino penso a vendette... dolcissime. Tipo... farti trovare le focacce già tagliate.'),
            ] },
            { label: 'Suonagli il clacson in faccia (H)', love: 0, reply: [
              L('Bruscolo', '#d64545', 'AAAHH! Il clacson no! È l\'unica cosa che so fare io! Me lo hai rubato! ...Rispetto. Rispetto assoluto.'),
            ] },
          ],
        },
      },
    ],
  },

  // ── M6 · IL CONCERTO SOTTOTONO ──
  {
    id: 'concerto', title: 'Il Concerto Sottotono', zone: 'Molo di Levante', giver: 'focaccino', rewardLove: 10,
    steps: [
      {
        t: 'talk', npc: 'focaccino', label: 'Parla con DJ Focaccino',
        dialogue: {
          lines: [
            L('DJ Focaccino', '#2ec4b6', 'Fratello. Tragedia. Il gabbiano Steve mi ha rubato la chitarra. Dice che è "pedaggio di volo". Quel bipede con le ali di pizza.'),
            L('Clomp', CLOMP, 'E senza chitarra il tuo concerto di stasera...?'),
            L('DJ Focaccino', '#2ec4b6', 'Diventa un DJ set di sospiri. Molto poetico, zero ballo. Vai a parlare con Steve, è sul molo. Ma attento: quello negozia come un avvocato col becco.'),
          ],
        },
      },
      { t: 'goto', x: 124, z: -112, r: 7, label: 'Vai alla Pizzeria da Gennaro' },
      { t: 'collect', label: 'Ritira la pizza fumante', kind: 'pizza', spots: [[124, -112]] },
      { t: 'goto', x: 262, z: 36, r: 7, timed: 45, label: 'CONSEGNA LA PIZZA AL MOLO! Il formaggio deve filare!' },
      {
        t: 'talk', npc: 'steve', label: 'Tratta con Steve il Gabbiano',
        dialogue: {
          lines: [
            L('Steve il Gabbiano', '#8d939e', 'GAAK. La chitarra è mia. Regola del mare: ciò che il vento porta, il gabbiano trattiene. Ma sono un gabbiano ragionevole. GAAK.'),
            L('Steve il Gabbiano', '#8d939e', 'Scambio equo: una pizza margherita ancora calda. Il formaggio che fila, eh. Io LO SO quando il formaggio fila. GAAK.'),
          ],
          choices: [
            { label: 'Dagli anche la tua focaccina', love: 3, flag: 'steveFriend', reply: [
              L('Steve il Gabbiano', '#8d939e', 'GAAAK. Rispetto. Da oggi voli gratis sulle mie rotte. Metaforicamente. Non sai volare. GAAK. La chitarra è tua.'),
            ] },
            { label: 'Solo la pizza, patti chiari', love: 1, reply: [
              L('Steve il Gabbiano', '#8d939e', 'GAAK. Professionale. Mi piace. Affare fatto. Ma sappi che mi ricorderò di questa focaccina negata. GAAK.'),
            ] },
          ],
        },
      },
      {
        t: 'talk', npc: 'focaccino', label: 'Riporta la chitarra a DJ Focaccino',
        dialogue: {
          lines: [
            L('DJ Focaccino', '#2ec4b6', 'LA MIA BAMBINA! Grazie, Clomp! Stasera il concerto si fa, e tu sei in prima fila. Anzi: sei il palco. No, scherzo. Prima fila.'),
            L('Narratore', NARR, 'Quella sera il molo balla fino a tardi. Steve il gabbiano tiene il tempo col becco. Nessuno sa spiegare perché, ma tutti se lo aspettavano.', 'serious'),
          ],
        },
      },
    ],
  },

  // ── M7 · LA SAGRA DELLA FOCACCIA ──
  {
    id: 'sagra', title: 'La Sagra della Focaccia', zone: 'Tutta la città', giver: 'pina', rewardLove: 10,
    steps: [
      {
        t: 'talk', npc: 'pina', label: 'Parla con Nonna Pina',
        dialogue: {
          lines: [
            L('Nonna Pina', '#ff7b54', 'Clomp! È LA SAGRA! Ottanta anni di focacce e quest\'anno tocca a te fare le consegne speciali. Otto case, otto focacce, un solo ragazzo dai capelli blu.'),
            L('Clomp', CLOMP, 'Nonna, è un onore. E una responsabilità. E probabilmente una multa per eccesso di bontà.'),
            L('Nonna Pina', '#ff7b54', 'Vai, tesoro! E non mordere il marciapiede!'),
          ],
        },
      },
      { t: 'collect', label: 'Consegna le 8 focacce della Sagra in tempo!', kind: 'focaccia', timed: 100, spots: [[-140, -80], [-60, 80], [60, -80], [-130, 52], [140, 72], [88, -144], [-68, -148], [150, 150]] },
      { t: 'goto', x: -104, z: 92, r: 6, label: 'Ugo è rimasto solo al parcheggio, lontano dalla festa...' },
      {
        t: 'talk', npc: 'ugo', label: 'Avvicinati a Ugo',
        dialogue: {
          lines: [
            L('Ugo', '#8d939e', 'Tutti ballano. Io guardo. È il mio posto nel mondo: la panchina in fondo, quella con la vernice scrostata. Ci si affeziona, sai.', 'serious'),
            L('Clomp', CLOMP, '...'),
          ],
          choices: [
            { label: 'Siediti con lui in silenzio', love: 3, reply: [
              L('Narratore', NARR, 'Restano seduti dieci minuti, a guardare la Sagra da lontano. A volte stare zitti insieme è la chiacchierata più lunga che esiste.', 'serious'),
              L('Ugo', '#8d939e', 'Grazie, ragazzo. Non mi hai chiesto niente. È il regalo più strano che ho ricevuto quest\'anno.'),
            ] },
            { label: 'Invitalo a ballare', love: 2, reply: [
              L('Ugo', '#8d939e', 'Io ballo solo il liscio. E solo se lo balla anche la luna. ...Stasera la luna ha un impegno. Ma il pensiero vale un ballo.'),
            ] },
          ],
        },
      },
    ],
  },

  // ── M8 · IL FANTASMA DEL PARCHEGGIO ──
  {
    id: 'fantasma', title: 'Il Fantasma del Parcheggio', zone: 'Parcheggio Multipiano', giver: 'ugo', rewardLove: 12,
    steps: [
      {
        t: 'talk', npc: 'ugo', label: 'Parla con Ugo',
        dialogue: {
          lines: [
            L('Ugo', '#8d939e', 'Clomp. Devo dirti una cosa. Stanotte, nel parcheggio multipiano... si sentono dei lamenti. "Auuuuh... la mia macchina... non parte dal 1998... auuuh..."', 'serious'),
            L('Clomp', CLOMP, 'Ugo, i fantasmi non guidano. E comunque nessuna macchina parte dal 1998, è normale.'),
            L('Ugo', '#8d939e', 'Stanotte. Ci vai? Io ti aspetto qui. Da lontano. Col binocolo. Per supportarti moralmente.'),
          ],
        },
      },
      { t: 'night', label: 'Cala la notte su Cuorcontento...' },
      { t: 'goto', x: -104, z: 84, r: 8, label: 'Segui il lamento: "Auuuuh... auuuh..."' },
      { t: 'goto', x: -122, z: 104, r: 8, label: '"...la mia macchina... auuuh..." (dietro le colonne!)' },
      { t: 'goto', x: -104, z: 125, r: 7, label: 'Il lamento è proprio lì... CORAGGIO!' },
      {
        t: 'talk', npc: 'ugo', label: '???',
        dialogue: {
          lines: [
            L('???', '#8d939e', '"...auuuh... c\'è nessuno?... auuuh... è brutto urlare da soli..."'),
            L('Narratore', NARR, 'Dietro la colonna, con un tubo di gomma in mano usato come megafono, c\'è... Ugo.', 'serious'),
            L('Ugo', '#8d939e', 'Non sono un fantasma! Sono Ugo! Cioè, SONO io. L\'altro Ugo. Quello della panchina mi ha detto di venire a vedere se c\'era un fantasma e io ho pensato: se urlo "ciao" non risponde nessuno. Se urlo "buuu", almeno la gente arriva.', 'serious'),
            L('Clomp', CLOMP, 'Ugo... hai fatto il fantasma... per compagnia?'),
          ],
          choices: [
            { label: 'Abbraccialo fortissimo', love: 3, flag: 'hug', reply: [
              L('Narratore', NARR, 'L\'abbraccio dura undici secondi. Record cittadino. Ugo piange, ma ride anche, che è il modo in cui piangono le persone che non piangono mai.', 'serious'),
              L('Ugo', '#8d939e', 'Da quanto tempo non mi abbracciava qualcuno... Grazie, ragazzo. Il fantasma va in pensione. Subito. Domani al massimo.'),
            ] },
            { label: 'Portalo da Nonna Pina: serve un rimedio serio', love: 3, flag: 'pina', reply: [
              L('Nonna Pina', '#ff7b54', 'Un uomo solo? Nel MIO quartiere? SIEDITI. Focaccia. Tè. E da domani aiuti Clomp con le consegne, che la solitudine si cura con le commissioni in compagnia.'),
              L('Ugo', '#8d939e', '...Ho un lavoro? Ho un lavoro! IL FANTASMA HA UN LAVORO!'),
            ] },
          ],
        },
      },
      { t: 'day', label: 'Il sole sorge su una città più gentile' },
    ],
  },

  // ── M9 · IL SORRISO DEL SINDACO ──
  {
    id: 'sindaco', title: 'Il Sorriso del Sindaco', zone: 'Piazza del Cuore', giver: 'sindaco', rewardLove: 12,
    steps: [
      {
        t: 'talk', npc: 'sindaco', label: 'Parla con il Sindaco Malinconetti',
        dialogue: {
          lines: [
            L('Sindaco Malinconetti', '#6fc3df', 'Ah, Clomp. Ti aspettavo. Ho un problema gravissimo, di Stato. Anzi, di Faccia.'),
            L('Sindaco Malinconetti', '#6fc3df', 'Non riesco più a sorridere. I muscoli si sentono soli, abbandonati, in cassa integrazione. Un sindaco senza sorriso è come una focaccia senza... niente. È solo pane triste.', 'serious'),
            L('Clomp', CLOMP, 'Sindaco, le porto CINQUE motivi di gioia. Faccio il giro della città e glieli porto in piazza, freschi come focacce.'),
            L('Sindaco Malinconetti', '#6fc3df', 'Cinque motivi... Va bene. Ma che siano motivi BUONI. Ho il palato emotivo delicato.'),
          ],
        },
      },
      { t: 'sides', label: 'Trova 5 motivi di gioia: completa 5 Buone Azioni in città (cerca i diamanti VERDI)', count: 5 },
      {
        t: 'talk', npc: 'sindaco', label: 'Porta i motivi di gioia al Sindaco',
        dialogue: {
          lines: [
            L('Clomp', CLOMP, 'Sindaco: un pallone restituito, un fiore annaffiato, una lettera arrivata, una nonna meno sola, un gatto meno in alto. Cinque motivi. Tutti veri.'),
            L('Sindaco Malinconetti', '#6fc3df', 'Eccolo... sento il sorriso... no, aspetta, era uno starnuto. Ah no. Eccolo. È... è bellissimo. Fa anche un po\' male. Non sorridevo da così tanto che la faccia ha bisogno del rodaggio.', 'serious'),
            L('Sindaco Malinconetti', '#6fc3df', 'Clomp, ti nomino Eroe Ufficiale di Cuorcontento. Con tanto di targhetta. La targhetta arriva tra sei mesi, la burocrazia è lenta ma affettuosa.'),
          ],
        },
      },
    ],
  },

  // ── M10 · LA NOTTE GRIGIA ──
  {
    id: 'nottegrigia', title: 'La Notte Grigia', zone: 'Tutta la città', giver: 'tonino', rewardLove: 8,
    steps: [
      { t: 'cutscene', key: 'gray', label: 'Qualcosa oscura il cielo...' },
      { t: 'graystart', label: 'I colori stanno svanendo!' },
      {
        t: 'goto', x: 120, z: 120, r: 9, label: 'La Giostra del Parco si sta illuminando! CORRI!' },
      {
        t: 'talk', npc: 'fata', label: 'Una luce dorata scende dalla giostra...',
        dialogue: {
          lines: [
            L('Narratore', NARR, 'Mentre l\'Ombra Grigia divora i colori della città, la vecchia giostra del parco comincia a brillare di luce propria. Come se si ricordasse di qualcosa di importante.', 'serious'),
          ],
        },
      },
    ],
  },

  // ── M11 · LA SPADA DELL'AMORE ──
  {
    id: 'spada', title: 'La Spada dell\'Amore', zone: 'Parco dell\'Amore', giver: 'fata', rewardLove: 10,
    steps: [
      {
        t: 'talk', npc: 'fata', label: 'Parla con la Fata del Carosello',
        dialogue: {
          lines: [
            L('Fata del Carosello', '#ffd166', 'Clomp. Capelli blu, cuore... decisamente colorato. Ho visto tutto, sai. Le focacce. I gatti. I bulli abbracciati. I sindaci che starnutiscono invece di sorridere.', 'serious'),
            L('Clomp', CLOMP, 'Lei è... la fata della giostra? Esiste davvero?'),
            L('Fata del Carosello', '#ffd166', 'Esisto da quando esiste la prima giostra. E ora ascoltami bene: l\'Ombra Grigia non si combatte con altro grigio. Il male non si batte con altro male.'),
            L('Fata del Carosello', '#ffd166', 'Si batte con qualcosa che non si aspetta. Qualcosa di ridicolo e invincibile.', 'serious'),
            L('Clomp', CLOMP, 'Tipo?'),
            L('Fata del Carosello', '#ffd166', 'Tipo l\'amore, sciocchino.'),
          ],
        },
      },
      { t: 'sword', label: 'La giostra esplode di luce...' },
      {
        t: 'talk', npc: 'fata', label: 'La Fata ti consegna la Spada',
        dialogue: {
          lines: [
            L('Fata del Carosello', '#ffd166', 'Questa è la Spada dell\'Amore. Tutto ciò che trafigge non viene ferito: viene amato. Cosparsi di amore puro, anche i mostri ricordano chi erano.', 'serious'),
            L('Clomp', CLOMP, 'È... bellissima. E anche un po\' imbarazzante da portare in giro.'),
            L('Fata del Carosello', '#ffd166', 'Le cose belle sono sempre un po\' imbarazzanti. Ora vai, Clomp. L\'Ombra ti aspetta in piazza. E ricorda: niente rabbia. Solo sentimento.'),
          ],
        },
      },
    ],
  },

  // ── M12 · L'ESORCISMO FINALE ──
  {
    id: 'finale', title: 'L\'Esorcismo Finale', zone: 'Piazza del Cuore', giver: 'tonino', rewardLove: 20,
    steps: [
      { t: 'boss', label: 'LIBERA CUEORCONTENTO! (F = fendente della Spada)' },
      { t: 'grayend', label: 'I colori ritornano!' },
      {
        t: 'talk', npc: 'tonino', label: 'Il momento finale...',
        dialogue: {
          lines: [
            L('Narratore', NARR, 'L\'Ombra Grigia, colpita cinque volte, trema. Il suo nucleo rosa pulsa sempre più forte. È il momento.', 'serious'),
          ],
          choices: [
            { label: '✦ Purifica con l\'Amore Puro ✦', love: 10, reply: [
              L('Narratore', NARR, '(Non ci sono altre opzioni. Non ci sono mai state.)', 'serious'),
            ] },
          ],
        },
      },
      { t: 'cutscene', key: 'finale', label: 'Epilogo' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
//  BUONE AZIONI (side quests)
// ═══════════════════════════════════════════════════════════════════════

export const SIDES: SideQuest[] = [
  {
    id: 's1', npcName: 'Nonna Lella', color: '#ef6f8e', spot: [-146, -52], target: [80, 90], kind: 'balloon',
    label: 'Recupera il palloncino sul fico del parco',
    intro: { lines: [
      L('Nonna Lella', '#ef6f8e', 'Il palloncino di mio nipote è volato sul fico del parco! Lui dice che dentro c\'è "un desiderio". Io dico che c\'è aria, ma sai com\'è la poesia dei bambini.'),
    ] },
    thanks: 'Il nipote di Nonna Lella dice che il desiderio si è avverato: "il palloncino è tornato E c\'è ancora aria dentro".',
  },
  {
    id: 's2', npcName: 'Vigile Gentile', color: '#6fc3df', spot: [62, -156], target: [12, -8], kind: 'ball',
    label: 'Riporta il pallone in piazza',
    intro: { lines: [
      L('Vigile Gentile', '#6fc3df', 'Reclamo ufficiale: un pallone ha attraversato fuori dalle strisce. Va riconsegnato al legittimo proprietario: il primo bambino che lo reclama con gli occhi lucidi.'),
    ] },
    thanks: 'Il Vigile Gentile multa il pallone: "Che non succeda più". Il pallone promette.',
  },
  {
    id: 's3', npcName: 'Fioraia Viola', color: '#b8a1e0', spot: [166, 52], target: [78, 104], kind: 'flower',
    label: 'Annaffia l\'aiuola assetata del parco',
    intro: { lines: [
      L('Fioraia Viola', '#b8a1e0', 'Le mie margherite hanno sete! Sono così assetate che una mi ha chiesto un cappuccino. Un CAPPUCCINO. Aiutami tu, che hai la macchina.'),
    ] },
    thanks: 'Le margherite ora stanno benissimo. Quella del cappuccino ha ordinato anche un cornetto.',
  },
  {
    id: 's4', npcName: 'Postino Pino', color: '#ffc93c', spot: [-52, 166], target: [-140, 40], kind: 'letter',
    label: 'Consegna la lettera d\'amore smarrita',
    intro: { lines: [
      L('Postino Pino', '#ffc93c', 'Questa lettera d\'amore gira da TRE GIORNI. Cambia indirizzo ogni notte, come se fosse timida. Portala tu: con uno dai capelli blu si sentirà protetta.'),
    ] },
    thanks: 'La lettera è arrivata. Il destinatario ha pianto, riso, e poi ha risposto con DUE lettere. L\'amore fa inflazione.',
  },
  {
    id: 's5', npcName: 'Bagnino Gildo', color: '#2ec4b6', spot: [64, 40], target: [222, 64], kind: 'trash',
    label: 'Ripulisci la spiaggia dai rifiuti',
    intro: { lines: [
      L('Bagnino Gildo', '#2ec4b6', 'La spiaggia è sporca! Un granchio mi ha chiesto un sacchetto per la raccolta differenziata. UN GRANCHIO, Clomp. Dobbiamo vergognarci e agire.'),
    ] },
    thanks: 'Il granchio approva la raccolta. Ha anche fatto un piccolo applauso con le chele.',
  },
  {
    id: 's6', npcName: 'Musicante Nino', color: '#ff8b7b', spot: [-166, 156], target: [26, -26], kind: 'note',
    label: 'Ritrova la nota musicale fuggita',
    intro: { lines: [
      L('Musicante Nino', '#ff8b7b', 'Mi è scappata una nota! Un SOL diesis, caratteraccio, sempre in giro da solo. Senza di lui la mia canzone zoppica. Riportalo a casa!'),
    ] },
    thanks: 'Il SOL diesis è tornato. Per punizione deve suonare da solo l\'intro, che è la parte difficile.',
  },
  {
    id: 's7', npcName: 'Traslocatore Ubaldo', color: '#f4a259', spot: [156, -44], target: [134, -30], kind: 'crate',
    label: 'Sposta lo scatolone dei ricordi',
    intro: { lines: [
      L('Traslocatore Ubaldo', '#f4a259', 'Quello scatolone pesa più di quanto sembri: dentro ci sono i ricordi della signora Ada. I ricordi pesano, Clomp. Soprattutto quelli belli. Spingilo fino al portone!'),
    ] },
    thanks: 'La signora Ada ha aperto lo scatolone: dentro c\'era una foto del mare nel 1974. Ha sorriso per un\'ora intera.',
  },
  {
    id: 's8', npcName: 'Bambina Luce', color: '#ffd166', spot: [-44, -166], target: [-196, 40], kind: 'balloon',
    label: 'Riprendi il palloncino sull\'Anello',
    intro: { lines: [
      L('Bambina Luce', '#ffd166', 'Il mio palloncino è volato sulla strada dell\'Anello! Si chiama Renato. Non chiedermi perché. Riportami Renato!'),
    ] },
    thanks: 'Renato è tornato a casa. La bambina gli ha presentato il secondo palloncino: "Lui è Renato Due".',
  },
  {
    id: 's9', npcName: 'Giardiniere Bruno', color: '#63c04f', spot: [166, -156], target: [132, 138], kind: 'flower',
    label: 'Pianta il fiore segreto nel parco',
    intro: { lines: [
      L('Giardiniere Bruno', '#63c04f', 'Ho un fiore speciale da piantare: cresce solo dove qualcuno ha fatto una buona azione. Con te in giro, il parco è pieno di posti buoni!'),
    ] },
    thanks: 'Il fiore è cresciuto in tre secondi. Bruno dice che è il fiore più veloce della sua carriera. E ne ha visti, di fiori.',
  },
  {
    id: 's10', npcName: 'Barista Edda', color: '#77c4d4', spot: [-166, -44], target: [-112, -80], kind: 'focaccia',
    label: 'Porta il caffè-focaccia a Nonna Pina',
    intro: { lines: [
      L('Barista Edda', '#77c4d4', 'Nonna Pina mi ha insegnato la ricetta della sua vita. In cambio le porto la focaccia del martedì, ma oggi ho il bar pieno! Portagliela tu, che sei veloce e profumi di buone azioni.'),
    ] },
    thanks: 'Nonna Pina ha assaggiato: "Buona. Quasi come la mia. QUASI." Da lei è una dichiarazione d\'amore.',
  },
  {
    id: 's11', npcName: 'Atleta Rino', color: '#ff5d5d', spot: [44, 166], target: [196, -180], kind: 'ball',
    label: 'Recupera il pallone da allenamento',
    intro: { lines: [
      L('Atleta Rino', '#ff5d5d', 'Il mio pallone da allenamento è rotolato fino alla curva dell\'Anello! Senza di lui non posso allenarmi per la Gara Mondiale di Calci al Volo. È giovedì!'),
    ] },
    thanks: 'Rino si allena così forte che il pallone ha chiesto il cambio. Rispettosamente.',
  },
  {
    id: 's12', npcName: 'Astronomo Nanni', color: '#8d939e', spot: [156, 166], target: [-196, -180], kind: 'note',
    label: 'Riporta la stella cadente (era una lucciola)',
    intro: { lines: [
      L('Astronomo Nanni', '#8d939e', 'Una stella è caduta all\'angolo dell\'Anello! ...Va bene, forse è una lucciola. Ma una lucciola che crede di essere una stella merita rispetto. Riaccompagnala al cielo!'),
    ] },
    thanks: 'La lucciola è tornata a brillare in alto. Nanni l\'ha catalogata: "Stella Nanni-42, luminosità: testarda".',
  },
];

// ═══════════════════════════════════════════════════════════════════════
//  BATTUTE DELL'OMBRA GRIGIA
// ═══════════════════════════════════════════════════════════════════════

export const OMBRA_INTRO = [
  'Salve, cittadina del buonumore. Sono l\'Ombra Grigia. Il lunedì dell\'anima. La scadenza delle cose belle.',
  'Da oggi, tutto sarà... meh. Le focacce sapranno di cartone umido. I gatti ignoreranno tutti. Le giostre gireranno... MA AL CONTRARIO.',
  'Ah ah ah. Avete capito? Al contrario. Il massimo del male. ...Perché nessuno ride? Perché nessuno RIDE?!',
];

export const OMBRA_CHASE = [
  'Dove corri, capelli blu? Il grigio arriva sempre. Come il bucato da stirare.',
  'Fermati! Ti offro un pomeriggio di nulla assoluto! Divano! Telecomando senza pile!',
];

export const OMBRA_HIT_LINES = [
  'Ahi! Che cos\'è questa sensazione calda?! Disgustosa! ...Continua.',
  'Fermati! Ho un\'infanzia difficile! Sono cresciuto in una nuvola senza Wi-Fi!',
  'Va bene! Va bene! Forse la gente non mi salutava perché ero grigio? Solo un\'ipotesi.',
  'Ma se divento colorato... poi chi ha paura di me? Chi mi rispetta?!',
  '...Ah. Il rispetto si guadagna. L\'amore si regala. Ma che scoperta. Che scoperta, ragazzo dai capelli blu.',
];

export const OMBRA_WAVE_LINES = [
  'Ombre minori! Sbranate la sua allegria! Con garbo, ma sbranatela!',
  'Altre ombre! Questa volta con più... grinta grigia!',
];

// ═══════════════════════════════════════════════════════════════════════
//  EPILOGO E TITOLI DI CODA
// ═══════════════════════════════════════════════════════════════════════

export const ENDING_EPILOGUE: DialogueLine[] = [
  L('Narratore', NARR, 'L\'Ombra Grigia si scioglie in una pioggia di coriandoli... e dove cade ogni coriandolo, rinasce un colore.', 'serious'),
  L('Signor Sereno', '#7fd0ff', 'Salve a tutti! Sono il Signor Sereno! Prima ero l\'Ombra Grigia, ma ho scoperto che il rosa mi dona. Ogni tanto pioverò coriandoli, così, per mantenermi interessante.'),
  L('Clomp', CLOMP, 'Benvenuto nel quartiere, Signor Sereno. Avviso: qui le focacce sono obbligatorie.'),
  L('Nonna Pina', '#ff7b54', 'E io che pensavo che il ragazzo dai capelli blu dovesse solo lavare la Yaris. Invece ha lavato il cuore a tutta la città.', 'serious'),
  L('Narratore', NARR, 'Cuorcontento torna a splendere. Le giostre girano nel verso giusto, i gatti ignorano solo chi se lo merita, e Anselmo ora ringrazia. Una volta all\'anno, ma ringrazia.', 'serious'),
  L('Narratore', NARR, 'E Clomp? Clomp continua a guidare la sua Yaris del 2007. Perché gli eroi veri non cambiano macchina. Cambiano il mondo.', 'serious'),
];

export const ENDING_CREDITS: [string, string][] = [
  ['Clomp', 'il ragazzo dai capelli blu (fino al fondoschiena)'],
  ['Toyota Yaris 2007', 'la vera protagonista'],
  ['Nonna Pina', 'Focacce & Saggezza'],
  ['Tonino "Turbo"', 'Rivale Ufficiale (con affetto)'],
  ['Signora Rosa & Mr. Baffi', 'Dramma Felino'],
  ['DJ Focaccino', 'Colonna Sonora del Molo'],
  ['Steve il Gabbiano', 'Negoziati & Pedaggi di Volo'],
  ['Bruscolo', 'Ex Bullo, Attuale Leggenda'],
  ['Ugo', 'Ex Fantasma, Attuale Dipendente del Mese'],
  ['Sindaco Malinconetti', 'Sorrisi (finalmente)'],
  ['Prof.ssa Spolverina', 'Biblioteca & Parmigiana'],
  ['Fata del Carosello', 'Spade dell\'Amore S.p.A.'],
  ['Signor Sereno', 'ex Ombra Grigia, ora meteorologia festosa'],
  ['Anselmo', 'Grazie. (una volta all\'anno)'],
  ['', ''],
  ['SCENEGGIATURA', 'fatta con amore e focaccia'],
  ['MOTORE DI GIOCO', 'Three.js, che ha retto tutto'],
  ['FISICA DELLA YARIS', 'realistica quanto basta'],
  ['GUSCI ROSSI D\'AMORE', 'nessun kart è stato ferito'],
  ['RINGRAZIAMENTO SPECIALE', 'a te, che hai giocato col cuore'],
];
