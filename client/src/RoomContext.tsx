import React from 'react';

const RoomContext = React.createContext({});

export default RoomContext;

export function withRoomContext(Component:any){
	return (props: any) => ( 
		<RoomContext.Consumer>
			{(roomClient) => <Component {...props} roomClient={roomClient} />}
		</RoomContext.Consumer>
	);
}
