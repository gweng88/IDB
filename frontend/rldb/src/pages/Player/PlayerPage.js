import React, {Component} from 'react';
import LoadingOverlay from '../../components/LoadingOverlay';
// import {Link} from 'react-router-dom';

class PlayerPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            data: null
        };
    }

    getApiType (type_name) {
        var apiTypes = {"crate":"crates", "paint":"paints", "body":"bodies","player":"players"};
        return apiTypes[type_name];
    } 

    //is it better to do fetch in constructor or in componentDidMount
    componentDidMount() {
        var url = this.props.match.url
        console.log('/api' + url);
        fetch('/api' + url , { 
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

    getPlatform (platform) {
        var platforms = ["unknown", "Steam", "Playstation", "Xbox"];
        return platforms[platform];
    } 

    render() {
        if (this.state.data === null)
            return (<LoadingOverlay />)

        return (
            <div className="container">
                <h1>{this.state.data.name}</h1>
                <div className="row">
                    <div className="col-md-4">
                        <img className="img-rounded" src={this.state.data.image ? this.state.data.image : "http://via.placeholder.com/300x300"} alt="player"/>
                    </div>
                    <div className="col-md-8 text-center">
                        <h3>Platform: {this.getPlatform(this.state.data.platform)}</h3>
                        <h3>Skill Rating: {this.state.data.skill_rating}</h3>
                        <h3>Wins: {this.state.data.wins}</h3>
                        <a className="btn btn-info" href={this.state.data.profile_url}>Profile Page</a>
                        {/* <Link to={'/'+ this.props.match.url.split('/')[1]}>
                        <h3>Go back.</h3>
                        </Link> */}
                    </div>
                </div>
                <img src={this.state.data.sig_image ? this.state.data.sig_image : ""} alt="Verious player statistics"/>
            </div>
        )
    }
}

export default PlayerPage;