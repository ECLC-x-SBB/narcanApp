import json

# Path to your raw text
RAW = 'raw_devotions.txt'
OUT  = 'devotions.json'

# Month name→number map
MONTHS = {
  'January':1, 'February':2, 'March':3,    'April':4,
  'May':5,     'June':6,     'July':7,     'August':8,
  'September':9,'October':10,'November':11,'December':12
}

# Read & split into entries
with open(RAW, encoding='utf-8') as f:
    lines = [l.strip() for l in f]
groups, grp = [], []
for l in lines:
    if not l:
        if grp:
            groups.append(grp)
            grp = []
    else:
        grp.append(l)
if grp:
    groups.append(grp)

# Build the JSON object
devos = {}
for g in groups:
    hdr = g[0]                   # e.g. "February 1"
    verse = g[1]                 # the verse line
    body  = g[2:]                # remaining lines (body + refs)
    mon, day = hdr.split(' ',1)
    key = f"{MONTHS[mon]}-{int(day)}"
    # join body paragraphs with \n\n
    text = "\\n\\n".join(body)
    devos[key] = {
        "verse": verse,
        "text":  text
    }

# Write out pretty JSON
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(devos, f, indent=2, ensure_ascii=False)

print(f"✓ Wrote {len(devos)} entries to {OUT}")
