import React, {Component} from 'react';
import {connect} from 'react-redux';
import classnames from "classnames";
import {NavLink} from 'react-router-dom';
import io from "socket.io-client";

import {getNotifs, newNotif} from '../../store/actions/notificationActions';

import noNotif from '../../assets/img/notif-none.svg';

const socket = io('http://localhost:5000');

class NotificationsPanel extends Component {
  state = {
    list: [],
    filter: 'all'
  };

  componentDidMount() {
    this.props.getNotifs();
    socket.emit('room', `r${this.props.userId}`);
    socket.on('new notif', (data) => {
      this.props.newNotif(data);
      this.props.getNotifs();
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.list && nextProps.list !== this.props.list && Array.isArray(nextProps.list)) {
      this.setState({
        list: nextProps.list
      });
    }
    if (nextProps.filterBy && nextProps.filterBy !== this.props.filterBy) {
      this.setState({
        filter: nextProps.filterBy
      });
    }
  }

  getTitle = (type) => {
    switch (type) {
      case 'visit':
        return 'Admirateur ou admiratrice ?';
      case 'like':
        return 'Super nouvelle !';
      case 'unlike':
        return 'Ça nous brise le cœur...';
      case 'match':
        return 'C\'est un match !';
      case 'message':
        return 'Tu as un message !';
      default:
        return 'Bonjour !';
    }
  };

  filterBy = (arr) => {
    if (this.state.filter === 'all') {
      return (arr);
    } else {
      return (arr.filter(elem => elem.type === this.state.filter));
    }
  };

  render() {
    const {list} = this.state;

    return (
      <div className="items">
        <div className="item no-notif">
          <img src={noNotif} alt="no notifs"/>
          <span>Pas de notifications.</span>
        </div>
        {list && this.filterBy(list).map((notif) => (
          <NavLink key={notif.id} className={classnames('item', {
            'new': !notif.read
          })} to={`/profile/${notif.notifier_name}`}>
            <div className="item__img"/>
            <div className="item__txt">
              <h4>{this.getTitle(notif.type)}</h4>
              <p>{notif.content}</p>
            </div>
          </NavLink>
        ))}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  list: state.notifications.list,
  userId: state.auth.user.id
});

export default connect(mapStateToProps, {getNotifs, newNotif})(NotificationsPanel);