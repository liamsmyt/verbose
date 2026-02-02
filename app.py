from flask import Flask, request, render_template
from text_processing import load_aoa_data, load_conc_data, calculate_mean
from collections import Counter

app = Flask(__name__)

# Load AOA Data
AOA_CSV = "datasets/kuperman_aoa.csv"  # Path to your AOA data
aoa_df = load_aoa_data(AOA_CSV)

# Load Conc data
CONC_CSV = "datasets/concreteness.csv"
conc_df = load_conc_data(CONC_CSV)


wordlist = Counter(["six", "seven"])

@app.route('/')
def index():
    print(wordlist)
    return render_template('index.html', mean_aoa=0, mean_conc=0)

@app.route('/', methods=['POST'])
def process():



    text_input = request.form['text_input']  # Get the text from the form
    aoa_dict = calculate_mean(text_input, aoa_df)  # Process the text
    mean_aoa = aoa_dict['mean']
    sd_aoa = aoa_dict['sd']

    conc_dict = calculate_mean(text_input, conc_df)
    mean_conc = conc_dict['mean']
    sd_conc = conc_dict['sd']

    return render_template('index.html', mean_aoa=mean_aoa, mean_conc=mean_conc, sd_aoa=sd_aoa, sd_conc=sd_conc)

if __name__ == '__main__':
    app.run(debug=True)
