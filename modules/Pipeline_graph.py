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

class Graph:
    def __init__(self,nodes=[],adj_matrix=[[]],endpoint=-1):
        self.nodes=nodes
        self.adj_matrix=adj_matrix
        self.endpoint=endpoint
    def compile0(self):
        for i in range(len(nodes)):
            for j in range(len(nodes)):
                nodes[i].add_output_node(nodes[j])
    def execute(self):
        return nodes[endpoint].execute()


class ImportDF(Node):
    def __init__(self, file_path, sheet_name : str="" , sep : str=",",index_col=None, header=None, orient='columns'):
        super().__init__()
        self.file_path=file_path
        self.sheet_name=sheet_name
        self.sep=sep
        self.file_ext=file_path.split(".")[-1]
        self.index_col=index_col
        self.header=header
        self.names=names
        self.df=None
        self.orient=orient
    def execute(self):
        match self.ext:
            case "csv":
                df = pd.read_csv(self.file_path, sep=self.sep, index_col=self.index_col, header=self.header)
            case "tsv":
                if self.sep == "," : self.sep='\t'
                df = pd.read_csv(self.file_path, sep=self.sep, index_col=self.index_col, header=self.header)
            case "xlsx":
                df = read_excel(self.file_path, sheet_name=self.sheet_name)
            case "json":
                df = read_json(self.file_path, orient=self.orient)
        return df

class DFNode(Node):
    """for testing purposes"""
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
        self.filter=filter
    def execute(self):
        df=self.inputs[0].execute()
        filtered_df=df.query(self.filter)
        return filtered_df

class DFColumnsSelect(Node):
    def __init__(self, columns : list):
        super().__init__()
        self.columns=columns
        self.nb_inputs=1
        self.nb_outputs=1
    def execute(self):
        df=self.inputs[0].execute()
        selected_columns=df[self.columns]
        return selected_columns

class ConcatenateDF(Node):
    def __init__(self, axis : int):
        super().__init__()
        self.axis = axis
    def execute(self):
        df_concat=self.inputs[0].execute()
        for i in range(1,len(self.inputs)):
            df_concat = pd.concat([df_concat, self.inputs[i].execute()], axis=self.axis)
        return df_concat

class DFPivotTable(Node):
    def __init__(self, index, values, aggfunc):
        super().__init__()
        self.nb_inputs=1
        self.nb_outputs=1
        self.index=index
        self.values=values
        self.aggfunc=aggfunc
    def execute(self):
        p_table = pd.pivot_table(self.inputs[0].execute(), index=self.index, values=self.values, aggfunc=self.aggfunc)
        return p_table

if __name__=="__main__":
    df1=pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
    df2=pd.DataFrame({'C': [1, 2, 3], 'D': [4, 5, 6]})

    # Nodes definition
    Concatenator=ConcatenateDF(axis=1)
    dfn1=DFNode(df1)
    dfn2=DFNode(df2)
    Filter=DFFilter('C==2')
    Selector=DFColumnsSelect(['A'])

    # Graphs creation
    
    dfn1.add_output_node(Concatenator)
    dfn2.add_output_node(Concatenator)
    Concatenator.add_output_node(Filter)
    Filter.add_output_node(Selector)
    # execute pipeline graph
    print(Selector.execute())
