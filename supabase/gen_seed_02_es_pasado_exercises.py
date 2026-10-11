"""
Generate seed SQL for the sentence, story and tense-choice exercises of the
Spanish topic "Los tiempos del pasado" (handout GO! KLA 6SP).

Gap syntax used in the texts below:
    [[label|answer]]        label is shown to the student, e.g. "hacer, tú"
    [[label|answer|x]]      x overrides the tense skill for this gap:
                            c = pretérito compuesto, i = imperfecto, d = indefinido

Each gap becomes one exercise. In story chapters the student sees the whole
paragraph: earlier gaps already filled in, the active gap as "___", later
gaps as "…".

Answer-key corrections versus the handout:
  * EJ imperfecto 6, item 6: "escuchaban" (not "hablaban": you listen to a conversation)
  * EJ imperfecto 6: removed the non-existent 10th answer "edificios"
  * EJ imperfecto 2: "íbamos" (typo "íabmos")
  * Blanca Nieves: "sirvió" (not "servió"), "se sentó" (not "se sintió"),
    "le sentaba" (not "asentaba"), "vio" (modern spelling, no accent)
  * Futbolista: "la FIFA", "Balón de Oro"; birth date 18 September (not 22);
    the extra info about Georgina / Riyadh is about Cristiano Ronaldo, so it is left out
  * EJ imperfecto 6: "verano" (typo "verando")

Usage:  python gen_seed_02_es_pasado_exercises.py > seed_02_es_pasado_exercises.sql
"""

import json
import re

SKILL = {"c": "preterito_compuesto", "i": "imperfecto", "d": "indefinido"}

# Dutch feedback per tense, shown after a gap is answered
FEEDBACK = {
    "preterito_compuesto": "Pretérito compuesto: haber + voltooid deelwoord. De actie hangt samen met vandaag of met nu.",
    "imperfecto": "Imperfecto: beschrijving, gewoonte of een actie die nog bezig was.",
    "indefinido": "Indefinido: een afgeronde actie op een bepaald moment in het verleden.",
}

TENSE_OPTIONS = ["preterito_compuesto", "imperfecto", "indefinido"]

# ---------------------------------------------------------------------
# Stories: slug -> title
# ---------------------------------------------------------------------
STORIES = [
    ("viaje-complicado",   "Un viaje complicado", 1),
    ("lavadero",           "Todo ha cambiado... y los recuerdos quedan", 2),
    ("apartamento-monica", "El apartamento de Mónica", 3),
    ("abuela-luisa",       "La biografía de la abuela de Luisa", 4),
    ("futbolista",         "Datos biográficos de un futbolista", 5),
    ("blanca-nieves",      "Blanca Nieves", 6),
    ("tortuga-elefante",   "La fábula de la tortuga y el elefante", 7),
]

