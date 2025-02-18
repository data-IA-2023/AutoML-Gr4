import pandas as pd
import glob
import os
import re
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier

class Node:
    def __init__(self):
        self.inputs=[]
        self.outputs=[]
        self.nb_inputs=-1
        self.nb_outputs=-1
        self.id=-1
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
    def set_id(self,id):
        self.id=id
        return self

# class Graph:
#     def __init__(self,nodes=[],endpoint=-1):
#         self.nodes=nodes
#         self.adj_matrix=adj_matrix
#         self.endpoint=endpoint
#     def compile0(self):
#         for i in range(len(nodes)):
#             for j in range(len(nodes)):
#                 nodes[i].add_output_node(nodes[j])
#     def execute_recursive(self):
#         return nodes[endpoint].execute()

class ImportDF(Node):
    def __init__(self, file_path, sheet_name : str="Sheet1" , sep : str="",index_col=None, header='infer', orient='columns'):
        super().__init__()
        self.file_path=file_path
        self.sheet_name=sheet_name
        self.sep=sep
        self.file_ext=file_path.split(".")[-1]
        self.index_col=index_col
        self.header=header
        # self.names=names
        self.content=None
        self.orient=orient
    def get_inputs(self):
        return []
    def execute(self):
        match self.file_ext:
            case "csv":
                if self.sep == "" :
                    df = pd.read_csv(self.file_path, index_col=self.index_col, header=self.header, engine='python')
                else : df = pd.read_csv(self.file_path, sep=self.sep, index_col=self.index_col, header=self.header, engine='python')
            case "tsv":
                if self.sep == "" : self.sep='\t'
                df = pd.read_csv(self.file_path, sep=self.sep, index_col=self.index_col, header=self.header, engine='python')
            case "xlsx":
                df = pd.read_excel(self.file_path, sheet_name=self.sheet_name)
            case "json":
                df = pd.read_json(self.file_path, orient=self.orient)
        self.content=df
        return df

class DFNode(Node):
    """for testing purposes"""
    def __init__(self,df):
        super().__init__()
        self.content=df
    def execute(self):
        return self.content

class DFFilter(Node):
    def __init__(self, filter : str):
        super().__init__()
        self.nb_inputs=1
        self.nb_outputs=1
        self.filter=filter
        self.content=None
    def execute(self):
        df=self.inputs[0].execute()
        try :
            filtered_df=df.query(self.filter)
            self.content=filtered_df
        except pd.errors.UndefinedVariableError:
            self.content='error : undefined variable'
            return None
        return filtered_df

class DFColumnsSelect(Node):
    def __init__(self, columns : list):
        super().__init__()
        self.columns=columns
        self.nb_inputs=1
        self.nb_outputs=1
        self.content=None
    def execute(self):
        df=self.inputs[0].execute()
        try :
            selected_columns=df[self.columns]
            self.content=selected_columns
        except pd.errors.UndefinedVariableError:
            self.content='error : undefined variable'
            return None
        return selected_columns

class ConcatenateDF(Node):
    def __init__(self, axis : int=0, join='outer'):
        super().__init__()
        self.axis = axis
        self.join=join
    def execute(self):
        df_concat=self.inputs[0].execute()
        for i in range(1,len(self.inputs)):
            df_concat = pd.concat([df_concat, self.inputs[i].execute()], axis=self.axis, join=self.join)
            self.content=df_concat
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

class TestTrainSplit(Node):
    def __init__(self,ratio : float=0.8, order : int=0, rd_state : int=0):
        super().__init__()
        self.content=None
        self.ratio=float(ratio)
        self.order=order
        self.rd_state=rd_state
    def execute(self):
        X_train, X_test, y_train, y_test = train_test_split(self.inputs[0].execute(), self.inputs[1].execute(), test_size=1-self.ratio, random_state=self.rd_state)
        self.content={'X_train':X_train, 'X_test':X_test, 'y_train':y_train, 'y_test':y_test}
        return self.content

class KNeighbors(Node):
    def __init__(self,n_neighbors:int=5):
        super().__init__()
        self.n_neighbors=n_neighbors
        self.input_dict={}
        self.model=None
        self.pred=None
        self.content='' # just a placeholder for encapsulation purposes
    def execute(self):
        neigh = KNeighborsClassifier(n_neighbors=self.n_neighbors)
        self.input_dict=self.inputs[0].execute()
        neigh.fit(self.input_dict['X_train'],self.input_dict['y_train'])
        self.model=neigh
        return neigh
    def predict(self):
        assert self.model!=None
        y_pred = knn.model.predict(self.input_dict['X_test'])
        self.pred=y_pred
        #print("Accuracy:", knn.model.score(self.input_dict['X_test'], self.input_dict['y_test']))
        return y_pred

def parse_graph(node_list,session_dir):
    pd.options.display.max_columns = None
    pd.options.display.max_rows = None
    graph={}
    for i in range(len(node_list)):
        node=node_list[i]
        match node['type']:
            case 'source':
                print(node['settings'])
                files=glob.glob(os.path.join(f"cache/{session_dir}", f"{i}.{node['settings']['file_ext']}"))
                if len(files)>0 : graph.append(ImportDF(files[0].set_id(i),sep=node['settings']['sep']))
            case 'filter':
                graph.append(DFFilter(node['settings']).set_id(i))
            case 'columns_select':
                graph.append(DFColumnsSelect(re.split(r"\s*,\s*",node['settings'])).set_id(i))
            case 'concatenate':
                graph.append(ConcatenateDF(node['settings']['axis'],node['settings']['join']).set_id(i))
            case 'test_train_split':
                graph.append(TestTrainSplit(node['settings']['ratio'],node['settings']['order'],node['settings']['rd_state']).set_id(i))
    for i in range(len(graph)):
        #print(node_list[i]['outputs'])
        for j in node_list[i]['outputs']:
            graph[i].add_output_node(graph[j])
    return graph

if __name__=="__main__":
    from sklearn.datasets import load_iris
    iris = load_iris()
    X = pd.DataFrame(iris.data, columns=iris.feature_names)
    y = pd.DataFrame(iris.target,columns=['target'])
    
    Xnode=DFNode(X)
    ynode=DFNode(y)

    # Nodes definition
    split=TestTrainSplit()
    split.add_input_node(Xnode)
    split.add_input_node(ynode)
    
    knn=KNeighbors()
    knn.add_input_node(split)
    knn.execute()
    # Graphs creation
    print(knn.predict())
    # execute pipeline graph
