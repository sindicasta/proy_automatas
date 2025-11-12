/* =======================================================
 * tree.js
 * Lógica de UI y Renderizado para la página del Árbol.
 * Consume la API de Spring Boot.
 * ======================================================= */

// Variables globales para almacenar los datos del backend
let currentDFA = null;
let currentRootFirstPos = new Set();
let hashLeafPos = -1;

/* ---------- FUNCIONES AUXILIARES DE RENDERIZADO (De tu JS) ---------- */
function setToArray(s) { return Array.from(s).sort((a, b) => a - b) }
function showNodeSet(s) { if (!s) return '{}'; const a = setToArray(s); return '{' + a.join(',') + '}' }

/* ---------- FUNCIONES DE RENDERIZADO SVG (Tu código original) ---------- */
function layoutTree(node) {
    const coords = new Map()
    let curx = 40
    const levelYGap = 120
    function inorder(n, depth) {
        if (!n) return
        inorder(n.left, depth + 1)
        coords.set(n, { x: curx, y: 40 + depth * levelYGap })
        curx += 160
        inorder(n.right, depth + 1)
    }
    inorder(node, 0)
    return coords
}
function renderTreeSVG(root) {
    const coords = layoutTree(root)
    const all = new Set()
    function collect(n) { if (!n) return; all.add(n); collect(n.left); collect(n.right) }
    collect(root)
    const xs = Array.from(coords.values()).map(p => p.x)
    const ys = Array.from(coords.values()).map(p => p.y)

    const minX = Math.min(...xs, 40)
    const maxX = Math.max(...xs, 200)
    const width = Math.max(760, maxX - minX + 160);
    const height = (Math.max(...ys, 200) || 200) + 120

    const svgNS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(svgNS, 'svg')
    svg.setAttribute('width', width)
    svg.setAttribute('height', height)

    const offsetX = 80 - minX;
    svg.setAttribute('viewBox', `${-offsetX} 0 ${width} ${height}`)
    for (const n of all) {
        if (n.left) {
            const p1 = coords.get(n), p2 = coords.get(n.left)
            const path = document.createElementNS(svgNS, 'path')
            const startX = p1.x, startY = p1.y + 28, endX = p2.x, endY = p2.y - 28, midY = (startY + endY) / 2
            const d = `M ${startX} ${startY} C ${startX} ${midY} ${endX} ${midY} ${endX} ${endY}`
            path.setAttribute('d', d); path.setAttribute('stroke', '#999'); path.setAttribute('fill', 'none'); path.setAttribute('stroke-width', '1.2')
            svg.appendChild(path)
        }
        if (n.right) {
            const p1 = coords.get(n), p2 = coords.get(n.right)
            const path = document.createElementNS(svgNS, 'path')
            const startX = p1.x, startY = p1.y + 28, endX = p2.x, endY = p2.y - 28, midY = (startY + endY) / 2
            const d = `M ${startX} ${startY} C ${startX} ${midY} ${endX} ${midY} ${endX} ${endY}`
            path.setAttribute('d', d); path.setAttribute('stroke', '#999'); path.setAttribute('fill', 'none'); path.setAttribute('stroke-width', '1.2')
            svg.appendChild(path)
        }
    }
    for (const n of all) {
        const p = coords.get(n)
        const g = document.createElementNS(svgNS, 'g'); g.setAttribute('transform', `translate(${p.x},${p.y})`)
        const circle = document.createElementNS(svgNS, 'circle'); circle.setAttribute('r', 30); circle.setAttribute('fill', n.type === 'leaf' ? '#e6f7ff' : (n.type === 'star' ? '#fff3e0' : (n.type === 'or' ? '#eef2ff' : '#f3e8ff'))); circle.setAttribute('stroke', '#333'); circle.setAttribute('stroke-width', '1.2')
        g.appendChild(circle)
        const label = document.createElementNS(svgNS, 'text'); label.setAttribute('x', 0); label.setAttribute('y', 6); label.setAttribute('text-anchor', 'middle'); label.setAttribute('font-size', 16); label.textContent = (n.type === 'leaf') ? (n.sym === '#' ? '#' : n.sym) : (n.type === 'star' ? '*' : (n.type === 'or' ? '+' : '.'))
        g.appendChild(label)
        const tLeft = document.createElementNS(svgNS, 'text'); tLeft.setAttribute('x', -52); tLeft.setAttribute('y', -18); tLeft.setAttribute('font-size', 11); tLeft.textContent = n.firstpos ? showNodeSet(n.firstpos) : '{}'
        g.appendChild(tLeft)
        const tRight = document.createElementNS(svgNS, 'text'); tRight.setAttribute('x', 38); tRight.setAttribute('y', -18); tRight.setAttribute('font-size', 11); tRight.textContent = n.lastpos ? showNodeSet(n.lastpos) : '{}'
        g.appendChild(tRight)
        const bottom = document.createElementNS(svgNS, 'text'); bottom.setAttribute('x', 0); bottom.setAttribute('y', 44); bottom.setAttribute('font-size', 11); bottom.setAttribute('text-anchor', 'middle');
        const fv = n.nullable ? 'V' : 'F'; bottom.textContent = (n.type === 'leaf') ? `n=${n.pos} ${fv}` : `${fv}`
        g.appendChild(bottom)
        svg.appendChild(g)
    }

    const rootCoords = coords.get(root);
    const arrow = document.createElementNS(svgNS, 'text')
    arrow.setAttribute('x', rootCoords.x)
    arrow.setAttribute('y', rootCoords.y - 10)
    arrow.setAttribute('text-anchor', 'middle')
    arrow.setAttribute('font-size', 13)
    arrow.textContent = 'inicio'
    svg.appendChild(arrow)

    svg.dataset.generated = 'true'
    return svg
}
function renderDFASVG(dfa) {
    const svgNS = 'http://www.w3.org/2000/svg'
    const width = 360, height = Math.max(200, 80 + dfa.states.length * 70)
    const svg = document.createElementNS(svgNS, 'svg')
    svg.setAttribute('width', width); svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    const stX = 180;
    const gap = Math.max(60, Math.floor((height - 40) / Math.max(1, dfa.states.length)));
    const coords = []

    const totalStatesHeight = (dfa.states.length - 1) * gap;
    const startY = (height / 2) - (totalStatesHeight / 2);

    for (let i = 0; i < dfa.states.length; i++) coords.push({ x: stX, y: startY + i * gap })

    const defs = document.createElementNS(svgNS, 'defs');
    let marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', 'arrowhead-blue');
    marker.setAttribute('markerWidth', '5'); marker.setAttribute('markerHeight', '3');
    marker.setAttribute('refX', '5'); marker.setAttribute('refY', '1.5');
    marker.setAttribute('orient', 'auto');
    let polygon = document.createElementNS(svgNS, 'polygon');
    polygon.setAttribute('points', '0 0, 5 1.5, 0 3'); polygon.setAttribute('fill', '#007bff');
    marker.appendChild(polygon); defs.appendChild(marker);

    marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', 'arrowhead-green');
    marker.setAttribute('markerWidth', '5'); marker.setAttribute('markerHeight', '3');
    marker.setAttribute('refX', '5'); marker.setAttribute('refY', '1.5');
    marker.setAttribute('orient', 'auto');
    polygon = document.createElementNS(svgNS, 'polygon');
    polygon.setAttribute('points', '0 0, 5 1.5, 0 3'); polygon.setAttribute('fill', '#4CAF50');
    marker.appendChild(polygon); defs.appendChild(marker);
    svg.appendChild(defs);

    const initialArrow = document.createElementNS(svgNS, 'path');
    initialArrow.setAttribute('d', `M 10 ${coords[0].y} L ${coords[0].x - 26} ${coords[0].y}`);
    initialArrow.setAttribute('stroke', '#4CAF50'); initialArrow.setAttribute('fill', 'none');
    initialArrow.setAttribute('stroke-width', '1.5');
    initialArrow.setAttribute('marker-end', 'url(#arrowhead-blue)');
    svg.appendChild(initialArrow)

    const tStart = document.createElementNS(svgNS, 'text');
    tStart.setAttribute('x', 30); tStart.setAttribute('y', coords[0].y - 10);
    tStart.setAttribute('font-size', 11); tStart.setAttribute('fill', '#4CAF50');
    tStart.textContent = 'inicial';
    svg.appendChild(tStart)

    const finalColor = '#fffbe7';
    for (let i = 0; i < dfa.states.length; i++) {
        const s = dfa.states[i], c = coords[i]
        const g = document.createElementNS(svgNS, 'g'); g.setAttribute('transform', `translate(${c.x},${c.y})`)
        const circOuter = document.createElementNS(svgNS, 'circle');
        circOuter.setAttribute('r', 26);
        circOuter.setAttribute('fill', s.isAccept ? finalColor : '#fff');
        circOuter.setAttribute('stroke', '#222'); circOuter.setAttribute('stroke-width', 1.2);
        g.appendChild(circOuter)
        if (s.isAccept) {
            const circInner = document.createElementNS(svgNS, 'circle');
            circInner.setAttribute('r', 22);
            circInner.setAttribute('fill', finalColor);
            circInner.setAttribute('stroke', '#222'); circInner.setAttribute('stroke-width', 1.2);
            g.appendChild(circInner)
        }
        const label = document.createElementNS(svgNS, 'text'); label.setAttribute('x', 0); label.setAttribute('y', 6); label.setAttribute('text-anchor', 'middle'); label.setAttribute('font-size', 11); label.textContent = '{' + s.positions.join(',') + '}'
        g.appendChild(label); svg.appendChild(g)
    }

    const groupedTransitions = {};
    for (const tr of dfa.transitions) {
        const key = `${tr.from}-${tr.to}`;
        if (!groupedTransitions[key]) {
            groupedTransitions[key] = { from: tr.from, to: tr.to, symbols: [] };
        }
        groupedTransitions[key].symbols.push(tr.symbol);
    }

    for (const key in groupedTransitions) {
        const group = groupedTransitions[key];
        const p1 = coords[group.from];
        const p2 = coords[group.to];
        const symbolLabel = group.symbols.sort().join(',');
        if (group.from === group.to) {
            const r = 26, rx = 28, ry = 28, offset = 10;
            const startX = p1.x - offset, startY = p1.y - r, endX = p1.x + offset, endY = p1.y - r;
            const d = `M ${startX} ${startY} a ${rx} ${ry} 0 1 1 ${2 * offset} 0`
            const path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', d); path.setAttribute('stroke', '#007bff');
            path.setAttribute('fill', 'none'); path.setAttribute('stroke-width', '1.1');
            path.setAttribute('marker-end', 'url(#arrowhead-blue)');
            svg.appendChild(path);
            const txt = document.createElementNS(svgNS, 'text');
            txt.setAttribute('font-size', 11); txt.textContent = symbolLabel;
            txt.setAttribute('x', p1.x); txt.setAttribute('y', p1.y - 45);
            txt.setAttribute('fill', '#007bff'); txt.setAttribute('text-anchor', 'middle');
            svg.appendChild(txt)
        } else {
            const r = 26;
            let qx, qy;
            const offset = 35 * (group.from < group.to ? 1 : -1);
            qx = (p1.x + p2.x) / 2 + offset; qy = (p1.y + p2.y) / 2;
            const angleQ1 = Math.atan2(qy - p1.y, qx - p1.x);
            const startX = p1.x + r * Math.cos(angleQ1), startY = p1.y + r * Math.sin(angleQ1);
            const angleQ2 = Math.atan2(p2.y - qy, p2.x - qx);
            const endX = p2.x - r * Math.cos(angleQ2), endY = p2.y - r * Math.sin(angleQ2);
            const d = `M ${startX} ${startY} Q ${qx} ${qy} ${endX} ${endY}`
            const path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', d);
            path.setAttribute('stroke', '#007bff'); path.setAttribute('fill', 'none');
            path.setAttribute('stroke-width', '1.1'); path.setAttribute('marker-end', 'url(#arrowhead-blue)');
            svg.appendChild(path)
            const txt = document.createElementNS(svgNS, 'text');
            txt.setAttribute('font-size', 11); txt.textContent = symbolLabel;
            const textX = qx, textY = qy - 5;
            txt.setAttribute('x', textX); txt.setAttribute('y', textY);
            txt.setAttribute('text-anchor', 'middle'); txt.setAttribute('fill', '#007bff');
            svg.appendChild(txt)
        }
    }
    return svg
}


