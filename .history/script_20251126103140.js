const mensaje = document.getElementById('mensaje');
const charCount = document.querySelector('.char-count');
const matrizMensaje = document.getElementById('matrizMensaje');
const k11 = document.getElementById('k11');
const k12 = document.getElementById('k12');
const k21 = document.getElementById('k21');
const k22 = document.getElementById('k22');
const btnEncriptar = document.getElementById('encriptar');
const btnDesencriptar = document.getElementById('desencriptar');
const resultado = document.getElementById('resultado');

// Actualizar contador y matriz del mensaje
mensaje.addEventListener('input', () => {
    const len = mensaje.value.length;
    charCount.textContent = `${len}/30`;
    mostrarMatrizMensaje();
});

// Mostrar pares del mensaje
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
            matriz += ', 23'; // X de padding
        }

        matriz += ']';
    }

    matriz += ']';
    matrizMensaje.textContent = matriz;
}

// ===============================
//     HILL ENCRYPTION
// ===============================

btnEncriptar.addEventListener('click', () => {
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

    if (numeros.length % 2 !== 0) numeros.push(23); // X

    let encriptado = '';

    for (let i = 0; i < numeros.length; i += 2) {
        const v1 = numeros[i], v2 = numeros[i + 1];

        const c1 = (key[0][0] * v1 + key[0][1] * v2) % 26;
        const c2 = (key[1][0] * v1 + key[1][1] * v2) % 26;

        encriptado += String.fromCharCode(65 + c1);
        encriptado += String.fromCharCode(65 + c2);
    }

    resultado.classList.remove('error');
    resultado.textContent = encriptado;
});

// ===============================
//     HILL DECRYPTION
// ===============================

// Euclides Extendido
function egcd(a, b) {
    if (b === 0) return {g: a, x: 1, y: 0};
    const r = egcd(b, a % b);
    return { g: r.g, x: r.y, y: r.x - Math.floor(a / b) * r.y };
}

function modInv(a, m) {
    a = ((a % m) + m) % m;
    const r = egcd(a, m);
    if (r.g !== 1) return null;
    return (r.x % m + m) % m;
}

btnDesencriptar.addEventListener('click', () => {
    resultado.classList.remove('error');
    resultado.textContent = '';

    const key = [
        [parseInt(k11.value) || 0, parseInt(k12.value) || 0],
        [parseInt(k21.value) || 0, parseInt(k22.value) || 0]
    ];

    let texto = mensaje.value.toUpperCase().replace(/[^A-Z]/g, '');

    if (texto.length === 0) {
        resultado.textContent = 'Error: Ingresa texto cifrado';
        resultado.classList.add('error');
        return;
    }

    // Reparar longitud impar automáticamente
    if (texto.length % 2 !== 0) {
        texto += 'X';
        resultado.textContent = '⚠ Se agregó una X para completar el par.\n';
    }

    // Determinante
    let det = key[0][0] * key[1][1] - key[0][1] * key[1][0];
    let detMod = ((det % 26) + 26) % 26;

    const invDet = modInv(detMod, 26);

    if (invDet === null) {
        resultado.textContent += `Error: El determinante = ${detMod} no tiene inverso módulo 26.\n`;
        resultado.classList.add('error');
        return;
    }

    // Matriz inversa
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

    let numeros = texto.split('').map(c => c.charCodeAt(0) - 65);
    let dec = '';

    for (let i = 0; i < numeros.length; i += 2) {
        const v1 = numeros[i], v2 = numeros[i + 1];

        const p1 = (invKey[0][0] * v1 + invKey[0][1] * v2) % 26;
        const p2 = (invKey[1][0] * v1 + invKey[1][1] * v2) % 26;

        dec += String.fromCharCode(65 + (p1 + 26) % 26);
        dec += String.fromCharCode(65 + (p2 + 26) % 26);
    }

    resultado.textContent += dec;
});
