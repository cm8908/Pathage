let clickedCoordinates = [];

function handleClick(button, row, col) {
  button.classList.toggle('active');
  const index = clickedCoordinates.findIndex(coord => coord.row === row && coord.col === col);
  if (button.classList.contains('active')) {
    if (index === -1) {
      clickedCoordinates.push({row: row, col: col});
    }
  } else {
    if (index !== -1) {
      clickedCoordinates.splice(index, 1);
    }
  }
  updateCoordinatesDisplay();
  sendCoordinatesToServer();
}

function createGrid(n) {
  if (!n) return;
  const container = document.getElementById('gridContainer');
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${n}, 120px)`;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const item = document.createElement('div');
      item.className = 'grid-item';
      const button = document.createElement('button');
      button.onclick = function() { handleClick(this, i, j); };
      button.textContent = `●`;
      item.appendChild(button);
      container.appendChild(item);
    }
  }
}

function updateCoordinatesDisplay() {
  const display = document.getElementById('coordinatesDisplay');
  display.innerHTML = 'Clicked Coordinates:<br>' + clickedCoordinates.map(coord => `(${coord.row}, ${coord.col})`).join('<br>');
}

function sendCoordinatesToServer() {
  fetch('/submit-coordinates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({coordinates: clickedCoordinates})
  })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
}
