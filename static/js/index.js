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
    
}