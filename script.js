(function () {
  "use strict";

  var videoPlayer = document.getElementById("videoPlayer");
  var videoSource = document.getElementById("videoSource");
  var nowPlaying = document.getElementById("nowPlaying");
  var lessonButtons = document.querySelectorAll(".lesson-btn");

  function playLesson(button) {
    var src = button.getAttribute("data-src");
    var title = button.getAttribute("data-title");

    // Swap the source and reload the player.
    videoSource.setAttribute("src", src);
    videoPlayer.load();

    // Autoplay the new video (browsers allow this after a user click).
    var playPromise = videoPlayer.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        // If autoplay is blocked, the controls are still there for manual play.
      });
    }

    nowPlaying.textContent = title;

    lessonButtons.forEach(function (btn) {
      btn.classList.toggle("active", btn === button);
    });
  }

  lessonButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      playLesson(button);
    });
  });
})();
