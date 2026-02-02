import pandas as pd

# Load the AOA DataFrame
def load_aoa_data(aoa_csv):
    aoa_df = pd.read_csv(aoa_csv)
    aoa_df['Word'] = aoa_df['Word'].astype(str).str.lower()
    return aoa_df

# load conc dataframe
def load_conc_data(conc_csv):
    conc_df = pd.read_csv(conc_csv)
    conc_df['Word'] = conc_df['Word'].astype(str).str.lower()
    return conc_df


# Helper function to get columns
def getColumns(df):
    if df.columns[1] == 'OccurTotal':
        return {'mean': 'Rating.Mean', 'sd': 'Rating.SD'}
    elif df.columns[1] == 'Bigram':  # Use 'elif' instead of 'else if'
        return {'mean': 'Conc.M', 'sd': 'Conc.SD'}


# Function to calculate the mean for a given text
def calculate_mean(text, df):
    words = text.lower().split()
    total_val_mean = 0.0
    total_val_sd = 0.0
    count = 0

    columns = getColumns(df)

    for word in words:
        # Get the row in the DataFrame
        res = df[df['Word'] == word]
        if not res.empty:
            try:
                val_sd = float(res[columns['sd']].values[0])
                val_mean = float(res[columns['mean']].values[0])
                total_val_mean += val_mean
                total_val_sd += val_sd
                count += 1
            except (ValueError, TypeError, IndexError):
                continue

    # Calculate mean if count is greater than 0
    if count > 0:
            return {'mean': total_val_mean/count, 'sd': total_val_sd/count}
    return {'mean': "insufficient input", 'sd': "insufficient input"}
