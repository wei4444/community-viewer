var dom;
var myChart;
var origData;
var data;
var links;
var numCommunities;

var highlightIndex;
var highlightComm;

function findIndexByName(name) {
    return data.findIndex(s => s.name == name);
}

$(document).ready(function () {
    // dom = document.getElementById("container");
    dom = $("#container")[0];
    myChart = echarts.init(dom);

    $("#form1").on("submit", function (e) {
        e.preventDefault();
        $.post("/fit", $("#form1").serialize(),
            function (data, status) {
                origData = data;
                if (origData.r.length > 6000 || origData.n.length > 3000) {
                    $("#slideDown").slideUp();
                    $("#slideDown2").slideDown();
                    showChart(data.n, data.r, data.o, 'graphGL');
                } else {
                    $("#slideDown2").slideUp();
                    $("#slideDown").slideDown();
                    showChart(data.n, data.r, data.o, 'graph');
                }
            });
    });
    $("#form2").on("submit", function (e) {
        e.preventDefault();
        highlightName = $("#search_name").val();
        highlightIndex = findIndexByName(highlightName);
        highlightComm = data[highlightIndex].community;
        for (var i = 0; i < numCommunities; i++) {
            if (i == highlightComm) {
                myChart.dispatchAction({
                    type: 'legendSelect',
                    name: '社区' + i
                });
            } else {
                myChart.dispatchAction({
                    type: 'legendUnSelect',
                    name: '社区' + i
                })
            }
        };
        myChart.dispatchAction({
            type: 'highlight',
            seriesName: 'Point',
            dataIndex: highlightIndex
        });
    });
    $("#form3").on("submit", function (e) {
        e.preventDefault();
        highlightName = $('#search_name_2').val();
        highlightIndex = findIndexByName(highlightName);
        myChart.dispatchAction({
            type: 'focusNodeAdjacency',
            seriesName: 'Point',
            dataIndex: highlightIndex
        });
    });
    $("#recover").click(function () {
        myChart.dispatchAction({
            type: 'downplay',
            seriesName: 'Point'
        });
        myChart.dispatchAction({
            type: 'unfocusNodeAdjacency'
        });
        for (var i = 0; i < numCommunities; i++) {
            myChart.dispatchAction({
                type: 'legendSelect',
                name: '社区' + i
            })
        };
    });
    $("#form4").on("submit", function (e) {
        e.preventDefault();
        highlightName = $('#search_name_3').val();
        highlightIndex = findIndexByName(highlightName);
        myChart.dispatchAction({
            type: 'focusNodeAdjacency',
            seriesName: 'Point',
            dataIndex: highlightIndex
        })
    });
    $("#recover2").click(function () {
        myChart.dispatchAction({
            type: 'unfocusNodeAdjacency',
            seriesName: 'Point'
        })
    });
    // $(window).on('resize', function(){
    //     if(myChart != null && myChart != undefined){
    //         myChart.resize();
    //     }
    // });
});

function showChart(n, r, orient, gl) {
    data = n;
    links = r;

    if(orient == "UNDIRECTED") {
        edgeSymbol = ['none', 'none'];
    } else {
        edgeSymbol = ['none', 'arrow']
    }

    myChart.showLoading();

    numCommunities = 0
    data.forEach(function (data) {
        if (data.community > numCommunities) {
            numCommunities = data.community;
        }
    });
    numCommunities += 1

    var categories = [];
    for (var i = 0; i < numCommunities; i++) {
        categories[i] = {
            name: '社区' + i
        };
    }

    data.forEach(function (data) {
        data.itemStyle = null;
        data.symbolSize = 5 + data.pagerank % 20;
        data.category = data.community;
        data.x = data.y = null;
        // Use random x, y
        // data.x = Math.random();
        // data.y = Math.random();
        data.draggable = true;
    });

    option = {
        title: {
            text: '社区发现',
            subtext: 'Community Detection'
        },
        tooltip: {},
        legend: [{
            data: categories.map(function (a) {
                return a.name;
            }),
            type: 'scroll',
            orient: 'vertical',
            right: 20
        }],
        animation: false,
        series: [
            {
                name: 'Point',
                type: gl,
                layout: 'force',
                data: data,
                links: links,
                categories: categories,
                roam: true,
                label: {
                    position: 'right'
                },
                force: {
                    repulsion: 50,
                    gravity: 0.1,
                    friction: 0.6
                },
                focusNodeAdjacency: true,
                edgeSymbol: edgeSymbol,
                tooltip: {
                    formatter: function (params, ticket, callback) {
                        if (params.dataType == 'node') {
                            var result = String(params.data.name) + '<br>';
                            result += '所属社区: ' + String(params.data.community) + '<br>';
                            result += 'PageRank: ' + String(Math.ceil(params.data.pagerank * 10) / 10) + '<br>';
                            result += '权重：' + String(params.data.weight);
                            return result;
                        } else {
                            var result = String(params.data.sourcename) + ' - ' + String(params.data.targetname) + '<br>';
                            result += '权重：' + String(params.data.weight);
                            return result;
                        }

                    }
                }
            }
        ]
    };
    myChart.setOption(option);
    myChart.hideLoading();
    // console.log(data);
    // console.log(links);
}