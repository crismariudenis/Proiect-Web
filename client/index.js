document.addEventListener("DOMContentLoaded", () => {
  fetch("./components/login.html")
    .then((res) => res.text())
    .then((html) => {
      const containerLogin = document.getElementById("login");
      containerLogin.innerHTML = html;
      const signBtn = document.getElementById("sign_in_btn");
      if (signBtn)
        signBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          const name = document.getElementById("login_username").value;
          const email = name + "@example.com";
          fetch("http://127.0.0.1:3000/adauga", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nume: name, email }),
          })
            .then((r) => r.json())
            .then(() => {
              containerLogin.classList.remove("active");
              document.getElementById("login_username").value = "";
              document.getElementById("login_password").value = "";
            })
            .catch(console.error);
        });
    });

  fetch("./components/navbar.html") // Fetch the navbar HTML file
    .then((response) => response.text()) // Convert the response to text
    .then((data) => {
      document.getElementById("navbar").innerHTML = data; // Insert the content into the placeholder
      // Attach the toggleMenu function to the global scope
      window.toggleMenu = function () {
        const navLinks = document.querySelector(".nav-links");
        if (navLinks) {
          navLinks.classList.toggle("active"); // Toggle the active class
        }
      };
      window.openLogin = function () {
        const containerLogin = document.getElementById("login");
        containerLogin.classList.add("active");
      };
    });

  fetch("./components/footer.html") // Fetch the footer HTML file
    .then((response) => response.text()) // Convert the response to text
    .then((data) => {
      document.getElementById("footer").innerHTML = data; // Insert the content into the placeholder
    });

  fetch("./components/landing.html") // Fetch the landing page content
    .then((response) => response.text()) // Convert the response to text
    .then((data) => {
      document.getElementById("hero").innerHTML = data; // Insert the content into the #hero div
    });

  fetch("./components/quizzes.html") // Fetch the quizzes component
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("quizzes").innerHTML = data; // Insert the quizzes into the placeholder
    });

  fetch("./components/card.html") // Fetch the card component
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("card-placeholder").innerHTML = data; // Insert the card into the placeholder
    });

  fetch("./components/quiz_window.html")
    .then((response) => response.text())
    .then((html) => {
      const quizContainer = document.getElementById("quiz_window");
      quizContainer.classList.remove("active");
      quizContainer.innerHTML = html;
      window.openQuizWindow = () => quizContainer.classList.add("active");
    });

  // load pop-up markup
  fetch("./components/pop_up.html")
    .then((res) => res.text())
    .then((html) => {
      const container = document.getElementById("pop_up");

      container.innerHTML = html;
      // overlay toggle
      window.openPopUp = () => container.classList.add("active");
      container
        .querySelector(".button_close")
        .addEventListener("click", () => container.classList.remove("active"));
      container
        .querySelector(".button_play_quiz")
        .addEventListener("click", () => {
          container.classList.remove("active");
          window.openQuizWindow();
        });
    });
});
