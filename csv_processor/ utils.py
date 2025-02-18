# csv_processor/utils.py
import pandas as pd
import numpy as np

def generate_features(df, column):
    """Generate features for AI model input"""
    try:
        # Calculate basic features
        missing_values = df[column].isna().mean()
        unique_ratio = df[column].nunique() / len(df)
        
        # Determine data type features
        dtype = str(df[column].dtype)
        data_type_int = 1 if 'int' in dtype else 0
        data_type_float = 1 if 'float' in dtype else 0
        data_type_object = 1 if 'object' in dtype else 0
        
        # Calculate standard deviation (handle non-numeric columns)
        try:
            std_dev = df[column].std()
        except TypeError:
            std_dev = 0
            
        return [
            missing_values,
            data_type_int,
            data_type_float,
            data_type_object,
            unique_ratio,
            std_dev if not np.isnan(std_dev) else 0
        ]
    except Exception as e:
        print(f"Error generating features for {column}: {str(e)}")
        return None