# ---------------------------------------------------------------------
# Gap groups: each paragraph may hold one or more gaps
#   ref      prefix for source_ref (traceability to the handout)
#   skill    default tense code for every gap in the group
#   story    story slug, or None for loose sentences
# ---------------------------------------------------------------------
GAP_GROUPS = [
    # --- Pretérito compuesto -------------------------------------------
    {"ref": "p11 compuesto EJ1", "skill": "c", "story": None, "paragraphs": [
        "Yo [[visitar|he visitado]] muchos países este año.",
        "¿Tú [[ir|has ido]] alguna vez a Francia?",
        "Mi familia y yo [[hacer|hemos hecho]] una excursión al campo este fin de semana.",
        "Ellos [[reservar|han reservado]] un hotel en el centro de Madrid.",
        "¿Vosotros [[probar|habéis probado]] la comida típica de México?",
    ]},
    {"ref": "p11 compuesto EJ2", "skill": "c", "story": "viaje-complicado", "paragraphs": [
        "Este fin de semana, mis amigos y yo [[decidir|hemos decidido]] hacer un viaje a la montaña. "
        "Pero desde el principio, las cosas no [[salir|han salido]] como esperábamos.",
        "Primero, Pedro [[olvidar|ha olvidado]] su mochila en casa. Después, nosotros [[perder|hemos perdido]] "
        "el autobús porque el taxi [[llegar|ha llegado]] tarde. Cuando por fin [[llegar, nosotros|hemos llegado]] "
        "a la estación, el autobús ya se había ido.",
        "Entonces, llamamos a Marta, que ya estaba en la montaña, pero ella no [[contestar|ha contestado]] el teléfono. "
        "Además, nosotros [[tener|hemos tenido]] que esperar dos horas hasta el siguiente autobús.",
        "Durante el viaje, el tiempo tampoco [[ayudar|ha ayudado]]: ¡[[llover|ha llovido]] todo el día! "
        "Y para terminar, yo [[mojarse|me he mojado]] los pies porque mis botas tenían un agujero.",
        "Definitivamente, este viaje no [[ser|ha sido]] lo que imaginábamos.",
    ]},
    {"ref": "p11 compuesto EJ3", "skill": "c", "story": None, "paragraphs": [
        "(yo / ver / la Torre Eiffel) → [[ver, yo|he visto]] la Torre Eiffel.",
        "(ella / subir / a un volcán) → Ella [[subir|ha subido]] a un volcán.",
        "(ellos / descubrir / una ciudad nueva) → Ellos [[descubrir|han descubierto]] una ciudad nueva.",
        "(tú / perder / el pasaporte) → [[perder, tú|has perdido]] el pasaporte.",
        "(nosotros / hacer / muchas fotos) → [[hacer, nosotros|hemos hecho]] muchas fotos.",
    ]},

    # --- Imperfecto ----------------------------------------------------
    {"ref": "p13 imperfecto EJ2", "skill": "i", "story": None, "paragraphs": [
        "¿Dónde vivía usted antes? — (Yo) [[vivir|vivía]] en el pueblo.",
        "¿A qué hora salías de la escuela? — (Yo) [[salir|salía]] a las 12.",
        "¿Cuántos años tenías en 1942? — (Yo) [[tener|tenía]] cinco años.",
        "¿Dónde trabajaban ellos antes? — (Ellos) [[trabajar|trabajaban]] en la fábrica textil.",
        "¿Adónde ibais a veranear? — (Nosotros) [[ir|íbamos]] al mar.",
        "¿Cómo era tu abuelo? — (Él) [[ser|era]] simpático.",
        "¿Quién os invitaba los domingos? — Mi tío Felipe nos [[invitar|invitaba]] los domingos.",
        "¿Dónde os bañabais en las vacaciones? — (Nosotros) [[bañarse|nos bañábamos]] en el mar.",
        "¿Cuántos cigarrillos fumabas antes? — (Yo) [[fumar|fumaba]] dos cajetillas.",
        "¿Qué vida llevaban ustedes en el pueblo? — (Nosotros) [[llevar|llevábamos]] una vida tranquila.",
    ]},
    {"ref": "p14 imperfecto EJ3.1", "skill": "i", "story": None, "paragraphs": [
        "Él ahora apenas fuma. → Antes [[fumar|fumaba]] más.",
        "Apenas vamos al cine. → Antes [[ir, nosotros|íbamos]] más al cine.",
        "Ella apenas lee. → Antes [[leer|leía]] más.",
        "Ellos apenas duermen. → Antes [[dormir|dormían]] más.",
        "Vosotros ahora apenas nos visitáis. → Antes nos [[visitar|visitabais]] más.",
        "Usted ahora apenas nos escribe. → Antes nos [[escribir|escribía]] más.",
        "Nosotros ahora apenas salimos de casa. → Antes [[salir|salíamos]] más de casa.",
        "Tú ahora apenas haces deporte. → Antes [[hacer|hacías]] más deporte.",
        "Él ahora apenas nos llama por teléfono. → Antes nos [[llamar|llamaba]] más por teléfono.",
        "Yo ahora apenas voy al teatro. → Antes [[ir|iba]] más al teatro.",
    ]},
    {"ref": "p14 imperfecto EJ3.2", "skill": "i", "story": None, "paragraphs": [
        "Ahora no como en casa. → Antes [[comer|comía]] en casa.",
        "Ahora nado muy poco. → Antes [[nadar|nadaba]] más.",
        "Ya no vamos a esquiar. → Antes [[ir|íbamos]] a esquiar.",
        "Él ya no bebe. → Antes [[beber|bebía]].",
        "Ahora él es millonario. → Antes no [[ser|era]] millonario.",
        "Ella ya tiene coche. → Antes no [[tener|tenía]] coche.",
        "Ahora vosotros venís muy poco a verme. → Antes [[venir|veníais]] más a verme.",
        "Usted trabaja mucho. → Antes [[trabajar|trabajaba]] menos.",
        "Ahora vemos muy poco la televisión. → Antes [[ver|veíamos]] más la televisión.",
    ]},
    {"ref": "p15 imperfecto EJ4", "skill": "i", "story": "lavadero", "paragraphs": [
        "Cuando mi abuela [[hablar|hablaba]] del progreso y de la tecnología siempre [[contar|contaba]] que cuando "
        "ella [[ser|era]] pequeña, su madre y todas las mujeres [[ir|iban]] a la plaza del pueblo para lavar la ropa. "
        "Allí [[haber|había]] un lavadero público. Las mujeres [[tener|tenían]] mucho trabajo. "
        "Por eso las lavadoras automáticas son realmente un progreso.",
        "Los lavaderos públicos [[ser|eran]] también un lugar de reunión, donde las mujeres "
        "[[encontrarse|se encontraban]] para hablar entre ellas y a veces [[cantar|cantaban]] canciones que les "
        "[[gustar|gustaban]] mucho a los niños. El lavadero público todavía existe hoy y es como un monumento en el pueblo.",
    ]},
    {"ref": "p15 imperfecto EJ5", "skill": "i", "story": "apartamento-monica", "paragraphs": [
        "Hola Nieves: Quiero recomendarte el apartamento que alquilamos el año pasado. A ti te va a gustar también. "
        "No [[ser|era]] muy grande, pero [[tener|tenía]] todo lo necesario. [[tener|tenía]] un solo dormitorio, "
        "pero en el salón [[haber|había]] un sofá-cama muy cómodo.",
        "Los muebles no me [[gustar|gustaban]] mucho, pero [[ser|eran]] muy prácticos. El salón [[dar|daba]] "
        "a un jardín bonito donde [[haber|había]] muchos árboles.",
        "El lugar [[ser|era]] muy tranquilo y la playa [[estar|estaba]] solo a 10 minutos a pie. "
        "Todo [[estar|estaba]] incluido en el precio del alquiler y el servicio de limpieza [[ser|era]] excelente. "
        "Un beso, Mónica",
    ]},

    # --- Indefinido ----------------------------------------------------
    {"ref": "p18 indefinido EJ2", "skill": "d", "story": None, "paragraphs": [
        "¿Cuándo [[estar, tú|estuviste]] en casa de tus abuelos por última vez?",
        "¿Cuándo [[hacer, tú|hiciste]] una fiesta en tu casa por última vez?",
        "¿Cuándo [[ir, tú|fuiste]] de vacaciones por última vez?",
        "¿Cuándo [[tener, tú|tuviste]] que reparar algo en tu casa por última vez?",
        "¿Cuándo no [[poder, tú|pudiste]] dormir en toda la noche por última vez?",
        "¿Cuándo [[poner, tú|pusiste]] la calefacción por última vez?",
        "¿Cuándo [[ver, tú|viste]] un partido de fútbol en la tele por última vez?",
    ]},
    {"ref": "p19 indefinido EJ3", "skill": "d", "story": "abuela-luisa", "paragraphs": [
        "Amalia, la abuela de Luisa, [[nacer|nació]] en Guadix, donde también [[nacer|nacieron]] sus cuatro hijos. "
        "El marido de Amalia [[morir|murió]] muy joven y ella [[tener|tuvo]] que trabajar mucho para sobrevivir.",
        "Primero [[trabajar|trabajó]] como panadera e [[hacer|hizo]] el pan para todo el pueblo. Pero no "
        "[[tener|tuvo]] suerte ni con ese trabajo ni con la tienda que [[abrir|abrió]] más tarde. "
        "Así que después de unos años [[irse|se fue]] con su familia a vivir a Cataluña.",
        "Allí [[encontrar|encontró]] trabajo en una fábrica textil. Pero Encina, la madre de Luisa, no "
        "[[adaptarse|se adaptó]] a la nueva situación y [[ponerse|se puso]] enferma. Por eso [[volver|volvió]] "
        "al pueblo y [[quedarse|se quedó]] allí tres meses. Al final [[hacer|hizo]] su vida en Cataluña y "
        "durante más de veinte años no [[volver|volvió]] al pueblo.",
    ]},
    {"ref": "p20 indefinido EJ4", "skill": "d", "story": None, "paragraphs": [
        "Oye, ¿a qué hora [[levantarse, tú|te levantaste]] por la mañana?",
        "¿Qué [[hacer, tú|hiciste]] durante la mañana?",
        "¿Al mediodía [[almorzar, tú|almorzaste]] solo/a?",
        "Por la tarde, ¿[[dar, tú|diste]] un paseo?",
        "¿Qué tiempo [[hacer|hizo]]?",
        "¿[[tener, tú|tuviste]] visita de amigos o familiares?",
        "¿[[ver, tú|viste]] algo en la tele?",
        "¿A qué hora [[acostarse, tú|te acostaste]]?",
    ]},
    {"ref": "p20 indefinido EJ5", "skill": "d", "story": "futbolista", "paragraphs": [
        "1976: [[nacer|nació]] el 18 de septiembre en uno de los barrios pobres de Río de Janeiro.",
        "1993: Con 17 años ya [[ser|fue]] jugador de la Selección de Brasil.",
        "1994: Brasil [[ganar|ganó]] el Mundial y el PSV Eindhoven lo [[contratar|contrató]].",
        "1996: [[pasar|pasó]] al FC Barcelona y la FIFA lo [[nombrar|nombró]] mejor jugador del mundo.",
        "1997: Con el Barcelona [[ganar|ganó]] la Recopa de Europa. Ese mismo año [[recibir|recibió]] el Balón de Oro "
        "como mejor futbolista europeo y la Bota de Oro como máximo goleador europeo. "
        "[[ser elegido|fue elegido]] otra vez mejor jugador del mundo.",
        "1998: Su nuevo club, el Inter de Milán, [[ganar|ganó]] la Copa de la UEFA.",
        "1999: [[comenzar|comenzaron]] sus problemas de salud y durante dos años [[poder|pudo]] jugar pocos partidos.",
        "2002: [[jugar|jugó]] en el Mundial, que [[ganar|ganó]] con Brasil. [[empezar|empezó]] a jugar en el "
        "Real Madrid. [[recibir|recibió]] su segundo Balón de Oro y [[ser|fue]] por tercera vez el mejor jugador del mundo.",
    ]},

    # --- Mezclados: Blanca Nieves (tense per gap) -------------------------
    {"ref": "p25 mezclados EJ7", "skill": None, "story": "blanca-nieves", "paragraphs": [
        "En aquel momento, la joven Blanca Nieves [[estar|estaba|i]] tan hambrienta y sedienta que ella "
        "[[tomar|tomó|d]] y [[comer|comió|d]] inmediatamente un poquito de verduras y pan de cada plato y después "
        "[[beber|bebió|d]] una gota de vino de cada jarrita, porque no [[desear|deseaba|i]] coger todo de un mismo plato y jarra.",
        "Entonces, al estar tan cansada, [[tratar|trató|d]] de acomodarse en alguna camita, pero como "
        "[[ir|iba|i]] probando, ninguna le [[sentar|sentaba|i]] bien, hasta que [[llegar|llegó|d]] a la última que "
        "sí le sirvió y ahí se [[quedar|quedó|d]]. Dijo su oración y [[acomodarse|se acomodó|d]] a dormir.",
        "Cuando ya [[hacer|hacía|i]] oscuro, [[regresar|regresaron|d]] los dueños de la cabaña. [[ser|eran|i]] "
        "siete enanos que desde hacía años [[cavar|cavaban|i]] y [[extraer|extraían|i]] oro y piedras preciosas en "
        "las montañas. Al entrar en su casita, [[encender|encendieron|d]] sus siete candelas, y con su luz "
        "[[observar|observaron|d]] que alguien había estado allí porque las cosas no [[estar|estaban|i]] en el "
        "orden en que las [[acostumbrar|acostumbraban|i]] tener.",
        "El primero dijo: «¿Quién se sentó en mi silla?» Y el segundo: «¿Quién [[comer|comió|d]] de mi plato?» "
        "El tercero: «¿Quién [[coger|cogió|d]] parte de mi pan?» El cuarto: «¿Quién [[tomar|tomó|d]] parte de mis "
        "verduras?» El quinto: «¿Quién [[utilizar|utilizó|d]] mi tenedor?» El sexto: «¿Quién comió con mi cuchillo?» "
        "Y el séptimo: «¿Quién [[beber|bebió|d]] de mi vaso?»",
        "Entonces el primero [[observar|observó|d]] alrededor y [[ver|vio|d]] de repente que [[haber|había|i]] "
        "un pequeño hundimiento en su cama y dijo: «¿Quién se ha metido en mi cama?» Y después los demás "
        "[[ir|fueron|d]] a revisar sus camas. Pero cuando el séptimo [[mirar|miró|d]] en su cama, vio a Blanca "
        "Nieves, que [[dormir|dormía|i]] profundamente allí. Y [[llamar|llamó|d]] entonces a los demás. Los siete "
        "enanos [[llegar|llegaron|d]] corriendo, suspiraron con asombro y después [[traer|trajeron|d]] sus siete "
        "candelas para alumbrar mejor a la joven Blanca Nieves.",
    ]},
]

