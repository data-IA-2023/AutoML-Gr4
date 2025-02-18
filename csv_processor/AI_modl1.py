import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

# Prepare sample training data
data = {
    'missing_values': [0.1, 0.8, 0.0, 0.3],
    'data_type_int': [1, 0, 1, 0],
    'data_type_float': [0, 0, 0, 0],
    'data_type_object': [0, 1, 0, 1],
    'unique_ratio': [0.7, 0.2, 1.0, 0.5],
    'std_dev': [10, None, 15, None],
    'suggested_action': ['fill_mean', 'remove_nulls', 'no_action', 'encode']
}
df = pd.DataFrame(data)

# Replace missing standard deviation values with 0 (simplification for model training)
df['std_dev'] = df['std_dev'].fillna(0)

# Define features and target
X = df[['missing_values', 'data_type_int', 'data_type_float', 'data_type_object', 'unique_ratio', 'std_dev']]
y = df['suggested_action']

# Train the model
model = RandomForestClassifier()
model.fit(X, y)

# Save the model for later use
joblib.dump(model, 'data_cleaning_model.pkl')
