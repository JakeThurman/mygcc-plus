// ==UserScript==
// @name         MyGCC plus
// @namespace    https://github.com/jakethurman/mygcc-plus
// @version      1.0
// @description  mygcc-plus
// @author       Jake Thurman
// @match        https://my.gcc.edu/ICS/**
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
                document.getElementById("btnLogin").click();
            }
        } else {
            // Capture click on submit button to get username and password
            $("#btnLogin").click(function () {
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

                // CSS
                if (doStyling) {
                    var bodyBG = "";
                    var sidebarColor = "white";//rgb(240, 240, 240)";
                    var sidebarText = "#212121";
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
                    $("#contextPages li").css({ "border-bottom": "1px solid #b3b3b3" });
                    $("#sideBar h2, #sideBar div#quickLinks h3").css({ "border-bottom": "1px solid black", "margin-bottom": "0", "margin": "10px 0 0 0", "padding-left": "7px" });
                    $("#txtInput").css({ "border-radius": "4px", "border": "1px solid #ccc", "margin-top": "5px" });
                    $("#btnClear").attr("style", "font-size: 11px");
                    $("body[data-gr-c-s-loaded]").css({"background-image": bodyBG, "min-width": "initial"});
                    $("div.postItem").css({ "background-image": bodyBG });
                    $(".portlet").css({ "border": "1px solid #ddd", "border-radius": "3px" });
                    $(".one_column .pColumn1 .portlet").css({"border": "none"});
                    $(".buttonBar").css({ "background-color": "transparent" });
                    $("#portlets").css({ "width": "calc(100% - 270px)", "margin-top": "20px" });
                    $("#sideBar").css({ "width": "245px", "padding-right": "15px" });
                    $("#pageTitle, #pageTitle h2").css({ "margin": 0 });
                    $("#contextName").css({ position: "absolute", top: 0, right: 0, "background-color": "rgba(255,255,255,0.8)",  "color": "rgb(60, 61, 62)", "text-align": "center", "font-size": "24px", "display": "block", "box-sizing":"border-box", "cursor": "default", "text-decoration": "none", "line-height": "51px", "height":"151px", "padding": "50px" });
                    $(".pHead").css({ "border-radius": 0, "padding-top": "7px", "border-bottom": "none", "padding-bottom": "7px", "margin-top": "0", "background": "none", "font-size": "18px", "box-shadow": "none", "background-color": "#ddd" });
                    $(".pHead a, .pHead h3").css({ "color": "rgb(60, 61, 62)", "text-align": "center" });
                    $(".pHead h3").css({ "padding": 0 });
                    $("h4").css({ "background-color": "#f2f2f2", "color": "black", "text-align": "center", "border-radius": "0" });
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

                    // Table stuff
                    $(".gradeItemGrid, .groupedGrid").css({ "border-collapse": "collapse", "width": "100%", "border": "1px solid #bbbec3" });
                    $(".gradeItemGrid tbody, .groupedGrid tbody").each(function (_, el) { $(el).find("tr").each(function (i, row) { $(row).css({ "background-color": i % 2 == 0 ? "#fff" : "#f3f4f6" }); }); });
                    $(".gradeItemGrid td, .groupedGrid td").css({ "text-align": "left", "padding": "0 7px", "height": "28px", "font-size": "13px" });
                    $(".gradeItemGrid td:not(:first-child), .groupedGrid td:not(:first-child)").css({ "border-left": "1px solid #ececee" });
                    $(".gradeItemGrid th, .groupedGrid .header td, .groupedGrid th").css({ "text-align": "left", "height": "28px", "font-size": "13px", "padding": "0 7px", "color": "#4b535e", "background-color": "#ebecee", "white-space": "nowrap" });
                    $(".gradeItemGrid th:not(:first-child), .groupedGrid th:not(:first-child)").css({ "border-left": "1px solid #bbbec3" });
                    $(".gradeGroupSidebar").css({ "background-color": "white" });

                    $("<style>").text(`
a, a:link, a:visited {
    color: #026C7C;
}

.gccfooter a {
    color: white;
}

h1, h2, h3, h4, h5, h6 {
    color: #333;
}

.feedbackMessage {
    font-size: 1em;
    background-color: white;
    border-color: #d6d6d6;
    margin: 15px 3px;
    padding: 15px;
    font-weight: normal;
}

#top-nav-bar {
    background-color: #1d2121;
    border-bottom: 4px solid #c00;
    height: 46px;
    overflow:hidden;
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
