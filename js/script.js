var bottle = document.getElementById("waste__bottle");

var straw = document.getElementById("waste__straw");

var yogurtCup = document.getElementById("waste__yogurtCup");
yogurtCup

var bowl = document.getElementById("creation__bowl");
var cup = document.getElementById("creation__cup");
var clock = document.getElementById("creation__clock");

var wasteCounter = 0;

var bowlChosen = false;
var cupChosen = false;
var clockChosen = false;

var createButton = document.getElementById("button");

var cupPop = document.getElementById("popUp__cup");

var exitButton = document.getElementById("popUp__exit");


function wasteAdded() {
    wasteCounter++;
    console.log(wasteCounter);
    if (wasteCounter >= 3) {

        bowl.style.filter = "saturate(1)"
        bowl.style.cursor = "pointer";

        bowl.addEventListener('click', function bowlClicked() {
            bowl.style.backgroundColor = "#3F98D2";

            clock.style.filter = "saturate(0)"
            clock.style.cursor = "no-drop";
            cup.style.filter = "saturate(0)"
            cup.style.cursor = "no-drop";
            clock.style.backgroundColor = "white";
            cup.style.backgroundColor = "white";
        })


    }

    if (wasteCounter >= 5) {
        cup.style.filter = "saturate(1)"
        cup.style.cursor = "pointer";
        cup.addEventListener('click', function cupClicked() {
            cup.style.backgroundColor = "#3F98D2";
            clock.style.filter = "saturate(0)"
            clock.style.cursor = "no-drop";
            bowl.style.filter = "saturate(0)"
            bowl.style.cursor = "no-drop";
            bowl.style.backgroundColor = "white";
            clock.style.backgroundColor = "white";
            createButton.addEventListener('click', function popUp() {
                cupPop.style.visibility = "visible";

                exitButton.addEventListener('click', function exitPopUp() {
                    cupPop.style.visibility = "hidden";

                    // page reload
                })
            })

        })
    }

    if (wasteCounter >= 10) {
        clock.style.filter = "saturate(1)"
        clock.style.cursor = "pointer";
        clock.addEventListener('click', function clockClicked() {
            clock.style.backgroundColor = "#3F98D2";
            bowl.style.filter = "saturate(0)"
            bowl.style.backgroundColor = "saturate(0)"
            bowl.style.cursor = "no-drop";
            cup.style.filter = "saturate(0)"
            cup.style.cursor =
                bowl.style.backgroundColor = "white";
            "no-drop";
            cup.style.backgroundColor = "white";

        })
    }
}

bottle.addEventListener('click', wasteAdded);

straw.addEventListener('click', wasteAdded);

yogurtCup.addEventListener('click', wasteAdded);