# ---------------------------------------------------------------------
# Marker detective: pick the tense from the marker, then the form is shown
# (sentence, label, form, marker, tense code, Dutch explanation)
# ---------------------------------------------------------------------
MARKER_ITEMS = [
    ("Esta mañana ___ un bol de cereales.", "desayunar, yo", "he desayunado", "esta mañana", "c",
     "'Esta mañana' begint met este/esta: verbonden met vandaag → pretérito compuesto."),
    ("Aquella noche, cuando todos ___, de repente empezó una tempestad.", "dormir", "dormían", "cuando", "i",
     "De eerste actie die al bezig was (iedereen sliep) → imperfecto."),
    ("Aquella noche, cuando todos dormían, de repente ___ una horrible tempestad.", "empezar", "empezó", "de repente", "d",
     "'De repente': de tweede actie onderbreekt de eerste → indefinido."),
    ("En el año 1904 ___ Salvador Dalí.", "nacer", "nació", "en el año 1904", "d",
     "Een exacte datum → indefinido."),
    ("Hizo amistad con el explorador que se ___ Tomás.", "llamar", "llamaba", "sustantivo + que", "i",
     "Zelfstandig naamwoord + que beschrijft dat naamwoord → imperfecto."),
    ("Ayer ___ muchos deberes de casa.", "hacer, yo", "hice", "ayer", "d",
     "'Ayer' (gisteren) is een afgesloten moment → indefinido."),
    ("Primero ___ los platos, luego pasé la aspiradora.", "lavar, yo", "lavé", "primero", "d",
     "Opeenvolgende acties (primero, luego...) → indefinido."),
    ("Antes ___ al fútbol todos los sábados.", "jugar, yo", "jugaba", "antes", "i",
     "'Antes' (vroeger) + gewoonte → imperfecto."),
    ("De niños, siempre ___ jugando en la calle.", "estar, nosotros", "estábamos", "siempre", "i",
     "'Siempre' (altijd) wijst op een gewoonte → imperfecto."),
    ("¿___ alguna vez a Francia?", "ir, tú", "has ido", "alguna vez", "c",
     "'Alguna vez' (ooit) tot nu toe → pretérito compuesto."),
    ("Este año ___ un apartamento en la playa.", "alquilar, yo", "he alquilado", "este año", "c",
     "'Este año' begint met este: verbonden met nu → pretérito compuesto."),
    ("El lunes pasado ___ un anuncio para buscar piso.", "poner, yo", "puse", "el lunes pasado", "d",
     "'El lunes pasado' is een afgesloten moment → indefinido."),
    ("Hoy ___ las llaves de la casa para las vacaciones.", "recoger, yo", "he recogido", "hoy", "c",
     "'Hoy' (vandaag) → pretérito compuesto."),
    ("El año pasado ___ mala suerte con el hotel.", "tener, yo", "tuve", "el año pasado", "d",
     "'El año pasado' is afgesloten → indefinido."),
    ("Todos los días mi abuela ___ a la plaza.", "ir", "iba", "todos los días", "i",
     "'Todos los días' (elke dag) is een gewoonte → imperfecto."),
    ("Hace tres años ___ a Perú.", "viajar, nosotros", "viajamos", "hace tres años", "d",
     "'Hace x años' (x jaar geleden) → indefinido."),
    ("Todavía no ___ los deberes.", "terminar, yo", "he terminado", "todavía no", "c",
     "'Todavía no' (nog altijd niet) heeft een band met nu → pretérito compuesto."),
    ("No fui a la fiesta porque ___ muy cansada.", "estar, yo", "estaba", "porque", "i",
     "'Porque' + imperfecto geeft uitleg over de situatie → imperfecto."),
    ("Anoche ___ una película en Netflix.", "ver, yo", "vi", "anoche", "d",
     "'Anoche' (gisteravond) is afgesloten → indefinido."),
    ("Nunca ___ sushi. ¿Está bueno?", "comer, yo", "he comido", "nunca", "c",
     "'Nunca' (nooit) tot nu toe → pretérito compuesto."),
]

