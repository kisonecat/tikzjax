# TikZJax

TikZJax converts `script` tags (containing TikZ code) into SVGs.

See a live demo at http://tikzjax.com/

## Example

In the `<head>` of your HTML, include 
```html
<link rel="stylesheet" type="text/css" href="http://tikzjax.com/v1/fonts.css">
<script src="http://tikzjax.com/v1/tikzjax.js"></script>
```
Then in the `<body>`, include TikZ code such as
```html
<script type="text/tikz">
  \begin{tikzpicture}
    \draw (0,0) circle (1in);
  \end{tikzpicture}
</script>
```

Your TikZ will be compiled into SVGs; the `<script>` element will be
replaced with the corresponding SVG.

## How does this work?

Using https://github.com/kisonecat/web2js the Pascal source of `tex`
is compiled to WebAssembly; the latex format is loaded (without all the hyphenation data), and 
```
\documentclass[margin=0pt]{standalone}
\def\pgfsysdriver{pgfsys-ximera.def}
\usepackage{tikz}
```
is executed.  Then core is dumped; the resulting core is compressed, and by reloading the dumped core in the browser, it is possible to very quickly get to a point where TikZ can be executed.  By using an SVG driver for PGF along with https://github.com/kisonecat/dvi2html the DVI output is converted to an SVG.

All of this happens in the browser.
