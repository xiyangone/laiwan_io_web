import React from 'react';
import {
    HashRouter as Router,
    Route,
    Redirect,
    Switch,
} from 'react-router-dom';
import H5Tutorial from './page/h5-tutorial/controller/H5Tutorial';
import HomeScreen from './page/home/controller/HomeScreen';
import Glossary from './page/glossary/controller/glossary';
import Definition from './page/glossary/controller/definition';
import Tutorial from './Tutorial';

const App = () => (
    <Router>
        <Switch>
            <Route path="/" component={HomeScreen} exact />
            <Route path="/h5-tutorial/:url" component={H5Tutorial} />
            <Route path="/tutorial" component={Tutorial} />
            <Route path="/glossary" component={Glossary} exact />
            <Route path="/glossary/:locale/:term" component={Definition} exact />
            <Redirect to="/" />
        </Switch>
    </Router>
);

export default App;
