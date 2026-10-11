// Theory summary: Unidad 6 ¡Vamos de viaje! (based on the GO! KLA 6SP course).
import { Box, Chips, Ex, Section, Table } from './blocks'

export const unidad6Toc = [
  ['leerstof', 'Wat moet je kennen?'],
  ['nacionalidades', 'De nationaliteiten'],
  ['viaje', 'Op reis: luchthaven en station'],
  ['problemas', 'Problemen op reis'],
  ['dialogo', 'Formeel gesprek (usted)'],
  ['carta', 'Een formele brief schrijven'],
]

export default function Unidad6({ onOpen }) {
  return (
    <>
      <Section id="leerstof" title="Wat moet je kennen?">
        <ul>
          <li><b>Woordenschat</b>: een reis plannen, problemen uitleggen en hulp vragen (zie de woordenlijst)</li>
          <li><b>De nationaliteiten</b> (+ herhaling landen en talen)</li>
          <li><b>Vorming en gebruik</b> van de pretérito compuesto, het imperfecto en de pretérito indefinido</li>
          <li><b>Vaardigheden</b>: een formeel gesprek voeren en een formele brief (klacht) schrijven</li>
        </ul>
        {onOpen && (
          <button className="btn small-btn" onClick={() => onOpen('pasado')}>
            📖 Open de theorie over de verleden tijden →
          </button>
        )}
      </Section>

      <Section id="nacionalidades" title="De nationaliteiten">
        <Box kind="warn" title="Altijd met een kleine letter">
          Anders dan in het Nederlands: un chico <b>e</b>spañol, una chica <b>b</b>elga.
        </Box>
        <Table
          head={['Mannelijk eindigt op…', 'Vrouwelijk', 'Voorbeeld']}
          rows={[
            ['medeklinker', '+ a', 'inglés → inglesa, español → española'],
            ['-o', '-a', 'italiano → italiana'],
            ['-e', '-e (blijft)', 'estadounidense → estadounidense'],
            ['-í', '-í (blijft)', 'iraní → iraní'],
            ['-a', '-a (blijft)', 'belga → belga'],
          ]}
        />
        <Box kind="key" title="Let op het accent">
          Bij + a valt het accent weg: franc<b>é</b>s → francesa, alem<b>á</b>n → alemana, japon<b>é</b>s → japonesa.
        </Box>
        <Box kind="tip" title="Taal = mannelijk enkelvoud">
          De naam van de taal is meestal de mannelijke vorm: <i>Hablo inglés y francés.</i>
        </Box>
        <Table
          head={['Mannelijk, vrouwelijk', 'Nederlands']}
          rows={[
            ['alemán, alemana', 'Duits'], ['belga', 'Belgisch'], ['brasileño, brasileña', 'Braziliaans'],
            ['canadiense', 'Canadees'], ['chino, china', 'Chinees'], ['colombiano, colombiana', 'Colombiaans'],
            ['costarricense', 'Costa Ricaans'], ['croata', 'Kroatisch'], ['español, española', 'Spaans'],
            ['estadounidense', 'Amerikaans'], ['francés, francesa', 'Frans'], ['inglés, inglesa', 'Engels'],
            ['iraní', 'Iraans'], ['italiano, italiana', 'Italiaans'], ['japonés, japonesa', 'Japans'],
            ['marroquí', 'Marokkaans'], ['mexicano, mexicana', 'Mexicaans'], ['paraguayo, paraguaya', 'Paraguayaans'],
            ['portugués, portuguesa', 'Portugees'], ['polaco, polaca', 'Pools'], ['turco, turca', 'Turks'],
          ]}
        />
      </Section>

      <Section id="viaje" title="Op reis: luchthaven en station">
        <p>Op een vertrekbord (aeropuerto) of een treinsite (RENFE) moet je deze woorden snel herkennen:</p>
        <Chips items={[['salida', 'vertrek'], ['llegada', 'aankomst'], ['vuelo', 'vlucht'], ['destino', 'bestemming'], ['puerta de embarque', 'gate'], ['retrasado', 'vertraagd'], ['última llamada', 'last call'], ['tarifa', 'tarief'], ['viaje de ida', 'heenreis'], ['viaje de vuelta', 'terugreis'], ['salir a tiempo', 'op tijd vertrekken']]} />
        <Ex es="Su vuelo se ha retrasado. Sale a las 11:15 de la puerta D62." nl="Uw vlucht heeft vertraging. Hij vertrekt om 11.15 uur aan gate D62." />
      </Section>

      <Section id="problemas" title="Problemen op reis">
        <p>De titels uit de tekst staan bijna allemaal in de <b>pretérito compuesto</b>: het probleem is net gebeurd en speelt nu nog.</p>
        <Table
          rows={[
            ['Te han robado la cartera.', 'Ze hebben je portefeuille gestolen.'],
            ['Has perdido el vuelo.', 'Je hebt je vlucht gemist.'],
            ['Te has quemado (mucho).', 'Je bent (erg) verbrand.'],
            ['Te han perdido las maletas.', 'Ze zijn je koffers kwijtgeraakt.'],
            ['Has perdido el pasaporte.', 'Je bent je paspoort kwijt.'],
            ['Te comen los mosquitos.', 'De muggen eten je op.'],
          ]}
        />
        <h3>Problemen in je kamer of chalet</h3>
        <Chips items={[['está sucio/a', 'is vuil'], ['no queda…', 'er is geen … meer'], ['está lleno/a', 'is vol'], ['falta…', 'er ontbreekt…'], ['no hay…', 'er is geen…'], ['está roto/a', 'is kapot'], ['no funciona', 'werkt niet'], ['está desconectado/a', 'is niet aangesloten'], ['hacen mucho ruido', 'maken veel lawaai']]} />
        <Ex es="Las toallas están sucias y no queda papel higiénico." nl="De handdoeken zijn vuil en er is geen wc-papier meer." />
        <Ex es="La bombilla está rota y la ducha no funciona." nl="De lamp is kapot en de douche werkt niet." />
      </Section>

      <Section id="dialogo" title="Formeel gesprek (usted)">
        <Box kind="key" title="Usted = 3de persoon enkelvoud">
          Tegen een receptionist spreek je beleefd: <b>usted</b> + werkwoord in de 3de persoon enkelvoud. <i>¿Puede usted ayudarme?</i>
        </Box>
        <Table
          head={['Rol', 'Typische zin', 'Betekenis']}
          rows={[
            ['R', '¿En qué puedo ayudarle?', 'Waarmee kan ik u helpen?'],
            ['T', 'Tenemos algunos problemas en nuestro chalet.', 'We hebben een paar problemen in ons chalet.'],
            ['T', 'El primer problema es que…', 'Het eerste probleem is dat…'],
            ['R', 'Vale, si lo entiendo bien, el problema es…', 'Oké, als ik het goed begrijp, is het probleem…'],
            ['R', 'Lo que propongo es… / Podríamos + inf.', 'Wat ik voorstel is… / We zouden kunnen…'],
            ['T', 'Me parece bien. También tengo que decirle que…', 'Dat lijkt me goed. Ik moet u ook zeggen dat…'],
            ['R', 'Le pido disculpas por todas las molestias.', 'Mijn excuses voor alle ongemakken.'],
          ]}
        />
      </Section>

      <Section id="carta" title="Een formele brief schrijven (una queja)">
        <ol>
          <li><b>Asunto</b> (onderwerp): kort en duidelijk, met hotel en datum.</li>
          <li><b>Aanhef</b>: <i>Estimado señor González:</i> / <i>Estimada señora:</i></li>
          <li><b>1ste alinea</b>: waarom je schrijft (het probleem) + wat je vraagt (een oplossing). <i>Le estoy contactando porque…</i></li>
          <li><b>2de alinea</b>: <i>Si tiene alguna pregunta, no dude en contactarme.</i></li>
          <li><b>3de alinea</b>: <i>Por favor, póngase en contacto conmigo…</i></li>
          <li><b>Afsluiting</b>: <i>Atentamente</i>, <i>Cordialmente</i>, <i>Un cordial saludo</i>, <i>Quedo a la espera de su respuesta</i>.</li>
        </ol>
        <Box kind="warn" title="Spaanse aanhef: dubbelpunt!">
          <i>Estimada señora García<b>:</b></i>, en dus geen komma zoals in het Nederlands.
        </Box>
        <Box kind="tip" title="Check voor je indient">
          ± 100–120 woorden · minstens 5 themawoorden · verleden tijden juist gebruikt · accenten en leestekens nagekeken.
        </Box>
      </Section>
    </>
  )
}
