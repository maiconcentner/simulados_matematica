# -*- coding: utf-8 -*-
"""Importa um Simulado Avalia semanal a partir do HTML digital gerado pelo pipeline do professor
(SNN_Simulado_digital.html) e grava, dentro deste repositório:
  data/avalia/SNN.json             (dados da semana, sem imagens embutidas)
  assets/figuras/avalia/sNN/qK.png (figuras)
e acrescenta em data/habilidades.json os códigos que ainda não existirem.

Uso (na raiz do repositório):
  python3 tools/extrair_semana.py caminho/S08_Simulado_digital.html [--data AAAA-MM-DD]
Depois rode: python3 tools/atualizar_catalogo.py && python3 tools/validar_dados.py
"""
import base64, json, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# nomes institucionais que não podem aparecer no site (guardados em base64 para não aparecerem no repositório)
_B = lambda t: base64.b64decode(t).decode("utf-8")
MARCAS = [(_B("QXZhbGlhU0VTSQ=="), "Avalia"), (_B("QXZhbGlhIFNFU0k="), "Avalia"), (_B("U0VTSS1TUA=="), ""), (_B("U0VTSQ=="), "")]


def limpar(obj):
    if isinstance(obj, str):
        for a, b in MARCAS:
            obj = obj.replace(a, b)
        return obj
    if isinstance(obj, list):
        return [limpar(x) for x in obj]
    if isinstance(obj, dict):
        return {k: limpar(v) for k, v in obj.items()}
    return obj


def ler_data(html):
    for linha in open(html, encoding="utf-8"):
        if linha.startswith("const DATA = "):
            return json.loads(linha[len("const DATA = "):].rstrip().rstrip(";"))
    raise SystemExit("não achei a linha 'const DATA = ' em " + html)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    html = sys.argv[1]
    data_aplic = sys.argv[sys.argv.index("--data") + 1] if "--data" in sys.argv else None
    d = ler_data(html)
    meta, items = d["meta"], d["items"]
    sem = int(meta["week"])
    sid = f"S{sem:02d}"
    pasta_fig = os.path.join("assets", "figuras", "avalia", f"s{sem:02d}")
    os.makedirs(os.path.join(RAIZ, pasta_fig), exist_ok=True)
    for it in items:
        fig = it.get("figure")
        if fig and fig.get("src", "").startswith("data:image"):
            cab, b64 = fig.pop("src").split(",", 1)
            ext = "png" if "png" in cab else "jpg"
            nome = f"q{it['n']}.{ext}"
            open(os.path.join(RAIZ, pasta_fig, nome), "wb").write(base64.b64decode(b64))
            fig["file"] = f"{pasta_fig}/{nome}".replace(os.sep, "/")
    m = re.search(r"Etapa\s*(\d+)", meta.get("subtitle", ""))
    saida = {
        "id": sid,
        "area": "avalia",
        "titulo": f"Simulado Avalia · Semana {sem}",
        "semana": sem,
        "etapa": int(m.group(1)) if m else None,
        "serie": "9º ano",
        "data": data_aplic,
        "professor": meta.get("professor"),
        "temas": meta.get("chapters"),
        "pontuacao": {"tipo": "acertos"},
        "dicas": meta.get("tips", {}),
        "items": items,
    }
    saida = limpar(saida)
    destino = os.path.join(RAIZ, "data", "avalia", f"{sid}.json")
    json.dump(saida, open(destino, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    # habilidades novas
    ph = os.path.join(RAIZ, "data", "habilidades.json")
    hab = json.load(open(ph, encoding="utf-8")) if os.path.exists(ph) else {}
    novos = []
    for it in items:
        c = it["code"]
        if c not in hab:
            hab[c] = {"nome": it.get("short", c), "descricao": it.get("descriptor", ""), "tema": "a classificar",
                      "dica": saida["dicas"].get(c, ""), "conexao_8ano": c.startswith("C")}
            novos.append(c)
    json.dump(hab, open(ph, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{sid}: {len(items)} questões, figuras em {pasta_fig}; habilidades novas: {novos or 'nenhuma'}")
    if novos:
        print("  Revise em data/habilidades.json o 'nome' (curto, para o aluno) e o 'tema' dos códigos novos.")


if __name__ == "__main__":
    main()
