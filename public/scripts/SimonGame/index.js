var buttonColors = ["blue", "red", "green", "yellow"];
var gamePatteren = [];
var randomChosenColur;
var userClickedPattern = [];
var level = 1;

$(document).on("keydown", function(e) {
    if (level == 1){
        nextSequence();
    }
})

function nextSequence() {

    $("#level-title").text("Level "+ level++);

   randomChosenColur = buttonColors[Math.floor(Math.random() * 4)];

   gamePatteren.push(randomChosenColur);

   $("#"+ randomChosenColur).fadeOut(100).fadeIn(100);

   playSound(randomChosenColur);

}


$(".btn").on("click", function() {

    userClickedPattern.push(this.id)

    $(this).addClass("pressed");
    setTimeout(() => {
        $(this).removeClass("pressed");
    }, 100);

    playSound(this.id);

    var index = userClickedPattern.length - 1;

    if (gamePatteren[index] == userClickedPattern[index]){
        if(gamePatteren.length == userClickedPattern.length){
            setTimeout(() => {
                nextSequence();
            }, 1000);
            userClickedPattern = [];
        }
    } else {

        gameOver()

        startOver()

    }
} );


function playSound(color) {

    var audio = new Audio("sounds/SimonGame/"+ color +".mp3");
    audio.play();

}

function gameOver() {

    playSound("wrong");

    $("#level-title").text("Game Over, Press A to Restart");

    $("body").addClass("game-over");

    setTimeout(() => {
        $("body").removeClass("game-over");
    }, 200);
}

function startOver() {
    const url = window.location.href;
    if (gamePatteren.length != 0) {
        $.ajax({ url, type: 'POST', data: JSON.stringify({ level }), contentType: 'application/json; charset=utf-8' }).done((data) => {
            const bestScore = Number($('#HighScore').attr('level'));
            if (bestScore < data.level) {
                const bestScore = $('#HighScore').attr('level', data.level);
                $('#HighScore').text(`Best Score: ${data.level}`);
            }
        })
    }
    gamePatteren.length = [];
    userClickedPattern = [];
    level = 1;
}