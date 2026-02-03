// ============================================================================
// CONSTANTS & REFERENCE DATA
// ============================================================================

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const CEFR_COLORS = {
    'A1': '#4CAF50',  // Green - beginner
    'A2': '#8BC34A',  // Light Green
    'B1': '#FFC107',  // Amber - intermediate
    'B2': '#FF9800',  // Orange
    'C1': '#FF5722',  // Deep Orange - advanced
    'C2': '#9C27B0',  // Purple - mastery
    'N/A': '#9E9E9E'  // Grey - no data
};

const VAD_REFERENCE_DATA = [
    { label: 'A1', valence: 0.1998, arousal: -0.0996, dominance: 0.0334 },
    { label: 'A2', valence: 0.1750, arousal: -0.0701, dominance: 0.0366 },
    { label: 'B1', valence: 0.1756, arousal: -0.0611, dominance: 0.0713 },
    { label: 'B2', valence: 0.1599, arousal: -0.0441, dominance: 0.0905 },
    { label: 'C1', valence: 0.1446, arousal: -0.0474, dominance: 0.0989 },
    { label: 'C2', valence: 0.1307, arousal: -0.0531, dominance: 0.1101 }
];

const AOA_REFERENCE_DATA = [
    { label: 'A1', value: 4.7689 },
    { label: 'A2', value: 5.0443 },
    { label: 'B1', value: 5.9510 },
    { label: 'B2', value: 6.4135 },
    { label: 'C1', value: 6.7891 },
    { label: 'C2', value: 7.4770 }
];

const CONC_REFERENCE_DATA = [
    { label: 'A1', value: 3.1878 },
    { label: 'A2', value: 3.2101 },
    { label: 'B1', value: 3.2771 },
    { label: 'B2', value: 3.2745 },
    { label: 'C1', value: 3.2851 },
    { label: 'C2', value: 3.2945 }
];

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

class MetricsState {
    constructor() {
        this.raw = {
            mean_aoa: 0,
            mean_conc: 0,
            mean_valence: 0,
            mean_arousal: 0,
            mean_dominance: 0
        };
        this.classifications = {
            aoa: 'N/A',
            concreteness: 'N/A',
            vad: {
                valence: 'N/A',
                arousal: 'N/A',
                dominance: 'N/A',
                composite: 'N/A'
            },
            overall: 'N/A'
        };
    }

    updateRaw(data) {
        this.raw = {
            mean_aoa: data.mean_aoa,
            mean_conc: data.mean_conc,
            mean_valence: data.mean_valence,
            mean_arousal: data.mean_arousal,
            mean_dominance: data.mean_dominance
        };
    }

    updateClassifications(classifications) {
        this.classifications = classifications;
    }

    getRaw() {
        return { ...this.raw };
    }

    getClassifications() {
        return JSON.parse(JSON.stringify(this.classifications));
    }
}

const metricsState = new MetricsState();

// ============================================================================
// CLASSIFICATION UTILITIES
// ============================================================================

class CEFRClassifier {
    /**
     * Classifies a single metric value against CEFR reference data
     */
    static classifySingleMetric(inputValue, referenceData, valueKey = 'value') {
        if (inputValue === null || inputValue === undefined || isNaN(inputValue)) {
            return 'N/A';
        }

        let closestLevel = referenceData[0].label;
        let smallestDiff = Math.abs(inputValue - referenceData[0][valueKey]);

        for (const reference of referenceData) {
            const diff = Math.abs(inputValue - reference[valueKey]);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestLevel = reference.label;
            }
        }

