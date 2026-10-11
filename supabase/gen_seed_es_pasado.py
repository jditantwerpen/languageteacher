"""
Generate seed SQL for the Spanish topic "Los tiempos del pasado".

Builds every conjugated form (6 persons x 3 tenses) for the verbs in the
handout, using regular rules plus explicit irregular overrides, and writes
an idempotent SQL file that can be run in the Supabase SQL Editor.

Usage:  python gen_seed_es_pasado.py > seed_01_es_pasado_verbs.sql
"""

PERSONS = ["1sg", "2sg", "3sg", "1pl", "2pl", "3pl"]

# ---------------------------------------------------------------------
# Verbs from the handout: infinitive -> Dutch translation
# ---------------------------------------------------------------------
VERBS = {
    # regular examples
    "cantar": "zingen", "beber": "drinken", "vivir": "leven, wonen",
    "comer": "eten", "llamar": "bellen, roepen", "salir": "vertrekken, buitengaan",
    # irregular participles
    "abrir": "openen", "cubrir": "bedekken", "decir": "zeggen",
    "descubrir": "ontdekken", "escribir": "schrijven", "hacer": "doen, maken",
    "morir": "sterven", "poner": "leggen, zetten", "resolver": "oplossen",
    "romper": "breken, stuk maken", "ver": "zien", "volver": "terugkeren",
    # indefinido: vowel change e->i / o->u
    "pedir": "vragen, bestellen", "corregir": "verbeteren", "elegir": "kiezen",
    "impedir": "verbieden", "medir": "meten", "repetir": "herhalen",
    "servir": "dienen, opdienen", "seguir": "volgen", "vestir": "kleden",
    "dormir": "slapen",
    # indefinido: verbs with y
    "caer": "vallen", "creer": "geloven, denken", "construir": "bouwen",
    "contribuir": "bijdragen", "destruir": "vernietigen", "leer": "lezen",
    "incluir": "insluiten", "oir": None,  # placeholder, replaced below
    # indefinido: irregular stems
    "dar": "geven", "ir": "gaan", "ser": "zijn", "querer": "willen, houden van",
    "venir": "komen", "convenir": "goed uitkomen", "conducir": "besturen, rijden",
    "producir": "maken, produceren", "reducir": "verminderen", "traer": "brengen",
    "andar": "wandelen", "caber": "passen in", "estar": "zijn, zich bevinden",
    "poder": "kunnen", "saber": "weten, kunnen", "tener": "hebben, bezitten",
}
# oír carries an accent; keep the dict key ASCII-safe above, fix here
VERBS.pop("oir")
VERBS["oír"] = "horen"

# ---------------------------------------------------------------------
# Regular conjugation rules
# ---------------------------------------------------------------------
HABER = ["he", "has", "ha", "hemos", "habéis", "han"]


def ending(inf):
    """Return 'ar', 'er' or 'ir' (oír counts as -ir)."""
    return "ir" if inf.endswith("ír") else inf[-2:]


def stem(inf):
    return inf[:-2]


def regular_participle(inf):
    return stem(inf) + ("ado" if ending(inf) == "ar" else "ido")


def regular_imperfecto(inf):
    s = stem(inf)
    if ending(inf) == "ar":
        return [s + e for e in ["aba", "abas", "aba", "ábamos", "abais", "aban"]]
    return [s + e for e in ["ía", "ías", "ía", "íamos", "íais", "ían"]]


def regular_indefinido(inf):
    s = stem(inf)
    if ending(inf) == "ar":
        return [s + e for e in ["é", "aste", "ó", "amos", "asteis", "aron"]]
    return [s + e for e in ["í", "iste", "ió", "imos", "isteis", "ieron"]]


# ---------------------------------------------------------------------
# Irregular overrides
# ---------------------------------------------------------------------
IRREGULAR_PARTICIPLES = {
    "abrir": "abierto", "cubrir": "cubierto", "decir": "dicho",
    "descubrir": "descubierto", "escribir": "escrito", "hacer": "hecho",
    "morir": "muerto", "poner": "puesto", "resolver": "resuelto",
    "romper": "roto", "ver": "visto", "volver": "vuelto",
}
# Participles that only need an accent (not in the handout's irregular list)
ACCENTED_PARTICIPLES = {
    "leer": "leído", "caer": "caído", "creer": "creído",
    "oír": "oído", "traer": "traído",
}

