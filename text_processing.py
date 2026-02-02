import pandas as pd
from collections import Counter
import re

# Globals

list1 = []
total_mean_concreteness = 0
count = 0




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


# Helper function to get column titles
def getColumns(df):
    if df.columns[1] == 'OccurTotal':
        return {'mean': 'Rating.Mean', 'sd': 'Rating.SD'}
    elif df.columns[1] == 'Bigram':  # Use 'elif' instead of 'else if'
        return {'mean': 'Conc.M', 'sd': 'Conc.SD'}

# Function to check if new words
def newWords(text):
    global list1

    list2 = re.findall(r'\b\w+\b', text.lower())

    count1 = Counter(list1)
    count2 = Counter(list2)

    # Words removed (in list1 but not enough in list2)
    removed_counts = count1 - count2
    removed = []
    for item in list1:
        if removed_counts[item] > 0:
            removed.append(item)
            removed_counts[item] -= 1

    # Words added (in list2 but not enough in list1)
    added_counts = count2 - count1
    added = []
    for item in list2:
        if added_counts[item] > 0:
            added.append(item)
            added_counts[item] -= 1

    list1 = list2.copy()


    return removed, added


# Adapted function to find only the new values
def calculate_added_words(new_words, df):
    global total_mean_concreteness
    global count

    columns = getColumns(df)

    for word in new_words:
        # Get the row in the DataFrame
        res = df[df['Word'] == word]
        print("word searched:", word)
        if not res.empty:
            try:
                #val_sd = float(res[columns['sd']].values[0])
                val_mean = float(res[columns['mean']].values[0])
                total_mean_concreteness += val_mean
                count += 1
                #total_val_sd += val_sd
            except (ValueError, TypeError, IndexError):
                continue

    # Calculate mean if count is greater than 0
    if count > 0:
            return {'mean': total_mean_concreteness/count, 'sd': 63}
    return {'mean': "insufficient input", 'sd': "insufficient input"}


# Adapted function to find only the new values
def calculate_removed_words(new_words, df):
    global total_mean_concreteness
    global count

    columns = getColumns(df)

    for word in new_words:
        # Get the row in the DataFrame
        res = df[df['Word'] == word]
        print("word lookup:", word)
        if not res.empty:
            try:
                val_mean = float(res[columns['mean']].values[0])
                total_mean_concreteness -= val_mean
                count -= 1

            except (ValueError, TypeError, IndexError):
                continue

    # Calculate mean if count is greater than 0
    if count > 0:
            return {'mean': total_mean_concreteness/count, 'sd': 63}
    return {'mean': "insufficient input", 'sd': "insufficient input"}





# Function to calculate the mean for a given text
def calculate_mean(text, df):
    # needs to be modified to accept just a few words and update global value
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
