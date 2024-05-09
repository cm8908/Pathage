let globalCoordinates = {'x': [], 'y': []};
function resetGlobalCoordinates() {
    globalCoordinates = {'x': [], 'y': []};
}

function changeInputTypeDisplay() {
    const inputType = document.getElementById('inputTypeSelect').value;
    if (inputType == 'inputTypeFile') {
        document.getElementById('inputTypeFileDisplay').style.display = 'block';
        document.getElementById('inputTypeTextDisplay').style.display = 'none';
    }
    else if (inputType == 'inputTypeText') {
        document.getElementById('inputTypeTextDisplay').style.display = 'block';
        document.getElementById('inputTypeFileDisplay').style.display = 'none';
    }
    else if (inputType == '') {
        document.getElementById('inputTypeFileDisplay').style.display = 'none';
        document.getElementById('inputTypeTextDisplay').style.display = 'none';
    }
}

function formatCoord(num) {
    num = parseFloat(num);
    if (Number.isInteger(num)) {
        return parseInt(num);
    }
    else {
        return num.toFixed(3);
    }
}
function onFileSelected() {
    const file = document.getElementById('fileInput').files[0];
    if (!file) {
        return;
    }

    let xs = [];
    let ys = [];
    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        var lines = contents.split('\n');  // 줄바꿈 문자로 분리
        var output = document.getElementById('fileContentDisplay');
        output.innerHTML = 'index: x,y<br>';  // 기존 내용 초기화
    
        lines.forEach(function(line, index) {
            if (index > 0 && line != '') {
                let xy = line.split(',')
                let x = formatCoord(xy[0]);
                let y = formatCoord(xy[1]);
                output.innerHTML += `<b>${index}</b>: (${x}, ${y})\t`;
                
                x = parseFloat(xy[0]);
                y = parseFloat(xy[1]);
                xs.push(x);
                ys.push(y);
            }
        });
        resetGlobalCoordinates();
        globalCoordinates.x = xs;
        globalCoordinates.y = ys;
        drawInputCoordinates();
    };
    reader.readAsText(file);
}

function onTextTyped() {
    const inputField = document.getElementById('textInput');
    let value = inputField.value;
    
    let validatedValue = value.replace(/[^0-9().,\s]/g, '');
    inputField.value = validatedValue;

    validatedValue = validatedValue.replace(/\s+/g, '');
    validatedValue = validatedValue.replace(/[()]/g, '');

    splitValues = validatedValue.split(',');
    let xs = []; let ys = [];
    let targetValue = 'index: x,y<br>';
    for (let i=0; i<splitValues.length; i++) {
        if (splitValues[i] == '') {
            continue;
        }
        if (i % 2 == 0) {
            let x = formatCoord(splitValues[i]);
            targetValue += `<b>${i/2+1}</b>: (${x}, `;

            x = parseFloat(splitValues[i]);
            xs.push(x);
        }
        else {
            let y = formatCoord(splitValues[i]);
            targetValue += `${y})\t`;

            y = parseFloat(splitValues[i]);
            ys.push(y);
        }
    }
    // TODO: error case: trailing commas (e.g. 1,2,2,2,,3)
    document.getElementById('fileContentDisplay').innerHTML = targetValue;
    
    resetGlobalCoordinates();
    globalCoordinates.x = xs;
    globalCoordinates.y = ys;
    drawInputCoordinates();
}

function preventEnterKey(event) {
    if (event.key === "Enter") {
        event.preventDefault();
    }
}

function drawInputCoordinates() {
    var formData = new FormData();
    formData.append('coordinates', JSON.stringify(globalCoordinates));
    fetch('/draw-coordinates', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        var graph = JSON.parse(data.graph);
        Plotly.newPlot('coordinatesPlotDisplay', graph.data, graph.layout);
    });
    // .then(data => displayPlot(data.plot_url, 'coordinatesPlotDisplay'))
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
    container.innerHTML = '<b>- Model Name: </b>';
    container.appendChild(model_full_name);

    const model_description = document.createElement('label');
    model_description.textContent = data.description;
    var container = document.getElementById('modelDisplayDesc');
    container.innerHTML = '<b>- Model Description: </b>';
    container.appendChild(model_description);

    var container = document.getElementById('modelDisplayConfigs');
    container.innerHTML = '<b>- Model configurations: </b><br>';
    for (const key in data.config) {
        if (data.config.hasOwnProperty(key)) {
            const label = document.createElement('label');
            label.textContent = key + ": " + data.config[key];
            container.appendChild(label);
            container.appendChild(document.createElement('br'));
        }
    }
}

// 로딩 화면을 표시하는 함수
function showLoading() {
    document.getElementById('overlay').style.display = 'flex';  // 오버레이 보이기
}

// 로딩 화면을 숨기는 함수
function hideLoading() {
    document.getElementById('overlay').style.display = 'none';  // 오버레이 숨기기
}

function inference() {

    const inputType = document.getElementById('inputTypeSelect').value;
    if (inputType == 'inputTypeFile') {
        const fileInput = document.getElementById('fileInput');
        if (fileInput.files.length == 0) {
            alert('Please select a file');
            return;
        }      
    }
    else if (inputType == 'inputTypeText') {
        const textInput = document.getElementById('textInput');
        if (textInput.value == '') {
            alert('Please type coordinates');
            return;
        }
    }

    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect.value == '') {
        alert('Please select a model');
        return;
    }

    showLoading();

    var formData = new FormData();
    formData.append('coordinates', JSON.stringify(globalCoordinates));
    formData.append('model_name', modelSelect.value);
    formData.append('config', 'Hello world!'); // TODO: implement getConfig()
    fetch('/inference', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        displayResultTour(data);
        var graph = JSON.parse(data.graph);
        Plotly.newPlot('resultTourPlotDisplay', graph.data, graph.layout);
        // displayPlot(data.plot_url, 'resultTourPlotDisplay');
    })
    .catch(error => {
        console.error('Error:', error);
        // hideLoading();
    });
}

function displayResultTour(data) {
    var container = document.getElementById('resultTourDisplay');
    let content = 'x, y (The sorted coordinates will be display)<br>';

    for (let i=0; i < data.tour.length; i++) {
        let x = data.sorted_x[i];
        let y = data.sorted_y[i];
        if (Number.isInteger(x)) {
            x = parseInt(x);
        }
        else {
            x = x.toFixed(3);
        }
        if (Number.isInteger(y)){
            y = parseInt(y);
        }
        else {
            y = data.sorted_y[i].toFixed(3);
        }
        
        content += `<b>${data.tour[i]}</b>: (${x}, ${y})\t`;
    }
    container.innerHTML = content;
}

function displayPlot(plot_url, container_id) {
    var container = document.getElementById(container_id);
    container.src = "data:image/png;base64," + plot_url;
}

function makeModelSelectOptions() {
    fetch('/model-options', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        var select = document.getElementById('modelSelect');
        for (const model of data.model_options) {
            if (model == 'bresson-tsp100') {  // FIXME: bresson-tsp100 key matching failure
                continue;
            }
            var option = document.createElement('option');
            option.value = model;
            option.text = model;
            select.appendChild(option);
        }
    })
}

document.addEventListener('DOMContentLoaded', function() {
    makeModelSelectOptions();
    hideLoading();
});
// window.onload = makeModelSelectOptions;
// window.onload = hideLoading;