IRREGULAR_IMPERFECTO = {
    "ir":  ["iba", "ibas", "iba", "íbamos", "ibais", "iban"],
    "ser": ["era", "eras", "era", "éramos", "erais", "eran"],
    "ver": ["veía", "veías", "veía", "veíamos", "veíais", "veían"],
}

# Indefinido groups as taught in the handout
INDEF_I = {
    "dar":      ["di", "diste", "dio", "dimos", "disteis", "dieron"],
    "hacer":    ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"],
    "ir":       ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    "ser":      ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
    "querer":   ["quise", "quisiste", "quiso", "quisimos", "quisisteis", "quisieron"],
    "venir":    ["vine", "viniste", "vino", "vinimos", "vinisteis", "vinieron"],
    "convenir": ["convine", "conviniste", "convino", "convinimos", "convinisteis", "convinieron"],
}
INDEF_J = {
    "conducir": ["conduje", "condujiste", "condujo", "condujimos", "condujisteis", "condujeron"],
    "decir":    ["dije", "dijiste", "dijo", "dijimos", "dijisteis", "dijeron"],
    "producir": ["produje", "produjiste", "produjo", "produjimos", "produjisteis", "produjeron"],
    "reducir":  ["reduje", "redujiste", "redujo", "redujimos", "redujisteis", "redujeron"],
    "traer":    ["traje", "trajiste", "trajo", "trajimos", "trajisteis", "trajeron"],
}
INDEF_U = {
    "andar":  ["anduve", "anduviste", "anduvo", "anduvimos", "anduvisteis", "anduvieron"],
    "caber":  ["cupe", "cupiste", "cupo", "cupimos", "cupisteis", "cupieron"],
    "estar":  ["estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron"],
    "poder":  ["pude", "pudiste", "pudo", "pudimos", "pudisteis", "pudieron"],
    "poner":  ["puse", "pusiste", "puso", "pusimos", "pusisteis", "pusieron"],
    "saber":  ["supe", "supiste", "supo", "supimos", "supisteis", "supieron"],
    "tener":  ["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"],
}
# Verbs with y in 3sg/3pl (handout's "leiste" corrected to "leíste")
INDEF_Y = {
    "caer":       ["caí", "caíste", "cayó", "caímos", "caísteis", "cayeron"],
    "creer":      ["creí", "creíste", "creyó", "creímos", "creísteis", "creyeron"],
    "leer":       ["leí", "leíste", "leyó", "leímos", "leísteis", "leyeron"],
    "oír":        ["oí", "oíste", "oyó", "oímos", "oísteis", "oyeron"],
    "construir":  ["construí", "construiste", "construyó", "construimos", "construisteis", "construyeron"],
    "contribuir": ["contribuí", "contribuiste", "contribuyó", "contribuimos", "contribuisteis", "contribuyeron"],
    "destruir":   ["destruí", "destruiste", "destruyó", "destruimos", "destruisteis", "destruyeron"],
    "incluir":    ["incluí", "incluiste", "incluyó", "incluimos", "incluisteis", "incluyeron"],
}
# Vowel change e->i / o->u only in 3sg and 3pl
VOWEL_CHANGE = {
    "pedir": ("e", "i"), "corregir": ("e", "i"), "elegir": ("e", "i"),
    "impedir": ("e", "i"), "medir": ("e", "i"), "repetir": ("e", "i"),
    "servir": ("e", "i"), "seguir": ("e", "i"), "vestir": ("e", "i"),
    "dormir": ("o", "u"), "morir": ("o", "u"),
}
# ver has no accents in the indefinido
INDEF_OTHER = {"ver": ["vi", "viste", "vio", "vimos", "visteis", "vieron"]}


def vowel_change_indefinido(inf, old, new):
    """Apply the stem change (last occurrence) to 3sg and 3pl only."""
    forms = regular_indefinido(inf)
    s = stem(inf)
    i = s.rfind(old)
    changed = s[:i] + new + s[i + 1:]
    forms[2] = changed + "ió"
    forms[5] = changed + "ieron"
    return forms