/* ---------- VALIDACIÓN DE CADENAS (Tu código original) ---------- */
function runDFA(chain, dfa) {
    let currentStateIndex = dfa.startIndex;
    for (const symbol of chain) {
        let nextStateIndex = -1;
        for (const transition of dfa.transitions) {
            if (transition.from === currentStateIndex && transition.symbol === symbol) {
                nextStateIndex = transition.to;
                break;
            }
        }
        if (nextStateIndex === -1) {
            return false; // Transición no encontrada, estado de error
        }
        currentStateIndex = nextStateIndex;
    }
    // Al final, verifica si el estado actual es de aceptación
    return dfa.states[currentStateIndex].isAccept;
}
function validateChains() {
    if (!currentDFA) {
        document.getElementById('validationResult').innerHTML = '<span class="error-text">Error: El DFA no se ha generado.</span>';
        return;
    }
    const chainInput = document.getElementById('chainInput').value;
    let chains = [];
    if (chainInput.trim() === '') {
        chains = [''];
    } else {
        chains = chainInput.split(',').map(c => c.trim());
        chains = chains.map(c => {
            if (c === 'ε' || c === 'E') return '';
            return c;
        }).filter(c => c !== null);
        if (chains.length === 0 && chainInput.includes(',')) {
            chains = [''];
        }
    }
    if (chains.length === 0) {
        document.getElementById('validationResult').textContent = 'No se encontraron cadenas para procesar.';
        return;
    }
    const acceptedChains = [];
    const rejectedChains = [];
    for (const chain of chains) {
        const isValid = runDFA(chain, currentDFA); // Usa el DFA global
        const displayChain = chain === '' ? 'ε' : chain;
        if (isValid) {
            acceptedChains.push(displayChain);
        } else {
            rejectedChains.push(displayChain);
        }
    }
    let resultHTML = '';
    if (acceptedChains.length > 0) {
        resultHTML += `<span class="success-text">✓ Aceptadas:</span> ${acceptedChains.join(', ')}<br>`;
    }
    if (rejectedChains.length > 0) {
        resultHTML += `<span class="error-text">✗ NO Aceptadas:</span> ${rejectedChains.join(', ')}<br>`;
    }
    document.getElementById('validationResult').innerHTML = resultHTML;
}
function clearValidation() {
    document.getElementById('chainInput').value = '';
    document.getElementById('validationResult').textContent = 'Esperando cadenas...';
}

