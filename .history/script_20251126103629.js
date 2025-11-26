// script.js - versión corregida
const mensaje = document.getElementById('mensaje');
const charCount = document.querySelector('.char-count');
const matrizMensaje = document.getElementById('matrizMensaje');
const k11 = document.getElementById('k11');
const k12 = document.getElementById('k12');
const k21 = document.getElementById('k21');
const k22 = document.getElementById('k22');
const btnEncriptar = document.getElementById('encriptar');
const btnDesencriptar = document.getElementById('desencriptar');
const resultado = document.getElementById('resultado');       // para encriptado
const resultadoDes = document.getElementById('resultadoDes'); // para desencriptado

// contador y vista de pares
mensaje.addEventListener('input', () => {
    const len = mensaje.value.length;
    charCount.textContent = `${len}/30`;
    mostrarMatrizMensaje();
});

function mostrarMatrizMensaje() {
    const texto = mensaje.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (texto.length === 0) {
        matrizMensaje.textContent = 'Escribe un mensaje primero...';
        return;
    }
    const valores = texto.split('').map(c => c.charCodeAt(0) - 65);
    let matriz = '[';
    for (let i = 0; i < valores.length; i += 2) {
        if (i > 0) matriz += ' ';
        matriz += '[' + valores[i];
        if (i + 1 < valores.length) {
            matriz += ', ' + valores[i + 1];
        } else {
            matriz += ', 23'; // padding 'X'
        }
        matriz += ']';
    }
    matriz += ']';
    matrizMensaje.textContent = matriz;
}

// ------------------
// ENCRIPTAR
// ------------------
btnEncriptar.addEventListener('click', () => {
    resultado.classList.remove('error');
    resultadoDes.classList.remove('error');
    resultadoDes.textContent = '—'; // limpiar desencriptado
    resultado.textContent = '';

    const key = [
        [parseInt(k11.value) || 0, parseInt(k12.value) || 0],
        [parseInt(k21.value) || 0, parseInt(k22.value) || 0]
    ];

    const texto = mensaje.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (texto.length === 0) {
        resultado.textContent = 'Error: Ingresa un mensaje';
        resultado.classList.add('error');
        return;
    }

    let numeros = texto.split('').map(c => c.charCodeAt(0) - 65);
    if (numeros.length % 2 !== 0) numeros.push(23); // 'X' padding

    let encriptado = '';
    for (let i = 0; i < numeros.length; i += 2) {
        const v1 = numeros[i], v2 = numeros[i+1];
        const c1 = ((key[0][0] * v1 + key[0][1] * v2) % 26 + 26) % 26;
        const c2 = ((key[1][0] * v1 + key[1][1] * v2) % 26 + 26) % 26;
        encriptado += String.fromCharCode(65 + c1);
        encriptado += String.fromCharCode(65 + c2);
    }

    resultado.textContent = encriptado;
});

// ------------------
// UTILIDADES MATEMÁTICAS
// ------------------
function egcd(a, b) {
    if (b === 0) return { g: a, x: 1, y: 0 };
    const r = egcd(b, a % b);
    return { g: r.g, x: r.y, y: r.x - Math.floor(a / b) * r.y };
}
function modInv(a, m) {
    a = ((a % m) + m) % m;
    const r = egcd(a, m);
    if (r.g !== 1) return null;
    return (r.x % m + m) % m;
}
function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) {
        const t = a % b;
        a = b;
        b = t;
    }
    return a;
}

