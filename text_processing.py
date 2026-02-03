import pandas as pd
from collections import Counter
import re

# Globals - separate counts for each metric
list1 = []
total_mean_concreteness = 0
total_mean_aoa = 0
total_mean_valence = 0
total_mean_arousal = 0
total_mean_dominance = 0
count_conc = 0  # Separate counter for concreteness
count_aoa = 0   # Separate counter for AoA
count_vad = 0

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


def load_vad_data(nrc_txt):
    nrc_df = pd.read_csv(nrc_txt, sep="\t")
    nrc_df['Word'] = nrc_df['term'].astype(str).str.lower()
    return nrc_df


# Helper function to get column titles
def getColumns(df):
    if df.columns[1] == 'OccurTotal':
        return {'mean': 'Rating.Mean', 'sd': 'Rating.SD'}
    elif df.columns[1] == 'Bigram':
        return {'mean': 'Conc.M', 'sd': 'Conc.SD'}
    elif df.columns[0] == 'term':
        return {'mean_valence': 'valence', 'mean_arousal': 'arousal', 'mean_dominance': 'dominance'}

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
def calculate_added_words(new_words, df, metric):
    global total_mean_concreteness, total_mean_aoa, total_mean_valence, total_mean_arousal, total_mean_dominance, count_conc, count_aoa, count_vad

    columns = getColumns(df)

    for word in new_words:
        res = df[df['Word'] == word]
        if not res.empty:
            try:
                if(not metric == "vad"):
                    val_mean = float(res[columns['mean']].values[0])

                if metric == "conc":
                    total_mean_concreteness += val_mean
                    count_conc += 1
                elif metric == "aoa":
                    total_mean_aoa += val_mean
                    count_aoa += 1
                elif metric == "vad":
                    mean_valence = float(res[columns['mean_valence']].values[0])
                    mean_arousal = float(res[columns['mean_arousal']].values[0])
                    mean_dominance = float(res[columns['mean_dominance']].values[0])
                    total_mean_valence += mean_valence
                    total_mean_arousal += mean_arousal
                    total_mean_dominance += mean_dominance
                    count_vad += 1


            except (ValueError, TypeError, IndexError):
                continue

    # Use the appropriate count and total for this metric
    # Return appropriate structure based on metric
    if metric == "conc":
        if count_conc > 0:
            return {'mean': round(total_mean_concreteness / count_conc, 6), 'sd': 63}
        else:
            return {'mean': 0, 'sd': 0}
    elif metric == "aoa":
        if count_aoa > 0:
            return {'mean': round(total_mean_aoa / count_aoa, 6), 'sd': 63}
        else:
            return {'mean': 0, 'sd': 0}
    elif metric == "vad":
        if count_vad > 0:
            return {
                'valence': round(total_mean_valence / count_vad, 6),
                'arousal': round(total_mean_arousal / count_vad, 6),
                'dominance': round(total_mean_dominance / count_vad, 6)
            }
        else:
            # Reset globals when empty
            total_mean_valence = 0
            total_mean_arousal = 0
            total_mean_dominance = 0
            return {'valence': 0, 'arousal': 0, 'dominance': 0}

    # Fallback (should never reach here with valid metric)
    return {'mean': 0, 'sd': 0}

# Adapted function to find only the new values
def calculate_removed_words(new_words, df, metric):
    global total_mean_concreteness, total_mean_aoa, total_mean_valence, total_mean_arousal, total_mean_dominance, count_conc, count_aoa, count_vad

    columns = getColumns(df)

    for word in new_words:
        res = df[df['Word'] == word]
        if not res.empty:
            try:
                if(not metric == "vad"):
                    val_mean = float(res[columns['mean']].values[0])

                if metric == "conc":
                    total_mean_concreteness -= val_mean
                    count_conc -= 1
                elif metric == "aoa":
                    total_mean_aoa -= val_mean
                    count_aoa -= 1
                elif metric == "vad":
                    mean_valence = float(res[columns['mean_valence']].values[0])
                    mean_arousal = float(res[columns['mean_arousal']].values[0])
                    mean_dominance = float(res[columns['mean_dominance']].values[0])
                    total_mean_valence -= mean_valence
                    total_mean_arousal -= mean_arousal
                    total_mean_dominance -= mean_dominance
                    count_vad -= 1

            except (ValueError, TypeError, IndexError):
                continue

    # Use the appropriate count and total for this metric
    # Return appropriate structure based on metric
    if metric == "conc":
        if count_conc > 0:
            return {'mean': round(total_mean_concreteness / count_conc, 6), 'sd': 63}
        else:
            return {'mean': 0, 'sd': 0}
    elif metric == "aoa":
        if count_aoa > 0:
            return {'mean': round(total_mean_aoa / count_aoa, 6), 'sd': 63}
        else:
            return {'mean': 0, 'sd': 0}
    elif metric == "vad":
        if count_vad > 0:
            return {
                'valence': round(total_mean_valence / count_vad, 6),
                'arousal': round(total_mean_arousal / count_vad, 6),
                'dominance': round(total_mean_dominance / count_vad, 6)
            }
        else:
            # Reset globals when empty
            total_mean_valence = 0
            total_mean_arousal = 0
            total_mean_dominance = 0
            return {'valence': 0, 'arousal': 0, 'dominance': 0}

    # Fallback (should never reach here with valid metric)
    return {'mean': 0, 'sd': 0}





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
