import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import classnames from 'classnames';
import axios from 'axios';

import {fetchProfile} from "../../store/actions/profileActions";
import {likeUser} from "../../store/actions/profileActions";

import Loading from '../Loading';
import Error from '../Error';
import ProfileMap from './ProfileMap';
import BigPicture from './BigPicture';
import VeryBadWindow from './VeryBadWindow';

import './profile.css';

//TODO: debug problem big picture once you got out of big picture and back in

class Profile extends Component {
  state = {
    images: [],
    current: 0,
    vbwStep: '',
    bigPicture: false
  };

  componentDidMount() {
    document.title = 'Profil';
    this.props.fetchProfile(this.props.match.params.username);
  }

  getGender = (gender) => {
    switch (gender) {
      case 'male':
        return 'Homme';
      case 'female':
        return 'Femme';
      default:
        return 'Non binaire';
    }
  };

  getSexuality = (sexuality) => {
    switch (sexuality) {
      case 'heterosexual':
        return 'Hétéro';
      case 'homosexual':
        return 'Homo';
      default:
        return 'Bi';
    }
  };

  getPopularity = (popularity) => {
    if (!popularity) {
      return (<div className="popularity p1">Nouveau
        <div>- {0}</div>
      </div>);
    }
    switch (popularity.rank) {
      case 1:
        return (<div className="popularity p1">Nouveau
          <div>- {popularity.score}</div>
        </div>);
      case 2:
        return (<div className="popularity p2">Connu
          <div>- {popularity.score}</div>
        </div>);
      case 3:
        return (<div className="popularity p3">Populaire
          <div>- {popularity.score}</div>
        </div>);
      case 4:
        return (<div className="popularity p4">Célèbre
          <div>- {popularity.score}</div>
        </div>);
      default:
        return (<div className="popularity p1">Nouveau
          <div>- {popularity.score}</div>
        </div>);
    }
  };

  likeThisUser = () => {
    this.props.likeUser(this.props.profile.id);
  };

  getLikeStatus = (like) => {
    switch (like) {
      case 'both':
        return 'Vous vous aimez mutuellement';
      case 'no':
        return 'Faites le premier pas !';
      case 'me':
        return `Vous aimez déjà ${this.props.profile.firstName}`;
      case 'you':
        return `${this.props.profile.firstName} vous aime déjà`;
      default:
        return 'Faites le premier pas !';
    }
  };

  getLikeButton = (like) => {
    if (like === 'me' || like === 'both') {
      return 'NE PLUS AIMER';
    } else {
      return 'AIMER';
    }
  };

  whichPhoto = (elem) => {
    for (var i = 0; (elem = elem.previousSibling); i++) ;
    return i;
  };

  openPicture = (e) => {
    const current = this.whichPhoto(e.target);
    this.setState({
      images: this.props.profile.photos,
      current: current,
      bigPicture: true
    });
  };

  visitProfile = (id) => {
    axios.get(`/api/visit?visited=${id}`);
  };

  openReport = () => {
    this.setState({
      vbwStep: 'report'
    });
  };

  openBlock = () => {
    this.setState({
      vbwStep: 'block'
    });
  };

  closeVBW = () => {
    this.setState({
      vbwStep: ''
    });
  };

  closeBigPicture = () => {
    this.setState({
      bigPicture: false
    });
  };

