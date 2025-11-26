// ---------------------------
// Hill cipher (2x2) - versión robusta
// ---------------------------

// Referencias DOM
const mensajeEl = document.getElementById('mensaje');
const matrizMensaje = document.getElementById('matrizMensaje');
const k11 = document.getElementById('k11');
const k12 = document.getElementById('k12');
const k21 = document.getElementById('k21');
const k22 = document.getElementById('k22');
const btnEncriptar = document.getElementById('encriptar');
const btnDesencriptar = document.getElementById('desencriptar');
const btnCopiar = document.getElementById('copiarCifrado');
const resultado = document.getElementById('resultado');       // encriptado
const resultadoDes = document.getElementById('resultadoDes'); // desencriptado

// Estado temporal para restaurar original (solo si encriptaste aquí)
window._lastEncryption = null;

// Utilidades
const mod = (n,m=26) => ((n % m) + m) % m;
const letraANum = c => c.charCodeAt(0) - 65;
const numALetra = n => String.fromCharCode(mod(n,26) + 65);

// Limpia texto: deja solo A-Z. opcional: pad=false/true
function limpiarSoloLetras(s, pad=false) {
    let limpio = (s || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (pad && (limpio.length % 2 !== 0)) {
        limpio += 'X';
    }
    return limpio;
}

// Muestra matriz de pares (solo ref visual)
function mostrarMatrizMensaje() {
    const texto = limpiarSoloLetras(mensajeEl.value, false);
    if (!texto) {
        matrizMensaje.textContent = 'Escribe un mensaje primero...';
        return;
    }
    const vals = texto.split('').map(letraANum);
    let out = '[';
    for (let i=0;i<vals.length;i+=2) {
        if (i>0) out += ' ';
        out += '[' + vals[i] + ', ' + ( (i+1 < vals.length) ? vals[i+1] : 23 ) + ']';
    }
    out += ']';
    matrizMensaje.textContent = out;
}

// Actualizar contador y matriz
mensajeEl.addEventListener('input', () => {
    document.querySelector('.char-count').textContent = `${mensajeEl.value.length}/30`;
    mostrarMatrizMensaje();
});
mostrarMatrizMensaje();

// Leer y normalizar clave (mod 26)
// devuelve objeto {a,b,c,d} con valores en 0..25, o null si falta alguno
function leerClave() {
    const vals = [k11.value, k12.value, k21.value, k22.value];
    if (vals.some(v => v === '' || v === null || typeof v === 'undefined')) return null;
    const a = mod(parseInt(k11.value,10));
    const b = mod(parseInt(k12.value,10));
    const c = mod(parseInt(k21.value,10));
    const d = mod(parseInt(k22.value,10));
    if ([a,b,c,d].some(x => Number.isNaN(x))) return null;
    return { a,b,c,d };
}

// Inverso modular via Euclides extendido (robusto)
function egcd(a,b) {
    if (b === 0) return { g: a, x: 1, y: 0 };
    const r = egcd(b, a % b);
    return { g: r.g, x: r.y, y: r.x - Math.floor(a / b) * r.y };
}
function modInv(a,m=26) {
    a = mod(a,m);
    const r = egcd(a,m);
    if (r.g !== 1) return null;
    return mod(r.x,m);
}

// ---------------------------
// ENCRIPTAR
// ---------------------------
btnEncriptar.addEventListener('click', () => {
    resultado.classList.remove('error');
    resultadoDes.classList.remove('error');
    resultadoDes.textContent = '—';

    const raw = mensajeEl.value || '';
    const key = leerClave();
    if (!key) {
        resultado.classList.add('error');
        resultado.textContent = 'Error: completa los 4 valores de la matriz (a,b,c,d).';
        return;
    }

    // Limpiar y añadir padding si hace falta
    const cleanedNoPad = limpiarSoloLetras(raw, false);
    if (!cleanedNoPad) {
        resultado.classList.add('error');
        resultado.textContent = 'Error: ingresa texto a cifrar (letras A-Z).';
        return;
    }
    let padded = cleanedNoPad;
    let paddedAdded = false;
    if (padded.length % 2 !== 0) { padded += 'X'; paddedAdded = true; }

    // Encriptar por bloques
    let cipher = '';
    for (let i=0;i<padded.length;i+=2) {
        const x = letraANum(padded[i]);
        const y = letraANum(padded[i+1]);
        const r1 = mod(key.a * x + key.b * y);
        const r2 = mod(key.c * x + key.d * y);
        cipher += numALetra(r1) + numALetra(r2);
    }

    // Guardar estado para poder restaurar ORIGINAL con espacios/case si el usuario
    // desencripta inmediatamente después (mejor experiencia)
    window._lastEncryption = {
        originalRaw: raw,
        cleanedNoPad: cleanedNoPad,
        padded: padded,
        paddedAdded: paddedAdded,
        key: key,
        cipher: cipher
    };

    resultado.textContent = cipher;
});

// Botón: copiar cifrado al textarea (comodidad para probar desencriptar)
btnCopiar.addEventListener('click', () => {
    if (resultado.textContent && resultado.textContent !== '—') {
        mensajeEl.value = resultado.textContent;
        mensajeEl.dispatchEvent(new Event('input'));
    }
});

// ---------------------------
// DESENCRIPTAR
// ---------------------------
btnDesencriptar.addEventListener('click', () => {
    resultado.classList.remove('error');
    resultadoDes.classList.remove('error');

    const key = leerClave();
    if (!key) {
        resultadoDes.classList.add('error');
        resultadoDes.textContent = 'Error: completa los 4 valores de la matriz (a,b,c,d).';
        return;
    }

    // Tomamos EXACTAMENTE el contenido del textarea como ciphertext (no forzamos padding)
    let cipherText = limpiarSoloLetras(mensajeEl.value, false);
    if (!cipherText) {
        resultadoDes.classList.add('error');
        resultadoDes.textContent = 'Error: ingresa texto cifrado en el textarea para desencriptar.';
        return;
    }

    // Si ciphertext tiene longitud impar, la reparo automáticamente y aviso
    let repaired = false;
    if (cipherText.length % 2 !== 0) {
        cipherText += 'X';
        repaired = true;
    }

    // Determinante y su inverso mod26
    // Usamos las entradas normalizadas de key (0..25)
    const det = mod(key.a * key.d - key.b * key.c);
    const invDet = modInv(det, 26);
    if (invDet === null) {
        resultadoDes.classList.add('error');
        resultadoDes.textContent = `Error: El determinante = ${det} no tiene inverso módulo 26 → no es posible desencriptar con esta clave.`;
        return;
    }

    // Matriz inversa: invDet * adj (adj = [d, -b; -c, a]) normalizada
    const ai = mod(invDet * key.d);
    const bi = mod(invDet * (-key.b));
    const ci = mod(invDet * (-key.c));
    const di = mod(invDet * key.a);

    // Desencriptar bloques
    let plainClean = '';
    for (let i=0;i<cipherText.length;i+=2) {
        const x = letraANum(cipherText[i]);
        const y = letraANum(cipherText[i+1]);
        const p1 = mod(ai * x + bi * y);
        const p2 = mod(ci * x + di * y);
        plainClean += numALetra(p1) + numALetra(p2);
    }

    // Intentar restaurar formato original (espacios y mayúsculas/minúsculas)
    // Solo se puede hacer si la encriptación la hiciste en esta misma sesión con este UI
    if (window._lastEncryption && window._lastEncryption.cipher === cipherText.slice(0, window._lastEncryption.cipher.length)) {
        // Si coincide exactamente (o coincide la parte inicial), devolvemos el original exacto
        resultadoDes.textContent = `Resultado: ${window._lastEncryption.originalRaw}`;
        // También mostramos la limpieza que se devolvió para verificación
        if (window._lastEncryption.paddedAdded && plainClean.endsWith('X')) {
            // quitar la X añadida en cifrado para mostrar la versión sin padding en log
            const withoutPad = plainClean.slice(0, -1);
            resultadoDes.textContent += `\n(Descifrado limpio sin padding: ${withoutPad})`;
        } else {
            resultadoDes.textContent += `\n(Descifrado limpio: ${plainClean})`;
        }
        return;
    }

    // Si no podemos restaurar el original (no fue creado aquí), devolvemos texto limpio A–Z
    // y removemos el padding X final solo si lo detectamos justo añadido por reparación
    let finalPlain = plainClean;
    if (repaired && finalPlain.endsWith('X')) {
        finalPlain = finalPlain.slice(0, -1);
    }

    resultadoDes.textContent = `Resultado: ${finalPlain}`;
});