        return closestLevel;
    }

    /**
     * Classifies VAD (Valence, Arousal, Dominance) metrics
     */
    static classifyVAD(valence, arousal, dominance) {
        const valenceLevel = this.classifySingleMetric(
            valence,
            VAD_REFERENCE_DATA,
            'valence'
        );

        const arousalLevel = this.classifySingleMetric(
            arousal,
            VAD_REFERENCE_DATA,
            'arousal'
        );

        const dominanceLevel = this.classifySingleMetric(
            dominance,
            VAD_REFERENCE_DATA,
            'dominance'
        );

        const composite = this.calculateCompositeLevel([
            valenceLevel,
            arousalLevel,
            dominanceLevel
        ]);

        return {
            valence: valenceLevel,
            arousal: arousalLevel,
            dominance: dominanceLevel,
            composite
        };
    }

    /**
     * Classifies all metrics and returns CEFR levels
     */
    static classifyAll(metrics) {
        const vadClassification = this.classifyVAD(
            metrics.mean_valence,
            metrics.mean_arousal,
            metrics.mean_dominance
        );

        const aoaLevel = this.classifySingleMetric(
            metrics.mean_aoa,
            AOA_REFERENCE_DATA
        );

        const concLevel = this.classifySingleMetric(
            metrics.mean_conc,
            CONC_REFERENCE_DATA
        );

        return {
            aoa: aoaLevel,
            concreteness: concLevel,
            vad: vadClassification,
            overall: this.calculateCompositeLevel([
                aoaLevel,
                concLevel,
                vadClassification.composite
            ])
        };
    }

    /**
     * Calculates composite CEFR level from multiple classifications
     */
    static calculateCompositeLevel(levels) {
        const levelToNum = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6, 'N/A': 0 };
        const numToLevel = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2' };

        const validLevels = levels.filter(level => level !== 'N/A');
        if (validLevels.length === 0) return 'N/A';

        const avgNum = validLevels.reduce(
            (sum, level) => sum + levelToNum[level],
            0
        ) / validLevels.length;

        return numToLevel[Math.round(avgNum)] || 'N/A';
    }
}

// ============================================================================
// 3D GRAPH MANAGEMENT
// ============================================================================

class Graph3DManager {
    constructor() {
        this.graph = null;
        this.rotationInterval = null;
    }

    /**
     * Initializes the 3D graph with initial values
     */
    initialize(container, valence = 0, arousal = 0, dominance = 0) {
        const data = this.createDataSet(valence, arousal, dominance);
        const options = this.getGraphOptions();

        this.graph = new vis.Graph3d(container, data, options);
        this.startRotation();
    }

    /**
     * Creates a vis.js DataSet with VAD values
     */
    createDataSet(valence, arousal, dominance) {
        const data = new vis.DataSet();
        const points = [
            { x: valence, y: 0, z: 0, opacity: 0.5 },
            { x: 0, y: arousal, z: 0, opacity: 0.5 },
            { x: 0, y: 0, z: dominance, opacity: 0.5 },
            { x: valence, y: arousal, z: dominance, opacity: 1.0 }
        ];

        points.forEach(point => {
            data.add({
                x: point.x,
                y: point.y,
                z: point.z,
                style: {
                    fill: '#FF5733',
                    stroke: '#990000',
                    strokeWidth: 2,
                    opacity: point.opacity
                }
            });
        });

        return data;
    }

    /**
     * Returns graph configuration options
     */
    getGraphOptions() {
        return {
            width: '500px',
            height: '200px',
            style: 'dot-line',
            backgroundColor: '#F0F0F0',
            axisColor: '#AABBCC',
            showXAxis: true,
            showYAxis: true,
            showZAxis: true,
            showPerspective: true,
            showGrid: true,
            showShadow: false,
            keepAspectRatio: true,
            verticalRatio: 0.6,
            dotSizeRatio: 0.02,
            rotateAxisLabels: true,
            xLabel: 'Valence',
            yLabel: 'Arousal',
            zLabel: 'Dominance',
            xMin: -1,
            xMax: 1,
            yMin: -1,
            yMax: 1,
            zMin: -1,
            zMax: 1,
            xStep: 0.5,
            yStep: 0.5,
            zStep: 0.5
        };
    }

    /**
     * Updates the graph with new VAD values
     */
    update(valence, arousal, dominance) {
        if (!this.graph) return;

        const data = this.createDataSet(valence, arousal, dominance);
        this.graph.setData(data);
    }

    /**
     * Starts the rotation animation
     */
    startRotation() {
        setTimeout(() => {
            let angle = 1.0;

            this.rotationInterval = setInterval(() => {
                angle += 0.01;
                if (angle >= 2 * Math.PI) {
                    angle = 0;
                }

                if (this.graph) {
                    this.graph.setCameraPosition({
                        horizontal: angle,
                        vertical: 0.5,
                        distance: 2
                    });
                }
            }, 100);
        }, 1000);
    }

    /**
     * Stops the rotation animation
     */
    stopRotation() {
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
            this.rotationInterval = null;
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.stopRotation();
        this.graph = null;
    }
}

const graphManager = new Graph3DManager();

// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================

