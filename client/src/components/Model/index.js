import React from 'react';
import { connect } from 'react-redux'

import $ from 'jquery';
import Dygraph from 'dygraphs';
import cytoscape from 'cytoscape';
import cydagre from 'cytoscape-dagre';
import dagre from 'dagre';
import { computeCytoscapeGraph } from 'components/Model/util';
import { updateSelectedNode } from 'routes/DataView/modules/selected-node';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { github } from 'react-syntax-highlighter/dist/styles';

export class Model extends React.Component {
    static propTypes = {
        model: React.PropTypes.object.isRequired,
        metrics: React.PropTypes.array.isRequired
    }

    constructor(props) {
        super(props);
        this.graphs = {};
    }

    componentDidMount() {
        this.graphs = this.props.metrics.reduce((graphsMap, metricName) => {
            graphsMap[metricName] = new Dygraph(
                $(this.refs.container).find('.graph-' + metricName)[0],
                this.props.model.metricTimeseries[metricName],
                {
                    drawPoints: true,
                    valueRange: [0, 5],
                    labels: ['batch', metricName]
                }
            );
            return graphsMap;
        }, {});

        cydagre( cytoscape, dagre );

        let cyGraph = cytoscape({
            container: this.refs.graphvisContainer,
            elements: computeCytoscapeGraph(this.props.model.kerasConfig),
            layout: {
              name: 'dagre',
              rankDir: 'LR'
            },
            style: [
            {
                selector: 'node',
                style: {
                    'content': 'data(id)',
                    'text-opacity': 0.5,
                    'text-valign': 'bottom',
                    'text-halign': 'center',
                    'text-margin-y': 15,
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 4,
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            }
            ]
        });
        cyGraph.nodes()
        .on('select', (clickEvt) =>
            this.props.updateSelectedNode(clickEvt.cyTarget._private.data)
        )
        .on('unselect', (clickEvt) => this.props.updateSelectedNode({}))

    }

    render() {
        const model = this.props.model;
        this.updateGraph(model);
        return <div className='model-container' ref='container'>
            <div className='model-name'>Model: <b>{model.model.id}</b></div>
            <div className='row'>
                <div ref='graphvisContainer' className='graph-vis-container'></div>
                {
                    this.props.selectedNode.data ?
                    <div>
                        <div className='panel-label'>Selected: {this.props.selectedNode.id} </div>
                        <SyntaxHighlighter language='json' style={github}>{JSON.stringify(this.props.selectedNode.data, null, 4)}</SyntaxHighlighter>
                    </div>: ''
                }

            </div>
            <div className='row'>
                {
                    this.props.metrics.map((metricName) => (
                        <div className={'graph-' + metricName + '-container graph-container col-md-6'} key={metricName}>
                            <div className='graph-title panel-label'>{metricName}</div>
                            <div className={'graph-' + metricName}></div>
                        </div>
                    ))
                }
                <div className='config-display col-md-6'>
                    <div className='panel-label'>
                        Training Config
                    </div>

                    <div>
                        <SyntaxHighlighter language='json' style={github}>
                            {
                                JSON.stringify(model.trainConfig, null, 4)
                            }
                        </SyntaxHighlighter>
                    </div>
                </div>
                <div className='config-display col-md-6'>
                    <div className='panel-label'>
                        Keras Config
                    </div>

                    <div>
                         <SyntaxHighlighter language='json' style={github}>
                            {
                                JSON.stringify(model.kerasConfig, null, 4)
                            }
                         </SyntaxHighlighter>
                    </div>
                </div>
            </div>
        </div>;
    }

    updateGraph(model) {
        return this.props.metrics.map((metricName) => (
            this.graphs[metricName] &&
            this.graphs[metricName].updateOptions({
                file: model.metricTimeseries[metricName]
            })
        ));
    }
}

export default connect((state) => ({
    selectedNode: state.selectedNode
}), {
    updateSelectedNode: updateSelectedNode
})(Model)
