# AI_modl.py
import pickle
import pandas as pd

# Load the pre-trained data cleaning model
with open("/Users/daryahya/Desktop/automl/AutoML-Gr4-1/data_cleaning_model.pkl", "rb") as f:
    data_cleaning_model = pickle.load(f)

def clean_data(df):
    """
    Process the input DataFrame using the pre-trained model.
    Adjust this function depending on your model's interface.
    """
    # Assuming the model has a transform method
    cleaned_df = data_cleaning_model.transform(df)
    return cleaned_df
