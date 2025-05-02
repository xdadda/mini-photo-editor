"use strict";
import { render } from 'mini'
import {App} from './app.js'
import './main.css'

await render( document.getElementById('root'), App ) //CSR
