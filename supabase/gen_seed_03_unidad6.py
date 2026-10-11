"""
Generate seed SQL for Unidad 6 "¡Vamos de viaje!" (GO! KLA 6SP).

Sources merged:
  * the official vocabulary list in the course (p. 32–34)
  * the Canarias vocabulary list (p. 29)
  * the student's handwritten lists (4 pages)

Variants are separated by "|": the first one is the main answer,
the others are also accepted. Example: "de koffer|de valies".

Corrections versus the sources:
  * official list: "la vuelta = de heenreis" → "el viaje de vuelta = de terugreis"
    (ida = heenreis, vuelta = terugreis)
  * handwritten: "caro = goedkoop / barato = duur" were swapped
  * handwritten: "un monedero = portefeuille" → "de portemonnee"
    (cartera = portefeuille)
  * p. 29: "la escazes" → "la escasez"
  * "con retraso" (met vertraging) and "retrasado/a" (vertraagd) get different
    Dutch so NL→ES has one clear answer

Usage:  python gen_seed_03_unidad6.py > seed_03_unidad6.sql
"""

import json

TOPIC = ("es", "unidad-6", "Unidad 6: ¡Vamos de viaje!", "GO! KLA 6SP – Unidad 6")

# (term_es, term_nl, note_nl) per chapter part (Dutch label)
VOCAB = {
    "Op reis": [
        ("el aeropuerto", "de luchthaven", None),
        ("la estación de trenes", "het treinstation", None),
        ("el destino", "de bestemming", None),
        ("la búsqueda", "de zoektocht", None),
        ("la compañía de vuelo|la compañía aérea", "de vliegtuigmaatschappij", None),
        ("la aerolínea", "de luchtvaartmaatschappij", None),
        ("la llegada", "de aankomst", None),
        ("la salida", "het vertrek", None),
        ("la puerta de embarque", "de gate", None),
        ("la RENFE", "de Spaanse NMBS", "la red nacional de ferrocarriles españoles"),
        ("la tarifa", "het tarief", None),
        ("el viaje de ida", "de heenreis", None),
        ("el viaje de vuelta", "de terugreis", None),
        ("salir", "vertrekken", "salir <-> llegar"),
        ("llegar", "aankomen", "salir <-> llegar"),
        ("salir a tiempo", "op tijd vertrekken", None),
        ("retrasado|retrasada", "vertraagd", None),
        ("con retraso", "met vertraging", None),
        ("la última llamada", "de last call|de laatste oproep", None),
        ("el vuelo", "de vlucht", None),
        ("el vuelo de conexión", "de aansluitende vlucht", None),
        ("la fecha", "de datum", None),
        ("el precio", "de prijs", None),
        ("la maleta", "de koffer|de valies", None),
        ("el equipaje", "de bagage", None),
        ("la cinta de equipaje", "de bagageband", None),
        ("el mostrador", "de balie", None),
        ("el avión", "het vliegtuig", None),
        ("el coche", "de auto", None),
        ("la ciudad", "de stad", None),
        ("el alojamiento", "het logement|de accommodatie", None),
        ("caro|cara", "duur", None),
        ("barato|barata", "goedkoop", None),
        ("inolvidable", "onvergetelijk", None),
        ("el seguro de viaje", "de reisverzekering", None),
        ("el turista|la turista", "de toerist", None),
        ("el extranjero", "de buitenlander", None),
        ("perder", "verliezen|missen", None),
        ("cancelar", "annuleren|afzeggen", None),
        ("pesar", "wegen", None),
        ("cobrar", "aanrekenen", None),
        ("devolver", "teruggeven", None),
        ("la paciencia", "het geduld", None),
        ("pedir disculpas", "zich excuseren", None),
        ("vale", "oké", None),
        ("ayudar", "helpen", None),
        ("la última hora", "het laatste nippertje", "No lo dejes para última hora."),
    ],
    "Problemen op reis": [
        ("robar", "stelen", None),
        ("la cartera", "de portefeuille", None),
        ("el monedero", "de portemonnee", None),
        ("el efectivo", "het cash|het contant geld", None),
        ("el mosquito", "de mug", None),
        ("picar", "steken", None),
        ("rascar", "krabben", None),
        ("repleto de insectos", "vol insecten", None),
        ("quemar", "verbranden", None),
        ("aliviar el dolor", "de pijn verzachten", None),
        ("el protector solar", "de zonnecrème", None),
        ("bañar", "baden|zwemmen", None),
        ("el champú", "de shampoo", None),
        ("cubrir", "dekken", "de verzekering dekt de kosten"),
        ("echar un vistazo", "een kijkje nemen", None),
        ("vomitar", "overgeven", None),
        ("nunca", "nooit", None),
        ("alguna vez", "ooit|een keer", None),
        ("todavía no", "nog niet", None),
    ],
    "In het hotel": [
        ("la toalla", "de handdoek", None),
        ("hacer la cama", "het bed opmaken", None),
        ("la cortina", "het gordijn", None),
        ("estar sucio|estar sucia", "vuil zijn", None),
        ("quedar", "overblijven|blijven", "no queda = er is niets meer"),
        ("estar lleno|estar llena", "vol zijn", None),
        ("faltar", "ontbreken", None),
        ("estar roto|estar rota", "kapot zijn", None),
        ("funcionar", "werken", "voor toestellen"),
        ("no funciona|no funcionan", "het werkt niet", None),
        ("estar desenchufado|estar desenchufada", "niet aangesloten zijn", None),
        ("el ruido", "het lawaai|het geluid", None),
        ("el cubo de la basura", "de vuilnisemmer", None),
        ("el espejo", "de spiegel", None),
        ("la bombilla", "de gloeilamp", None),
        ("el papel higiénico", "het wc-papier", None),
        ("el recepcionista|la recepcionista", "de receptionist", None),
        ("la queja", "de klacht", None),
        ("la propuesta", "het voorstel", None),
        ("la solución", "de oplossing", None),
        ("proponer", "voorstellen", "1ª p. = propongo"),
        ("disfrutar", "genieten", None),
    ],
    "Formele brief": [
        ("la carta", "de brief", None),
        ("estimado|estimada", "geachte", None),
        ("saludos", "groetjes", None),
        ("atentamente|cordialmente", "hoogachtend", None),
    ],
    "Het geheim (la selva)": [
        ("la aldea", "het gehucht|het dorpje", None),
        ("la predicción", "de voorspelling", None),
        ("la selva", "het oerwoud|het woud|de jungle", None),
        ("la tribu", "de stam", None),
        ("usado|usada", "gebruikt|versleten", None),
        ("enfadarse", "kwaad worden", "regelmatig, wederkerend werkwoord"),
        ("salvar", "redden", None),
    ],
    "Geschiedenis Canarias": [
        ("el siglo", "de eeuw", None),
        ("la isla", "het eiland", None),
        ("el archipiélago", "de eilandengroep", None),
        ("antes de Cristo", "voor Christus", None),
        ("después de Cristo", "na Christus", None),
        ("el poblador", "de kolonist", None),
        ("el ganado", "het vee", None),
        ("surgir", "te voorschijn komen", None),
        ("el escudo", "het wapenschild", None),
        ("aislado|aislada", "geïsoleerd", None),
        ("el aislamiento", "het isolement", None),
        ("el caballero", "de ridder", None),
        ("el dueño", "de eigenaar", None),
        ("conquistar", "veroveren", None),
        ("indígena", "inheems", "oorspronkelijke bewoner van het eiland"),
        ("el gobierno", "de regering", None),
        ("cruel", "wreed", None),
        ("el esclavo", "de slaaf", None),
        ("la caña de azúcar", "het suikerriet", None),
        ("feudal", "feodaal", None),
        ("la constitución", "de grondwet", None),
        ("la cochinilla", "de cochenille|de schildluis|de pissebed", "een insect"),
        ("la guerra civil", "de burgeroorlog", None),
        ("la tortura", "de marteling", None),
        ("la escasez", "de schaarste", None),
        ("la pobreza", "de armoede", None),
    ],
    "Nationaliteiten": [
        ("alemán|alemana", "Duits", None),
        ("belga", "Belgisch", None),
        ("brasileño|brasileña", "Braziliaans", None),
        ("canadiense", "Canadees", None),
        ("chino|china", "Chinees", None),
        ("colombiano|colombiana", "Colombiaans", None),
        ("costarricense", "Costa Ricaans", None),
        ("croata", "Kroatisch", None),
        ("español|española", "Spaans", None),
        ("estadounidense", "Amerikaans", "> los Estados Unidos"),
        ("francés|francesa", "Frans", None),
        ("inglés|inglesa", "Engels", None),
        ("iraní", "Iraans|Iranees", None),
        ("italiano|italiana", "Italiaans", None),
        ("japonés|japonesa", "Japans", None),
        ("marroquí", "Marokkaans", None),
        ("mexicano|mexicana", "Mexicaans", None),
        ("paraguayo|paraguaya", "Paraguayaans", None),
        ("portugués|portuguesa", "Portugees", None),
        ("polaco|polaca", "Pools", None),
        ("turco|turca", "Turks", None),
    ],
}

