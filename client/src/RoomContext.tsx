import React from 'react';

const RoomContext = React.createContext({});//what does this do??//what parameter should it take?

export default RoomContext;

export function withRoomContext(Component:any){
	return (props: any) => ( 
		<RoomContext.Consumer>
			{(roomClient) => <Component {...props} roomClient={roomClient} />}
		</RoomContext.Consumer>
	);
}
