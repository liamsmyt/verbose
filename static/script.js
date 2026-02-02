// Define an array of values
let aoa_bands = [10, 20, 30, 40, 50];

// Get the <ul> element by its ID
let valueList = document.getElementById('value-list');

// Loop through the array and create list items
valuesArray.forEach(value => {
    // Create a new list item
    let listItem = document.createElement('li');
    listItem.textContent = value; // Set the text content to the current value
    valueList.appendChild(listItem); // Append the list item to the <ul>
});
