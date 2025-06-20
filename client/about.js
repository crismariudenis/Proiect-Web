let langData;

async function loadLanguageData() {
    try {
        const res = await fetch("./../json/language.json");
        langData = await res.json();

        const currentLanguage = localStorage.getItem("language")
        console.log(currentLanguage);
        const about = langData[currentLanguage].about;

        document.getElementById("about-home").textContent = about.home;
        document.getElementById("about-quizzes").textContent = about.quizzes;
        document.getElementById("about-title").textContent = about.title;
        document.getElementById("about-description").textContent = about.description;
        document.getElementById("about-footer").textContent = about.footer;
    } catch (e) {
        console.error("Eroare fetch language.json:", e);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadLanguageData();
});
