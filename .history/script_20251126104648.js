// script.js - versión de diagnóstico y corrección robusta
const mensajeEl = document.getElementById('mensaje');
const matrizMensaje = document.getElementById('matrizMensaje');
const k11 = document.getElementById('k11');
const k12 = document.getElementById('k12');
const k21 = document.getElementById('k21');
const k22 = document.getElementById('k22');
const btnEncriptar = document.getElementById('encriptar');
const btnDesencriptar = document.getElementById('desencriptar');
const resultado = document.getElementById('resultado');       // encriptado
const resultadoDes = document.getElementById('resultadoDes'); // desencriptado

// Helpers
const mod26 = n => ((n % 26) + 26) % 26;
const letraANum = c => c.charCodeAt(0) - 65;
const numALetra = n => String.fromCharCode(mod26(n) + 65);

function limpiarSoloLetras(s) {
    return s.toUpperCase().replace(/[^A-Z]/g, '');
}
function mostrarMatrizMensaje() {
    const texto = limpiarSoloLetras(mensajeEl.value);
    if (!texto) {
        matrizMensaje.textContent = 'Escribe un mensaje primero...';
        return;
    }
    const vals = texto.split('').map(letraANum);
    let out = '[';
    for (let i = 0; i < vals.length; i += 2) {
        if (i > 0) out += ' ';
        out += '[' + vals[i] + ', ' + ( (i+1 < vals.length) ? vals[i+1] : 23 ) + ']';
    }
    out += ']';
    matrizMensaje.textContent = out;
}
mensajeEl.addEventListener('input', () => mostrarMatrizMensaje());

// Diagnóstico detallado de clave
function leerClave() {
    const a = parseInt(k11.value, 10);
    const b = parseInt(k12.value, 10);
    const c = parseInt(k21.value, 10);
    const d = parseInt(k22.value, 10);
    if ([a,b,c,d].some(v => Number.isNaN(v))) return null;
    return {a,b,c,d};
}

// ENCRIPTAR con log
btnEncriptar.addEventListener('click', () => {
    resultado.classList.remove('error');
    resultadoDes.classList.remove('error');
    resultadoDes.textContent = '—';
    resultado.textContent = '';

    const key = leerClave();
    if (!key) {
        resultado.textContent = 'Error: completa los 4 valores de la matriz (a,b,c,d).';
        resultado.classList.add('error');
        return;
    }

    let texto = limpiarSoloLetras(mensajeEl.value);
    if (!texto) {
        resultado.textContent = 'Error: ingresa texto a cifrar.';
        resultado.classList.add('error');
        return;
    }

    // padding X si impar (pero solo para cifrar)
    let padded = texto;
    if (padded.length % 2 !== 0) padded += 'X';

    let cipher = '';
    let log = `Clave usada: [${key.a}, ${key.b}; ${key.c}, ${key.d}]\nTexto limpiado: ${texto} (pad: ${padded})\n\nBloques y cálculo:\n`;

    for (let i = 0; i < padded.length; i += 2) {
        const x = letraANum(padded[i]);
        const y = letraANum(padded[i+1]);
        const r1 = mod26(key.a * x + key.b * y);
        const r2 = mod26(key.c * x + key.d * y);
        cipher += numALetra(r1) + numALetra(r2);
        log += `[${padded[i]}(${x}), ${padded[i+1]}(${y})] -> (${r1}, ${r2}) -> ${numALetra(r1)}${numALetra(r2)}\n`;
    }

    resultado.textContent = cipher;
    resultado.title = 'Click para copiar'; // hint
    // small convenience: clicking resultado copia el texto al portapapeles
    resultado.onclick = () => { navigator.clipboard?.writeText(cipher).catch(()=>{}); };

    // opcional: también mostramos el log (debajo del resultadoDes para no romper UI)
    resultadoDes.textContent = 'Log (último cifrado):\n' + log;
});

// DESENCRIPTAR con diagnóstico completo
btnDesencriptar.addEventListener('click', () => {
    resultado.classList.remove('error');
    resultadoDes.classList.remove('error');
    resultado.textContent = resultado.textContent || resultado.textContent === '' ? resultado.textContent : '—';
    resultadoDes.textContent = '';

    const key = leerClave();
    if (!key) {
        resultadoDes.textContent = 'Error: completa los 4 valores de la matriz (a,b,c,d).';
        resultadoDes.classList.add('error');
        return;
    }

    let texto = limpiarSoloLetras(mensajeEl.value);
    if (!texto) {
        resultadoDes.textContent = 'Error: ingresa texto cifrado en el textarea para desencriptar.';
        resultadoDes.classList.add('error');
        return;
    }

    // reparación automática: si impar, avisar y agregar X
    if (texto.length % 2 !== 0) {
        texto += 'X';
        // mantendremos el aviso en el log
    }

    // determinante (entero), det mod 26
    const det = key.a * key.d - key.b * key.c;
    const detMod = mod26(det);
    // buscar inverso multiplicativo de detMod
    let invDet = null;
    for (let i = 1; i < 26; i++) if ((detMod * i) % 26 === 1) { invDet = i; break; }

    // Mostrar diagnóstico temprano
    let log = `Clave: [${key.a}, ${key.b}; ${key.c}, ${key.d}]\nDeterminante (entero)= ${det}\nDet mod26 = ${detMod}\n`;
    if (invDet === null) {
        log += `Resultado: EL DETERMINANTE NO TIENE INVERSO MÓDULO 26 → no se puede desencriptar con esta clave.\n`;
        resultadoDes.textContent = log;
        resultadoDes.classList.add('error');
        return;
    }
    log += `Inverso det mod26 = ${invDet}\n\nCalculando matriz inversa (adj * invDet mod26):\n`;

    // adjunta: [d, -b; -c, a] ; invKey = invDet * adj mod26
    const ai = mod26(invDet * key.d);
    const bi = mod26(invDet * (-key.b));
    const ci = mod26(invDet * (-key.c));
    const di = mod26(invDet * key.a);
    log += `[ ${ai}, ${bi} ; ${ci}, ${di} ]\n\nDesencriptando bloques:\n`;

    let plain = '';
    for (let i = 0; i < texto.length; i += 2) {
        const x = letraANum(texto[i]);
        const y = letraANum(texto[i+1]);
        const p1 = mod26(ai * x + bi * y);
        const p2 = mod26(ci * x + di * y);
        plain += numALetra(p1) + numALetra(p2);
        log += `[${texto[i]}(${x}), ${texto[i+1]}(${y})] -> (${p1}, ${p2}) -> ${numALetra(p1)}${numALetra(p2)}\n`;
    }

    resultadoDes.textContent = `Resultado: ${plain}\n\n` + log;
});

// --- UTIL: copia el resultado en el textarea para probar fácilmente ---
// (crea dinámicamente un botón pequeño si quieres)
(function crearBotonCopiarResultado() {
    // si existe el contenedor .container, añadimos un botón debajo del resultado
    const cont = document.querySelector('.container');
    if (!cont) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Copiar resultado cifrado al mensaje';
    btn.style.marginTop = '8px';
    btn.onclick = () => {
        if (resultado.textContent && resultado.textContent !== '—') {
            mensajeEl.value = resultado.textContent;
            mensajeEl.dispatchEvent(new Event('input'));
        }
    };
    // insert after resultado section
    const sec = resultado.parentElement;
    if (sec) sec.appendChild(btn);
})();
