
let currentLanguage = "en";
let langData = null;
function changeFlag() {
  const flagImg = document.getElementById("flag");
  if (currentLanguage === "ro") {
    flagImg.src = "./images/usa_flag.jpg";
    currentLanguage = "en";
  }
  else {
    flagImg.src = "./images/romanian_flag.jpg";
    currentLanguage = "ro";

  }
  updateLanguage();
}

async function getImageFromURL(url) {
  try {
    let universe;
    if (url.startsWith("https://dc.fandom.com")) universe = "DC";
    else if (url.startsWith("https://marvel.fandom.com")) universe = "Marvel";
    const pageTitle = url.split("/wiki/")[1];
    if (!pageTitle) return null;

    let apiUrl;
    if (universe === "Marvel")
      apiUrl = `https://marvel.fandom.com/api.php?action=query&titles=${encodeURIComponent(
        pageTitle
      )}&prop=pageimages|images&piprop=original&format=json&origin=*`;
    else if (universe === "DC") {
      apiUrl = `https://dc.fandom.com/api.php?action=query&titles=${encodeURIComponent(
        pageTitle
      )}&prop=pageimages|images&piprop=original&format=json&origin=*`;
    }
    const response = await fetch(apiUrl);
    const data = await response.json();

    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const pageData = pages[pageId];

    let imageUrl = null;

    if (pageData.original && pageData.original.source) {
      imageUrl = pageData.original.source;
    } else if (pageData.images && pageData.images.length > 0) {
      const imageTitle = pageData.images[0].title;
      let imageApiUrl;
      if (universe === "Marvel")
        imageApiUrl = `https://marvel.fandom.com/api.php?action=query&titles=${encodeURIComponent(
          imageTitle
        )}&prop=imageinfo&iiprop=url&format=json&origin=*`;
      else if (universe === "DC")
        imageApiUrl = `https://dc.fandom.com/api.php?action=query&titles=${encodeURIComponent(
          imageTitle
        )}&prop=imageinfo&iiprop=url&format=json`;
      const imgResponse = await fetch(imageApiUrl);
      const imgData = await imgResponse.json();

      const imgPages = imgData.query.pages;
      const imgPageId = Object.keys(imgPages)[0];

      if (imgPages[imgPageId].imageinfo) {
        imageUrl = imgPages[imgPageId].imageinfo[0].url;
      }
    }

    if (!imageUrl) return null;
    imageUrl = imageUrl.split("/revision")[0];
    return imageUrl;
  } catch (error) {
    console.error("Eroare:", error.message);
    return null;
  }
}

let currentCard;

async function loadLanguageData() {
  try {
    const res = await fetch("./json/language.json");
    langData = await res.json();
  } catch (e) {
    console.error("Eroar fetch language.json:", e);
  }
}

function updateLanguage() {
  const navbar = langData[currentLanguage].navbar;
  document.getElementById("navbar-quizzes").textContent = navbar.quizzes;
  document.getElementById("navbar-about").textContent = navbar.about;
  document.getElementById("navbar-join").textContent = navbar.join;
  const footer = langData[currentLanguage].footer;
  document.getElementById("footer-left").textContent = footer.left;
  document.getElementById("footer-middle").textContent = footer.middle;
  document.getElementById("footer-right").textContent = footer.right;
  const landing = langData[currentLanguage].landing;
  document.getElementById("landing-title").innerHTML = landing.title;
  document.getElementById("landing-description").textContent = landing.description;
  document.getElementById("landing-button").textContent = landing.button;
  const quizzes = langData[currentLanguage].quizzes;
  document.getElementById("quizzes-featured").innerHTML = quizzes.featured;
  document.getElementById("quizzes-title1").textContent = quizzes.title1;
  document.getElementById("quizzes-description1").textContent = quizzes.description1;
  document.getElementById("quizzes-title2").textContent = quizzes.title2;
  document.getElementById("quizzes-description2").textContent = quizzes.description2;
  document.getElementById("quizzes-title3").textContent = quizzes.title3;
  document.getElementById("quizzes-description3").textContent = quizzes.description3;
  document.getElementById("quizzes-title4").textContent = quizzes.title4;
  document.getElementById("quizzes-description4").textContent = quizzes.description4;
  document.getElementById("quizzes-title5").textContent = quizzes.title5;
  document.getElementById("quizzes-description5").textContent = quizzes.description5;
  document.getElementById("quizzes-title6").textContent = quizzes.title6;
  document.getElementById("quizzes-description6").textContent = quizzes.description6;
  document.getElementById("quizzes-latest").innerHTML = quizzes.latest;

}


