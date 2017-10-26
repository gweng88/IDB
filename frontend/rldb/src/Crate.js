import React, {Component} from 'react';

import InstanceCard from './InstanceCard';

class Crate extends Component {
    constructor(props) {
        super(props);

        this.state = {
            data: []
        };
    }

    //is it better to do fetch in constructor or in componentDidMount
    componentDidMount() {
        fetch('/api/meta/crates', { 
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
        // Create the cards before rendering
        var cards = [];
        this.state.data.forEach( function(item) {
            cards.push(<InstanceCard data={item}/>);
        });
        return (
            <div className="container">
                <h1>Crates</h1>
                <div className="row">
                    {cards.length == 0 ? "No items to show." : cards}
                </div>
            </div>
        )
    }
}

export default Crate;