document.addEventListener("DOMContentLoaded", () => {
  fetch("./components/login.html")
    .then((r) => r.text())
    .then((html) => {
      const L = document.getElementById("login");
      L.innerHTML = html;

      const signBtn = document.getElementById("sign_in_btn");
      if (signBtn) {
        signBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const username = document
            .getElementById("login_username")
            .value.trim();
          const password = document.getElementById("login_password").value;
          fetch("http://127.0.0.1:3000/adauga", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          })
            .then((r) => r.json())
            .then((json) => {
              alert(json.succes ? "Registered!" : "Error");
              if (json.succes) L.classList.remove("active");
            });
        });
      }

      const loginBtn = document.getElementById("login_btn");
      if (loginBtn) {
        loginBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const username = document
            .getElementById("login_username")
            .value.trim();
          const password = document.getElementById("login_password").value;

          fetch("http://127.0.0.1:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          })
            .then((r) => r.json())
            .then((json) => {
              if (json.succes) {
                const authToken = btoa(username + ":" + password);
                localStorage.setItem("authToken", authToken);
                alert("Welcome back, " + username);
                L.classList.remove("active");
              } else {
                alert("Error");
              }
            });
        });
      }

      fetch("./components/navbar.html")
        .then((response) => response.text())
        .then((data) => {
          document.getElementById("navbar").innerHTML = data;
          window.toggleMenu = function () {
            const navLinks = document.querySelector(".nav-links");
            if (navLinks) {
              navLinks.classList.toggle("active");
            }
          };
          window.openLogin = function () {
            const containerLogin = document.getElementById("login");
            containerLogin.classList.add("active");
          };
        });

      fetch("./components/footer.html")
        .then((response) => response.text())
        .then((data) => {
          document.getElementById("footer").innerHTML = data;
        });

      fetch("./components/landing.html")
        .then((response) => response.text())
        .then((data) => {
          document.getElementById("hero").innerHTML = data;
        });

      fetch("./components/quizzes.html")
        .then((response) => response.text())
        .then((data) => {
          document.getElementById("quizzes").innerHTML = data;
        });


      fetch("./components/quiz_window.html")
        .then((response) => response.text())
        .then((html) => {
          const quizContainer = document.getElementById("quiz_window");
          quizContainer.classList.remove("active");
          quizContainer.innerHTML = html;
          window.openQuizWindow = () => quizContainer.classList.add("active");
        });

      fetch("./components/pop_up.html")
        .then((res) => res.text())
        .then((html) => {
          const container = document.getElementById("pop_up");

          container.innerHTML = html;
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
    }
    )
});
