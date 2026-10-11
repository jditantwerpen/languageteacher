// Theory summary: Los tiempos del pasado (based on the GO! KLA 6SP supplement).
import { Box, Chips, Ex, Section, Table } from './blocks'

export const pasadoToc = [
  ['overzicht', 'In één oogopslag'],
  ['compuesto', '1. Pretérito compuesto'],
  ['imperfecto', '2. Imperfecto'],
  ['indefinido', '3. Pretérito indefinido'],
  ['imp-indef', 'Imperfecto of indefinido?'],
  ['comp-indef', 'Compuesto of indefinido?'],
  ['stappenplan', 'Stappenplan voor de toets'],
]

export default function Pasado() {
  return (
    <>
      <Section id="overzicht" title="In één oogopslag">
        <p>Het Spaans heeft 3 verleden tijden. Het Nederlands zegt bijna altijd gewoon "ik speelde" of "ik heb gespeeld". Daarom moet je in het Spaans telkens <b>kiezen</b>.</p>
        <Table
          head={['Tijd', 'Wanneer?', 'Voorbeeld']}
          rows={[
            ['Pretérito compuesto', 'Verleden met een band met nu of vandaag', 'Hoy he comido pizza.'],
            ['Imperfecto', 'Beschrijving, gewoonte, iets dat bezig was', 'Antes comía pizza cada día.'],
            ['Pretérito indefinido', 'Afgeronde actie op een bepaald moment', 'Ayer comí pizza.'],
          ]}
        />
      </Section>

      <Section id="compuesto" title="1. Pretérito compuesto (= pretérito perfecto)">
        <h3>Vorming: haber + voltooid deelwoord</h3>
        <p><b>Haber</b> in de tegenwoordige tijd: he, has, ha, hemos, habéis, han.</p>
        <p><b>Deelwoord:</b> -ar → <b>-ado</b>, -er en -ir → <b>-ido</b>.</p>
        <Table
          head={['', 'cantar', 'beber', 'vivir']}
          rows={[
            ['yo', 'he cantado', 'he bebido', 'he vivido'],
            ['tú', 'has cantado', 'has bebido', 'has vivido'],
            ['él/ella/usted', 'ha cantado', 'ha bebido', 'ha vivido'],
            ['nosotros', 'hemos cantado', 'hemos bebido', 'hemos vivido'],
            ['vosotros', 'habéis cantado', 'habéis bebido', 'habéis vivido'],
            ['ellos/ellas/ustedes', 'han cantado', 'han bebido', 'han vivido'],
          ]}
        />
        <Box kind="tip" title="Makkelijker dan in het Frans">
          Altijd <b>haber</b>, nooit "ser". Het deelwoord verandert nooit: ella ha ido, ellas han ido.
        </Box>
        <h3>De 12 onregelmatige deelwoorden (vanbuiten leren!)</h3>
        <Table
          head={['Infinitief', 'Deelwoord', 'Infinitief', 'Deelwoord']}
          rows={[
            ['abrir (openen)', 'abierto', 'morir (sterven)', 'muerto'],
            ['cubrir (bedekken)', 'cubierto', 'poner (leggen, zetten)', 'puesto'],
            ['decir (zeggen)', 'dicho', 'resolver (oplossen)', 'resuelto'],
            ['descubrir (ontdekken)', 'descubierto', 'romper (breken)', 'roto'],
            ['escribir (schrijven)', 'escrito', 'ver (zien)', 'visto'],
            ['hacer (doen)', 'hecho', 'volver (terugkeren)', 'vuelto'],
          ]}
        />
        <h3>Gebruik</h3>
        <p>Een actie in het verleden die nog <b>verbonden is met nu</b>: vandaag, deze week, ooit tot nu toe, of iets dat je emotioneel nog raakt.</p>
        <Ex es="Esta mañana he desayunado un bol de cereales." nl="Vanmorgen heb ik een kom ontbijtgranen gegeten." />
        <Ex es="Te han robado la cartera." nl="Ze hebben je portefeuille gestolen." />
        <h3>Signaalwoorden</h3>
        <Chips items={[['hoy', 'vandaag'], ['esta mañana', 'vanmorgen'], ['esta semana', 'deze week'], ['este mes', 'deze maand'], ['este año', 'dit jaar'], ['ya', 'al, reeds'], ['hasta ahora', 'tot nu'], ['todavía no', 'nog niet'], ['alguna vez', 'ooit'], ['muchas veces', 'vaak'], ['nunca', 'nooit']]} />
        <Box kind="key" title="Ezelsbruggetje">Begint de tijdsaanduiding met <b>este/esta</b>? Dan hangt ze samen met vandaag → compuesto.</Box>
      </Section>

      <Section id="imperfecto" title="2. Imperfecto">
        <h3>Vorming: stam + uitgang</h3>
        <Table
          head={['', '-ar (cantar)', '-er (comer)', '-ir (vivir)']}
          rows={[
            ['yo', 'cantaba', 'comía', 'vivía'],
            ['tú', 'cantabas', 'comías', 'vivías'],
            ['él/ella/usted', 'cantaba', 'comía', 'vivía'],
            ['nosotros', 'cantábamos', 'comíamos', 'vivíamos'],
            ['vosotros', 'cantabais', 'comíais', 'vivíais'],
            ['ellos/ellas/ustedes', 'cantaban', 'comían', 'vivían'],
          ]}
        />
        <Box kind="tip" title="Goed nieuws">
          Geen klinkerwissels (dormir → dormía, niet "duermía"). En -er en -ir hebben precies dezelfde uitgangen.
        </Box>
        <Box kind="warn" title="Let op de accenten">
          -ar: alleen <b>nosotros</b> krijgt een accent (cant<b>á</b>bamos). -er/-ir: <b>altijd</b> een accent op de í.
        </Box>
        <h3>Maar 3 onregelmatige werkwoorden</h3>
        <Table
          rows={[
            ['ir (gaan)', 'iba, ibas, iba, íbamos, ibais, iban'],
            ['ser (zijn)', 'era, eras, era, éramos, erais, eran'],
            ['ver (zien)', 'veía, veías, veía, veíamos, veíais, veían'],
          ]}
        />
        <h3>Gebruik</h3>
        <ul>
          <li><b>Beschrijving</b>: hoe iets of iemand was (landschap, gevoelens, weer, leeftijd)</li>
          <li><b>Gewoonte</b>: wat je vroeger altijd of elke dag deed</li>
          <li><b>Actie die bezig was</b> toen iets anders gebeurde (de eerste actie)</li>
          <li>Het <b>decor</b> of de context van een verhaal</li>
        </ul>
        <Ex es="Cuando era niño, jugaba en la plaza." nl="Toen ik een kind was, speelde ik op het plein." />
        <h3>Signaalwoorden</h3>
        <Chips items={[['siempre', 'altijd'], ['cada vez', 'elke keer'], ['antes', 'vroeger'], ['normalmente', 'gewoonlijk'], ['soler', 'gewoon zijn om'], ['todos los días', 'elke dag']]} />
        <Box kind="key" title="Grammaticale signalen">
          <p><b>zelfstandig naamwoord + que</b> + imperfecto beschrijft dat woord: <i>el explorador que se <b>llamaba</b> Tomás</i>.</p>
          <p><b>porque</b> + imperfecto geeft uitleg over een situatie.</p>
        </Box>
      </Section>

      <Section id="indefinido" title="3. Pretérito indefinido">
        <h3>Vorming: regelmatig</h3>
        <Table
          head={['', '-ar (llamar)', '-er (comer)', '-ir (salir)']}
          rows={[
            ['yo', 'llamé', 'comí', 'salí'],
            ['tú', 'llamaste', 'comiste', 'saliste'],
            ['él/ella/usted', 'llamó', 'comió', 'salió'],
            ['nosotros', 'llamamos', 'comimos', 'salimos'],
            ['vosotros', 'llamasteis', 'comisteis', 'salisteis'],
            ['ellos/ellas/ustedes', 'llamaron', 'comieron', 'salieron'],
          ]}
        />
        <Box kind="warn" title="Accent = betekenis">
          <b>llamo</b> (ik bel, nu) ≠ <b>llamó</b> (hij belde). Vergeet het accent op yo en él niet!
          <br />Nosotros -ar en -ir (llamamos, salimos) ziet eruit als de tegenwoordige tijd. Alleen de context toont het verschil.
        </Box>

        <h3>Klinkerwissel (e → i, o → u): alleen bij él en ellos</h3>
        <p>pedir, corregir, elegir, impedir, medir, repetir, servir, seguir, vestir · dormir, morir</p>
        <Ex es="pedí, pediste, pidió, pedimos, pedisteis, pidieron" />
        <Ex es="dormí, dormiste, durmió, dormimos, dormisteis, durmieron" />

        <h3>Werkwoorden met y: ook alleen bij él en ellos</h3>
        <p>caer, creer, construir, contribuir, destruir, leer, incluir, oír</p>
        <Ex es="leí, leíste, leyó, leímos, leísteis, leyeron" />

        <h3>Onregelmatig: 3 groepen</h3>
        <Box kind="tip" title="Goed nieuws">Bij de onregelmatige werkwoorden staat er <b>nergens een accent</b>.</Box>
        <Table
          head={['Groep', 'Werkwoorden', 'Voorbeeld']}
          rows={[
            ['met i', 'dar, hacer, querer, venir (+ convenir)', 'hice, hiciste, hizo, hicimos, hicisteis, hicieron'],
            ['met j', 'conducir, decir, producir, reducir, traer', 'dije, dijiste, dijo, dijimos, dijisteis, dijeron'],
            ['met u', 'andar, caber, estar, poder, poner, saber, tener', 'tuve, tuviste, tuvo, tuvimos, tuvisteis, tuvieron'],
          ]}
        />
        <Table
          rows={[
            ['dar', 'di, diste, dio, dimos, disteis, dieron'],
            ['ir = ser', 'fui, fuiste, fue, fuimos, fuisteis, fueron (de context toont welke)'],
            ['haber', 'alleen hubo (er was, er waren)'],
          ]}
        />
        <Box kind="warn" title="Valkuilen">
          <b>hizo</b> met z (niet "hico"). De j-groep krijgt <b>-eron</b>, niet -ieron: dijeron, trajeron.
        </Box>

        <h3>Gebruik</h3>
        <ul>
          <li><b>Afgeronde actie</b> op een bepaald moment in het verleden</li>
          <li><b>Opeenvolgende acties</b>: eerst dit, dan dat…</li>
          <li>De actie die een andere, lopende actie <b>onderbreekt</b> (de tweede actie)</li>
          <li><b>Exacte data</b> en biografieën</li>
        </ul>
        <Ex es="Ayer hice muchos deberes: primero lavé los platos, luego pasé la aspiradora y para terminar saqué al perro." />
        <Ex es="En el año 1904 nació Salvador Dalí." nl="In 1904 werd Salvador Dalí geboren." />
        <h3>Signaalwoorden</h3>
        <Chips items={[['ayer', 'gisteren'], ['anoche', 'gisteravond'], ['anteayer', 'eergisteren'], ['la semana pasada', 'vorige week'], ['el lunes pasado', 'vorige maandag'], ['el año pasado', 'vorig jaar'], ['hace 3 días', '3 dagen geleden'], ['el otro día', 'toen die dag'], ['primero, luego, después', 'eerst, daarna'], ['al final', 'uiteindelijk'], ['de repente', 'plots']]} />
      </Section>

      <Section id="imp-indef" title="Imperfecto of indefinido?">
        <Box kind="key" title="Denk aan een film 🎬">
          <b>Imperfecto</b> = het decor en wat al bezig was (de achtergrond).<br />
          <b>Indefinido</b> = wat er gebeurt, de actie die het verhaal vooruit duwt.
        </Box>
        <Ex es="Aquella noche, cuando todos dormían, de repente empezó una horrible tempestad." nl="Die nacht, toen iedereen sliep, begon er plots een vreselijke storm." />
        <p><b>dormían</b> = was bezig (imperfecto) · <b>empezó</b> = onderbreekt (indefinido).</p>
        <Table
          head={['Imperfecto', 'Indefinido']}
          rows={[
            ['1. Beschrijving', '1. Actie'],
            ['2. Eerste actie (was bezig)', '2. Tweede actie die onderbreekt'],
            ['3. Gewoonte', '4. Opeenvolgende acties'],
            ['5. Verleden zonder precieze datum', '6. Verleden met precieze datum'],
          ]}
        />
        <Box kind="tip" title="Vraag het jezelf af">
          Was het <b>bezig</b> of een <b>gewoonte</b>? → imperfecto. Gebeurde het <b>één keer</b> en is het <b>af</b>? → indefinido.
        </Box>
      </Section>

      <Section id="comp-indef" title="Compuesto of indefinido?">
        <p>Beide zijn afgeronde acties. Het verschil zit in de <b>tijd</b>:</p>
        <Table
          head={['Pretérito compuesto', 'Pretérito indefinido']}
          rows={[
            ['periode nog niet voorbij', 'periode afgesloten'],
            ['hoy, esta mañana, este año', 'ayer, la semana pasada, en mayo'],
            ['Hoy he recogido las llaves.', 'Ayer volví de mis vacaciones.'],
          ]}
        />
      </Section>

      <Section id="stappenplan" title="Stappenplan voor de toets">
        <ol>
          <li><b>Zoek de signaalwoorden</b> (hoy? ayer? siempre? de repente?).</li>
          <li><b>Kies de tijd</b>: band met nu → compuesto; bezig, decor of gewoonte → imperfecto; afgerond moment → indefinido.</li>
          <li><b>Zoek de persoon</b> (yo, tú, ella…).</li>
          <li><b>Check of het werkwoord onregelmatig is</b> (deelwoord? i/j/u-groep? ir/ser/ver?).</li>
          <li><b>Check je accenten</b>: comí, llamó, comía, cantábamos.</li>
        </ol>
      </Section>
    </>
  )
}