class UIUpdater {
    /**
     * Updates all UI elements with new metrics data
     */
    static updateAll(rawData, classifications) {
        this.updateAOA(rawData.mean_aoa, classifications.aoa);
        this.updateConcreteness(rawData.mean_conc, classifications.concreteness);
        this.updateVAD(rawData, classifications.vad);
        this.updateGraph(rawData);
        this.logClassifications(classifications);
    }

    /**
     * Updates Age of Acquisition display
     */
    static updateAOA(value, level) {
        const element = document.querySelector('#aoa-value p');
        if (element) {
            element.textContent = `${this.formatNumber(value)} (${level})`;
        }
    }

    /**
     * Updates Concreteness display
     */
    static updateConcreteness(value, level) {
        const element = document.querySelector('#conc-value p');
        if (element) {
            element.textContent = `${this.formatNumber(value)} (${level})`;
        }
    }

    /**
     * Updates VAD (Valence, Arousal, Dominance) displays
     */
    static updateVAD(rawData, vadClassifications) {
        const elements = document.querySelectorAll('#vad-values p');

        if (elements.length >= 3) {
            elements[0].textContent = `${this.formatNumber(rawData.mean_valence)} (${vadClassifications.valence})`;
            elements[1].textContent = `${this.formatNumber(rawData.mean_arousal)} (${vadClassifications.arousal})`;
            elements[2].textContent = `${this.formatNumber(rawData.mean_dominance)} (${vadClassifications.dominance})`;
        }
    }

    /**
     * Updates the 3D graph
     */
    static updateGraph(rawData) {
        graphManager.update(
            parseFloat(rawData.mean_valence) || 0,
            parseFloat(rawData.mean_arousal) || 0,
            parseFloat(rawData.mean_dominance) || 0
        );
    }

    /**
     * Logs classifications to console
     */
    static logClassifications(classifications) {
        console.log('Overall CEFR Level:', classifications.overall);
        console.log('All classifications:', classifications);
    }

    /**
     * Formats a number for display
     */
    static formatNumber(value, decimals = 4) {
        if (value === null || value === undefined || isNaN(value)) {
            return 'N/A';
        }
        return parseFloat(value).toFixed(decimals);
    }
}

// ============================================================================
// API COMMUNICATION
// ============================================================================

class MetricsAPI {
    /**
     * Fetches metrics from the server
     */
    static async fetchMetrics(text) {
        try {
            const response = await fetch('/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `text_input=${encodeURIComponent(text)}`
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching metrics:', error);
            throw error;
        }
    }

    /**
     * Processes the fetched data and updates UI
     */
    static async processAndUpdate(text) {
        try {
            const data = await this.fetchMetrics(text);

            // Update state
            metricsState.updateRaw(data);
            const classifications = CEFRClassifier.classifyAll(data);
            metricsState.updateClassifications(classifications);

            // Update UI
            UIUpdater.updateAll(data, classifications);

            return { data, classifications };
        } catch (error) {
            console.error('Error processing metrics:', error);
            return null;
        }
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a debounced function
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Gets CEFR color for a given level
 */
function getCEFRColor(level) {
    return CEFR_COLORS[level] || CEFR_COLORS['N/A'];
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initializes the 3D visualization on page load
 */
function drawVisualization() {
    const container = document.getElementById('mygraph');
    if (!container) {
        console.error('Graph container not found');
        return;
    }

    // Get initial values from the template
    const mean_valence = parseFloat(window.mean_valence) || 0;
    const mean_arousal = parseFloat(window.mean_arousal) || 0;
    const mean_dominance = parseFloat(window.mean_dominance) || 0;

    graphManager.initialize(container, mean_valence, mean_arousal, mean_dominance);
}

/**
 * Sets up event listeners
 */
function setupEventListeners() {
    const textInput = document.getElementById('text_input');
    if (!textInput) {
        console.error('Text input element not found');
        return;
    }

    // Debounced input handler (300ms delay)
    const debouncedHandler = debounce((event) => {
        const text = event.target.value.trim();
        if (text) {
            MetricsAPI.processAndUpdate(text);
        }
    }, 300);

    textInput.addEventListener('input', debouncedHandler);
}

/**
 * Main initialization function
 */
function initialize() {
    drawVisualization();
    setupEventListeners();
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Initialize on page load (for graph rendering)
window.addEventListener('load', drawVisualization);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    graphManager.destroy();
});
