import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import {LoginPage, SignUpPage} from './routes/Routes';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<LoginPage/>}/>
        <Route path='/signUp' element={<SignUpPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
