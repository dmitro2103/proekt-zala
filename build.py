#!/usr/bin/env python3
"""Сборка index.html — один автономный файл без внешних запросов.

src/style.css + src/body.html + src/js/*.js (по порядку имён) + three.js r147 + шрифты (кириллица и латиница).
Запуск:  npm install && python3 build.py        (--dev — без минификации кода приложения)
"""
import base64, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent
NM = ROOT / 'node_modules'
DEV = '--dev' in sys.argv


def esbuild(js, *args):
    exe = NM / '.bin' / 'esbuild'
    r = subprocess.run([str(exe), '--loader=js', '--charset=utf8', '--legal-comments=none', *args], input=js.encode(), capture_output=True)
    if r.returncode:
        sys.exit(r.stderr.decode())
    return r.stdout.decode()


def safe(js):
    return js.replace('</script', '<\\/script').replace('<!--', '<\\!--')


style = (ROOT / 'src/style.css').read_text('utf-8')
body = (ROOT / 'src/body.html').read_text('utf-8')
parts = sorted((ROOT / 'src/js').glob('*.js'))
app = "(() => {\n'use strict';\n" + '\n'.join(p.read_text('utf-8') for p in parts) + '\n})();\n'
app_out = esbuild(app, '--minify-syntax', '--minify-whitespace') if DEV else esbuild(app, '--minify')

three = (NM / 'three/build/three.min.js').read_text('utf-8')
examples = ['controls/OrbitControls.js', 'environments/RoomEnvironment.js', 'lights/RectAreaLightUniformsLib.js', 'geometries/RoundedBoxGeometry.js']
ex = esbuild('\n'.join((NM / 'three/examples/js' / f).read_text('utf-8') for f in examples), '--minify')

fonts = []
for pkg, weights in [('golos-text', [400, 500, 600]), ('jetbrains-mono', [400, 500, 600]), ('unbounded', [500])]:
    for w in weights:
        css = (NM / f'@fontsource/{pkg}/{w}.css').read_text('utf-8')
        for block in re.findall(r'(/\* [a-z0-9-]+ \*/\s*@font-face\s*\{.*?\})', css, re.S):
            name = re.match(r'/\* ([a-z0-9-]+) \*/', block).group(1)
            sub = name[len(pkg) + 1: -len(f'-{w}-normal')]
            if sub not in ('cyrillic', 'latin'):
                continue
            fam = re.search(r"font-family:\s*'([^']+)'", block).group(1)
            ur = re.search(r'unicode-range:\s*([^;]+);', block).group(1)
            b64 = base64.b64encode((NM / f'@fontsource/{pkg}/files/{pkg}-{sub}-{w}-normal.woff2').read_bytes()).decode()
            fonts.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-display:swap;font-weight:{w};src:url(data:font/woff2;base64,{b64}) format('woff2');unicode-range:{ur};}}")

base = 'html{-webkit-text-size-adjust:100%}body{margin:0;padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}img{max-width:100%}'
out = f"""<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Проект зала</title>
<meta name="description" content="Редактор ремонта зала: 3D, план мебели, электрика и чертежи А3 для мастеров.">
<meta property="og:type" content="website">
<meta property="og:title" content="Проект зала">
<meta property="og:description" content="3D, план мебели, электрика и чертежи — всё можно менять">
<meta name="theme-color" content="#EDEFEB">
<style>
{chr(10).join(fonts)}
{base}
{style}
</style>
</head>
<body>
{body}
<script>{safe(three)}</script>
<script>{safe(ex)}</script>
<script>{safe(app_out)}</script>
</body>
</html>
"""
(ROOT / 'index.html').write_text(out, 'utf-8')
print(f'index.html: {round(len(out.encode()) / 1024)} KB, {len(fonts)} font faces, {len(parts)} js parts' + (' (dev)' if DEV else ''))