/* ---------- EXPORT PDF (Tu código original) ---------- */
function exportPDF() {
    const element = document.getElementById('exportContent');
    const expr = document.getElementById('exprInput').value || 'expresion_vacia';
    const filename = `Arbol_y_AFD_${expr.replace(/[^\w]/g, '_')}.pdf`;
    const options = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 4, dpi: 300, letterRendering: true, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    const content = element.cloneNode(true);
    const svgs = content.querySelectorAll('svg');
    const promises = Array.from(svgs).map(svg => {
        return new Promise(resolve => {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            const width = svg.viewBox.baseVal.width || svg.width.baseVal.value;
            const height = svg.viewBox.baseVal.height || svg.height.baseVal.value;
            canvas.width = width * 4; canvas.height = height * 4;
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const pngData = canvas.toDataURL('image/png');
                const pngImg = document.createElement('img');
                pngImg.src = pngData;
                pngImg.style.width = '100%'; pngImg.style.height = 'auto';
                svg.parentNode.replaceChild(pngImg, svg);
                resolve();
            };
            img.onerror = (e) => { console.error(e); resolve(); };
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        });
    });
    Promise.all(promises).then(() => {
        html2pdf().from(content).set(options).save();
    });
}


/* ---------- FLUJO PRINCIPAL (MODIFICADO) ---------- */

