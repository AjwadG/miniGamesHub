const click = new Audio("sounds/FlappyBird/flap.mp3");
click.volume = 0.5;
const point = new Audio(`sounds/FlappyBird/point.mp3`);
point.volume = 0.5;
const die = new Audio(`sounds/FlappyBird/die.mp3`);
die.volume = 0.5;
const hit = new Audio(`sounds/FlappyBird/hit.mp3`);
hit.volume = 0.5;
var score = 0;
const windowWidth = $(document).width();

point.addEventListener("ended", () => {
  score++;
  $("#level-title").text(score);
});

$(document).ready(function () {
  const windowHeight = $(document).height();
  $.each($(".pipe"), (i, element) => {
    $(element).css("height", `${windowHeight}px`);
  });
  align();
  $(document).on("click", function (e) {
    $(document).off("click");
    startGmae();
  });
});

function startGmae() {
  $(document).on("click", function (e) {
    e.preventDefault();
    if ($("#bird").position().top > 30) {
      click.pause();
      click.currentTime = 0;
      click.play();
      $("#bird").toggleClass("bird1");
      $("#bird").animate({ top: "-=50px" }, 100);
    }
  });
  $(document).on("keydown", function (e) {
    e.preventDefault();
    if ($("#bird").position().top > 30 && e.key.toUpperCase() == " ") {
      click.pause();
      click.currentTime = 0;
      click.play();
      $("#bird").toggleClass("bird1");
      $("#bird").animate({ top: "-=50px" }, 100);
    }
  });

  const windowHeight = $("body").height();
  const animation = setInterval(() => {
    $("#bird").css("top", "+=3px");
    if ($("#bird").position().top + 10 >= windowHeight) {
      hit.play();
      startOver(animation, game);
    }
  }, 10);

  const game = setInterval(() => {
    const bird = getObj($("#bird"));
    const pipeTop = getObj($(".pipe_top"));
    const pipeBottom = getObj($(".pipe_bottom"));

    if (collision(bird, pipeTop) || collision(bird, pipeBottom)) {
      die.play();
      startOver(animation, game);
    }
    $(".pipe_top").css("left", "-=3px");
    $(".pipe_bottom").css("left", "-=3px");
    reAlign(pipeTop[2].left);
  }, 10);
}

function collision(player, objects) {
  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    if (
      player.x + player.width >= object.x &&
      player.x <= object.x + object.width
    ) {
      if (
        player.y <= object.y + object.height &&
        player.y + player.height >= object.y
      ) {
        return true;
      } else {
        point.play();
      }
    }
  }

  return false;
}

function getObj(elemnt) {
  const result = elemnt.map((obj) => elemnt[obj].getBoundingClientRect());
  return result.length != 1 ? result : result[0];
}

function reAlign(last) {
  const top = $(".pipe_top");
  const bottom = $(".pipe_bottom");
  const height = $(".pipe_top").height();
  const res = Math.floor(Math.random() * (height - 450 + 1)) + 300;
  for (let i = 0; i < top.length; i++) {
    const { width, x } = top[i].getBoundingClientRect();
    if (x + width <= 0) {
      $(top[i]).css("left", `${windowWidth}px`);
      $(bottom[i]).css("left", `${windowWidth}px`);
      $(top[i]).css("top", `${res - height - 250}px`);
      $(bottom[i]).css("top", `${res - 50}px`);
      break;
    }
  }
}

function align() {
  const height = $(".pipe_top").height();
  const res = Array.from(
    { length: 3 },
    (_) => Math.floor(Math.random() * (height - 450 + 1)) + 300
  );
  const offsett = (windowWidth + 150) / 3;
  const top = $(".pipe_top");
  const bottom = $(".pipe_bottom");
  $.each(top, function (i, pipe) {
    $(pipe).css("top", `${res[i] - height - 250}px`);

    $(pipe).css("left", `${windowWidth + i * offsett}px`);
  });
  $.each(bottom, function (i, pipe) {
    $(pipe).css("top", `${res[i] - 50}px`);

    $(pipe).css("left", `${windowWidth + i * offsett}px`);
  });
}

function startOver(animation, game) {
  clearInterval(animation);
  clearInterval(game);
  $(document).off("click");
  $(document).off("keydown");

  const url = window.location.href + "/api";
  $.ajax({
    url,
    type: "POST",
    data: JSON.stringify({ score }),
    contentType: "application/json; charset=utf-8",
  });
  const gameName = window.location.pathname.split("/")[1];
  $.ajax({
    url: "/hub",
    type: "POST",
    data: JSON.stringify({ score, gameName }),
    contentType: "application/json; charset=utf-8",
  }).done((data) => {
    if (data) window.location.replace("/room");
  });
  if (Number($("#HighScore").attr("level")) < score) {
    const bestScore = $("#HighScore").attr("level", score);
    $("#HighScore").text(`Best Score: ${score}`);
  }
  score--;
  $(document).on("click", function (e) {
    $(document).off("click");
    align();
    setTimeout(() => {
      score = 0;
      if (Number($("#HighScore").attr("level")) != 0)
        $("#level-title").text(score);
      $("#bird").css("top", "300px");
      startGmae();
    }, 1000);
  });
}
