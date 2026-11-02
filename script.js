// ==========================================================
// Nature & Aventure - Partie JavaScript
// Fonctionnalités :
//  1. Navigation dynamique entre les pages (fetch local)
//  2. Carrousel d'images
//  3. Validation du formulaire côté client
//  4. Likes sauvegardés avec localStorage
//  Bonus : menu qui disparaît au scroll,
//          témoignages automatiques avec transition
// ==========================================================


// ---------- 1. Navigation dynamique avec fetch ----------

const vueAccueil = document.getElementById("vue-accueil");
const vueArticle = document.getElementById("vue-article");
const liensMenu = document.querySelectorAll(".navigation a");

// Charge un article (ex : "camping") sans recharger la page
function chargerArticle(nom) {
    fetch("pages/" + nom + ".html")
        .then(function (reponse) {
            if (!reponse.ok) {
                throw new Error("Article introuvable");
            }
            return reponse.text();
        })
        .then(function (texte) {
            // On transforme le texte reçu en document HTML
            const page = new DOMParser().parseFromString(texte, "text/html");
            const image = page.querySelector(".image-article-entete");
            const contenu = page.querySelector(".contenu-article");

            // Les chemins des pages internes commencent par "../" : on les corrige
            image.src = "images/" + image.getAttribute("src").split("/").pop();
            contenu.querySelector(".bouton-retour").setAttribute("href", "index.html");

            vueArticle.innerHTML = "";
            vueArticle.append(image, contenu);
            vueAccueil.hidden = true;
            vueArticle.hidden = false;
            document.title = page.title;
            activerLien(nom);
            window.scrollTo(0, 0);
        })
        .catch(function () {
            // Si fetch ne fonctionne pas (fichier ouvert sans serveur), on ouvre la page normalement
            window.location.href = "pages/" + nom + ".html";
        });
}

function afficherAccueil() {
    vueArticle.hidden = true;
    vueArticle.innerHTML = "";
    vueAccueil.hidden = false;
    document.title = "Nature & Aventure - Le Magazine";
    activerLien("accueil");
}

// Met la classe "lien-actif" sur le bon lien du menu
function activerLien(nom) {
    liensMenu.forEach(function (lien) {
        const cible = lien.getAttribute("href").includes(nom) || (nom === "accueil" && lien.getAttribute("href") === "index.html");
        lien.classList.toggle("lien-actif", cible);
    });
}

// L'adresse utilise un « # » (ex : index.html#camping) :
// les boutons Précédent / Suivant du navigateur fonctionnent donc aussi.
function afficherSelonAdresse() {
    const nom = window.location.hash.substring(1);
    if (nom === "") {
        afficherAccueil();
    } else {
        chargerArticle(nom);
    }
}

// Intercepte les clics sur les liens vers les articles et vers l'accueil
document.addEventListener("click", function (evenement) {
    const lien = evenement.target.closest("a");
    if (!lien) {
        return;
    }
    const href = lien.getAttribute("href");

    if (href.startsWith("pages/")) {
        evenement.preventDefault();
        window.location.hash = href.replace("pages/", "").replace(".html", "");
    } else if (href === "index.html") {
        evenement.preventDefault();
        if (window.location.hash !== "") {
            window.location.hash = ""; // retour à l'accueil
        } else {
            window.scrollTo(0, 0);
        }
    }
});

window.addEventListener("hashchange", afficherSelonAdresse);


// ---------- 2. Carrousel d'images ----------

const diapos = document.querySelectorAll(".carrousel-diapo");
const zonePoints = document.getElementById("carrousel-points");
let diapoActuelle = 0;

// Crée un point (indicateur) par image
diapos.forEach(function (diapo, i) {
    const point = document.createElement("button");
    point.type = "button";
    point.className = "point";
    point.setAttribute("aria-label", "Afficher l'image " + (i + 1));
    point.addEventListener("click", function () {
        afficherDiapo(i);
    });
    zonePoints.appendChild(point);
});
const points = zonePoints.querySelectorAll(".point");

function afficherDiapo(index) {
    // Revient au début après la dernière image (et inversement)
    diapoActuelle = (index + diapos.length) % diapos.length;
    diapos.forEach(function (diapo, i) {
        diapo.classList.toggle("actif", i === diapoActuelle);
    });
    points.forEach(function (point, i) {
        point.classList.toggle("actif", i === diapoActuelle);
    });
}

