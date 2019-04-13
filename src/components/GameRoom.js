import React from 'react';
import Header from './Header';
import SketchComponent from '../components/SketchComponent';
import TimerProgressBar from './TimerProgressBar';
import Chat from './Chat';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {changeGameState} from '../actions/userAction.js';
import {removeCurrentRoom} from '../actions/dashBoardAction';
import { withRouter } from 'react-router-dom';

import {game_myReady, leaveRoom, getNewUserJoin, getUserList, socket, rcvAnswer} from '../api';
import compose from 'recompose/compose';


 class GameRoom extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            setUpFlg: false,
            curDrawer: '',
            isDrawer: false,
            gameProgress: 'notReady', //ready, start
            userList: [],
            curAnswer: ''
        };

        this.gameReady = this.gameReady.bind(this);
    }

    componentDidMount() {
        socket.on('entireUserList', userList => {
            console.log("entireUserList", userList);
            this.setState({userList: userList, curAnswer:''});

            if(!this.state.setUpFlg){
                console.log("if drawer? "+this.props.username + userList[0].username);
                this.setState({setUpFlg: true});
                if(userList[0].username === this.props.username){
                    // set myself to drawer
                    console.log(this.props.username + ' is the drawer');
                    this.setState({curDrawer: this.props.username});
                }else{
                    this.setState({curDrawer: userList[0].username});
                    console.log(this.state.curDrawer + ' is the drawer');
                }
            }
        });

        socket.on('newReadyPlayer', username => {
            let tmp = this.state.userList;
            tmp.forEach(function(ele){
                if(ele.username === username)ele.isReady = true;
            });
            this.setState({userList: tmp});
            console.log(username + ' is ready');

            //check for all the uesrs ready status in the uesrlist
            if(this.allUsersReady()){
                this.setState({gameProgress: 'start'});
                this.props.changeGameState('start');
                // start the timer
                this.gameStart();
            }
        });
    }

    setAnswer(){
        socket.emit('pick-answer',this.props.currentRoomCategory,this.props.currentRoomId);
    }

    gameStart() {
        console.log("Answer: "+this.state.curAnswer);
        socket.emit('gameIsStarted', this.props.currentRoomId);
        this.triggerTimer();
        if(this.props.username === this.state.curDrawer){
            this.setAnswer();   //set current drawer's answer on start
            socket.on('receive-answer', answer =>{
                this.state.currentAnswer = answer;
            })
            console.log('enable pad!');
            this.setState({isDrawer: true});
        }
    }

     nextDrawer() {
        console.log('calc nextDrawer');
        for(let i=0; i<this.state.userList.length; i++){
            console.log(i+': '+this.state.userList[i].username);
            if(this.state.curDrawer === this.state.userList[i].username){
                this.setState({curDrawer: this.state.userList[i+1].username});
                if(this.state.curDrawer === this.props.username){
                    this.setState({isDrawer: true});
                }else  this.setState({isDrawer: false});

                break;
            }
        }

        console.log('next drawer is ' + this.state.curDrawer);
     }

    restartRound = () => {
        // TODO: check it game ends
        console.log('restartRound entry!');
        console.log('curdrawer: ',this.state.curDrawer);
        console.log('userList: ', this.state.userList);
        console.log('last user in the user list:', this.state.userList[this.state.userList.length-1]);
        if(this.state.curDrawer === this.state.userList[this.state.userList.length-1].username){
            console.log('game ends');
            // end game
            socket.emit('gameIsEnded', this.props.currentRoomId);
            this.setState({setUpFlg: false});
            this.setState({gameProgress: 'notReady'});
            this.clearReadyState();
            // set myself to drawer
            console.log(this.state.userList[0].username + ' is the drawer of next game');
            this.setState({curDrawer: this.state.userList[0].username});
            this.setState({isDrawer: false});
        }else{
            this.nextDrawer();
            this.triggerTimer();
            // this.setAnswer();
        }
    };

    clearReadyState() {
         let tmp = this.state.userList;
         tmp.forEach(function(ele){
             ele.isReady = false;
         });
         this.setState({userList: tmp});
     }

    setUserToReady(username){
        let tmp = this.state.userList;
        tmp.forEach(function(ele){
            if(ele.username === username)ele.isReady = true;
        });
        this.setState({userList: tmp});
    }

    gameReady() {
        this.setUserToReady(this.props.username);
        socket.emit('imReady', {username: this.props.username, roomId: this.props.currentRoomId});

        //check for all the uesrs ready status in the uesrlist
        if(this.allUsersReady()){
            this.setState({gameProgress: 'start'});
            this.props.changeGameState('start');
            // start the timer
            this.gameStart();
        }else {
            this.setState({gameProgress: 'ready'});
            this.props
                .changeGameState('ready');
        }

    }

    allUsersReady() {
        if(this.state.userList.length > 1){    //at least two
            let flag = true;
            this.state.userList.forEach(function(ele){
                if(!ele.isReady){
                    flag = false;
                }
            });
            return flag;
        }
        return false;
    }

    leaveRoom = () => {
        leaveRoom({id: this.props.currentRoomId});
        this.props.removeCurrentRoom ();

        console.log('leaving game room' + this.props.currentRoomId);
        let { history } = this.props;
        history.push({
            pathname: '/Dashboard'
        });

    };

     // a little complicated to explain
     // check out this:  https://stackoverflow.com/a/45582558
     triggerTimer = () => {};

    render() {
        const {gameProgress} = this.state;
        return (
            <div>
                <Header home={'Room: ' + this.props.currentRoomName}
                        title={'Lets play words in category '+ this.props.currentRoomCategory.toUpperCase() + '!'}/>
                <TimerProgressBar restartTrigger={this.restartRound} setReadyTrigger={func => this.triggerTimer = func}/>
                {
                    this.state.isDrawer?
                    <div><p> You're drawing {this.state.currentAnswer}</p></div>: ''          
                }
            
                <SketchComponent drawFlg={this.state.isDrawer}/>
                {
                    gameProgress === 'notReady' ?
                        <div>
                            <button onClick={this.gameReady}>Ready</button>
                            <button onClick={this.leaveRoom}>LEAVE GAME ROOM</button>
                        </div> :
                        ''
                }
                <Chat/>
            </div>
        );
    }

}

const mapStateToProps = (state) => {
    return {
        gameState: state.gameState,
        currentRoomId: state.currentRoomId,
        currentRoomCategory: state.currentRoomCategory,
        currentRoomName: state.currentRoomName,
        username: state.username,
        PlayerList: state.PlayerList
    };
};

const matchDispatchToProps = (dispatch) => {
    return bindActionCreators({
        changeGameState: changeGameState,
        removeCurrentRoom: removeCurrentRoom,
    }, dispatch);
};

export default compose(
    connect(mapStateToProps, matchDispatchToProps)
)(withRouter(GameRoom));

