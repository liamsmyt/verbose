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

previousText = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident"


@app.route('/')
def index():
    return render_template('index.html', mean_aoa=0, mean_conc=0)

@app.route('/', methods=['POST'])
def process():

    text_input = request.form['text_input']  # Get the text from the form
    removed, added = newWords(text_input)
    if(removed == [] and added == []):
        conc_dict = {"mean": 44, "sd": 63}
    else:
        calculate_added_words(added, conc_df, "conc")  # Process the text
        conc_dict = calculate_removed_words(removed, conc_df, "conc")  # Process the text


    mean_aoa = conc_dict['mean']
    sd_aoa = conc_dict['sd']

    #conc_dict = calculate_mean(text_input, conc_df)
    mean_conc = 0
    sd_conc = 0

    return jsonify({
            'mean_aoa': mean_aoa,
            'sd_aoa': sd_aoa,
            'mean_conc': mean_conc,
            'sd_conc': sd_conc
        })

    return render_template('index.html', mean_aoa=mean_aoa, mean_conc=mean_conc, sd_aoa=sd_aoa, sd_conc=sd_conc)

if __name__ == '__main__':
    app.run(debug=True)
