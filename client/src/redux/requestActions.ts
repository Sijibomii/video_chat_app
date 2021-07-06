import randomString from 'random-string';
import * as stateActions from './stateActions';
//read up
// This returns a redux-thunk action (a function).
interface notify{
  type?: string
  text: string
  title?: string
  timeout?: number
}
export const notify = (notify:notify): 
(dispatch: (arg0: { type: string; payload: { notification: any; } | { notificationId: any; }; }) => void) => void =>{
  let { type = 'info', text, title, timeout }=notify;
	if (!timeout)
	{
		switch (type)
		{
			case 'info':
				timeout = 3000;
				break;
			case 'error':
				timeout = 5000; 
				break;
		}
	}

	const notification =
	{
		id : randomString({ length: 6 }).toLowerCase(),
		type,
		title,
		text,
		timeout
	};

	return (dispatch: (arg0: { type: string; payload: { notification: any; } | { notificationId: any; }; }) => void) =>
	{
		dispatch(stateActions.addNotification(notification));

		setTimeout(() =>
		{
			dispatch(stateActions.removeNotification(notification.id));
		}, timeout);
	};
};
