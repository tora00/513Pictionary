import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Header from "./Header";
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import {getCategories,joinRoom, createRoom, getRoomInfo, getAllExistingRooms} from '../api';
import { withRouter } from 'react-router-dom';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import SearchIcon from '@material-ui/icons/Search'
import InputBase from '@material-ui/core/InputBase';
import {bindActionCreators} from "redux";
import {addRoomInfo, setRoomHost} from "../actions/dashBoardAction";
import {connect} from "react-redux";

import compose from 'recompose/compose';




const styles = theme =>({
    button: {
        width: 100, height: 100,
        padding: 0
    },
    icon: {

    },
    leftIcon: {
        marginRight: 20,
        fontSize:50,
        color:'#fffff'
    },

    textField: {
        marginLeft: 2,
        marginRight: 2,
    },
    dense: {
        marginTop: 50,
    },
    menu: {
        width: 200,
    },

    table: {
        minWidth: 600,
        marginTop: 200
    },
    row: {
        '&:nth-of-type(odd)': {
            backgroundColor: '#009',
        },
    }

});

const CustomTableCell = withStyles(theme => ({
    head: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    body: {
        fontSize: 16,
    },
}))(TableCell);



const ListItem = ({ id, name, category, capacity, onClick }) => (

        <TableRow className={styles.row} key={id}>
            <CustomTableCell component="th" scope="row">
                {name}
            </CustomTableCell>
            <CustomTableCell align="right">{category}</CustomTableCell>
            <CustomTableCell align="right">{capacity}</CustomTableCell>
            <CustomTableCell align="right">
                <button  id={id} onClick={onClick}>
                    Join Room
                </button>
            </CustomTableCell>
        </TableRow>


);

const List = ({ items, onItemClick }) => (

            items.map((item, i) =>
                <ListItem id={item.id} name={item.roomName} category={item.roomCategory} capacity={item.capacity} onClick={onItemClick} />)

);



class Dashboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dialogOpen: false,
            categories: [''],
            roomList: [],
            roomObjMap: {},
            roomCategory: '',
            newRoomName: '',
            currentRoomId: '',
            existingRooms: {},
        };


    }

    componentDidMount() {
        getCategories(data => {
            if(data) {
                this.setState({categories: this.state.categories.concat(data)});
            }
        });

        getAllExistingRooms(data => {
            if(data) {

                console.log(data)
                this.setState({roomList: this.state.roomList.concat(data)});

                let map = {}

                for(var key in data){
                    map[(data[key].id)] = data[key];
                }
                this.setState({roomObjMap: map});

            }
        });

        console.log("INSIDE COMPONENT" + this.state.roomList)
    }

    handleCategorySelect =  event => {
        this.setState({
            roomCategory: event.target.value,
        });

    };

    handleRoomName =  event => {
        this.setState({
            newRoomName: event.target.value,
        });

    };


    handleClickOpen = () => {
        this.setState({ dialogOpen: true });
    };

    handleClose = () => {
        this.setState({ dialogOpen: false });
    };

    createNewRoom = () => {
        let roomList = this.state.roomList;
        if(this.state.newRoomName && this.state.roomCategory){
            createRoom({id: '', roomName: this.state.newRoomName,
                roomCategory: this.state.roomCategory});

            getRoomInfo({id: '', roomName: this.state.newRoomName,
                roomCategory: this.state.roomCategory}, info => {


                let newRoom = {id: info.id,
                    roomName: info.roomName,
                    roomCategory: info.roomCategory,
                    capacity: info.capacity};

                let nextState = roomList.concat(newRoom);

                let map = this.state.roomObjMap;
                map[info.id] = newRoom;

                this.setState({ roomList: nextState, roomObjMap : map});

                this.props.setRoomHost(true);

            })

            this.setState({ dialogOpen: false });
        }

    };


    handleJoinRoomClick = (e) => {


        let id = e.target.id;
        let room = this.state.roomObjMap[id];
        let roomList = this.state.roomList;

        joinRoom(room);


        getRoomInfo({id: '', roomName: this.state.newRoomName,
            roomCategory: this.state.roomCategory}, info => {


            let newRoom = {id: info.id,
                roomName: info.roomName,
                roomCategory: info.roomCategory,
                capacity: info.capacity};


            this.setState( state => {
                const list = state.roomList.map(item => {
                    if(item.id === info.id){
                        console.log("inside same id")
                        item.capacity = info.capacity;
                    }
                });
            });


            let map = this.state.roomObjMap;
            map[info.id] = newRoom;

            this.setState({ roomObjMap : map});

            this.props.addRoomInfo(newRoom);

        })



        let { history } = this.props;
        history.push({
            pathname: '/Game'
        });

    };



    render() {
        const { classes } = this.props;
        const { roomList} = this.state;

        console.log(roomList);
        return (
            <div>
                <Header/>
            <div>

                <div className={classes.search}>
                    <div className={classes.searchIcon}>
                        <SearchIcon />
                    </div>
                    <InputBase
                        placeholder="Search…"
                        classes={{
                            root: classes.inputRoot,
                            input: classes.inputInput,
                        }}
                    />
                </div>
                <Button variant="outlined" color="primary" onClick={this.handleClickOpen}>
                    Create New Game Room
                </Button>
            </div>
                <Dialog
                    open={this.state.dialogOpen}
                    onClose={this.handleClose}
                    aria-labelledby="form-dialog-title"
                >
                    <DialogTitle id="form-dialog-title">Create New Room</DialogTitle>
                    <DialogContent>
                        <form  autoComplete="off">
                        <TextField
                            value={this.state.newRoomName}
                            required
                            autoFocus
                            margin="dense"
                            id="roomName"
                            label="Enter a room name"
                            onChange={this.handleRoomName}
                            fullWidth
                        />
                            <TextField
                                id="filled-select-category"
                                select
                                required
                                label="Choose a game Category"
                                className={classes.textField}
                                value={this.state.roomCategory}
                                onChange={this.handleCategorySelect.bind(this)}
                                SelectProps={{
                                    MenuProps: {
                                        className: classes.menu,
                                    },
                                }}
                                margin="normal"
                                fullWidth
                                variant="outlined"
                            >
                                {this.state.categories.map((option, index) => (
                                    <MenuItem key={index} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}

                            </TextField>
                        </form>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleClose} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={this.createNewRoom} color="primary">
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>
                <div>
                    <Table className={classes.table}>
                        <TableHead>
                            <TableRow>
                                <CustomTableCell>Room Name</CustomTableCell>
                                <CustomTableCell align="right">Game Category</CustomTableCell>
                                <CustomTableCell align="right">Capacity</CustomTableCell>
                                <CustomTableCell align="right"></CustomTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <List items={roomList} onItemClick={this.handleJoinRoomClick} />
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }
}



const mapStateToProps = (state) => {
    return {currentRoomId: state.currentRoomId,
    currentRoomName: state.currentRoomName,
     isCurrentRoomHost: state.isCurrentRoomHost,
    currentRoomCategory: state.currentRoomCategory}
};

const matchDispatchToProps = (dispatch) => {
    return bindActionCreators({
        addRoomInfo: addRoomInfo,
        setRoomHost: setRoomHost,
    }, dispatch);
};

Dashboard.propTypes = {
    classes: PropTypes.object.isRequired,
};


export default compose(
    withStyles(styles),
    connect(mapStateToProps, matchDispatchToProps)
)(withRouter(Dashboard))