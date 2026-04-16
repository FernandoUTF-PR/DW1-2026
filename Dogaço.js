function funcaoDelicia() {

    // CORREÇÃO: o parseFloat deve envolver o .value, não o contrário
    let basico = parseFloat(document.getElementById("HotDogBase").value);
    let duplo = parseFloat(document.getElementById("HotDogDouble").value);
    let salada = parseFloat(document.getElementById("Xsalada").value);
    let R350mL = parseFloat(document.getElementById("Refri350ml").value);
    let R1L = parseFloat(document.getElementById("Refri1L").value);

    // Se algum campo estiver vazio, vira NaN ⇒ tratamos como 0
    basico = isNaN(basico) ? 0 : basico;
    duplo = isNaN(duplo) ? 0 : duplo;
    salada = isNaN(salada) ? 0 : salada;
    R350mL = isNaN(R350mL) ? 0 : R350mL;
    R1L = isNaN(R1L) ? 0 : R1L;

    let basicoT = basico * 22.00;
    let duploT = duplo * 26.00;
    let saladaT = salada * 29.00;
    let R350mlT = R350mL * 5.00;
    let R1LT = R1L * 8.00;

    let total = basicoT + duploT + saladaT + R350mlT + R1LT;

    let footer = document.getElementById("footer");
    let mensagem = document.getElementById("mensagem");

    // ❌ aqui tinha erro: você colocou "|| )"
    if (
        basicoT === 0 &&
        duploT === 0 &&
        saladaT === 0 &&
        R350mlT === 0 &&
        R1LT === 0
    ) {
        footer.classList.add("erro");
        mensagem.innerHTML = "PQ VC QUIS PEDIR EM PRIMEIRO LUGAR";
        document.getElementById("respTotal").innerHTML = "-";
        return;
    }

    if (
        basicoT < 0 ||
        duploT < 0 ||
        saladaT < 0 ||
        R350mlT < 0 ||
        R1LT < 0
    ) {
        footer.classList.add("erro");
        mensagem.innerHTML = "é sério RADAMÉS?";
        document.getElementById("respTotal").innerHTML = "-";
        return;
    }

    if (total === 0) {
        footer.classList.add("erro");
        mensagem.innerHTML = "PQ VC QUIS PEDIR EM PRIMEIRO LUGAR";
        document.getElementById("respTotal").innerHTML = "-";
        return;
    }

    if (total < 0) {
        footer.classList.add("erro");
        mensagem.innerHTML = "pobre";
        document.getElementById("respTotal").innerHTML = "-";
        return;
    }

    // Se deu boa
    footer.classList.remove("erro");
    mensagem.innerHTML = "Preço total";
    document.getElementById("respTotal").innerHTML = total.toFixed(2);
}
