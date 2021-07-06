import { combineReducers } from 'redux';
import room from './room'
import consumers from './consumer';
import me from './me'
import producers from './producers'
import peers from './peers'
import notifications from './notifications'
import dataProducers from './dataProducers'
import dataConsumers from './dataConsumers';
//all reducers

 		
const reducers = combineReducers({
	room,
	consumers,
	me,
	producers,
	peers,
	notifications,
	dataProducers,
	dataConsumers
	});

export default reducers;