# ---------------------------------------------------------------------
# Build all rows: (infinitive, skill_slug, person, form, is_irregular, group)
# ---------------------------------------------------------------------
def build_rows():
    rows = []
    for inf in VERBS:
        # Pretérito compuesto
        if inf in IRREGULAR_PARTICIPLES:
            part, irr, grp = IRREGULAR_PARTICIPLES[inf], True, "participio_irregular"
        elif inf in ACCENTED_PARTICIPLES:
            part, irr, grp = ACCENTED_PARTICIPLES[inf], True, None
        else:
            part, irr, grp = regular_participle(inf), False, None
        for p, h in zip(PERSONS, HABER):
            rows.append((inf, "preterito_compuesto", p, f"{h} {part}", irr, grp))

        # Imperfecto
        if inf in IRREGULAR_IMPERFECTO:
            forms, irr, grp = IRREGULAR_IMPERFECTO[inf], True, "imperfecto_irregular"
        else:
            forms, irr, grp = regular_imperfecto(inf), False, None
        rows += [(inf, "imperfecto", p, f, irr, grp) for p, f in zip(PERSONS, forms)]

        # Indefinido
        for table, group in [(INDEF_I, "indefinido_i"), (INDEF_J, "indefinido_j"),
                             (INDEF_U, "indefinido_u"), (INDEF_Y, "indefinido_cambio"),
                             (INDEF_OTHER, None)]:
            if inf in table:
                forms, irr, grp = table[inf], True, group
                break
        else:
            if inf in VOWEL_CHANGE:
                forms = vowel_change_indefinido(inf, *VOWEL_CHANGE[inf])
                irr, grp = True, "indefinido_cambio"
            else:
                forms, irr, grp = regular_indefinido(inf), False, None
        rows += [(inf, "indefinido", p, f, irr, grp) for p, f in zip(PERSONS, forms)]
    return rows


# ---------------------------------------------------------------------
# Time markers (Parte 2): (skill_slug, phrase, Dutch, note)
# ---------------------------------------------------------------------
MARKERS = [
    ("imperfecto", "siempre", "altijd", None),
    ("imperfecto", "cada vez", "elke keer", None),
    ("imperfecto", "antes", "vroeger", None),
    ("imperfecto", "normalmente", "gewoonlijk, normaal", None),
    ("imperfecto", "soler", "gewoon zijn om", None),
    ("imperfecto", "todos los días", "elke dag", None),
    ("imperfecto", "cuando", "toen, wanneer", "De eerste, lopende actie staat in het imperfecto."),
    ("imperfecto", "porque", "omdat", "porque + imperfecto geeft uitleg of beschrijving."),
    ("imperfecto", "sustantivo + que", "zelfstandig naamwoord + dat/die", "Beschrijft het zelfstandig naamwoord ervoor."),
    ("indefinido", "ayer", "gisteren", None),
    ("indefinido", "anoche", "gisteravond", None),
    ("indefinido", "anteayer", "eergisteren", None),
    ("indefinido", "anteanoche", "eergisterenavond", None),
    ("indefinido", "la semana pasada", "vorige week", None),
    ("indefinido", "el lunes pasado", "vorige maandag", None),
    ("indefinido", "el año pasado", "vorig jaar", None),
    ("indefinido", "hace x días", "x dagen geleden", None),
    ("indefinido", "hace x semanas", "x weken geleden", None),
    ("indefinido", "hace x meses", "x maanden geleden", None),
    ("indefinido", "hace x años", "x jaren geleden", None),
    ("indefinido", "el otro día", "toen die dag", None),
    ("indefinido", "primero", "eerst", "Opeenvolgende acties."),
    ("indefinido", "luego", "daarna", "Opeenvolgende acties."),
    ("indefinido", "después", "daarna", "Opeenvolgende acties."),
    ("indefinido", "para terminar", "om te eindigen", "Opeenvolgende acties."),
    ("indefinido", "al final", "uiteindelijk", "Opeenvolgende acties."),
    ("indefinido", "de repente", "plots", "De tweede actie die de eerste onderbreekt."),
    ("indefinido", "en el año 1904", "in het jaar 1904", "Exacte datum."),
    ("preterito_compuesto", "hoy", "vandaag", None),
    ("preterito_compuesto", "esta mañana", "deze ochtend", "Elke marker met este/esta hangt samen met vandaag."),
    ("preterito_compuesto", "esta semana", "deze week", None),
    ("preterito_compuesto", "este mes", "deze maand", None),
    ("preterito_compuesto", "este año", "dit jaar", None),
    ("preterito_compuesto", "ya", "reeds, al", None),
    ("preterito_compuesto", "hasta ahora", "tot nu", None),
    ("preterito_compuesto", "todavía no", "nog altijd niet", None),
    ("preterito_compuesto", "alguna vez", "ooit", None),
    ("preterito_compuesto", "muchas veces", "vele keren", None),
    ("preterito_compuesto", "nunca", "nooit", None),
]


