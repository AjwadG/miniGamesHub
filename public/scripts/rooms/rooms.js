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
        if (data) window.location.replace(href.slice(0, href.length - 1));
      });
    }
  });
  $("#create").on("click", () => {
    const hubName = document.getElementById("hubName").value;
    document.getElementById("hubName").value = "";
    const max = document.getElementById("max").value;
    console.log(typeof max);
    document.getElementById("max").value = "";
    const url = window.location.href + "/api/create";
    if (max != "" && Number(max) >= 2 && hubName != "") {
      $.ajax({
        url,
        type: "POST",
        data: JSON.stringify({ hubName, max }),
        contentType: "application/json; charset=utf-8",
      }).done((data) => {
        const href = window.location.href;
        if (data) window.location.replace(href.slice(0, href.length - 1));
      });
    }
  });
});
