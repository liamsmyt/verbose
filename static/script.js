document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('text_input');

    // Send request on every character typed
    textInput.addEventListener('input', function() {
        const text = textInput.value;

        // Send POST request
        fetch('/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'text_input=' + encodeURIComponent(text)
        })
        .then(response => response.json())
        .then(data => {
            // Update the displayed results
            document.querySelector('.ms-4 p:nth-child(1)').textContent = 'mean = ' + data.mean_aoa;
            document.querySelector('.ms-4 p:nth-child(2)').textContent = 'average sd = ' + data.sd_aoa;
            // Update concreteness values
            document.querySelectorAll('.ms-4')[1].querySelector('p:nth-child(1)').textContent = 'mean = ' + data.mean_conc;
            document.querySelectorAll('.ms-4')[1].querySelector('p:nth-child(2)').textContent = 'average sd = ' + data.sd_conc;
        })
        .catch(error => console.error('Error:', error));
    });
});


let timeout;
textInput.addEventListener('input', function() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        // Send request here (after 300ms of no typing)
        const text = textInput.value;
        // ... rest of fetch code
    }, 300);
});
