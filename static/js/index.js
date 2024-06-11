let globalCoordinates = {'x': [], 'y': []};
function resetGlobalCoordinates() {
    globalCoordinates = {'x': [], 'y': []};
}

function changeInputTypeDisplay() {
    const inputType = document.getElementById('inputTypeSelect').value;
    if (inputType == 'inputTypeFile') {
        document.getElementById('inputTypeFileDisplay').style.display = 'block';
        document.getElementById('inputTypeTextDisplay').style.display = 'none';
        document.getElementById('inputTypeClickDisplay').style.display = 'none';

        document.getElementById('textInput').value = '';
    }
    else if (inputType == 'inputTypeText') {
        document.getElementById('inputTypeFileDisplay').style.display = 'none';
        document.getElementById('inputTypeTextDisplay').style.display = 'block';
        document.getElementById('inputTypeClickDisplay').style.display = 'none';
        
        document.getElementById('fileInput').value = '';
    }
    else if (inputType == 'inputTypeClick') {
        document.getElementById('inputTypeFileDisplay').style.display = 'none';
        document.getElementById('inputTypeTextDisplay').style.display = 'none';
        document.getElementById('inputTypeClickDisplay').style.display = 'block';

        document.getElementById('fileInput').value = '';
        document.getElementById('textInput').value = '';
    }
    else if (inputType == '') {
        document.getElementById('inputTypeFileDisplay').style.display = 'none';
        document.getElementById('inputTypeTextDisplay').style.display = 'none';
        document.getElementById('inputTypeClickDisplay').style.display = 'none';

        document.getElementById('fileInput').value = '';
        document.getElementById('textInput').value = '';
    }
    resetGlobalCoordinates();
    document.getElementById('inputCoordinatesDisplay').innerText = 'The input coordinates will be displayed here...'
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
        var output = document.getElementById('inputCoordinatesDisplay');
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

        if (isValidCoordinates()) {
            activateInferenceButton();
        }
        else {
            deactiveInferenceButton();
        }
    };
    reader.readAsText(file);
}

function onTextTyped() { 
    const inputField = document.getElementById('textInput');
    let value = inputField.value;
    
    let validatedValue = value
                        .replace(/[^0-9().,-\s]/g, '')
                        .replace(/\({2,}/g, '(')
                        .replace(/\){2,}/g, ')')
                        .replace(/\,{2,}/g, ',')
                        .replace(/\.{2,}/g, ',');
    inputField.value = validatedValue;

    validatedValue = validatedValue
                    .replace(/\s+/g, '')
                    .replace(/[()]/g, '');

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
    document.getElementById('inputCoordinatesDisplay').innerHTML = targetValue;
    
    resetGlobalCoordinates();
    globalCoordinates.x = xs;
    globalCoordinates.y = ys;
    drawInputCoordinates();

    if (isValidCoordinates()) {
        deactiveInferenceButton();
    }
    else {
        activateInferenceButton();
    }
}

function preventEnterKey(event) {
    if (event.key === "Enter") {
        event.preventDefault();
    }
}

function drawInputCoordinates() {
    let trace = {
        x: globalCoordinates.x,
        y: globalCoordinates.y,
        mode: 'markers',
        marker: {
            size: 10,
            color: 'red'
        },
        type: 'scatter'
    }
    let data = [trace];

    let layout = {title: `Input coordinates for ${globalCoordinates.x.length} cities`};
    Plotly.newPlot('coordinatesPlotDisplay', data, layout);
}

async function getConfig(model_name) {
    const response = await fetch('/request-config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model_name: model_name,
        }),
    })
    const data = await response.json();
    return data;
}

async function getConfigFromHTML(model_name) {
    const data = await getConfig(model_name);
    for (const key in data.config) {
        if (Array.isArray(data.config[key])) {
            const select = document.getElementById(key);
            data.config[key] = select.value;
        }
    }
    return data;
}

// onchange of select # modelSelect
async function sendOption(model_name) {
    if (model_name == '') {
        resetOptionMenu();
        deactiveInferenceButton();
        return;
    }
    try {
        let data = await getConfig(model_name);
        createOptionMenu(data);
        checkMinCoordinates(data);
    } catch(error) {
        console.error('Error:', error);
    }
}

