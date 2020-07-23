from flask import Flask, render_template, request

import graph

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/fit', methods=['POST'])
def fit():
    nl = request.form.get('node_label')
    nw = request.form.get('node_weight')
    nn = request.form.get('node_name')
    rl = request.form.get('rel_label')
    rw = request.form.get('rel_weight')
    m = request.form.get('select_method')
    o = request.form.get('select_orient')
    
    g = graph.Graph("bolt://localhost:7687", "username", "password")
    g.set_properties(nl, nw, nn, rl, rw, m, o)
    g.fit()
    g.page_rank()
    n = g.get_nodes()
    r = g.get_relationships()
    g.close()

    return {'n': n, 'r': r, 'o': o}
