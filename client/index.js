fetch("./components/navbar.html") // Fetch the navbar HTML file
  .then((response) => response.text()) // Convert the response to text
  .then((data) => {
    document.getElementById("navbar").innerHTML = data; // Insert the content into the placeholder
  });


fetch("./components/footer.html") // Fetch the navbar HTML file
  .then((response) => response.text()) // Convert the response to text
  .then((data) => {
    document.getElementById("footer").innerHTML = data; // Insert the content into the placeholder
  });

fetch("./components/pop_up.html") // Fetch the popup HTML
  .then((response) => response.text()) // Convert response to text
  .then((data) => {
    document.getElementById("pop_up").innerHTML = data; // Insert the content into the placeholder
  });
