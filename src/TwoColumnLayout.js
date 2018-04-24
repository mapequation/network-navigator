import React, { Component } from 'react';
import { Sidebar, Segment, Button, Rail } from 'semantic-ui-react';
import MapVisualizer from './MapVisualizer';
import SidebarRight from './SidebarRight';

export default class TwoColumnLayout extends Component {
    state = {
        visible: true,
        loading: true,
        flowDistribution: [],
        degreeDistribution: [],
        largest: [],
        selectedNode: null,
        searchFunction: () => null,
    }

    toggleVisibility = () => this.setState({ visible: !this.state.visible });
    loadingComplete = () => this.setState({ loading: false });
    setFlowDistribution = data => this.setState({ flowDistribution: data });
    setDegreeDistribution = data => this.setState({ degreeDistribution: data });
    setLargest = data => this.setState({ largest: data });
    setSelectedNode = node => this.setState({ selectedNode: node })
    setSearchFunction = f => this.setState({ searchFunction: f })

    render() {
        return (
            <Sidebar.Pushable as={Segment}>
                <SidebarRight
                    searchFunction={this.state.searchFunction}
                    flowDistribution={this.state.flowDistribution}
                    degreeDistribution={this.state.degreeDistribution}
                    largest={this.state.largest}
                    selectedNode={this.state.selectedNode}
                    visible={this.state.visible}
                    toggleVisibility={this.toggleVisibility} />
                <Sidebar.Pusher>
                    <Segment basic loading={this.state.loading}>
                        <Rail attached internal position="right" size="small">
                            <Button
                                onClick={this.toggleVisibility}
                                content="Show menu"
                                icon='sidebar' />
                        </Rail>
                        <MapVisualizer
                            searchFunction={this.setSearchFunction}
                            flowDistribution={this.setFlowDistribution}
                            degreeDistribution={this.setDegreeDistribution}
                            largest={this.setLargest}
                            selectedNode={this.setSelectedNode}
                            width={window.innerWidth}
                            height={window.innerHeight}
                            loadingComplete={this.loadingComplete} />
                    </Segment>
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        );
    }
}
