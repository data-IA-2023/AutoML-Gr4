# import pandas as pd
# from sklearn.tree import DecisionTreeClassifier
# import joblib

# def train_cleaning_model():
#     # Synthetic dataset
#     data = {
#         'missing_values': [0.1, 0.5, 0.0, 0.8],
#         'data_type': ['numeric', 'categorical', 'numeric', 'categorical'],
#         'suggested_action': ['mean_impute', 'remove_duplicates', 'no_action', 'encoder']
#     }
    
#     df = pd.DataFrame(data)
    
#     # Features and target
#     X = df[['missing_values', 'data_type']]
#     y = df['suggested_action']
    
#     # Convert data types to numerical encoding
#     X_encoded = pd.get_dummies(X)
    
#     # Train model
#     model = DecisionTreeClassifier(max_depth=2)
#     model.fit(X_encoded, y)
    
#     # Save model
#     model_path = 'cleaning_model.pkl'
#     joblib.dump(model, model_path)
#     print("Model trained and saved")

# train_cleaning_model()

import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import joblib

def train_cleaning_model():
    # Sample training data
    data = {
        'missing_values': [0.1, 0.8, 0.0, 0.3],
        'data_type_int64': [1, 0, 1, 0],
        'data_type_float64': [0, 0, 0, 0],
        'data_type_object': [0, 1, 0, 1],
        'suggested_action': ['fill_mean', 'remove_nulls', 'no_action', 'remove_duplicates']
    }
    df = pd.DataFrame(data)
    
    # Features and target
    X = df[['missing_values', 'data_type_int64', 'data_type_float64', 'data_type_object']]
    y = df['suggested_action']
    
    # Train and save the model
    model = DecisionTreeClassifier(max_depth=2)
    model.fit(X, y)
    joblib.dump(model, 'cleaning_model.pkl')

train_cleaning_model()