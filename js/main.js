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

  let socketAttemptUrl = socket.url;
  let timeoutHandle = setTimeout(() => {
    postToGameView(`Connection to ${socketAttemptUrl} timed out`, "red");
  }, 2000);

  socket.addEventListener('open', (event) => {
    clearTimeout(timeoutHandle);
    postToGameView(`Connected to ${socket.url}`, "green");
  })

  socket.addEventListener('message', (event) => {
    if (event.data) {
      handleSocketRx(event.data);
    }
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

function handleSocketRx(data) {
  if (data.charAt(0) == '{') {
    handleJsonRx(data);
  }
  else {
    handleTextRx(data)
  }
};

function handleJsonRx(data) {
  let json_data;
  try {
    json_data = JSON.parse(data);
  }
  catch (e) {
    console.error("Error in message from socket:", e.name, e.message);
    console.log(data);
    return;
  }
  const json_type = json_data?.type;
  if ("Error" in json_data) {
    postToGameView("Error: " + json_data["Error"], "red");
  } else if (json_type === "error") {
    postToGameView("Error: " + json_data["error"], "red");
  } else if (json_type === "message") {
    handleTextRx(json_data["message"]);
  } else {
    postToGameView("JSON: " + data, "lightblue");
  }
  console.log(`JSON message from ${socket.url}:\n` + JSON.stringify(json_data, null, 2));
};

function handleTextRx(text) {
  let color;
  if (text.charAt(0) != 0o33) {
    color = "#FFFF99";
  }
  postToGameView(text, color);
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
    const replaced_data = data.replace(/\s*\r?\n\s*/g, "<br>")
                              .replace(/<(?!br\s*\/?)[^>]+>/g,"");
    p_elem.innerHTML = replaced_data;
    if (color) {
      p_elem.style.color = color;
    }
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

function hideConnectToDialog() {
  const connect_to_dialog = document.getElementById("connect-to-dialog");
  connect_to_dialog.style.display = "none";
}

function onClickConnectTo(event) {
  const connect_to_dialog = document.getElementById("connect-to-dialog");
  connect_to_dialog.focus();
  connect_to_dialog.style.display = "flex";
}

function onClickConnectToCancel(event) {
  hideConnectToDialog();
}

function onClickConnectToAccept(event) {
  const connect_to_dialog = document.getElementById("connect-to-dialog");
  const connect_to_host = document.getElementById("connect-to-host").value.trim();
  const connect_to_port = document.getElementById("connect-to-port").value.trim();
  const connect_to_ssl = document.getElementById("connect-to-ssl").checked;
  connect(connect_to_host, +connect_to_port, connect_to_ssl);
  hideConnectToDialog();
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
  help_link.addEventListener("click", onClickHelp);

  const connect_to_dialog = document.getElementById("connect-to-dialog");
  connect_to_dialog.addEventListener("blur", hideConnectToDialog);
  const connect_to = document.getElementById("connect-to");
  const connect_to_cancel = document.getElementById("connect-to-cancel");
  const connect_to_accept = document.getElementById("connect-to-accept");
  connect_to.addEventListener("click", onClickConnectTo);
  connect_to_cancel.addEventListener("click", onClickConnectToCancel);
  connect_to_accept.addEventListener("click", onClickConnectToAccept);

})();