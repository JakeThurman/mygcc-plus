// ==UserScript==
// @name         MyGCC plus
// @namespace    https://github.com/jakethurman/mygcc-plus
// @version      1.0.10
// @description  mygcc-plus
// @downloadURL  https://github.com/jakethurman/mygcc-plus/raw/master/mygcc-plus.user.js
// @author       Jake Thurman
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
  6. Stupid random bugs of MyGCC are fixed (sorry, doesn't include ICS error)
    a. examples: page jumps down to the bottom when you laod the page
                 portlets on sign-up page are no longer cut off

*/

(function() {
    'use strict';

    function onError(e) {
        console.error(e);
    }

    function getNow() {
        return (new Date()).toISOString();
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
    };

    var getOptionContainer = memoize(function () {
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
            ss_just_logged_in_2 = "mygccplus_justloggedin_noloop";

        // Fix redirect on login
        var justLoggedIn = JSON.parse(sessionStorage[ss_just_logged_in] || "false");
        var justLoggedIn2 = JSON.parse(sessionStorage[ss_just_logged_in_2] || "false");
        var lastPage = sessionStorage[ss_last_page];

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
                onError(e);
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
                onError(e);
            }
        }, interval);

        lastPage = location.href;

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
        var t_jq1 = performance.now();

        //Make the courswork portlet 100% wide instead of 50% wide
        if ((window.location.href.indexOf("Attendance") > -1) || (window.location.href.indexOf("Course_Information") > -1) || (window.location.href.indexOf("Coursework") > -1) || (window.location.href.indexOf("Gradebook") > -1)) {
            $(".portlet-column").addClass("portlet-max-width");
        }

        //Fix portlets going beyond their alotted space when your screen is too tiny
        $("iframe").addClass("proper-iframe-borders");
        
        //A really nasty way to move the "Student Dining Options" and "Contact Information" because it's too big to fit on a tiny screen with 50% width. Good job GCC. Good. Job.
        //Don't even bother trying to understand what I did. Just trust the force, Luke.
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

        // Add option in footer for styling
        var doStyling = addOption(local_storage_restyle_key, "Restyle Site", true);
        var doJakesStyles = addOption("mygcc-plus--jake-flag", "Use Jake's Custom Styling", false);
        var doIansStyles = addOption("mygcc-plus--ian-flag", "Use Ian's Custom Styling", true);

        // Handle custom css differences via custom overrides
        if (doJakesStyles) {
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
}

#siteNavBar_SearchButton {
    top: -97px !important;
}
			`).appendTo(document.body);
        }

        if (doIansStyles) {
			$("<style>").text(`
.portlet {
    box-shadow: 0px 5px 20px 0px #bbb; //0px 5px 30px 1px #8888;
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

/* -------------------------
*          Special
* -------------------------
*/
#TargetedMessage { /* MyGCC ad, this makes it show over the sidebar. It is deleted on all but the root page */
    z-index: 2;
}

@media screen and (min-width: 1026px) {
    .targeted-message {
        right: -135px;
        width: calc(100% - 538px);
    }
}




/* -------------------------
*          GLOBAL
* -------------------------
*/
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
    right: 0px;
}

@media screen and (min-width: 1026px) {
    #siteNavBar_loginToggle {
        top: -185px;
        right: 10px;
    }

	#search-section {
		margin-right: 65px;
	}

    #siteNavBar_SearchButton {
        top: -170px;
        right: 80px;
    }

	#user-login-section .arrow {
		left: 72% !important;
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
    border-right: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
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

