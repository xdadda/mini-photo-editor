import { render } from '@xdadda/mini'
import {Editor} from './app.js'
import './main.css'

await render( document.getElementById('root'), Editor, true ) //CSR
