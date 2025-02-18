from conftest import client
import sys
sys.path.append('modules')
import pandas as pd
import pipeline_graph as plg

def test_node_constructors():
    nodes=[]
    for i in range(2):
        nodes.append({'pos':[0,0],'outputs':[],'name':'test','color':'white','size':{'x':200,'y':100},'type':'filter','content':"",'settings':''})
        nodes.append({'pos':[0,0],'outputs':[],'name':'test','color':'white','size':{'x':200,'y':100},'type':'columns_select','content':"",'settings':''})
        nodes.append({'pos':[0,0],'outputs':[],'name':'test','color':'white','size':{'x':200,'y':100},'type':'concatenate','content':"",'settings':{'axis':0,'join':'inner'}})
    plg.parse_graph(nodes,'test')