# Nationalities grammar: masculine → feminine (rule from p. 30)
NATIONALITY_RULE = {
    "consonant": "Mannelijk eindigt op een medeklinker → vrouwelijk + a (en het accent valt weg).",
    "o": "Mannelijk op -o → vrouwelijk op -a.",
    "same": "Eindigt op -e, -í of -a → mannelijk en vrouwelijk zijn hetzelfde.",
}


def display(variants):
    """'la maleta|x' → 'la maleta, x' for showing on screen."""
    return ", ".join(variants.split("|"))


def nationality_rows():
    rows = []
    n = 0
    for es, nl, _ in VOCAB["Nationaliteiten"]:
        parts = es.split("|")
        masc = parts[0]
        fem = parts[1] if len(parts) > 1 else parts[0]
        if fem == masc:
            rule = "same"
        elif masc.endswith("o"):
            rule = "o"
        else:
            rule = "consonant"
        n += 1
        rows.append({
            "skill": "nacionalidades", "type": "gap_fill",
            "prompt": {"text": f"Él es {masc}. → Ella es ___.", "label": f"{nl}, vrouwelijk"},
            "answer": fem, "feedback": NATIONALITY_RULE[rule], "difficulty": 1,
            "order": n, "ref": f"u6 nacionalidades fem #{n}",
        })
        n += 1
        rows.append({
            "skill": "nacionalidades", "type": "gap_fill",
            "prompt": {"text": f"Ella es {fem}. → Él es ___.", "label": f"{nl}, mannelijk"},
            "answer": masc, "feedback": NATIONALITY_RULE[rule], "difficulty": 2,
            "order": n, "ref": f"u6 nacionalidades masc #{n}",
        })
    return rows