# ---------------------------------------------------------------------
# Fable: which tense is the bold verb? (sentence, tense code, Dutch explanation)
# ---------------------------------------------------------------------
FABLE_ITEMS = [
    ("Se **encontraron** en el camino y decidieron caminar juntos.", "d",
     "Een afgeronde actie in het verhaal → indefinido."),
    ("Decidieron caminar juntos porque **era** más agradable.", "i",
     "'Porque' + imperfecto geeft uitleg → imperfecto."),
    ("A los dos les **gustaba** hacer las cosas de una manera lenta y sincera.", "i",
     "Beschrijving van hoe ze waren → imperfecto."),
    ("En un momento dado **vieron** una montaña alta.", "d",
     "Een punctuele gebeurtenis → indefinido."),
    ("De repente **surgió** una puerta en mitad del camino.", "d",
     "'De repente' → indefinido."),
    ("Pensó que no podía seguir porque **estaba** solo.", "i",
     "'Porque' + imperfecto: uitleg over de situatie → imperfecto."),
    ("Ya era medianoche, la luna llena **brillaba** en el firmamento.", "i",
     "Beschrijving van de omgeving → imperfecto."),
    ("El elefante, cansado pero feliz, **llegó** al pico de la montaña.", "d",
     "Afgeronde actie → indefinido."),
    ("Mientras la tortuga **estaba** disfrutando dentro de su cáscara...", "i",
     "Een actie die bezig was → imperfecto."),
    ("Después de muchas horas el elefante **empezó** a aburrirse.", "d",
     "Opeenvolgende actie in het verhaal → indefinido."),
    ("Tuviste una oportunidad única y no **has tomado** la oportunidad.", "c",
     "Emotioneel verbonden met nu → pretérito compuesto."),
    ("Colorín colorado, el cuento se **ha acabado**.", "c",
     "Net gebeurd, relevant voor nu → pretérito compuesto."),
]

