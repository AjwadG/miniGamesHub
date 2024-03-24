const category = $("html").attr("category");
const difficulty = $("html").attr("difficulty");
const type = $("html").attr("type");
const token = $("html").attr("token");
const right = new Audio(`sounds/Wordle/won.mp3`);
const wrong = new Audio(`sounds/Wordle/yellow.mp3`);
let score = 0;
$(document).ready(get_question);

async function get_question() {
  try {
    const data = await $.ajax({
      url: `https://opentdb.com/api.php`,
      data: { amount: 1, category, difficulty, type, token },
    });
    const time = new Date().getSeconds();
    const question = data.results[0];
    $(".GameName").html(question.question);
    const options = [question.correct_answer, ...question.incorrect_answers]
      .sort(() => Math.random() - 0.5)
      .sort(() => Math.random() - 0.5);

    $(".options").empty();
    options.forEach((option) => {
      $(".options").append(`<div class="option">${option}</div>`);
    });

    $(".option").on("click", (self) => {
      $(".option").each((i, tag) => {
        if ($(tag).text() == question.correct_answer) {
          $(tag).addClass("correct");
        }
      });

      const ansewr = $(self.target).text();
      if (ansewr == question.correct_answer) {
        $(self.target).addClass("correct");
        right.play();
        score++;

        const url = window.location.href + "/api";
        $.ajax({
          url,
          type: "POST",
          data: JSON.stringify({ score }),
          contentType: "application/json; charset=utf-8",
        });
      } else {
        $(self.target).addClass("wrong");
        wrong.play();
      }

      $("#Streak").text(score);
      $(".Title").text("Loading next question ...");
      const left = (time - new Date().getSeconds() + 6) * 1000;
      setTimeout(
        async () => {
          await get_question();
          $(".Title").html("Select The Right answer");
        },
        left > 6000 || left < 0 ? 2000 : left
      );

      $(".option").off("click");
    });
  } catch (error) {
    setTimeout(async () => {
      await get_question();
    }, 1000);
  }
}
