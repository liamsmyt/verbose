// CEFR graded bands
const vad_data = [
    { label: 'A1', value2: 0.1998, value3: -0.0996, value4: 0.0334 },
    { label: 'A2', value2: 0.1750, value3: -0.0701, value4: 0.0366 },
    { label: 'B1', value2: 0.1756, value3: -0.0611, value4: 0.0713 },
    { label: 'B2', value2: 0.1599, value3: -0.0441, value4: 0.0905 },
    { label: 'C1', value2: 0.1446, value3: -0.0474, value4: 0.0989 },
    { label: 'C2', value2: 0.1307, value3: -0.0531, value4: 0.1101 }
];

const aoa_data = [
    { label: 'A1', value: 4.7689 },
    { label: 'A2', value: 5.0443 },
    { label: 'B1', value: 5.9510 },
    { label: 'B2', value: 6.4135 },
    { label: 'C1', value: 6.7891 },
    { label: 'C2', value: 7.4770 }
];

const conc_data = [
    { label: 'A1', value: 3.1878 },
    { label: 'A2', value: 3.2101 },
    { label: 'B1', value: 3.2771 },
    { label: 'B2', value: 3.2745 },
    { label: 'C1', value: 3.2851 },
    { label: 'C2', value: 3.2945 }
];

let currentMetrics = {
    raw: {
        mean_aoa: 0,
        mean_conc: 0,
        mean_valence: 0,
        mean_arousal: 0,
        mean_dominance: 0
    },
    classifications: {
        aoa: 'N/A',
        concreteness: 'N/A',
        vad: {
            valence: 'N/A',
            arousal: 'N/A',
            dominance: 'N/A',
            composite: 'N/A'
        },
        overall: 'N/A'
    }
};

const cefrColours = {
    // From beginner (green) to advanced (red/purple)
    'A1': '#4CAF50',  // Green - beginner
    'A2': '#8BC34A',  // Light Green
    'B1': '#FFC107',  // Amber - intermediate
    'B2': '#FF9800',  // Orange
    'C1': '#FF5722',  // Deep Orange - advanced
    'C2': '#9C27B0',  // Purple - mastery
    'N/A': '#9E9E9E'  // Grey - no data
};

function getCEFRColour(level) {
    return cefrColours[level] || cefrColours['N/A'];
}

/**
 * Classifies a single metric value against CEFR bands
 * @param {number} inputValue - The value to classify
 * @param {Array} referenceData - Array of CEFR reference objects with 'label' and 'value' properties
 * @param {boolean} ascending - Whether higher values indicate higher CEFR levels (default: true)
 * @returns {string} CEFR level (A1-C2)
 */
function classifySingleMetric(inputValue, referenceData, ascending = true) {
    if (inputValue === null || inputValue === undefined || isNaN(inputValue)) {
        return 'N/A';
    }

    // Find the closest CEFR level
    let closestLevel = referenceData[0].label;
    console.log(referenceData[0].label)
    let smallestDiff = Math.abs(inputValue - referenceData[0].value);

    for (let i = 1; i < referenceData.length; i++) {
        const diff = Math.abs(inputValue - referenceData[i].value);
        if (diff < smallestDiff) {
            smallestDiff = diff;
            closestLevel = referenceData[i].label;
        }
    }

    return closestLevel;
}

/**
 * Classifies VAD (Valence, Arousal, Dominance) metrics against CEFR bands
 * @param {number} valence - Valence value (value2 in vad_data)
 * @param {number} arousal - Arousal value (value3 in vad_data)
 * @param {number} dominance - Dominance value (value4 in vad_data)
 * @returns {Object} Object containing individual classifications and composite level
 */
function classifyVAD(valence, arousal, dominance) {
    const valenceLevel = classifySingleMetric(valence,
        vad_data.map(d => ({ label: d.label, value: d.value2 })), false);

    const arousalLevel = classifySingleMetric(arousal,
        vad_data.map(d => ({ label: d.label, value: d.value3 })), true);

    const dominanceLevel = classifySingleMetric(dominance,
        vad_data.map(d => ({ label: d.label, value: d.value4 })), true);

    // Calculate composite level (average of the three)
    const levelToNum = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 };
    const numToLevel = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2' };

    const avgLevel = Math.round(
        (levelToNum[valenceLevel] + levelToNum[arousalLevel] + levelToNum[dominanceLevel]) / 3
    );

    return {
        valence: valenceLevel,
        arousal: arousalLevel,
        dominance: dominanceLevel,
        composite: numToLevel[avgLevel]
    };
}

