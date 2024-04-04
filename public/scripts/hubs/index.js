let plus = document.querySelector(".plus");
let minus = document.querySelector(".minus");
let value = document.querySelector(".value");
let padContainer = document.querySelector(".gamepad-container");

if (plus) {
  plus.addEventListener("click", () => {
    if (+value.textContent != 5) {
      let i = document.createElement("i");
      i.className = "fa-solid fa-gamepad";
      padContainer.appendChild(i);
      value.textContent++;
      padContainer.setAttribute("data-count", value.textContent);
    }
  });

  minus.addEventListener("click", () => {
    if (+value.textContent != 2) {
      padContainer.lastElementChild.classList.add("hide");
      setTimeout(() => {
        padContainer.lastElementChild.remove();
      }, 300);
      value.textContent--;
      padContainer.setAttribute("data-count", value.textContent);
    }
  });
}
$(document).ready(function () {
  $("#join").on("click", () => {
    const hubCode = document.getElementById("hubCode").value;
    document.getElementById("hubCode").value = "";
    const url = window.location.href + "/api/join";
    if (hubCode != "") {
      $.ajax({
        url,
        type: "POST",
        data: JSON.stringify({ hubCode }),
        contentType: "application/json; charset=utf-8",
      }).done((data) => {
        const href = window.location.href;
        console.log(href);
        if (data) window.location.replace(href.slice(0, href.length - 1));
        else
          document.getElementById("form_header").innerHTML = "Code not valid";
      });
    }
  });
  $("#create").on("click", () => {
    const max = value.textContent;
    const url = window.location.href + "/api/create";
    $.ajax({
      url,
      type: "POST",
      data: JSON.stringify({ max }),
      contentType: "application/json; charset=utf-8",
    }).done((data) => {
      const href = window.location.href;
      if (data) window.location.replace(href.slice(0, href.length - 1));
    });
  });
});