document.addEventListener("DOMContentLoaded", async () => {
  await loadLanguageData();

  fetch("./components/login.html")
    .then((r) => r.text())
    .then((html) => {
      const L = document.getElementById("login");
      L.innerHTML = html;

      const signBtn = document.getElementById("sign_in_btn");
      if (signBtn) {
        signBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const username = document.getElementById("login_username").value.trim();
          const password = document.getElementById("login_password").value;
          const L = document.getElementById("login");
          fetch("http://127.0.0.1:3000/adauga", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          })
            .then((response) => {
              if (response.status === 409) {
                return response.json().then((json) => {
                  alert(json.eroare || "Username already taken");
                });
              }
              if (response.status === 400) {
                return response.json().then((json) => {
                  alert(
                    json.eroare ||

                    "Password must be at least 9 characters, include an uppercase letter and a digit"

                  );
                });
              }
              if (!response.ok) {
                return response.json().then((json) => {
                  alert(json.eroare || "Error registering");
                });
              }
              return response.json().then(() => {
                alert("Registered!");
                L.classList.remove("active");
              });
            })
            .catch((err) => {
              console.error("Registration failed", err);
              alert("Error registering");
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
                localStorage.setItem("username", username);
                alert("Welcome back, " + username);
                L.classList.remove("active");
                // reflect in navbar
                if (window.updateNavbar) window.updateNavbar();
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

          const navbar = langData[currentLanguage].navbar;
          document.getElementById("navbar-quizzes").textContent = navbar.quizzes;
          document.getElementById("navbar-about").textContent = navbar.about;
          document.getElementById("navbar-join").textContent = navbar.join;


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


          const navBtn = document.getElementById("nav_login_btn");
          const userSpan = document.getElementById("user-name");

          // updateNavbar exposed globally so we can call it after login
          window.updateNavbar = function () {
            const username = localStorage.getItem("username");
            if (username) {
              navBtn.textContent = "Log out";
              userSpan.textContent = `Hello, ${username}`;
            } else {
              navBtn.textContent = "Join now";
              userSpan.textContent = "";
            }
          };

          navBtn.addEventListener("click", () => {
            if (localStorage.getItem("username")) {
              // logout
              localStorage.removeItem("authToken");
              localStorage.removeItem("username");
              window.updateNavbar();
            } else {
              openLogin();
            }
          });

          window.updateNavbar();

        });

      fetch("./components/footer.html")
        .then((response) => response.text())
        .then((data) => {
          document.getElementById("footer").innerHTML = data;
          const footer = langData[currentLanguage].footer;
          document.getElementById("footer-left").textContent = footer.left;
          document.getElementById("footer-middle").textContent = footer.middle;
          document.getElementById("footer-right").textContent = footer.right;

        });

      fetch("./components/landing.html") // Fetch the landing page content
        .then((response) => response.text()) // Convert the response to text
        .then((data) => {
          document.getElementById("hero").innerHTML = data; // Insert the content into the #hero div
          const landing = langData[currentLanguage].landing;
          document.getElementById("landing-title").innerHTML = landing.title;
          document.getElementById("landing-description").textContent = landing.description;
          document.getElementById("landing-button").textContent = landing.button;

        });



      fetch("./components/quizzes.html") // Fetch the quizzes component
        .then((response) => response.text())
        .then((data) => {
          document.getElementById("quizzes").innerHTML = data; // Insert the quizzes into the placeholder
          const quizzes = langData[currentLanguage].quizzes;
          document.getElementById("quizzes-featured").innerHTML = quizzes.featured;
          document.getElementById("quizzes-title1").textContent = quizzes.title1;
          document.getElementById("quizzes-description1").textContent = quizzes.description1;
          document.getElementById("quizzes-title2").textContent = quizzes.title2;
          document.getElementById("quizzes-description2").textContent = quizzes.description2;
          document.getElementById("quizzes-title3").textContent = quizzes.title3;
          document.getElementById("quizzes-description3").textContent = quizzes.description3;
          document.getElementById("quizzes-title4").textContent = quizzes.title4;
          document.getElementById("quizzes-description4").textContent = quizzes.description4;
          document.getElementById("quizzes-title5").textContent = quizzes.title5;
          document.getElementById("quizzes-description5").textContent = quizzes.description5;
          document.getElementById("quizzes-title6").textContent = quizzes.title6;
          document.getElementById("quizzes-description6").textContent = quizzes.description6;
          document.getElementById("quizzes-latest").innerHTML = quizzes.latest;

        });

      let quizContainer;
      let currentQuizIndex = 0;
      let quizData = [];
      let remainingLives = 3;

      fetch("./components/quiz_window.html")
        .then((response) => response.text())
        .then((html) => {
          currentQuizIndex = 0;
          quizContainer = document.getElementById("quiz_window");

          quizContainer.classList.remove("active");
          quizContainer.innerHTML = html;
          window.openQuizWindow = async () => {
            let questionText = [];
            quizContainer.classList.add("active");
            const questionElement = quizContainer.querySelector(".question");
            if (questionElement) {
              const field = quizData[currentQuizIndex].field;
              const wiki = quizData[currentQuizIndex].wiki;
              if (wiki != null) {
                const imageLink = await getImageFromURL(wiki);
                if (imageLink != null) {
                  console.log(imageLink);
                  // await downloadImage(imageLink);

                  const imageElement =
                    quizContainer.querySelector(".quiz_image img");
                  if (imageElement) {
                    imageElement.src = imageLink.startsWith("http")
                      ? imageLink
                      : "https://" + imageLink;
                    imageElement.alt = "Quiz image";
                  }
                }
              }

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
          };
          quizContainer
            .querySelectorAll(".quiz_button1, .quiz_button2")
            .forEach((button) => {
              button.addEventListener("click", () => {
                const selectedAnswer = button.textContent.trim();
                fetch("http://127.0.0.1:3000/answer", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: currentQuizIndex,
                    answer: selectedAnswer,
                  }),
                })
                  .then((r) => r.json())
                  .then((data) => {
                    console.log(data.correct);
                    let correctAnswer = data.correct;
                    quizContainer.classList.remove("active");
                    currentQuizIndex++;
                    if (!correctAnswer) {
                      remainingLives--;
                      console.log(remainingLives);
                      if (remainingLives <= 0) {
                        quizContainer.classList.remove("active");
                      } else {
                        document.querySelectorAll(".heart")[
                          remainingLives
                        ].style.visibility = "hidden";
                        openQuizWindow();
                      }
                    } else openQuizWindow();
                  })
                  .catch(console.error);
              });
            });
        });

      fetch("./components/pop_up.html")
        .then((res) => res.text())
        .then((html) => {
          const container = document.getElementById("pop_up");
          container.innerHTML = html;

          // only allow logged-in users to open
          window.openPopUp = (cardId) => {

            container.classList.add("active"); currentCard = cardId;
            const quizzes = langData[currentLanguage].quizzes;
            const pop_up = langData[currentLanguage].pop_up;
            const imageElement = container.querySelector(".pop_up_img img");
            const descriptionElement = container.querySelector(".description_body");
            const description = container.querySelector(".description");
            const ranking = container.querySelector(".ranking");
            const play = container.querySelector(".button_play_quiz");
            const close = container.querySelector(".button_close");
            description.innerText = pop_up.description;
            ranking.innerText = pop_up.ranking;
            play.innerText = pop_up.play;
            close.innerText = pop_up.close;

            switch (cardId) {
              case 1:
                imageElement.src = "./images/MarvelVsDc.jpg";
                descriptionElement.innerText = quizzes.description1;
                break;
              case 2:
                imageElement.src = "./images/black_widow1.jpg";
                descriptionElement.innerText = quizzes.description2;
                break;
              case 3:
                imageElement.src = "./images/time.jpg";
                descriptionElement.innerText = quizzes.description3;
                break;
              case 4:
                imageElement.src = "./images/batman2.jpg";
                descriptionElement.innerText = quizzes.description4;
                break;
              case 5:
                imageElement.src = "./images/captain_marvel1.jpg";
                descriptionElement.innerText = quizzes.description5;
                break;
              case 6:
                imageElement.src = "./images/dr_doom.jpg";
                descriptionElement.innerText = quizzes.description6;
                break;

            }
          }
          container
            .querySelector(".button_close")
            .addEventListener("click", () => container.classList.remove("active"));

            if (!localStorage.getItem("authToken")) {
              openLogin();
              return;
            }
            container.classList.add("active");
            currentCard = cardId;
          };


          container
            .querySelector(".button_play_quiz")
            .addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();

              // include authToken in headers
              const auth = localStorage.getItem("authToken");
              fetch("http://127.0.0.1:3000/selectedCard", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: auth,
                },
                body: JSON.stringify({ cardId: currentCard }),
              })
                .then(() =>
                  fetch("http://127.0.0.1:3000/quizzes", {
                    method: "GET",
                    headers: {
                      Accept: "application/json",
                      Authorization: auth,
                    },
                  })
                )
                .then((r) => r.json())
                .then((data) => {
                  console.log("Datele primite de la server:", data);
                  container.classList.remove("active");
                  quizData = data;
                  currentQuizIndex = 0;
                  remainingLives = 3;
                  document
                    .querySelectorAll(".heart")
                    .forEach((h) => (h.style.visibility = "visible"));
                  window.openQuizWindow();
                })
                .catch((err) => {
                  console.error("Couldn't get quizzes", err);
                  alert("Couldn't load quizzez.");
                });
            });
        });
    });
});
