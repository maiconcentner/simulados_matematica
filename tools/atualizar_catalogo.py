# -*- coding: utf-8 -*-
"""Gera data/catalogo.json a partir dos arquivos em data/avalia e data/prova.
O site lê só o catálogo para montar o painel. Rode na raiz: python3 tools/atualizar_catalogo.py"""
import glob, json, os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def resumo(p):
    d = json.load(open(p, encoding="utf-8"))
    codes = []
    for it in d["items"]:
        if it["code"] not in codes:
            codes.append(it["code"])
    r = {
        "id": d["id"], "titulo": d["titulo"], "subtitulo": d.get("subtitulo", d.get("temas", "")),
        "etapa": d.get("etapa"), "semana": d.get("semana"), "data": d.get("data"),
        "n_questoes": len(d["items"]), "habilidades": codes,
        "status": d.get("status", "publicado"),
        "arquivo": os.path.relpath(p, RAIZ).replace(os.sep, "/"),
    }
    if d.get("disponivel_ate"):  # prazo opcional: depois dele o site não abre o simulado
        r["disponivel_ate"] = d["disponivel_ate"]
    return r


def main():
    avalia = sorted((resumo(p) for p in glob.glob(os.path.join(RAIZ, "data", "avalia", "*.json"))), key=lambda s: s["semana"] or 0)
    prova = sorted((resumo(p) for p in glob.glob(os.path.join(RAIZ, "data", "prova", "*.json"))), key=lambda s: (s["etapa"] or 0, s["id"]))
    cat = {
        "site": {"titulo": "Simulados de Matemática", "autor": "Prof. Maicon Centner Germano", "serie": "9º ano"},
        "areas": [
            {"id": "avalia", "titulo": "Simulados Avalia",
             "descricao": "Um simulado por semana, com 5 ou 6 questões dos descritores da etapa.", "simulados": avalia},
            {"id": "prova", "titulo": "Simulados de prova",
             "descricao": "Treino no formato da avaliação da etapa: mesmas habilidades, mesmos níveis, questões novas.", "simulados": prova},
        ],
    }
    json.dump(cat, open(os.path.join(RAIZ, "data", "catalogo.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"catálogo: {len(avalia)} Avalia, {len(prova)} de prova")


if __name__ == "__main__":
    main()
