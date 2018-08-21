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
                var replaceMasthead = addOption("mygcc-plus--replace-masthead", "Show Simple Header", true);

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

body.ian-masthead #masthead {
    background-color: #272727;
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