/**
 * Main classification function - classifies all metrics
 * @param {Object} metrics - Object containing all metric values
 * @returns {Object} CEFR classifications for each metric type
 */
function classifyCEFR(metrics) {
    const {
        mean_aoa,
        mean_conc,
        mean_valence,
        mean_arousal,
        mean_dominance
    } = metrics;

    const vadClassification = classifyVAD(mean_valence, mean_arousal, mean_dominance);

    return {
        aoa: classifySingleMetric(mean_aoa, aoa_data, true),
        concreteness: classifySingleMetric(mean_conc, conc_data, true),
        vad: vadClassification,
        // Overall level based on all metrics (could be weighted differently)
        overall: getOverallLevel([
            classifySingleMetric(mean_aoa, aoa_data, true),
            classifySingleMetric(mean_conc, conc_data, true),
            vadClassification.composite
        ])
    };
}


/**
 * Updates the 3D graph with new VAD values
 */
function updateGraph(valence, arousal, dominance) {
    if (window.graph3d && window.graph3d.setData) {
        const data = new vis.DataSet();
        const list = [
            [valence, 0, 0],
            [0, arousal, 0],
            [0, 0, dominance], [valence, arousal, dominance]
        ];

        // Add data points with individual colors
        for (let i = 0; i < list.length; i++) {
            data.add({
                x: list[i][0],
                y: list[i][1],
                z: list[i][2],
                style: i
            });
        }

        window.graph3d.setData(data);
    }
}

/**
 * Calculates overall CEFR level from multiple metric classifications
 * @param {Array<string>} levels - Array of CEFR level strings
 * @returns {string} Overall CEFR level
 */
function getOverallLevel(levels) {
    const levelToNum = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6, 'N/A': 0 };
    const numToLevel = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2' };

    const validLevels = levels.filter(l => l !== 'N/A');
    if (validLevels.length === 0) return 'N/A';

    const avgNum = validLevels.reduce((sum, level) => sum + levelToNum[level], 0) / validLevels.length;
    return numToLevel[Math.round(avgNum)];
}

// Updated event listener with CEFR classification
document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('text_input');

    textInput.addEventListener('input', function() {
        const text = textInput.value;

        fetch('/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'text_input=' + encodeURIComponent(text)
        })
        .then(response => response.json())
        .then(data => {
            // Classify the metrics
            // Store raw metrics
                currentMetrics.raw = {
                    mean_aoa: data.mean_aoa,
                    mean_conc: data.mean_conc,
                    mean_valence: data.mean_valence,
                    mean_arousal: data.mean_arousal,
                    mean_dominance: data.mean_dominance
                };


            const cefrLevels = classifyCEFR(data);

            currentMetrics.classifications = cefrLevels;

            // Update the displayed results with values and classifications
            document.querySelector('.ms-4 p:nth-child(1)').textContent =
                `mean = ${data.mean_aoa} (${cefrLevels.aoa})`;

            document.querySelectorAll('.ms-4')[1].querySelector('p:nth-child(1)').textContent =
                `mean = ${data.mean_conc} (${cefrLevels.concreteness})`;

            document.querySelectorAll('.ms-4')[2].querySelector('p:nth-child(1)').textContent =
                `mean valence = ${data.mean_valence} (${cefrLevels.vad.valence})`;
            document.querySelectorAll('.ms-4')[2].querySelector('p:nth-child(2)').textContent =
                `mean arousal = ${data.mean_arousal} (${cefrLevels.vad.arousal})`;
            document.querySelectorAll('.ms-4')[2].querySelector('p:nth-child(3)').textContent =
                `mean dominance = ${data.mean_dominance} (${cefrLevels.vad.dominance})`;


                updateGraph(
                        parseFloat(data.mean_valence) || 0,
                        parseFloat(data.mean_arousal) || 0,
                        parseFloat(data.mean_dominance) || 0
                    );


            // Optionally display overall CEFR lezvel
            console.log('Overall CEFR Level:', cefrLevels.overall);
            console.log('All classifications:', cefrLevels);
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
