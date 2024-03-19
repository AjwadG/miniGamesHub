const socket = io(window.location.href);
$(document).ready(() => {
  var player2_pick = null;
  var player1_pick = null;
  $("#ID").on("click", () => {
    socket.emit("join_RPS", null, (room) => {
      $("#ID").text(room);
    });
    $("#ID").off("click");
  });

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
    $("#player1_info").text("YOU: picked");
    $("#player2_info").text("Player2: picking");
    $(".hand").off("mouseenter");
    $(".hand").off("click");

    Select_option(this);
    player1_pick = $("#player1").attr("class");
    socket.emit("RPS_pick", $("#player1").attr("class"), $("#ID").text());
    $("#player1").css("animation", "none");

    if ($('html').attr("mode") == "pve") {
      load_player2_pick(Math.floor(Math.random() * 3));
    } else if (player2_pick) {
      console.log(player2_pick);
      load_player2_pick(options[player2_pick] - 1);
    }
  }

  function load_player2_pick(slection) {
    var i = 0;
    const game_animation = setInterval(() => {
      Select_option(this, 2, Object.keys(options)[i++ % 3]);

      if (i == 10) {
        clearInterval(game_animation);
        setTimeout(() => {
          $("#player2_info").text("Player2 picked");
          $("#player2").css("animation", "none");
          game_result(slection);
          player2_pick = null;
          player1_pick = null;
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
      $("#player1_info").text("YOU: picking");
      $("#player2_info").text("Player2: picking");
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

  socket.on("RPS_pick", (pick, gameID) => {
    player2_pick = pick;
    $("#player2").css("animation", "endless2 10s linear infinite");
    $("#player2_info").text("Player2 picked");
    if (player1_pick) {
      load_player2_pick(options[player2_pick] - 1);
    }
  });
  socket.on('joined', () => {
    $('.GameName').text('Player 2 joined')
    $('html').attr("mode", "pvp")
    setTimeout(() => {
      $('.GameName').text('Rock Paper Scissors')
    }, 4000);
  })
});

function join() {
  const id = prompt("Enter game id");
  if (id) {
    socket.emit("join_RPS", id, (room) => {
      $("#ID").text(room);
      $('html').attr("mode", "pvp")
      $('.GameName').text('Game joined')
      setTimeout(() => {
        $('.GameName').text('Rock Paper Scissors')
      }, 4000);
    });
  }
}
