import changelog from "../../../json/changelog.json"

// Change tab
function changeTab(evt, elementId) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(elementId).style.display = "block";
    evt.currentTarget.className += " active";
}

// Tab links
$("#welcome-button").click(function (event) {
    changeTab(event, "welcome");
})
$("#changelog-button").click(function (event) {
    changeTab(event, "changelog");
})
$("#server-button").click(function (event) {
    changeTab(event, "server-list");
})
$("#video-button").click(function (event) {
    changeTab(event, "video-settings");
})
$("#keyboard-button").click(function (event) {
    changeTab(event, "keyboard-settings");
})


// Load the changelog
for (let change of changelog) {
    let date = change.date;
    let version = change.version;
    let changes = change.changes.split("|");

    let message = $("<span>v" + version + " | " + date + "</span><br><br>");
    $("#changelog").append(message);

    for (let comment of changes) {

        let message = $("<span>- " + comment + "</span><br>");
        $("#changelog").append(message);
    }

    $("#changelog").append($("<br>"));
}