# ---------------------------------------------------------------------
# Imperfecto EJ6: choose between two words (text, options, answer)
# ---------------------------------------------------------------------
CHOICE_ITEMS = [
    ("Mi familia contaba que antes, en el barrio donde ellos ___ ...", ["eran", "vivían"], "vivían"),
    ("...en las noches de verano toda la gente ___ sentada delante de las puertas...", ["estaba", "está"], "estaba"),
    ("...delante de las puertas de ___ casas y conversaba con los vecinos.", ["suyas", "sus"], "sus"),
    ("Los niños también ___ hasta muy tarde.", ["eran", "se quedaban"], "se quedaban"),
    ("Ellos ___ en la calle...", ["jugaban", "juegan"], "jugaban"),
    ("...o ___ las conversaciones de los adultos.", ["hablaban", "escuchaban"], "escuchaban"),
    ("Hoy en día, cuando ___ por esa calle...", ["pasó", "paso"], "paso"),
    ("...me ___ increíble.", ["parece", "parecen"], "parece"),
    ("Hoy ___ una calle con mucho tráfico y muchos edificios modernos y enormes.", ["está", "es"], "es"),
]

# Mezclados EJ2: match sentence numbers to letters
MATCH_ITEM = {
    "left": [
        "1. Este año ___ un apartamento en la playa.",
        "2. El lunes pasado ___ un anuncio para buscar piso.",
        "3. Hoy ___ las llaves de la casa para las vacaciones.",
        "4. El año pasado ___ mala suerte con el hotel en las vacaciones.",
        "5. Este fin de semana ___ a la costa con Marta de cámping.",
        "6. En mayo ___ una excursión a la montaña con toda la familia.",
        "7. En las últimas vacaciones ___ a las Baleares solo.",
        "8. Ayer ___ de mis vacaciones de invierno.",
    ],
    "right": ["a) volví", "b) he recogido", "c) he alquilado", "d) he ido",
              "e) hice", "f) puse", "g) fui", "h) tuve"],
    "answer": "1c,2f,3b,4h,5d,6e,7g,8a",
}