def q(v):
    if v is None:
        return "null"
    if isinstance(v, (dict, list)):
        v = json.dumps(v, ensure_ascii=False)
    return "'" + str(v).replace("'", "''") + "'"


def pg_array(items):
    return "array[" + ", ".join(q(i) for i in items) + "]::text[]" if items else "'{}'::text[]"


def main():
    lang, slug, title, source = TOPIC
    vocab_rows = []
    order = 0
    for category, items in VOCAB.items():
        for es, nl, note in items:
            order += 1
            vocab_rows.append((es, nl, category, note, order))

    # Sanity checks: unique Spanish main terms, unique Dutch per category
    mains = [r[0].split("|")[0] for r in vocab_rows]
    assert len(mains) == len(set(mains)), "duplicate Spanish term"

    out = [
        "-- =====================================================================",
        "-- Seed 03: Unidad 6 ¡Vamos de viaje! — vocabulary and nationalities",
        "-- Generated by gen_seed_03_unidad6.py. Run AFTER migration_v1_2_vocab.sql.",
        f"-- {len(vocab_rows)} words → {2 * len(vocab_rows)} vocab exercises (both directions)",
        "-- =====================================================================\n",
        "insert into topics (language_code, slug, title, source, sort_order)",
        f"values ({q(lang)}, {q(slug)}, {q(title)}, {q(source)}, 2)",
        "on conflict (language_code, slug) do nothing;\n",
        "insert into skills (topic_id, slug, title, sort_order)",
        "select t.id, v.slug, v.title, v.ord from topics t,",
        "  (values ('vocabulario', 'Vocabulario', 1), ('nacionalidades', 'Las nacionalidades', 2))",
        "  as v(slug, title, ord)",
        f"where t.slug = {q(slug)} and t.language_code = {q(lang)}",
        "on conflict (topic_id, slug) do nothing;\n",
        "-- Words (display form: variants joined with ', ')",
        "insert into vocab_items (topic_id, term_es, term_nl, category, note_nl, sort_order, source_ref)",
        "select t.id, d.es, d.nl, d.cat, d.note, d.ord, 'u6 vocabulario'",
        "from (values",
        ",\n".join(f"  ({q(display(es))}, {q(display(nl))}, {q(cat)}, {q(note)}, {o})"
                   for es, nl, cat, note, o in vocab_rows),
        ") as d(es, nl, cat, note, ord)",
        f"join topics t on t.slug = {q(slug)} and t.language_code = {q(lang)}",
        "on conflict (topic_id, term_es) do nothing;\n",
    ]

    # Two exercises per word: ES→NL and NL→ES
    ex_values = []
    for es, nl, cat, note, o in vocab_rows:
        es_v, nl_v = es.split("|"), nl.split("|")
        for direction, shown, answers in (("es_nl", es, nl_v), ("nl_es", nl, es_v)):
            prompt = {"direction": direction, "term": display(shown), "category": cat}
            if note:
                prompt["note"] = note
            ex_values.append(
                f"  ({q(display(es))}, {q(prompt)}, {q(answers[0])}, {pg_array(answers[1:])}, "
                f"{o}, {q(f'u6 voca {direction} #{o}')})"
            )
    out += [
        "-- Vocab exercises, both directions",
        "insert into exercises (topic_id, skill_id, vocab_item_id, type, prompt, correct_answer,",
        "                       accepted_answers, difficulty, sort_order, source_ref)",
        "select t.id, s.id, vi.id, 'vocab', d.prompt::jsonb, d.answer, d.accepted, 1, d.ord, d.ref",
        "from (values",
        ",\n".join(ex_values),
        ") as d(es, prompt, answer, accepted, ord, ref)",
        f"join topics t on t.slug = {q(slug)} and t.language_code = {q(lang)}",
        "join skills s on s.topic_id = t.id and s.slug = 'vocabulario'",
        "join vocab_items vi on vi.topic_id = t.id and vi.term_es = d.es",
        "where not exists (select 1 from exercises e where e.topic_id = t.id and e.source_ref = d.ref);\n",
    ]

    # Nationality gender exercises
    nat = nationality_rows()
    out += [
        "-- Nationalities: masculine <-> feminine",
        "insert into exercises (topic_id, skill_id, type, prompt, correct_answer, feedback_nl,",
        "                       difficulty, sort_order, source_ref)",
        "select t.id, s.id, d.type::exercise_type, d.prompt::jsonb, d.answer, d.feedback, d.diff, d.ord, d.ref",
        "from (values",
        ",\n".join(
            f"  ({q(r['type'])}, {q(r['prompt'])}, {q(r['answer'])}, {q(r['feedback'])}, "
            f"{r['difficulty']}, {r['order']}, {q(r['ref'])})" for r in nat),
        ") as d(type, prompt, answer, feedback, diff, ord, ref)",
        f"join topics t on t.slug = {q(slug)} and t.language_code = {q(lang)}",
        "join skills s on s.topic_id = t.id and s.slug = 'nacionalidades'",
        "where not exists (select 1 from exercises e where e.topic_id = t.id and e.source_ref = d.ref);",
    ]
    print("\n".join(out))


if __name__ == "__main__":
    main()
