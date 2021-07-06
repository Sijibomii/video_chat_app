import React, { ReactElement } from "react";
import { withRoomContext } from '../RoomContext'
import { connect, MapDispatchToPropsParam } from 'react-redux';
import * as requestActions from '../redux/requestActions';
interface RoomProps {
  // roomId: String
	// peerId: String
	// displayName: String
	// device
	// handlerName : handler
	// useSimulcast
	// useSharingSimulcast
	// forceTcp
	// produce
	// consume
	// forceH264
	// forceVP9
	// svc
	// datachannel
	// externalVideo
	// e2eKey
  roomClient:{

  }
}
type Room= ReactElement<any, any> | null
const Room: React.FC<RoomProps> = ({roomClient}): Room  => {
return(
    <>
    </>
)
}
const mapStateToProps = (state:any) =>
{
	return {
		room            : state.room,
		me              : state.me,
		amActiveSpeaker : state.me.id === state.room.activeSpeakerId
	};
};

const mapDispatchToProps = (dispatch:any //for now
  //:MapDispatchToPropsParam<{ onRoomLinkCopy: () => void; }, {}>
   ) =>{
	return {
		onRoomLinkCopy : () =>{
			dispatch(requestActions.notify({
					text : 'Room link copied to the clipboard'
				}));
		}
	};
};

const RoomContainer = withRoomContext(connect(mapStateToProps,mapDispatchToProps)(Room));

export default RoomContainer;