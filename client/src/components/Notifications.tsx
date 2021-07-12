import React, { ReactElement } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PropTypes from 'prop-types';
// import * as appPropTypes from './appPropTypes';
import * as stateActions from '../redux/stateActions';
import { Appear } from './transitions';
interface notProps {
  notifications:[any]//put notification type here
  onClick:any
}
const Notifications: React.FC<notProps>  = ({ notifications, onClick }):ReactElement<any, any> | null =>{
	return (
		<div data-component='Notifications'>
			{
				notifications.map((notification) =>{
					return (
						<Appear key={notification.id} duration={250}>
							<div
								className={classnames('notification', notification.type)}
								onClick={() => onClick(notification.id)}
							>
								<div className='icon' />

								<div className='body'>
									{/* <If condition={notification.title}>
										<p className='title'>{notification.title}</p>
									</If> */}
                  { notification.title ? (
                    	<p className='title'>{notification.title}</p>
                  ):(
                    <>
                    </>
                  )}

									<p className='text'>{notification.text}</p>
								</div>
							</div>
						</Appear>
					);
				})
			}
		</div>
	);
};


const mapStateToProps = (state:any) =>{
	const { notifications } = state;

	return { notifications };
};

const mapDispatchToProps = (dispatch:any) =>{
	return {
		onClick : (notificationId:any) =>
		{
			dispatch(stateActions.removeNotification(notificationId));
		}
	};
};

const NotificationsContainer = connect(mapStateToProps,mapDispatchToProps)(Notifications);

export default NotificationsContainer;
