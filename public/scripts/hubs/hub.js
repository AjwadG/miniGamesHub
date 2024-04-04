const socket = io(window.location.href);
socket.on("start", (name) => {
  const nextGame = `${window.location.origin}/${$(".gameIcon").attr("id")}`;
  console.log(nextGame);
  location.replace(nextGame);
});
socket.on("returnToGame", (game) => {
  reload();
  if ($("#BackToGame").text() == "") {
    $(".main-button").append(
      `<a href='#' id='BackToGame' onclick='return false'>Back to ${game}'s Game </a>`
    );
    $("#BackToGame").on("click", () => {
      location.replace(`${window.location.origin}/${game}`);
    });
  }
});
socket.on("player_joined", (name) => {
  console.log(name);
  reload();
});

function reload() {
  const url = window.location.href + "/state";
  $.ajax({
    url,
    type: "POST",
  }).done((hub) => {
    if (hub) {
      $("#left").text(hub.maxPlayers - hub.players.length);
      const game = hub.leaderBoard.filter(
        (game) => game.gameName == hub.queue[0]
      );
      $("#ready").text(
        game.length != 0
          ? hub.maxPlayers - game[0].leaderBoard.length
          : hub.maxPlayers
      );
      if ($("#ready").text() == "0") {
        $("#BackToGame").remove();
        if ($("#start").length == 0) {
          $(".main-button").append(
            "<a href='#' id='start' onclick='return false'>Start Game</a>"
          );
          $("#start").on("click", () => {
            socket.emit("start_game");
          });
        }
      } else {
        $("#start").remove();
      }
    }
  });
}
