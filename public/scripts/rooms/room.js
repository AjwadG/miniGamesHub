const socket = io(window.location.href);
$(document).ready(async function () {
  socket.on("start", (name) => {
    const nextGame = `${window.location.origin}/${$(".btn").attr("id")}`;
    location.replace(nextGame);
  });
  socket.on("returnToGame", (game) => {
    location.replace(`${window.location.origin}/${game}`);
    reload();
  });
  socket.on("player_joined", (name) => {
    reload();
  });
});

function reload() {
  const url = window.location.href;
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
        if ($("#start").length == 0) {
          $("body").append("<button id='start'>Start Game</button>");
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
