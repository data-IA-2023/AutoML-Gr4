import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

# Simple training examples
training_data = [
    {'missing': 0.8, 'dtype': 'object',  'unique_ratio': 0.1, 'action': 'remove_nulls'},
    {'missing': 0.2, 'dtype': 'float64', 'unique_ratio': 0.9, 'action': 'fill_mean'},
    {'missing': 0.5, 'dtype': 'int64',   'unique_ratio': 0.3, 'action': 'fill_median'},
    {'missing': 0.9, 'dtype': 'object',  'unique_ratio': 0.05, 'action': 'remove_column'},
    {'missing': 0.1, 'dtype': 'float64', 'unique_ratio': 0.95, 'action': 'no_action'},
]

class SimpleCleanModel:
    def __init__(self):
        self.model = None
        self.le = LabelEncoder()
        self.dtype_map = {'object': 0, 'float64': 1, 'int64': 2, 'datetime64': 3}
        
    def train(self):
        df = pd.DataFrame(training_data)
        df['dtype'] = df['dtype'].map(self.dtype_map)
        y = self.le.fit_transform(df['action'])
        X = df.drop('action', axis=1)
        
        self.model = DecisionTreeClassifier(max_depth=3)
        self.model.fit(X, y)
        
    def predict(self, df, column):
        if self.model is None:
            self.train()
            
        features = {
            'missing': df[column].isna().mean(),
            'dtype': self.dtype_map.get(str(df[column].dtype), 4),  # 4=unknown type
            'unique_ratio': df[column].nunique() / len(df)
        }
        
        prediction = self.model.predict(pd.DataFrame([features]))[0]
        return self.le.inverse_transform([prediction])[0]
    
    def save_model(self, path='csv_processor/utils/simple_model.pkl'):
        joblib.dump((self.model, self.le), path)
        
    def load_model(self, path='csv_processor/utils/simple_model.pkl'):
        self.model, self.le = joblib.load(path)