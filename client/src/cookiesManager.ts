import jsCookie from 'js-cookie';

const USER_COOKIE = 'mediasoup-demo.user';
const DEVICES_COOKIE = 'mediasoup-demo.devices';

interface setUser{
  displayName: String
}
interface setDevices{
  webcamEnabled: boolean
}
export function getUser()
{
	return jsCookie.getJSON(USER_COOKIE);
}

export function setUser(setUser:setUser){
  const {displayName} = setUser;
	jsCookie.set(USER_COOKIE, { displayName });
}

export function getDevices()
{
	return jsCookie.getJSON(DEVICES_COOKIE);
}

export function setDevices(setDevices: setDevices){
  const { webcamEnabled } = setDevices;
	jsCookie.set(DEVICES_COOKIE, { webcamEnabled });
}