function resetOptionMenu() {
    var container = document.getElementById('modelDisplayName');
    container.innerHTML = '<b>- Model Name: </b>';

    container = document.getElementById('modelDisplayDesc');
    container.innerHTML = '<b>- Model Description: </b>';

    container = document.getElementById('modelDisplayConfigs');
    container.innerHTML = '<b>- Model configurations: </b><br>';

}
function createOptionMenu(data) {
    const model_full_name = document.createElement('label');
    model_full_name.textContent = data.full_name;
    var container = document.getElementById('modelDisplayName')
    container.innerHTML = '<b>- Model Name: </b>';
    container.appendChild(model_full_name);

    const model_description = document.createElement('label');
    model_description.innerHTML = data.description;
    var container = document.getElementById('modelDisplayDesc');
    container.innerHTML = '<b>- Model Description: </b>';
    container.appendChild(model_description);

    var container = document.getElementById('modelDisplayConfigs');
    container.innerHTML = '<b>- Model configurations: </b><br>';
    for (const key in data.config) {
        if (data.config.hasOwnProperty(key)) {
            const label = document.createElement('label');
            label.textContent = key + ": ";
            label.classList.add('inline-label-select');

            const inlineContainer = document.createElement('div');
            inlineContainer.classList.add('inline-container');

            // IF config value is array (selectable)
            if (Array.isArray(data.config[key]) && data.config[key][0] != null) {
                const select = document.createElement('select'); 
                select.id = key;
                for (const value of data.config[key]) {
                    const option = document.createElement('option');
                    option.value = value;
                    option.text = value;
                    select.appendChild(option);
                }
                inlineContainer.appendChild(label);
                inlineContainer.appendChild(select);
                container.appendChild(inlineContainer);
                container.appendChild(document.createElement('br'));
            }
            else if (Array.isArray(data.config[key]) && data.config[key][0] == null) {
                // IF config value starts with null and is an array (inputtable)
                const input = document.createElement('input');
                input.id = key;
                input.value = data.config[key][1];
                input.type = data.config[key][2];
                input.min = data.config[key][3];
                input.required = true;

                inlineContainer.appendChild(label);
                inlineContainer.appendChild(input);
                container.appendChild(inlineContainer);
                container.appendChild(document.createElement('br'));
            }
            // else if (data.config[key] == null) {
            //     // IF config value is null (selectable but options needs to be imported from server)
            //     fetch('/request-config-options', {
            //         method: 'POST',
            //         headers: {
            //             'Content-Type': 'application/json',
            //         },
            //         body: JSON.stringify({
            //             model_name: data.model_name,
            //             config_key : key,
            //         })
            //     })
            //     .then(response => response.json())
            //     .then(data => {
            //         const select = document.createElement('select');
            //         for (const value of data.config_options) {
            //             alert(value);
            //             const option = document.createElement('option');
            //             option.value = value;
            //             option.text = value;
            //             select.appendChild(option);
            //         }
            //         container.appendChild(label);
            //         container.appendChild(select);
            //         container.appendChild(document.createElement('br'));
            //     })
            // }
            else {
                // IF cofig value is a fixed value (not selectable)
                const value_label = document.createElement('label');
                value_label.textContent = data.config[key];

                // label.textContent += data.config[key];
                inlineContainer.appendChild(label);
                inlineContainer.appendChild(value_label);
                container.appendChild(inlineContainer);
                container.appendChild(document.createElement('br'));
            }
        }
    }
}
function activateInferenceButton() {
    const inferenceBtn = document.getElementById('inferenceBtn');
    inferenceBtn.disabled = false;
    inferenceBtn.style.opacity = 1;
    inferenceBtn.style.pointerEvents = 'auto';
}

function deactiveInferenceButton() {
    const inferenceBtn = document.getElementById('inferenceBtn');
    inferenceBtn.disabled = true;
    inferenceBtn.style.opacity = 0.5;
    inferenceBtn.style.pointerEvents = 'none';
}
function isValidCoordinates() {
    if (globalCoordinates.x.length == 0 || globalCoordinates.y.length == 0 ||
        globalCoordinates.x.length != globalCoordinates.y.length) {
        return false;
    }
    return true;

}
function checkMinCoordinates(data) {
    let numCoordinates = Math.min(globalCoordinates.x.length,
                                  globalCoordinates.y.length);
    var min_coordinates;
    if ('min_coordinates' in data) {
        min_coordinates = data.min_coordinates;
    }
    else {
        min_coordinates = 0;
    }
    
    if (numCoordinates >= min_coordinates) {
        activateInferenceButton();
    }
    else {
        deactiveInferenceButton();
    }
}

function showLoading() {
    document.getElementById('overlay').style.display = 'flex';  
}

function hideLoading() {
    document.getElementById('overlay').style.display = 'none'; 
}

async function inference() {

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
    var modelConfig = await getConfigFromHTML(modelSelect.value);
    formData.append('coordinates', JSON.stringify(globalCoordinates));
    formData.append('model_name', modelSelect.value);
    formData.append('config', JSON.stringify(modelConfig.config));
    fetch('/inference', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.status == 'error') {
            alert(data.message);
            return;
        }
        displayResultTour(data);
        var graph = JSON.parse(data.graph);
        Plotly.newPlot('resultTourPlotDisplay', graph.data, graph.layout);
        // displayPlot(data.plot_url, 'resultTourPlotDisplay');
    })
}

function displayResultTour(data) {
    var container = document.getElementById('resultTourDisplay');
    let content = 'index: x, y (sorted)<br>';

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
    deactiveInferenceButton();
});