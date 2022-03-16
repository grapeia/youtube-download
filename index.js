async function getVideoConfig() {
    html = await fetch(window.location.href)
        .then((resp) => resp.text())
        .then((text) => text);
    startStr = "ytInitialPlayerResponse =";
    start = html.indexOf(startStr) + startStr.length;
    end = html.indexOf("};", start) + 1;
    const json = JSON.parse(html.slice(start, end));
    return json;
}

//create function to return html body of download modal
function downloadVideo({
    title,
    videoFileName,
    url,
    thumbnail
}) {
    const html = `
        <html>
            <head>
                <title>Downloading ${title}</title>
                <style>
                    body {                        
                        font-family: 'Roboto', sans-serif;
                        background-image: url(${thumbnail});
                        background-repeat: no-repeat;
                        background-size: cover;
                        background-position: center;
                        color: #fff;
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
                        box-shadow: 0 0 5px #fff;
                        top: 70%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        position: absolute;
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
                        background-color: rgba(0, 0, 0, 0.3);
                        padding: 5px;
                        border-radius: 5px;
                    }
                    .overlay {                        
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                    }
                    .author {
                        position: absolute;
                        bottom: 10px;
                        right: 10px;
                        font-size: 1em;
                        color: #fff;
                        text-shadow: 2px 2px 4px #000;
                    }
                    h1 {
                        font-size: 2em;
                        color: #fff;
                        text-shadow: 2px 2px 4px #000;
                        text-align: center;
                        background-color: rgba(0, 0, 0, 0.3);
                        padding: 5px;
                        border-radius: 5px;
                        top: 15px;
                        width: 90%;
                        position: absolute;
                    }
                </style>
            </head>
            <body>
                <div class="overlay"></div>
                <h1>${title}</h1>
                <a href="https://www.grapeia.com.br" target="_blank" class="author">Youtube Downloader By Grapeia</a>
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <div class="progress-percentage">0%</div>
                <script>
                function download() {
                    console.log("Downloading ${title}");
                    const xhr = new XMLHttpRequest();
                    xhr.open("GET", "${url}", true);
                    xhr.responseType = "blob";
                    xhr.setRequestHeader("Origin", window.location.origin);
                    xhr.setRequestHeader("Referer", window.location.href);
                    xhr.setRequestHeader("User-Agent", navigator.userAgent);
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
                            link.download = "${videoFileName}";
                            link.click();
                        }
                    };
                    xhr.onerror = function () {
                        console.log("Error downloading file.");
                        fetch("${url}").then((response) => response.blob()).then((blob) => {
                            const link = document.createElement("a");
                            link.href = window.URL.createObjectURL(blob);
                            link.download = "${videoFileName}";
                            link.click();
                        });
                    };
                    xhr.send();
                    window.onbeforeunload = () => {
                        xhr.abort();
                    };
                }
                (() => { download(); })()
            </script>
            </body>
        </html >`;
    var d = new Date();
    const popup = window.open(
        d,
        "_blank",
        "width=650,height=400,left=0,top=0,location=no,scrollbars=yes,resizable=yes"
    );
    popup.document.write(html);
}

async function addButtonsToPlayerControls() {
    const config = await getVideoConfig();
    const includedControl = [];
    const streams = config.streamingData.adaptiveFormats.filter((format) => {
        const mustInclude = format.mimeType.includes("video/mp4") && [1080, 720, 480].includes(format.height) && !includedControl.includes(format.height);
        includedControl.push(format.height);
        return mustInclude;
    });
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
            downloadVideo({
                title: config.videoDetails.title,
                videoFileName,
                url: stream.url,
                thumbnail
            });
        };
        const playButton = document.getElementsByClassName("ytp-time-display")[0];
        button.style.margin = "10px";
        playButton.parentNode.insertBefore(button, playButton.nextSibling);
    });

    const allStreams = [...config.streamingData.adaptiveFormats].filter(Boolean);
    const select = document.createElement("select");
    select.className = "ytp-download-button";
    select.style =
        "background-color: #fff; border: 1px solid #ccc; border-radius: 3px; color: #000; font-size: 11px; font-weight: bold; height: 24px; line-height: 24px; margin-left: 5px; padding: 0 10px;";
    select.onchange = () => {
        const selectedStream = allStreams[select.value];
        const videoFileName = `${config.videoDetails.title}-${isVideo(selectedStream) ? "video" + selectedStream.qualityLabel : "audio"}-${selectedStream.bitrate}kbps.${getFileExtension(selectedStream)}`;
        const thumbnail =
            selectedStream.thumbnail ||
            config.videoDetails.thumbnail.thumbnails[
                config.videoDetails.thumbnail.thumbnails.length - 1
            ].url;
        downloadVideo({
            title: config.videoDetails.title,
            videoFileName,
            url: selectedStream.url,
            thumbnail
        });
    }
    const option = document.createElement("option");
    option.value = "";
    option.innerHTML = "All Streams download";
    select.appendChild(option);
    allStreams.forEach((stream, i) => {
        const option = document.createElement("option");
        option.value = i;
        if (isVideo(stream))
            option.innerHTML = getType(stream) + " - " + stream.qualityLabel + ", " + stream.fps + "fps, " + getReadableBitrate(stream);
        else
            option.innerHTML = getType(stream) + " - " + getReadableBitrate(stream);
        select.appendChild(option);
    });

    const nextButton2 = document.getElementsByClassName("ytp-time-display")[0];
    select.style.margin = "10px";
    nextButton2.parentNode.insertBefore(select, nextButton2.nextSibling);
}

function getType(stream) {
    return String(stream.mimeType.split(";")[0]).toUpperCase();
}

function isVideo(stream) {
    return stream.mimeType.includes("video")
}

function getFileExtension(stream) {
    return stream.mimeType.split(";")[0].split("/")[1];
}

function getAudioCodec(stream) {
    return stream.mimeType.split(";")[1].split("=")[1].replace(`"`, "");
}

function getReadableBitrate(stream) {
    const bitrate = stream.bitrate;
    if (bitrate < 1000) {
        return bitrate + " Kbps";
    } else {
        return (bitrate / 1000).toFixed(2) + " Mbps";
    }
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
