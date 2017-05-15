function setCookie(key, value) {
    var expires = new Date();
    expires.setTime(expires.getTime() + 1 * 24 * 60 * 60 * 1000);
    document.cookie = key + "=" + value + ";expires=" + expires.toUTCString();
}

function getCookie(key) {
    var keyValue = document.cookie.match("(^|;) ?" + key + "=([^;]*)(;|$)");
    return keyValue ? keyValue[2] : null;
}

(function explorerViewModel() {

    var self = this;

    htmlEncode = function (value) {
        return $("<div/>").text(value).html();
    };

    this.hideSpinner = function (callback) { $("#spinner").fadeOut(callback); };
    this.showSpinner = function (callback) { $("#spinner").fadeIn(callback); };

    renderHeader = function (jqXhr, method, absoluteUrl, textStatus) {
        var tokens = new Array();
        var headers = jqXhr.getAllResponseHeaders();
        tokens.push("<strong>", method, " ", absoluteUrl, "</strong>\r\n\r\n");
        tokens.push(hyperlink(headers.replace(/access\-control.*\r\n/mg, "") + "\r\n"));
        tokens.push(jqXhr.status + " " + textStatus + "\r\n\r\n");
        tokens.push("<hr />");
        return (tokens.join(""));
    }

    this.buildErrorHandler = function (method, absoluteUrl, callback) {
        return function (jqXhr, textStatus, errorThrown) {
            var tokens = new Array();
            tokens.push(renderHeader(jqXhr, method, absoluteUrl, textStatus));
            var responseContentType = jqXhr.getResponseHeader("Content-Type");
            if (/application\/.*json/.test(responseContentType)) {
                try {
                    tokens.push(JSON
                        .stringify(JSON.parse(jqXHR.responseText), null, 2)
                        .replace(/\\r\\n/g, "\r\n")
                        .replace(/ --->/g, "\r\n    --->"));
                } catch (error) {
                    tokens.push(jqXhr.responseText);
                }
            } else {
                tokens.push(htmlEncode(jqXhr.responseText));
            }
            $("#json-data").html(tokens.join(""));
            self.hideSpinner();
            if (typeof callback === "function") callback();
        };
    };

    this.buildActionForm = function(key, action, body) {
        var form = `<form class="api-form" id="form-${key}" method="${action.method}" action="${action.href}">
            <p><label>href: </label>${action.href}</p>
            <p><label>method: </label>${action.method}</p>`;
        if (action.type) {
            form += `<p><label>type:</label>${action.type}</p>
                    <p><label>body:</label> <textarea rows="10" cols="80">${action.template}</textarea></p>`;
        }
        form += "</form>";
        return (form);
    }

    this.buildSuccessHandler = function (method, absoluteUrl, callback) {
        return function (data, textStatus, jqXhr) {
            var html = renderHeader(jqXhr, method, absoluteUrl, textStatus);
            if (typeof data !== "undefined" && data !== null) {
                var resourceAsSimpleJson = JSON.stringify(simplify(data), null, 2);

                var actions = tagActions(data);
                tagLinks(data);
                var json = JSON.stringify(data, null, 2);
                html += hyperlink(json);

                for (var key in actions) {
                    if (!actions.hasOwnProperty(key)) continue;
                    console.log(key);
                    var action = actions[key];

                    var form = buildActionForm(key, action, resourceAsSimpleJson);

                    html = html.replace(key,
                        "<a class='action-button " +
                        action.method +
                        "' href='#' data-action-name='" +
                        action.name +
                        "' data-form-id='form-" +
                        key +
                        "' id='link-" +
                        key +
                        "'>" +
                        key.split("-").pop() +
                        "</a>" +
                        form);
                }
            }
            $("#json-data").html(html);
            self.hideSpinner();
            if (typeof callback === "function") callback();
        };
    };

    this.sendRequest = function (url, method, data, callback) {
        var absoluteUrl = $("#server-input").val() + url;
        var type = method || "GET";
        console.log(type + " " + absoluteUrl);
        this.showSpinner(function () {
            $.ajax({
                headers: { Accept: $("#api-version-select").val() },
                url: absoluteUrl,
                type: type,
                data: data,
                contentType: "application/json",
                dataType: "json",
                beforeSend: function (xr) {
                    // add any custom headers or logging here
                },
                success: buildSuccessHandler(type, absoluteUrl, callback),
                error: buildErrorHandler(type, absoluteUrl, callback)
            });

        });
    };

    this.simplify = function (data) {
        var result = new Object();
        for (var key in data) {
            if (!data.hasOwnProperty(key)) continue;
            if (/^_/.test(key)) continue; // Skip HAL+JSON hypermedia properties
            if (/href/i.test(key)) continue; // Skip any HREF properties.
            result[key] = data[key];
        }
        return result;
    };

    this.tagLinks = function (data, path, hash) {
        hash = hash || new Object();
        path = path === undefined ? "" : path;
        for (var key in data) {
            if (!data.hasOwnProperty(key)) continue;
            var prefix = (path === "" ? path : path + "-") + key;
            if (key === "_links") {
                for (var linkName in data[key]) {
                    if (!data[key].hasOwnProperty(linkName)) continue;
                    var link = data[key][linkName];
                    // Highlight hal+json HREFs so we can pick them up in a regex replace later.
                    link.href = "__LINK__" + link.href;
                }
            } else if (typeof data[key] === "object") {
                tagLinks(data[key], prefix, hash);
            }
        }
        return hash;
    };

    function clone(thing) {
        return(JSON.parse(JSON.stringify(thing)));
    }

    this.tagActions = function (data, path, hash) {
        hash = hash || new Object();
        path = path === undefined ? "" : path;
        for (var key in data) {
            if (!data.hasOwnProperty(key)) continue;
            var prefix = (path === "" ? path : path + "-") + key;
            if (key === "_actions") {
                for (var subkey in data[key]) {
                    if (!data[key].hasOwnProperty(subkey)) continue;
                    var action = data[key][subkey];
                    var uniqueId = prefix + "-" + subkey;
                    hash[uniqueId] = clone(action);
                    hash[uniqueId].template = /PUT/i.test(action.method)
                        ? JSON.stringify(simplify(data), null, 2)
                        : "{ }";
                    data[key][uniqueId] = action;
                    delete data[key][subkey];
                }
            } else if (typeof data[key] === "object") {
                tagActions(data[key], prefix, hash);
            }
        }
        return hash;
    };



    this.hyperlink = function (text) {
        var html = text.replace(/"href": "__LINK__([^<].*)"/g, '"href": "<a href="#$1" class="api-link">$1</a>"');
        html = html.replace(/^Location: (.*)$/gm, "Location: <a href=\"#$1\" class=\"api-link\">$1</a>");
        return html;
    };

    this.authorize = function (xhr, username, password) {
        var base64EncodedCredentials = btoa(username + ":" + password);
        if (username && password) xhr.setRequestHeader("Authorization", "Basic " + base64EncodedCredentials);

    }

    this.go = function (url) {
        if (typeof url === "string") {
            $("#endpoint-input").val(url);
        } else {
            url = $("#endpoint-input").val();
        }
        location.hash = "#" + url;
        self.sendRequest(url);
        return false;
    };

    function handleForm() {
        var form = this;
        var $form = $(form);
        $form.dialog("close");
        var url = $form.attr("action");
        var method = $form.attr("method");
        var textarea = $form.find("textarea")[0];
        var data = null;
        if (textarea) {
            console.log($(textarea).val());
            var json = $form.find("textarea").val();
            data = json ? JSON.stringify(JSON.parse(json)) : null;
        }
        self.sendRequest(url, method, data, function () { });
        return false;
    }

    $(function () {
        $("#server-input").change(function () { setCookie("explorer_server", this.value); });
        $("#explorer-form").submit(function () {
            return (go());
        });

        $("#json-data").on("click",
            "a.action-button",
            function () {
                var $this = $(this);
                var formId = $this.data("form-id");
                var title = $this.data("action-name");
                var $form = $("#" + formId);
                $form.dialog({
                    modal: true,
                    width: 600,
                    title: title,
                    buttons: [
                        { text: "Submit", click: function () { $form.submit(); } },
                        { text: "Cancel", click: function () { $(this).dialog("close"); } }
                    ]
                }).show();
                return false;
            });

        $(document).on("submit", "form.api-form", handleForm);

        var apiServer = getCookie("explorer_server") || "http://localhost:5555";
        $("#server-input").val(apiServer);

        $("#reset-button").click(function () {
            $("#json-data").html("Ready.");
            return (false);
        });

        $(window).on("hashchange", function () {
            go(location.hash.substring(1));
        });
        go(location.hash.substring(1) || "/");
    });
})();