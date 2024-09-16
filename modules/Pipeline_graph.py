import pandas as pd

class Node:
    def __init__(self):
        self.inputs=[]
        self.outputs=[]
        self.nb_inputs=-1
        self.nb_outputs=-1
    def add_output_node(self,output):
        if self.nb_outputs != -1 :
            assert len(self.outputs) <= self.nb_outputs
        if output.nb_inputs != -1 :
            assert len(output.inputs) <= output.nb_inputs
        output.inputs.append(self)
        self.outputs.append(output)
    def add_input_node(self,input0):
        if self.nb_inputs != -1 :
            assert len(self.inputs) <= self.nb_inputs
        if input0.nb_outputs != -1 :
            assert len(input0.outputs) <= input0.nb_outputs
        input0.outputs.append(self)
        self.inputs.append(input0)

class DFNode(Node):
    def __init__(self,df):
        super().__init__()
        self.df=df
    def execute(self):
        return self.df

class DFFilter(Node):
    def __init__(self, filter : str):
        super().__init__()
        self.nb_inputs=1
        self.nb_outputs=1
        self.df=inputs[0]
        self.filter=filter
    def execute(self):
        filtered_df=self.df.query(self.filter)
        return filtered_df

class InsertColumns(Node):
    """Not very useful"""
    def __init__(self, columns_ids : list , columns : dict):
        super().__init__()
        self.nb_inputs=1
        self.nb_outputs=1
        self.columns_ids=columns_ids
        self.columns=columns
    def execute(self):
        assert len(columns_ids) == len(columns.keys)
        self.df=self.inputs[0].execute().copy()
        for i in range(len(columns_ids)):
            df.insert(columns_ids[i], columns.keys()[i], columns.values()[i])
        return self.df

class ConcatenateDF(Node):
    def __init__(self, axis : int):
        super().__init__()
        self.axis = axis
    def execute(self):
        self.df=self.inputs[0].execute()
        for i in range(1,len(self.inputs)):
            self.df = pd.concat([self.df, self.inputs[i].execute()], axis=self.axis)
        return self.df

if __name__=="__main__":
    df1=pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
    df2=pd.DataFrame({'C': [1, 2, 3], 'D': [4, 5, 6]})
    # Compile pipeline graph
    Concatenator=ConcatenateDF(axis=1)
    Concatenator.add_input_node(DFNode(df1))
    Concatenator.add_input_node(DFNode(df2))
    # execute pipeline graph
    print(Concatenator.execute())
