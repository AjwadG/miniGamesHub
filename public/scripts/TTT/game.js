const socket = io(window.location.href);
$(document).ready(() => {
  const size = Number($(".main").attr("board"));
  $("#ID").on("click", () => {
    socket.emit("join_TTT", null, (room) => {
      $("#ID").text(room);
    });
    $("#ID").off("click");
  });

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
      if ($("#VS").text() != "AI") {
        socket.emit("TTT_pick", pick, $("#ID").text(), turn);
      } else if (!valdiate(get_board())) {
        setTimeout(() => {
          const ai_pick = minMax(get_board(), true, 1);
          $(Array.from(document.querySelectorAll(".cell"))[ai_pick]).text(
            turn % 2 ? "O" : "X"
          );
          turn_setup(turn + 1);
        }, 500);
      }
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
        if ($(board[state[0][0] * size + state[0][1]]).text() == yourSumbol) {
          const player = $("#player1_info #score");
          player.text(Number(player.text()) + 1);
          background_effact(1);
          const url = window.location.href + "/api";
          $.ajax({
            url,
            type: "POST",
            data: JSON.stringify({ score: Number(player.text()) }),
            contentType: "application/json; charset=utf-8",
          });
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
          if ($("#VS").text() == "AI") {
            const ai_pick = minMax(get_board(), true, 1);
            $(Array.from(document.querySelectorAll(".cell"))[ai_pick]).text(
              "X"
            );
            turn_setup(1);
          }
        }
      }, 2000);
    }
  }

  function get_board() {
    const tmp = Array.from(document.querySelectorAll(".cell"));
    const board = [];
    let row = [];
    for (let index = 0; index < tmp.length; index++) {
      row.push(tmp[index].textContent);
      if ((index + 1) % size == 0 && index != 0) {
        board.push(row);
        row = [];
      }
    }
    return board;
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

  function valdiate(board) {
    const D = [board.length, board[0].length];
    let tie = true;
    for (let i = 0; i < D[0]; i++) {
      let x = "";
      for (let j = 0; j < D[1]; j++) {
        tie = board[i][j] == "" ? false : tie;
        x += board[i][j];
        let y = "";
        let lr = "";
        let rl = "";
        for (let h = 0; h < D[0] && i == 0; h++) {
          y += board[h][j];
          lr += board[h][h];
          rl += board[h][D[0] - 1 - h];
        }
        if (y != "" && y == Array(size + 1).join(board[0][j]))
          return [
            [j, j],
            [D[0] - 1, j],
          ];
        if (lr != "" && lr == Array(size + 1).join(board[1][1]))
          return [
            [0, 0],
            [D[0] - 1, D[0] - 1],
          ];
        if (rl != "" && rl == Array(size + 1).join(board[1][1]))
          return [
            [D[0] - 1, 0],
            [0, D[0] - 1],
          ];
      }
      if (x != "" && x == Array(size + 1).join(board[i][0]))
        return [
          [i, 0],
          [i, D[1] - 1],
        ];
    }
    return tie;
  }

  // AI logic

  function get_player(board) {
    const players = ["X", "O"];
    let turns = 0;
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] != "") turns++;
      }
    }
    return players[turns % 2];
  }

  function minMax(board, max, depth) {
    const player = get_player(board);
    if (!valdiate(board)) {
      if (max) {
        let bestValue = -Infinity;
        let option;
        const options = get_Opstions(board);
        for (let i = 0; i < options.length; i++) {
          const value = minMax(
            make_move(board, options[i], player),
            false,
            depth + 1
          );
          if (value > bestValue) {
            bestValue = value;
            option = options[i];
          }
        }
        return depth == 1 ? option[0] * size + option[1] : bestValue;
      } else {
        let bestValue = Infinity;
        const options = get_Opstions(board);
        let option;
        for (let i = 0; i < options.length; i++) {
          const value = minMax(
            make_move(board, options[i], player),
            true,
            depth + 1
          );
          if (value < bestValue) {
            bestValue = value;
            option = options[i];
          }
        }
        return depth == 1 ? option[0] * size + option[1] : bestValue;
      }
    } else {
      return game_stat(board);
    }
  }

  function get_Opstions(board) {
    let options = [];
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] == "") {
          options.push([i, j]);
        }
      }
    }
    return options;
  }

  function make_move(board, move, player) {
    const newBoard = [];
    for (let i = 0; i < board.length; i++) {
      const row = [];
      for (let j = 0; j < board[i].length; j++) {
        row.push(board[i][j]);
      }
      newBoard.push(row);
    }
    newBoard[move[0]][move[1]] = player;
    return newBoard;
  }

  function game_stat(board) {
    const player = get_player(get_board());
    const stat = valdiate(board);
    switch (stat) {
      case true:
        return 0;
      case false:
        return false;
      default:
        let power = 1;
        for (let i = 0; i < board.length; i++) {
          for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] == "") power++;
          }
        }
        let a = board[stat[0][0]][stat[0][1]] == player;
        if (a) return power;
        else return -(board.length * board[0].length - power);
    }
  }

  $("#AI").on("click", () => {
    $("#VS").text("AI");
    $(".cell").off("click");
    const board = Array.from(document.querySelectorAll(".cell"));
    board.forEach((cell) => {
      $(cell).text("");
    });
    turn_setup(0);
  });
});

function join() {
  const id = prompt("Enter game id");
  if (id) {
    const board = Array.from(document.querySelectorAll(".cell"));
    socket.emit("join_TTT", id, (room) => {
      $("#VS").text("Player");
      $("#ID").text(room);
      $("html").attr("mode", "pvp");
      $(".GameName").text("Game joined");
      $(".Title").text(`Witing for player`);
      $(".cell").off("click");
      board.forEach((cell) => {
        $(cell).text("");
      });
      setTimeout(() => {
        $(".GameName").text("Tic Tac Toe");
      }, 4000);
    });
  }
}