# ---------------------------------------------------------------------
# SQL output
# ---------------------------------------------------------------------
def q(v):
    """Quote a value as a SQL literal."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    return "'" + str(v).replace("'", "''") + "'"


TOPIC_JOIN = """join skills s on s.slug = d.skill
join topics t on t.id = s.topic_id and t.slug = 'tiempos-del-pasado' and t.language_code = 'es'"""


def main():
    rows = build_rows()
    out = []
    out.append("-- =====================================================================")
    out.append("-- Seed 01: Spanish past tenses — verbs, forms, markers, conjugation drills")
    out.append("-- Generated by gen_seed_es_pasado.py. Safe to re-run (idempotent).")
    out.append(f"-- {len(VERBS)} verbs, {len(rows)} forms, {len(MARKERS)} markers")
    out.append("-- =====================================================================\n")

    # Verbs
    out.append("insert into verbs (language_code, infinitive, translation_nl) values")
    out.append(",\n".join(f"  ('es', {q(i)}, {q(t)})" for i, t in VERBS.items()))
    out.append("on conflict (language_code, infinitive) do nothing;\n")

    # Verb forms
    out.append("insert into verb_forms (verb_id, skill_id, person, form, is_irregular, irregular_group)")
    out.append("select v.id, s.id, d.person::grammatical_person, d.form, d.irr, d.grp")
    out.append("from (values")
    out.append(",\n".join(
        f"  ({q(i)}, {q(sk)}, {q(p)}, {q(f)}, {q(irr)}, {q(g)})" for i, sk, p, f, irr, g in rows))
    out.append(") as d(inf, skill, person, form, irr, grp)")
    out.append("join verbs v on v.language_code = 'es' and v.infinitive = d.inf")
    out.append(TOPIC_JOIN)
    out.append("on conflict (verb_id, skill_id, person) do nothing;\n")

    # Markers (no unique key, so guard with not exists)
    out.append("insert into markers (skill_id, phrase, translation_nl, note)")
    out.append("select s.id, d.phrase, d.nl, d.note")
    out.append("from (values")
    out.append(",\n".join(f"  ({q(sk)}, {q(ph)}, {q(nl)}, {q(n)})" for sk, ph, nl, n in MARKERS))
    out.append(") as d(skill, phrase, nl, note)")
    out.append(TOPIC_JOIN)
    out.append("where not exists (select 1 from markers m where m.skill_id = s.id and m.phrase = d.phrase);\n")

    # Conjugation drills: one exercise per verb form
    out.append("""-- One conjugation exercise per verb form (speed rounds, bosses, SRS)
insert into exercises (topic_id, skill_id, verb_form_id, type, prompt,
                       correct_answer, tags, difficulty, feedback_nl, source_ref)
select
  t.id, s.id, vf.id, 'conjugation',
  jsonb_build_object(
    'infinitive',     v.infinitive,
    'translation_nl', v.translation_nl,
    'tense',          s.title,
    'person',         vf.person,
    'pronoun',        case vf.person
                        when '1sg' then 'yo'        when '2sg' then 'tú'
                        when '3sg' then 'él/ella/usted'
                        when '1pl' then 'nosotros'  when '2pl' then 'vosotros'
                        else 'ellos/ellas/ustedes' end),
  vf.form,
  array_remove(array[vf.irregular_group], null),
  case when vf.is_irregular then 3 else 1 end,
  case vf.irregular_group
    when 'participio_irregular' then 'Onregelmatig voltooid deelwoord: leer dit vanbuiten.'
    when 'imperfecto_irregular' then 'Slechts 3 onregelmatige werkwoorden in het imperfecto: ir, ser, ver.'
    when 'indefinido_i'         then 'Onregelmatig indefinido met een i in de stam. Let op: geen accenten!'
    when 'indefinido_j'         then 'Onregelmatig indefinido met een j in de stam. Let op: geen accenten!'
    when 'indefinido_u'         then 'Onregelmatig indefinido met een u in de stam. Let op: geen accenten!'
    when 'indefinido_cambio'    then 'Klinkerwissel of y, maar alleen in de 3de persoon enkelvoud en meervoud.'
    else 'Regelmatige vorm.' end,
  'auto: verb_forms'
from verb_forms vf
join verbs  v on v.id = vf.verb_id
join skills s on s.id = vf.skill_id
join topics t on t.id = s.topic_id and t.slug = 'tiempos-del-pasado'
where not exists (select 1 from exercises e where e.verb_form_id = vf.id);""")

    print("\n".join(out))


if __name__ == "__main__":
    main()
