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
            body: JSON.stringify({ name, email }),
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

  let quizContainer;
  let currentQuizIndex = 0;
  let quizData = [];
  let remainingLives = 2;

  fetch("./components/quiz_window.html")
    .then((response) => response.text())
    .then((html) => {
      currentQuizIndex = 0;
      quizContainer = document.getElementById("quiz_window");

      quizContainer.classList.remove("active");
      quizContainer.innerHTML = html;
      window.openQuizWindow = () => {
        let questionText = [];
        quizContainer.classList.add("active");
        const questionElement = quizContainer.querySelector(".question");
        if (questionElement) {
          const field = quizData[currentQuizIndex].field;
          switch (field) {
            case "ID":
              questionText.push("What is the identity of the hero ");
              questionText.push(quizData[currentQuizIndex].name);
              questionText.push(" ?");
              break;
            case "ALIGN":
              questionText.push("What is ");
              questionText.push(quizData[currentQuizIndex].name);
              questionText.push("'s moral alignment?");
              break;
            case "EYE":
              questionText.push("What color are ");
              questionText.push(quizData[currentQuizIndex].name);
              questionText.push("'s eyes?");
              break;
            case "universe":
              questionText.push("Which universe does ");
              questionText.push(quizData[currentQuizIndex].name);
              questionText.push(" belong to?");
              break;
            case "year":
              questionText.push("In what year was ");
              questionText.push(quizData[currentQuizIndex].name);
              questionText.push(" first created?");
              break;
            case "HAIR":
              questionText.push("How is ");
              questionText.push(quizData[currentQuizIndex].name);
              questionText.push("'s hair described?");
              break;



          }
          questionElement.textContent = questionText.join("");

          const firstButton = quizContainer.querySelector(".quiz_button1");
          const secondButton = quizContainer.querySelector(".quiz_button2");
          const counter = quizContainer.querySelector(".counter");
          firstButton.textContent = quizData[currentQuizIndex].value[0];
          secondButton.textContent = quizData[currentQuizIndex].value[1];
          counter.textContent = currentQuizIndex + 1;

        }
      }
      quizContainer.querySelectorAll(".quiz_button1, .quiz_button2").forEach((button) => {
        button.addEventListener("click", () => {
          const selectedAnswer = button.textContent.trim();
          fetch("http://127.0.0.1:3000/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: currentQuizIndex, answer: selectedAnswer }),
          })
            .then((r) => r.json())
            .then(data => {
              console.log(data.correct);
              let correctAnswer = data.correct;
              quizContainer.classList.remove("active");
              currentQuizIndex++;
              if (!correctAnswer) {
                remainingLives--;
                console.log(remainingLives);
                if (remainingLives <= 0) {
                  quizContainer.classList.remove("active");
                }
                else {
                  document.querySelectorAll('.heart')[remainingLives].style.visibility = 'hidden';
                  openQuizWindow();
                }

              }
              else openQuizWindow();
            })
            .catch(console.error);

        });
      });


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
        .addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          fetch("http://127.0.0.1:3000/quizzes", {
            method: "GET",
            headers: { "Accept": "application/json" },
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("Datele primite de la server:", data);
              container.classList.remove("active");
              quizData = data;
              currentQuizIndex = 0;
              remainingLives = 2;
              document.querySelectorAll('.heart').forEach(h => h.style.visibility = 'visible');
              window.openQuizWindow();
            })
            .catch((err) => {
              console.error("Couldn't get quizzes", err);
              alert("Couldn't load quizzez.");
            });
        });
    });
});
