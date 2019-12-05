const API = 'https://acme-users-api-rev.herokuapp.com/api';

//simulation of logged in user
const fetchUser = async () => {
    const storage = window.localStorage;
    const userId = storage.getItem('userId');
    if (userId) {
        try {
            return (await axios.get(`${API}/users/detail/${userId}`)).data;
        }
        catch (ex) {
            storage.removeItem('userId');
            return fetchUser();
        }
    }
    const user = (await axios.get(`${API}/users/random`)).data;
    storage.setItem('userId', user.id);
    return user;
};

import React from 'react';
import ReactDOM from 'react-dom';
import thunks from 'redux-thunk';
import { HashRouter, Link, Route } from 'react-router-dom';
import { Provider, connect } from 'react-redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';

import axios from 'axios';

//constants
const SET_AUTH = 'SET_AUTH';
const SET_NOTES = 'SET_NOTES';
const NEW_NOTE = 'NEW_NOTE';
const SUBMIT_NEW_NOTE = "SUBMIT_NEW_NOTE"

//action creators
const setAuth = (auth) => ({ type: SET_AUTH, auth });
const setNotes = (notes) => ({ type: SET_NOTES, notes });
const newNote = (noteInput) => ({ type: NEW_NOTE, noteInput });
const submitNewNote = (note) => ({ type: SUBMIT_NEW_NOTE, note });

//thunks
const getAuth = () => {
    return async (dispatch) => {
        const auth = await fetchUser();
        await dispatch(setAuth(auth));
        return dispatch(getNotes());
    };
};

const getNotes = () => {
    return async (dispatch, getState) => {
        const notes = (await axios.get(`${API}/users/${getState().auth.id}/notes`)).data;
        return dispatch(setNotes(notes));
    };
};

const postNote = () => {
    return async (dispatch, getState) => {
        const newNote = getState().noteInput;
        console.log(getState())
        await axios.post(`${API}/users/${getState().auth.id}/notes`, {
            text: newNote,
        })
        const updateNotes = (await axios.get(`${API}/users/${getState().auth.id}/notes`)).data;
        return dispatch(setNotes(updateNotes));
    }
}

//store
const store = createStore(
    combineReducers({
        auth: (state = {}, action) => {
            if (action.type === SET_AUTH) {
                return action.auth;
            }
            return state;
        },
        notes: (state = [], action) => {
            if (action.type === SET_NOTES) {
                return action.notes;
            }
            return state;
        },
        noteInput: (state = '', action) => {
            if (action.type === NEW_NOTE) {
                return action.noteInput;
            }
            return state;
        },
        submitInput: (state = [], action) => {
            if (action.type === SUBMIT_NEW_NOTE) {
                return action.note
            }
            return state;
        }


    }), applyMiddleware(thunks)
);


const { render } = ReactDOM;
const { Component } = React;

const _Nav = ({ auth, notes }) => {
    console.log(notes)
    return (
        <div>
            <nav>
                <Link to='/notes'>Notes ({notes.length})</Link>
                <Link to='/create'>Create</Link>
            </nav>
            <h1>Welcome {auth.fullName}</h1>
        </div>
    );
};

const Nav = connect(
    ({ auth, notes }) => {
        return {
            auth,
            notes
        };
    }
)(_Nav);

const _Notes = ({ notes }) => {
    return (
        <ul>
            {notes.map(note =>
                <li key={note.id}>{note.text}</li>
            )}
        </ul>
    )
}

const Notes = connect(
    ({ notes }) => {
        return {
            notes
        };
    }
)(_Notes)

const _Input = (props) => {
    return (
        <form>
            <input placeholder="new note"
                onChange={event => {
                    store.dispatch(newNote(event.target.value))
                    console.log(store.getState())
                }}>
            </input>
            <button onClick={() => props.update()}>submit</button>
        </form>
    )
}

const Input = connect((reduxstore) => {
    return {
        notes: reduxstore.notes
    };
}, (dispatch) => {
    return {
        update: () => {
            dispatch(postNote())
        }
    }
}

)(_Input)

class _App extends Component {
    componentDidMount() {
        this.props.fetchUser()
    }
    render() {
        return (
            <HashRouter>
                <Route component={Nav} />
                <Route component={Notes} />
                <Route path='/create' component={Input} />
            </HashRouter>
        );
    }
}

const App = connect(({ auth }) => {
    return {
        auth
    };
}, (dispatch) => {
    return {
        fetchUser: () => dispatch(getAuth())
    };
})(_App);

const root = document.querySelector('#root');
render(<Provider store={store}><App /></Provider>, root);