# ---------------------------------------------------------------------
# Builders
# ---------------------------------------------------------------------
TOKEN = re.compile(r"\[\[([^|\]]+)\|([^|\]]+)(?:\|([cid]))?\]\]")


def gap_exercises(group):
    """Turn every [[label|answer]] token into one exercise row."""
    rows = []
    is_story = group["story"] is not None
    order = 0
    for chapter, para in enumerate(group["paragraphs"], start=1):
        tokens = list(TOKEN.finditer(para))
        for k, tok in enumerate(tokens):
            order += 1

            # Render the paragraph for the active gap k
            parts, last = [], 0
            for j, m in enumerate(tokens):
                parts.append(para[last:m.start()])
                label, answer = m.group(1), m.group(2)
                if j < k:
                    parts.append(answer)                 # already answered
                elif j == k:
                    parts.append(f"___ ({label})")       # active gap
                else:
                    parts.append(f"… ({label})")         # still to come
                last = m.end()
            parts.append(para[last:])
            text = "".join(parts)
            # Capitalise a sentence-initial filled-in answer for display
            # (only at the start of a sentence, not after a mid-sentence ¡ or ¿)
            text = re.sub(r"(^[¡¿]?|[.!?»]\s+[¡¿]?)([a-záéíóú])",
                          lambda m: m.group(1) + m.group(2).upper(), text)

            skill = SKILL[tok.group(3)] if tok.group(3) else SKILL.get(group["skill"])
            prompt = {"text": text, "label": tok.group(1)}
            if is_story:
                prompt["chapter"] = chapter
            rows.append({
                "skill": skill, "story": group["story"],
                "type": "story_gap" if is_story else "gap_fill",
                "prompt": prompt, "answer": tok.group(2).lower(),
                "hint": None, "feedback": FEEDBACK.get(skill),
                "difficulty": 2 if is_story else 1, "order": order,
                "ref": f"{group['ref']} #{order}",
            })
    return rows


