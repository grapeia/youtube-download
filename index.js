async function getVideoConfig() {
    html = await fetch(window.location.href)
        .then((resp) => resp.text())
        .then((text) => text);
    startStr = "var ytInitialPlayerResponse = {";
    start = html.indexOf(startStr) + startStr.length - 1;
    end = html.indexOf("};", start) + 1;
    return JSON.parse(html.slice(start, end));
}

async function addButtonsToPlayerControls() {
    const config = await getVideoConfig();
    const streams = config.streamingData.adaptiveFormats.filter((format) =>
        format.mimeType.includes("video/mp4")
    );
    streams.forEach((stream) => {
        const button = document.createElement("button");
        const videoFileName = `${config.videoDetails.title}-${stream.qualityLabel}.mp4`;
        const thumbnail =
            stream.thumbnail ||
            config.videoDetails.thumbnail.thumbnails[
                config.videoDetails.thumbnail.thumbnails.length - 1
            ].url;

        button.innerHTML = `<span class="ytp-button-content">${stream.qualityLabel}</span>`;
        button.className = "ytp-button ytp-download-button";
        button.style =
            "background-color: #fff; border: 1px solid #ccc; border-radius: 3px; color: #000; font-size: 11px; font-weight: bold; height: 24px; line-height: 24px; margin-left: 5px; padding: 0 10px;";
        button.onclick = () => {
            var d = new Date();
            const popup = window.open(
                d,
                "_blank",
                "width=650,height=400,left=0,top=0,location=no,scrollbars=yes,resizable=yes"
            );
            popup.document.write(`
            <html>
                <head>
                    <title>Downloading ${config.videoDetails.title}</title>
                    <style>
                        body {
                            background-image: linear-gradient(to right, #ccc, #ccc);
                            background-image: url(${thumbnail});
                            background-repeat: no-repeat;
                            background-size: cover;
                            background-position: center;
                            background-color: #000;
                            height: 100vh;
                            width: 100vw;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                        }
                        .progress {
                            width: 90%;
                            height: 10px;
                            background-color: #fff;
                            border-radius: 5px;
                            margin-bottom: 10px;
                            position: absolute;
                            bottom: 0;
                        }
                        .progress-bar {
                            height: 100%;
                            background-color: #00e676;
                            border-radius: 5px;
                        }
                        .progress-percentage {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            font-size: 1.5em;
                            color: #fff;
                            text-shadow: 2px 2px 4px #000;
                            text-align: center;
                        }
                    </style>                       
                </head>
                <body>
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <div class="progress-percentage">0%</div>
                    <script>
                    ((window, document) => { 
                        console.log("Downloading");
                        const xhr = new XMLHttpRequest();
                        xhr.open("GET", "${stream.url}", true);
                        xhr.responseType = "blob";
                        xhr.onprogress = (e) => {
                            const percent = (e.loaded / e.total) * 100;
                            document.querySelector(".progress-bar").style.width = percent + "%";
                            document.querySelector(".progress-percentage").innerHTML = "Downloaded " + percent.toFixed(2) + "%";
                        };
                        xhr.onload = function () {
                            if (this.status === 200) {
                                const blob = this.response;
                                const link = document.createElement("a");
                                link.href = window.URL.createObjectURL(blob);
                                link.download = "${sanitizeString(videoFileName)}";
                                link.click();
                            }
                        };
                        xhr.send();
                        window.onbeforeunload = () => {
                            xhr.abort();
                        };
                    })(window, document);
                    console.log("Page started");
                </script> 
                </body>
            </html>`);
        };
        const playButton = document.getElementsByClassName("ytp-time-display")[0];
        button.style.margin = "10px";
        playButton.parentNode.insertBefore(button, playButton.nextSibling);
    });
}

function sanitizeString(str){
    str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
    return str.trim();
}

function removeButtonsFromPlayerControls() {
    const buttons = document.getElementsByClassName("ytp-download-button");
    while (buttons.length > 0) {
        buttons[0].remove();
    }
}

function renew() {
    removeButtonsFromPlayerControls();
    addButtonsToPlayerControls();
    document.addEventListener("yt-navigate-start", renew);
}
renew();
