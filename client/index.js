document.addEventListener("DOMContentLoaded", () => {
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
    });
});