function volverMenu() {
    window.location.href = 'index.html'
}

/**
 * Esta es la función principal que hace el trabajo.
 * Recibe una expresión regular como string.
 */
async function runAnalysis(rawRegex) {
    const info = document.getElementById('infoText');
    const canvas = document.getElementById('canvas');
    const tw = document.getElementById('tableWrap');
    const dfaWrap = document.getElementById('dfaWrap');

    if (!rawRegex) {
        info.innerHTML = '<span class="error-text">No hay expresión para analizar.</span>';
        return;
    }

    info.textContent = 'Generando análisis, por favor espera...';
    canvas.innerHTML = 'Procesando...';
    tw.innerHTML = '';
    dfaWrap.innerHTML = '';
    
    // Limpiar validaciones anteriores
    clearValidation();
    currentDFA = null;

    try {
        // 1. LLAMADA A LA API DE SPRING BOOT
        const response = await fetch('/api/v1/build-tree', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ regex: rawRegex })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error desconocido del servidor');
        }

        // 2. OBTENER EL JSON GIGANTE DEL BACKEND
        const data = await response.json();

        // 3. Almacenar datos globales para la validación
        currentDFA = data.dfa;
        currentRootFirstPos = new Set(data.rootFirstpos);
        hashLeafPos = data.hashLeafPos;

        // 4. RENDERIZAR TODO
        canvas.innerHTML = '';
        const svgTree = renderTreeSVG(data.syntaxTree);
        canvas.appendChild(svgTree);

        tw.innerHTML = '';
        const tbl = document.createElement('table');
        tbl.innerHTML = '<thead><tr><th>Nodo</th><th>sigPos()</th><th>Símbolo</th></tr></thead>';
        const tbody = document.createElement('tbody');
        const initialPos = setToArray(currentRootFirstPos);
        
        for (const row of data.followposTable) {
            const isInitial = initialPos.includes(row.nodePosition);
            const isFinal = row.nodePosition === hashLeafPos;
            const tr = document.createElement('tr');
            let label = row.nodePosition;
            if (isInitial) label = `→ ${label}`;
            if (isFinal) label = `${label} *`;
            tr.innerHTML = `
                <td>${label}</td>
                <td>{${row.followpos.join(',') || ''}}</td>
                <td>${row.symbol || ''}</td>
            `;
            tbody.appendChild(tr);
        }
        tbl.appendChild(tbody);
        tw.appendChild(tbl);

        dfaWrap.innerHTML = '';
        dfaWrap.appendChild(renderDFASVG(data.dfa));

        info.innerHTML = `<span class="small">Posiciones totales: ${data.totalPositions}. Posiciones iniciales: {${initialPos.join(',')}}. Posición de aceptación: {${hashLeafPos}} (*).</span>`;

    } catch (err) {
        console.error(err);
        info.innerHTML = `<span class="error-text">Error: ${err.message}. Verifica la sintaxis.</span>`;
    }
}

/**
 * Esta función es la que llama el botón "Generar Análisis"
 */
function buildAndRenderFromInput() {
    const raw = document.getElementById('exprInput').value;
    runAnalysis(raw); // Llama a la función principal con el texto del input
}

/**
 * Esto se ejecuta cuando la página carga por primera vez.
 * Carga la expresión desde la página anterior.
 */
document.addEventListener('DOMContentLoaded', () => {
    const raw = localStorage.getItem('expresionParaArbol');
    const input = document.getElementById('exprInput');
    
    if (raw) {
        input.value = raw; // Pone la expresión en la caja de texto
        runAnalysis(raw);  // Ejecuta el análisis automáticamente
    } else {
        // No hay nada en localStorage, solo espera a que el usuario escriba
        document.getElementById('infoText').textContent = 'Escribe una expresión y presiona "Generar Análisis".';
    }
});