  render() {
    if (this.props.error)
      return (<Error errTitle="Profil inexistant."
                     errText="la page de profil à laquelle vous tentez d'accéder ne semble pas exister."/>);
    if (!this.props.profile || !this.props.profile.rgb)
      return (<Loading/>);
    if (this.props.profile.amBlocked)
      return (<Error errTitle="Vous êtes bloqué."
                     errText="cet utilisateur vous a bloqué. Merci de votre compréhension."/>);
    const profile = this.props.profile;
    document.title = profile.firstName + ' ' + profile.lastName;
    this.visitProfile(profile.id);
    const gender = this.getGender(profile.gender);
    const sexuality = this.getSexuality(profile.sexuality);
    const popularity = this.getPopularity(profile.popularity);
    const likeStatus = this.getLikeStatus(profile.like);
    const likeButton = this.getLikeButton(profile.like);
      const {r, g, b} = profile.rgb;
    const bgPhoto = {backgroundImage: `url('${profile.profile_pic}')`};
    const bgColor = {backgroundColor: `rgb(${r}, ${g}, ${b})`};

    return (
      <React.Fragment>
        <BigPicture images={this.state.images} current={this.state.current} shown={this.state.bigPicture} closeBigPicture={this.closeBigPicture}/>
        <div className="profile__top">
          <div className="profile__top-img" style={bgPhoto}/>
        </div>
        <div className="centered">
          <div className="profile__main">
            <div className="profile__side-panel" style={bgColor}>
              <div className="profile__sp-img" style={bgPhoto}>
                <div className="profile__sp-gradient"
                     style={{background: `linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0), rgb(${r}, ${g}, ${b}))`}}/>
              </div>
              <div className="profile__sp-content">
                <div>
                  <button onClick={this.likeThisUser}>{likeButton}</button>
                </div>
                <div>
                  <h1>{`${profile.firstName} ${profile.lastName}`}</h1>
                </div>
                <div>
                  <p>{profile.username}</p>
                </div>
                <div className="profile__sp-infos">
                  <div>
                    <div>GENRE</div>
                    <div>{gender}</div>
                  </div>
                  <div>
                    <div>ÂGE</div>
                    <div>{profile.age ? profile.age : '?'}</div>
                  </div>
                  <div>
                    <div>SEXUALITÉ</div>
                    <div>{sexuality}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="profile__right-panel">
              <div className="profile__middle-panel">
                <div className={classnames('like', {
                  'no': profile.like === 'no',
                  'both': profile.like === 'both',
                  'you': profile.like === 'you',
                  'me': profile.like === 'me'
                })}>{likeStatus}</div>
                <div className={classnames('', {
                  'connected': profile.connection.status === 'online',
                  'disconnected': profile.connection.status === 'offline'
                })}>{profile.connection.message}</div>
                {popularity}
              </div>
              <div className="profile__center-panel">
                <div className="profile__cp-title">
                  <h4>BIO</h4>
                </div>
                <div className="profile__cp-content bio">
                  <p>{profile.bio ? profile.bio : `${profile.firstName} n'a pas écrit de bio.`}</p>
                </div>
                <div className="profile__cp-title">
                  <h4>INTÉRÊTS</h4>
                </div>
                <div className="profile__cp-content tags">
                  {profile.interests.map((interest, i) => (
                    <div key={i} style={bgColor}>{interest.tag}</div>
                  ))}
                </div>
                <div className="profile__cp-title">
                  <h4>PHOTOS</h4>
                </div>
                <div className="profile__cp-content photos">
                  {profile.photos.map((photo, i) => (
                    <div key={i} style={{backgroundImage: `url('${photo.url}')`}}
                         title="Cliquer pour agrandir" onClick={this.openPicture}/>
                  ))}
                  {!profile.photos.length &&
                  <div className="no-photo" style={bgColor} title="Cet utilisateur n'a pas publié de photos."/>}
                </div>
                <div className="profile__cp-title">
                  <h4>POSITION</h4>
                </div>
                <div className="profile__cp-content map">
                  <ProfileMap
                    position={{lat: profile.latitude, lng: profile.longitude}}
                    gender={profile.gender}/>
                </div>
                <div className="profile__cp-buttons">
                  <button className="report" title="Signaler cet utilisateur" onClick={this.openReport}/>
                  <button className="block" title="Bloquer cet utilisateur" onClick={this.openBlock}/>
                  <VeryBadWindow step={this.state.vbwStep} closeParent={this.closeVBW} userId={profile.id} isBlocked={profile.isBlocked}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

Profile.propTypes = {
  fetchProfile: PropTypes.func.isRequired,
  likeUser: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  profile: state.profile.user,
  error: state.errors.profile,
});

export default connect(mapStateToProps, {fetchProfile, likeUser})(Profile);