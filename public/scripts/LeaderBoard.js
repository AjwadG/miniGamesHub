$(document).ready(async function () {
  let index = 0;
  const nameFields = document.querySelectorAll(".name");
  const scoreFileds = document.querySelectorAll(".score");
  function fetchApiData() {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: "get",
        url: location.href + "/api",
        success: function (response) {
          resolve(response);
        },
        error: function (error) {
          reject(error);
        },
      });
    });
  }
  function loadBoard(page, leaderBoards) {
    const index = page % leaderBoards.length;
    $("#gameName").text(leaderBoards[index].gameName);
    const leaderBoard = leaderBoards[index].leaderBoard;
    for (let i = 0; i < nameFields.length; i++) {
      if (i < leaderBoard.length) {
        $(nameFields[i]).text(leaderBoard[i].userName);
        $(scoreFileds[i]).text(leaderBoard[i].score);
      } else {
        $(nameFields[i]).text("Player");
        $(scoreFileds[i]).text("00");
      }
    }
  }

  loadBoard(index, await fetchApiData());
  $(".next").on("click", async () => {
    loadBoard(++index, await fetchApiData());
  });
});
