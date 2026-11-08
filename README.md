# Waiss — site institucional

Site estático (HTML, CSS e JS puros) da rede Waiss: Chocolates, Gelatos e Panettones o ano todo.

- Animações com GSAP + ScrollTrigger e rolagem suave com Lenis (via CDN)
- Biscotti Gelato em 3D montado no scroll, barra de chocolate que quebra e calda escorrendo entre seções
- Português, inglês e espanhol (`js/i18n.js`, que também guarda os dados das unidades)

## Rodar localmente

```bash
py -m http.server 5520
```

Abra `http://localhost:5520`. Em computadores com "animações desligadas" no sistema, use `?motion=1` para ver as animações.

## Estrutura

- `index.html` — página
- `css/style.css` — estilos
- `js/main.js` — animações e interações
- `js/i18n.js` — textos (PT/EN/ES) e unidades
- `assets/` — logo, favicon e recortes dos produtos
- `imagem/` — fotos originais
