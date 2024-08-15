let Colors = ["red", "yellow", "green"];
let row = 0;
let col = 0;
const lenght = Number($("html").attr("lenght"));
const number = Number($("html").attr("number"));
let word = [];

$(document).on("keydown", gameStart);

$("#chat_check").change(function () {
  if ($(this).is(":checked")) {
    $(document).off("keydown");
  } else {
    $(document).on("keydown", gameStart);
  }
});

function gameStart(e) {
  const key = e.key.toUpperCase();
  if (key == "ENTER" && col == lenght) {
    col++;
    check();
  } else if (key == "BACKSPACE" && col != lenght + 1) {
    col = col != 0 ? col - 1 : 0;
    word.pop(key[0]);
    $(`.row-${row} .col-${col}`).text("");
  } else if (col < lenght && key.length == 1 && key != key.toLowerCase()) {
    $(`.row-${row} .col-${col++}`).text(key[0]);
    word.push(key[0]);
  }
}

function check() {
  const url = window.location.href;
  if (col == lenght + 1 && row <= lenght) {
    $.ajax({
      url,
      type: "POST",
      data: JSON.stringify({ lenght, number, guess: word.join(""), row }),
      contentType: "application/json; charset=utf-8",
    }).done((data) => {
      const list = data.correct;
      for (let i = 0; i < list.length; i++) {
        $(`.row-${row} .col-${i}`).addClass(Colors[list[i]]);
      }
      word = [];
      col = 0;
      row++;
      const gameName = "Wordle";
      if (data.won || row == lenght + 1) {
        let score = list.reduce(
          (accumulator, currentValue) => accumulator + currentValue,
          lenght + 1 - row
        );
        console.log(score);
        $.ajax({
          url: "/hub",
          type: "POST",
          data: JSON.stringify({ score, gameName }),
          contentType: "application/json; charset=utf-8",
        }).done((done) => {
          if (done) {
            setTimeout(() => {
              window.location.replace("/hub");
            }, 3000);
          }
          if (data.won) {
            won();
          } else if (row == lenght + 1) gameOver(data.word);
          else new Audio(`sounds/Wordle/${Colors[row % 3]}.mp3`).play();
        });
      }
    });
  }
}

function gameOver(word) {
  new Audio("sounds/Wordle/wrong.mp3").play();

  const title = $("#level-title");

  title.text("Game Over, Game will restart in 5");
  title.after(`<h1 id='word'>Target word was ${word}</h1>`);

  $("body").addClass("game-over");

  setTimeout(() => {
    $("body").removeClass("game-over");
  }, 200);

  setTimeout(() => {
    title.text("Game Over, Game will restart in 4");
    setTimeout(() => {
      title.text("Game Over, Game will restart in 3");
      setTimeout(() => {
        title.text("Game Over, Game will restart in 2");
        setTimeout(() => {
          title.text("Game Over, Game will restart in 1");
          setTimeout(() => {
            location.replace(location.href);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}

function won() {
  new Audio("sounds/Wordle/won.mp3").play();

  const title = $("#level-title");

  title.text("YOU WON, BACK TO HOME in 5");

  $("body").addClass("won");

  setTimeout(() => {
    $("body").removeClass("won");
  }, 200);

  const home = location.href.substr(0, location.href.length - 2);
  setTimeout(() => {
    title.text("YOU WON, BACK TO HOME in 4");
    setTimeout(() => {
      title.text("YOU WON, BACK TO HOME in 3");
      setTimeout(() => {
        title.text("YOU WON, BACK TO HOME in 2");
        setTimeout(() => {
          title.text("YOU WON, BACK TO HOME in 1");
          setTimeout(() => {
            location.replace(home);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
}