// ------------------
// DESENCRIPTAR (salida en resultadoDes)
// ------------------
btnDesencriptar.addEventListener('click', () => {
    resultado.classList.remove('error');
    resultadoDes.classList.remove('error');
    resultado.textContent = resultado.textContent || resultado.textContent === '' ? resultado.textContent : '—';
    resultadoDes.textContent = '';

    const key = [
        [parseInt(k11.value) || 0, parseInt(k12.value) || 0],
        [parseInt(k21.value) || 0, parseInt(k22.value) || 0]
    ];

    let texto = mensaje.value.toUpperCase().replace(/[^A-Z]/g, '');

    if (texto.length === 0) {
        resultadoDes.textContent = 'Error: Ingresa texto cifrado';
        resultadoDes.classList.add('error');
        return;
    }

    // reparar impar
    if (texto.length % 2 !== 0) {
        texto += 'X';
        resultadoDes.textContent = '⚠ Se agregó una X para completar el par.\n';
    }

    // determinante entero y modulo 26
    let det = key[0][0] * key[1][1] - key[0][1] * key[1][0];
    let detMod = ((det % 26) + 26) % 26;
    const theGcd = gcd(detMod, 26);

    // diagnostico visible
    resultadoDes.textContent += `det = ${det}  → det mod 26 = ${detMod}  (gcd=${theGcd})\n`;

    if (theGcd !== 1) {
        resultadoDes.classList.add('error');
        resultadoDes.textContent += 'Error: El determinante NO tiene inverso módulo 26 → NO se puede desencriptar con esta clave.\n';
        resultadoDes.textContent += 'Sugerencia: usa una matriz cuyo det mod 26 sea coprimo con 26 (1,3,5,7,9,11,15,17,19,21,23,25).\n';
        resultadoDes.textContent += 'Ejemplos válidos (prueba a ponerlos en a,b,c,d): [[3,3],[2,5]]  ó  [[7,8],[11,3]].\n';
        return;
    }

    const invDet = modInv(detMod, 26);
    if (invDet === null) {
        resultadoDes.classList.add('error');
        resultadoDes.textContent += 'Error inesperado: no se pudo calcular el inverso modular del determinante.\n';
        return;
    }

    // matriz adjunta e inversa mod 26
    const adj = [
        [ key[1][1], -key[0][1] ],
        [ -key[1][0], key[0][0] ]
    ];
    const invKey = [
        [
            (invDet * ((adj[0][0] % 26 + 26) % 26)) % 26,
            (invDet * ((adj[0][1] % 26 + 26) % 26)) % 26
        ],
        [
            (invDet * ((adj[1][0] % 26 + 26) % 26)) % 26,
            (invDet * ((adj[1][1] % 26 + 26) % 26)) % 26
        ]
    ];

    resultadoDes.textContent += `Inverso det mod26 = ${invDet}\nMatriz inversa mod26 = [ [${invKey[0][0]}, ${invKey[0][1]}], [${invKey[1][0]}, ${invKey[1][1]}] ]\n\n`;

    // desencriptar y mostrar en resultadoDes
    let numeros = texto.split('').map(c => c.charCodeAt(0) - 65);
    let dec = '';
    for (let i = 0; i < numeros.length; i += 2) {
        const v1 = numeros[i], v2 = numeros[i+1];
        const p1 = ((invKey[0][0] * v1 + invKey[0][1] * v2) % 26 + 26) % 26;
        const p2 = ((invKey[1][0] * v1 + invKey[1][1] * v2) % 26 + 26) % 26;
        dec += String.fromCharCode(65 + p1);
        dec += String.fromCharCode(65 + p2);
    }

    resultadoDes.classList.remove('error');
    resultadoDes.textContent += `Resultado: ${dec}`;
});

// ------------------
// FUNCION OPCIONAL: generar una clave válida y ponerla en los inputs
// (no se activa automáticamente — llama a generateValidKey() desde consola o añade un botón si quieres)
// ------------------
function generateValidKey() {
    // lista corta de matrices con det mod26 coprimo (ejemplos)
    const examples = [
        [3,3,2,5], // det=9
        [7,8,11,3], // det= (7*3 - 8*11)=21 -> mod26 21 coprimo
        [5,8,17,3], // ejemplo
        [1,2,3,4] // ojo: det = -2 -> mod26 24 (no válido), agregado por contraste
    ];
    // escoger aleatoria que sea válida
    for (let i=0;i<examples.length;i++) {
        const ex = examples[i];
        const det = ex[0]*ex[3] - ex[1]*ex[2];
        const detMod = ((det%26)+26)%26;
        if (gcd(detMod,26) === 1) {
            k11.value = ex[0]; k12.value = ex[1]; k21.value = ex[2]; k22.value = ex[3];
            return {ok:true, ex};
        }
    }
    return {ok:false};
}
