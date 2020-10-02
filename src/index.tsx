import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import {motion} from "framer-motion";

ReactDOM.render(
  <React.StrictMode>
    <motion.div 
      initial={{opacity: 0, y: "2.5%"}}
      animate={{opacity: 1, y: "0%"}}
      transition={{ duration: 0.5 }}>
    < App />
    </motion.div>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