def marker_exercises():
    rows = []
    for n, (text, label, form, marker, code, expl) in enumerate(MARKER_ITEMS, start=1):
        rows.append({
            "skill": SKILL[code], "story": None, "type": "marker_choice",
            "prompt": {"text": text.replace("___", f"___ ({label})"), "marker": marker,
                       "options": TENSE_OPTIONS, "form": form},
            "answer": SKILL[code], "hint": f"Zoek de tijdsaanduiding: '{marker}'.",
            "feedback": f"{expl} De vorm is: {form}.", "difficulty": 2, "order": n,
            "ref": f"marker-detective #{n}",
        })
    return rows


def fable_exercises():
    rows = []
    for n, (text, code, expl) in enumerate(FABLE_ITEMS, start=1):
        rows.append({
            "skill": SKILL[code], "story": "tortuga-elefante", "type": "multiple_choice",
            "prompt": {"text": text, "question_nl": "In welke tijd staat het vetgedrukte werkwoord?",
                       "options": TENSE_OPTIONS},
            "answer": SKILL[code], "hint": None, "feedback": expl,
            "difficulty": 3, "order": n, "ref": f"p27 mezclados EJ8 #{n}",
        })
    return rows


def choice_exercises():
    rows = []
    for n, (text, options, answer) in enumerate(CHOICE_ITEMS, start=1):
        rows.append({
            "skill": None, "story": None, "type": "multiple_choice",
            "prompt": {"text": text, "options": options},
            "answer": answer, "hint": None, "feedback": None,
            "difficulty": 1, "order": n, "ref": f"p16 imperfecto EJ6 #{n}",
        })
    return rows


