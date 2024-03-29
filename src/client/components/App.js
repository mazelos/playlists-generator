import React, { Component } from 'react';
import './App.scss';

// importing components :
import { NavBar } from './NavBar/NavBar';
import { SearchBar } from './SearchBar/SearchBar';
import { SearchResults } from './SearchResult/SearchResults';

//importing helper functions :
import { cookieParser } from '../util/cookieParser';
import { getUserInfo } from '../util/getUserInfo';
import { search } from '../util/searchSong';
import { savePlaylist } from '../util/savePlaylist';
import { SavePopup } from './SavePopup/SavePopup';

// defining the app component that will render all other components imported 
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      transitionActivated: false,
      searchResults: [],
      playlistTracks: [],
      playlistName: '',
      savePlaylistPopup: 'closed',
      didFound: false,
      userIsLogged: false,
      userInfo: {},
      accessToken: '',
    }
    this.activateTransition = this.activateTransition.bind(this);
    this.search = this.search.bind(this);
    this.addTrack = this.addTrack.bind(this);
    this.removeTrack = this.removeTrack.bind(this);
    this.checkAuth = this.checkAuth.bind(this);
    this.getUserInfo = this.getUserInfo.bind(this);
    this.logOut = this.logOut.bind(this); 
    this.savePlaylist = this.savePlaylist.bind(this);
    this.resetTracks = this.resetTracks.bind(this);
    this.openSavePlaylistPopup = this.openSavePlaylistPopup.bind(this);
    this.closeSavePlaylistPopup = this.closeSavePlaylistPopup.bind(this);
  }
  
  componentDidMount() {
    this.checkAuth();
    this.setState({
      transitionActivated: false
    })
  }

  activateTransition() {
    this.setState({
      transitionActivated: true
    })
  }

  checkAuth() {
    if (document.cookie === '') {
      console.log(`no cookie found!`);
      this.setState({ userIsLogged: false });
      return;
    }
    const parsedCookies = cookieParser(document.cookie);
    if (parsedCookies['access_token'] && parsedCookies['access_token'].length > 0) {
      console.log('user is logged with access_token: ', parsedCookies['access_token']);
      this.setState({
        accessToken: parsedCookies['access_token'],
        userIsLogged: true
      }, () => {
        this.getUserInfo(parsedCookies['access_token'])
      })    
    } else {
      console.log('user is NOT logged');
      this.setState({
        userIsLogged: false
      })
    }
  }

  async getUserInfo(access_token) {
    try {
      const userInfo = await getUserInfo(access_token);
      this.setState({ userInfo: userInfo })
    } catch (error) {
      alert(error.message);
      document.cookie = 'access_token=';
      document.cookie = 'refresh_token=';
      this.setState({
        userIsLogged: false,
        accessToken: ''
      })
    }
  }

  logOut() {
    document.cookie = 'access_token=';
    document.cookie = 'refresh_token=';
    this.setState({
      userInfo: {},
      userIsLogged: false,
      accessToken: ''
    })
  }

  async search(term) {
    const songs = await search(this.state.accessToken, term);
    if (songs === []) {
      this.setState({ didFound: false });
      return
    }
    this.setState({
      searchResults: songs,
      didFound: true
    })
  }

  addTrack(track) {
    if (!this.state.playlistTracks.find(playlistTrack => playlistTrack.id === track.id)) {
      this.state.playlistTracks.push(track);
      this.setState({
        playlistTracks: this.state.playlistTracks
      })
    }
    const trackIndex = this.state.searchResults.findIndex(currentTrack => currentTrack.id === track.id);
    this.toggleHasBeenAdded(this.state.searchResults[trackIndex]);
  }

  removeTrack(track) {
    this.state.playlistTracks.forEach((currentTrack, index) => {
      if (currentTrack.id === track.id) {
        this.state.playlistTracks.splice(index, 1);
        this.setState({
          playlistTracks: this.state.playlistTracks
        })
      }
    });
    const trackIndex = this.state.searchResults.findIndex(currentTrack => currentTrack.id === track.id);
    this.toggleHasBeenAdded(this.state.searchResults[trackIndex]);
  }

  toggleHasBeenAdded(track) {
    track.hasBeenAdded = !track.hasBeenAdded;
  }

  resetTracks() {
    this.state.playlistTracks.forEach(track => {
      track.hasBeenAdded = false
    });
    this.setState({ playlistTracks: [] })
  }

  openSavePlaylistPopup() {
    this.setState({
      savePlaylistPopup: 'open'
    })
  }
  closeSavePlaylistPopup() {
    this.setState({
      savePlaylistPopup: 'closed'
    })
  }

  async savePlaylist(playlistName) {
    const trackUris = this.state.playlistTracks.map(track => {
      return track.uri
    });
    try {
      await savePlaylist(this.state.accessToken, this.state.userInfo.id, playlistName, trackUris);
      this.resetTracks();
      this.closeSavePlaylistPopup();
    } catch (error) {
      alert(error.message);
    }
  }

  render() {
    return (
      <div className='container'>
          <header>
            <NavBar userIsLogged={this.state.userIsLogged} logOutUser={this.logOut}
              userInfo={this.state.userIsLogged ? this.state.userInfo : {}}
            />
          </header>
          <main className={this.state.savePlaylistPopup === 'open' ? 'popup-open' : ''} onClick={ this.state.savePlaylistPopup === 'open' ? this.closeSavePlaylistPopup : ()=>{}}>
            <SearchBar isSubmitted={this.state.transitionActivated} activateTransition={this.activateTransition}
              onSearch={this.search} 
            />
            <SearchResults isSubmitted={this.state.transitionActivated} didFound={this.state.didFound}
              tracks={this.state.searchResults} playlistTracks={this.state.playlistTracks} 
              onAdd={this.addTrack} onRemove={this.removeTrack} onSavePlaylist={this.openSavePlaylistPopup}
            />
          </main> 
          { this.state.savePlaylistPopup === 'open' && <SavePopup savePlaylist={this.savePlaylist}/> }
      </div>
    )
  }
}

export default App;
