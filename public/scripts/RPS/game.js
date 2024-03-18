$(document).ready(() => {
  const options = { rock: 1, paper: 2, cissor: 3 };
  const sounds = {
    0: new Audio("sounds/RPS/tie.mp3"),
    "-1": new Audio("sounds/RPS/lost.mp3"),
    1: new Audio("sounds/RPS/won.mp3"),
  };
  $(".hand").on("mouseenter", Select_option);
  $(".hand").on("click", start_game);
  function Select_option(option, player_num, slection) {
    if (!player_num) player_num = 1;
    player = `#player${player_num}`;
    $(player).removeClass("rock");
    $(player).removeClass("paper");
    $(player).removeClass("cissor");
    if (slection) className = slection;
    else
      className = this.name == "" ? $(option).attr("id") : $(this).attr("id");
    $(player).addClass(className);
  }

  function start_game() {
    $(".hand").off("mouseenter");
    $(".hand").off("click");
    Select_option(this);
    const slection = Math.floor(Math.random() * 3);
    var i = 0;
    $("#player1").css("animation", "none");
    const game_animation = setInterval(() => {
      Select_option(this, 2, Object.keys(options)[i++ % 3]);
      if (i == 10) {
        clearInterval(game_animation);
        setTimeout(() => {
          $("#player2").css("animation", "none");
          game_result(slection);
        }, 500);
      }
    }, 200);
  }

  function evaluate() {
    const player1 = $("#player1").attr("class");
    const player2 = $("#player2").attr("class");
    if (options[player1] == options[player2]) return 0;
    else if (
      options[player1] - 1 == options[player2] ||
      options[player1] + 2 == options[player2]
    )
      return 1;
    else return -1;
  }

  function game_result(slection) {
    Select_option(this, 2, Object.keys(options)[slection]);
    const title = $(".Title");
    const state = evaluate();
    switch (state) {
      case 0:
        title.text("Tie");
        break;
      case 1:
        title.text("You Won");
        break;
      default:
        title.text("You Lost");
        break;
    }
    background_effact(state);
    setTimeout(() => {
      title.text("Select one");
      $("#player1").css("animation", "endless1 4s linear infinite");
      $("#player2").css("animation", "endless2 4s linear infinite");
      $(".hand").on("mouseenter", Select_option);
      $(".hand").on("click", start_game);
    }, 1000);
  }

  function background_effact(state) {
    $("body").addClass(`back${state}`);
    sounds[state].play();

    setTimeout(() => {
      $("body").removeClass(`back${state}`);
    }, 200);
  }
});
