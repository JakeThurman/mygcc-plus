// ==UserScript==
// @name         MyGCC plus
// @namespace    https://github.com/jakethurman/mygcc-plus
// @version      1.0
// @description  mygcc-plus
// @author       Jake Thurman
// @match        https://my.gcc.edu/ICS/**
// @match        https://my.gcc.edu/ics/**
// @grant        none
// ==/UserScript==

/*

To use this script
 1. Install the TamperMokey plugin for google chrome (or GreeseMonkey for Firefox)
 2. Add this whole file as a new script....
 3. Save

Customizing:
  1. Settings are at the bottom of the page, in the footer of mygcc

Features:
  1. Courses is always expanded
  2. Auto logs you in
  3. Keeps you logged in (usually)
  4. Looks better (OPTIONAL)
  5. Courses links go to Coursework page (OPTIONAL)

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

        $(function () {
            try {
                var t_style0 = performance.now();

                // Stop mygcc from scrolling halfway down the page when it loads. Why would you ever want that anyway????
                window.scrollTo(0, 0);

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
                setTimeout(function () {
                    $("#myCourses").addClass("in").css("height", "unset");
                }, 300);

                // Improve course registration by cheeting
                var wasDisabled = $("#pg0_V_tabAddCourse_divSearch input:disabled").attr("disabled", false).removeClass("aspNetDisabled").toArray().length;
                if (wasDisabled)
                    $("<div>")
                        .text("\"Don't click this until registration starts!\" -Jake")
                        .insertAfter($("#pg0_V_tabAddCourse_divSearch input[type=submit]"));

                //Make Couse links link to "Cousework" page
                var doLinkToCoursework = addOption(local_storage_goto_coursework_key, "Make Class Links go to Cousework Page", true);

                // Handle coursework linking
                if (doLinkToCoursework) {
                    $("#myCourses a")
                    .each(function (i, el) {
                        var $el = $(el);
                        $el.attr("href", urlCombine($el.attr("href"), "/Coursework.jnz"));
                    });
                }

                // Add option in footer for styling
                var doStyling = addOption(local_storage_restyle_key, "Use Jake's Custom Styling", true);
                var replaceMasthead = addOption("mygcc-plus--replace-masthead", "Use Ian's Header Image", true);

                if (replaceMasthead)
                    document.body.classList.add("ian-masthead");

                // CSS
                if (doStyling) {
                    var bodyBG = "";
                    var sidebarColor = "white";//rgb(240, 240, 240)";
                    var sidebarText = "#515151";
                    var sidebarBorder = "1px solid #adadad";

                    $("#headerTabs").css({ "border-bottom-right-radius": 0, "border-bottom-left-radius": 0, "background": "#98002e", "box-shadow": "black 0px 2px 6px 0px" });
                    $("#headerTabs .selected").attr({ "style": "background:#69152e!important" });
                    $("#sideBar div.sideSection, #sideBar div#quickLinks").css({ border: "none", "border-radius": 0 });
                    $("#pageTitleButtons, #mainCrumbs").hide();
                    $("#headerTabs").css({ position: "sticky", top: -1, "z-index":7999 });
                    $("#sideBar div.sideSection, #sideBar div#quickLinks").css({ "background": sidebarColor, "border-right": sidebarBorder, "margin": "0", "color": sidebarText })
                        .last().css({ "border-bottom": sidebarBorder });
                    $(".assignmentTitle").css({"border": "1px dashed #003471", "border-bottom": "none"});
                    $("#userWelcome, #ltlLabel, #sideBar h2, #sideBar h2 a, #sideBar h3, #sideBar h3 a, #sideBar div#quickLinks h3, #sideBar h2, #sideBar div#quickLinks h3, #quickLinks li a, #thisContext a").attr({ "style": "color:" + sidebarText + " !important" });
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

                    // Styles with spcial case handling
                    if ($("#sideBar").length)
                        $("#portlets").css({ "width": "calc(100% - 270px)", "margin-top": "10px" });

                    // Table stuff
                    $(".gradeItemGrid, .groupedGrid").css({ "border-collapse": "collapse", "width": "100%", "border": "1px solid #bbbec3" });
                    $(".gradeItemGrid tbody, .groupedGrid tbody").each(function (_, el) { $(el).find("tr").each(function (i, row) { $(row).css({ "background-color": i % 2 == 0 ? "#fff" : "#f3f4f6" }); }); });
                    $(".gradeItemGrid td, .groupedGrid td").css({ "text-align": "left", "padding": "0 7px", "height": "28px", "font-size": "13px" });
                    $(".gradeItemGrid td:not(:first-child), .groupedGrid td:not(:first-child)").css({ "border-left": "1px solid #ececee" });
                    $(".gradeItemGrid th, .groupedGrid .header td, .groupedGrid th").css({ "text-align": "left", "height": "28px", "font-size": "13px", "padding": "0 7px", "color": "#4b535e", "background-color": "#ebecee", "white-space": "nowrap" });
                    $(".gradeItemGrid th:not(:first-child), .groupedGrid th:not(:first-child)").css({ "border-left": "1px solid #bbbec3" });
                    $(".gradeGroupSidebar").css({ "background-color": "white" });

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


/* -------------------------
 *          GLOBAL
 * -------------------------
 */
a, a:link, a:visited {
    color: #0b8092;
    text-decoration: none;
}
a:hover, a:focus {
    text-decoration: underline;
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
        height: 50px;
    }
}

body.ian-masthead #masthead {
    background-color: #222222;
    background-image: url('data:image/png;base64,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') !important;
    background-size: contain;
    background-position: center center;
}


/* -------------------------
 *          SIDEBAR
 * -------------------------
 */
#sideBar {
    width: 270px;
    padding-top: 20px;
    border-right: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
    padding-right: 0;
    margin-bottom: -1px;
    padding-bottom: 20px;
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
.portlet-grid .portlet-header-bar {
    padding: 13px 20px 10px 20px;
    background-color: #ececec;
}

.portlet-grid .portlet-header-bar h3, .portlet-grid .portlet-header-bar a {
    color: #515151;
}
                    `).appendTo(document.body);

                    // Delete stuff
                    $("#DivStaff").remove();

                    // Leave the "ad" on the home page ONLY
                    if (location.href.toLowerCase() !== "https://my.gcc.edu/ics" && location.href.toLowerCase() !== "https://my.gcc.edu/ics/" && location.href.toLowerCase() !== "https://my.gcc.edu/ics" && location.href.toLowerCase() !== "https://my.gcc.edu/ics/campus_life/" && location.href.toLowerCase() !== "https://my.gcc.edu/ics/campus_life")
                        $("#TargetedMessage").remove();
                }

                var t_style1 = performance.now();
                var t_sum = ((t_jq1 - t_jq0) + (t_style1 - t_style0));
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
