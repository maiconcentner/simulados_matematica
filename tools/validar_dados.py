# -*- coding: utf-8 -*-
"""Confere os dados e os arquivos públicos do site. Rode na raiz do repositório:
  python3 tools/validar_dados.py
Sai com código 1 se achar erro. Use antes de cada publicação."""
import base64, glob, json, os, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# nomes institucionais proibidos (em base64 para não aparecerem no repositório)
PROIBIDOS = [base64.b64decode(t).decode("utf-8") for t in
             ["U0VTSQ==", "U2VzaQ==", "Q0UgMDI2", "Q0UwMjY=", "SmHDug=="]]
erros, avisos = [], []


def err(m): erros.append(m)


def checar_simulado(path, hab):
    d = json.load(open(path, encoding="utf-8"))
    nome = os.path.relpath(path, RAIZ)
    for k in ("id", "area", "titulo", "items", "pontuacao"):
        if k not in d:
            err(f"{nome}: falta o campo '{k}'")
    if d.get("area") not in ("avalia", "prova"):
        err(f"{nome}: area deve ser 'avalia' ou 'prova'")
    if d.get("status", "publicado") not in ("publicado", "em_breve", "oculto"):
        err(f"{nome}: status deve ser publicado, em_breve ou oculto")
    ate = d.get("disponivel_ate")
    if ate is not None:
        import datetime
        try:
            dt = datetime.datetime.fromisoformat(ate)
            if dt.tzinfo is None:
                err(f"{nome}: disponivel_ate precisa do fuso, como 2026-11-07T23:59:59-03:00")
        except ValueError:
            err(f"{nome}: disponivel_ate inválido ({ate}); use AAAA-MM-DDTHH:MM:SS-03:00")
    soma = 0
    for i, it in enumerate(d.get("items", []), 1):
        q = f"{nome} Q{it.get('n')}"
        if it.get("n") != i:
            err(f"{q}: numeração fora de ordem (esperado {i})")
        for k in ("code", "level", "stem", "ask", "options", "key", "resolution"):
            if k not in it:
                err(f"{q}: falta '{k}'")
        ops = it.get("options", [])
        if [o.get("letter") for o in ops] != list("ABCDE"):
            err(f"{q}: alternativas devem ser A a E, nessa ordem")
        certas = [o["letter"] for o in ops if o.get("correct")]
        if len(certas) != 1:
            err(f"{q}: precisa ter exatamente 1 alternativa correta (tem {len(certas)})")
        elif certas[0] != it.get("key"):
            err(f"{q}: key '{it.get('key')}' diferente da alternativa marcada como correta ({certas[0]})")
        if len({o.get('text') for o in ops}) != len(ops):
            err(f"{q}: alternativas repetidas")
        for o in ops:
            if not o.get("why"):
                err(f"{q}{o.get('letter')}: falta o 'why' (erro provável ou justificativa)")
        fig = it.get("figure")
        if fig:
            if "src" in fig:
                err(f"{q}: figura embutida em base64; use 'file' com o caminho em assets/")
            elif not os.path.exists(os.path.join(RAIZ, fig.get("file", ""))):
                err(f"{q}: figura não encontrada: {fig.get('file')}")
            if not fig.get("alt"):
                err(f"{q}: figura sem texto alternativo (alt)")
        if it.get("code") not in hab:
            err(f"{q}: código '{it.get('code')}' não está em data/habilidades.json")
        if d.get("area") == "prova":
            if "valor" not in it:
                err(f"{q}: item de prova precisa de 'valor'")
            soma += float(it.get("valor", 0))
    if d.get("area") == "prova" and abs(soma - 10) > 1e-9:
        err(f"{nome}: a soma dos valores deve ser 10 (deu {soma})")


def main():
    hab = json.load(open(os.path.join(RAIZ, "data", "habilidades.json"), encoding="utf-8"))
    for c, h in hab.items():
        if h.get("tema") in (None, "", "a classificar"):
            avisos.append(f"habilidades.json: '{c}' sem tema definido")
    for p in sorted(glob.glob(os.path.join(RAIZ, "data", "avalia", "*.json")) + glob.glob(os.path.join(RAIZ, "data", "prova", "*.json"))):
        checar_simulado(p, hab)
    cat = os.path.join(RAIZ, "data", "catalogo.json")
    if os.path.exists(cat):
        c = json.load(open(cat, encoding="utf-8"))
        for area in c.get("areas", []):
            for s in area.get("simulados", []):
                if not os.path.exists(os.path.join(RAIZ, s["arquivo"])):
                    err(f"catalogo.json: arquivo inexistente {s['arquivo']}")
    else:
        err("falta data/catalogo.json (rode tools/atualizar_catalogo.py)")
    # nada de nome institucional nos arquivos que vão para o site
    for p in glob.glob(os.path.join(RAIZ, "**", "*"), recursive=True):
        rel = os.path.relpath(p, RAIZ)
        if os.path.isdir(p) or rel.startswith((".git", "tools")) or not rel.endswith((".html", ".js", ".css", ".json", ".md", ".txt", ".svg", ".webmanifest")):
            continue
        texto = open(p, encoding="utf-8", errors="ignore").read()
        for w in PROIBIDOS:
            if w in texto or w.lower() in rel.lower():
                err(f"{rel}: contém nome institucional proibido")
        if "\u2014" in texto and not rel.startswith("planejamento"):
            avisos.append(f"{rel}: tem travessão; troque por vírgula, ponto ou dois-pontos")
    for a in avisos:
        print("aviso:", a)
    for e in erros:
        print("ERRO:", e)
    print(f"{len(erros)} erro(s), {len(avisos)} aviso(s)")
    sys.exit(1 if erros else 0)


if __name__ == "__main__":
    main()
