# -*- coding: utf-8 -*-
"""Carimba a versão do site nos endereços dos arquivos (?v=...), para o navegador
não misturar arquivo velho com arquivo novo depois de uma publicação.

Rode na raiz, antes de cada commit que mexe em js/, css/ ou nas páginas .html:
  python3 tools/carimbar_versao.py
Mudar só os dados (data/*.json) não precisa: eles são lidos sempre sem cache.

O que faz:
- calcula a versão (um resumo do conteúdo de js/, css/ e das páginas);
- põe ?v=<versão> nos imports dos módulos (js/**/*.js) e nos <link>/<script> das páginas;
- grava versao.json (que o site confere ao abrir) e js/versao.js.
Com --conferir, só diz se os carimbos estão em dia (sai com código 1 se não estiverem)."""
import glob, hashlib, json, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGINAS = ["index.html", "simulado.html", "completo.html", "tools/ver_gerador.html"]
CARIMBO = re.compile(r"\?v=[0-9a-f]+")
# imports e exports com caminho relativo: from "./x.js", from '../y.js'
IMPORT = re.compile(r"""((?:from|import)\s*\(?\s*["'])(\.{1,2}/[^"'?]+?\.js)(\?v=[0-9a-f]+)?(["'])""")
# <link href="css/...css"> e <script src="js/...js"> (também ../ nas ferramentas)
ATRIB = re.compile(r"""((?:href|src)=")((?:\.\./)?(?:css|js)/[^"?]+?\.(?:css|js))(\?v=[0-9a-f]+)?(")""")


def arquivos_js():
    return sorted(p for p in glob.glob(os.path.join(RAIZ, "js", "**", "*.js"), recursive=True)
                  if not p.endswith(os.path.join("js", "versao.js")))


def calcular_versao():
    h = hashlib.sha1()
    for p in arquivos_js() + sorted(glob.glob(os.path.join(RAIZ, "css", "*.css"))) + [os.path.join(RAIZ, x) for x in PAGINAS]:
        if os.path.exists(p):
            h.update(os.path.relpath(p, RAIZ).encode())
            h.update(CARIMBO.sub("", open(p, encoding="utf-8").read()).encode())
    return h.hexdigest()[:10]


def carimbar(texto, versao, pagina=False):
    texto = IMPORT.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={versao}{m.group(4)}", texto)
    if pagina:
        texto = ATRIB.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={versao}{m.group(4)}", texto)
    return texto


def main():
    conferir = "--conferir" in sys.argv
    versao = calcular_versao()
    mudou = []
    alvos = [(p, False) for p in arquivos_js()] + [(os.path.join(RAIZ, x), True) for x in PAGINAS if os.path.exists(os.path.join(RAIZ, x))]
    for p, pagina in alvos:
        antes = open(p, encoding="utf-8").read()
        depois = carimbar(antes, versao, pagina)
        if depois != antes:
            mudou.append(os.path.relpath(p, RAIZ))
            if not conferir:
                open(p, "w", encoding="utf-8").write(depois)
    extras = {
        os.path.join(RAIZ, "versao.json"): json.dumps({"versao": versao}) + "\n",
        os.path.join(RAIZ, "js", "versao.js"): f'// Gerado por tools/carimbar_versao.py. Não edite à mão.\nexport const VERSAO = "{versao}";\n',
    }
    for p, conteudo in extras.items():
        atual = open(p, encoding="utf-8").read() if os.path.exists(p) else ""
        if atual != conteudo:
            mudou.append(os.path.relpath(p, RAIZ))
            if not conferir:
                open(p, "w", encoding="utf-8").write(conteudo)
    if conferir:
        if mudou:
            print("carimbos desatualizados em:", ", ".join(mudou))
            print("rode: python3 tools/carimbar_versao.py")
            sys.exit(1)
        print(f"versão {versao}: carimbos em dia")
    else:
        print(f"versão {versao}" + (f" ({len(mudou)} arquivo(s) atualizado(s))" if mudou else " (nada mudou)"))


if __name__ == "__main__":
    main()
