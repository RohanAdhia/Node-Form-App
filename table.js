const table = document.getElementById('userTable');
const header = table.createTHead();
const row = header.insertRow();
row.insertCell().innerHTML = 'Name';
row.insertCell().innerHTML = 'Email';
row.insertCell().innerHTML = 'Age';
row.insertCell().innerHTML = 'Gender';

fetch('users.csv')
  .then(response => response.text())
  .then(data => {
    const rows = data.split('\n');
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(',');
      if (cols.length === 4) {
        const row = table.insertRow();
        row.insertCell().innerHTML = cols[0];
        row.insertCell().innerHTML = cols[1];
        row.insertCell().innerHTML = cols[2];
        row.insertCell().innerHTML = cols[3];
      }
    }
  })
  .catch(error => console.log(error));
