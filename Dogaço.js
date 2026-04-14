function funcaoDelicia() {

    let basico = parseFloat(document.getElementById("HotDogBase")).value;
    let duplo = parseFloat(document.getElementById("HotDogDouble")).value;
    let salada = parseFloat(document.getElementById("Xsalada")).value);
    let R350mL = parseFloat(document.getElementById("Refri350ml")).value;
    let R1L = parseFloat(document.getElementById("Refri1L")).value);

    let basicoT = (basico * 22.00);
    let duploT = (duplo * 26.00);
    let saladaT = (salada * 29.00);
    let R350mlT = (R350mL * 5.00);
    let R1LT = (R1L * 8.00);


let total = basicoT + duploT + saladaT + R350mlT + R1LT;

    if (basicoT === 0 || duploT === 0 || saladaT === 0 || R350mlT === 0 || R1LT === 0 || ) {
        footer.classList.add("erro");
        mensagem.innerHTML = "PQ VC QUIS PEDIR EM PRIMEIRO LUGAR";
        document.getElementById("respTotal").innerHTML = "-";
    }else if (basicoT < 0 || duploT < 0 || saladaT < 0 || R350mlT < 0 || R1LT < 0 || ) {
        footer.classList.add("erro");
        mensagem.innerHTML = " é sério RADAMES" ;
        document.getElementById("respTotal").innerHTML = "-";
    } 

    if (total === 0 ) {
        footer.classList.add("erro");
        mensagem.innerHTML = "PQ VC QUIS PEDIR EM PRIMEIRO LUGAR";
        document.getElementById("respTotal").innerHTML = "-";
    }else if (total < 0) {
        footer.classList.add("erro");
        mensagem.innerHTML = " pobre " ;
        document.getElementById("respTotal").innerHTML = "-";
    } else if (total > 0) {

         mensagem.innerHTML = "Preço total";
        }

        footer.classList.remove("erro");
        document.getElementById("respTotal").innerHTML = total.toFixed(2);
    }
