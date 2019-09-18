// ==UserScript==
// @name         MyGCC plus
// @namespace    https://github.com/jakethurman/mygcc-plus
// @version      1.36
// @description  mygcc-plus
// @downloadURL  https://github.com/jakethurman/mygcc-plus/raw/master/mygcc-plus.user.js
// @author       Jake Thurman and Ian Spryn
// @match        https://my.gcc.edu/ICS**
// @match        https://my.gcc.edu/ics**
// ==/UserScript==

/*

To use this script
  1. Install the TamperMokey plugin for google chrome (or GreeseMonkey for Firefox)
  2. Navigate to: https://github.com/JakeThurman/mygcc-plus/raw/master/mygcc-plus.user.js

To update:
  - Navigate to the given url, or use the tampermonkey "Check for userscript updates" feature;

Customizing:
  - Settings are at the bottom of the page, in the footer of mygcc

Features:
  1. Courses is always expanded
  2. Auto logs you in
  3. Keeps you logged in (usually)
  4. Looks better (OPTIONAL)
  5. Courses links go to Coursework page (OPTIONAL)
  6. CTRL+, to jump to courses
  7. The "Low Hanging Fruit" bugs of MyGCC are fixed
    a. examples: page jumps down to the bottom when you laod the page
                 portlets on sign-up page are no longer cut off

*/