/* -------------------------
*         PORTLETS
* -------------------------
*/

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
    background-color: #ececec;
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

                // Stop mygcc from scrolling halfway down the page when it loads. Why would you ever want that anyway????
                window.onload = function () {
                    window.scrollTo(0, 0);
                }

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

                //Make Course links link to "Cousework" page
                var doLinkToCoursework = addOption(local_storage_goto_coursework_key, "Make Class Links go to Cousrework Page", true);

                // Handle coursework linking
                if (doLinkToCoursework) {
                    $("#myCourses a")
                    .each(function (i, el) {
                        var $el = $(el);
                        $el.attr("href", urlCombine($el.attr("href"), "/Coursework.jnz"));
                    });
                }

                // CSS
                if (doStyling) {
                    var bodyBG = "";
                    var sidebarColor = "white";//rgb(240, 240, 240)";
                    var sidebarText = "#515151";
                    var sidebarBorder = "1px solid #adadad";

                    /// ---------------------
                    //  Legacy CSS changes...
                    //    for better perforcance these should be removed/migrated to css rules
                    //    please do not add new styles using JQuery!
                    /// ---------------------
                    $("#headerTabs").css({ "border-bottom-right-radius": 0, "border-bottom-left-radius": 0, "background": "#98002e", "box-shadow": "black 0px 2px 6px 0px" });
                    $("#headerTabs .selected").attr({ "style": "background:#69152e!important" });
                    $("#sideBar div.sideSection, #sideBar div#quickLinks").css({ border: "none", "border-radius": 0 });
                    $("#pageTitleButtons, #mainCrumbs").hide();
                    $("#headerTabs").css({ position: "sticky", top: -1, "z-index":7999 });
                    $("#sideBar div.sideSection, #sideBar div#quickLinks").css({ "background": sidebarColor, "border-right": sidebarBorder, "margin": "0", "color": sidebarText })
                        .last().css({ "border-bottom": sidebarBorder });
                    $(".assignmentTitle").css({"border": "1px dashed #003471", "border-bottom": "none"});
                    $("#userWelcome, #ltlLabel, #sideBar h2, #sideBar h2 a, #sideBar h3, #sideBar h3 a, #sideBar div#quickLinks h3, #sideBar h2, #sideBar div#quickLinks h3, #quickLinks li a, #thisContext a").attr({ "style": "color:" + "#111" + " !important" });
                    $("#sideBar h2, #sideBar div#quickLinks h3").css({ "border-bottom": "1px solid black", "margin-bottom": "0", "margin": "10px 0 0 0", "padding-left": "7px" });
                    $("#txtInput").css({ "border-radius": "4px", "border": "1px solid #ccc", "margin-top": "5px" });
                    $("#btnClear").attr("style", "font-size: 11px");
                    $("body[data-gr-c-s-loaded]").css({"background-image": bodyBG, "min-width": "initial"});
                    $("div.postItem").css({ "background-image": bodyBG });
                    $(".portlet").css({ "border": "1px solid #ddd", "border-radius": "3px" });
                    $(".one_column .pColumn1 .portlet").css({"border": "none"});
                    $(".buttonBar").css({ "background-color": "transparent" });
                    $("#pageTitle, #pageTitle h2").css({ "margin": 0 });
                    $(".pHead").css({ "border-radius": 0, "padding-top": "7px", "border-bottom": "none", "padding-bottom": "7px", "margin-top": "0", "background": "none", "font-size": "18px", "box-shadow": "none", "background-color": "#ddd" });
                    $(".pHead a, .pHead h3").css({ "color": "rgb(60, 61, 62)", "text-align": "center" });
                    $(".pHead h3").css({ "padding": 0 });
                    $("#contextPages li.currentPage").css({ "background": "#ececec", "border-left": "3px solid #69152e" });
                    $("#sideBar .searchControls").css({ "padding-top": "0", "padding-left": "10px" });
                    $("#footer_wrap").css({ "border-top": sidebarBorder });
                    $("#mainLayout").css({ "padding-bottom": 0, "margin-bottom": "-1px" });
                    $(".pToolbar:empty").css({"display": "none"});
                    $(".hint, .tabbox").css({ "background-color": "white" });
                    $(".CS .GrayBordered, .CS .GrayBordered th, .CS .GrayBordered td").css({ "background-color": "white" });
                    $(".contentTabs li a").css({ "font-size": "13px", "padding": "0 22px" });
                    $(".contentTabs li").css({ "padding-bottom": "4px", "padding-top": 8 });
                    $(".contentTabs li:first").remove();
                    $("#calendar").css({"background-color": "white"});

                    // Styles with special case handling
                    if ($("#sideBar").length)
                        $("#portlets").css({"margin-top": "10px"});

                    // Table stuff
                    $(".gradeItemGrid, .groupedGrid").css({ "border-collapse": "collapse", "width": "100%", "border": "1px solid #bbbec3" });
                    $(".gradeItemGrid tbody, .groupedGrid tbody").each(function (_, el) { $(el).find("tr").each(function (i, row) { $(row).css({ "background-color": i % 2 == 0 ? "#fff" : "#f3f4f6" }); }); });
                    $(".gradeItemGrid td, .groupedGrid td").css({ "text-align": "left", "padding": "0 7px", "height": "28px", "font-size": "13px" });
                    $(".gradeItemGrid td:not(:first-child), .groupedGrid td:not(:first-child)").css({ "border-left": "1px solid #ececee" });
                    $(".gradeItemGrid th, .groupedGrid .header td, .groupedGrid th").css({ "text-align": "left", "height": "28px", "font-size": "13px", "padding": "0 7px", "color": "#4b535e", "background-color": "#ebecee", "white-space": "nowrap" });
                    $(".gradeItemGrid th:not(:first-child), .groupedGrid th:not(:first-child)").css({ "border-left": "1px solid #bbbec3" });
                    $(".gradeGroupSidebar").css({ "background-color": "white" });

                    // Delete stuff
                    $("#DivStaff").remove();

                    // Leave the "ad" on the home page ONLY
                    if (location.href.toLowerCase() !== "https://my.gcc.edu/ics" && location.href.toLowerCase() !== "https://my.gcc.edu/ics/" && location.href.toLowerCase() !== "https://my.gcc.edu/ics" && location.href.toLowerCase() !== "https://my.gcc.edu/ics/campus_life/" && location.href.toLowerCase() !== "https://my.gcc.edu/ics/campus_life")
                        $("#TargetedMessage").remove();
                }

                var t_style1 = performance.now();
                var t_sum = ((t_jq1 - t_jq0) + (t_style1 - t_style0));
                    console.log("Style overall took " + (t_style1 - t_style0) + " milliseconds.");
                console[t_sum > 100 ? "error" : "log"]("Jake's custom script took " + t_sum + " milliseconds.");
            }
            catch (e) {
                onError(e);
            }
        });

        function addOption(key, text, defaultValue) {
            var currentVal = JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
            var optionEl = $("<input>", { id: "my_gcc_plus_option__" + key, type: "checkbox" })
                .css({ "margin": "0 4px 0 0" })
                .prop("checked", currentVal)
                .change(function () {
                    localStorage.setItem(key, JSON.stringify(optionEl.is(":checked")));
                    location.href = location.href;
                });

            $("<div>")
                .append(optionEl)
                .append($("<label>", { "for": "my_gcc_plus_option__" + key }).text(text).css({ "color": "white", "font-weight": "normal" }))
                .appendTo(getOptionContainer());

            return currentVal;
        }

        function urlCombine(a, b) {
            a = a.endsWith("/") ? a.slice(0, -1) : a;
            return a + b;
        }

        //POLYFILL: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
        if (!String.prototype.endsWith) {
            String.prototype.endsWith = function(search, this_len) {
                if (this_len === undefined || this_len > this.length) {
                    this_len = this.length;
                }
                return this.substring(this_len - search.length, this_len) === search;
            };
        }
    }
    catch (e) {
        onError(e);
    }
})();
