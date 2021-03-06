import React, {Component} from 'react';

import {Pagination, DropdownButton, MenuItem} from 'react-bootstrap';
import {withRouter, Link} from 'react-router-dom';
import InstanceCard from '../Item/components/InstanceCard.js';
import LoadingOverlay from '../../components/LoadingOverlay.js';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import Highlighter from 'react-highlight-words';
const numberPerPage = 10;

class Search extends Component {
    constructor(props) {
        super(props);

        this.state = {
            type: "",
            data: null,
            filter : [],
            rarityFiltersValues : [], //currently applied filters
            rarityFilter : [], //currently applied filters
            view: [],
            url: this.props.match.url,
            searchTerm: this.props.match.params.searchterm,
            pageNumber: 1
        };

        this.changePage = this.changePage.bind(this);
        this.handleRarityFilterChange = this.handleRarityFilterChange.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.getData = this.getData.bind(this);
    }
    getData(){
        console.log('/api' + this.state.url);
        var that = this;
        fetch('/api'+ this.state.url, { 
            method: 'GET',
            dataType: 'json'
        })
        .then(function(response) {
            return response.json();
        })
        .then(j => {
            console.log(j);
            that.setState({
                type: this.state.url.split('/')[1],
                data: j,
                filter: j,
                view: j.slice(0, numberPerPage)
            });
        });
    }
    componentDidMount() {
        this.getData()
    }
    //change what is being displayed in view list based on filter list
    changePage(eventKey) {
        this.setState({
            pageNumber: eventKey,
            view: this.state.filter.slice((eventKey-1) * numberPerPage, eventKey * numberPerPage)
        });
    }
    
    handleSort(eventKey) {
        //https://stackoverflow.com/questions/979256/sorting-an-array-of-javascript-objects
        var mySort = function(field, reverse, primer){
            var key = primer ? function(x) {return primer(x[field])} : function(x) {return x[field]};
            reverse = !reverse ? 1 : -1;

            return function(a, b) {
                return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
            }
        }
        
        let ekey = parseInt(eventKey);
        let rev = ekey % 2 == 0

        if (Math.floor((ekey + 1) / 2) == 1) {
            var sorted = this.state.filter.sort(mySort('name', rev));
        }
        else if (Math.floor((ekey + 1) / 2) == 2) {
            var sorted = this.state.filter.sort(mySort('rarity', rev));
        }
        else if (Math.floor((ekey + 1) / 2) == 3) {
            var sorted = this.state.filter.sort(mySort('release_date', rev, function(x){return new Date(x)}));
        }
        console.log(sorted);

        this.setState({
            filter: sorted,
            view: sorted.slice((this.state.pageNumber - 1) * numberPerPage, (this.state.pageNumber) * numberPerPage)
        });
    }

    handleRarityFilterChange (value) {
        var filtered = value.length == 0 ? this.state.data : this.state.data.filter(item => value.map(x=>x.value).includes(item.rarity));        
        this.setState({
            filter: filtered,
            rarityFiltersValues: value,
            pageNumber: 1,
            view: filtered.slice(0, numberPerPage),
        });
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.match.params.searchterm !== this.props.match.params.searchterm){            
            this.setState({data: null, searchTerm : nextProps.match.params.searchterm, url : nextProps.match.url}, function(){
                this.getData();
            }.bind(this));
            
        }
        
    }
    makePlural (noun) {
        var lastChar = noun.slice(-1)
        console.log('last char in ' + noun + ' is ' + lastChar);
        if (lastChar === 'y')
            return noun.replace('y', 'ies');
        else
            return noun + 's';
    }
    dumpValues(item){
        var values = Object.keys(item).map(function(key){
            var value = item[key];
            if (isNaN(value)){
                if (!Array.isArray(value))
                    return value;
            }
            return '';
        });
        return values.join(" ");
    }
    // shouldComponentUpdate(nextProps, nextState){
    //     if (nextProps.match.params.searchterm !== this.props.match.params.searchterm){
    //         return true
    //     }
    // }
    //for each value in state, generate a model card
    render() {
        console.log("render");
        if (this.state.data === null)
            return (<LoadingOverlay />)
        let {rarityFiltersValues, view} = this.state
        let rarityOptions = [
            {value: 1, label: 'Common'},
            {value: 2, label: 'Uncommon'},
            {value: 3, label: 'Rare'},
            {value: 4, label: 'Very rare'},
            {value: 5, label: 'Limited'},
            {value: 6, label: 'Premium'},
            {value: 7, label: 'Import'},
            {value: 8, label: 'Exotic'},
            {value: 9, label: 'Black market'}
        ]
        
        // Create the cards before rendering
        var cards = view.map(item => (
            <div>
                <Link onClick={this.forceUpdate} to={`/${this.makePlural(item.type)}/${item.name}`}><button className="btn btn-link btn-lg">{item.name}</button></Link>
                <div>
                    <p className="container">
                        <Highlighter
                            searchWords={this.state.searchTerm.split(' ')}
                            textToHighlight={this.dumpValues(item)}
                        />
                    </p>
                </div>
                <hr/>
            {/* <InstanceCard data={item}/> */}
            </div>
        ));
        console.log(cards);
        return (
            <div className="container">
                <hr/>
                <div className="row">
                    <div className="col-md-8 model-header">                         
                        <h1>{this.state.type.charAt(0).toUpperCase() + this.state.type.slice(1) + ': ' + this.state.searchTerm}</h1>                            
                    </div>                   
                </div>
                <hr/>
                <div className="row">
                    <div className="col-md-12 refine-options">
                        <div className="col-md-8">
                        </div>
                        <div className="col-md-3">
                            <Select placeholder="Rarity Filter: Any" onChange={this.handleRarityFilterChange} multi value={rarityFiltersValues} options={rarityOptions}></Select>                          
                        </div>
                        <div className="col-md-1">
                            <DropdownButton bsStyle="default" title="Sort By: ">
                                <MenuItem header>Name</MenuItem>
                                <MenuItem eventKey="1" onSelect={this.handleSort}>Increasing</MenuItem>
                                <MenuItem eventKey="2" onSelect={this.handleSort}>Decreasing</MenuItem>
                                <MenuItem divider />
                                <MenuItem header>Rarity</MenuItem>
                                <MenuItem eventKey="3" onSelect={this.handleSort}>Increasing</MenuItem>
                                <MenuItem eventKey="4" onSelect={this.handleSort}>Decreasing</MenuItem>
                                <MenuItem divider />
                                <MenuItem header>Release Date</MenuItem>
                                <MenuItem eventKey="5" onSelect={this.handleSort}>Increasing</MenuItem>
                                <MenuItem eventKey="6" onSelect={this.handleSort}>Decreasing</MenuItem>
                            </DropdownButton>
                        </div>
                    </div>
                </div>
                <div className="row">
                    {cards.length == 0 ? "No items to show." : cards}
                </div>
                <hr/>
                <div className="text-center">
                    <Pagination
                        bsSize="medium"     
                        items={this.state.filter.length % numberPerPage === 0 ? Math.floor(this.state.filter.length / numberPerPage) : Math.floor(this.state.filter.length / numberPerPage) + 1} 
                        activePage={this.state.pageNumber}
                        onSelect={this.changePage}
                    />
                </div>
            </div>
        )
    }
}

export default withRouter(Search);