(function() {
    'use strict';

    var util = (function () {
        function getMostCommonEl(arr){
            return arr.sort((a,b) =>
                arr.filter(v => v===a).length
                - arr.filter(v => v===b).length
            ).pop();
        }

        // Source taken from _.once
        function memoize(func) {
            var ran = false, memo;
            return function() {
                if (ran) return memo;
                ran = true;
                memo = func.apply(this, arguments);
                func = null;
                return memo;
            };
        }

        function urlCombine(a, b) {
            a = a.endsWith("/") ? a.slice(0, -1) : a;
            return a + b;
        }

        function onError(e) {
            console.error(e);
        }

        function getStringAcronym(str) {
            return (str.match(/\b(\w)/g) || []).join("");
        }

        return {
            getMostCommonEl,
            memoize,
            urlCombine,
            onError,
            getStringAcronym,
        };
    })();

    var getOptionContainer = util.memoize(function () {
        return $("<div>")
            .appendTo($("#GRCbottombar"))
            .css({ "padding-left": "20%" });
    });

    try {
        var t_jq0 = performance.now();

        // Local storage keys for mygcc username and password
        var local_storage_username_key = "mygccplus_un",
            local_storage_password_key = "mygccplus_pw",
            local_storage_restyle_key = "mygccplus_style",
            local_storage_goto_coursework_key = "mygccplus_goto_coursework",
            ss_just_logged_in = "mygccplus_justloggedin",
            ss_last_page = "mygccplus_lastpage",
            ss_just_logged_in_2 = "mygccplus_justloggedin_noloop",
            ss_should_auto_log_in = "mygccplus_auto_log_in";

        // Fix redirect on login
        var justLoggedIn = JSON.parse(sessionStorage[ss_just_logged_in] || "false");
        var justLoggedIn2 = JSON.parse(sessionStorage[ss_just_logged_in_2] || "false");
        //default autoLogIn to true if localStorage is null
        var autoLogIn = JSON.parse(localStorage.getItem(ss_should_auto_log_in)) != null ? JSON.parse(localStorage.getItem(ss_should_auto_log_in) || "false") : true;
        var lastPage = sessionStorage[ss_last_page];

        if (autoLogIn) {
            if (justLoggedIn && !justLoggedIn2 && (!document.refferer || document.referrer.indexOf("my.gcc.edu") >= 0)) {
                // Clear loggin flag so we don't infinity loop
                sessionStorage.setItem(ss_just_logged_in, JSON.stringify(false));
                sessionStorage.setItem(ss_just_logged_in_2, JSON.stringify(true));
    
                try {
                    //Go back if we can!
                    if (lastPage) {
                        history.back();
                    }
                }
                catch(e) {
                    util.onError(e);
                }
            }
        }

        // Setup
        var interval = 1000 * 60; // After a minute
        setTimeout(function callback() {
            try {
                // Load the home page every minute
                //  just to trick MyGCC into not logging us out!
                $.get("/ICS/", function () {
                    setTimeout(callback, interval);
                });
            }
            catch(e) {
                util.onError(e);
            }
        }, interval);

        lastPage = location.href;
        if (autoLogIn) {
            // If username and password are in local storage
            if (localStorage.getItem(local_storage_username_key) !== null && localStorage.getItem(local_storage_password_key) !== null) {
                // If username and password DOM inputs are in DOM
                if (document.getElementsByName("userName")[0] && document.getElementsByName("password")[0]) {
                    // Set username and password inputs with username and password already in local storage
                    document.getElementsByName("userName")[0].value = localStorage.getItem(local_storage_username_key);
                    document.getElementsByName("password")[0].value = localStorage.getItem(local_storage_password_key);
    
                    sessionStorage.setItem(ss_just_logged_in, JSON.stringify(true));
    
                    // Click the submit button
                    $("#siteNavBar_btnLogin").click();
                }
            } else {
                // Capture click on submit button to get username and password
                $("#siteNavBar_btnLogin").click(function () {
                    try {
                        localStorage.setItem(local_storage_username_key, document.getElementsByName("userName")[0].value);
                        localStorage.setItem(local_storage_password_key, document.getElementsByName("password")[0].value);
                    } catch (e) {
                        alert(e);
                    }
                    return true;
                });
            }
        }
        var t_jq1 = performance.now();

        //Make the courswork portlet 100% wide instead of 50% wide
        if ((window.location.href.indexOf("Attendance") > -1) || (window.location.href.indexOf("Course_Information") > -1) || (window.location.href.indexOf("Coursework") > -1) || (window.location.href.indexOf("Gradebook") > -1)) {
            $(".portlet-column").addClass("portlet-max-width");
        }

        
        //Fix portlets going beyond their alotted space when your screen is too tiny
        $("iframe").addClass("proper-iframe-borders");

        //A really nasty way to move the "Student Dining Options" and "Contact Information" because it's too big to fit on a tiny screen with 50% width. Good job GCC. Good. Job.
        //Don't even bother trying to understand what I did. Just trust the force, Luke.
        if ($(window).width() < 1750) {
            if (window.location.href.indexOf("Sign-Up") > -1) {
                $("<div>", { "class": "portlet-grid-modified" })
                    .insertAfter($(".portlet-grid"))
                    $("<div>", { "class": "row-modified" })
                        .appendTo($(".portlet-grid-modified"))
                        $("<div>", { "class": "new-portlets" })
                            .appendTo($(".portlet-grid-modified"))
                            $("<div>", { "class": "holder"})
                                .appendTo($(".portlet-grid-modified"))
                                .append($("#pg2_Universal"))
                                .append($("#pg6_Universal"));
                $(".portlet-grid-modified").addClass("portlet-grid");
                $(".row-modified").addClass("row");
            }
        }

        // Add option in footer for styling
        var doStyling = addOption(local_storage_restyle_key, "Restyle Site", true);
        var headerSize = addMultiOption("mygcc-plus--header-height", "Header Height", [
            { key: "tall", text: "Tall" },
            { key: "normal", text: "Normal" },
            { key: "shortest", text: "Short"}
         ], "shortest");
        var hideAds = addOption("mygcc-plus--hide-ads", "Hide Ads (except on Home)", true);
        var shadowsOrBorders = addMultiOption("mygcc-plus-shadow-border", "Choose shadows or borders for UI", [
            {key: "shadows", text: "Shadows"},
            {key: "borders", text: "Borders"}
        ], "shadows");
        addOption(ss_should_auto_log_in, "Automatically log you in", true, true);

        if (headerSize === "shortest") {
            $("<div>", { "id": "space" }).insertAfter($("#masthead"));
            $("#masthead").remove();

            $("<style>").text(`

            .top-nav-bar .nav-container .main-nav-submenu-container .user-login .forgot-password-link {
                margin: 0px -40px 0px 0px;
            }

               @media screen and (min-width: 1026px) {

                    .top-nav-bar .nav-container .main-nav-submenu-container .user-login {
                        top: 20px;
                        left: 250px;
                    }

                    #siteNavBar_lnkForgot {
                        padding: 7px 16px !important;
                    }

                    #top-nav-bar {
                        top: 0px !important;
                        padding-right: 105px;
                    }

                    #siteNavBar_SearchButton {
                        top: 15px !important;
                        right: 60px !important;
                    }

                    #siteNavBar_loginToggle {
                        top: 15px !important;
                        right: 0px !important;
                    }

                    .top-nav-bar .nav-container .user-btn .user-image {
                        height: 36px !important;
                        width: 36px !important;
                    }

                    #top-nav-bar {
                        height: 74px !important;
                    }

                    #hamburger-menu-section ul li.selected {
                        background: transparent !important;
                    }

                    #user-login-section .arrow {
                        left: 85% !important;
                    }

                    #search-section {
                        margin-right: -95px;
                    }

                    #space {
                        height: 20px;
                    }

                    .logged-in .top-nav-bar .nav-container .main-nav-submenu-container .user-login.popover {
                        right: 0px;
                    }
               }

            #top-nav-bar a {
                border-right: transparent !important;
            }

            .top-nav-bar .more-links-div {
                margin-top: 30px;
            }

            .logged-in .top-nav-bar .nav-container .main-nav-submenu-container .user-login.popover {
                top: 88px !important;
                right: -105px !important;
            }

            #main-nav a, .more-toggle-link button {
                border-right: none !important;
                padding: 24px 25px 23px 25px !important;
            }

            .top-nav-bar .nav-container .link-scroll .navbar-nav {
                overflow: initial !important;
            }

               .logged-in .top-nav-bar .nav-container .search-btn {
                   background-color: transparent !important;
               }

               .top-nav-bar .nav-container .search-btn {
                    background-color: transparent !important;
               }

               .logged-in .top-nav-bar .nav-container .main-nav-submenu-container .search-section {
                   top: 88px;
               }

            `).appendTo(document.body);
            if ($(window).width() > 1025) {
                $("#siteNavBar_loginToggle").children().eq(0).css({'background': "url('https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_person_white_18dp-2x.png?raw=true') no-repeat top left/cover", 'background-size': '36px'});
            }

            // Trigger a resize even to correct the "More" dropdown in the header.
            jenzabar.framework.topNavAndSidebarSlideMenu.trigger.resize();
        }

        if (doStyling) {
            $(".arrow").css({ "left": '79%' });

            //Insert feedback option at bottom left of page
            $(".footer")[1].insertAdjacentHTML('beforeend', '<a href="https://docs.google.com/forms/d/e/1FAIpQLSfZGp3PM-lYed70DANXx0CiRPa2vNlAEVA2-QUeuJX2aOx7qA/viewform?usp=sf_link" target="_blank" style="float: left">MyGCC-Plus: Click here to provide feedback or report a bug</a>')

            //Insert changes log at bottom right of page
            $(".footer")[1].insertAdjacentHTML('beforeend', '<a href="https://github.com/JakeThurman/mygcc-plus/commits/master" target="_blank" style="float: right">Click here to view MyGCC-Plus changelog!</a>')

            //Remove redundant repetition of text in Academics --> All My Courses (portlet)
            $(".amc-header").remove();

            //Who uses these assignment navigation buttons anyway? And why is there two of these?!
            try {
                $('.detailHeader')[0].remove();
            } catch (err) {

            }

            //Change individual assignment score background
            if (document.querySelector('#pg0_V_GeneralAssignmentInfo__panAssignment') !== null) {
                gradeColor('pg0_V_GeneralAssignmentInfo_lblGrade', 'pg0_V_GeneralAssignmentInfo__panAssignment');
            }

            //Change gradebook background
            if (document.querySelector('#pg0_V_FinalGradeText') !== null) {
                gradeColor('gradeLetter', 'finalGradePanel');
            }

            /**
             * Dynamically change color of elements depending on the grade given
             */
            function gradeColor (gradeValue, gradeBackground) {
                var grade = "default";
                if (document.getElementById(gradeValue) !== null) {
                    grade = document.getElementById(gradeValue).innerHTML;
                } else if (document.getElementsByClassName(gradeValue).length > 0) {
                    grade = document.getElementsByClassName(gradeValue)[0].innerHTML;
                }
                var gradeBackground = document.getElementById(gradeBackground) ? document.getElementById(gradeBackground) : gradeBackground = document.getElementsByClassName(gradeBackground)[0];

                var colors =  {
                    "A+": {
                        background: "#00c853",
                        text: "#004e20"
                    },
                    "A-": {
                        backgroundColor: "#57d154",
                        text:"#245423"
                    },
                    "A": {
                        background: "#36c246",
                        text: "#195920"
                    },
                    "B+": {
                        background: "#8bc34a",
                        text: "#3d5620"
                    },
                    "B-": {
                        background: "#a0cb6e",
                        text: "#40502d"
                    },
                    "B": {
                        background: "#9ccc65",
                        text: "#32451d"
                    },
                    "C+": {
                        background: "#cddc39",
                        text: "#5a611a"
                    },
                    "C-": {
                        background: "#fbc02d",
                        text: "#544112"
                    },
                    "C": {
                        background: "#d4e157",
                        text: "#5d6325"
                    },
                    "D+": {
                        background: "#ffa726",
                        text: "#67430f"
                    },
                    "D-": {
                        background:"#e65100",
                        text: "#592001"
                    },
                    "D": {
                        background: "#f57c00",
                        text:"#623200"
                    },
                    "F": {
                        background: "#f44336",
                        text: "#7e231d"
                    },
                    default: {
                        background: "#edf4ff",
                        text: "#003375"
                    }
                };
                grade = grade.match(/([A-F][+\-]?(?![\w]+))/);
                grade = grade ? grade[0] : "default";

                gradeBackground.style.backgroundColor = colors[grade].background;
                gradeBackground.style.color = colors[grade].text;
            }

                //Make the ICS Server Error page more friendly :)
            if ((document.documentElement.textContent || document.documentElement.innerText).indexOf('Server Error in \'/ICS\' Application.') > -1) {
                $('body').remove();
            }

            //Since we hide page-title at the top of each page, we need to extract the error message if it exists so the user can still see that
            $('.alert-container').insertBefore("#PageBar_pageTitle")

            if (document.querySelector('.uploadFilePanelHeader') !== null) {
                //shift the "upload a file" text in the popup window for uploading an assignment
                document.getElementsByClassName('uploadFilePanelHeader')[0].getElementsByTagName('div')[1].style.padding='2px';
                //replace close button in the popup window for uploading an assignment
                document.getElementById('pg0_V_UploadAssignmentDetails_AssignmentFileUploader_imgClose').src = "https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_close_black_18dp-2x.png?raw=true";
            }

            if (window.location.href.indexOf("Gradebook") > -1) {
                var ele = document.getElementById('pg0_V_FeedbackDisplay__feedbackEditor__imgFeedback');
                if (ele) {
                    ele.src = "https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_add_comment_black_18dp-2x.png?raw=true";
                    ele.style.height='20px';
                }
            }

            //remove "rectanuglar button at the bottom of all cards"
            var cards = document.getElementsByClassName("card");
            if (cards.length > 0) {
                for (let card of cards) {
                    //reposition the title a little bit
                    card.getElementsByClassName('col-xs-10')[0].style.width = "100%";
                    card.getElementsByClassName('col-xs-10')[0].style.paddingLeft = "15px";
                    card.getElementsByClassName('col-xs-10')[0].style.paddingRight = "15px";

                    //push down the title a little bit
                    card.getElementsByClassName('col-xs-12')[0].style.paddingTop = "10px"

                    var aTags = card.getElementsByTagName("a");
                    var URL = aTags[0].getAttribute("href"); //retrieve URL
                    aTags[0].removeAttribute("href"); //make it not clickable  because the entire box will be clickable
                    aTags[0].style.textDecoration = "none"; //don't underline the text when mousing over
                    var linkTemp = aTags[1].innerText.toLowerCase();

                    if (card.getElementsByClassName("sub-info").length > 0) {
                        var subInfo = card.getElementsByClassName("sub-info")[0];
                        var newSubInfo = document.createElement("span");
                        newSubInfo.classList = "sub-info";
                        newSubInfo.style.paddingBottom = "5px";
                        selectIcon(newSubInfo, linkTemp, "left center");
                        newSubInfo.innerHTML = subInfo.innerHTML;
                        subInfo.parentElement.appendChild(newSubInfo)
                        subInfo.parentNode.removeChild(subInfo);
                    } else {
                        var icon = document.createElement("div");
                        icon.style.minHeight = "20px";
                        selectIcon(icon, linkTemp, "center")
                        card.getElementsByClassName('col-sm-12')[0].appendChild(icon);
                    }

                    //remove the bottom button because we don't need it TODO: what about professors where there might be an 'edit' button? What then?
                    aTags[1].remove();

                    //insert an a-tag so that the entire button is clickable
                    var a = document.createElement("a");
                    a.href = URL;
                    a.target = "_blank" //open in new tab
                    card.parentNode.insertBefore(a, card, "center");
                    a.appendChild(card); //make the card a child so that it's clickable
                }
            }

            function selectIcon(icon, linkText, position) {
                if (linkText.includes("download")) {
                    icon.style.background = "transparent url('https://fonts.gstatic.com/s/i/materialiconsoutlined/cloud_download/v1/24px.svg') no-repeat " + position;
                } else if (linkText.includes("visit")) {
                    icon.style.background = "transparent url('https://fonts.gstatic.com/s/i/materialiconsoutlined/link/v1/24px.svg') no-repeat " + position;
                } else {
                    icon.style.background = "transparent url('https://fonts.gstatic.com/s/i/materialiconsoutlined/info/v1/24px.svg') no-repeat " + position;
                }
            }

            //replace feedback icon for all homeworks (if they exist)
            var num = 0;
            while (document.getElementById('pg0_V__assignmentView__rptAssignments_ctl00__studentAssignBody__rptAssignments_ctl0' + num + '__panNotify') !== null && document.getElementById('pg0_V__assignmentView__rptAssignments_ctl00__studentAssignBody__rptAssignments_ctl0' + num + '__panNotify').getElementsByTagName('img')[0] !== undefined) {
                document.getElementById('pg0_V__assignmentView__rptAssignments_ctl00__studentAssignBody__rptAssignments_ctl0' + num + '__panNotify').getElementsByTagName('img')[0].src = "https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_feedback_black_18dp-2x.png?raw=true";
                document.getElementById('pg0_V__assignmentView__rptAssignments_ctl00__studentAssignBody__rptAssignments_ctl0' + num + '__panNotify').getElementsByTagName('img')[0].style.height='20px';
                num++;
            }

            if (window.location.href.indexOf("StudentAssignmentDetailView") > -1) {
                //replace 'add comment' icon
                document.getElementById('pg0_V__feedbackDisplay__feedbackEditor__imgFeedback').src = "https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_add_comment_black_18dp-2x.png?raw=true";
                document.getElementById('pg0_V__feedbackDisplay__feedbackEditor__imgFeedback').style.height='20px';
                //replace paper icon next to your submitted homework file
                if (document.getElementsByClassName('imageAndText')[0] !== undefined) {
                    document.getElementsByClassName('imageAndText')[0].getElementsByTagName('img')[0].src='https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_insert_drive_file_black_18dp-2x.png?raw=true';
                    document.getElementsByClassName('imageAndText')[0].getElementsByTagName('img')[0].style.height='18px';
                    document.getElementsByClassName('imageAndText')[0].getElementsByTagName('img')[0].style.paddingRight='5px';
                }
            }

            //Custom CSS for an assignment page with an overdue submission. Hopefully no one will ever see this code's effect
            if (document.querySelector('.lateAssignment') !== null) {
                $("<style>").text(`

                    a.uploadFile, a.uploadFile:hover, a.startAttempt, span.waitAttempt {
                        background-color: #ff97a1 !important;
                    }

                    a.uploadFile, a.uploadFile:link, a.uploadFile:visited, a.startAttempt span, a.startAttempt:visited span, a.startAttempt:link span {
                        color: #733a3a !important;
                    }

                    .uploadFile {
                        background-image: url(https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_cloud_upload_black_18dp-2x.png?raw=true) !important;
                    }

                    a.turnInAssignment, a.turnInAssignment:link, a.turnInAssignment:visited {
                        color: #733a3a !important;
                    }

                    a.turnInAssignment {
                        background-color: #FFCDD2 !important;
                    }

                `).appendTo(document.body);
            }
        }

        // Handle custom css differences via custom overrides
        if (headerSize === "normal") {
			$("<style>").text(`
/* These styles shorten the masthead even more than original */
body #masthead {
    background-size: contain !important;
    height: 120px !important;
}

@media screen and (min-width: 1026px) {
     #siteNavBar_loginToggle {
        top: -110px !important;
    }

    #top-nav-bar {
        top: 120px !important;
    }

    #siteNavBar_loginToggle .user-image {
        top: 0;
    }

    #search-section {
		margin-right: 30px;
    }
    .logged-in .top-nav-bar .nav-container .main-nav-submenu-container .search-section {
        top: -10px;
    }

    .logged-in .top-nav-bar .nav-container .main-nav-submenu-container .user-login.popover {
        top: -4px !important;
        right: 0px;
    }
}

#siteNavBar_SearchButton {
    top: -97px !important;
}
			`).appendTo(document.body);
        }

        // CSS
        if (doStyling) {
            //Move side bar higher
            //Create div to hold the moved side bar (yes I know this is a nasty hack)
            $("<div>", { "class": "container-fluid-sidebar" })
				.insertAfter($("#top-nav-bar"))
				.append($("#sideBar"));


            $("<style>").text(`
/* -------------------------
*          ???
* -------------------------
*/
.feedbackMessage {
    font-size: 1em;
    background-color: white;
    border-color: #d6d6d6;
    margin: 15px 3px;
    padding: 15px;
    font-weight: normal;
}

.popover.bottom {
    margin-top: -20px;
}

.pShortcut {
    display: none;
}

/* -------------------------
*          Special
* -------------------------
*/
@media screen and (min-width: 1026px) {
    .targeted-message {
        right: -135px;
        width: calc(100% - 538px);
    }
}

#mainCrumbs { /* Hide the breadcrums.... TODO: reconsider */
    display: none;
}

#pg0_V_divEmailAdvisor {
    position: inherit !important;
}



/* -------------------------
*          GLOBAL
* -------------------------
*/

.color-content-one {
    color: #000;
}

a, a:link, a:visited, .link-btn, .link-btn span {
    color: #0b8092;
    text-decoration: none;
}
a:hover, a:focus, .link-btn:hover, .link-btn:focus {
    text-decoration: underline;
    border: none;
}

h1, h2, h3, h4, h5, h6 {
    color: #333;
}

#mainLayout {
    margin-top: 46px;
    padding-bottom: 0;
    margin-bottom: -1px;
}

.page-title,
.page-title-btn {
    display: none;
}

footer {
    z-index: 10;
    position: relative;
}


a.btn-primary {
    color: white;
}

a.btn-primary:hover {
    background-color: #940909;
}

div.detailHeader {
    padding: 15px 15px 15px 0px;
    background-color: transparent;
    border-bottom: transparent;
}

/* -------------------------
*            NAV
* -------------------------
*/
@media screen and (min-width: 1026px) {
    #top-nav-bar {
        top: 200px;
    }
}

@media screen and (max-width: 1025px) {
    #top-nav-bar {
        border-bottom: transparent;
    }

    .top-nav-bar .nav-container .main-nav-submenu-container {
        background: #222;
    }

    #main-nav a {
        width: 100%;
    }
}

#top-nav-bar {
    background-color: #1d2121;
    border-bottom: 4px solid #c00;
    height: 44px;
}

#top-nav-bar a {
    font-size: 14px !important;
    font-weight: normal;
    line-height:23px;
    padding: 10px 16px;
    display: inline-block;
    border-right: 1px solid #3c3b3b;
}

#top-nav-bar .more-links-div {
    background-color: #1d2121;
    border-top: 4px solid #a60000;
    border-bottom: 0px solid #a60000;
}

#top-nav-bar .more-links-div ul li {
    padding: 0
}

#top-nav-bar a:hover, #top-nav-bar a:focus,
#top-nav-bar .selected a:hover, #top-nav-bar .selected a:focus {
    background-color: #020202;
    color: white !important;
}

#hamburger-menu-section ul li.selected a {
    background-color: #312b2b;
    font-weight: bold !important;
}

@media screen and (min-width: 1026px) {
    .top-nav-bar .nav-container .user-btn .user-image {
    height: 67px;
    width: 50px;
    }
}

#masthead {
    background-color: #222222;
    background-image: url('https://github.com/JakeThurman/mygcc-plus/blob/master/references/grove-city-college-outline.png?raw=true') !important;
    background-size: cover;
    background-position: center center;
    height: 200px !important;
}

#myCourses.collapse {
	display: block !important;
}

.logged-in .top-nav-bar .nav-container .main-nav-submenu-container .user-login.popover {
    left: unset;
}

.more-toggle-link button {
    font-size: 14px !important;
}

@media screen and (min-width: 1026px) {
    #siteNavBar_loginToggle {
        top: -185px;
        right: 10px;
    }

    #siteNavBar_SearchButton {
        top: -170px;
        right: 80px;
    }

	#user-login-section a {
		border-right: none !important;
    }
}

#masthead h1 a {
    background: transparent url('https://raw.githubusercontent.com/JakeThurman/mygcc-plus/master/references/gcc-logo.png') no-repeat;
    height: 57px;
    width: 54px;
}

@media screen and (max-width: 1025px) {
    .top-nav-bar .nav-container .user-btn .user-image {
        height: 40px;
        top: -5px;
    }

    #masthead {
        top: 44px;
    }

    .top-nav-bar {
        padding-top: 3px;
    }
}


/* -------------------------
*          SIDEBAR
* -------------------------
*/

@media screen and (max-width: 1025px) {
    .slide-menu-right .navbar .slide-menu-toggle-btns .active a {
        background: #97002e;
        color: #fff !important;
    }
    .slide-menu-right .navbar .slide-menu-toggle-btns a:hover {
        background: #97002e;
        color: #fff !important;
    }
    .slide-menu-right .navbar .slide-menu-toggle-btns .active a:hover {
        background: #97002e;
        color: #fff !important;
    }
    .slide-menu-right .navbar .slide-menu-toggle-btns li a {
        background: transparent;
        color: #111;
    }
    .slide-menu-btn {
        background-color: #97002e;
        width: 45px;
        height: 45px;
    }
    .sidebar-slide-btn-icon {
        font-size: 30px;
    }
    .sidebar-slide-menu-button {
        left: 328px !important;
    }
}

.container-fluid-sidebar {
    padding-left: 10px;
}
@media screen and (min-width: 1026px) {
    #sideBar {
    width: 270px;
    padding-top: 60px;
    padding-right: 0;
    margin-bottom: -1px;
    padding-bottom: 20px;
    }
}

.quick-links-with-sub-nav a {
    font-weight: normal !important;
    font-size: 13px !important;
    padding-left: 95px !important;
    text-indent: -85px;
}

.slide-menu-right .navbar li.add-page,
.slide-menu-right .navbar li.manage-context,
.slide-menu-right .navbar li.usage-stats,
.slide-menu-right .navbar li.copy-courses,
.slide-menu-right .navbar li.manage-group,
.slide-menu-right .navbar ul.sub-contexts li,
.slide-menu-right .navbar li.sidebar-quick-link {
    border: none;
}

li.quick-links-with-sub-nav button,
li.quick-links-with-sub-nav #myPages,
.my-courses.sub-nav {
    display: none;
}

.quick-links-with-sub-nav {
    border-bottom: 1px solid #ccc;
}

.sidebar-quick-link a {
    font-size: 13px !important;
}

.glyphicons.glyphicons-link.sidebar-icon-link {
    display: none;
}

.slide-menu-right .sidebar-link-title {
    border-color: transparent;
    color: #515151;
}

#contextPages .current-page a,
.slide-menu-right .navbar li button {
    border-left: 7px solid #a60000;
    text-indent: -7px;
    font-weight: bold !important;
}

#contextPages a,
.slide-menu-right .navbar li button {
    font-weight: normal;
    padding-left: 25px;
}

.quick-links-with-sub-nav + .sidebar-quick-link {
    padding-top: 20px;
}

#myCourses {
    padding: 10px 0;
}

.slide-menu-right .navbar li #myCourses a {
    text-indent: -80px
}

/* -------------------------
*         PORTLETS
* -------------------------
*/
.portlet {
    border-radius: 5px;
}

.proper-iframe-borders {
    width: 100% !important;
}

@media screen and (min-width: 1026px) {
    #portlets {
        width: calc(100% - 270px);
    }
}

.portlet-grid .portlet-header-bar {
    padding: 13px 20px 10px 20px;
    background-color: #efefef;
    text-align: center;
}

.portlet-grid .portlet-header-bar h3, .portlet-grid .portlet-header-bar a {
    color: #515151;
}

@media (min-width: 992px) {
    .portlet-max-width {
        width: 100%;
    }
}

/* -------------------------
*        ACADEMICS
* -------------------------
*/

/* All My Courses Portlet */

.AllMyCourses table.amcGenericTable td, .AllMyCourses table.amcGenericTable th {
    padding: 12px 4px 12px 4px;
}

.portlet-grid .alt {
    background-color: #efefef;
}

.trHighlight {
    background-color: #B3E5FC;
}

/* -------------------------
*        COURSEWORK
* -------------------------
*/

div.assignmentUnitCollapsible.itemHover:hover,
table.assignmentGrid.itemHover tr:hover,
table.assignmentGrid.itemHover tr:hover td,
table.cwkTableDisplay.itemHover tr:hover td,
table.reorder.itemHover tr:hover,
table.reorder.itemHover tr:hover td,
div.assignmentTitle {
    border: 0px;
}

div.dueNext {
    background-color: #B3E5FC;
    border: 0px;
    border-radius: 13px;
}

div.assignmentDisplay {
    background-color: #f3f3f3;
    border-radius: 13px;
    padding: 6px 20px 10px 25px;
}

div.assignmentDisplay:hover {
    border-color: transparent;
    background-color: #e5f7ff;
}

//TODO change these values
div.overrideDisplay:hover {
    background-color: #EAF1FE;
    border: 1px solid #144799;
}

.formatUpload {
    background-image: url(https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_insert_drive_file_black_18dp-2x.png?raw=true);
    background-size: 20px;
}

/* -------------------------
*     Course Main Page
* -------------------------
*/

.card-layout .masonry .card {
    background-color: #fafafa;
    box-shadow: 0px 5px 7px #e1e1e1;
    border-radius: 30px;
    text-align: center;
    height: 120px;
    max-height: 120px;
    -webkit-transition: background-color 300ms;
    -ms-transition: background-color 300ms;
    transition: background-color 300ms;
    -webkit-transition: box-shadow 300ms;
    -ms-transition: box-shadow 300ms;
    transition: box-shadow 300ms;
}

.card-layout .masonry .card:hover {
    background-color: #f2fbff;
    box-shadow: 0px 5px 7px #E1F5FE;
}

.card-layout .masonry .card .title {
    color: #00579B !important;
    padding: 0px 15px 0px 15px;
    font-size: 20px;
    max-height: 55px;
    overflow: hidden;
}

.card.row.class-xs-10 {
    width: 100%
}

.card-layout .masonry .card .sub-info {
    padding: 5px 14px 0px 30px;
    display: inline;
}

.card-layout .card-set-wrapper {
    border-width: 1px 0 0 0;
}


/* -------------------------
*     HOMEWORK RESULTS
* -------------------------
*/

.CourseworkPortlet div.gradedAssignment, .CourseworkPortlet .gradeAssignment {
    margin: 0px;
}

div.gradedAssignment {
    border: 0px;
    border-radius: 13px;
    max-width: 100%;
    text-align: center;
}

div.gradedAssignment div.statusDisplay, div.gradedAssignment.lateAssignment div.statusDisplay {
    background-image: none;
    padding-left: 0px;
    padding-top: 10px;
}

div.overrideHistory {
    background-image: url(https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_info_black_18dp-2x.png?raw=true);
    background-size: 20px;
}

div.studentCommentLink {
    margin-left: 15px;
}

div.feedbackDisplay div.feedbackWedge, div.feedbackDisplay div.choiceWedge {
    border-right: 0px;
}

div.feedbackDisplay div.feedbackWedgeOutline, div.feedbackDisplay div.choiceWedgeOutline {
    margin-top: 20px;
    border-right: 6px solid #B3E5FC;
}

div.feedbackDisplay div.commentWedgeOutline {
    border-left: 6px solid #B3E5FC;
    margin-top: 25px;
}

img.commentImage, img.feedbackImage {
    border: 0px;
}

div.feedbackDisplay {
    background-color: #B3E5FC;
    border: 0px;
    border-radius: 8px;
}

div.commentWedge {
    border: 0px;
}

div.feedbackDisplay span.author {
    color: #00374c;
}

/* -------------------------
*     HOMEWORK SUBMISSION
* -------------------------
*/

div.lateAssignment span.assignmentStatus strong {
    color: #ff0000;
}

div.lateAssignment {
    border: 0px;
    margin: 0px;
    background-color: #ff97a1;
    color: #000;
    border-radius: 5px;
}

div.detailInfoContent.formatType.formatUpload {
    background-image: none;
}

div.openAssignment {
    background-color: #B3E5FC;
    border: 0px;
    margin: 0;
    padding: 5px 10px 1px 5px;
    border-radius: 5px;
}

div.lateAssignment div.statusDisplay,
div.openAssignment div.statusDisplay {
    background-image: url(https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_calendar_today_black_18dp-2x.png?raw=true);
    background-size: 25px;
    background-position: 10px;
}

div.overrideInstructions {
    background-image: url(https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_info_black_18dp-2x.png?raw=true);
    background-size: 20px;
    padding-left: 25px;
}

div.fileDisplay {
    background-image: url(https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_insert_drive_file_black_18dp-2x.png?raw=true);
    background-size: 20px;
    padding: 0px 0px 0px 27px;
    margin-left: 5px;
}

div.uploadAssignmentInfo, div.onlineAssignmentInfo {
    background-position: 0px 0px;
}

a.uploadFile, a.uploadFile:link, a.uploadFile:visited, a.startAttempt span, a.startAttempt:visited span, a.startAttempt:link span {
    color: #0288D1;
}

a.uploadFile, a.uploadFile:hover, a.startAttempt, span.waitAttempt {
    background-color: #eee;
    padding: 25px 25px 25px 55px;
    margin: 0px 0px 25px 25px;
    border: 0px;
    border-radius: 13px;
    text-decoration: none;
    box-shadow: 0px 5px 20px 0px #ccc;
}

.uploadFile {
    background-image: url(https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_cloud_upload_blue_18dp-2x.png?raw=true);
    background-position: 17px 22px;
    background-size: 25px;
}

a.turnInAssignment {
    background-color: #B3E5FC;
    padding: 12px 15px 12px 60px;
    border-radius: 13px;
    border: 0px;
    margin: 0px 0px 0px 20px;
    background-image: url(https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_check_circle_black_18dp-2x.png?raw=true);
    background-position: 14px 17px;
}

a.startAttempt .attemptLink, a.turnInAssignment .turnInLink {
    text-decoration: none;
}

a.turnInAssignment, a.turnInAssignment:link, a.turnInAssignment:visited {
    color: #003958;
}

div.uploadAssignmentInfo, div.onlineAssignmentInfo {
    padding: 5px 5px 5px 33px;
    background-image: url(https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_cloud_upload_black_18dp-2x.png?raw=true);
    background-position: 5px 5px !important;
    background-size: 20px;
}

/* -------------------------
 *   UPLOAD HOMEWORK POPUP
 * -------------------------
 */

.CourseworkPortlet .uploadFilePanelHeader {
    border: 0px;
    border-radius: 15px 15px 0px 0px;
    box-shadow: 0px 0px;
}

.CourseworkPortlet .pSection table {
    margin-bottom: 0px;
}

.CourseworkPortlet .uploadFilePanelHeader + table {
    border: 0px;
    border-radius: 0px;
    box-shadow: 0px 0px;
    border-radius: 0px 0px 15px 15px;
}

.CourseworkPortlet .modalPopupAssignmentSelector, .CourseworkPortlet .modalPopup {
    background-color: #000;
}

#pg0_V_UploadAssignmentDetails_AssignmentFileUploader_imgClose {
    height: 25px;
}

/* -------------------------
 *         GRADEBOOK
 * -------------------------
 */

.gradebookPortlet .studentDetailScreen .finalGradePanel,
.gradebookPortlet .studentDetailScreen .gradeGroupItemList {
    border: 0px;
    border-radius: 13px;
    color: #444;
}

.student-detail-layout-container {
    margin-left: -170px;
}

.gradeColumn, .gradeNameColumn {
    padding: 15px !important;
}

.gradebookPortlet .gradeList .uploadAssignment {
    background: transparent url(https://github.com/JakeThurman/mygcc-plus/blob/master/references/outline_insert_drive_file_black_18dp-2x.png?raw=true) no-repeat 0 0;
    background-size: 18px;
}

/* -------------------------
 *           FOOTER
 * -------------------------
 */
.footer {
        background: #222;
}

                    `).appendTo(document.body);
        }

        $(function () {
            try {

                var t_style0 = performance.now();

                // Stop mygcc from scrolling halfway down the page when it loads.
                window.onload = function () {
                    window.scrollTo(0, 0);
                }

                // TODO: I think this is unused/broken
                if (!justLoggedIn && justLoggedIn2) {
                    // Clear secondary flag if we obviously aren't looping
                    sessionStorage.setItem(ss_just_logged_in_2, JSON.stringify(false));
                }

                // If there is a logout button on the page
                if (document.getElementById("logout")) {
                    // Capture click on logout button and remove credentials from local storage
                    document.getElementById("logout").addEventListener("click", function () {
                        try {
                            localStorage.removeItem(local_storage_username_key);
                            localStorage.removeItem(local_storage_password_key);
                        } catch (e) {
                            alert(e);
                        }
                        return true;
                    });
                }

                // Open the "My Courses" sidebar section
				//  This logic is duplicated in the css
				//   it is only left here for the sake of
				//   still being useful when css is off.
                setTimeout(function () {
                    $("#myCourses").addClass("in").css("height", "unset");
                }, 300);

                // Improve course registration by cheating
                var wasDisabled = $("#pg0_V_tabAddCourse_divSearch input:disabled").attr("disabled", false).removeClass("aspNetDisabled").toArray().length;
                if (wasDisabled)
                    $("<div>")
                        .text("\"Don't click this until registration starts!\" -Jake")
                        .insertAfter($("#pg0_V_tabAddCourse_divSearch input[type=submit]"));

                //Make Course links link to "Coursework" page
                var doLinkToCoursework = addOption(local_storage_goto_coursework_key, "Make Class Links go to Coursework Page", true);

                // Handle coursework linking
                if (doLinkToCoursework) {
                    $("#myCourses a")
                    .each(function (i, el) {
                        var $el = $(el);
                        $el.attr("href", util.urlCombine($el.attr("href"), "/Coursework.jnz"));
                    });
                }

                // CSS
                if (doStyling) {
                    /// ---------------------
                    //  Legacy CSS changes...
                    //    for better perforcance these should be removed/migrated to css rules
                    //    please do not add new styles using JQuery!
                    /// ---------------------
                    $("#userWelcome, #ltlLabel, #sideBar h2, #sideBar h2 a, #sideBar h3, #sideBar h3 a, #sideBar div#quickLinks h3, #sideBar h2, #sideBar div#quickLinks h3, #quickLinks li a, #thisContext a").attr({ "style": "color:" + "#111" + " !important" });
                    $("#sideBar h2, #sideBar div#quickLinks h3").css({ "border-bottom": "1px solid black", "margin-bottom": "0", "margin": "10px 0 0 0", "padding-left": "7px" });
                    $("#txtInput").css({ "border-radius": "4px", "border": "1px solid #ccc", "margin-top": "5px" });
                    $(".pToolbar:empty").css({"display": "none"});
                    $(".hint, .tabbox").css({ "background-color": "white" });
                    $(".CS .GrayBordered, .CS .GrayBordered th, .CS .GrayBordered td").css({ "background-color": "white" });

                    // I think these are from the Add/Drop course page
                    $(".contentTabs li a").css({ "font-size": "13px", "padding": "0 22px" });
                    $(".contentTabs li").css({ "padding-bottom": "4px", "padding-top": 8 });
                    $(".contentTabs li:first").remove();
                    $(".gradeGroupSidebar").css({ "background-color": "white" });

                    // Table stuff
                    $(".gradeItemGrid, .groupedGrid").css({ "border-collapse": "collapse", "width": "100%", "border": "1px solid #bbbec3" });
                    $(".gradeItemGrid tbody, .groupedGrid tbody").each(function (_, el) { $(el).find("tr").each(function (i, row) { $(row).css({ "background-color": i % 2 == 0 ? "#fff" : "#f3f4f6" }); }); });
                    $(".gradeItemGrid td, .groupedGrid td").css({ "text-align": "left", "padding": "0 7px", "height": "28px", "font-size": "13px" });
                    $(".gradeItemGrid td:not(:first-child), .groupedGrid td:not(:first-child)").css({ "border-left": "1px solid #ececee" });
                    $(".gradeItemGrid th, .groupedGrid .header td, .groupedGrid th").css({ "text-align": "left", "height": "28px", "font-size": "13px", "padding": "0 7px", "color": "#4b535e", "background-color": "#ebecee", "white-space": "nowrap" });
                    $(".gradeItemGrid th:not(:first-child), .groupedGrid th:not(:first-child)").css({ "border-left": "1px solid #bbbec3" });

                    // Leave the "ad" on the home page ONLY
                    //  also check setting flag!
                    if (hideAds && location.href.toLowerCase() !== "https://my.gcc.edu/ics" && location.href.toLowerCase() !== "https://my.gcc.edu/ics/" && location.href.toLowerCase() !== "https://my.gcc.edu/ics" && location.href.toLowerCase() !== "https://my.gcc.edu/ics/campus_life/" && location.href.toLowerCase() !== "https://my.gcc.edu/ics/campus_life")
                        $("#TargetedMessage").remove();
                }

                if (shadowsOrBorders === "borders") {

                    $("<style>").text(`
                        @media screen and (min-width: 1026px) {
                            #sideBar {
                                border-right: 1px solid #ccc;
                                border-bottom: 1px solid #ccc;
                            }
                        .portlet {
                            border: 1px solid #ddd !important;
                        }
                    `).appendTo(document.body);

                } else if (shadowsOrBorders === "shadows") {

                    $("<style>").text(`
                        @media screen and (min-width: 1026px) {
                            #sideBar {
                                box-shadow: 15px 15px 15px -13px #ddd;
                                
                            }
                        .portlet {
                            box-shadow: 0px 5px 10px 0px #ddd;
                        }
                        .portlet-grid .portlet-header-bar {
                            border-bottom: 0px;
                        }
                    `).appendTo(document.body);

                }

                // Enable CTRL+, search
                (function () {
                    $("<a>", { "href": "#", "class": "glyphicons glyphicons-search" })
                        .css({ "text-decoration": "none", "color": "#494949", "float": "right" })
                        .appendTo($("#quick-links .sidebar-link-title"))
                        .click(function (e) {
                            e.preventDefault();
                            showQuickNav();
                        });

                    $(document).keydown(function(e) {
                        if (e.key === "," && e.ctrlKey) showQuickNav();
                    });
                })();

                var t_style1 = performance.now();
                var t_sum = ((t_jq1 - t_jq0) + (t_style1 - t_style0));
                    console.log("Style overall took " + (t_style1 - t_style0) + " milliseconds.");
                console[t_sum > 100 ? "error" : "log"]("Jake's custom script took " + t_sum + " milliseconds.");
            }
            catch (e) {
                util.onError(e);
            }
        });

        var getQuickNavOptions = util.memoize(function () {
            var options = [];

            // Grab all of the options up the first time they're needed (memoized!)
            $("#myCourses a").each(function (i, el) {
                var $el = $(el);
                var url = $el.attr("href");

                // Make sure this isn't the corsework page
                var courseworkIndex = url.indexOf("Coursework.jnz");
                if (courseworkIndex != -1)
                    url = url.substring(0, courseworkIndex);

                var text = $el.text().toLowerCase();

                // Get an acronym of the part of the text after the course code
                var acronym = util.getStringAcronym(text.split("-")[1] || "");

                options.push({
                    text,
                    url,
                    acronym,
                });
            });

            return options;
        });

        function showQuickNav() {
            var subpages = {
                "g": "Gradebook.jnz",
                "grade": "Gradebook.jnz",
                "grades": "Gradebook.jnz",
                "coursework": "Coursework.jnz",
                "cw": "Coursework.jnz",
                "c": "Coursework.jnz",
                "w": "Coursework.jnz",
                "hw": "Coursework.jnz",
                "h": "Coursework.jnz",
                "homework": "Coursework.jnz",
                "work": "Coursework.jnz",
                "m": "Main_Page.jnz",
                "main": "Main_Page.jnz",
                "mainpage": "Main_Page.jnz",
                "home": "Main_Page.jnz",
                "i": "Course_Information.jnz",
                "info": "Course_Information.jnz",
                "who": "Collaboration.jnz?portlet=Coursemates",
                "collab": "Collaboration.jnz",
                "collaboration": "Collaboration.jnz",
                "slides":" Main_Page.jnz?portlet=Handouts",
                "handouts":" Main_Page.jnz?portlet=Handouts",
                "handout":" Main_Page.jnz?portlet=Handouts",
            };

            var container = $("<div>").appendTo(document.body);

            // Htlp text
            $("<div><b>CTRL+Comma quick nav</b><br/>Enter a whole or partial course name and a subpage<br/><br/>For Example:<br/>\"civ lit grade\", \"calc home\", or \"bio hw\"</div>")
                .appendTo(container)
                .css({
                "z-index": 1000,
                "position": "fixed",
                "top": "calc(50vh + 20px)",
                "left": "calc(50vw - 140px)",
                "width": "280px",
                "padding": "7px",
                "font-size": "14px",
                "background-color": "#edf4ff",
                "color": "#003375",
                "border-radius": "0 0 5px 5px",
            })

            var textbox = $("<input>", { "placeholder": "civ lit grade..." })
            .appendTo(container)
            .css({
                "z-index": 1000,
                "position": "fixed",
                "top": "calc(50vh - 20px)",
                "left": "calc(50vw - 140px)",
                "width": "280px",
                "height": "40px",
                "padding": "7px",
                "font-size": "16px",
                "background-color": "white",
                "border": "1px solid #ddd",
                "border-radius": "5px 5px 0 0",
            })
            .blur(function () { container.remove() })
            .focus()
            .keydown(function (e2) {
                if (e2.which == 13) {//Enter
                    var parts = textbox.val().trim().toLowerCase().split(" ");
                    var myMatches = [];
                    var pageMatch = null;
                    var options = getQuickNavOptions();

                    parts.forEach(function (myText) {
                        myMatches = myMatches.concat(options.filter(function(o) {
                            return o.text.indexOf(myText) != -1
                            || o.acronym.indexOf(myText) != -1;
                        }))

                        pageMatch = pageMatch || subpages[myText];
                    });

                    if (myMatches.length) {
                        location.href = util.getMostCommonEl(myMatches).url + (pageMatch || subpages["c"]);
                    }
                    else {
                        alert("No class found.");
                    }
                } else if (e2.which == 27) { //esc
                    container.remove();
                }
            });
        }

        function addOption(key, text, defaultValue, logout=false) {
            var currentVal = JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
            var optionEl = $("<input>", { id: "my_gcc_plus_option__" + key, type: "checkbox" })
                .css({ "margin": "0 4px 0 0" })
                .prop("checked", currentVal)
                .change(function () {
                    if (logout && document.getElementById("logout")) {
                        if (confirm("This will log you out to apply the change. Press okay to continue.")) {
                            localStorage.setItem(key, JSON.stringify(optionEl.is(":checked")));
                            document.getElementById("logout").click(); //logout user
                        } else {
                            //revert checkbox if user canceled
                            document.getElementById("my_gcc_plus_option__" + key).checked = !document.getElementById("my_gcc_plus_option__" + key).checked;
                        }
                    }
                    localStorage.setItem(key, JSON.stringify(optionEl.is(":checked")));
                    if (!logout) {
                        location.href = location.href; //refresh page
                    }
                });

            $("<div>")
                .append(optionEl)
                .append($("<label>", { "for": "my_gcc_plus_option__" + key }).text(text).css({ "color": "white", "font-weight": "normal" }))
                .appendTo(getOptionContainer());

            return currentVal;
        }

        // options: [{ key: String, text: String }]
        function addMultiOption(key, text, options, defaultValue) {
            var currentVal = JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));

            var container = $("<div>").appendTo(getOptionContainer())
                .css({ "color": "white" })
                .text(text + ": ");

            var name = "my_gcc_plus_option__" + key;
            options.forEach(function (option) {
                var optionEl = $("<input>", { id: name + "_" + option.key, name: name, type: "radio" })
                    .css({ "margin": "0 4px 0 0" })
                    .prop("checked", currentVal === option.key)
                    .change(function () {
                        localStorage.setItem(key, JSON.stringify(option.key));
                        location.href = location.href;
                    });

                $("<div>").css({ "display": "inline-block", "padding-right": "7px" })
                    .append(optionEl)
                    .append($("<label>", { "for": name + "_" + option.key }).text(option.text).css({"font-weight": "normal"}))
                    .appendTo(container);
            });

            return currentVal;
        }
    }
    catch (e) {
        util.onError(e);
    }
})();