def extra_exercises():
    return [
        {"skill": None, "story": None, "type": "match",
         "prompt": {"left": MATCH_ITEM["left"], "right": MATCH_ITEM["right"]},
         "answer": MATCH_ITEM["answer"], "hint": "Let op de tijdsaanduidingen: este/hoy of pasado/ayer?",
         "feedback": "Este año, hoy, este fin de semana → compuesto. Pasado, ayer, en mayo → indefinido.",
         "difficulty": 2, "order": 1, "ref": "p21 mezclados EJ2"},
        {"skill": None, "story": "futbolista", "type": "multiple_choice",
         "prompt": {"text": "¿De quién es la biografía?",
                    "options": ["Ronaldo Nazário", "Cristiano Ronaldo", "Ronaldinho"]},
         "answer": "ronaldo nazário", "hint": None,
         "feedback": "Ronaldo Nazário: PSV, Barcelona, Inter en Real Madrid, wereldkampioen in 2002.",
         "difficulty": 1, "order": 99, "ref": "p21 indefinido EJ5 conclusión"},
    ]


# ---------------------------------------------------------------------
# SQL output
# ---------------------------------------------------------------------
def q(v):
    if v is None:
        return "null"
    if isinstance(v, (dict, list)):
        v = json.dumps(v, ensure_ascii=False)
    return "'" + str(v).replace("'", "''") + "'"


def main():
    rows = []
    for g in GAP_GROUPS:
        rows += gap_exercises(g)
    rows += marker_exercises() + fable_exercises() + choice_exercises() + extra_exercises()

    # Sanity check: source_ref must be unique (used for idempotency)
    refs = [r["ref"] for r in rows]
    assert len(refs) == len(set(refs)), "duplicate source_ref"

    out = [
        "-- =====================================================================",
        "-- Seed 02: Spanish past tenses — sentence, story and tense-choice exercises",
        "-- Generated by gen_seed_02_es_pasado_exercises.py. Safe to re-run.",
        f"-- {len(STORIES)} stories, {len(rows)} exercises",
        "-- =====================================================================\n",
        "insert into stories (topic_id, slug, title, sort_order)",
        "select t.id, d.slug, d.title, d.ord from (values",
        ",\n".join(f"  ({q(s)}, {q(t)}, {o})" for s, t, o in STORIES),
        ") as d(slug, title, ord)",
        "join topics t on t.slug = 'tiempos-del-pasado' and t.language_code = 'es'",
        "on conflict (topic_id, slug) do nothing;\n",
        "insert into exercises (topic_id, skill_id, story_id, type, prompt, correct_answer,",
        "                       hint_nl, feedback_nl, difficulty, sort_order, source_ref)",
        "select t.id, s.id, st.id, d.type::exercise_type, d.prompt::jsonb, d.answer,",
        "       d.hint, d.feedback, d.diff, d.ord, d.ref",
        "from (values",
        ",\n".join(
            f"  ({q(r['skill'])}, {q(r['story'])}, {q(r['type'])}, {q(r['prompt'])}, {q(r['answer'])}, "
            f"{q(r['hint'])}, {q(r['feedback'])}, {r['difficulty']}, {r['order']}, {q(r['ref'])})"
            for r in rows),
        ") as d(skill, story, type, prompt, answer, hint, feedback, diff, ord, ref)",
        "join topics t on t.slug = 'tiempos-del-pasado' and t.language_code = 'es'",
        "left join skills  s  on s.topic_id  = t.id and s.slug  = d.skill",
        "left join stories st on st.topic_id = t.id and st.slug = d.story",
        "where not exists (select 1 from exercises e where e.topic_id = t.id and e.source_ref = d.ref);",
    ]
    print("\n".join(out))


if __name__ == "__main__":
    main()
