import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Assume you have a CSV file containing pre‑labeled training data
# For example, each row corresponds to one column from various CSV files.
# Columns might include:
#   - null_percent: Percentage of missing values in the column
#   - unique_ratio: Ratio of unique values to total rows
#   - is_numeric: 1 if numeric, 0 otherwise
#   - std_dev: Standard deviation (0 for non‑numeric)
#   - recommended_action: Label such as 'fill_mean', 'remove_nulls', etc.
training_data = pd.read_csv('media/temp/test.csv')

# Define feature columns and target label
feature_cols = ['null_percent', 'unique_ratio', 'is_numeric', 'std_dev']
X = training_data[feature_cols]
y = training_data['recommended_action']

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a simple decision tree classifier
model = DecisionTreeClassifier(random_state=42)
model.fit(X_train, y_train)

# Evaluate the model
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

# Save your model for later use (for example, with joblib)
import joblib
joblib.dump(model, 'cleaning_recommendation_model.pkl')
