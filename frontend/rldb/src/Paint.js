import React, {Component} from 'react';

import InstanceCard from './InstanceCard';
import LoadingOverlay from './LoadingOverlay';

class Paint extends Component {
    constructor(props) {
        super(props);

        this.state = {
            data: null
        };
    }

    //is it better to do fetch in constructor or in componentDidMount
    componentDidMount() {
        fetch('/api/paints/', { 
            method: 'GET',
            dataType: 'json'
        })
        .then(function(response) {
            return response.json()
        })
        .then(j => {
            console.log(j);
            this.setState({
                data: j
            });
        });
    }

    //for each value in state, generate a model card
    render() {
        if (this.state.data === null)
            return (<LoadingOverlay />)
        // Create the cards before rendering
        var cards = [];
        this.state.data.forEach( function(item) {
            cards.push(<InstanceCard key={item.id} data={item}/>);
        });
        return (
            <div className="container">
                <h1>Paint Finishes</h1>
                <div className="row">
                    {cards.length == 0 ? "No items to show." : cards}
                </div>
            </div>
        )
    }
}

export default Paint;