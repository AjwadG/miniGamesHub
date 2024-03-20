const socket = io(window.location.href);
$(document).ready(() => {
  $("#ID").on("click", () => {
    socket.emit("join_TTT", null, (room) => {
      $("#ID").text(room);
    });
    $("#ID").off("click");
  });

  function valdiate(board) {
    const D = [board.length, board[0].length];
    let tie = true;
    for (let i = 0; i < D[0]; i++) {
      let x = 0;
      for (let j = 0; j < D[1]; j++) {
        tie = board[i][j] == 0 ? false : tie;
        x += board[i][j];
        let y = 0;
        let lr = 0;
        let rl = 0;
        for (let h = 0; h < D[0] && i == 0; h++) {
          y += board[h][j];
          lr += board[h][h];
          rl += board[h][D[0] - 1 - h];
        }
        if (y != 0 && y / 3 == board[0][j])
          return [
            [j, j],
            [D[0] - 1, j],
          ];
        if (lr != 0 && lr / 3 == board[1][1])
          return [
            [0, 0],
            [D[0] - 1, D[0] - 1],
          ];
        if (rl != 0 && rl / 3 == board[1][1])
          return [
            [D[0] - 1, 0],
            [0, D[0] - 1],
          ];
      }
      if (x != 0 && x / 3 == board[i][0])
        return [
          [i, 0],
          [i, D[1] - 1],
        ];
    }
    return tie;
  }
  function get_board() {
    const tmp = Array.from(document.querySelectorAll(".cell"));
    const board = [];
    let row = [];
    for (let index = 0; index < tmp.length; index++) {
      let value = tmp[index].textContent;
      if (value == "X") value = 3;
      else value = value == "" ? 0 : 5;
      row.push(value);
      if ((index + 1) % 3 == 0 && index != 0) {
        board.push(row);
        row = [];
      }
    }
    return board;
  }

  socket.on("TTT_pick", (pick, gameID, turn) => {
    $(Array.from(document.querySelectorAll(".cell"))[pick]).text(
      (turn - 1) % 2 ? "O" : "X"
    );
    turn_setup(turn);
  });

  socket.on("joined", () => {
    $(".GameName").text("Player 2 joined");
    $("html").attr("mode", "pvp");
    turn_setup(0);
    setTimeout(() => {
      $(".GameName").text("Tic Tac Toe");
    }, 4000);
  });

  function play(self, turn) {
    if (!$(self).text() && !valdiate(get_board())) {
      $(self).text(turn % 2 ? "O" : "X");
      $(".cell").off("click");
      const pick = Array.from(document.querySelectorAll(".cell")).indexOf(self);
      $(".Title").text(`${++turn % 2 ? "O" : "X"}'s Turn`);
      socket.emit("TTT_pick", pick, $("#ID").text(), turn);
    }
    end_game(turn - 1);
  }

  function turn_setup(turn) {
    $(".Title").text(`Your Turn as ${turn % 2 ? "O" : "X"}`);
    $(".cell").off("click");
    $(".cell").on("click", function () {
      play(this, turn);
    });
    end_game(turn);
  }

  function end_game(turn) {
    const state = valdiate(get_board());
    const yourSumbol = turn % 2 ? "O" : "X";
    if (state) {
      $(".cell").off("click");
      const board = Array.from(document.querySelectorAll(".cell"));
      if (state == true) {
        background_effact(0);
      } else {
        if ($(board[state[0][0] * 3 + state[0][1]]).text() == yourSumbol) {
          const player = $("#player1_info #score");
          player.text(Number(player.text()) + 1);
          background_effact(1);
        } else {
          const player = $("#player2_info #score");
          player.text(Number(player.text()) + 1);
          background_effact(-1);
        }
      }
      setTimeout(() => {
        board.forEach((cell) => {
          $(cell).text("");
        });
        if (yourSumbol == "O") {
          turn_setup(0);
        } else {
          $(".Title").text("X's Turn");
        }
      }, 2000);
    }
  }
});

function join() {
  const id = prompt("Enter game id");
  if (id) {
    socket.emit("join_TTT", id, (room) => {
      $("#ID").text(room);
      $("html").attr("mode", "pvp");
      $(".GameName").text("Game joined");
      $(".Title").text(`Witing for player`);
      setTimeout(() => {
        $(".GameName").text("Tic Tac Toe");
      }, 4000);
    });
  }
}

function background_effact(state) {
  const sounds = {
    0: new Audio("sounds/RPS/tie.mp3"),
    "-1": new Audio("sounds/RPS/lost.mp3"),
    1: new Audio("sounds/RPS/won.mp3"),
  };

  $("body").addClass(`back${state}`);
  sounds[state].play();
  if (state == 0) $(".Title").text("Draw!");
  else $(".Title").text(`You ${state == 1 ? "Won" : "Lost"}!`);
  setTimeout(() => {
    $("body").removeClass(`back${state}`);
  }, 200);
}
