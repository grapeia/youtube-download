async function ytgGetVideoConfig() {
    return new Promise((resolve) => {
        setTimeout(async () => {
            const html = await ytgFetchContent();
            startStr = "ytInitialPlayerResponse =";
            start = html.indexOf(startStr) + startStr.length;
            end = html.indexOf("};", start) + 1;
            resolve(JSON.parse(html.slice(start, end)));
        }, 1000);
    });
}

async function ytgSetDownloadURL(stream) {
    if (stream.url) return stream.url;
    if (typeof window.ytgWinDecipher !== "function") await ytgUpdateDecipherInstance(html);
    const params = ytgGetParams(stream.signatureCipher || stream.cipher);
    const url = new URL(params.url);
    url.searchParams.set(params.sp ? params.sp : 'signature', ytgDecipher(params.s));
    return url.toString();
};

function ytgGetParams(url) {
    const params = {};
    const parser = document.createElement('a');
    parser.href = 'youtube.com?' + url;
    const query = parser.search.substring(1);
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
        const pair = vars[i].split('=');
        params[pair[0]] = decodeURIComponent(pair[1]);
    }
    return params;
}

function ytgDownloadVideo({
    title,
    videoFileName,
    url,
    thumbnail,
    cipher = false
}) {
    const hostname = window.location.hostname;
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
                function download(url) {
                    console.log("Downloading ${title}");
                    const toGoUrl = url || "${url}";
                    const xhr = new XMLHttpRequest();
                    xhr.open("GET", toGoUrl, true);
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
                            link.download = "${videoFileName}";
                            link.click();
                        }
                    };
                    xhr.onerror = function (error) {
                        console.log("Error downloading file.");
                        console.log(error);
                        document.querySelector(".progress-percentage").innerHTML = "Error downloading file. <br> Try with right click and select 'Save Link As'";
                        document.querySelector(".progress-percentage").style.fontSize = "0.8em";
                        document.querySelector(".progress").innerHTML = "<a href='${url}' download>Download</a>";
                        document.querySelector(".progress a").style.fontSize = "1.5em";
                                              
                    };
                    window.onbeforeunload = () => {
                        xhr.abort();
                    };
                    xhr.send();
                }
                (() => { download(); })()
            </script>
            </body>
        </html >`;
    const d = new Date();
    const popup = window.open(
        d,
        "_blank",
        "width=650,height=400,left=0,top=0,location=no,scrollbars=yes,resizable=yes"
    );
    popup.document.write(html);
}

async function ytgAddButtonsToPlayerControls() {
    const config = await ytgGetVideoConfig();
    const includedControl = [];
    const streams = config.streamingData.adaptiveFormats.filter((format) => {
        const mustInclude = format.mimeType.includes("video/mp4") && [1080, 720, 480].includes(format.height) && !includedControl.includes(format.height);
        includedControl.push(format.height);
        return mustInclude;
    });
    streams.forEach(async (stream) => {
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

        const url = await ytgSetDownloadURL(stream)
        button.onclick = () => {
            ytgDownloadVideo({
                title: config.videoDetails.title,
                videoFileName,
                url,
                thumbnail,
                cipher: !!stream.url
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
    select.onchange = async () => {
        const selectedStream = allStreams[select.value];
        const videoFileName = `${config.videoDetails.title}-${ytgIsVideo(selectedStream) ? "video" + selectedStream.qualityLabel : "audio"}-${selectedStream.bitrate}kbps.${ytgGetFileExtension(selectedStream)}`;
        const thumbnail =
            selectedStream.thumbnail ||
            config.videoDetails.thumbnail.thumbnails[
                config.videoDetails.thumbnail.thumbnails.length - 1
            ].url;
        const url = await ytgSetDownloadURL(selectedStream)
        ytgDownloadVideo({
            title: config.videoDetails.title,
            videoFileName,
            url,
            thumbnail,
            cipher: !!selectedStream.url
        });
    };
    const option = document.createElement("option");
    option.value = "";
    option.innerHTML = "All Streams download";
    select.appendChild(option);
    allStreams.forEach((stream, i) => {
        const option = document.createElement("option");
        option.value = i;
        if (ytgIsVideo(stream))
            option.innerHTML = ytgGetType(stream) + " - " + stream.qualityLabel + ", " + stream.fps + "fps, " + ytgGetReadableBitrate(stream);
        else
            option.innerHTML = ytgGetType(stream) + " - " + ytgGetReadableBitrate(stream);
        select.appendChild(option);
    });

    const nextButton2 = document.getElementsByClassName("ytp-time-display")[0];
    select.style.margin = "10px";
    nextButton2.parentNode.insertBefore(select, nextButton2.nextSibling);
}

function ytgGetType(stream) {
    return String(stream.mimeType.split(";")[0]).toUpperCase();
}

function ytgIsVideo(stream) {
    return stream.mimeType.includes("video");
}

function ytgGetFileExtension(stream) {
    return stream.mimeType.split(";")[0].split("/")[1];
}

function ytgGetAudioCodec(stream) {
    return stream.mimeType.split(";")[1].split("=")[1].replace(`"`, "");
}

function ytgGetReadableBitrate(stream) {
    const bitrate = stream.bitrate;
    if (bitrate < 1000) {
        return bitrate + " Kbps";
    } else {
        return (bitrate / 1000).toFixed(2) + " Mbps";
    }
}

function ytgRemoveButtonsFromPlayerControls() {
    const buttons = document.getElementsByClassName("ytp-download-button");
    while (buttons.length > 0) {
        buttons[0].remove();
    }
}

function ytgBetweenText(content, left, right) {
    let pos;
    if (left instanceof RegExp) {
        const match = content.match(left);
        if (!match) { return ''; }
        pos = match.index + match[0].length;
    } else {
        pos = content.indexOf(left);
        if (pos === -1) { return ''; }
        pos += left.length;
    }
    content = content.slice(pos);
    pos = content.indexOf(right);
    if (pos === -1) { return ''; }
    content = content.slice(0, pos);
    return content;
};

async function ytgFetchContent(url = window.location.href) {
    return await fetch(url)
        .then((resp) => resp.text())
        .then((text) => text);
}

async function ytgUpdateDecipherInstance(html) {
    const htmlToParse = html || await ytgFetchContent();
    const html5player = ytgGetPlayerJsUrl(htmlToParse);
    const jsContent = await ytgFetchContent(html5player);
    const functionName = ytgBetweenText(jsContent, `a.set("alr","yes");c&&(c=`, `(decodeURIC`);
    const toEval = jsContent.replace(`${functionName}=function(a)`, `window.ytgWinDecipher=function(a)`).replace('_yt_player', 'grapsPlayer');
    eval(toEval);
}

function ytgDecipher(s) {
    return window.ytgWinDecipher(s);
}

function ytgGetPlayerJsUrl(html) {
    const match = /<script\s+src="([^"]+)"(?:\s+type="text\/javascript")?\s+name="player_ias\/base"\s*>|"jsUrl":"([^"]+)"/.exec(html);
    const path = match ? match[1] || match[2] : null;
    return new URL(path, window.location.href).href;
}

function ytgCallProcess() {
    ytgUpdateDecipherInstance();
    ytgRemoveButtonsFromPlayerControls();
    ytgAddButtonsToPlayerControls();
}

function ytgStartProcess() {
    if (!window.location.href.includes("watch?v=")) {
        setTimeout(ytgStartProcess, 1000);
        return;
    }
    // listener event when youtube player is ready
    document.addEventListener('yt-navigate-finish', ytgCallProcess);
    ytgCallProcess();
}
ytgStartProcess();