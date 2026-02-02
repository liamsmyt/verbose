from flask import Flask, request, render_template, jsonify
from text_processing import load_aoa_data, load_conc_data, calculate_mean, newWords, calculate_added_words, calculate_removed_words
from collections import Counter

app = Flask(__name__)

# Load AOA Data
AOA_CSV = "datasets/kuperman_aoa.csv"  # Path to your AOA data
aoa_df = load_aoa_data(AOA_CSV)

# Load Conc data
CONC_CSV = "datasets/concreteness.csv"
conc_df = load_conc_data(CONC_CSV)

aoa_dict = {"mean": 0, "sd": 0}
conc_dict = {"mean": 0, "sd": 0}


@app.route('/')
def index():
    return render_template('index.html', mean_aoa=0, mean_conc=0)

@app.route('/', methods=['POST'])
def process():
    global aoa_dict
    global conc_dict

    text_input = request.form['text_input']  # Get the text from the form
    removed, added = newWords(text_input)
    if(not(removed == [] and added == [])):
        calculate_added_words(added, conc_df, "conc")  # Process the text
        calculate_added_words(added, aoa_df, "aoa")  # Process the text
        conc_dict = calculate_removed_words(removed, conc_df, "conc")  # Process the text
        aoa_dict = calculate_removed_words(removed, aoa_df, "aoa")  # Process the text



    mean_aoa = aoa_dict['mean']
    sd_aoa = aoa_dict['sd']

    mean_conc = conc_dict['mean']
    sd_conc = conc_dict['sd']

    return jsonify({
            'mean_aoa': mean_aoa,
            'sd_aoa': sd_aoa,
            'mean_conc': mean_conc,
            'sd_conc': sd_conc
        })

    return render_template('index.html', mean_aoa=mean_aoa, mean_conc=mean_conc, sd_aoa=sd_aoa, sd_conc=sd_conc)

if __name__ == '__main__':
    app.run(debug=True)
