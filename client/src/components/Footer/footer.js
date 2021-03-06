import React, {Component} from 'react';
import {NavLink} from 'react-router-dom';

import './footer.css'
import PropTypes from "prop-types";
import {connect} from "react-redux";
import {logoutUser} from "../../store/actions/authActions";

class Footer extends Component {
  onLogoutClick = () => {
    this.props.logoutUser();
    window.location.href = '/';
  };

  render() {
    switch (this.props.auth.isAuthenticated) {
      default:
      case false:
        return (
          <div id="footer" className="centered">
            <div style={{gridTemplateColumns: '1fr 1fr 1fr'}}>
              <div>
                <h4>Soulmatch</h4>
                <NavLink to="/"><p>Accueil</p></NavLink>
              </div>
              <div>
                <h4>L'équipe</h4>
                <a href="https://fkle.in/"><p>Florent Klein</p></a>
                <a href="https://profile.intra.42.fr/users/tboissel"><p>Tanguy Boissel</p></a>
              </div>
              <div>
                <h4>À propos</h4>
                <p>© 2019 Soulmatch</p>
              </div>
            </div>
          </div>
        );
      case true:
        return (
          <div id="footer" className="centered">
            <div>
              <div>
                <h4>Soulmatch</h4>
                <NavLink to="/soulmatcher"><p>Soulmatcher</p></NavLink>
                <NavLink to="/search"><p>Recherche</p></NavLink>
              </div>
              <div>
                <h4>Mon compte</h4>
                <NavLink to="/account/profile"><p>Mon profil</p></NavLink>
                <NavLink to="/account/settings"><p>Mes préférences</p></NavLink>
                <NavLink to=""><p onClick={this.onLogoutClick}>Déconnexion</p></NavLink>
              </div>
              <div>
                <h4>L'équipe</h4>
                <a href="https://fkle.in/"><p>Florent Klein</p></a>
                <a href="https://profile.intra.42.fr/users/tboissel"><p>Tanguy Boissel</p></a>
              </div>
              <div>
                <h4>À propos</h4>
                <p>© 2019 Soulmatch</p>
              </div>
            </div>
          </div>
        );
    }
  }
}

Footer.propTypes = {
  logoutUser: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps, {logoutUser})(Footer);