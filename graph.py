from neo4j import GraphDatabase

class Graph:

    def __init__(self, uri, user, password):
        self._driver = GraphDatabase.driver(uri, auth=(user, password), encrypted = False)

    def close(self):
        self._driver.close()
    
    # node label, node weight, node name, relation label, relation weight, orientation
    def set_properties(self, nl, nw, nn, rl, rw, method, orient):
        self.nl = nl
        self.nw = nw
        self.nn = nn
        self.rl = rl
        self.rw = rw
        self.m = method
        self.o = orient

    def fit(self):
        cmd = '''
            CALL gds.labelPropagation.write({
                nodeProjection: '$nl',
                relationshipProjection: {
                    $rl: {
                        orientation: '$o'
                    }
                },
                nodeProperties: $nw,
                nodeWeightProperty: $nw,
                relationshipProperties: $rw,
                relationshipWeightProperty: $rw,
                writeProperty: '$wp',
                consecutiveIds: true
            })
            YIELD ranIterations, communityCount
        '''

        cmd = cmd.replace("$nl", self.nl)
        cmd = cmd.replace("$rl", self.rl)
        cmd = cmd.replace("$o", self.o)

        if(self.m == "LP"):
            if(len(self.nw)!=0):
                cmd = cmd.replace("$nw", "'"+self.nw+"'")
            else:
                cmd = cmd.replace("$nw", "null")

            if(len(self.rw)!=0):
                cmd = cmd.replace("$rw", "'"+self.rw+"'")
            else:
                cmd = cmd.replace("$rw", "null")
            
            cmd = cmd.replace("$wp", "communityLP")
    
        elif(self.m == "Louvain"):
            cmd = cmd.replace("$nw", "null")

            if(len(self.rw)!=0):
                cmd = cmd.replace("$rw", "'"+self.rw+"'")
            else:
                cmd = cmd.replace("$rw", "null")
            
            cmd = cmd.replace("$wp", "communityLouvain")

        with self._driver.session() as session:
            # print(cmd)
            result = session.write_transaction(self._run, cmd)
    
    def page_rank(self):
        cmd = '''
            CALL gds.pageRank.write({
                nodeProjection: '$nl',
                relationshipProjection: {
                    $rl: {
                        orientation: '$o'
                    }
                },
                maxIterations: 20,
                dampingFactor: 0.85,
                writeProperty: 'pagerank'
            })
            YIELD nodePropertiesWritten AS writtenProperties, ranIterations
        '''

        cmd = cmd.replace("$o", self.o)

        cmd = cmd.replace("$nl", self.nl)
        cmd = cmd.replace("$rl", self.rl)

        with self._driver.session() as session:
            result = session.write_transaction(self._run, cmd)

    def get_nodes(self):
        cmd = "MATCH (n:$nl) RETURN n".replace("$nl", self.nl)
        with self._driver.session() as session:
            nodes = session.write_transaction(self._run, cmd)
            
            result = []
            for i in nodes:
                node = i['n']
                result.append({
                    'id': node.id, 
                    'name': node[self.nn],
                    'community': node['community'+self.m], 
                    'pagerank': node['pagerank'], 
                    'weight': node[self.nw]
                })
            return result
    
    def get_relationships(self):
        cmd = "MATCH (a:$nl) -[r:$rl]-> (b:$nl) RETURN *"
        cmd = cmd.replace("$nl", self.nl).replace("$rl", self.rl)
        with self._driver.session() as session:
            rel = session.write_transaction(self._run, cmd)

            result = []
            for i in rel:
                node1 = i['a']
                node2 = i['b']
                rel = i['r']
                result.append({
                    'id': rel.id, 
                    'source': str(node1.id), 
                    'sourcename': str(node1[self.nn]), 
                    'target': str(node2.id), 
                    'targetname': str(node2[self.nn]), 
                    'weight': rel[self.rw]
                })
            return result
    
    @staticmethod
    def _run(tx, cmd):
        return tx.run(cmd)

if __name__ == "__main__":
    a = Graph("bolt://localhost:7687", "neo4j", "123123")
    a.close()