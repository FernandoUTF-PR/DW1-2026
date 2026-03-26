function funcaoPeso() {
    let altura = parseFloat(document.getElementById("inputAltura").value);
    let peso = parseFloat(document.getElementById("inputPeso").value);


    let IMC = peso / (altura * altura);

    let footer = document.getElementById("footer");
    let mensagem = document.getElementById("mensagem");

    if (IMC < 0) {
        footer.classList.add("erro");
        mensagem.innerHTML = "Que corpo é esse, mds — impossível calcular";
        document.getElementById("respPeso").innerHTML = "-";

    } else {
        footer.classList.remove("erro");
        mensagem.innerHTML = "Cálculo realizado com sucesso";

        let IMC = peso / (altura * altura);


        document.getElementById("respPeso").innerHTML = IMC;

        if (IMC < 18.5) {
            footer.classList.add("erro");
            mensagem.innerHTML = "Abaixo do peso";
        }
        else if (IMC < 24.9) {
            mensagem.innerHTML = "Peso normal";
        }
        else if (IMC < 29.9) {
            footer.classList.add("erro");
            mensagem.innerHTML = "Sobrepeso";
        }
        else if (IMC < 34.9) {
            footer.classList.add("erro");
            mensagem.innerHTML = "Obesidade Grau I";
        }
        else if (IMC < 39.9) {
            footer.classList.add("erro");
            mensagem.innerHTML = "Obesidade Grau II";
        }
        else if (IMC > 40.0) {
            footer.classList.add("erro");
            mensagem.innerHTML = "Obsesidade Grau III";
        }

    }
}
