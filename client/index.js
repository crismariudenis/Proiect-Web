let currentLanguage;
if (currentLanguage == null) {
  currentLanguage = "en";
  localStorage.setItem("language", currentLanguage);
}
let langData = null;
function changeFlag() {
  const flagImg = document.getElementById("flag");

  if (currentLanguage === "ro") {
    flagImg.src = "./images/usa_flag.jpg";
    currentLanguage = "en";
  } else {
    flagImg.src = "./images/romanian_flag.jpg";
    currentLanguage = "ro";
  }
  localStorage.setItem("language", currentLanguage);

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
  document.getElementById("navbar-dashboard").textContent = navbar.dashboard; // new
  document.getElementById("nav_login_btn").textContent = navbar.join;
  const footer = langData[currentLanguage].footer;
  document.getElementById("footer-left").textContent = footer.left;
  document.getElementById("footer-middle").textContent = footer.middle;
  document.getElementById("footer-right").textContent = footer.right;
  const landing = langData[currentLanguage].landing;
  document.getElementById("landing-title").innerHTML = landing.title;
  document.getElementById("landing-description").textContent =
    landing.description;
  document.getElementById("landing-button").textContent = landing.button;
  const quizzes = langData[currentLanguage].quizzes;
  document.getElementById("quizzes-featured").innerHTML = quizzes.featured;
  document.getElementById("quizzes-title1").textContent = quizzes.title1;
  document.getElementById("quizzes-description1").textContent =
    quizzes.description1;
  document.getElementById("quizzes-title2").textContent = quizzes.title2;
  document.getElementById("quizzes-description2").textContent =
    quizzes.description2;
  document.getElementById("quizzes-title3").textContent = quizzes.title3;
  document.getElementById("quizzes-description3").textContent =
    quizzes.description3;
  document.getElementById("quizzes-title4").textContent = quizzes.title4;
  document.getElementById("quizzes-description4").textContent =
    quizzes.description4;
  document.getElementById("quizzes-title5").textContent = quizzes.title5;
  document.getElementById("quizzes-description5").textContent =
    quizzes.description5;
  document.getElementById("quizzes-title6").textContent = quizzes.title6;
  document.getElementById("quizzes-description6").textContent =
    quizzes.description6;
  document.getElementById("quizzes-latest").innerHTML = quizzes.latest;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadLanguageData();

  // only load login UI if placeholder exists
  const loginContainer = document.getElementById("login");
  if (loginContainer) {
    fetch("./components/login.html")
      .then((r) => r.text())
      .then((html) => {
        loginContainer.innerHTML = html;

        const signBtn = document.getElementById("sign_in_btn");
        if (signBtn) {
          signBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const username = document
              .getElementById("login_username")
              .value.trim();
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
                  loginContainer.classList.remove("active");
                  if (window.updateNavbar) window.updateNavbar();
                } else {
                  alert("Error");
                }
              });
          });
        }
      })
      .catch(console.error);
  }

  fetch("./components/navbar.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("navbar").innerHTML = data;
      const navbar = langData[currentLanguage].navbar;
      document.getElementById("navbar-quizzes").textContent = navbar.quizzes;
      document.getElementById("navbar-about").textContent = navbar.about;
      document.getElementById("navbar-dashboard").textContent =
        navbar.dashboard; // new
      document.getElementById("nav_login_btn").textContent = navbar.join;

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

  // landing
  fetch("./components/landing.html")
    .then((r) => r.text())
    .then((html) => {
      const heroContainer = document.getElementById("hero");
      if (!heroContainer) return;
      heroContainer.innerHTML = html;
      const landing = langData[currentLanguage].landing;
      const titleEl = heroContainer.querySelector("#landing-title");
      const descEl = heroContainer.querySelector("#landing-description");
      const btnEl = heroContainer.querySelector("#landing-button");
      if (titleEl) titleEl.innerHTML = landing.title;
      if (descEl) descEl.textContent = landing.description;
      if (btnEl) btnEl.textContent = landing.button;
    })
    .catch(console.error);

  // quizzes
  fetch("./components/quizzes.html")
    .then((r) => r.text())
    .then((html) => {
      const quizzesContainer = document.getElementById("quizzes");
      if (!quizzesContainer) return;
      quizzesContainer.innerHTML = html;
      const q = langData[currentLanguage].quizzes;
      const setTxt = (sel, fn) => {
        const el = quizzesContainer.querySelector(sel);
        if (el) fn(el);
      };
      setTxt("#quizzes-featured", (el) => (el.innerHTML = q.featured));
      setTxt("#quizzes-title1", (el) => (el.textContent = q.title1));
      setTxt(
        "#quizzes-description1",
        (el) => (el.textContent = q.description1)
      );
      setTxt("#quizzes-title2", (el) => (el.textContent = q.title2));
      setTxt(
        "#quizzes-description2",
        (el) => (el.textContent = q.description2)
      );
      setTxt("#quizzes-title3", (el) => (el.textContent = q.title3));
      setTxt(
        "#quizzes-description3",
        (el) => (el.textContent = q.description3)
      );
      setTxt("#quizzes-title4", (el) => (el.textContent = q.title4));
      setTxt(
        "#quizzes-description4",
        (el) => (el.textContent = q.description4)
      );
      setTxt("#quizzes-title5", (el) => (el.textContent = q.title5));
      setTxt(
        "#quizzes-description5",
        (el) => (el.textContent = q.description5)
      );
      setTxt("#quizzes-title6", (el) => (el.textContent = q.title6));
      setTxt(
        "#quizzes-description6",
        (el) => (el.textContent = q.description6)
      );
      setTxt("#quizzes-latest", (el) => (el.innerHTML = q.latest));
    })
    .catch(console.error);

  // wrap quiz window load in a guard
  const quizWindowElement = document.getElementById("quiz_window");
  if (quizWindowElement) {
    fetch("./components/quiz_window.html")
      .then((response) => response.text())
      .then((html) => {
        currentQuizIndex = 0;
        quizContainer = quizWindowElement;
        quizContainer.classList.remove("active");
        quizContainer.innerHTML = html;
        window.openQuizWindow = async () => {
          if (!quizContainer) return;
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
            const quiz = langData[currentLanguage].quiz;
            document.getElementById("quiz-title").innerHTML = quiz.title;
            const question = quiz.question;
            const firstButton = quizContainer.querySelector(".quiz_button1");
            const secondButton = quizContainer.querySelector(".quiz_button2");
            let answers;
            if (currentLanguage === "ro") answers = quiz.answers;

            switch (field) {
              case "ID":
                questionText.push(question.id);
                questionText.push(quizData[currentQuizIndex].name);
                questionText.push(" ?");
                if (currentLanguage == "ro") {
                  let var1 = quizData[currentQuizIndex].value[0];
                  let var2 = quizData[currentQuizIndex].value[1];
                  firstButton.textContent = answers[var1];
                  secondButton.textContent = answers[var2];
                } else {
                  firstButton.textContent = quizData[currentQuizIndex].value[0];
                  secondButton.textContent =
                    quizData[currentQuizIndex].value[1];
                }
                break;
              case "ALIGN":
                questionText.push(question.align1);
                questionText.push(quizData[currentQuizIndex].name);
                questionText.push(question.align2);
                if (currentLanguage == "ro") {
                  let var1 = quizData[currentQuizIndex].value[0];
                  let var2 = quizData[currentQuizIndex].value[1];
                  firstButton.textContent = answers[var1];
                  secondButton.textContent = answers[var2];
                } else {
                  firstButton.textContent = quizData[currentQuizIndex].value[0];
                  secondButton.textContent =
                    quizData[currentQuizIndex].value[1];
                }
                break;
              case "EYE":
                questionText.push(question.eye1);
                questionText.push(quizData[currentQuizIndex].name);
                questionText.push(question.eye2);
                if (currentLanguage == "ro") {
                  let var1 = quizData[currentQuizIndex].value[0];
                  let var2 = quizData[currentQuizIndex].value[1];
                  firstButton.textContent = answers[var1];
                  secondButton.textContent = answers[var2];
                } else {
                  firstButton.textContent = quizData[currentQuizIndex].value[0];
                  secondButton.textContent =
                    quizData[currentQuizIndex].value[1];
                }
                break;
              case "universe":
                questionText.push(question.universe1);
                questionText.push(quizData[currentQuizIndex].name);
                questionText.push(question.universe2);
                firstButton.textContent = quizData[currentQuizIndex].value[0];
                secondButton.textContent = quizData[currentQuizIndex].value[1];
                break;
              case "year":
                questionText.push(question.year1);
                questionText.push(quizData[currentQuizIndex].name);
                questionText.push(question.year2);
                firstButton.textContent = quizData[currentQuizIndex].value[0];
                secondButton.textContent = quizData[currentQuizIndex].value[1];
                break;
              case "HAIR":
                questionText.push(question.hair1);
                questionText.push(quizData[currentQuizIndex].name);
                questionText.push(question.hair2);
                if (currentLanguage == "ro") {
                  let var1 = quizData[currentQuizIndex].value[0];
                  let var2 = quizData[currentQuizIndex].value[1];
                  firstButton.textContent = answers[var1];
                  secondButton.textContent = answers[var2];
                } else {
                  firstButton.textContent = quizData[currentQuizIndex].value[0];
                  secondButton.textContent =
                    quizData[currentQuizIndex].value[1];
                }
                break;
            }
            questionElement.textContent = questionText.join("");

            const counter = quizContainer.querySelector(".counter");
            counter.textContent = questionOffset + currentQuizIndex + 1;
          }
        };
        quizContainer
          .querySelectorAll(".quiz_button1, .quiz_button2")
          .forEach((button) => {
            button.addEventListener("click", () => {
              const selectedAnswer = button.textContent.trim();
              const auth = localStorage.getItem("authToken");
              fetch("http://127.0.0.1:3000/answer", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: auth,
                },
                body: JSON.stringify({
                  id: currentQuizIndex,
                  answer: selectedAnswer,
                }),
              })
                .then((r) => r.json())
                .then((data) => {
                  console.log(data.correct);
                  currentQuizIndex++;

                  // if we've exhausted this batch, bump offset and load next
                  if (currentQuizIndex >= quizData.length) {
                    questionOffset += quizData.length;
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
                      .then((newBatch) => {
                        quizData = newBatch;
                        currentQuizIndex = 0;
                        remainingLives = 3;
                        document
                          .querySelectorAll(".heart")
                          .forEach((h) => (h.style.visibility = "visible"));
                        openQuizWindow();
                      })
                      .catch(console.error);
                    return;
                  }

                  // ...existing correct/incorrect handling...
                  if (!data.correct) {
                    remainingLives--;
                    if (remainingLives <= 0) {
                      const auth = localStorage.getItem("authToken");
                      fetch("http://127.0.0.1:3000/score", {
                        method: "GET",
                        headers: {
                          Accept: "application/json",
                          Authorization: auth,
                        },
                      })
                        .then((response) => response.json())
                        .then((data) => {
                          const score = data.score;
                          console.log("Your score: " + score);
                        })
                        .catch((error) => {
                          console.error("Erorr : couldn't get score", error);
                        });
                      quizContainer.classList.remove("active");
                    } else {
                      document.querySelectorAll(".heart")[
                        remainingLives
                      ].style.visibility = "hidden";
                      openQuizWindow();
                    }
                  } else {
                    openQuizWindow();
                  }
                })
                .catch(console.error);
            });
          });
      })
      .catch(console.error);
  }

  // wrap pop-up load in a guard
  const popUpElement = document.getElementById("pop_up");
  if (popUpElement) {
    fetch("./components/pop_up.html")
      .then((res) => res.text())
      .then((html) => {
        const container = popUpElement;
        container.innerHTML = html;

        const imageElement = container.querySelector(".pop_up_img img");
        const descriptionElement = container.querySelector(".description_body");
        const description = container.querySelector(".description");
        const ranking = container.querySelector(".ranking");
        const playBtn = container.querySelector(".button_play_quiz");
        const closeBtn = container.querySelector(".button_close");

        window.openPopUp = (cardId) => {
          if (!localStorage.getItem("authToken")) {
            openLogin();
            return;
          }
          const auth = localStorage.getItem("authToken");
          const quizzes = langData[currentLanguage].quizzes;
          const pop_up = langData[currentLanguage].pop_up;
          // update header to include question number
          description.innerText = pop_up.description;
          ranking.innerText = `${pop_up.ranking} (#${cardId})`;

          // fetch only this question’s top-4
          fetch(`http://localhost:3000/rankings?question=${cardId}`, {
            headers: { Authorization: auth },
          })
            .then((response) => response.json())
            .then((data) => {
              const rankingBody = document.getElementById("ranking_body");
              rankingBody.innerHTML = "";
              data.forEach((entry, index) => {
                rankingBody.innerHTML += `${index + 1}. ${entry.username} - ${
                  entry.score
                } points <br>`;
                console.log(
                  `${index + 1}. ${entry.username} - ${entry.score} points <br>`
                );
              });
            })
            .catch((error) => {
              console.error("Erorr : couldn't get rank", error);
            });
          currentCard = cardId;

          playBtn.innerText = pop_up.play;
          closeBtn.innerText = pop_up.close;

          // set image and specific description
          switch (cardId) {
            case 1:
              imageElement.src = "./images/marvel_vs_dc.jpg";
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
          container.classList.add("active");
        };

        closeBtn.addEventListener("click", () =>
          container.classList.remove("active")
        );
        playBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
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
      })
      .catch(console.error);
  }
});