document.getElementById("btn-precedent").addEventListener("click", function () {
    afficherDiapo(diapoActuelle - 1);
});
document.getElementById("btn-suivant").addEventListener("click", function () {
    afficherDiapo(diapoActuelle + 1);
});

afficherDiapo(0);


// ---------- 3. Validation du formulaire ----------

const formulaire = document.getElementById("formulaire");
const champNom = document.getElementById("nom");
const champEmail = document.getElementById("email");
const confirmation = document.getElementById("confirmation");

// Affiche ou efface le message d'erreur d'un champ
function afficherErreur(champ, message) {
    document.getElementById("erreur-" + champ.id).textContent = message;
    champ.classList.toggle("invalide", message !== "");
    champ.setAttribute("aria-invalid", message !== "");
}

function validerFormulaire() {
    let valide = true;
    const nom = champNom.value.trim();
    const email = champEmail.value.trim();
    const formatEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (nom === "") {
        afficherErreur(champNom, "Veuillez saisir votre nom.");
        valide = false;
    } else if (nom.length < 2) {
        afficherErreur(champNom, "Le nom doit contenir au moins 2 caractères.");
        valide = false;
    } else {
        afficherErreur(champNom, "");
    }

    if (email === "") {
        afficherErreur(champEmail, "Veuillez saisir votre e-mail.");
        valide = false;
    } else if (!formatEmail.test(email)) {
        afficherErreur(champEmail, "Le format de l'e-mail est incorrect (exemple : nom@mail.com).");
        valide = false;
    } else {
        afficherErreur(champEmail, "");
    }

    return valide;
}

formulaire.addEventListener("submit", function (evenement) {
    evenement.preventDefault(); // pas d'envoi réel ni de rechargement
    confirmation.textContent = "";

    if (validerFormulaire()) {
        confirmation.textContent = "Merci " + champNom.value.trim() + ", votre inscription est enregistrée !";
        formulaire.reset();
    }
});


// ---------- 4. Likes sauvegardés avec localStorage ----------

const CLE_LIKES = "nature-aventure-likes";

function lireLikes() {
    try {
        return JSON.parse(localStorage.getItem(CLE_LIKES)) || {};
    } catch (erreur) {
        return {};
    }
}

function enregistrerLikes(likes) {
    try {
        localStorage.setItem(CLE_LIKES, JSON.stringify(likes));
    } catch (erreur) {
        // stockage indisponible : le like n'est pas mémorisé
    }
}

// Met à jour l'affichage d'un bouton selon qu'il est aimé ou non
function afficherLike(bouton, aime) {
    const total = Number(bouton.dataset.likes) + (aime ? 1 : 0);
    bouton.querySelector("span").textContent = total;
    bouton.classList.toggle("aime", aime);
    bouton.setAttribute("aria-pressed", aime);
    bouton.setAttribute("aria-label", (aime ? "Ne plus aimer" : "Aimer") + " cet article, " + total + " j'aime");
}

document.querySelectorAll(".bouton-like").forEach(function (bouton) {
    const article = bouton.dataset.article;
    afficherLike(bouton, lireLikes()[article] === true);

    bouton.addEventListener("click", function () {
        const likes = lireLikes();
        likes[article] = !likes[article];
        enregistrerLikes(likes);
        afficherLike(bouton, likes[article]);
    });
});


// ---------- Bonus : menu qui disparaît au scroll ----------

const entete = document.getElementById("entete");
let dernierScroll = 0;

window.addEventListener("scroll", function () {
    const scrollActuel = window.scrollY;
    // On cache le menu quand on descend, on le montre quand on remonte
    entete.classList.toggle("cache", scrollActuel > dernierScroll && scrollActuel > 100);
    dernierScroll = scrollActuel;
});


// ---------- Bonus : témoignages automatiques ----------

const temoignages = document.querySelectorAll(".temoignage");
let temoignageActuel = 0;

setInterval(function () {
    temoignages[temoignageActuel].classList.remove("actif");
    temoignageActuel = (temoignageActuel + 1) % temoignages.length;
    temoignages[temoignageActuel].classList.add("actif");
}, 4000);


// Au chargement : si l'adresse contient déjà un article (ex : index.html#voyages)
afficherSelonAdresse();
