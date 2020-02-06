const latElem = document.getElementById("lat");
const longElem = document.getElementById("long");
const speedElem = document.getElementById("speed");
const altitudeElem = document.getElementById("altitude");
const whereAmIBtn = document.getElementById("where-am-i");
const visibilityElem = document.getElementById("iss-visibility");
const centerInputElem = document.getElementById("center-EEI");
const updatesInputElem = document.getElementById("stop-updates");
userCoordinates = undefined;
stopUpdates = false;
stopFollowTheIss = false;

// gerando o mapa na tela
var mymap = L.map("mapid").setView([0, 0], 4);

L.control.fullscreen().addTo(mymap);

var OpenMapSurfer_Roads = L.tileLayer(
  "https://maps.heigit.org/openmapsurfer/tiles/roads/webmercator/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution:
      'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> | Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
).addTo(mymap);

var myIcon = L.icon({
  iconUrl: "images/iss200.png",
  iconSize: [60, 62],
  iconAnchor: [25, 16]
});

var marker = L.marker([0, 0], {
  icon: myIcon
}).addTo(mymap);

// Função que liga/desliga a atualização em tempo real da posição da EEI
function updates() {
  updatesInputElem.checked ? (stopUpdates = true) : (stopUpdates = false);
}

// Função que liga/desliga a centralização da EEI no mapa
function followTheIss() {
  centerInputElem.checked
    ? (stopFollowTheIss = false)
    : (stopFollowTheIss = true);
}

function changeBtnNameAndAnimation() {
  // if (whereAmIBtn.firstChild.data == 'A que distância estou da EEI?') {
  if (whereAmIBtn.textContent == "A que distância estou da EEI?") {
    whereAmIBtn.innerHTML = "Parar rastreamento";
    whereAmIBtn.style.animation = "moving-colors 0.4s linear infinite";
  } else {
    whereAmIBtn.innerHTML = "A que distância estou da EEI?";
    whereAmIBtn.style.removeProperty("animation");
  }
}

function addMarker(lat, long) {
  marker2 = L.marker([lat, long])
    .bindPopup()
    .addTo(mymap)
    .openPopup();
  userCoordinates = [lat, long];
}

function removeMarker() {
  userCoordinates = undefined;
  mymap.removeLayer(marker2);
  delete marker2;
}

function getUserLocation() {
  if (userCoordinates == undefined) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        let lat = position.coords.latitude;
        let long = position.coords.longitude;

        changeBtnNameAndAnimation();
        addMarker(lat, long);
      });
    } else {
      alert("API de geolocalização não é suportada pelo seu navegador =(");
    }
  } else {
    changeBtnNameAndAnimation();
    removeMarker();
  }
}

function checkVisibility(visibility) {
  if (visibility == "eclipsed") {
    var visibilityIcon = document.createElement("i");
    visibilityIcon.setAttribute("class", "far fa-moon");

    var visibilityMessage = document.createElement("span");
    visibilityMessage.appendChild(
      document.createTextNode("É noite onde a EEI está")
    );

    var bgColor = "hsla(231, 45%, 46%, 0.643)";
  } else if (visibility == "daylight") {
    var visibilityIcon = document.createElement("i");
    visibilityIcon.setAttribute("class", "far fa-sun");

    var visibilityMessage = document.createElement("span");
    visibilityMessage.appendChild(
      document.createTextNode("A EEI está sob a luz do sol")
    );

    var bgColor = "#f7fb00a4";
  }

  // Elimina os elementos criados da vez anterior em que
  // essa função foi chamada
  while (visibilityElem.firstChild) {
    visibilityElem.removeChild(visibilityElem.firstChild);
  }

  visibilityElem.appendChild(visibilityIcon);
  visibilityElem.appendChild(visibilityMessage);
  visibilityElem.style.backgroundColor = bgColor;
}

async function getISSPos() {
  // verifica primeiro se o checkbox de parar de atualizar foi selecionado
  if (stopUpdates == true) {
    return false;
  } else {
    const response = await fetch(
      "https://api.wheretheiss.at/v1/satellites/25544"
    );
    const data = await response.json();

    let latitude = data.latitude;
    let longitude = data.longitude;
    let speed = new Intl.NumberFormat("pt-BR").format(data.velocity.toFixed(2)); // com toFixed vazio, corta a vírgula
    let altitude = new Intl.NumberFormat("pt-BR").format(
      data.altitude.toFixed(2)
    ); // formatando para visualização em notação BR
    latElem.textContent = latitude;
    longElem.textContent = longitude;
    speedElem.textContent = speed + " km/h";
    altitudeElem.textContent = altitude + " km";

    checkVisibility(data.visibility);

    marker.setLatLng([latitude, longitude]);

    // Checa se o checkbox de centralizar a EEI no mapa foi deselecionado
    if (stopFollowTheIss == false) {
      mymap.setView([latitude, longitude]);
    }

    issCoordinates = [latitude, longitude];

    if (userCoordinates == undefined) {
      return false;
    } else {
      let dist = mymap.distance(userCoordinates, issCoordinates);
      let kmDistance = dist / 1000;
      kmDistance = new Intl.NumberFormat("pt-BR").format(kmDistance.toFixed(2));

      marker2.setPopupContent(
        `<strong><center>Você está aqui!</center></strong>${kmDistance} km distante da EEI <center>(desconsiderando a altitude)</center>`
      );

      var latlngs = [issCoordinates, userCoordinates];

      var polyline = L.polyline(latlngs, {
        color: "#ff2bff"
      }).addTo(mymap);

      setInterval(() => {
        mymap.removeLayer(polyline);
      }, 1110);
    }
  }
}

getISSPos();
setInterval(() => getISSPos(), 1100);
whereAmIBtn.onclick = () => getUserLocation();
updatesInputElem.onclick = () => updates();
centerInputElem.onclick = () => followTheIss();
