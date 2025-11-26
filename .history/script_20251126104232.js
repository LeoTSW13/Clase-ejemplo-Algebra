// ---------------------------
// Funciones auxiliares
// ---------------------------

// Limpia el mensaje (solo letras A-Z) y agrega padding si es impar
function limpiarMensaje(msg) {
    let limpio = msg.toUpperCase().replace(/[^A-Z]/g, "");
    if (limpio.length % 2 !== 0) limpio += "X";
    return limpio;
}

// Convierte letra → número (A=0, B=1…)
function letraANum(c) {
    return c.charCodeAt(0) - 65;
}

// Convierte número → letra mod 26
function numALetra(n) {
    return String.fromCharCode((n % 26 + 26) % 26 + 65);
}

// Calcula inverso modular usando Euclides
function inversoMod(n, mod) {
    n = (n % mod + mod) % mod;
    for (let i = 1; i < mod; i++) {
        if ((n * i) % mod === 1) return i;
    }
    return null;
}

// ---------------------------
// ENCRIPTAR
// ---------------------------
document.getElementById("encriptar").addEventListener("click", () => {

    let msg = limpiarMensaje(document.getElementById("mensaje").value);

    let a = parseInt(document.getElementById("k11").value);
    let b = parseInt(document.getElementById("k12").value);
    let c = parseInt(document.getElementById("k21").value);
    let d = parseInt(document.getElementById("k22").value);

    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) {
        document.getElementById("resultado").innerText = "Error: Llena toda la matriz.";
        return;
    }

    let salida = "";

    for (let i = 0; i < msg.length; i += 2) {
        let x = letraANum(msg[i]);
        let y = letraANum(msg[i + 1]);

        let r1 = (a * x + b * y) % 26;
        let r2 = (c * x + d * y) % 26;

        salida += numALetra(r1) + numALetra(r2);
    }

    document.getElementById("resultado").innerText = salida;
});

// ---------------------------
// DESENCRIPTAR
// ---------------------------
document.getElementById("desencriptar").addEventListener("click", () => {

    let msg = limpiarMensaje(document.getElementById("mensaje").value);

    let a = parseInt(document.getElementById("k11").value);
    let b = parseInt(document.getElementById("k12").value);
    let c = parseInt(document.getElementById("k21").value);
    let d = parseInt(document.getElementById("k22").value);

    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) {
        document.getElementById("resultadoDes").innerText = "Error: Llena toda la matriz.";
        return;
    }

    // Determinante
    let det = (a * d - b * c) % 26;
    det = (det + 26) % 26;

    let invDet = inversoMod(det, 26);

    if (invDet === null) {
        document.getElementById("resultadoDes").innerText =
            `Error: El determinante = ${det} no tiene inverso módulo 26.`;
        return;
    }

    // Matriz inversa mod 26
    let ai = ( d * invDet) % 26;
    let bi = (-b * invDet) % 26;
    let ci = (-c * invDet) % 26;
    let di = ( a * invDet) % 26;

    let salida = "";

    for (let i = 0; i < msg.length; i += 2) {
        let x = letraANum(msg[i]);
        let y = letraANum(msg[i + 1]);

        let r1 = (ai * x + bi * y) % 26;
        let r2 = (ci * x + di * y) % 26;

        salida += numALetra(r1) + numALetra(r2);
    }

    document.getElementById("resultadoDes").innerText = salida;
});
