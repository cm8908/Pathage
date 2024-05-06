function onFileSelected() {
    const file = document.getElementById('fileInput').files[0];
    if (!file) {
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        var lines = contents.split('\n');  // 줄바꿈 문자로 분리
        var output = document.getElementById('fileContentDisplay');
        output.innerHTML = 'index: x,y<br>';  // 기존 내용 초기화
    
        lines.forEach(function(line, index) {
            if (index > 0 && line != '') {
                let xy = line.split(',')
                let x = parseFloat(xy[0]);
                let y = parseFloat(xy[1]);
                output.innerHTML += `<b>${index}</b>: (${x.toFixed(3)}, ${y.toFixed(3)})\t`;
            }
        });
    };
    reader.readAsText(file);
    drawInputCoordinates(file);
}

function drawInputCoordinates(file) {
    var formData = new FormData();
    formData.append('file', file);
    fetch('/draw-coordinates', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => displayPlot(data.plot_url, 'coordinatesPlotDisplay'))
}

function sendOption(model_name) {

    fetch('/request-config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model_name: model_name,
        }),
    })
    .then(response => response.json())
    .then(data => {
        createOptionMenu(data);
    })
    .catch(error => console.error('Error:', error));

}

function createOptionMenu(data) {
    const model_full_name = document.createElement('label');
    model_full_name.textContent = data.full_name;
    var container = document.getElementById('modelDisplayName')
    container.appendChild(model_full_name);

    const model_description = document.createElement('label');
    model_description.textContent = data.description;
    var container = document.getElementById('modelDisplayDesc');
    container.appendChild(model_description);

    var container = document.getElementById('modelDisplayConfigs');
    for (const key in data.config) {
        if (data.config.hasOwnProperty(key)) {
            const label = document.createElement('label');
            label.textContent = key + ": " + data.config[key];
            container.appendChild(label);
            container.appendChild(document.createElement('br'));
        }
    }
}

function inference() {
    var formData = new FormData();
    formData.append('file', document.getElementById('fileInput').files[0]);
    formData.append('model_name', document.getElementById('modelSelect').value);
    formData.append('config', 'Hello world!'); // TODO: implement getConfig()
    fetch('/inference', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        displayResultTour(data);
        displayPlot(data.plot_url, 'resultTourPlotDisplay');
    })
}

function displayResultTour(data) {
    var container = document.getElementById('resultTourDisplay');
    let content = 'x, y (The sorted coordinates will be display)<br>';

    for (let i=0; i < data.tour.length; i++) {
        content += `<b>${data.tour[i]}</b>: (${data.sorted_x[i].toFixed(3)}, ${data.sorted_y[i].toFixed(3)})\t`;
    }
    container.innerHTML = content;
}

function displayPlot(plot_url, container_id) {
    var container = document.getElementById(container_id);
    container.src = "data:image/png;base64," + plot_url;
}
