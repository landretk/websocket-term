let socket;

let slashCommands = {
    "connect": { cmd: connect, usage: "/connect <host> [port] [secure=true]" },
    "disconnect": { cmd: disconnect, usage: "/disconnect" },
    "help": { cmd: help, usage: "/help" },
};

function notImpl() {
    return;
}

function help() {
    postToGameView("Slash Commands", "yellow");
    for (let cmd in slashCommands) {
        if (slashCommands[cmd].usage) {
            postToGameView(`${cmd} - ${slashCommands[cmd].usage}`, "lightblue");
        }
    }
}

function connect(host, port, secure = true) {
    if (isSocketOpen(socket)) {
        postToGameView(`Closing connection to ${socket.url}`);
        socket.close();
    }

    try {
        socket = new WebSocket(`${secure ? "wss" : "ws"}://${host}${port ? ":" + port : ""}`);
    }
    catch (e) {
        postToGameView('Error: Incorrect server address (must be a ws(s):// url)', "red");
        return;
    }


    socket.addEventListener('open', (event) => {
        postToGameView(`Connected to ${socket.url}`, "green");
    })

    socket.addEventListener('message', (event) => {
        let color;
        if (event.data?.charAt(0) != 0o33) {
            color = "#FFFF99";
        }
        postToGameView(event.data, color);
    });
};

function disconnect() {
    if (isSocketOpen(socket)) {
        postToGameView(`Closing connection to ${socket.url}`);
        socket.close();
    } else {
        postToGameView("Not connected");
    }
}

function isSocketOpen(socket) {
    if (socket && socket.readyState === 1) {
        return true;
    }
    return false;
};

function sendToSocket(data) {
    if (isSocketOpen(socket)) {
        socket.send(data);
    }
    else {
        postToGameView("Error: not connected", "red");
    }
};

function postToGameView(data, color = "") {
    if (data && data !== "") {
        const p_elem = document.createElement("p");
        const input_text_node = document.createTextNode(data);
        if (color) {
            p_elem.style.color = color;
        }
        p_elem.appendChild(input_text_node);
        document.getElementById("game-view").appendChild(p_elem);
        p_elem.scrollIntoView();
        return true;
    }
    return false;
};

function onClickConnectLast(event) {
    event.target.blur();

    connect("ws.postman-echo.com/raw", "");
};

function onClickHelp(event) {
    event.target.blur();

    postToGameView(">help");
    help();
}

function handleGameInput(event) {
    const input_elem = event.target;
    const input = event.target.value.trim();

    if (input !== "") {
        input_elem.value = "";
        postToGameView(">" + input);
        if (input.charAt(0) == '/') {
            const commandInput = input.slice(1);
            let commandArgv = commandInput.split(/\s+/);
            let command = commandArgv.shift();
            console.log(command, commandArgv);
            if (command in slashCommands) {
                slashCommands[command].cmd(...commandArgv);
            }
        } else if (input == "help") {
            help();
        } else {
            sendToSocket(input);
        }
    }
}

(function main() {
    const game_input = document.getElementById("game-input");

    game_input.addEventListener('keydown', (event) => {
        const game_input_value = game_input.value.trim();
        if (event.key === "Enter" && game_input_value !== "") {
            handleGameInput(event);
        }
    });

    const connect_last = document.getElementById("connect-last");
    connect_last.addEventListener("click", onClickConnectLast);

    const help_link = document.getElementById("help-link");
    help_link.addEventListener("click", help);
})();