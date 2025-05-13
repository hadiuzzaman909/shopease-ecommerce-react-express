import React, { useEffect } from 'react';
import Store from '../redux/store';
import { loadUser } from '../redux/actions/user';

const Home = () => {
        useEffect(()=>{
      Store.dispatch(loadUser());
    },[]);
    return (
        <div>
            <h2>This is home</h2>
        </div>
    );
};

export default Home;