var persona1 = document.getElementById("persona1");
var persona2 = document.getElementById("persona2");
var persona3 = document.getElementById("persona3");
var persona4 = document.getElementById("persona4");

var persona1desc = document.getElementById("persona__persona1");
var persona2desc = document.getElementById("persona__persona2");
var persona3desc = document.getElementById("persona__persona3");
var persona4desc = document.getElementById("persona__persona4");

persona1.addEventListener('click', function viewPersona() {
    window.scrollBy(0, 900);
    persona1desc.style.visibility = "visible";
    persona2desc.style.visibility = "hidden";
    persona3desc.style.visibility = "hidden";
    persona4desc.style.visibility = "hidden";
})

persona2.addEventListener('click', function viewPersona() {
    window.scrollBy(0, 900);
    persona2desc.style.visibility = "visible";
    persona1desc.style.visibility = "hidden";
    persona3desc.style.visibility = "hidden";
    persona4desc.style.visibility = "hidden";
})

persona3.addEventListener('click', function viewPersona() {
    window.scrollBy(0, 900);
    persona3desc.style.visibility = "visible";
    persona2desc.style.visibility = "hidden";
    persona1desc.style.visibility = "hidden";
    persona4desc.style.visibility = "hidden";

})

persona4.addEventListener('click', function viewPersona() {
    window.scrollBy(0, 900);
    persona4desc.style.visibility = "visible";
    persona2desc.style.visibility = "hidden";
    persona3desc.style.visibility = "hidden";
    persona1desc.style.visibility = "hidden";

})
