(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osGbm', gbm);

    /** @ngInject */
    function gbm() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/gbm/gbm.html',
            controller: GbmController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function GbmController(osApi, $state, $stateParams, $scope, $sce) {
            var markersNetwork;
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            vm.toggleFilter = function(){
                $(".container-filters").toggleClass("container-filters-collapsed");
                $(".container-filter-toggle").toggleClass("container-filter-toggle-collapsed");
            }
            vm.search = "";
            vm.frame;

            // Elements
            var elChart = $("#chart");
            var csChart;

            $scope.$watch('vm.search', function(){
                if (csChart === undefined) return;
                var term = vm.search.toUpperCase();
                var len = term.length;
                csChart.nodes().map( function(ele, i, eles){
                    if (len==0){
                        ele.unselect();
                    }
                    else if (ele.attr("name").substr(0,len)===term){
                        ele.select();
                    }
                    else{
                        ele.unselect();
                    }
                });

            });

            // Load Datasets
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function(response) {
                osApi.getPathway().then(function(response) {

                    markersNetwork = angular.fromJson(response.payload);
                    csChart = cytoscape({
                        container: elChart,
                        elements: markersNetwork.elements,
                        style: getStyle(),
                        layout: {
                            name: "preset",
                            fit: true
                        }
                    }).on('select', 'edge', function(e) {
                        $('#gbm-webpage').modal();
                        var url = "http://www.ncbi.nlm.nih.gov/pubmed/?term=" + e.cyTarget.data().pmid;
                        $scope.$apply(function() {
                            vm.frame = $sce.trustAsResourceUrl(url);
                        })

                    }).on('mouseover', 'edge', function(e){
                        e.cyTarget.style({ 'width': '4px'});
                    }).on('mouseout', 'edge', function(e){
                        e.cyTarget.style({ 'width': '2px'});
                    });
                    osApi.setBusy(false);
                });
            });

            function getStyle() {
                var darkblue = 'rgb(5, 108, 225)';
                var black = 'black';
                var blue = 'rgb(19, 150, 222)';
                var red = 'rgb(230, 44, 28)';
                var purple = 'rgb(56, 52,123)';
                var green = 'rgb(56, 52,123)';//'rgb(28, 230,116)';//'green';
                var orange = 'rgb(255, 152, 0)';
                return [
                    {
                        'selector': 'node',
                        'style': {
                            'content': 'data(label)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'shape': 'ellipse',
                            'width': '60px',
                            'height': '50px',
                            'color':darkblue,
                            'background-color': 'rgb(250, 250, 250)',
                            'border-width': '2px',
                            'border-color': darkblue
                            
                        }
                    },
                    {
                        'selector': 'edge',
                        'style': {
                            'width': '2px',
                            'line-color': darkblue,
                            'line-style': 'solid'
                        }
                    },
                    // Boxes
                    {
                        'selector': 'node[nodeType="class"], node[nodeType="family"], node[nodeType="complex"]',
                        'style': {
                            'content': '',
                            'background-color': 'white',
                            'shape': 'roundrectangle'
                            
                        }
                    },
                    // Blue Activiates & Indirect Activates
                    {
                        'selector': 'edge[edgeType="activates"], edge[edgeType="indirectly activates"]',
                        'style': {
                            'line-color': green,
                            'target-arrow-shape': 'triangle',
                            'target-arrow-color': green
                        }
                    }, 
                    // Inhibits & Ubiquitinylates
                    {
                        'selector': 'edge[edgeType="inhibits"], edge[edgeType="ubiquitinylates"]',
                        'style': {
                            'line-color': red,
                            'target-arrow-shape': 'tee',
                            'target-arrow-color': red
                        }
                    }, 
                    // Fusion
                    {
                        'selector': 'edge[edgeType="fusion"]',
                        'style': {
                            'line-color': green
                        }
                    },
                    // Hide
                    {
                        'selector': 'edge[edgeType="contains"]',
                        'style': {
                            'display':'none'
                        }
                    }, 
                    {
                        'selector': 'node[nodeType="process"]',
                        'style':{}
                    },
                    {
                        'selector': 'node:selected',
                        'style': {
                             'overlay-opacity': '0.5',
                             'overlay-color': 'red'
                        }
                    }, 

                    // Legacy ... Not sure if it's being used
                    {
                    'selector': 'node[nodeType="rtk"]',
                    'style': {
                        'content': 'data(label)',
                        'background-color': 'rgb(224, 209, 178)',
                        'border-color': 'black',
                        'border-width': '0px',
                        'font-size': '48px',
                        'shape': 'roundrectangle',
                        'width': '40px',
                        'height': '160px'
                    }
                }, {
                    'selector': 'node[nodeType="kinase"]',
                    'style': {
                        'content': 'data(label)',
                        'background-color': 'rgb(255, 206, 194)',
                        'shape': 'ellipse',
                        'width': '160px',
                        'height': '120px',
                        'font-size': '48px',
                        'border-color': 'black',
                        'border-width': '1px'
                    }
                }, {
                    'selector': 'node[nodeType="dimer"]',
                    'style': {
                        'content': '',
                        'background-color': 'rgb(234, 219, 188)',
                        'shape': 'ellipse',
                        'width': '160px',
                        'height': '120px',
                        'font-size': '48px',
                        'border-color': 'black',
                        'border-width': '0px'
                    }
                }, {
                    'selector': 'node[nodeType="loop"]',
                    'style': {
                        'content': '',
                        'background-color': 'rgb(255, 255, 255)',
                        'shape': 'ellipse',
                        'width': '160px',
                        'height': '120px',
                        'font-size': '48px',
                        'border-color': 'black',
                        'border-width': '1px',
                        'border-style': 'dotted'
                    }
                }, {
                    'selector': 'node[nodeType="gtpase"]',
                    'style': {
                        'content': 'data(label)',
                        'background-color': 'rgb(194, 194, 255)',
                        'shape': 'ellipse',
                        'width': '160px',
                        'height': '120px',
                        'font-size': '48px',
                        'border-color': 'black',
                        'border-width': '1px'
                    }
                }, {
                    'selector': 'node[nodeType="adaptor"]',
                    'style': {
                        'content': 'data(label)',
                        'background-color': 'rgb(77, 184, 255)',
                        'shape': 'ellipse',
                        'width': '60px',
                        'height': '120px',
                        'font-size': '48px',
                        'border-color': 'black',
                        'border-width': '1px'
                    }
                }, {
                    'selector': 'node[nodeType="GEF"]',
                    'style': {
                        'content': 'data(label)',
                        'background-color': 'rgb(77, 184, 255)',
                        'shape': 'ellipse',
                        'width': '60px',
                        'height': '60px',
                        'font-size': '48px',
                        'border-color': 'black',
                        'border-width': '1px'
                    }
                },{
                    'selector': 'node[nodeType="process"]',
                    'style': {
                        'content': 'data(label)',
                        'background-color': 'rgb(255, 255, 255)',
                        'shape': 'roundrectangle',
                        'width': '100px',
                        'height': '40px',
                        'font-size': '24px',
                        'border-color': 'black',
                        'border-width': '0px'
                    }
                }, {
                    'selector': 'node[nodeType="TF"]',
                    'style': {
                        'content': 'data(label)',
                        'background-color': 'rgb(255, 206, 94)',
                        'shape': 'diamond',
                        'width': '160px',
                        'height': '60px',
                        'font-size': '48px',
                        'border-color': 'black',
                        'border-width': '1px'
                    }
                }, {
                    'selector': 'node[nodeType="gene fusion"]',
                    'style': {
                        'content': 'data(label)',
                        'shape': 'roundrectangle',
                        'font-size': '24px',
                        'border-color': 'red',
                        'border-width': '3px'
                    }
                }, {
                    'selector': 'edge:selected',
                    'style': {
                        'overlay-color': 'grey',
                        'overlay-opacity': '0.3'
                    }
                },  {
                    'selector': 'edge[edgeType="recruits"]',
                    'style': {
                        'width': '2px'
                    }
                }, {
                    'selector': 'edge[edgeType="fusion"]',
                    'style': {
                        'line-style': 'dashed',
                        'line-color': black
                    }
                },
                 {
                    'selector': 'edge[edgeType="recruits"]',
                    'style': {
                        'line-color': 'red',
                        'width': '1px',
                        'line-style': 'dashed',
                        'target-arrow-shape': 'triangle',
                        'target-arrow-color': 'black'
                    }
                }, {
                    'selector': 'edge[edgeType="cycles"]',
                    'style': {
                        'line-color': 'black',
                        'width': '1px',
                        'line-style': 'dashed',
                        'target-arrow-shape': 'triangle',
                        'source-arrow-shape': 'triangle',
                        'target-arrow-color': 'green',
                        'source-arrow-color': 'red'
                    }
                }, {
                    'selector': 'edge[edgeType="associates"]',
                    'style': {
                        'line-color': 'black',
                        'width': '1px',
                        'line-style': 'solid'
                    }
                }, {
                    'selector': 'edge[edgeType="activation"]',
                    'style': {
                        'line-color': 'green',
                        'width': '1px'
                    }
                }, {
                    'selector': 'edge[edgeType="inhibition"]',
                    'style': {
                        'line-color': 'red',
                        'width': '1px'
                    }
                }
                ]

            }
        }
    }
})();
